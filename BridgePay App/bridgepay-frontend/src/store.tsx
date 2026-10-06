import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  Currency,
  Draft,
  initialBankBalances,
  newDraft,
  Recipient,
  User,
} from "./domain/data";
import { demoService, Quote, seedTransfers, Transfer } from "./services/demo";
import { api, apiConfigured } from "./services/api";

function useAppState() {
  const generation = useRef(0);
  const [user, setUser] = useState<User | null>(null);
  const [draft, setDraft] = useState<Draft>(newDraft);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
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
  const connected = apiConfigured && !!user && !user.guest;
  const patchDraft = (patch: Partial<Draft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const reset = () => {
    generation.current++;
    api.reset();
    demoService.reset();
    setUser(null);
    setPendingUser(null);
    setDraft(newDraft());
    setQuote(null);
    setTransfers([]);
    setNextCursor(null);
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
  const startGuest = () => {
    reset();
    setTransfers(seedTransfers());
    setUser({
      name: "Guest",
      email: "",
      mobile: "",
      guest: true,
      mobileVerified: false,
      emailVerified: false,
    });
  };
  const authenticate = async (
    mode: "login" | "register",
    details: {
      email: string;
      password: string;
      name?: string;
      mobile?: string;
    },
  ) => {
    reset();
    const current = generation.current;
    const account = await api.authenticate(mode, details);
    if (current !== generation.current)
      throw new Error("Your session changed. Please try again.");
    // Home loads history separately so a temporary read failure cannot make a
    // successfully created account appear to have failed registration.
    setUser(account);
  };
  const refresh = useCallback(async () => {
    const current = generation.current;
    if (connected) {
      const [history, recipients] = await Promise.all([
        api.listTransfers(),
        api.listRecipients(),
      ]);
      if (current !== generation.current) return;
      setTransfers(history.transfers);
      setNextCursor(history.nextCursor);
      setSavedRecipients(recipients);
    } else {
      const updated = await demoService.getBalances();
      if (current === generation.current) setBalances(updated);
    }
  }, [connected]);
  const loadMoreTransfers = async () => {
    if (!connected || !nextCursor) return;
    const current = generation.current;
    const cursor = nextCursor;
    const page = await api.listTransfers(cursor);
    if (current !== generation.current) return;
    setTransfers((rows) => [
      ...rows,
      ...page.transfers.filter((t) => !rows.some((r) => r.id === t.id)),
    ]);
    setNextCursor((value) => (value === cursor ? page.nextCursor : value));
  };
  const createQuote = async () => {
    const current = generation.current;
    const result = connected
      ? await api.createQuote(draft)
      : demoService.createQuote(draft);
    if (current !== generation.current)
      throw new Error("Your session changed. Please try again.");
    setQuote(result);
  };
  const confirm = async () => {
    if (!quote) throw new Error("Please review a quote first.");
    const current = generation.current;
    const transfer = connected
      ? await api.confirm(quote)
      : demoService.confirm(quote);
    if (current !== generation.current)
      throw new Error("Your session changed. Please try again.");
    setTransfers((rows) =>
      rows.some((t) => t.id === transfer.id) ? rows : [transfer, ...rows],
    );
    if (!connected) {
      const updated = await demoService.getBalances();
      if (current !== generation.current)
        throw new Error("Your session changed. Please try again.");
      setBalances(updated);
    }
    if (quote.recipient.save)
      setSavedRecipients((rows) =>
        rows.some(
          (r) =>
            r.account === quote.recipient.account &&
            r.bank === quote.toBank &&
            r.to === quote.to,
        )
          ? rows
          : [...rows, { ...quote.recipient, to: quote.to, bank: quote.toBank }],
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
    transfers,
    balances,
    confirm,
    reset,
    settings,
    setSettings,
    savedRecipients,
    pendingUser,
    setPendingUser,
    connected,
    authenticate,
    startGuest,
    createQuote,
    refresh,
    nextCursor,
    loadMoreTransfers,
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
