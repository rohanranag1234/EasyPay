import { Check, UserRound } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { TextInput, View, useWindowDimensions } from "react-native";
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
  Field,
  Note,
  PageHeading,
  T,
  Toggle,
  s,
} from "../components/ui";
import {
  formatInputAmount,
  amountError,
  calculate,
  money,
} from "../domain/calc";
import {
  allCurrencies,
  bankKey,
  banks,
  currencyInfo,
  emptyRecipient,
  recipientError,
  sendingCurrencies,
} from "../domain/data";
import { useNav } from "../navigation";
import { demoService } from "../services/demo";
import { useApp } from "../store";
export function SendScreen() {
  const nav = useNav();
  const { draft, patchDraft, balances } = useApp();
  const { width } = useWindowDimensions();
  const wide = width >= 1150;
  const error = amountError(draft.amount, draft.from, draft.to);
  const quote = !error
    ? calculate({
        ...draft,
        amount: Number(draft.amount),
        bankFee:
          banks[draft.from].find((b) => b.name === draft.fromBank)?.fee || 0,
      })
    : null;
  const insufficient =
    !!quote && quote.totalCost > balances[bankKey(draft.from, draft.fromBank)];
  return (
    <Shell active="Send">
      <PageHeading
        kicker="A LITTLE CLOSER, WITH EVERY TRANSFER"
        title="Send money home."
        subtitle="You choose the amount. We make every detail clear."
      />
      <View style={{ flexDirection: wide ? "row" : "column", gap: 24 }}>
        <View style={{ flex: 1.3, gap: 20 }}>
          <Card>
            <View style={s.between}>
              <T style={s.eyebrow}>YOU SEND</T>
              <View style={s.row}>
                <Flag currency={draft.from} size={20} />
                <Badge>{currencyInfo[draft.from].country}</Badge>
              </View>
            </View>
            <View style={[s.row, { marginVertical: 20 }]}>
              <TextInput
                accessibilityLabel="You send amount"
                value={formatInputAmount(draft.amount)}
                onChangeText={(v) =>
                  patchDraft({ amount: v.replace(/,/g, "") })
                }
                keyboardType="decimal-pad"
                style={{
                  flex: 1,
                  fontSize: 43,
                  fontFamily: "DMSans_500Medium",
                  letterSpacing: -1.5,
                  color: C.text,
                  minWidth: 0,
                }}
              />
              <T style={{ fontSize: 21, color: C.muted }}>{draft.from}</T>
            </View>
            <Chips
              items={sendingCurrencies}
              value={draft.from}
              onChange={(from) =>
                patchDraft({
                  from,
                  fromBank: banks[from][0].name,
                  amount: from === "JPY" ? "100000" : "1000",
                  ...(from === draft.to
                    ? {
                        to: "INR",
                        toBank: "HDFC Bank",
                        recipient: { ...emptyRecipient },
                      }
                    : {}),
                })
              }
            />
            <View style={s.divider} />
            <T style={[s.eyebrow, { marginTop: 13, marginBottom: 12 }]}>
              FROM BANK
            </T>
            <Chips
              items={banks[draft.from].map((b) => b.name)}
              value={draft.fromBank}
              onChange={(fromBank) => patchDraft({ fromBank })}
            />
            <T style={{ fontSize: 11, color: C.muted, marginTop: 14 }}>
              Sample balance:{" "}
              {money(balances[bankKey(draft.from, draft.fromBank)], draft.from)}
            </T>
            {!!error && (
              <T
                accessibilityRole="alert"
                style={{ color: C.red, fontSize: 12, marginTop: 12 }}
              >
                {error}
              </T>
            )}
          </Card>
          <Card style={{ borderColor: "#2C4838", backgroundColor: "#101A15" }}>
            <View style={s.between}>
              <T style={[s.eyebrow, { color: "#9CB2A3" }]}>RECIPIENT GETS</T>
              <View style={s.row}>
                <Flag currency={draft.to} size={20} />
                <Badge color={C.green}>{currencyInfo[draft.to].country}</Badge>
              </View>
            </View>
            <T
              style={{
                fontSize: 39,
                fontFamily: "DMSans_500Medium",
                color: C.green,
                letterSpacing: -1.5,
                marginVertical: 17,
              }}
            >
              {quote ? money(quote.receiveAmount, draft.to) : "—"}
            </T>
            <T style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>
              {quote
                ? `1 ${draft.from} = ${quote.rate.toFixed(4)} ${draft.to}`
                : "Enter a valid amount to see your quote."}
            </T>
            <Chips
              items={allCurrencies.filter((c) => c !== draft.from)}
              value={draft.to}
              onChange={(to) =>
                patchDraft({
                  to,
                  toBank: banks[to][0].name,
                  recipient: { ...emptyRecipient },
                })
              }
            />
            <T style={[s.eyebrow, { marginTop: 22, marginBottom: 12 }]}>
              TO BANK
            </T>
            <Chips
              items={banks[draft.to].map((b) => b.name)}
              value={draft.toBank}
              onChange={(toBank) =>
                patchDraft({ toBank, recipient: { ...emptyRecipient } })
              }
            />
          </Card>
        </View>
        <View style={{ flex: 1, gap: 20 }}>
          <Card>
            <Toggle
              label="A little less in fees"
              description={`SEND5 · 5% off platform fee · ${draft.promo ? "Applied" : "Tap to apply"}`}
              value={draft.promo}
              onChange={(promo) => patchDraft({ promo })}
            />
          </Card>
          <Card>
            {quote ? (
              <CostSummary quote={quote} />
            ) : (
              <Empty
                title="Your quote goes here"
                body="Enter a valid amount to see the full cost."
              />
            )}
            <View style={{ marginTop: 22, gap: 16 }}>
              <Note>
                Sample rates. Your quote is held for 30 minutes at review and
                stored when you confirm. No real money is moved.
              </Note>
              {insufficient && (
                <T
                  accessibilityRole="alert"
                  style={{ color: C.red, fontSize: 12 }}
                >
                  Insufficient sample balance. Reduce your amount or choose
                  another bank.
                </T>
              )}
              <Button
                disabled={!quote || insufficient}
                onPress={() => nav.navigate("Recipient")}
              >
                Continue
              </Button>
            </View>
          </Card>
        </View>
      </View>
    </Shell>
  );
}
export function RecipientScreen() {
  const { draft, patchDraft, setQuote, savedRecipients } = useApp();
  const nav = useNav();
  const [error, setError] = useState("");
  const r = draft.recipient;
  const invalid = recipientError(r, draft.to);
  const patch = (p: Partial<typeof r>) =>
    patchDraft({ recipient: { ...r, ...p } });
  const saved = savedRecipients.filter(
    (item) => item.to === draft.to && item.bank === draft.toBank,
  );
  return (
    <Shell active="Send" narrow>
      <PageHeading
        title="Who gets the money?"
        subtitle={`${draft.toBank} · ${currencyInfo[draft.to].country} · ${draft.to}`}
        back
      />
      <View style={s.stack}>
        <View style={s.row}>
          <Badge>01 · Amount ✓</Badge>
          <Badge>02 · Recipient</Badge>
          <T style={s.small}>03 · Review</T>
        </View>
        <Card style={{ gap: 22 }}>
          {saved.length > 0 && (
            <View style={{ gap: 10 }}>
              <T style={s.eyebrow}>SAVED IN THIS SESSION</T>
              <Chips
                items={saved.map((item) => item.name)}
                value={r.name}
                onChange={(name) => {
                  const selected = saved.find((item) => item.name === name);
                  if (selected) patch({ ...selected });
                }}
              />
            </View>
          )}
          <Field
            label="Account holder name"
            placeholder="Full name as it appears on their account"
            value={r.name}
            onChangeText={(name) => patch({ name })}
          />
          <Field
            label="Account number"
            placeholder="Enter 6–18 digits"
            keyboardType="number-pad"
            maxLength={18}
            value={r.account}
            onChangeText={(account) =>
              patch({ account: account.replace(/\D/g, "") })
            }
            error={
              r.account && !/^\d{6,18}$/.test(r.account)
                ? "Account number must contain 6–18 digits."
                : undefined
            }
          />
          <Field
            label={draft.to === "INR" ? "IFSC code" : "SWIFT code"}
            placeholder={draft.to === "INR" ? "HDFC0001234" : "CHASUS33"}
            autoCapitalize="characters"
            maxLength={11}
            value={r.code}
            onChangeText={(code) =>
              patch({ code: code.toUpperCase().replace(/\s/g, "") })
            }
            error={
              (r.code && invalid.includes("code")) ||
              (r.code && invalid.includes("IFSC"))
                ? invalid
                : undefined
            }
          />
          <Toggle
            label="Save this recipient"
            description="Available during this demo session only."
            value={r.save}
            onChange={(save) => patch({ save })}
          />
        </Card>
        <Note>
          Use fictional details to try the demo. Check the recipient’s bank and
          account details before confirming.
        </Note>
        {!!error && <T style={{ color: C.red }}>{error}</T>}
        <Button
          disabled={!!invalid}
          onPress={() => {
            try {
              setQuote(demoService.createQuote(draft));
              setError("");
              nav.navigate("Review");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Review transfer
        </Button>
      </View>
    </Shell>
  );
}
export function ReviewScreen() {
  const { quote, user, confirm } = useApp();
  const nav = useNav();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now);
  const submitting = useRef(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!quote)
    return (
      <Shell active="Send">
        <Empty
          title="Start with an amount"
          body="Create a quote before reviewing your transfer."
          action="Send money"
          onPress={() => nav.navigate("Send")}
        />
      </Shell>
    );
  const expired = now >= Date.parse(quote.expiresAt);
  const remaining = Math.max(
    0,
    Math.ceil((Date.parse(quote.expiresAt) - now) / 60000),
  );
  return (
    <Shell active="Send" narrow>
      <PageHeading
        title="Everything look good?"
        subtitle="One last look before your support heads home."
        back
      />
      <View style={s.stack}>
        <View style={s.between}>
          <Badge>03 · Review & confirm</Badge>
          <Badge color={expired ? C.red : C.green}>
            {expired ? "Quote expired" : `Quote held · ${remaining} min left`}
          </Badge>
        </View>
        <Card>
          <CostSummary quote={quote} />
        </Card>
        <Card style={{ gap: 20 }}>
          <T style={s.eyebrow}>SENDING TO</T>
          <View style={s.row}>
            <View
              style={{
                padding: 12,
                backgroundColor: C.purpleDark,
                borderRadius: 15,
              }}
            >
              <UserRound size={23} color={C.purple} />
            </View>
            <View style={{ gap: 6 }}>
              <T style={{ fontFamily: "DMSans_600SemiBold", fontSize: 18 }}>
                {quote.recipient.name}
              </T>
              <T style={s.muted}>
                {quote.toBank} · {quote.to}
              </T>
            </View>
          </View>
          <T style={s.muted}>
            Account •••• {quote.recipient.account.slice(-4)} ·{" "}
            {quote.recipient.code}
          </T>
          <View style={s.divider} />
          <View style={s.between}>
            <T style={s.muted}>Paid from</T>
            <T>
              {quote.fromBank} · {quote.from}
            </T>
          </View>
        </Card>
        <Note warning>
          {user?.guest ? "You’re exploring as a guest. " : ""}This is a sample
          transfer. Only your demo balance will change; no money will leave a
          bank account.
        </Note>
        {!!error && (
          <T accessibilityRole="alert" style={{ color: C.red }}>
            {error}
          </T>
        )}
        {expired ? (
          <Button onPress={() => nav.navigate("Recipient")}>
            Refresh quote
          </Button>
        ) : (
          <Button
            variant="green"
            disabled={busy}
            onPress={async () => {
              if (submitting.current) return;
              submitting.current = true;
              setBusy(true);
              try {
                const transfer = await confirm();
                nav.replace("Success", { id: transfer.id });
              } catch (e) {
                setError((e as Error).message);
                submitting.current = false;
                setBusy(false);
              }
            }}
          >
            {busy
              ? "Starting transfer…"
              : `Confirm and send ${money(quote.totalCost, quote.from)}`}
          </Button>
        )}
      </View>
    </Shell>
  );
}
export function SuccessScreen({
  route,
}: {
  route: { params: { id: string } };
}) {
  const { transfers } = useApp();
  const nav = useNav();
  const transfer = transfers.find((t) => t.id === route.params.id);
  return (
    <Shell active="Send" narrow>
      <View style={{ alignItems: "center", paddingVertical: 50, gap: 24 }}>
        <View
          style={{
            height: 104,
            width: 104,
            borderRadius: 52,
            backgroundColor: C.greenDark,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "#305640",
          }}
        >
          <Check size={46} color={C.green} />
        </View>
        <Badge color={C.green}>SAMPLE TRANSFER · PROCESSING</Badge>
        <T
          style={{
            fontSize: 36,
            fontFamily: "DMSans_600SemiBold",
            letterSpacing: -1,
          }}
        >
          A little love, on its way.
        </T>
        <T
          style={{
            color: C.muted,
            fontSize: 16,
            lineHeight: 25,
            textAlign: "center",
          }}
        >
          {transfer
            ? `${money(transfer.quote.receiveAmount, transfer.quote.to)} is on its way to ${transfer.quote.recipient.name}.`
            : "Your transfer has started."}
        </T>
        <Card style={{ width: "100%", maxWidth: 430, gap: 20 }}>
          <View style={s.between}>
            <T style={s.muted}>Reference number</T>
            <T>{transfer?.id}</T>
          </View>
          <View style={s.between}>
            <T style={s.muted}>Status</T>
            <Badge>Processing</Badge>
          </View>
          <T style={{ fontSize: 12, color: C.muted, lineHeight: 20 }}>
            Your sample transfer is saved in this session. Processing is a demo
            status; no bank payout is initiated.
          </T>
        </Card>
        <View style={{ width: "100%", maxWidth: 430, gap: 12 }}>
          <Button onPress={() => nav.navigate("History")}>View history</Button>
          <Button variant="secondary" onPress={() => nav.navigate("Home")}>
            Back to home
          </Button>
        </View>
      </View>
    </Shell>
  );
}
