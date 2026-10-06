# BridgePay / EasyPay

The editable app is in **`BridgePay App/`**:

- `bridgepay-frontend`: Expo / React Native app (web, iOS, Android).
- `bridgepay-backend`: Express API with PostgreSQL / Prisma.
- `SECURITY-REVIEW.md`: findings, fixes, verification, and remaining limitations.

`BridgePay App.zip` is the original upload. It does not contain the subsequent fixes. Use the extracted source folders for development.

## Start the connected demo

Use Node **24** and Docker with Compose. Open two terminals from this repository.

### 1. Backend

```sh
cd "BridgePay App/bridgepay-backend"
cp .env.example .env
```

Generate a signing secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value into `JWT_SECRET` in the backend `.env`. The server rejects the example placeholder. Keep `.env` private; it is ignored by Git.

```sh
docker compose up -d
npm ci
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

The API runs at `http://localhost:4000`; `/health` returns `ok: true`. These migration instructions assume a fresh database. If you already have a database with data, back it up and review/baseline the migration history before applying the initial migration; do not reset it.

### 2. Frontend

```sh
cd "BridgePay App/bridgepay-frontend"
cp .env.example .env
npm ci
npm run web -- --port 8081
```

Open `http://localhost:8081`. Create an account with fictional details and a password of **12–72 UTF-8 bytes** (at least 12 characters). Log in, create a quote, confirm it, and see the saved transfer in History. For the sample JPY → INR transfer, use account `123456789012` and IFSC `HDFC0001234`; with SEND5, ¥100,000 gives ₹60,800 at a total cost of ¥100,380.

- `EXPO_PUBLIC_API_URL` enables the API connection. It is a public address, never a place for credentials.
- On a phone, set that address to your computer's LAN IP, for example `http://192.168.1.10:4000`, on a trusted development network. Hosted builds require HTTPS. Restart Expo after changing `.env`.
- The backend `CORS_ORIGIN` must contain the exact web frontend origin. Defaults cover localhost ports 8081 and 19006. Native clients do not rely on browser CORS.
- Sessions are held in memory; reload or restart requires login again. Account records, recipients, and transfers survive logout/reload in PostgreSQL.
- Guest mode always uses fictional local data. Clear `EXPO_PUBLIC_API_URL` to run the original offline demo signup/verification flow.

## What confirmation does

**No real money moves.** The server calculates a sample quote and atomically saves one `PAYMENT_PENDING` transfer, an audit event, and an optional recipient. There is no linked bank, debit, ledger, payment provider, payout, KYC service, or live FX feed. The connected dashboard shows that no bank is linked.

Profile editing and server-account deletion are not implemented. Clearing a session only signs out locally. The API returns up to 100 recent saved recipients; History loads transfers in pages of 50 with a Load more button. Export includes only transfers currently loaded in History.

## Checks

Backend:

```sh
npm run build
npm test
```

For database integration tests, create a separate PostgreSQL database whose name ends in `_test`. Apply the migrations to it with `DATABASE_URL` set to its connection URL. Then set `TEST_DATABASE_URL` to that same URL and run:

```sh
npm run test:integration
```

The test refuses a database name without `_test`, creates unique synthetic users, and deletes only its own fixtures.

Frontend:

```sh
npm test
npm run typecheck
npm run lint
npm run format:check
npx expo install --check
npm run build:web
```

Web, iOS, and Android bundle exports were verified. Native device execution and load testing have not been performed. See the security review before considering any public deployment or real payments.
