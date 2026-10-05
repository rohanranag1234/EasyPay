import React, { createContext, useContext, useState } from "react";
import {
  Currency,
  Draft,
  initialBankBalances,
  newDraft,
  Recipient,
  User,
} from "./domain/data";
import { demoService, Quote, seedTransfers, Transfer } from "./services/demo";
function useAppState() {
  const [user, setUser] = useState<User | null>(null);
  const [draft, setDraft] = useState<Draft>(newDraft);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>(seedTransfers);
  const [balances, setBalances] = useState(initialBankBalances);
  const [savedRecipients, setSavedRecipients] = useState<
    (Recipient & { to: Currency; bank: string })[]
  >([]);
  const [settings, setSettings] = useState({
    notifications: false,
    biometrics: false,
    alerts: false,
    currency: "JPY" as Currency,
    language: "English",
  });
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const patchDraft = (patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const reset = () => {
    demoService.reset();
    setUser(null);
    setPendingUser(null);
    setDraft(newDraft());
    setQuote(null);
    setTransfers(seedTransfers());
    setBalances({ ...initialBankBalances });
    setSavedRecipients([]);
    setSettings({
      notifications: false,
      biometrics: false,
      alerts: false,
      currency: "JPY",
      language: "English",
    });
  };
  const confirm = async () => {
    if (!quote) throw new Error("Please review a quote first.");
    const transfer = demoService.confirm(quote);
    setTransfers((current) =>
      current.some((t) => t.id === transfer.id)
        ? current
        : [transfer, ...current],
    );
    setBalances(await demoService.getBalances());
    if (quote.recipient.save)
      setSavedRecipients((current) =>
        current.some(
          (r) =>
            r.account === quote.recipient.account &&
            r.bank === quote.toBank &&
            r.to === quote.to,
        )
          ? current
          : [
              ...current,
              { ...quote.recipient, to: quote.to, bank: quote.toBank },
            ],
      );
    return transfer;
  };
  return {
    user,
    setUser,
    draft,
    setDraft,
    patchDraft,
    quote,
    setQuote,
    transfers,
    balances,
    setBalances,
    confirm,
    reset,
    settings,
    setSettings,
    savedRecipients,
    pendingUser,
    setPendingUser,
  };
}
type AppState = ReturnType<typeof useAppState>;
const Context = createContext<AppState | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  return <Context.Provider value={useAppState()}>{children}</Context.Provider>;
}
export function useApp() {
  const state = useContext(Context);
  if (!state) throw new Error("AppProvider is required");
  return state;
}
