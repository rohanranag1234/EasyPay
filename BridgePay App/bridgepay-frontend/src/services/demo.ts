import { amountError, calculate } from "../domain/calc";
import {
  Draft,
  Recipient,
  bankKey,
  banks,
  initialBankBalances,
  recipientError,
} from "../domain/data";
export type Quote = ReturnType<typeof calculate> & {
  id: string;
  createdAt: string;
  expiresAt: string;
  fromBank: string;
  toBank: string;
  recipient: Recipient;
};
export type Transfer = {
  id: string;
  quote: Quote;
  status: "Processing" | "Completed" | "Failed";
  createdAt: string;
  completedAt?: string;
};
/** Replace this service with an authenticated backend before enabling real payments. */
export class DemoService {
  private balances = { ...initialBankBalances };
  private transfers = new Map<string, Transfer>();
  async getBalances() {
    return { ...this.balances };
  }
  createQuote(draft: Draft): Quote {
    const bank = banks[draft.from]?.find((b) => b.name === draft.fromBank);
    if (!bank || !banks[draft.to]?.some((b) => b.name === draft.toBank))
      throw new Error("Select valid sending and receiving banks.");
    const error = recipientError(draft.recipient, draft.to);
    if (error) throw new Error(error);
    const amountIssue = amountError(draft.amount, draft.from, draft.to);
    if (amountIssue) throw new Error(amountIssue);
    const now = Date.now();
    return {
      ...calculate({
        ...draft,
        amount: Number(draft.amount),
        bankFee: bank.fee,
      }),
      id: `Q${now}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 30 * 60 * 1000).toISOString(),
      fromBank: draft.fromBank,
      toBank: draft.toBank,
      recipient: { ...draft.recipient },
    };
  }
  confirm(quote: Quote): Transfer {
    const existing = this.transfers.get(quote.id);
    if (existing) return existing;
    if (Date.now() >= Date.parse(quote.expiresAt))
      throw new Error("This quote has expired. Go back to refresh your quote.");
    const key = bankKey(quote.from, quote.fromBank);
    if (this.balances[key] < quote.totalCost)
      throw new Error("Your sample bank balance is too low for this transfer.");
    this.balances[key] =
      Math.round((this.balances[key] - quote.totalCost) * 100) / 100;
    const transfer: Transfer = {
      id: `BP${Date.now().toString().slice(-8)}${this.transfers.size}`,
      quote: { ...quote, recipient: { ...quote.recipient } },
      status: "Processing",
      createdAt: new Date().toISOString(),
    };
    this.transfers.set(quote.id, transfer);
    return transfer;
  }
  reset() {
    this.balances = { ...initialBankBalances };
    this.transfers.clear();
  }
}
export const demoService = new DemoService();
export function seedTransfers(): Transfer[] {
  return [
    {
      name: "Asha Sharma",
      amount: 100000,
      bank: "HDFC Bank",
      days: 2,
      status: "Completed" as const,
    },
    {
      name: "Rohan Sharma",
      amount: 50000,
      bank: "SBI",
      days: 5,
      status: "Completed" as const,
    },
    {
      name: "Asha Sharma",
      amount: 75000,
      bank: "HDFC Bank",
      days: 8,
      status: "Failed" as const,
    },
  ].map((item, i) => {
    const createdAt = new Date(Date.now() - item.days * 86400000).toISOString();
    return {
      id: `BP208${9 - i}`,
      status: item.status,
      createdAt,
      completedAt:
        item.status === "Completed"
          ? new Date(Date.parse(createdAt) + 3600000).toISOString()
          : undefined,
      quote: {
        ...calculate({
          amount: item.amount,
          from: "JPY",
          to: "INR",
          promo: true,
        }),
        id: `sample-${i}`,
        createdAt,
        expiresAt: new Date(Date.parse(createdAt) + 1800000).toISOString(),
        fromBank: "JP Bank",
        toBank: item.bank,
        recipient: {
          name: item.name,
          account: "123456789012",
          code: "HDFC0001234",
          save: false,
        },
      },
    };
  });
}
