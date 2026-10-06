import { Response } from "express";
import { prisma } from "../config/prisma";
import { recipientError, recipientSchema, pageSchema, idSchema } from "../domain/bridgepay";
import { AuthRequest } from "../middleware/auth";
export async function createRecipient(req: AuthRequest, res: Response) {
  const data = recipientSchema.parse(req.body);
  const issue = recipientError({ name: data.name, account: data.account, code: data.code }, data.currency);
  if (issue) return res.status(400).json({ error: issue });
  const recipient = await prisma.recipient.create({ data: { userId: req.user!.userId, name: data.name, currency: data.currency, bankName: data.bankName, accountNumber: data.account, bankCode: data.code } });
  return res.status(201).json({ recipient: { id: recipient.id, name: recipient.name, currency: recipient.currency, bankName: recipient.bankName, account: recipient.accountNumber, code: recipient.bankCode, save: true, createdAt: recipient.createdAt } });
}
export async function listRecipients(req: AuthRequest, res: Response) {
  const { cursor, limit } = pageSchema.parse(req.query);
  const rows = await prisma.recipient.findMany({ where: { userId: req.user!.userId, ...(cursor ? { id: { lt: cursor } } : {}) }, orderBy: { id: "desc" }, take: limit + 1 });
  const recipients = rows.slice(0, limit);
  return res.json({ nextCursor: rows.length > limit ? recipients.at(-1)!.id : null, recipients: recipients.map(r => ({ id: r.id, name: r.name, currency: r.currency, bankName: r.bankName, account: r.accountNumber, code: r.bankCode, save: true, createdAt: r.createdAt })) });
}
export async function deleteRecipient(req: AuthRequest, res: Response) {
  const result = await prisma.recipient.deleteMany({ where: { id: idSchema.parse(req.params.id), userId: req.user!.userId } });
  if (!result.count) return res.status(404).json({ error: "Recipient not found" });
  return res.status(204).send();
}
