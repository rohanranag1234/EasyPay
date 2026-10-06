import assert from "node:assert/strict";
import { test } from "node:test";
import { amountError, calculate, rateFor } from "../src/domain/calc";

test("brief example: ¥100,000 with SEND5 gives ₹60,800 and ¥100,380 total", () => {
  const q = calculate({ amount: 100000, from: "JPY", to: "INR", promo: true });
  assert.equal(q.receiveAmount, 60800);
  assert.equal(q.platformFee, 400);
  assert.equal(q.promoDiscount, 20);
  assert.equal(q.totalCost, 100380);
});
test("bank fees are separate and the promo discounts only the platform fee", () => {
  const q = calculate({
    amount: 100000,
    from: "JPY",
    to: "INR",
    bankFee: 220,
    promo: true,
  });
  assert.equal(q.bankFee, 220);
  assert.equal(q.promoDiscount, 20);
  assert.equal(q.totalCost, 100600);
  assert.equal(
    calculate({ amount: 100000, from: "JPY", to: "INR" }).totalCost,
    100400,
  );
});
test("JPY rounds fees and discounts to whole yen", () => {
  const q = calculate({ amount: 12345, from: "JPY", to: "INR", promo: true });
  assert.equal(q.platformFee, 49);
  assert.equal(q.promoDiscount, 2);
  assert.equal(q.totalCost, 12392);
  assert.equal(q.receiveAmount, 7505.76);
});
test("two-decimal currencies avoid floating point artifacts", () => {
  const q = calculate({
    amount: 123.45,
    from: "USD",
    to: "INR",
    bankFee: 3,
    promo: true,
  });
  assert.equal(q.platformFee, 0.49);
  assert.equal(q.promoDiscount, 0.02);
  assert.equal(q.totalCost, 126.92);
});
test("destination precision is respected including whole yen", () => {
  const q = calculate({ amount: 10.01, from: "USD", to: "JPY", rate: 150.5 });
  assert.equal(q.receiveAmount, 1507);
});
test("rejects invalid numbers, bounds, precision and unsupported corridors", () => {
  for (const value of [
    "",
    "0",
    "-1",
    "NaN",
    "Infinity",
    "1e5",
    "1000.1",
    "1000001",
    "999",
    "100,000",
    "1000.",
  ])
    assert.notEqual(amountError(value, "JPY", "INR"), "");
  assert.equal(amountError("1000", "JPY", "INR"), "");
  assert.equal(amountError("1000000", "JPY", "INR"), "");
  assert.notEqual(amountError("1000", "JPY", "JPY"), "");
  assert.notEqual(amountError("1000", "INR", "JPY"), "");
  assert.notEqual(amountError("1000", "BTC", "JPY"), "");
  assert.throws(() =>
    calculate({ amount: 1000, from: "JPY", to: "INR", bankFee: -1 }),
  );
  assert.throws(() =>
    calculate({ amount: 1000, from: "JPY", to: "INR", rate: 0 }),
  );
});
test("sample cross rates are consistent with the stated JPY reference", () => {
  assert.equal(rateFor("JPY", "INR"), 0.608);
  assert.equal(rateFor("USD", "EUR"), 0.91044776);
});
