import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography } from "@/constants/theme";
import { CustomerNavDrawer } from "@/components/CustomerNavDrawer";
import { fetchCustomerChartsApi, fetchDashboardStatsApi, DashboardStats } from "@/services/customerService";

type QuickLink = { title: string; description: string; icon: React.ComponentProps<typeof Ionicons>["name"]; route: string; color: string };
const links: QuickLink[] = [
    { title: "Customer Directory", description: "Search accounts and open customer records", icon: "people-outline", route: "/(employee)/customers", color: "#20B99A" },
  { title: "Payment Follow-ups", description: "Review customers with pending or overdue payments", icon: "cash-outline", route: "/(employee)/customers?filter=payment_pending", color: "#F59E0B" },
  { title: "Analytics", description: "Customer, salesperson and state summaries", icon: "bar-chart-outline", route: "/(employee)/customers/analytics", color: "#6366F1" },
  { title: "Detailed Map", description: "Browse customer locations by city and state", icon: "map-outline", route: "/(employee)/customers/map", color: "#0EA5E9" },
  { title: "My Incentives", description: "View your incentive workspace", icon: "wallet-outline", route: "/(employee)/incentives", color: "#A855F7" },
];

export default function CustomerWorkspaceScreen({ isAdmin = false }: { isAdmin?: boolean }) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await fetchDashboardStatsApi();
      setStats(data);
      const charts = await fetchCustomerChartsApi();
      if (!charts) setError("Some dashboard summaries could not be loaded. Check your connection and refresh.");
    } catch {
      setError("Could not reach the customer dashboard. Check your connection and sign-in.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = (route: string) => router.push(route as never);
  const cardBg = isDark ? "#111B18" : "#FFFFFF";
  const text = isDark ? "#F1F7F4" : "#101827";
  const muted = isDark ? "#9AA9A3" : "#637083";
  const metricItems = [
    { title: "Customers", value: stats?.totalCustomers ?? 0, icon: "people" as const, tint: "#DDF8F0", route: isAdmin ? "/(admin)/customers" : "/(employee)/customers" },
    { title: "Follow-ups due", value: stats?.followUpsDueCount ?? 0, icon: "calendar" as const, tint: "#FFF2D8", route: "/(employee)/customers?filter=followup_due" },
    { title: "Overdue payments", value: stats?.overduePaymentsCount ?? 0, icon: "alert-circle" as const, tint: "#FFE5E8", route: "/(employee)/customers?filter=payment_pending" },
  ];

  return <><ScrollView style={{ flex: 1, backgroundColor: isDark ? colors.background : "#F5F8FA" }} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: 110 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color: "#20B99A" }]}>OBLU CUSTOMER WORKSPACE</Text>
        <Text style={[styles.title, { color: text }]}>Customers, managed smarter.</Text>
        <Text style={[styles.subtitle, { color: muted }]}>Your customer accounts, payment follow-ups and sales tools in one place.</Text>
      </View>
      <TouchableOpacity accessibilityLabel="Open customer navigation" onPress={() => setDrawerVisible(true)} style={[styles.profileIcon, { backgroundColor: cardBg }]}><Ionicons name="menu" size={22} color={text} /></TouchableOpacity>
    </View>

    {!!error && <TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={[styles.error, { backgroundColor: isDark ? "#33251A" : "#FFF4E5" }]}><Text style={{ color: isDark ? "#FFD9A8" : "#8A4B08", fontFamily: Typography.regular }}>{error}  Tap to retry.</Text></TouchableOpacity>}
    <View style={styles.metricRow}>
      {metricItems.map((item) => <TouchableOpacity key={item.title} onPress={() => open(item.route)} style={[styles.metric, { backgroundColor: cardBg, borderColor: isDark ? "#263A32" : "#E4EAF0" }]}>
        <View style={[styles.metricIcon, { backgroundColor: item.tint }]}><Ionicons name={item.icon} size={18} color={item.title === "Overdue payments" ? "#E34B59" : item.title === "Follow-ups due" ? "#D18A00" : "#149B80"} /></View>
        <Text style={[styles.metricValue, { color: text }]}>{loading ? "—" : item.value.toLocaleString()}</Text><Text style={[styles.metricLabel, { color: muted }]}>{item.title}</Text>
      </TouchableOpacity>)}
    </View>
    <View style={[styles.balanceCard, { backgroundColor: "#0E9E83" }]}>
      <View style={{ flex: 1 }}><Text style={styles.balanceLabel}>TOTAL OUTSTANDING</Text><Text style={styles.balanceValue}>{loading ? "—" : stats?.totalOutstandingFormatted || "₹0"}</Text><Text style={styles.balanceHint}>Live account data</Text></View>
      <Ionicons name="trending-up" size={30} color="#D9FFF5" />
    </View>

    <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: text }]}>Workspace</Text><Text style={[styles.sectionHint, { color: muted }]}>Tools available to your account</Text></View>
    {links.map((item) => <TouchableOpacity key={item.title} onPress={() => open(isAdmin && item.title === "Customer Directory" ? "/(admin)/customers" : isAdmin && item.title === "My Incentives" ? "/(admin)/incentives" : item.route)} activeOpacity={0.75} style={[styles.linkCard, { backgroundColor: cardBg, borderColor: isDark ? "#263A32" : "#E4EAF0" }]}>
      <View style={[styles.linkIcon, { backgroundColor: `${item.color}18` }]}><Ionicons name={item.icon} size={22} color={item.color} /></View>
      <View style={{ flex: 1 }}><Text style={[styles.linkTitle, { color: text }]}>{item.title}</Text><Text style={[styles.linkDescription, { color: muted }]}>{item.description}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={muted} />
    </TouchableOpacity>)}
    {loading && <ActivityIndicator style={{ marginTop: 12 }} color="#20B99A" />}
  </ScrollView><CustomerNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} isAdmin={isAdmin} /></>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, gap: 14 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 10 },
  eyebrow: { fontFamily: Typography.bold, fontSize: 10, letterSpacing: 1.2, marginBottom: 8 },
  title: { fontFamily: Typography.heading, fontSize: 26, lineHeight: 32, letterSpacing: -0.6 },
  subtitle: { fontFamily: Typography.regular, marginTop: 6, fontSize: 13, lineHeight: 19 },
  profileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E4EAF0" },
  error: { padding: 12, borderRadius: 12 },
  metricRow: { flexDirection: "row", gap: 9 },
  metric: { flex: 1, minHeight: 116, padding: 12, borderRadius: 16, borderWidth: 1 },
  metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  metricValue: { fontFamily: Typography.bold, fontSize: 21 },
  metricLabel: { fontFamily: Typography.regular, fontSize: 11, lineHeight: 15, marginTop: 3 },
  balanceCard: { borderRadius: 18, padding: 18, flexDirection: "row", alignItems: "center" },
  balanceLabel: { color: "#D9FFF5", fontFamily: Typography.bold, fontSize: 10, letterSpacing: 1 },
  balanceValue: { color: "#FFFFFF", fontFamily: Typography.bold, fontSize: 26, marginTop: 5 },
  balanceHint: { color: "#D9FFF5", fontFamily: Typography.regular, fontSize: 11, marginTop: 2 },
  sectionHeading: { marginTop: 5 },
  sectionTitle: { fontFamily: Typography.headingSemi, fontSize: 20 },
  sectionHint: { fontFamily: Typography.regular, marginTop: 3, fontSize: 12 },
  linkCard: { borderRadius: 16, borderWidth: 1, minHeight: 74, padding: 13, flexDirection: "row", alignItems: "center", gap: 12 },
  linkIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  linkTitle: { fontFamily: Typography.semiBold, fontSize: 14 },
  linkDescription: { fontFamily: Typography.regular, fontSize: 11, lineHeight: 15, marginTop: 3 },
});
