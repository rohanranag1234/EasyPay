export type Currency = "JPY" | "USD" | "EUR" | "GBP" | "INR";
export const sendingCurrencies: Currency[] = ["JPY", "USD", "EUR", "GBP"];
export const allCurrencies: Currency[] = [...sendingCurrencies, "INR"];
export const currencyInfo: Record<
  Currency,
  { flag: string; country: string; name: string }
> = {
  JPY: { flag: "🇯🇵", country: "Japan", name: "Japanese yen" },
  INR: { flag: "🇮🇳", country: "India", name: "Indian rupee" },
  USD: { flag: "🇺🇸", country: "United States", name: "US dollar" },
  EUR: { flag: "🇪🇺", country: "Europe", name: "Euro" },
  GBP: { flag: "🇬🇧", country: "United Kingdom", name: "British pound" },
};
export const banks: Record<Currency, { name: string; fee: number }[]> = {
  JPY: [
    { name: "JP Bank", fee: 0 },
    { name: "MUFG", fee: 220 },
    { name: "Mizuho", fee: 220 },
    { name: "SMBC", fee: 330 },
  ],
  USD: [
    { name: "Chase", fee: 0 },
    { name: "Bank of America", fee: 3 },
  ],
  EUR: [
    { name: "Deutsche Bank", fee: 0 },
    { name: "BNP Paribas", fee: 2 },
  ],
  GBP: [
    { name: "Barclays", fee: 0 },
    { name: "HSBC", fee: 2 },
  ],
  INR: [
    { name: "HDFC Bank", fee: 0 },
    { name: "SBI", fee: 0 },
    { name: "ICICI Bank", fee: 0 },
    { name: "Axis Bank", fee: 0 },
  ],
};
export const initialBalances: Record<Currency, number> = {
  JPY: 1250000,
  USD: 15000,
  EUR: 12000,
  GBP: 10000,
  INR: 0,
};
export const bankKey = (currency: Currency, name: string) =>
  `${currency}:${name}`;
export const initialBankBalances = Object.fromEntries(
  sendingCurrencies.flatMap((currency) =>
    banks[currency].map((bank) => [
      bankKey(currency, bank.name),
      initialBalances[currency],
    ]),
  ),
);
export type User = {
  name: string;
  email: string;
  mobile: string;
  guest: boolean;
  mobileVerified: boolean;
  emailVerified: boolean;
};
export type Recipient = {
  name: string;
  account: string;
  code: string;
  save: boolean;
};
export type Draft = {
  amount: string;
  from: Currency;
  to: Currency;
  fromBank: string;
  toBank: string;
  promo: boolean;
  recipient: Recipient;
};
export const emptyRecipient: Recipient = {
  name: "",
  account: "",
  code: "",
  save: true,
};
export const newDraft = (): Draft => ({
  amount: "100000",
  from: "JPY",
  to: "INR",
  fromBank: "JP Bank",
  toBank: "HDFC Bank",
  promo: false,
  recipient: { ...emptyRecipient },
});
export function recipientError(recipient: Recipient, to: Currency) {
  if (recipient.name.trim().length < 2)
    return "Enter the account holder’s full name.";
  if (!/^\d{6,18}$/.test(recipient.account))
    return "Enter an account number with 6–18 digits.";
  if (to === "INR" && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(recipient.code))
    return "Enter a valid IFSC, such as HDFC0001234.";
  if (
    to !== "INR" &&
    !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(recipient.code)
  )
    return "Enter an 8 or 11 character SWIFT code.";
  return "";
}
export const validName = (name: string) => name.trim().length >= 2;
export const validEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
export const validMobile = (mobile: string) =>
  /^\+?[\d\s()-]+$/.test(mobile) &&
  mobile.replace(/\D/g, "").length >= 7 &&
  mobile.replace(/\D/g, "").length <= 15;
