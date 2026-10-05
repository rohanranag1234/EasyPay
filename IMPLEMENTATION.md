# BridgePay implementation handoff

## Screen status

| Screens | Implemented | Demo/provider boundary |
| --- | --- | --- |
| Splash, Welcome | Branded launch, account/login/guest entry | Session is memory-only |
| Signup, login, verification | Contact validation, four-digit code, resend countdown | No SMS/email sent; verification simulated, ownership flags stay false |
| Home | Sample bank balance, hide/refresh, send button, campaigns, calculator, recent transfers | Synthetic balances/history; referral campaign is announced as upcoming |
| Send | Currency and bank choices, live recalculation, bank fees, SEND5, amount limits, insufficient funds | Sample FX, supported synthetic bank accounts |
| Recipient | Name/account/IFSC/SWIFT validation; save and reuse in session | Fictional bank details only |
| Review, success | 30-minute quote, confirmation guard, idempotent debit, reference | No payout provider; Processing is a demo status |
| Rates | Currency conversion table, loaded time, platform fee disclosure | Explicit sample rates |
| History, detail | All/Completed/Processing/Failed filters, snapshots, masked account, timeline | Seeded Completed/Failed examples; no webhook updates |
| Profile | Edit name/contact info; contact changes go through verification | Identity provider not connected |
| Settings | Preferences, default balance currency, masked JSON export, delete session | No OS notifications/biometric unlock; English only |
| Help, About, Identity | Expandable FAQs, accurate availability notices, privacy/terms/demo disclosures | Live support, document uploads and operator legal terms need configuration |

## Before real payments

The brief’s production phase 5 requires a licensed remittance partner, backend and database, identity provider, bank balance integration, live quote API, real SMS/email verification, and notification delivery. Put credentials only on the server. The server must enforce ownership, transfer limits, idempotency, expiry, atomic ledger updates, KYC/AML and webhook authenticity. Demo login and the in-memory service are not security boundaries.

## Verification and known limitations

- Calculation and transfer integrity tests cover the worked example, currency rounding, separate bank fees, discount scope, limits, invalid corridors, expiry, insufficient funds, immutable receipts and duplicate confirmation.
- TypeScript and Expo dependency compatibility checks pass. Browser smoke tests cover desktop/mobile rendering and the full sample transfer and guest signup flow.
- Native JavaScript/Hermes bundles are checked separately from device execution. No iOS/Android device is available in this Linux sandbox; test on a real device before release.
- The generated Expo SDK 57 dependency tree reports **23 npm audit findings (16 high, 7 moderate)**, propagated from upstream `braces`, `node-forge`, and `uuid`. Compatible `npm audit fix` updates were applied. npm’s forced resolution proposes an incompatible Expo 44 downgrade; this was not applied. Re-check advisories and patched upstream releases before production use.
- Demo state deliberately resets on reload/log out. No full bank account numbers are persisted to disk or sent to a provider.
