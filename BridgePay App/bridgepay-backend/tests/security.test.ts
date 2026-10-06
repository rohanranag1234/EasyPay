import { describe, expect, it } from "vitest";
import { quoteSchema, registerSchema } from "../src/domain/bridgepay";
describe("Input boundaries", () => {
  it("rejects passwords that bcrypt would truncate", () => {
    const base = { name: "Test Person", email: "test@example.invalid" };
    expect(registerSchema.safeParse({ ...base, password: "é".repeat(37) }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "a".repeat(72) }).success).toBe(true);
    expect(registerSchema.safeParse({ ...base, password: "a".repeat(73) }).success).toBe(false);
  });
  it("normalizes contacts and rejects an invalid transfer corridor", () => {
    expect(registerSchema.parse({ name: "  Test Person  ", email: " TEST@EXAMPLE.INVALID ", password: "a-long-password" }).email).toBe("test@example.invalid");
    expect(quoteSchema.safeParse({ amount: "100000", from: "JPY", to: "JPY", fromBank: "JP Bank", toBank: "JP Bank", recipient: { name: "Test Person", account: "123456789", code: "TESTJPJJ" } }).success).toBe(false);
  });
});
