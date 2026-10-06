import assert from "node:assert/strict";
import { test } from "node:test";
import {
  newDraft,
  recipientError,
  validEmail,
  validMobile,
} from "../src/domain/data";
import { DemoService } from "../src/services/demo";
const draft = () => ({
  ...newDraft(),
  promo: true,
  recipient: {
    name: "Sample Parent",
    account: "123456789012",
    code: "HDFC0001234",
    save: true,
  },
});
test("confirmation debits the correct bank once, even after repeated confirmations", async () => {
  const service = new DemoService();
  const quote = service.createQuote(draft());
  const first = service.confirm(quote);
  const second = service.confirm(quote);
  assert.equal(first.id, second.id);
  assert.equal(first.status, "Processing");
  assert.equal((await service.getBalances())["JPY:JP Bank"], 1149620);
  assert.equal((await service.getBalances())["JPY:MUFG"], 1250000);
});
test("receipt is a snapshot and quote lifetime is 30 minutes", () => {
  const service = new DemoService();
  const source = draft();
  const quote = service.createQuote(source);
  source.recipient.name = "Changed";
  assert.equal(quote.recipient.name, "Sample Parent");
  assert.equal(
    Date.parse(quote.expiresAt) - Date.parse(quote.createdAt),
    1800000,
  );
  const transfer = service.confirm(quote);
  quote.recipient.name = "Also changed";
  assert.equal(transfer.quote.recipient.name, "Sample Parent");
});
test("expired quotes are rejected before any balance mutation", async () => {
  const service = new DemoService();
  const quote = service.createQuote(draft());
  quote.expiresAt = new Date(Date.now() - 1).toISOString();
  assert.throws(() => service.confirm(quote), /expired/);
  assert.equal((await service.getBalances())["JPY:JP Bank"], 1250000);
});
test("insufficient funds cannot create a second debit", async () => {
  const service = new DemoService();
  service.confirm(service.createQuote({ ...draft(), amount: "1000000" }));
  const before = await service.getBalances();
  assert.throws(
    () =>
      service.confirm(service.createQuote({ ...draft(), amount: "500000" })),
    /too low/,
  );
  assert.deepEqual(await service.getBalances(), before);
});
test("bank selection and recipient formats are checked at the service boundary", () => {
  const service = new DemoService();
  assert.throws(() => service.createQuote({ ...draft(), fromBank: "Unknown" }));
  assert.throws(() => service.createQuote({ ...draft(), toBank: "Unknown" }));
  assert.throws(() =>
    service.createQuote({
      ...draft(),
      recipient: { ...draft().recipient, code: "INVALID" },
    }),
  );
  assert.equal(
    recipientError({ ...draft().recipient, code: "CHASUS33" }, "USD"),
    "",
  );
  assert.notEqual(
    recipientError({ ...draft().recipient, code: "1234" }, "USD"),
    "",
  );
});
test("contact validation and session reset", async () => {
  assert.ok(validEmail("demo@example.com"));
  assert.ok(!validEmail("bad@"));
  assert.ok(validMobile("+81 90 1234 5678"));
  assert.ok(!validMobile("abc1234567"));
  const service = new DemoService();
  service.confirm(service.createQuote(draft()));
  service.reset();
  assert.equal((await service.getBalances())["JPY:JP Bank"], 1250000);
});
