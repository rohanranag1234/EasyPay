import { Check, Clock3 } from "lucide-react-native";
import { useState } from "react";
import { View } from "react-native";
import { Flag } from "../components/Flag";
import { Shell } from "../components/Shell";
import {
  Badge,
  Button,
  C,
  Card,
  Chips,
  CostSummary,
  Empty,
  Note,
  PageHeading,
  T,
  TransferRow,
  s,
} from "../components/ui";
import { money, rateFor } from "../domain/calc";
import {
  Currency,
  allCurrencies,
  banks,
  currencyInfo,
  sendingCurrencies,
} from "../domain/data";
import { useNav } from "../navigation";
import { useApp } from "../store";
export function RatesScreen() {
  const nav = useNav();
  const { settings, patchDraft } = useApp();
  const [base, setBase] = useState<Currency>(settings.currency);
  const [updated] = useState(() => new Date());
  return (
    <Shell active="Rates" narrow>
      <PageHeading
        kicker="A WORLD OF POSSIBILITIES"
        title="Exchange rates."
        subtitle="Know what arrives before you send."
      />
      <View style={s.stack}>
        <View style={s.between}>
          <Chips items={sendingCurrencies} value={base} onChange={setBase} />
          <Badge color={C.amber}>Sample rates</Badge>
        </View>
        <Card>
          <View style={[s.between, { marginBottom: 12 }]}>
            <T style={s.eyebrow}>DESTINATION CURRENCY</T>
            <T style={s.eyebrow}>1 {base} =</T>
          </View>
          {allCurrencies
            .filter((c) => c !== base)
            .map((currency) => (
              <View
                key={currency}
                style={[
                  s.between,
                  {
                    paddingVertical: 22,
                    borderTopWidth: 1,
                    borderColor: C.border,
                  },
                ]}
              >
                <View style={s.row}>
                  <Flag currency={currency} size={32} />
                  <View style={{ gap: 5 }}>
                    <T>{currencyInfo[currency].name}</T>
                    <T style={s.small}>{currency}</T>
                  </View>
                </View>
                <T
                  style={{
                    fontSize: 24,
                    color: C.green,
                    fontFamily: "DMSans_500Medium",
                  }}
                >
                  {rateFor(base, currency).toFixed(4)}
                </T>
              </View>
            ))}
          <T style={{ fontSize: 11, color: C.muted }}>
            Sample snapshot loaded at{" "}
            {updated.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            · Not a live market feed
          </T>
        </Card>
        <Card style={{ gap: 20 }}>
          <T style={{ fontSize: 21, fontFamily: "DMSans_600SemiBold" }}>
            Our fees. In plain sight.
          </T>
          <View style={s.between}>
            <T style={s.muted}>Platform fee</T>
            <T style={{ color: C.purple, fontSize: 24 }}>0.4%</T>
          </View>
          <View style={s.between}>
            <T style={s.muted}>Hidden charges</T>
            <T>None</T>
          </View>
          <View style={s.between}>
            <T style={s.muted}>SEND5 promotion</T>
            <T style={{ color: C.green }}>5% off platform fees</T>
          </View>
          <Note>
            Your sending bank may charge its own fee. We show it separately in
            your quote before you confirm.
          </Note>
        </Card>
        <Button
          onPress={() => {
            patchDraft({
              from: base,
              fromBank: banks[base][0].name,
              to: "INR",
              toBank: "HDFC Bank",
              amount: base === "JPY" ? "100000" : "1000",
            });
            nav.navigate("Send");
          }}
        >
          Send now
        </Button>
      </View>
    </Shell>
  );
}
export function HistoryScreen() {
  const nav = useNav();
  const { transfers, connected, nextCursor, loadMoreTransfers } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const shown = transfers.filter(
    (t) => filter === "All" || t.status === filter,
  );
  return (
    <Shell active="History" narrow>
      <PageHeading
        kicker="EVERY TRANSFER HAS A STORY"
        title="Your transactions."
        subtitle={`${transfers.length} transfers loaded · ${connected ? "Saved demo transfers" : "Sample history and this session’s activity"}`}
      />
      <View style={s.stack}>
        <Chips
          items={["All", "Completed", "Processing", "Failed"]}
          value={filter}
          onChange={setFilter}
        />
        <Card>
          {shown.length === 0 ? (
            <Empty
              title="No transfers here yet."
              body="Your next little act of care starts with a transfer."
              action="Send money"
              onPress={() => nav.navigate("Send")}
            />
          ) : (
            shown.map((transfer, i) => (
              <View
                key={transfer.id}
                style={{ borderTopWidth: i ? 1 : 0, borderColor: C.border }}
              >
                <TransferRow transfer={transfer} />
                <View
                  style={[s.between, { paddingBottom: 18, paddingLeft: 55 }]}
                >
                  <T style={{ fontSize: 10, color: C.muted }}>{transfer.id}</T>
                  <T style={{ color: C.green, fontSize: 12 }}>
                    {money(transfer.quote.receiveAmount, transfer.quote.to)}{" "}
                    {transfer.status === "Completed"
                      ? "received"
                      : transfer.status === "Failed"
                        ? "not sent"
                        : "on its way"}
                  </T>
                </View>
              </View>
            ))
          )}
        </Card>
        {!!error && (
          <T accessibilityRole="alert" style={{ color: C.red }}>
            {error}
          </T>
        )}
        {!!nextCursor && (
          <Button
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError("");
              try {
                await loadMoreTransfers();
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Loading…" : "Load more transfers"}
          </Button>
        )}
      </View>
    </Shell>
  );
}
export function TransferDetailScreen({
  route,
}: {
  route: { params: { id: string } };
}) {
  const { transfers } = useApp();
  const nav = useNav();
  const transfer = transfers.find((t) => t.id === route.params.id);
  if (!transfer)
    return (
      <Shell active="History">
        <Empty
          title="Transfer not found"
          body="This transfer is no longer in your demo session."
          action="View history"
          onPress={() => nav.navigate("History")}
        />
      </Shell>
    );
  const q = transfer.quote;
  const steps = [
    { label: "Transfer created", date: transfer.createdAt, done: true },
    {
      label: "Sample balance debited",
      date: transfer.createdAt,
      done: transfer.status !== "Failed",
    },
    {
      label:
        transfer.status === "Completed"
          ? "Recipient received money"
          : transfer.status === "Failed"
            ? "Transfer failed · no debit retained"
            : "Payout processing",
      date: transfer.completedAt,
      done: transfer.status === "Completed",
    },
  ];
  return (
    <Shell active="History" narrow>
      <PageHeading
        title="Transfer details."
        subtitle={`Reference ${transfer.id}`}
        back
      />
      <View style={s.stack}>
        <Card style={{ gap: 20 }}>
          <View style={s.between}>
            <View style={{ gap: 6 }}>
              <T style={{ fontSize: 20, fontFamily: "DMSans_600SemiBold" }}>
                {q.recipient.name}
              </T>
              <T style={s.muted}>
                {q.toBank} · Account •••• {q.recipient.account.slice(-4)}
              </T>
            </View>
            <Badge
              color={
                transfer.status === "Completed"
                  ? C.green
                  : transfer.status === "Failed"
                    ? C.red
                    : C.purple
              }
            >
              {transfer.status}
            </Badge>
          </View>
          <View style={s.divider} />
          <CostSummary quote={q} />
          <T style={s.small}>
            Paid from {q.fromBank} · Quote {q.id}
          </T>
          <T style={s.small}>
            Rate recorded {new Date(q.createdAt).toLocaleString()}
          </T>
        </Card>
        <Card style={{ gap: 23 }}>
          <T style={{ fontSize: 18, fontFamily: "DMSans_600SemiBold" }}>
            The journey home
          </T>
          {steps.map((step, i) => (
            <View key={step.label} style={s.row}>
              <View
                style={{
                  padding: 10,
                  borderRadius: 20,
                  backgroundColor: step.done ? C.greenDark : C.purpleDark,
                }}
              >
                {step.done ? (
                  <Check color={C.green} size={16} />
                ) : (
                  <Clock3
                    color={transfer.status === "Failed" ? C.red : C.purple}
                    size={16}
                  />
                )}
              </View>
              <View style={{ gap: 4, flex: 1 }}>
                <T style={{ fontSize: 13 }}>{step.label}</T>
                <T style={s.small}>
                  {step.date
                    ? new Date(step.date).toLocaleString()
                    : "Sample status · no real payout"}
                </T>
              </View>
            </View>
          ))}
        </Card>
        <Note>
          This receipt contains sample activity. Live payout updates and
          downloadable bank receipts require a payments partner.
        </Note>
      </View>
    </Shell>
  );
}
