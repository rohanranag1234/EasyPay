import { describe, expect, it } from "vitest";
import { calculate, recipientError } from "../src/domain/bridgepay";
describe("BridgePay prototype calculations", () => {
  it("keeps the app's JPY to INR sample quote arithmetic", () => {
    const q = calculate({ amount: "100000", from: "JPY", to: "INR", bankFee: 0, promo: true });
    expect(q.amount).toBe(100000);
    expect(q.rate).toBe(0.608);
    expect(q.platformFee).toBe(400);
    expect(q.promoDiscount).toBe(20);
    expect(q.totalCost).toBe(100380);
    expect(q.receiveAmount).toBe(60800);
  });
  it("rejects invalid IFSC codes", () => {
    expect(recipientError({ name: "Sample Parent", account: "123456789012", code: "INVALID" }, "INR")).not.toBe("");
  });
});
