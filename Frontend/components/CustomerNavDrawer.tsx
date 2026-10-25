import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Typography } from "@/constants/theme";

type Props = { visible: boolean; onClose: () => void; isAdmin?: boolean };

export function CustomerNavDrawer({ visible, onClose, isAdmin = false }: Props) {
  const insets = useSafeAreaInsets(); const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const foreground = isDark ? "#F1F7F4" : "#101827"; const muted = isDark ? "#9AA9A3" : "#637083";
  const bg = isDark ? "#0E1714" : "#FFFFFF";
  const role = (user?.role || "").toLowerCase();
  const adminAccess = isAdmin || role.includes("admin") || role.includes("accounts_operations");
  const salesHeadAccess = adminAccess || role.includes("business") || role.includes("sales_head") || role.includes("sales head");
  const managementAccess = adminAccess || role.includes("rsm") || role.includes("sales_head") || role.includes("sales head");
  const tool = (slug: string) => `/(employee)/customers/tool/${slug}`;
  const sections = [
    { title: "WORKSPACE", entries: [
      { title: "Dashboard", icon: "home-outline" as const, route: isAdmin ? "/(admin)/customer-dashboard" : "/(employee)/customers/dashboard" },
      { title: "Customer Directory", icon: "people-outline" as const, route: isAdmin ? "/(admin)/customers" : "/(employee)/customers" },
      { title: "Analytics", icon: "bar-chart-outline" as const, route: "/(employee)/customers/analytics" },
      { title: "Detailed Map", icon: "map-outline" as const, route: "/(employee)/customers/map" },
    ]},
    { title: "CUSTOMERS & ACCOUNTS", entries: [
      { title: "Team Customers", icon: "person-add-outline" as const, route: tool("team-customers") },
      { title: "Payment Follow-ups", icon: "cash-outline" as const, route: tool("payment-followups") },
      { title: "Monthly Sales Report", icon: "calendar-outline" as const, route: tool("monthly-sales") },
    ]},
    { title: "PERFORMANCE", entries: [
      { title: "My Paid Incentives", icon: "wallet-outline" as const, route: tool("my-incentives") },
      ...(managementAccess ? [{ title: "RSM Team Incentives", icon: "people-outline" as const, route: tool("rsm-incentives") }] : []),
      ...(salesHeadAccess ? [{ title: "Sales Head Incentives", icon: "git-network-outline" as const, route: tool("sales-head-incentives") }] : []),
    ]},
    { title: "SALES INTELLIGENCE", entries: [
      { title: "Cross-Selling Matrix", icon: "grid-outline" as const, route: tool("cross-selling") },
    ]},
    ...(adminAccess ? [{ title: "ADMINISTRATION", entries: [
      { title: "Voucher Approvals", icon: "checkbox-outline" as const, route: tool("voucher-approvals") },
    ]}] : []),
  ];
  const navigate = (route: string) => { onClose(); router.push(route as never); };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.frame}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.drawer, { backgroundColor: bg, paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.brandRow}><View style={styles.logo}><Ionicons name="paw" size={21} color="#159A7C" /></View><View style={{ flex: 1 }}><Text style={[styles.brand, { color: foreground }]} numberOfLines={1}>Oblu Customer</Text><Text style={[styles.caption, { color: muted }]}>Customer workspace</Text></View><TouchableOpacity accessibilityLabel="Close menu" onPress={onClose} style={styles.close}><Ionicons name="close" size={23} color={muted} /></TouchableOpacity></View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {sections.map((section) => <View key={section.title}><Text style={[styles.section, { color: muted }]}>{section.title}</Text>{section.entries.map((item) => <TouchableOpacity key={item.title} onPress={() => navigate(item.route)} style={styles.entry}>
            <Ionicons name={item.icon} size={20} color={muted} /><Text style={[styles.entryText, { color: foreground }]}>{item.title}</Text><Ionicons name="chevron-forward" size={16} color={muted} />
          </TouchableOpacity>)}</View>)}
        </ScrollView>
        <Text style={[styles.footer, { color: muted }]}>Your access follows your account permissions.</Text>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({ frame: { flex: 1, flexDirection: "row" }, scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,20,18,0.45)" }, drawer: { width: "84%", maxWidth: 340, height: "100%", paddingHorizontal: 18, paddingBottom: 28, elevation: 16 }, brandRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#DDE5E1" }, logo: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#DDF8F0", alignItems: "center", justifyContent: "center" }, brand: { fontFamily: Typography.headingSemi, fontSize: 16 }, caption: { fontFamily: Typography.regular, fontSize: 11, marginTop: 3 }, close: { width: 38, height: 38, alignItems: "center", justifyContent: "center" }, section: { fontFamily: Typography.bold, marginTop: 24, marginBottom: 9, fontSize: 10, letterSpacing: 1.1 }, entry: { height: 54, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 13, borderRadius: 12 }, entrySelected: { backgroundColor: "#EAF8F4" }, entryText: { fontFamily: Typography.semiBold, flex: 1, fontSize: 14 }, footer: { fontFamily: Typography.regular, fontSize: 10, lineHeight: 15, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DDE5E1" } });
