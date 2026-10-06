# BridgePay integration and security review

Reviewed 6 October 2026. Source: `BridgePay App.zip` from repository revision `373842f27c8d458d5ec75c982213620fa12fb05a`. The original ZIP is preserved; the changes are in the extracted `BridgePay App/` folders.

## Result

The frontend and backend are connected for a **persistent demo**: password registration/login, authenticated quotes, confirmation, saved recipients, and paginated transfer history. Guest sessions stay local. No payment provider, bank debit, funded balance, payout, or live FX feed is implemented.

This review and the tests below do not establish that the application is safe for real funds, production traffic, or every attack. No production penetration test or load test was performed.

## Confirmed issues addressed

| Area | Original issue | Change |
| --- | --- | --- |
| Frontend/API integration | Signup, login, quotes, and confirmation only used local demo state. | Added API client, password fields, bearer authentication, server quotes, persistent transfers/recipients, error handling, and explicit guest behavior. |
| Confirmation retries | Reusing a key for a different quote could return a previous transfer as if it matched the new request. | Bound the key to its user's quote ID and save-recipient choice; mismatches return 409. |
| Concurrent confirmations | Pre-transaction checks could race, causing unique constraint errors to become 500 responses. | Serializable transactions, bounded retries, unique quote constraint, and per-user idempotency constraint; recipient creation and audit event commit atomically. |
| Signing configuration | The checked-in JWT placeholder met the original length check and could be used unchanged. | Reject common placeholder values; require an independently generated secret. |
| Passwords | Up to 128 characters were accepted despite bcrypt's 72-byte limit. | Require 12+ characters and at most 72 UTF-8 bytes, including multi-byte input checks. |
| Authentication controls | Only a general 300-request limit; JWT payload was cast without validation. | Ten auth attempts per IP per 15 minutes; one-hour HS256 tokens with issuer, audience, and payload validation. |
| Input/error handling | Invalid quote amounts could throw generic errors and produce 500s; some recipient fields were unbounded. | Bounded/normalized inputs, bank validation, correct validation/JSON/body-size errors, and safe conflict responses. |
| Error logs and responses | Raw errors could include database parameters; authenticated responses lacked an explicit cache policy. | Sanitized error logging and `Cache-Control: no-store`. |
| CORS/local database | Wildcard reflected origins were allowed with credentials; Compose exposed PostgreSQL on every interface. | Explicit web origins with bearer-only client requests; Compose database port bound to loopback. |
| History/recipient queries | Lists had no bounds. | Cursor pagination with a maximum page size of 100; History has Load more. |
| Session switching | New asynchronous API calls introduce the risk of old responses restoring data after logout. | Session generation checks reject stale responses and clear memory-held tokens and account data. |
| Build/test setup | Express route parameter types failed the TypeScript build; build output could be discovered as tests. | Parse IDs explicitly, scope Vitest to source tests, and exclude tests from production compilation. |
| Reproducibility | Backend had no lockfile or database migration. | Added a lockfile and initial migration; root README documents connected setup. |
| Dependency tooling | Backend audit found two critical, three high, and one moderate findings. | Updated Vitest to 5.0.3; current backend audit has three high findings and zero critical/moderate findings. |

## Validation

- **Backend:** build and seven unit tests pass.
- **Database integration:** nine tests pass against PostgreSQL 17. Coverage includes login/JWT restrictions, duplicate registration, invalid inputs, server-calculated amounts, ownership checks, expiry, pagination, auth throttling, and concurrent confirmations. Six simultaneous identical confirmations create one transfer, one audit event, and one recipient. A race with different keys creates one transfer and returns 409 for the other request.
- **Frontend:** 18 tests pass, including five API tests for authentication headers, stable confirmation keys, DTO mapping, validation errors, and stale-response rejection.
- Frontend TypeScript, lint, formatting, Expo dependency compatibility, and production web export pass.
- iOS and Android Hermes bundle exports pass. Native device execution and load testing were not performed in this task.
- **Shared Chromium browser:** registration/login, server-priced quote, confirmation, persisted history after reload/login, logout, and guest isolation were exercised. A database check confirmed one pending transfer, one audit event, and one saved recipient. Browser storage contained no persisted session token. The 390×844 mobile receipt layout was inspected; browser error checks were empty.

## Unresolved dependency advisories

At the checked lockfiles:

- **Frontend: 23 findings — 16 high, 7 moderate.** These include dependency chains from `braces`, `node-forge`, and `uuid` through Expo/Metro/React Native tooling. Registry checks returned braces 3.0.3 and node-forge 1.4.0, both inside the reported advisory ranges. npm proposes an incompatible Expo downgrade for many chains; that was not applied. A patched uuid major requires a deliberate compatibility upgrade of its dependents.
- **Backend: 3 high findings**, through Prisma / `@prisma/config` / `deepmerge-ts`. The same findings remain with `npm audit --omit=dev`; they must not be dismissed as absent from the production dependency tree. The advisory reports a recursive-object stack-exhaustion issue. Fixing this requires a tested compatible dependency upgrade; no forced Prisma downgrade or unverified override was applied.

These are dependency audit findings, not proof that each issue is remotely exploitable through this application's endpoints. They remain unresolved release risks.

References from the npm advisory feed:

- [braces nested-pattern denial of service](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
- [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
- [uuid buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
- [deepmerge-ts recursive merge](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)

## Remaining product and deployment work

1. Integrate an appropriate payment/remittance provider, real funding, live quotes, signed/replay-protected webhooks, ledger entries, reconciliation, and controlled status transitions. The existing `PAYMENT_PENDING` row is only a demo record.
2. Implement verified contact ownership, account recovery, stronger authentication, session revocation, and production identity/compliance flows. Profile updates and server-account deletion are currently unavailable; the UI states this.
3. Protect real bank/customer details with a reviewed storage, encryption/tokenization, access, retention, backup, and recovery design. Currently recipient details are ordinary database columns. Use synthetic data only.
4. Use HTTPS, a managed secret store, least-privilege database credentials, deployment-specific allowed origins, and a verified reverse-proxy configuration. The default local database credentials are development-only.
5. Before multiple API instances, replace process-local rate-limit state with shared infrastructure; add account-level protections, telemetry, alerts, pooling, measured load tests, and query/retention tuning. Pagination alone does not prove scale readiness.
6. Finish dependency remediation, native-device testing, and an independent security assessment before real transactions.

## Functional limits of this connection

- Tokens are kept in memory, never in browser localStorage; reload requires login again. Server records remain saved. Local logout does not revoke a stolen token; it expires after one hour.
- Guest and offline-demo data is fictional and not submitted to the server.
- Saved recipient selection currently shows the 100 most recent records. Transfer History pages in batches of 50. Export covers only the loaded history.
- Connected profile editing is disabled; account deletion needs a server workflow. “Clear this session” does not claim to delete database records.
- The development Preview is a local demonstration, not a deployed payment service.
