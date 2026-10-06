import { Prisma, Quote } from "@prisma/client";
import { HttpError } from "../middleware/errors";
import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middleware/auth";
import { banks, calculate, confirmSchema, quoteSchema, recipientError, pageSchema, idSchema } from "../domain/bridgepay";

function quoteDto(q: Quote) {
  return { id: q.id, createdAt: q.createdAt.toISOString(), expiresAt: q.expiresAt.toISOString(), amount: Number(q.amount), from: q.fromCurrency, to: q.toCurrency, rate: Number(q.rate), platformFee: Number(q.platformFee), bankFee: Number(q.bankFee), promoDiscount: Number(q.promoDiscount), totalCost: Number(q.totalCost), receiveAmount: Number(q.receiveAmount), promo: q.promo, fromBank: q.fromBank, toBank: q.toBank, recipient: { name: q.recipientName, account: q.recipientAccount, code: q.recipientCode, save: false } };
}
function transferDto(t: Prisma.TransferGetPayload<{ include: { quote: true } }>) {
  const statuses: Record<string, string> = { PAYMENT_PENDING: "Processing", PAYMENT_RECEIVED: "Processing", COMPLIANCE_CHECK: "Processing", PROCESSING: "Processing", SENT: "Processing", COMPLETED: "Completed", FAILED: "Failed", CANCELLED: "Failed", REFUNDED: "Failed" };
  return { id: t.id, quote: quoteDto(t.quote), status: statuses[t.status] || "Processing", rawStatus: t.status, createdAt: t.createdAt.toISOString(), ...(t.completedAt ? { completedAt: t.completedAt.toISOString() } : {}) };
}
export async function getConfig(_req: AuthRequest, res: Response) {
  return res.json({ currencies: ["JPY", "USD", "EUR", "GBP", "INR"], sendingCurrencies: ["JPY", "USD", "EUR", "GBP"], banks, mode: "demo", ratesAreLive: false });
}
export async function createQuote(req: AuthRequest, res: Response) {
  const data = quoteSchema.parse(req.body);
  const fromBank = banks[data.from].find(b => b.name === data.fromBank);
  const toBank = banks[data.to].find(b => b.name === data.toBank);
  if (!fromBank || !toBank) return res.status(400).json({ error: "Select valid sending and receiving banks." });
  const issue = recipientError(data.recipient, data.to);
  if (issue) return res.status(400).json({ error: issue });
  const calc = calculate({ amount: data.amount, from: data.from, to: data.to, bankFee: fromBank.fee, promo: data.promo });
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const quote = await prisma.quote.create({ data: { userId: req.user!.userId, fromCurrency: data.from, toCurrency: data.to, amount: calc.amount, rate: calc.rate, platformFee: calc.platformFee, bankFee: calc.bankFee, promoDiscount: calc.promoDiscount, totalCost: calc.totalCost, receiveAmount: calc.receiveAmount, fromBank: data.fromBank, toBank: data.toBank, recipientName: data.recipient.name.trim(), recipientAccount: data.recipient.account, recipientCode: data.recipient.code.toUpperCase(), promo: data.promo, expiresAt } });
  return res.status(201).json({ quote: quoteDto(quote) });
}
export async function confirmTransfer(req: AuthRequest, res: Response) {
  const data = confirmSchema.parse(req.body);
  const userId = req.user!.userId;
  // Database uniqueness is the final guard; retry losers of a concurrent commit.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await prisma.$transaction(async tx => {
        const existing = await tx.transfer.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: data.idempotencyKey } }, include: { quote: true } });
        if (existing) {
          if (existing.quoteId !== data.quoteId || existing.saveRecipient !== data.saveRecipient) throw new HttpError(409, "Idempotency key was used for a different request");
          return { transfer: existing, idempotent: true };
        }
        const quote = await tx.quote.findFirst({ where: { id: data.quoteId, userId }, include: { transfer: true } });
        if (!quote) throw new HttpError(404, "Quote not found");
        if (quote.transfer) throw new HttpError(409, "This quote has already been confirmed");
        if (quote.expiresAt.getTime() <= Date.now()) throw new HttpError(400, "This quote has expired. Please refresh your quote.");
        let recipientId: string | undefined;
        if (data.saveRecipient) {
          const recipient = await tx.recipient.create({ data: { userId, name: quote.recipientName, currency: quote.toCurrency, bankName: quote.toBank, accountNumber: quote.recipientAccount, bankCode: quote.recipientCode } });
          recipientId = recipient.id;
        }
        const transfer = await tx.transfer.create({ data: { userId, quoteId: quote.id, recipientId, saveRecipient: data.saveRecipient, idempotencyKey: data.idempotencyKey, status: "PAYMENT_PENDING" }, include: { quote: true } });
        await tx.transferEvent.create({ data: { transferId: transfer.id, type: "CREATED", toStatus: "PAYMENT_PENDING", metadata: { source: "mobile-app", mode: "demo" } } });
        return { transfer, idempotent: false };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      return res.status(result.idempotent ? 200 : 201).json({ transfer: transferDto(result.transfer), idempotent: result.idempotent });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || !["P2002", "P2034"].includes(error.code)) throw error;
    }
  }
  throw new HttpError(503, "Confirmation is busy. Retry using the same idempotency key.");
}
export async function listTransfers(req: AuthRequest, res: Response) {
  const { cursor, limit } = pageSchema.parse(req.query);
  const rows = await prisma.transfer.findMany({ where: { userId: req.user!.userId, ...(cursor ? { id: { lt: cursor } } : {}) }, include: { quote: true }, orderBy: { id: "desc" }, take: limit + 1 });
  const transfers = rows.slice(0, limit);
  return res.json({ transfers: transfers.map(transferDto), nextCursor: rows.length > limit ? transfers.at(-1)!.id : null });
}
export async function getTransfer(req: AuthRequest, res: Response) {
  const transfer = await prisma.transfer.findFirst({ where: { id: idSchema.parse(req.params.id), userId: req.user!.userId }, include: { quote: true, events: { orderBy: { createdAt: "asc" } } } });
  if (!transfer) return res.status(404).json({ error: "Transfer not found" });
  return res.json({ transfer: { ...transferDto(transfer), events: transfer.events } });
}
