import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
  Clock3,
  Globe2,
  HelpCircle,
  House,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNav } from "../navigation";
import { useApp } from "../store";
import { Badge, Brand, C, T, s } from "./ui";
const tabs = [
  { name: "Home" as const, label: "Overview", mobile: "Home", icon: House },
  {
    name: "Send" as const,
    label: "Send money",
    mobile: "Send",
    icon: ArrowUpRight,
  },
  {
    name: "Rates" as const,
    label: "Exchange rates",
    mobile: "Rates",
    icon: ChartNoAxesCombined,
  },
  {
    name: "History" as const,
    label: "Transactions",
    mobile: "History",
    icon: Clock3,
  },
  {
    name: "Menu" as const,
    label: "My account",
    mobile: "Menu",
    icon: LayoutGrid,
  },
];
export function Shell({
  children,
  active = "Home",
  narrow = false,
}: {
  children: React.ReactNode;
  active?: string;
  narrow?: boolean;
}) {
  const { width } = useWindowDimensions();
  const desktop = width >= 1000;
  const nav = useNav();
  const { user } = useApp();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {desktop && (
          <View
            style={{
              width: 222,
              borderRightWidth: 1,
              borderColor: "#202125",
              padding: 26,
              paddingTop: 33,
            }}
          >
            <Brand />
            <T
              style={[
                s.eyebrow,
                { marginTop: 55, marginBottom: 20, fontSize: 9 },
              ]}
            >
              YOUR WORKSPACE
            </T>
            <View style={{ gap: 9 }}>
              {tabs.map((tab) => (
                <Pressable
                  key={tab.name}
                  accessibilityRole="button"
                  onPress={() => nav.navigate(tab.name)}
                  style={[
                    s.row,
                    {
                      gap: 12,
                      paddingVertical: 14,
                      paddingHorizontal: 13,
                      borderRadius: 11,
                      backgroundColor:
                        active === tab.name ? C.purpleDark : "transparent",
                    },
                  ]}
                >
                  <tab.icon
                    size={18}
                    color={active === tab.name ? C.purple : C.muted}
                  />
                  <T
                    style={{
                      fontSize: 12,
                      color: active === tab.name ? C.purple : C.muted,
                      fontFamily:
                        active === tab.name
                          ? "DMSans_600SemiBold"
                          : "DMSans_400Regular",
                    }}
                  >
                    {tab.label}
                  </T>
                  {active === tab.name && (
                    <View
                      style={{
                        marginLeft: "auto",
                        height: 5,
                        width: 5,
                        backgroundColor: C.purple,
                        borderRadius: 3,
                      }}
                    />
                  )}
                </Pressable>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <View
              style={{
                backgroundColor: "#131218",
                borderWidth: 1,
                borderColor: "#292430",
                borderRadius: 15,
                padding: 16,
                gap: 12,
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  backgroundColor: C.purpleDark,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Globe2 size={17} color={C.purple} />
              </View>
              <T style={{ fontSize: 12, fontFamily: "DMSans_500Medium" }}>
                A little closer to home.
              </T>
              <T style={{ fontSize: 11, color: C.muted, lineHeight: 17 }}>
                Big moments. Everyday care.{"\n"}Send your support, simply.
              </T>
            </View>
            <Pressable onPress={() => nav.navigate("Help")} style={s.row}>
              <HelpCircle size={17} color={C.muted} />
              <T style={s.small}>Help & support</T>
              <ArrowUpRight size={13} color={C.muted} />
            </Pressable>
            <T style={{ color: "#55565F", fontSize: 9, marginTop: 22 }}>
              © {new Date().getFullYear()} BridgePay
            </T>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <View
            style={{
              height: desktop ? 86 : 70,
              paddingHorizontal: desktop ? 38 : 20,
              borderBottomWidth: 1,
              borderColor: "#202125",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {desktop ? (
              <View style={s.row}>
                <T style={{ fontSize: 12, color: C.muted }}>Workspace</T>
                <T style={{ color: "#4F5058" }}>/</T>
                <T style={{ fontSize: 12 }}>
                  {tabs.find((t) => t.name === active)?.label || "Overview"}
                </T>
              </View>
            ) : (
              <Brand size={28} />
            )}
            <View style={[s.row, { gap: 18 }]}>
              <Badge color={C.amber}>● Demo workspace</Badge>
              <Pressable
                accessibilityLabel="Open account"
                onPress={() => nav.navigate("Menu")}
                style={s.row}
              >
                <View
                  style={{
                    height: 32,
                    width: 32,
                    borderRadius: 16,
                    backgroundColor: "#34303E",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <T
                    style={{
                      color: C.purple,
                      fontSize: 11,
                      fontFamily: "DMSans_600SemiBold",
                    }}
                  >
                    {user?.guest
                      ? "G"
                      : user?.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                  </T>
                </View>
                {desktop && <ChevronDown size={14} color={C.muted} />}
              </Pressable>
            </View>
          </View>
          <ScrollView
            key={active}
            contentContainerStyle={{
              padding: desktop ? 36 : 20,
              paddingBottom: 30,
              alignItems: "center",
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ width: "100%", maxWidth: narrow ? 760 : 1200 }}>
              {children}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 30,
                }}
              >
                <ShieldCheck size={12} color="#656670" />
                <T style={{ fontSize: 10, color: "#656670" }}>
                  Built for peace of mind. Sample money only.
                </T>
              </View>
            </View>
          </ScrollView>
          {!desktop && (
            <View
              style={{
                flexDirection: "row",
                borderTopWidth: 1,
                borderColor: C.border,
                paddingVertical: 10,
                backgroundColor: "#101113",
              }}
            >
              {tabs.map((tab) => (
                <Pressable
                  key={tab.name}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active === tab.name }}
                  onPress={() => nav.navigate(tab.name)}
                  style={{ flex: 1, alignItems: "center", gap: 5 }}
                >
                  <View
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 17,
                      borderRadius: 20,
                      backgroundColor:
                        active === tab.name ? C.purpleDark : "transparent",
                    }}
                  >
                    <tab.icon
                      size={19}
                      color={active === tab.name ? C.purple : C.muted}
                    />
                  </View>
                  <T
                    style={{
                      fontSize: 10,
                      color: active === tab.name ? C.purple : C.muted,
                    }}
                  >
                    {tab.mobile}
                  </T>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
