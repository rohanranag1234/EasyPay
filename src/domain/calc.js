/** All money arithmetic lives here. Amounts are rounded in integer minor units. */
export const currencies = ["JPY", "USD", "EUR", "GBP", "INR"];
export const decimals = { JPY: 0, USD: 2, EUR: 2, GBP: 2, INR: 2 };
export const limits = {
  JPY: [1000, 1000000],
  USD: [10, 10000],
  EUR: [10, 10000],
  GBP: [10, 10000],
  INR: [1000, 500000],
};
export const sampleValues = {
  JPY: 1,
  INR: 0.608,
  USD: 0.0067,
  EUR: 0.0061,
  GBP: 0.0052,
};
export function rateFor(from, to) {
  return Number((sampleValues[to] / sampleValues[from]).toFixed(8));
}
export function money(value, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals[currency],
    maximumFractionDigits: decimals[currency],
  }).format(value);
}
export function amountError(raw, from, to) {
  if (
    !currencies.includes(from) ||
    !currencies.includes(to) ||
    from === "INR" ||
    from === to
  )
    return "Choose a supported pair of different currencies.";
  if (!/^\d+(\.\d+)?$/.test(String(raw))) return "Enter a valid amount.";
  const amount = Number(raw);
  const [min, max] = limits[from];
  if (!Number.isFinite(amount) || amount < min || amount > max)
    return `Enter between ${money(min, from)} and ${money(max, from)}.`;
  if ((String(raw).split(".")[1]?.length || 0) > decimals[from])
    return `${from} allows ${decimals[from]} decimal places.`;
  return "";
}
const roundedDivide = (n, d) => (n + d / 2n) / d;
export function calculate({
  amount,
  from,
  to,
  bankFee = 0,
  promo = false,
  rate = rateFor(from, to),
}) {
  const error = amountError(amount, from, to);
  if (error) throw new Error(error);
  if (
    !Number.isFinite(rate) ||
    rate <= 0 ||
    !Number.isFinite(bankFee) ||
    bankFee < 0
  )
    throw new Error("Invalid rate or bank fee.");
  const scale = 10 ** decimals[from];
  const receiveScale = 10 ** decimals[to];
  const principal = BigInt(Math.round(Number(amount) * scale));
  const fee = roundedDivide(principal * 4n, 1000n);
  const discount = promo ? roundedDivide(fee * 5n, 100n) : 0n;
  const bank = BigInt(Math.round(bankFee * scale));
  const rateUnits = BigInt(Math.round(rate * 100000000));
  const received = roundedDivide(
    principal * rateUnits * BigInt(receiveScale),
    BigInt(scale) * 100000000n,
  );
  return {
    amount: Number(principal) / scale,
    from,
    to,
    rate,
    platformFee: Number(fee) / scale,
    bankFee: Number(bank) / scale,
    promoDiscount: Number(discount) / scale,
    totalCost: Number(principal + fee + bank - discount) / scale,
    receiveAmount: Number(received) / receiveScale,
    promo,
  };
}

/** Group the integer part while preserving in-progress decimal input. */
export function formatInputAmount(raw) {
  if (!/^\d*(\.\d*)?$/.test(raw)) return raw;
  const [integer, fraction] = raw.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}
