import {
  ChevronRight,
  HelpCircle,
  Info,
  Minus,
  Plus,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { Shell } from "../components/Shell";
import {
  Badge,
  Brand,
  Button,
  C,
  Card,
  Chips,
  Field,
  Link,
  Note,
  PageHeading,
  T,
  Toggle,
  s,
} from "../components/ui";
import {
  sendingCurrencies,
  validEmail,
  validMobile,
  validName,
} from "../domain/data";
import { useNav } from "../navigation";
import { apiConfigured } from "../services/api";
import { useApp } from "../store";
export function MenuScreen() {
  const nav = useNav();
  const { user, reset } = useApp();
  const items = [
    {
      name: "Profile",
      detail: "Your details, always up to date",
      route: "Profile" as const,
      icon: UserRound,
    },
    {
      name: "Settings",
      detail: "Make BridgePay feel like you",
      route: "Settings" as const,
      icon: Settings,
    },
    {
      name: "Help center",
      detail: "A little help, whenever you need it",
      route: "Help" as const,
      icon: HelpCircle,
    },
    {
      name: "About BridgePay",
      detail: "Our story and the important details",
      route: "About" as const,
      icon: Info,
    },
  ];
  return (
    <Shell active="Menu" narrow>
      <PageHeading kicker="YOUR BRIDGEPAY" title="Make yourself at home." />
      <View style={s.stack}>
        <Card style={{ gap: 18 }}>
          <View style={s.row}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: C.purpleDark,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <T style={{ color: C.purple, fontSize: 24 }}>{user?.name[0]}</T>
            </View>
            <View style={{ gap: 6 }}>
              <T style={{ fontSize: 23, fontFamily: "DMSans_600SemiBold" }}>
                {user?.name}
              </T>
              <T style={s.muted}>
                {user?.guest ? "Guest account" : user?.email || user?.mobile}
              </T>
            </View>
          </View>
          <Badge>
            {user?.guest
              ? "Exploring as a guest"
              : "Demo account · contact verification simulated"}
          </Badge>
        </Card>
        <Card style={{ paddingVertical: 8 }}>
          {items.map((item, i) => (
            <Pressable
              accessibilityRole="button"
              key={item.name}
              onPress={() => nav.navigate(item.route)}
              style={[
                s.row,
                {
                  paddingVertical: 22,
                  borderBottomWidth: i < items.length - 1 ? 1 : 0,
                  borderColor: C.border,
                },
              ]}
            >
              <item.icon size={21} color={C.purple} />
              <View style={{ flex: 1, gap: 5 }}>
                <T>{item.name}</T>
                <T style={s.small}>{item.detail}</T>
              </View>
              <ChevronRight size={18} color={C.muted} />
            </Pressable>
          ))}
        </Card>
        <Button
          variant={user?.guest ? "primary" : "secondary"}
          icon={false}
          onPress={() => {
            if (user?.guest) {
              nav.navigate("Signup");
            } else {
              reset();
              nav.reset({ index: 0, routes: [{ name: "Welcome" }] });
            }
          }}
        >
          {user?.guest ? "Create account" : "Log out"}
        </Button>
        <T style={{ textAlign: "center", fontSize: 11, color: C.muted }}>
          Session data clears when you log out or reload the app.
        </T>
      </View>
    </Shell>
  );
}
export function ProfileScreen() {
  const { user, setUser, setPendingUser, connected } = useApp();
  const nav = useNav();
  const [name, setName] = useState(user?.guest ? "" : user?.name || "");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saved, setSaved] = useState(false);
  const valid = validName(name) && validEmail(email) && validMobile(mobile);
  return (
    <Shell active="Menu" narrow>
      <PageHeading
        title="Your profile."
        subtitle="The little details that keep you connected."
        back
      />
      <View style={s.stack}>
        <Card style={{ gap: 22 }}>
          <Field
            editable={!connected}
            label="Full name"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setSaved(false);
            }}
          />
          <Field
            editable={!connected}
            label="Mobile number"
            value={mobile}
            keyboardType="phone-pad"
            onChangeText={(v) => {
              setMobile(v);
              setSaved(false);
            }}
            error={
              mobile && !validMobile(mobile)
                ? "Enter a valid mobile number."
                : undefined
            }
          />
          <Field
            editable={!connected}
            label="Email address"
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={(v) => {
              setEmail(v);
              setSaved(false);
            }}
            error={
              email && !validEmail(email)
                ? "Enter a valid email address."
                : undefined
            }
          />
          <T style={s.small}>
            {connected
              ? "Profile editing is not yet available for connected accounts."
              : "Changing your contact details opens demo verification."}
          </T>
        </Card>
        <Card>
          <View style={s.between}>
            <T>Identity verification</T>
            <Badge color={C.amber}>Not verified</Badge>
          </View>
          <Link onPress={() => nav.navigate("Identity")}>
            Learn about identity verification →
          </Link>
        </Card>
        {saved && <Note>Profile changes saved for this session.</Note>}
        <Button
          disabled={!valid || connected}
          onPress={() => {
            if (apiConfigured && user?.guest) {
              nav.navigate("Signup");
              return;
            }
            const updated = {
              ...user!,
              name: name.trim(),
              mobile: mobile.trim(),
              email: email.trim(),
              guest: false,
            };
            if (
              mobile.trim() !== user?.mobile ||
              email.trim() !== user?.email ||
              user.guest
            ) {
              setPendingUser({
                ...updated,
                mobileVerified: false,
                emailVerified: false,
              });
              nav.navigate("Verify");
            } else {
              setUser(updated);
              setSaved(true);
            }
          }}
        >
          Save changes
        </Button>
      </View>
    </Shell>
  );
}
export function SettingsScreen() {
  const { settings, setSettings, reset, user, transfers, connected } = useApp();
  const nav = useNav();
  const [deleting, setDeleting] = useState(false);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState("");
  return (
    <Shell active="Menu" narrow>
      <PageHeading
        title="Your preferences."
        subtitle="A few small things, just the way you like them."
        back
      />
      <View style={s.stack}>
        <Card style={{ gap: 25 }}>
          <Toggle
            label="Notifications"
            description="Demo preference · delivery isn’t connected."
            value={settings.notifications}
            onChange={(notifications) =>
              setSettings({ ...settings, notifications })
            }
          />
          <Toggle
            label="Biometric login"
            description="Demo preference · device authentication isn’t enabled."
            value={settings.biometrics}
            onChange={(biometrics) => setSettings({ ...settings, biometrics })}
          />
          <Toggle
            label="Rate alerts"
            description="Demo preference · sample rates only."
            value={settings.alerts}
            onChange={(alerts) => setSettings({ ...settings, alerts })}
          />
        </Card>
        <Card style={{ gap: 20 }}>
          <T>Default balance currency</T>
          <Chips
            items={sendingCurrencies}
            value={settings.currency}
            onChange={(currency) => setSettings({ ...settings, currency })}
          />
          <View style={s.divider} />
          <View style={s.between}>
            <T>Language</T>
            <T style={s.muted}>English</T>
          </View>
          <T style={s.small}>
            More languages will be available in a future release.
          </T>
        </Card>
        <Card style={{ gap: 18 }}>
          <T style={{ fontSize: 18, fontFamily: "DMSans_600SemiBold" }}>
            Your data, your choice.
          </T>
          <T style={{ color: C.muted, fontSize: 12, lineHeight: 20 }}>
            {connected
              ? "Your demo records are saved on the server. Export covers the transfers currently loaded in History."
              : "Guest details stay in memory and clear when you reload."}{" "}
            Export includes masked account numbers.
          </T>
          <Button
            variant="secondary"
            icon={false}
            onPress={async () => {
              setExportError("");
              try {
                const data = JSON.stringify(
                  {
                    profile: user,
                    preferences: settings,
                    transfers: transfers.map((t) => ({
                      ...t,
                      quote: {
                        ...t.quote,
                        recipient: {
                          name: t.quote.recipient.name,
                          account: "••••" + t.quote.recipient.account.slice(-4),
                        },
                      },
                    })),
                  },
                  null,
                  2,
                );
                if (Platform.OS === "web") {
                  const blob = new Blob([data], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "bridgepay-demo-data.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } else {
                  const { Share } = await import("react-native");
                  await Share.share({ message: data });
                }
                setExported(true);
              } catch {
                setExportError("Couldn’t export your data. Please try again.");
              }
            }}
          >
            Export my demo data
          </Button>
          {exported && (
            <T style={{ fontSize: 12, color: C.green }}>
              Your data export is ready.
            </T>
          )}
          {!!exportError && (
            <T style={{ fontSize: 12, color: C.red }}>{exportError}</T>
          )}
          {deleting ? (
            <View style={{ gap: 12 }}>
              <Note warning>
                {connected
                  ? "Clear this device’s session and return to Welcome? Your account and transfers remain saved on the server."
                  : "Delete your session data and return to Welcome? Sample fixtures will reset."}
              </Note>
              <Button
                variant="secondary"
                icon={false}
                onPress={() => {
                  reset();
                  nav.reset({ index: 0, routes: [{ name: "Welcome" }] });
                }}
              >
                {connected
                  ? "Yes, clear this session"
                  : "Yes, delete my session data"}
              </Button>
              <Link onPress={() => setDeleting(false)}>Cancel</Link>
            </View>
          ) : (
            <Link color={C.red} onPress={() => setDeleting(true)}>
              {connected ? "Clear this session" : "Delete my demo data"}
            </Link>
          )}
        </Card>
      </View>
    </Shell>
  );
}
const faqs = [
  {
    q: "How long does a transfer take?",
    a: "This demo creates a Processing record immediately. Real delivery time depends on the corridor, bank, verification, and licensed payout partner. A live service must show the partner’s delivery estimate before payment.",
  },
  {
    q: "What does it cost?",
    a: "The platform fee is 0.4% of the amount you send. Your bank may add a separate fee. SEND5 takes 5% off the platform fee. Every applicable fee and your total cost are shown before you confirm.",
  },
  {
    q: "Is the rate locked?",
    a: "Your sample quote is held for 30 minutes from the review step. If it expires, refresh the quote before confirming. The exact rate and fees are stored in your transfer receipt.",
  },
  {
    q: "Why do you need my mobile and email?",
    a: "A live account uses both for contact verification and account recovery. Connected accounts use an email and password. The offline demo accepts any four-digit code. Neither mode sends SMS or email.",
  },
  {
    q: "How does the referral program work?",
    a: "The proposed referral offer is ¥1,000 credit for you and a friend. It has not launched, and the demo does not award credits. Final eligibility and terms will be available with the live program.",
  },
  {
    q: "Is this moving real money?",
    a: "No. Balances, rates, transfers, identity checks, and account verification are simulated. Please use fictional account details. Guest session data clears on reload or logout. Connected accounts keep their demo transfers and recipients on the server.",
  },
];
export function HelpScreen() {
  const [open, setOpen] = useState<number | null>(0);
  const [contact, setContact] = useState("");
  return (
    <Shell active="Menu" narrow>
      <PageHeading
        kicker="WE’RE HERE FOR YOU"
        title="A little help goes a long way."
        subtitle="Good questions. Clear answers."
        back
      />
      <View style={s.stack}>
        <Card style={{ paddingVertical: 8 }}>
          {faqs.map((item, i) => (
            <View
              key={item.q}
              style={{
                borderBottomWidth: i < faqs.length - 1 ? 1 : 0,
                borderColor: C.border,
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open === i }}
                onPress={() => setOpen(open === i ? null : i)}
                style={[s.between, { paddingVertical: 20 }]}
              >
                <T style={{ flex: 1, fontSize: 14 }}>{item.q}</T>
                {open === i ? (
                  <Minus size={16} color={C.purple} />
                ) : (
                  <Plus size={16} color={C.muted} />
                )}
              </Pressable>
              {open === i && (
                <T
                  style={{
                    color: C.muted,
                    fontSize: 13,
                    lineHeight: 23,
                    paddingBottom: 20,
                  }}
                >
                  {item.a}
                </T>
              )}
            </View>
          ))}
        </Card>
        <Card style={{ gap: 18 }}>
          <T style={{ fontSize: 20, fontFamily: "DMSans_600SemiBold" }}>
            Need a human?
          </T>
          <T style={s.muted}>
            Support channels will open with the live service.
          </T>
          <View style={s.row}>
            <Button
              variant="secondary"
              style={{ flex: 1 }}
              icon={false}
              onPress={() =>
                setContact(
                  "Live chat isn’t connected in this demo. Browse the questions above for guidance.",
                )
              }
            >
              Chat with us
            </Button>
            <Button
              variant="secondary"
              style={{ flex: 1 }}
              icon={false}
              onPress={() =>
                setContact(
                  "A support email address hasn’t been configured. The app owner can add it when the service launches.",
                )
              }
            >
              Email support
            </Button>
          </View>
          {!!contact && <Note>{contact}</Note>}
        </Card>
      </View>
    </Shell>
  );
}
export function AboutScreen() {
  return (
    <Shell active="Menu" narrow>
      <PageHeading title="Built to bring you closer." back />
      <View style={s.stack}>
        <Card style={{ gap: 23, padding: 30 }}>
          <Brand size={44} />
          <Badge>VERSION 1.0.0 · DEMO</Badge>
          <T
            style={{
              fontSize: 25,
              lineHeight: 34,
              fontFamily: "DMSans_500Medium",
            }}
          >
            Send money home.{"\n"}Fast, fair, transparent.
          </T>
          <T style={{ color: C.muted, lineHeight: 24 }}>
            BridgePay is an international transfer app concept built around a
            simple promise: see the full cost before you send. Made for the
            moments, and the people, that matter.
          </T>
        </Card>
        <Card style={{ gap: 20 }}>
          <T style={{ fontSize: 20 }}>The important details</T>
          {[
            {
              title: "Licensing partner",
              body: "No payment partner is connected. BridgePay is not offering a live remittance service in this demo.",
            },
            {
              title: "Terms of use",
              body: "This build is for demonstration and evaluation only. No payments, deposits, or bank connections are made. Sample quotes are not offers of a real exchange rate.",
            },
            {
              title: "Privacy",
              body: "Use fictional data. Connected accounts store their demo transfers and recipients on the server. Guest data stays in memory. No payment provider receives these details. Clearing a session does not delete a server account.",
            },
            {
              title: "Complaints & support",
              body: "A live support channel and complaints process must be published before launch. Contact the app owner about this prototype.",
            },
          ].map((item) => (
            <View key={item.title} style={{ gap: 7 }}>
              <T style={{ fontSize: 13, color: C.purple }}>{item.title}</T>
              <T style={{ fontSize: 12, color: C.muted, lineHeight: 21 }}>
                {item.body}
              </T>
            </View>
          ))}
        </Card>
      </View>
    </Shell>
  );
}
export function IdentityScreen() {
  return (
    <Shell active="Menu" narrow>
      <PageHeading
        title="A safer way to connect."
        subtitle="Identity verification"
        back
      />
      <View style={s.stack}>
        <Card style={{ gap: 22 }}>
          <ShieldCheck size={42} color={C.purple} />
          <Badge color={C.amber}>Not connected in this demo</Badge>
          <T style={{ fontSize: 22 }}>Your identity, protected.</T>
          <T style={{ color: C.muted, lineHeight: 25 }}>
            Before a real transfer, BridgePay will need to verify your identity
            through a secure verification partner. Depending on your country,
            this may include a government ID, a selfie, and proof of address.
          </T>
          <Note>
            Document uploads are unavailable until a verification provider is
            connected. Please don’t submit identity documents to this prototype.
          </Note>
        </Card>
      </View>
    </Shell>
  );
}
