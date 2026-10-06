import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { ApiService } from "../src/services/api";
import type { Quote } from "../src/services/demo";

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});
const account = {
  name: "Synthetic User",
  email: "test@example.invalid",
  mobile: null,
  guest: false,
  mobileVerified: false,
  emailVerified: false,
};
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("API requires login, sends only the session token, and reuses the confirmation key", async () => {
  const requests: { path: string; init?: RequestInit }[] = [];
  global.fetch = async (input, init) => {
    requests.push({ path: String(input), init });
    return response(
      String(input).endsWith("/login")
        ? { token: "synthetic-token", user: account }
        : { transfer: { id: "transfer-1" } },
    );
  };
  const api = new ApiService("https://api.example.invalid");
  await assert.rejects(() => api.listTransfers(), /log in/i);
  const user = await api.authenticate("login", {
    email: account.email,
    password: "synthetic-password",
  });
  assert.equal(user.mobile, "");
  assert.equal(
    (requests[0].init?.headers as Record<string, string>).Authorization,
    undefined,
  );
  const quote = {
    id: "quote-1",
    recipient: { save: true },
    amount: 999999,
  } as Quote;
  await api.confirm(quote);
  await api.confirm(quote);
  assert.equal(requests[1].init?.body, requests[2].init?.body);
  assert.deepEqual(JSON.parse(requests[1].init?.body as string), {
    quoteId: "quote-1",
    idempotencyKey: "bridgepay:quote-1",
    saveRecipient: true,
  });
  assert.equal(
    (requests[1].init?.headers as Record<string, string>).Authorization,
    "Bearer synthetic-token",
  );
  assert.equal(requests[1].init?.credentials, "omit");
  api.reset();
  await assert.rejects(() => api.listTransfers(), /log in/i);
});

test("logout discards a pending login response", async () => {
  let finish!: (response: Response) => void;
  global.fetch = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const api = new ApiService("https://api.example.invalid");
  const pending = api.authenticate("login", {
    email: account.email,
    password: "synthetic-password",
  });
  api.reset();
  finish(response({ token: "late-token", user: account }));
  await assert.rejects(pending, /session changed/i);
  await assert.rejects(() => api.listTransfers(), /log in/i);
});

test("does not expose another session's response after account switching", async () => {
  const api = new ApiService("https://api.example.invalid");
  global.fetch = async () => response({ token: "first-token", user: account });
  await api.authenticate("login", {
    email: account.email,
    password: "synthetic-password",
  });
  let finish!: (response: Response) => void;
  global.fetch = () =>
    new Promise((resolve) => {
      finish = resolve;
    });
  const pending = api.listTransfers();
  api.reset();
  finish(
    response({ transfers: [{ id: "private-transfer" }], nextCursor: null }),
  );
  await assert.rejects(pending, /session changed/i);
});

test("surfaces validation errors and rejects insecure remote API configuration", async () => {
  global.fetch = async () =>
    response(
      {
        error: "Validation failed",
        details: [{ message: "Password must be longer" }],
      },
      400,
    );
  const api = new ApiService("https://api.example.invalid");
  await assert.rejects(
    () =>
      api.authenticate("register", { email: account.email, password: "short" }),
    /Password must be longer/,
  );
  await assert.rejects(
    () =>
      new ApiService("http://remote.example.invalid").authenticate("login", {
        email: account.email,
        password: "synthetic-password",
      }),
    /HTTPS/,
  );
});

test("preserves server pricing and maps saved recipients", async () => {
  const api = new ApiService("https://api.example.invalid");
  global.fetch = async (input) => {
    if (String(input).includes("/auth/"))
      return response({ token: "synthetic-token", user: account });
    if (String(input).includes("/recipients"))
      return response({
        recipients: [
          {
            id: "r1",
            name: "Synthetic Recipient",
            account: "12345678",
            code: "HDFC0001234",
            currency: "INR",
            bankName: "HDFC Bank",
            save: true,
          },
        ],
        nextCursor: null,
      });
    return response({
      quote: {
        id: "q1",
        totalCost: 100380,
        recipient: {
          name: "Synthetic Recipient",
          account: "12345678",
          code: "HDFC0001234",
          save: false,
        },
      },
    });
  };
  await api.authenticate("login", {
    email: account.email,
    password: "synthetic-password",
  });
  const q = await api.createQuote({
    amount: "100000",
    from: "JPY",
    to: "INR",
    fromBank: "JP Bank",
    toBank: "HDFC Bank",
    promo: true,
    recipient: {
      name: "Synthetic Recipient",
      account: "12345678",
      code: "HDFC0001234",
      save: true,
    },
  });
  assert.equal(q.totalCost, 100380);
  assert.equal(q.recipient.save, true);
  const recipients = await api.listRecipients();
  assert.equal(recipients[0].to, "INR");
  assert.equal(recipients[0].bank, "HDFC Bank");
});
