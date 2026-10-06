# BridgePay Backend

Backend starter aligned to the uploaded BridgePay Expo app's data model and prototype calculation rules. It includes Express + TypeScript, PostgreSQL + Prisma, JWT auth, recipients, persistent quotes, transfers, and transfer-event audit records.

> **Demo only.** FX rates are the static sample values from the current app (`src/domain/calc.js`). Confirming a transfer creates a database record with `PAYMENT_PENDING`; it does not charge a bank account or send money. Do not use this project for real customer funds. Real remittance requires a licensed/authorized provider, verified webhooks, KYC/AML and jurisdiction-specific compliance, security review, reconciliation, and production operations.

## Requirements
- Node.js 22.13+ (Node 24 recommended)
- Docker Desktop (or a PostgreSQL 15+ server)

## Setup
```bash
cp .env.example .env
# Change JWT_SECRET to a random secret of at least 32 characters. The placeholder is rejected.
docker compose up -d
npm ci
npx prisma generate
npm run prisma:deploy
npm run dev
```
Health check: `GET http://localhost:4000/health`

## API
All JSON responses use standard HTTP status codes. Except register/login/config/health, endpoints require `Authorization: Bearer <token>`.

- `POST /api/auth/register` `{ "name":"Rohan Rana", "email":"rohan@example.com", "mobile":"+81...", "password":"a-long-demo-password" }`
- `POST /api/auth/login` `{ "email":"rohan@example.com", "password":"a-long-demo-password" }`
- `GET /api/auth/me`
- `GET /api/transfers/config` returns supported currencies/banks and declares that FX is demo-only
- `POST /api/recipients` `{ "name":"Sample Parent", "currency":"INR", "bankName":"HDFC Bank", "account":"123456789012", "code":"HDFC0001234" }`
- `GET /api/recipients`
- `DELETE /api/recipients/:id`
- `POST /api/transfers/quote` `{ "amount":"100000", "from":"JPY", "to":"INR", "fromBank":"JP Bank", "toBank":"HDFC Bank", "promo":true, "recipient":{"name":"Sample Parent","account":"123456789012","code":"HDFC0001234"} }`
- `POST /api/transfers/confirm` `{ "quoteId":"<quote id>", "idempotencyKey":"unique-transfer-key-0001", "saveRecipient":true }`
- `GET /api/transfers`
- `GET /api/transfers/:id`

## Connect the Expo app
Set an API base URL in your app configuration, e.g. `EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:4000`. A simulator/device cannot usually reach the development computer via `localhost`; use the computer's LAN IP on the same network or an HTTPS dev tunnel. On iOS Simulator, `localhost` may work depending on setup.

The extracted frontend now calls these routes through `src/services/api.ts` when `EXPO_PUBLIC_API_URL` is set. Signup/login use email and password; guest mode stays local. The returned quote DTO retains the app's fields (`amount`, `from`, `to`, `rate`, `platformFee`, `bankFee`, `promoDiscount`, `totalCost`, `receiveAmount`, `promo`, `fromBank`, `toBank`, `recipient`, `createdAt`, `expiresAt`). This implementation keeps the token only in memory; users log in again after reload. Any future persistent native session must use secure device storage.

## Before production
- Replace sample FX and bank fees with provider-sourced, timestamped quotes.
- Use a licensed/authorized remittance/payment provider for money movement.
- Add email/SMS OTP with real provider integration; current verified flags are not a verification flow.
- Encrypt sensitive recipient/bank data at rest; consider tokenization/provider-hosted beneficiary collection.
- Add signed webhook verification, replay protection, reconciliation, refunds, stronger audit controls, monitoring, and a reviewed state-transition policy.
- Add formal integration tests and CI; conduct security and legal review for Japan and India.

## API safety and pagination

JWTs last one hour and are restricted to the expected issuer, audience, and HS256. Registration passwords require at least 12 characters and at most 72 UTF-8 bytes. Authentication endpoints allow ten attempts per IP per 15 minutes; the general API limit is 300 requests per IP per 15 minutes. Rate-limit state is local to one process.

Idempotency keys are scoped to a user and bound to the quote ID and save-recipient choice. Retry with the same body/key after a timeout. A different request with that key, or a new key for an already-confirmed quote, returns 409. Simultaneous confirmations are serialized with database constraints and transaction retries.

GET recipients/transfers accept `limit` (1–100; default 50) and an optional `cursor`. Responses include `nextCursor`, or null at the end. API responses are not cacheable.

See the repository root README and SECURITY-REVIEW.md for setup, integration tests, and remaining deployment requirements.
