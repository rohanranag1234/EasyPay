import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowDown,
  ArrowUpRight,
  Eye,
  EyeOff,
  Gift,
  Globe2,
  Landmark,
  RefreshCw,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Flag } from "../components/Flag";
import { Shell } from "../components/Shell";
import {
  Badge,
  Button,
  C,
  Card,
  CurrencyPill,
  Empty,
  Link,
  PageHeading,
  T,
  TransferRow,
  s,
} from "../components/ui";
import {
  formatInputAmount,
  amountError,
  calculate,
  money,
  rateFor,
} from "../domain/calc";
import { bankKey, banks, currencyInfo } from "../domain/data";
import { useNav } from "../navigation";
import { demoService } from "../services/demo";
import { useApp } from "../store";
export function HomeScreen() {
  const { user, transfers, balances, setBalances, patchDraft, settings } =
    useApp();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const wide = width >= 1150;
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("100000");
  const currency = settings.currency;
  const bank = banks[currency][0].name;
  const refresh = async () => {
    setLoading(true);
    setError("");
    try {
      setBalances(await demoService.getBalances());
    } catch {
      setError("Couldn’t refresh balance. Tap to retry.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    let cancelled = false;
    demoService
      .getBalances()
      .then(
        (next) => {
          if (!cancelled) setBalances(next);
        },
        () => {
          if (!cancelled) setError("Couldn’t refresh balance. Tap to retry.");
        },
      )
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setBalances]);
  const startSend = (promo = false) => {
    patchDraft({ promo });
    nav.navigate("Send");
  };
  const quickError = amountError(amount, "JPY", "INR");
  const quick = !quickError
    ? calculate({ amount: Number(amount), from: "JPY", to: "INR", promo: true })
    : null;
  return (
    <Shell>
      <PageHeading
        kicker="YOUR MONEY, CLOSER TO HOME"
        title={`Good to see you, ${user?.guest ? "Guest" : user?.name.split(" ")[0]}.`}
        subtitle="A little support can go a long way. Let’s send some home."
        aside={
          width > 650 ? (
            <View style={[s.row, { gap: 6 }]}>
              <View
                style={{
                  height: 6,
                  width: 6,
                  backgroundColor: C.green,
                  borderRadius: 3,
                }}
              />
              <T style={{ fontSize: 11, color: C.muted }}>
                All systems operational · demo
              </T>
            </View>
          ) : undefined
        }
      />
      <View style={{ flexDirection: wide ? "row" : "column", gap: 24 }}>
        <View style={{ flex: wide ? 1.65 : undefined, gap: 24 }}>
          <LinearGradient
            colors={["#142D23", "#0F201A", "#111B19"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 22,
              padding: 26,
              borderWidth: 1,
              borderColor: "#284336",
              overflow: "hidden",
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 290,
                height: 290,
                borderWidth: 1,
                borderColor: "#294638",
                borderRadius: 150,
                right: -97,
                top: 45,
              }}
            />
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 210,
                height: 210,
                borderWidth: 1,
                borderColor: "#294638",
                borderRadius: 150,
                right: -57,
                top: 85,
              }}
            />
            <View style={s.between}>
              <View style={[s.row, { gap: 10 }]}>
                <T style={[s.eyebrow, { color: "#ABC4B6" }]}>BANK BALANCE</T>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={hidden ? "Show balance" : "Hide balance"}
                  onPress={() => setHidden(!hidden)}
                >
                  {hidden ? (
                    <EyeOff size={14} color="#7C9F8A" />
                  ) : (
                    <Eye size={14} color="#7C9F8A" />
                  )}
                </Pressable>
              </View>
              <Badge color={C.green}>Sample balance</Badge>
            </View>
            <View style={{ marginTop: 20, marginBottom: 6 }}>
              {loading ? (
                <ActivityIndicator
                  color={C.green}
                  style={{ height: 56, alignSelf: "flex-start" }}
                />
              ) : error ? (
                <Pressable onPress={refresh}>
                  <T style={{ color: C.amber }}>{error}</T>
                </Pressable>
              ) : (
                <T
                  style={{
                    fontSize: width < 430 ? 38 : 46,
                    fontFamily: "DMSans_500Medium",
                    letterSpacing: -1.8,
                    color: C.green,
                  }}
                >
                  {hidden
                    ? "••••••"
                    : money(balances[bankKey(currency, bank)], currency)}
                </T>
              )}
            </View>
            <View style={[s.row, { gap: 7 }]}>
              <Landmark size={14} color="#9CB3A6" />
              <T style={{ fontSize: 12, color: "#ACC0B4" }}>
                {bank} <T style={{ color: "#5C7A68" }}> •••• </T>4829
              </T>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: "#294035",
                marginTop: 24,
                marginBottom: 17,
              }}
            />
            <View style={s.between}>
              <View style={[s.row, { gap: 6 }]}>
                <View
                  style={{
                    height: 5,
                    width: 5,
                    borderRadius: 5,
                    backgroundColor: C.green,
                  }}
                />
                <T style={{ fontSize: 10, color: "#A0BAAC" }}>
                  Linked sample account
                </T>
              </View>
              <Pressable
                accessibilityLabel="Refresh balance"
                onPress={refresh}
                style={[s.row, { gap: 5 }]}
              >
                <RefreshCw size={10} color="#8BA697" />
                <T style={{ fontSize: 10, color: "#8BA697" }}>Refresh</T>
              </Pressable>
            </View>
          </LinearGradient>
          <View style={{ gap: 12, marginTop: -10 }}>
            <Button onPress={() => startSend()}>Send money</Button>
            <View style={s.row}>
              <Button
                style={{ flex: 1, minHeight: 45 }}
                variant="secondary"
                icon={false}
                onPress={() => nav.navigate("Rates")}
              >
                Check rates ↗
              </Button>
              <Button
                style={{ flex: 1, minHeight: 45 }}
                variant="secondary"
                icon={false}
                onPress={() => nav.navigate("History")}
              >
                View history
              </Button>
            </View>
          </View>
          <View style={{ gap: 13 }}>
            <View style={s.between}>
              <T style={{ fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>
                A little extra, for you
              </T>
              <View style={[s.row, { gap: 5 }]}>
                <View
                  style={{
                    height: 5,
                    width: 16,
                    borderRadius: 4,
                    backgroundColor: C.purple,
                  }}
                />
                <View
                  style={{
                    height: 5,
                    width: 5,
                    borderRadius: 4,
                    backgroundColor: "#41414A",
                  }}
                />
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => startSend(true)}
            >
              <LinearGradient
                colors={["#302444", "#211B30"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#493A61",
                  padding: 24,
                  minHeight: 174,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    right: width < 600 ? -74 : -8,
                    opacity: width < 600 ? 0.32 : 1,
                    top: 10,
                    width: 180,
                    height: 180,
                    alignItems: "center",
                    justifyContent: "center",
                    transform: [{ rotate: "-18deg" }],
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      height: 134,
                      width: 134,
                      borderWidth: 1,
                      borderColor: "#66527E",
                      borderRadius: 70,
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      height: 174,
                      width: 174,
                      borderWidth: 1,
                      borderColor: "#4F3F66",
                      borderRadius: 90,
                    }}
                  />
                  <T
                    style={{
                      fontSize: 91,
                      color: "#B69ADA",
                      fontFamily: "DMSans_500Medium",
                      opacity: 0.85,
                    }}
                  >
                    %
                  </T>
                </View>
                <T
                  style={{
                    fontSize: 9,
                    letterSpacing: 1.8,
                    color: "#C5AADF",
                    fontFamily: "DMSans_600SemiBold",
                  }}
                >
                  LESS IN FEES. MORE IN LOVE.
                </T>
                <T
                  style={{
                    fontSize: 26,
                    fontFamily: "DMSans_600SemiBold",
                    letterSpacing: -0.8,
                    marginTop: 10,
                  }}
                >
                  Your next transfer,{"\n"}with 5% off fees.
                </T>
                <View style={[s.row, { marginTop: 15, gap: 8 }]}>
                  <T style={{ fontSize: 11, color: "#C0AECF" }}>Use code</T>
                  <View
                    style={{
                      borderWidth: 1,
                      borderColor: "#746083",
                      borderStyle: "dashed",
                      paddingHorizontal: 9,
                      paddingVertical: 3,
                      borderRadius: 5,
                    }}
                  >
                    <T
                      style={{
                        fontSize: 10,
                        color: "#E4D3F4",
                        letterSpacing: 1,
                      }}
                    >
                      SEND5
                    </T>
                  </View>
                  <ArrowUpRight size={16} color={C.purple} />
                </View>
              </LinearGradient>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => startSend()}
              style={[
                s.between,
                {
                  padding: 16,
                  borderRadius: 14,
                  backgroundColor: "#151618",
                  borderWidth: 1,
                  borderColor: C.border,
                },
              ]}
            >
              <View style={s.row}>
                <View
                  style={{
                    height: 32,
                    width: 32,
                    backgroundColor: C.greenDark,
                    borderRadius: 10,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Landmark size={16} color={C.green} />
                </View>
                <View style={{ gap: 3 }}>
                  <T style={{ fontSize: 12 }}>
                    Closer to India, with HDFC & SBI
                  </T>
                  <T style={{ fontSize: 10, color: C.muted }}>
                    Explore our bank payout options
                  </T>
                </View>
              </View>
              <ArrowUpRight size={16} color={C.muted} />
            </Pressable>
          </View>
          <Card>
            <View style={[s.between, { marginBottom: 4 }]}>
              <T style={{ fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>
                Recent transfers
              </T>
              <Link onPress={() => nav.navigate("History")}>View all ↗</Link>
            </View>
            {transfers.length === 0 ? (
              <Empty
                title="Your first hello home"
                body="Your transfers will appear here."
              />
            ) : (
              transfers.slice(0, 2).map((transfer, i) => (
                <View
                  key={transfer.id}
                  style={{ borderTopWidth: i ? 1 : 0, borderColor: "#24252A" }}
                >
                  <TransferRow transfer={transfer} />
                </View>
              ))
            )}
            <T style={{ color: "#686975", fontSize: 10, marginTop: 4 }}>
              Includes sample transfer activity
            </T>
          </Card>
        </View>
        <View style={{ flex: wide ? 1 : undefined, gap: 24 }}>
          <Card>
            <View style={[s.between, { marginBottom: 22 }]}>
              <T style={{ fontSize: 17, fontFamily: "DMSans_600SemiBold" }}>
                A quick look before you send
              </T>
              <ArrowUpRight size={19} color={C.purple} />
            </View>
            <View
              style={{
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 13,
                padding: 17,
                gap: 11,
              }}
            >
              <T style={{ fontSize: 11, color: C.muted }}>You send</T>
              <View style={s.between}>
                <TextInput
                  accessibilityLabel="Quick send amount"
                  keyboardType="numeric"
                  value={formatInputAmount(amount)}
                  onChangeText={(value) => setAmount(value.replace(/,/g, ""))}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    color: C.text,
                    fontSize: 29,
                    fontFamily: "DMSans_500Medium",
                    letterSpacing: -1,
                  }}
                />
                <CurrencyPill currency="JPY" />
              </View>
            </View>
            <View
              style={[
                s.row,
                { marginVertical: 12, justifyContent: "center", gap: 8 },
              ]}
            >
              <View
                style={{
                  backgroundColor: C.purpleDark,
                  padding: 5,
                  borderRadius: 20,
                }}
              >
                <ArrowDown size={12} color={C.purple} />
              </View>
              <T style={{ fontSize: 10, color: C.muted }}>
                1 JPY ={" "}
                <T style={{ fontSize: 10, color: C.purple }}>0.6080 INR</T>
              </T>
            </View>
            <View
              style={{
                borderWidth: 1,
                borderColor: "#294334",
                backgroundColor: "#101D16",
                borderRadius: 13,
                padding: 17,
                gap: 11,
              }}
            >
              <T style={{ fontSize: 11, color: "#A0B3A6" }}>They receive</T>
              <View style={s.between}>
                <T
                  style={{
                    fontSize: 29,
                    color: C.green,
                    fontFamily: "DMSans_500Medium",
                    letterSpacing: -1,
                    flex: 1,
                  }}
                >
                  {quick
                    ? new Intl.NumberFormat("en-US", {
                        maximumFractionDigits: 2,
                      }).format(quick.receiveAmount)
                    : "—"}
                </T>
                <CurrencyPill currency="INR" />
              </View>
            </View>
            {quickError ? (
              <T style={{ fontSize: 11, color: C.red, marginTop: 12 }}>
                {quickError}
              </T>
            ) : (
              <View style={{ gap: 12, marginVertical: 20 }}>
                <View style={s.between}>
                  <T style={s.small}>Platform fee (0.4%)</T>
                  <T style={{ fontSize: 12 }}>
                    {money(quick!.platformFee, "JPY")}
                  </T>
                </View>
                <View style={s.between}>
                  <T style={{ fontSize: 11, color: C.green }}>SEND5 discount</T>
                  <T style={{ fontSize: 12, color: C.green }}>
                    −{money(quick!.promoDiscount, "JPY")}
                  </T>
                </View>
                <View style={{ height: 1, backgroundColor: C.border }} />
                <View style={s.between}>
                  <T style={{ fontSize: 12 }}>Total cost</T>
                  <T
                    style={{
                      fontSize: 18,
                      color: C.purple,
                      fontFamily: "DMSans_600SemiBold",
                    }}
                  >
                    {money(quick!.totalCost, "JPY")}
                  </T>
                </View>
              </View>
            )}
            <Button
              disabled={!!quickError}
              variant="secondary"
              onPress={() => {
                patchDraft({
                  amount,
                  from: "JPY",
                  to: "INR",
                  fromBank: "JP Bank",
                  toBank: "HDFC Bank",
                  promo: true,
                });
                nav.navigate("Send");
              }}
            >
              Get started
            </Button>
            <T
              style={{
                fontSize: 10,
                color: "#777882",
                textAlign: "center",
                marginTop: 13,
              }}
            >
              Sample rate · All fees shown upfront
            </T>
          </Card>
          <Card>
            <View style={s.between}>
              <T style={{ fontSize: 16, fontFamily: "DMSans_600SemiBold" }}>
                The world, at a glance
              </T>
              <Globe2 size={18} color={C.muted} />
            </View>
            <T
              style={{
                fontSize: 11,
                color: C.muted,
                marginTop: 6,
                marginBottom: 10,
              }}
            >
              Today’s sample rates · 1 JPY
            </T>
            {(["INR", "USD", "EUR"] as const).map((currency) => (
              <View
                key={currency}
                style={[
                  s.between,
                  {
                    paddingVertical: 15,
                    borderBottomWidth: 1,
                    borderColor: "#24252A",
                  },
                ]}
              >
                <View style={s.row}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: C.raised,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Flag currency={currency} />
                  </View>
                  <View style={{ gap: 3 }}>
                    <T style={{ fontSize: 12, fontFamily: "DMSans_500Medium" }}>
                      {currency}
                    </T>
                    <T style={{ fontSize: 10, color: C.muted }}>
                      {currencyInfo[currency].name}
                    </T>
                  </View>
                </View>
                <T
                  style={{
                    fontSize: 14,
                    color: C.green,
                    fontFamily: "DMSans_500Medium",
                  }}
                >
                  {rateFor("JPY", currency).toFixed(4)}
                </T>
              </View>
            ))}
            <View style={{ marginTop: 11 }}>
              <Link onPress={() => nav.navigate("Rates")}>
                Explore all exchange rates ↗
              </Link>
            </View>
          </Card>
          <View style={{ flexDirection: "row", gap: 13, paddingHorizontal: 6 }}>
            <View
              style={{
                height: 35,
                width: 35,
                borderRadius: 12,
                backgroundColor: "#19171F",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Gift size={17} color={C.purple} />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <T style={{ fontSize: 13, fontFamily: "DMSans_500Medium" }}>
                Good things are better shared.
              </T>
              <T style={{ fontSize: 11, color: C.muted, lineHeight: 18 }}>
                Invite a friend. ¥1,000 credit each when our referral program
                launches.
              </T>
              <Link onPress={() => nav.navigate("Help")}>Learn more ↗</Link>
            </View>
          </View>
        </View>
      </View>
    </Shell>
  );
}
