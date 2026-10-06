import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import type { Server } from "node:http";
import type { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const databaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !new URL(databaseUrl).pathname.endsWith("_test")) {
  throw new Error("Set TEST_DATABASE_URL to a dedicated PostgreSQL database whose name ends in _test; apply migrations first.");
}
process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = randomBytes(48).toString("hex");
process.env.CORS_ORIGIN = "http://localhost:8081";
let server: Server;
let prisma: PrismaClient;
let base: string;
const ids: string[] = [];
const accounts: { token: string; id: string; email: string }[] = [];
const password = "fictional-test-password-123";
const draft = { amount: "100000", from: "JPY", to: "INR", fromBank: "JP Bank", toBank: "HDFC Bank", promo: true, recipient: { name: "Synthetic Recipient", account: "123456789012", code: "HDFC0001234" } };
async function request(path: string, token?: string, body?: unknown, method?: string) {
  const response = await fetch(base + path, { method: method || (body === undefined ? "GET" : "POST"), headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: response.status === 204 ? null : await response.json(), headers: response.headers };
}
async function quote(token = accounts[0].token) {
  const result = await request("/api/transfers/quote", token, draft);
  expect(result.status).toBe(201);
  return result.body.quote;
}

beforeAll(async () => {
  const { app } = await import("../src/app");
  prisma = (await import("../src/config/prisma")).prisma;
  await new Promise<void>(resolve => { server = app.listen(0, "127.0.0.1", resolve); });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test listener");
  base = `http://127.0.0.1:${address.port}`;
  for (let i = 0; i < 2; i++) {
    const email = `bridgepay-${randomUUID()}@example.invalid`;
    const result = await request("/api/auth/register", undefined, { name: "Synthetic User", email, password });
    expect(result.status).toBe(201);
    expect(result.body.user.passwordHash).toBeUndefined();
    ids.push(result.body.user.id);
    accounts.push({ token: result.body.token, id: result.body.user.id, email });
  }
}, 30000);
afterAll(async () => {
  if (prisma) {
    // Delete only this test run's synthetic accounts, never unrelated database data.
    await prisma.transfer.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await prisma.$disconnect();
  }
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe("Authenticated API and transaction integrity", () => {
  it("requires valid credentials and scoped JWTs", async () => {
    expect((await request("/api/transfers")).status).toBe(401);
    expect((await request("/api/auth/login", undefined, { email: accounts[0].email, password: "wrong-password-123" })).status).toBe(401);
    const loggedIn = await request("/api/auth/login", undefined, { email: accounts[0].email.toUpperCase(), password });
    expect(loggedIn.status).toBe(200);
    const me = await request("/api/auth/me", loggedIn.body.token);
    expect(me.body.user.id).toBe(accounts[0].id);
    expect(me.headers.get("cache-control")).toBe("no-store");
    const forged = jwt.sign({ userId: accounts[0].id, role: "USER" }, process.env.JWT_SECRET!, { algorithm: "HS384" });
    expect((await request("/api/transfers", forged)).status).toBe(401);
  });
  it("rejects bcrypt truncation and duplicate account races", async () => {
    const tooLong = await request("/api/auth/register", undefined, { name: "Synthetic User", email: "invalid-password@example.invalid", password: "é".repeat(40) });
    expect(tooLong.status).toBe(400);
    const data = { name: "Synthetic User", email: `bridgepay-${randomUUID()}@example.invalid`, password };
    const results = await Promise.all([request("/api/auth/register", undefined, data), request("/api/auth/register", undefined, data)]);
    results.filter(r => r.status === 201).forEach(r => ids.push(r.body.user.id));
    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
  });
  it("rejects invalid amounts and bank details with 400", async () => {
    for (const patch of [{ amount: "NaN" }, { amount: "1000.01" }, { amount: "999999999999999999" }, { from: "INR" }, { to: "JPY" }, { fromBank: "Unknown" }, { recipient: { ...draft.recipient, name: "x".repeat(121) } }]) {
      expect((await request("/api/transfers/quote", accounts[0].token, { ...draft, ...patch })).status).toBe(400);
    }
    expect((await request("/api/recipients", accounts[0].token, { ...draft.recipient, currency: "INR", bankName: "Unknown" })).status).toBe(400);
    const malformed = await fetch(base + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
    expect(malformed.status).toBe(400);
  });
  it("owns pricing and rejects cross-user quote access", async () => {
    const q = await request("/api/transfers/quote", accounts[0].token, { ...draft, totalCost: 1, receiveAmount: 999999999, platformFee: 0 });
    expect(q.body.quote.totalCost).toBe(100380);
    expect(q.body.quote.receiveAmount).toBe(60800);
    expect((await request("/api/transfers/confirm", accounts[1].token, { quoteId: q.body.quote.id, idempotencyKey: randomUUID() })).status).toBe(404);
  });
  it("returns one transfer for concurrent retries and rejects changed payloads", async () => {
    const q = await quote();
    const body = { quoteId: q.id, idempotencyKey: randomUUID(), saveRecipient: true };
    const results = await Promise.all(Array.from({ length: 6 }, () => request("/api/transfers/confirm", accounts[0].token, body)));
    expect(results.every(r => [200, 201].includes(r.status))).toBe(true);
    expect(results.filter(r => r.status === 201)).toHaveLength(1);
    const id = results[0].body.transfer.id;
    expect(new Set(results.map(r => r.body.transfer.id)).size).toBe(1);
    expect(await prisma.transferEvent.count({ where: { transferId: id } })).toBe(1);
    expect(await prisma.recipient.count({ where: { userId: accounts[0].id } })).toBe(1);
    expect((await request("/api/transfers/confirm", accounts[0].token, { ...body, saveRecipient: false })).status).toBe(409);
    const other = await quote();
    expect((await request("/api/transfers/confirm", accounts[0].token, { ...body, quoteId: other.id })).status).toBe(409);
    expect((await request(`/api/transfers/${id}`, accounts[1].token)).status).toBe(404);
    const recipient = (await request("/api/recipients", accounts[0].token)).body.recipients[0];
    expect((await request(`/api/recipients/${recipient.id}`, accounts[1].token, undefined, "DELETE")).status).toBe(404);
    expect((await request("/api/recipients", accounts[1].token)).body.recipients).toEqual([]);
    expect((await request(`/api/recipients/${recipient.id}`, accounts[0].token, undefined, "DELETE")).status).toBe(204);
    expect((await request("/api/transfers/confirm", accounts[0].token, body)).status).toBe(200);
  });
  it("scopes idempotency keys to users and prevents double confirmation with different keys", async () => {
    const key = randomUUID();
    for (const account of accounts) {
      const q = await quote(account.token);
      expect((await request("/api/transfers/confirm", account.token, { quoteId: q.id, idempotencyKey: key })).status).toBe(201);
    }
    const q = await quote();
    const results = await Promise.all([1, 2].map(() => request("/api/transfers/confirm", accounts[0].token, { quoteId: q.id, idempotencyKey: randomUUID(), saveRecipient: true })));
    expect(results.map(r => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.transfer.count({ where: { quoteId: q.id } })).toBe(1);
    expect(await prisma.recipient.count({ where: { userId: accounts[0].id } })).toBe(1);
  });
  it("rejects expired quotes but permits replay of an already confirmed transfer", async () => {
    const q = await quote();
    await prisma.quote.update({ where: { id: q.id }, data: { expiresAt: new Date(0) } });
    expect((await request("/api/transfers/confirm", accounts[0].token, { quoteId: q.id, idempotencyKey: randomUUID() })).status).toBe(400);
    const transfer = await prisma.transfer.findFirstOrThrow({ where: { userId: accounts[0].id } });
    await prisma.quote.update({ where: { id: transfer.quoteId }, data: { expiresAt: new Date(0) } });
    expect((await request("/api/transfers/confirm", accounts[0].token, { quoteId: transfer.quoteId, idempotencyKey: transfer.idempotencyKey, saveRecipient: transfer.saveRecipient })).status).toBe(200);
  });
  it("paginates only the current user's records without duplicates", async () => {
    const first = await request("/api/transfers?limit=1", accounts[0].token);
    expect(first.body.transfers).toHaveLength(1);
    expect(first.body.nextCursor).toBeTruthy();
    const second = await request(`/api/transfers?limit=1&cursor=${first.body.nextCursor}`, accounts[0].token);
    expect(second.body.transfers).toHaveLength(1);
    expect(second.body.transfers[0].id).not.toBe(first.body.transfers[0].id);
    expect((await request("/api/transfers?limit=100000", accounts[0].token)).status).toBe(400);
  });
  it("limits repeated authentication attempts", async () => {
    let status = 0;
    for (let i = 0; i < 11 && status !== 429; i++) status = (await request("/api/auth/login", undefined, { email: accounts[0].email, password: "incorrect-password" })).status;
    expect(status).toBe(429);
  });
});
