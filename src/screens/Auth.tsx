import { LinearGradient } from "expo-linear-gradient";
import { ArrowDown, Check, Globe2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Badge,
  Brand,
  Button,
  C,
  Field,
  Link,
  Note,
  T,
  s,
} from "../components/ui";
import { validEmail, validMobile, validName } from "../domain/data";
import { useNav } from "../navigation";
import { useApp } from "../store";
export function SplashScreen() {
  const nav = useNav();
  useEffect(() => {
    const timer = setTimeout(() => nav.replace("Welcome"), 1200);
    return () => clearTimeout(timer);
  }, [nav]);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.bg,
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <Brand size={54} />
      <T style={s.muted}>Send money home. Fast, fair, transparent.</T>
    </View>
  );
}
function AuthLayout({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: width > 900 ? 48 : 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Brand size={34} />
          <View
            style={{
              flex: 1,
              flexDirection: width > 900 ? "row" : "column",
              alignItems: "center",
              justifyContent: "center",
              gap: width > 900 ? 100 : 32,
              paddingVertical: width > 900 ? 50 : 35,
            }}
          >
            {width > 900 && (
              <View style={{ maxWidth: 490, flex: 1, gap: 24 }}>
                <Badge>ACROSS BORDERS. CLOSE TO HOME.</Badge>
                <T
                  style={{
                    fontSize: 58,
                    fontFamily: "DMSans_600SemiBold",
                    letterSpacing: -2.5,
                    lineHeight: 65,
                  }}
                >
                  Miles apart.{"\n"}Always{" "}
                  <T
                    style={{
                      fontSize: 58,
                      fontFamily: "DMSans_600SemiBold",
                      color: C.purple,
                    }}
                  >
                    connected.
                  </T>
                </T>
                <T
                  style={{
                    fontSize: 16,
                    color: C.muted,
                    lineHeight: 27,
                    maxWidth: 390,
                  }}
                >
                  For the people who make anywhere feel like home. Send your
                  support with every cost clear from the start.
                </T>
                <LinearGradient
                  colors={["#2C223C", "#171B22"]}
                  style={{
                    borderWidth: 1,
                    borderColor: "#43364F",
                    padding: 28,
                    borderRadius: 24,
                    marginTop: 10,
                    gap: 20,
                  }}
                >
                  <View style={s.between}>
                    <T style={s.muted}>From you in Japan</T>
                    <Badge>Sample transfer</Badge>
                  </View>
                  <T
                    style={{
                      fontSize: 40,
                      color: C.purple,
                      fontFamily: "DMSans_500Medium",
                    }}
                  >
                    ¥100,000
                  </T>
                  <View style={s.row}>
                    <View
                      style={{ height: 1, backgroundColor: "#4D415D", flex: 1 }}
                    />
                    <View
                      style={{
                        padding: 10,
                        backgroundColor: "#3E324E",
                        borderRadius: 30,
                      }}
                    >
                      <ArrowDown color={C.purple} size={18} />
                    </View>
                    <View
                      style={{ height: 1, backgroundColor: "#4D415D", flex: 1 }}
                    />
                  </View>
                  <T style={s.muted}>To your loved ones in India</T>
                  <T
                    style={{
                      fontSize: 40,
                      color: C.green,
                      fontFamily: "DMSans_500Medium",
                    }}
                  >
                    ₹60,800
                  </T>
                  <T style={{ fontSize: 11, color: C.muted }}>
                    1 JPY = 0.6080 INR · Platform fee 0.4%
                  </T>
                </LinearGradient>
              </View>
            )}
            <View style={{ width: "100%", maxWidth: 410, gap: 22 }}>
              {children}
            </View>
          </View>
          <T style={{ fontSize: 10, color: "#72727E", textAlign: "center" }}>
            BridgePay demo · Sample data, real possibilities. No real money is
            moved.
          </T>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function WelcomeScreen() {
  const nav = useNav();
  const { setUser } = useApp();
  return (
    <AuthLayout>
      <View
        style={{
          height: 50,
          width: 50,
          backgroundColor: C.purpleDark,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Globe2 color={C.purple} size={26} />
      </View>
      <View style={{ gap: 14 }}>
        <T
          style={{
            fontSize: 36,
            lineHeight: 43,
            fontFamily: "DMSans_600SemiBold",
            letterSpacing: -1.4,
          }}
        >
          International transfers,{"\n"}made simple.
        </T>
        <T style={{ fontSize: 15, color: C.muted, lineHeight: 24 }}>
          See the real cost before you send.{"\n"}More clarity. More peace of
          mind.
        </T>
      </View>
      <View style={{ gap: 16, marginVertical: 10 }}>
        {[
          "Every fee, upfront",
          "Your favorite banks, connected",
          "Send a little closer to home",
        ].map((text) => (
          <View key={text} style={s.row}>
            <Check size={16} color={C.green} />
            <T style={{ fontSize: 13 }}>{text}</T>
          </View>
        ))}
      </View>
      <Button onPress={() => nav.navigate("Signup")}>Create account</Button>
      <Button
        onPress={() => nav.navigate("Login")}
        variant="secondary"
        icon={false}
      >
        Log in
      </Button>
      <View style={{ alignItems: "center" }}>
        <Link
          onPress={() => {
            setUser({
              name: "Guest",
              email: "",
              mobile: "",
              guest: true,
              emailVerified: false,
              mobileVerified: false,
            });
            nav.reset({ index: 0, routes: [{ name: "Home" }] });
          }}
        >
          Continue as guest →
        </Link>
      </View>
    </AuthLayout>
  );
}
export function SignupScreen() {
  const nav = useNav();
  const { setPendingUser } = useApp();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const valid = validName(name) && validMobile(mobile) && validEmail(email);
  return (
    <AuthLayout>
      <Link onPress={() => nav.goBack()}>← Back</Link>
      <T style={s.title}>Your world, connected.</T>
      <T style={s.muted}>Create your BridgePay demo account.</T>
      <Field
        label="Full name"
        placeholder="e.g. Alex Morgan"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        error={
          name && !validName(name) ? "Use at least 2 characters." : undefined
        }
      />
      <Field
        label="Mobile number (with country code)"
        placeholder="+81 90 1234 5678"
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        autoComplete="tel"
        error={
          mobile && !validMobile(mobile)
            ? "Enter a valid phone number, including your country code."
            : undefined
        }
      />
      <Field
        label="Email address"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        error={
          email && !validEmail(email)
            ? "Enter a valid email address."
            : undefined
        }
      />
      <T style={{ fontSize: 11, color: C.muted, lineHeight: 18 }}>
        Mobile number and email are required to send money.
      </T>
      <Button
        disabled={!valid}
        onPress={() => {
          setPendingUser({
            name: name.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            guest: false,
            emailVerified: false,
            mobileVerified: false,
          });
          nav.navigate("Verify");
        }}
      >
        Continue
      </Button>
      <Link onPress={() => nav.replace("Login")}>
        Already have an account? Log in
      </Link>
    </AuthLayout>
  );
}
export function LoginScreen() {
  const nav = useNav();
  const { setPendingUser } = useApp();
  const [identifier, setIdentifier] = useState("");
  const valid = validEmail(identifier) || validMobile(identifier);
  return (
    <AuthLayout>
      <Link onPress={() => nav.goBack()}>← Back</Link>
      <T style={s.title}>Welcome back.</T>
      <T style={s.muted}>A little closer to your people.</T>
      <Field
        label="Mobile number or email"
        placeholder="you@example.com"
        autoCapitalize="none"
        value={identifier}
        onChangeText={setIdentifier}
      />
      <Note>
        Demo login accepts a valid email or phone number. No SMS or email is
        sent.
      </Note>
      <Button
        disabled={!valid}
        onPress={() => {
          setPendingUser({
            name: "Demo user",
            email: validEmail(identifier) ? identifier.trim() : "",
            mobile: validMobile(identifier) ? identifier.trim() : "",
            guest: false,
            mobileVerified: false,
            emailVerified: false,
          });
          nav.navigate("Verify");
        }}
      >
        Send code
      </Button>
      <Link onPress={() => nav.replace("Signup")}>
        New here? Create an account
      </Link>
    </AuthLayout>
  );
}
export function VerifyScreen() {
  const nav = useNav();
  const { pendingUser, setPendingUser, setUser, user } = useApp();
  const [code, setCode] = useState("");
  const [count, setCount] = useState(30);
  useEffect(() => {
    if (count <= 0) return;
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);
  return (
    <AuthLayout>
      <Link onPress={() => nav.goBack()}>← Back</Link>
      <T style={s.title}>One small step.</T>
      <T style={{ color: C.muted, lineHeight: 23 }}>
        Verify your contact details to continue.
      </T>
      {pendingUser?.email && (
        <T style={{ fontSize: 12 }}>{pendingUser.email}</T>
      )}
      {pendingUser?.mobile && (
        <T style={{ fontSize: 12 }}>{pendingUser.mobile}</T>
      )}
      <Note>
        This is a demo. Enter any 4 digits. No code is sent, and contact
        ownership is not actually verified.
      </Note>
      <Field
        label="Verification code"
        placeholder="0 0 0 0"
        keyboardType="number-pad"
        maxLength={4}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, ""))}
        style={{ fontSize: 30, letterSpacing: 16, textAlign: "center" }}
      />
      {count > 0 ? (
        <T style={s.muted}>Resend code in 0:{String(count).padStart(2, "0")}</T>
      ) : (
        <Link
          onPress={() => {
            setCount(30);
            setCode("");
          }}
        >
          Resend demo code
        </Link>
      )}
      <Button
        disabled={!/^\d{4}$/.test(code) || !pendingUser}
        onPress={() => {
          if (!pendingUser) return;
          setUser({
            ...pendingUser,
            mobileVerified: false,
            emailVerified: false,
          });
          setPendingUser(null);
          nav.reset({ index: 0, routes: [{ name: user ? "Menu" : "Home" }] });
        }}
      >
        Verify and continue
      </Button>
    </AuthLayout>
  );
}
