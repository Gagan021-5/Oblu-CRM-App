import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { CustomerChartsData, fetchCustomerChartsApi } from "@/services/customerService";

export default function CustomerAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [data, setData] = useState<CustomerChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    const result = await fetchCustomerChartsApi();
    setData(result);
    if (!result) setError("Analytics could not be loaded. Check your connection and sign-in, then refresh.");
    setLoading(false); setRefreshing(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const foreground = isDark ? "#F1F7F4" : "#101827";
  const muted = isDark ? "#9AA9A3" : "#637083";
  const card = { backgroundColor: isDark ? "#111B18" : "#FFFFFF", borderColor: isDark ? "#263A32" : "#E4EAF0" };
  const maxState = Math.max(1, ...(data?.stateDistribution.map((x) => x.count) || [1]));
  const maxSales = Math.max(1, ...(data?.salespersonDistribution.map((x) => x.customers) || [1]));
  const Bar = ({ label, value, max, tint }: { label: string; value: number; max: number; tint: string }) => <View style={styles.barRow}>
    <View style={styles.barLabelLine}><Text numberOfLines={1} style={[styles.barLabel, { color: foreground }]}>{label || "Other"}</Text><Text style={[styles.barValue, { color: muted }]}>{value}</Text></View>
    <View style={[styles.track, { backgroundColor: isDark ? "#23322D" : "#EDF2F5" }]}><View style={[styles.fill, { width: `${Math.max(value ? 4 : 0, value / max * 100)}%`, backgroundColor: tint }]} /></View>
  </View>;
  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: 110 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.top}><TouchableOpacity onPress={() => router.back()} style={[styles.back, card]}><Ionicons name="arrow-back" size={20} color={foreground} /></TouchableOpacity><View><Text style={[styles.eyebrow, { color: "#20B99A" }]}>CUSTOMERS</Text><Text style={[styles.title, { color: foreground }]}>Analytics</Text></View></View>
    {error ? <TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={[styles.notice, { backgroundColor: isDark ? "#33251A" : "#FFF4E5" }]}><Text style={{ color: foreground }}>{error}</Text></TouchableOpacity> : null}
    <View style={styles.kpis}>
      {[{ label: "Customers", value: data?.totalCustomers ?? 0, icon: "people-outline" as const }, { label: "Outstanding", value: data?.totalOutstandingFormatted ?? "₹0", icon: "cash-outline" as const }].map((x) => <View key={x.label} style={[styles.kpi, card]}><Ionicons name={x.icon} size={19} color="#20B99A" /><Text style={[styles.kpiValue, { color: foreground }]}>{loading ? "—" : x.value}</Text><Text style={[styles.kpiLabel, { color: muted }]}>{x.label}</Text></View>)}
    </View>
    <View style={[styles.section, card]}><Text style={[styles.sectionTitle, { color: foreground }]}>Voucher status</Text><View style={styles.vouchers}>{[{ label: "Overdue", value: data?.vouchers.overdue ?? 0, color: "#E34B59" }, { label: "Pending", value: data?.vouchers.pending ?? 0, color: "#E59C18" }, { label: "Paid", value: data?.vouchers.paid ?? 0, color: "#16A67A" }].map((x) => <View key={x.label} style={styles.voucher}><Text style={[styles.voucherValue, { color: x.color }]}>{loading ? "—" : x.value}</Text><Text style={[styles.kpiLabel, { color: muted }]}>{x.label}</Text></View>)}</View></View>
    <View style={[styles.section, card]}><Text style={[styles.sectionTitle, { color: foreground }]}>Customers by state</Text>{loading ? <ActivityIndicator color="#20B99A" /> : (data?.stateDistribution || []).map((x) => <Bar key={x.state} label={x.state} value={x.count} max={maxState} tint="#20B99A" />)}{!loading && !data?.stateDistribution.length ? <Text style={{ color: muted }}>No customer distribution data available.</Text> : null}</View>
    <View style={[styles.section, card]}><Text style={[styles.sectionTitle, { color: foreground }]}>Customers by salesperson</Text>{loading ? <ActivityIndicator color="#20B99A" /> : (data?.salespersonDistribution || []).map((x) => <Bar key={x.name} label={x.name} value={x.customers} max={maxSales} tint="#7C6CF2" />)}{!loading && !data?.salespersonDistribution.length ? <Text style={{ color: muted }}>No salesperson data available.</Text> : null}</View>
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 18, gap: 14 }, top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 }, back: { borderWidth: 1, width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" }, eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1 }, title: { fontSize: 25, fontWeight: "800", marginTop: 3 }, notice: { padding: 12, borderRadius: 12 }, kpis: { flexDirection: "row", gap: 10 }, kpi: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 15 }, kpiValue: { fontSize: 22, fontWeight: "800", marginTop: 12 }, kpiLabel: { fontSize: 11, marginTop: 3 }, section: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 }, sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 }, vouchers: { flexDirection: "row", justifyContent: "space-between" }, voucher: { flex: 1 }, voucherValue: { fontSize: 20, fontWeight: "800" }, barRow: { gap: 6 }, barLabelLine: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, barLabel: { flex: 1, fontSize: 12, fontWeight: "600" }, barValue: { fontSize: 12, fontWeight: "700" }, track: { height: 8, borderRadius: 5, overflow: "hidden" }, fill: { height: "100%", borderRadius: 5 } });
