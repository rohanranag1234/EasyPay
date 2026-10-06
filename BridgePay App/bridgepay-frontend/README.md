# Connected mode update

This extracted copy now integrates with `../bridgepay-backend`. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL`; see the repository root README for setup. Connected signup/login use a password, server quotes are authoritative, and confirmed demo transfers and recipients persist in PostgreSQL. Login tokens remain in memory. Guest mode stays local. No real money moves.

The original description below applies to **offline/guest mode**. Its earlier test results are historical; the current security review records this task’s checks.

# BridgePay — React Native mobile app

An Expo + TypeScript app built from the **BridgePay Team Build Brief**. Runs on iOS, Android, and the web. Black surfaces, lavender navigation, green balances, and responsive mobile/desktop layouts.

## Open in VS Code

1. Extract `BridgePay-source.zip` and open the `bridgepay` folder in VS Code (**File → Open Folder**).
2. Install Node.js **22.13+** (Node 24 LTS recommended).
3. Open the VS Code terminal and run:

```sh
npm ci
npm start
```

Scan the QR code with an **Expo Go version supporting SDK 57**. Your computer and phone must be on the same network. If the installed Expo Go version does not support SDK 57, use a compatible development build. No credentials or environment variables are needed for the demo.

### Other run options

```sh
npm run web       # Browser preview
npm run android   # Android emulator/device; Android Studio required
npm run ios       # iOS Simulator; macOS and Xcode required
```

You can edit `App.tsx` or files in `src/` and see changes with Fast Refresh. This is React Native source, not a prebuilt APK or App Store binary.

## Try the complete flow

- Choose **Continue as guest**, or create an account using fictional contact details. Any four digits work on the demo verification screen; no message is sent.
- Open **Send money**. Enter **100000 JPY**, choose **JP Bank → HDFC Bank**, and apply **SEND5**.
- The recipient gets **₹60,800.00**. Platform fee: **¥400**; discount: **¥20**; total: **¥100,380**.
- Use a fictional recipient, account **123456789012**, IFSC **HDFC0001234**.
- Review and confirm. The selected sample bank balance decreases once, and a **Processing** transfer appears in History.
- Select **MUFG** to see the separate **¥220** bank fee. The total becomes **¥100,600** with SEND5.
- Explore Rates, transfer receipts, profile editing, settings, support FAQs, data export, and session deletion.

## Implemented

- Splash, Welcome, signup/login, simulated OTP, guest mode.
- Dashboard with sample bank balances, hide/refresh balance, campaigns, calculator, and recent activity.
- JPY/USD/EUR/GBP source currencies; supported destination currencies and bank selection.
- Shared integer-minor-unit fee calculations in `src/domain/calc.js`, amount limits, promo, and recipient validation.
- Recipient → 30-minute quote → review → idempotent confirmation → success → history/receipt.
- Separate sample balances per sending bank/currency; insufficient funds and expired quotes blocked.
- Recipients saved for the current session, immutable receipt snapshots, status filters and empty states.
- Profile contact changes return to demo verification; preferences, FAQs, disclosures, masked data export, and delete-session action.
- Accessible button/input labels, responsive layouts, and mobile bottom navigation.

## Deliberate demo boundaries

**No real money moves.** This implements the brief’s demo phases 1–4, with synthetic data. All state is held in memory and clears on reload/logout; full account numbers are never written to local storage. Use fictional personal and bank details.

- OTPs are not delivered, contact verification flags remain false, and login does not authenticate a real account.
- Rates, balances, historical transfers, and quote locking are samples. A new transfer remains Processing; there is no bank payout or webhook.
- Notifications, biometrics, and rate-alert switches store demo preferences only.
- KYC uploads, live chat/email support, referrals, and legal partner terms require a configured operator/provider. The app explains their availability.
- English is the only supported language. Phone confirmation security requires a real biometric/PIN integration before real payments.

## Architecture

```text
App.tsx                  Expo entry, navigation, theme, font loading
src/components/          Shared design components and responsive app shell
src/screens/             Auth, Home, Send, Activity, Account screens
src/domain/calc.js       Central fee, currency rounding, rate, limit rules
src/domain/data.ts       Types, synthetic banks, validation rules
src/services/demo.ts     Quote creation, balance debit, idempotency, sample history
src/store.tsx            In-memory session and application state
src/navigation.ts        Typed navigation routes
tests/                   Calculation and transfer integrity tests
```

`DemoService` is the boundary to replace with an authenticated server API. The phone must never directly hold partner credentials. A production backend must own quotes and expiry, idempotency keys, ledger transactions, verified sessions, bank linkage, rate feeds, KYC/AML, payout initiation, refunds, signed webhooks, and audit records. The local service is not a production security boundary.

## Verify

```sh
npm test
npm run typecheck
npm run lint
npm run format:check
npx expo install --check
npm run build:web
```

Run native bundling checks with `npx expo export --platform ios --output-dir dist-ios` and the equivalent `--platform android --output-dir dist-android`. Device testing and provider integration are separate release requirements.
