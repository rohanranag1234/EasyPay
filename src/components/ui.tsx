import { ArrowLeft, ArrowUpRight, ShieldCheck } from "lucide-react-native";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { money } from "../domain/calc";
import { currencyInfo } from "../domain/data";
import { useNav } from "../navigation";
import { Transfer } from "../services/demo";
import { Flag } from "./Flag";
export const C = {
  bg: "#08090B",
  card: "#121315",
  raised: "#1A1B1F",
  border: "#292A30",
  text: "#F5F5F7",
  muted: "#92939F",
  purple: "#B9A2FF",
  purpleDark: "#282137",
  green: "#6AE5A4",
  greenDark: "#11271E",
  red: "#FF8585",
  amber: "#F4CA80",
};
export const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 22,
    padding: 24,
  },
  stack: { gap: 22 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.6,
    color: C.muted,
    fontFamily: "DMSans_600SemiBold",
  },
  title: { fontSize: 30, letterSpacing: -1, fontFamily: "DMSans_600SemiBold" },
  muted: { color: C.muted, fontSize: 13 },
  input: {
    color: C.text,
    fontFamily: "DMSans_400Regular",
    fontSize: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: "#0D0E10",
    minHeight: 54,
  },
  pill: {
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: C.raised,
  },
  small: { fontSize: 12, color: C.muted },
});
export function T({
  children,
  style,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      {...props}
      style={[
        { fontFamily: "DMSans_400Regular", color: C.text, fontSize: 14 },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return <View style={[s.card, style]}>{children}</View>;
}
export function Button({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  icon = true,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "green";
  disabled?: boolean;
  icon?: boolean;
  style?: ViewStyle;
}) {
  const color = variant === "secondary" ? C.text : "#121016";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 52,
          borderRadius: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          backgroundColor:
            variant === "primary"
              ? C.purple
              : variant === "green"
                ? C.green
                : C.raised,
          borderWidth: variant === "secondary" ? 1 : 0,
          borderColor: C.border,
          opacity: disabled ? 0.35 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <T style={{ fontFamily: "DMSans_600SemiBold", color, fontSize: 14 }}>
        {children}
      </T>
      {icon && <ArrowUpRight size={18} color={color} />}
    </Pressable>
  );
}
export function Link({
  children,
  onPress,
  color = C.purple,
}: {
  children: React.ReactNode;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ paddingVertical: 8 }}
    >
      <T style={{ fontSize: 12, color, fontFamily: "DMSans_500Medium" }}>
        {children}
      </T>
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <T style={{ fontSize: 12, color: C.muted }}>{label}</T>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#62636C"
        selectionColor={C.purple}
        {...props}
        style={[s.input, props.style]}
      />
      {!!error && (
        <T accessibilityRole="alert" style={{ fontSize: 12, color: C.red }}>
          {error}
        </T>
      )}
    </View>
  );
}
export function Chips<TValue extends string>({
  items,
  value,
  onChange,
}: {
  items: readonly TValue[];
  value: TValue;
  onChange: (value: TValue) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {items.map((item) => (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: item === value }}
          key={item}
          onPress={() => onChange(item)}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: item === value ? "#77659F" : C.border,
            backgroundColor: item === value ? C.purpleDark : "transparent",
          }}
        >
          <T
            style={{ fontSize: 12, color: item === value ? C.purple : C.muted }}
          >
            {item}
          </T>
        </Pressable>
      ))}
    </View>
  );
}
export function Badge({
  children,
  color = C.purple,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <View style={[s.pill, { backgroundColor: color + "14" }]}>
      <T style={{ fontSize: 10, color, fontFamily: "DMSans_500Medium" }}>
        {children}
      </T>
    </View>
  );
}
export function Brand({ size = 32 }: { size?: number }) {
  return (
    <View style={s.row}>
      <View
        style={{
          height: size,
          width: size,
          backgroundColor: C.purple,
          borderRadius: size * 0.3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <T
          style={{
            color: "#171121",
            fontFamily: "DMSans_700Bold",
            fontSize: size * 0.68,
            lineHeight: size * 0.85,
            letterSpacing: -3,
            marginLeft: -3,
          }}
        >
          b↗
        </T>
      </View>
      <T
        style={{
          fontFamily: "DMSans_600SemiBold",
          fontSize: size * 0.63,
          letterSpacing: -0.8,
        }}
      >
        BridgePay<T style={{ color: C.purple }}>.</T>
      </T>
    </View>
  );
}
export function PageHeading({
  title,
  subtitle,
  kicker,
  back = false,
  aside,
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
  back?: boolean;
  aside?: React.ReactNode;
}) {
  const nav = useNav();
  return (
    <View style={{ gap: 12, marginBottom: 26 }}>
      {kicker && <T style={s.eyebrow}>{kicker}</T>}
      <View style={s.between}>
        <View style={[s.row, { flex: 1 }]}>
          {back && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => nav.goBack()}
              style={{
                padding: 8,
                borderWidth: 1,
                borderColor: C.border,
                borderRadius: 10,
              }}
            >
              <ArrowLeft size={20} color={C.text} />
            </Pressable>
          )}
          <T style={s.title}>{title}</T>
        </View>
        {aside}
      </View>
      {subtitle && <T style={s.muted}>{subtitle}</T>}
    </View>
  );
}
export function Note({
  children,
  warning = false,
}: {
  children: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        backgroundColor: warning ? "#282216" : "#17151F",
        padding: 14,
        borderRadius: 12,
      }}
    >
      <ShieldCheck size={17} color={warning ? C.amber : C.purple} />
      <T
        style={{
          fontSize: 12,
          lineHeight: 19,
          color: warning ? C.amber : C.muted,
          flex: 1,
        }}
      >
        {children}
      </T>
    </View>
  );
}
export function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={s.between}>
      <View style={{ flex: 1, gap: 4 }}>
        <T>{label}</T>
        {description && <T style={s.small}>{description}</T>}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: C.purple }}
        thumbColor={value ? "#F0E9FF" : "#95959F"}
      />
    </View>
  );
}
export function CostSummary({
  quote,
  compact = false,
}: {
  quote: ReturnType<typeof import("../domain/calc").calculate>;
  compact?: boolean;
}) {
  const row = (label: string, value: string, color = C.text) => (
    <View style={s.between}>
      <T style={s.muted}>{label}</T>
      <T style={{ fontSize: 13, color }}>{value}</T>
    </View>
  );
  return (
    <View style={{ gap: 16 }}>
      {!compact && <T style={s.eyebrow}>EVERY DETAIL. NO SURPRISES.</T>}
      {row("You send", money(quote.amount, quote.from))}
      {row("Platform fee (0.4%)", money(quote.platformFee, quote.from))}
      {quote.bankFee > 0 &&
        row("Your bank’s fee", money(quote.bankFee, quote.from))}
      {quote.promo &&
        row(
          "SEND5 · 5% off fees",
          "−" + money(quote.promoDiscount, quote.from),
          C.green,
        )}
      <View style={s.divider} />
      <View style={s.between}>
        <T>Total cost</T>
        <T
          style={{
            color: C.purple,
            fontSize: compact ? 22 : 27,
            fontFamily: "DMSans_600SemiBold",
            letterSpacing: -0.7,
          }}
        >
          {money(quote.totalCost, quote.from)}
        </T>
      </View>
      {row(
        "Exchange rate",
        `1 ${quote.from} = ${quote.rate.toFixed(4)} ${quote.to}`,
      )}
      <View style={s.between}>
        <T>Recipient gets</T>
        <T
          style={{
            color: C.green,
            fontSize: compact ? 22 : 27,
            fontFamily: "DMSans_600SemiBold",
            letterSpacing: -0.7,
          }}
        >
          {money(quote.receiveAmount, quote.to)}
        </T>
      </View>
    </View>
  );
}
export function TransferRow({ transfer }: { transfer: Transfer }) {
  const nav = useNav();
  const q = transfer.quote;
  const color =
    transfer.status === "Completed"
      ? C.green
      : transfer.status === "Failed"
        ? C.red
        : C.purple;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Transfer to ${q.recipient.name}, ${transfer.status}`}
      onPress={() => nav.navigate("TransferDetail", { id: transfer.id })}
      style={({ pressed }) => [
        s.row,
        { paddingVertical: 18, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={{
          width: 43,
          height: 43,
          borderRadius: 15,
          backgroundColor: C.raised,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <T style={{ color: C.purple, fontFamily: "DMSans_500Medium" }}>
          {q.recipient.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </T>
      </View>
      <View style={{ flex: 1, gap: 5 }}>
        <T style={{ fontSize: 13, fontFamily: "DMSans_500Medium" }}>
          {q.recipient.name}
        </T>
        <T style={{ fontSize: 10, color: C.muted }}>
          {q.toBank} ·{" "}
          {new Date(transfer.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </T>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <T style={{ fontSize: 13, fontFamily: "DMSans_500Medium" }}>
          {money(q.amount, q.from)}
        </T>
        <Badge color={color}>{transfer.status}</Badge>
      </View>
    </Pressable>
  );
}
export function CurrencyPill({
  currency,
}: {
  currency: keyof typeof currencyInfo;
}) {
  return (
    <View
      style={[
        s.row,
        {
          gap: 7,
          backgroundColor: C.raised,
          paddingVertical: 9,
          paddingHorizontal: 12,
          borderRadius: 30,
        },
      ]}
    >
      <Flag currency={currency} size={20} />
      <T style={{ fontSize: 12, fontFamily: "DMSans_600SemiBold" }}>
        {currency}
      </T>
    </View>
  );
}
export function Empty({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={{ alignItems: "center", gap: 16, padding: 32 }}>
      <ArrowUpRight size={32} color={C.purple} />
      <T style={{ fontSize: 20 }}>{title}</T>
      <T style={[s.muted, { textAlign: "center", lineHeight: 21 }]}>{body}</T>
      {action && onPress && <Button onPress={onPress}>{action}</Button>}
    </View>
  );
}
