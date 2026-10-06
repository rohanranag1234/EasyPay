import { z } from "zod";

export const currencies = ["JPY", "USD", "EUR", "GBP", "INR"] as const;
export type Currency = typeof currencies[number];
export const sendingCurrencies: Currency[] = ["JPY", "USD", "EUR", "GBP"];
export const decimals: Record<Currency, number> = { JPY: 0, USD: 2, EUR: 2, GBP: 2, INR: 2 };
export const limits: Record<Currency, [number, number]> = {
  JPY: [1000, 1000000], USD: [10, 10000], EUR: [10, 10000], GBP: [10, 10000], INR: [1000, 500000]
};
// These are the prototype's sample values, not live FX rates.
const sampleValues: Record<Currency, number> = { JPY: 1, INR: 0.608, USD: 0.0067, EUR: 0.0061, GBP: 0.0052 };
export const banks: Record<Currency, { name: string; fee: number }[]> = {
  JPY: [{ name: "JP Bank", fee: 0 }, { name: "MUFG", fee: 220 }, { name: "Mizuho", fee: 220 }, { name: "SMBC", fee: 330 }],
  USD: [{ name: "Chase", fee: 0 }, { name: "Bank of America", fee: 3 }],
  EUR: [{ name: "Deutsche Bank", fee: 0 }, { name: "BNP Paribas", fee: 2 }],
  GBP: [{ name: "Barclays", fee: 0 }, { name: "HSBC", fee: 2 }],
  INR: [{ name: "HDFC Bank", fee: 0 }, { name: "SBI", fee: 0 }, { name: "ICICI Bank", fee: 0 }, { name: "Axis Bank", fee: 0 }]
};
export const bankKey = (currency: Currency, name: string) => `${currency}:${name}`;
export function rateFor(from: Currency, to: Currency) { return Number((sampleValues[to] / sampleValues[from]).toFixed(8)); }
export function amountError(raw: string | number, from: Currency, to: Currency): string {
  if (!currencies.includes(from) || !currencies.includes(to) || from === "INR" || from === to) return "Choose a supported pair of different currencies.";
  if (!/^\d+(\.\d+)?$/.test(String(raw))) return "Enter a valid amount.";
  const amount = Number(raw); const [min, max] = limits[from];
  if (!Number.isFinite(amount) || amount < min || amount > max) return `Enter between ${min} and ${max} ${from}.`;
  if ((String(raw).split(".")[1]?.length || 0) > decimals[from]) return `${from} allows ${decimals[from]} decimal places.`;
  return "";
}
export function recipientError(recipient: { name: string; account: string; code: string }, to: Currency): string {
  if (recipient.name.trim().length < 2) return "Enter the account holder's full name.";
  if (!/^\d{6,18}$/.test(recipient.account)) return "Enter an account number with 6–18 digits.";
  if (to === "INR" && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(recipient.code)) return "Enter a valid IFSC, such as HDFC0001234.";
  if (to !== "INR" && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(recipient.code)) return "Enter an 8 or 11 character SWIFT code.";
  return "";
}
function roundedDivide(n: bigint, d: bigint) { return (n + d / 2n) / d; }
export function calculate(input: { amount: string | number; from: Currency; to: Currency; bankFee?: number; promo?: boolean }) {
  const { amount, from, to, bankFee = 0, promo = false } = input;
  const issue = amountError(amount, from, to); if (issue) throw new Error(issue);
  if (!Number.isFinite(bankFee) || bankFee < 0) throw new Error("Invalid bank fee.");
  const rate = rateFor(from, to), scale = 10 ** decimals[from], receiveScale = 10 ** decimals[to];
  const principal = BigInt(Math.round(Number(amount) * scale));
  const fee = roundedDivide(principal * 4n, 1000n);
  const discount = promo ? roundedDivide(fee * 5n, 100n) : 0n;
  const bank = BigInt(Math.round(bankFee * scale));
  const rateUnits = BigInt(Math.round(rate * 100000000));
  const received = roundedDivide(principal * rateUnits * BigInt(receiveScale), BigInt(scale) * 100000000n);
  return {
    amount: Number(principal) / scale, from, to, rate,
    platformFee: Number(fee) / scale, bankFee: Number(bank) / scale,
    promoDiscount: Number(discount) / scale,
    totalCost: Number(principal + fee + bank - discount) / scale,
    receiveAmount: Number(received) / receiveScale, promo
  };
}
const emailSchema = z.string().trim().max(254).email().transform(v => v.toLowerCase());
// bcrypt silently truncates beyond 72 bytes, including multi-byte characters.
const passwordSchema = z.string().min(12).max(72).refine(v => Buffer.byteLength(v, "utf8") <= 72, "Password must be at most 72 UTF-8 bytes");
export const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email: emailSchema, mobile: z.string().trim().regex(/^\+?[\d\s()-]{7,30}$/).optional(), password: passwordSchema });
export const loginSchema = z.object({ email: emailSchema, password: passwordSchema });
const recipientDetails = z.object({ name: z.string().trim().min(2).max(120), account: z.string().regex(/^\d{6,18}$/), code: z.string().trim().min(8).max(11).transform(v => v.toUpperCase()) });
export const recipientSchema = recipientDetails.extend({ currency: z.enum(currencies), bankName: z.string().min(2).max(120) }).refine(v => banks[v.currency].some(b => b.name === v.bankName), { message: "Select a supported bank", path: ["bankName"] });
export const quoteSchema = z.object({ amount: z.union([z.string().max(24), z.number()]), from: z.enum(currencies), to: z.enum(currencies), fromBank: z.string().min(1).max(120), toBank: z.string().min(1).max(120), promo: z.boolean().default(false), recipient: recipientDetails }).superRefine((v, ctx) => {
  const error = amountError(v.amount, v.from, v.to);
  if (error) ctx.addIssue({ code: "custom", path: ["amount"], message: error });
});
export const confirmSchema = z.object({ quoteId: z.string().min(1).max(120), idempotencyKey: z.string().min(8).max(120), saveRecipient: z.boolean().default(false) });
export const pageSchema = z.object({ cursor: z.string().min(1).max(120).optional(), limit: z.coerce.number().int().min(1).max(100).default(50) });
export const idSchema = z.string().min(1).max(120);
