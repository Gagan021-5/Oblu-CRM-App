import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography } from "@/constants/theme";

type ToolRow = Record<string, string | number | boolean | null | undefined>;
const TITLES: Record<string, string> = {
  "team-customers": "Team Customers", "payment-followups": "Payment Follow-ups", "monthly-sales": "Monthly Sales Report",
  "my-incentives": "My Paid Incentives", "rsm-incentives": "RSM Team Incentives", "sales-head-incentives": "Sales Head Incentives",
  "cross-selling": "Cross-Selling Matrix", "voucher-approvals": "Voucher Approvals",
};
const ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  "team-customers": "people-outline", "payment-followups": "cash-outline", "monthly-sales": "calendar-outline",
  "my-incentives": "wallet-outline", "rsm-incentives": "people-outline", "sales-head-incentives": "git-network-outline",
  "cross-selling": "grid-outline", "voucher-approvals": "checkbox-outline",
};

export default function CustomerToolScreen() {
  const { tool } = useLocalSearchParams<{ tool: string }>();
  const insets = useSafeAreaInsets(); const { colors, isDark } = useTheme();
  const [rows, setRows] = useState<ToolRow[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const title = TITLES[tool] || "Customer Workspace";
  const load = useCallback(async () => {
    setError("");
    try { const result = await api.get(`/customers/workspace/${tool}/`); setRows(Array.isArray(result.data) ? result.data : (result.data?.rows || [])); setSummary(tool === "monthly-sales" ? `Total sales: ₹${Number(result.data?.total || 0).toLocaleString("en-IN")}` : ""); }
    catch (e: any) { setRows([]); setError(e?.response?.status === 403 ? "Your account does not have permission to view this section." : "Could not load this section. Check your connection and try again."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [tool]);
  useEffect(() => { void load(); }, [load]);
  const approve = async (id: unknown, action: "approve" | "reject") => {
    try { await api.post(`/customers/workspace/${tool}/`, { id, action }); setRows((current) => current.filter((row) => row.id !== id)); }
    catch { Alert.alert("Could not update claim", "Refresh the list and try again."); }
  };
  const foreground = isDark ? "#F1F7F4" : "#101827"; const muted = isDark ? "#9AA9A3" : "#637083";
  const card = { backgroundColor: isDark ? "#111B18" : "#FFFFFF", borderColor: isDark ? "#263A32" : "#E4EAF0" };
  const rowTitle = (row: ToolRow) => String(row.customer || row.employee || row.name || row.voucher || "Record");
  const rowDetails = (row: ToolRow) => Object.entries(row).filter(([key, value]) => key !== "id" && value !== null && value !== undefined && value !== "" && key !== "customer" && key !== "employee").map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join("  ·  ");
  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: insets.bottom + 105 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.top}><TouchableOpacity accessibilityLabel="Back" onPress={() => router.back()} style={[styles.back, card]}><Ionicons name="arrow-back" size={20} color={foreground} /></TouchableOpacity><View style={styles.heading}><Text style={styles.eyebrow}>CUSTOMERS</Text><Text style={[styles.title, { color: foreground }]}>{title}</Text></View></View>
    {error ? <TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={[styles.notice, { backgroundColor: isDark ? "#33251A" : "#FFF4E5" }]}><Text style={{ color: foreground, fontFamily: Typography.regular }}>{error}  Tap to retry.</Text></TouchableOpacity> : null}
    {tool === "monthly-sales" ? <Text style={[styles.sub, { color: muted }]}>Current month · {rows.length} sales records</Text> : null}
    {!!summary ? <View style={[styles.summary, card]}><Text style={[styles.summaryText, { color: foreground }]}>{summary}</Text></View> : null}
    {loading ? <ActivityIndicator style={{ marginTop: 20 }} color="#20B99A" /> : rows.map((row, index) => <View key={String(row.id ?? index)} style={[styles.row, card]}>
      <View style={styles.icon}><Ionicons name={ICONS[tool] || "document-text-outline"} size={19} color="#159A7C" /></View><View style={{ flex: 1, gap: 5 }}><Text style={[styles.rowTitle, { color: foreground }]}>{rowTitle(row)}</Text><Text style={[styles.detail, { color: muted }]}>{rowDetails(row)}</Text></View>
      {tool === "voucher-approvals" ? <View style={styles.actions}><TouchableOpacity accessibilityLabel="Approve claim" onPress={() => void approve(row.id, "approve")} style={styles.approve}><Ionicons name="checkmark" size={18} color="white" /></TouchableOpacity><TouchableOpacity accessibilityLabel="Reject claim" onPress={() => void approve(row.id, "reject")} style={styles.reject}><Ionicons name="close" size={18} color="white" /></TouchableOpacity></View> : null}
    </View>)}
    {!loading && !error && rows.length === 0 ? <View style={[styles.empty, card]}><Ionicons name={ICONS[tool] || "document-text-outline"} size={28} color="#159A7C" /><Text style={[styles.emptyTitle, { color: foreground }]}>No records to show</Text><Text style={[styles.detail, { color: muted }]}>Pull down to refresh.</Text></View> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({ content: { padding: 16, gap: 12 }, top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }, back: { borderWidth: 1, width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" }, heading: { flex: 1 }, eyebrow: { color: "#20B99A", fontFamily: Typography.bold, fontSize: 10, letterSpacing: 1 }, title: { fontFamily: Typography.heading, fontSize: 22, marginTop: 3 }, sub: { fontFamily: Typography.regular, fontSize: 12 }, notice: { padding: 12, borderRadius: 12 }, summary: { borderWidth: 1, borderRadius: 14, padding: 14 }, summaryText: { fontFamily: Typography.semiBold, fontSize: 14 }, row: { minHeight: 76, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }, icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#DDF8F0", alignItems: "center", justifyContent: "center" }, rowTitle: { fontFamily: Typography.semiBold, fontSize: 13 }, detail: { fontFamily: Typography.regular, fontSize: 11, lineHeight: 16 }, actions: { gap: 6 }, approve: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#159A7C", alignItems: "center", justifyContent: "center" }, reject: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#DF5262", alignItems: "center", justifyContent: "center" }, empty: { minHeight: 150, borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8 }, emptyTitle: { fontFamily: Typography.semiBold, fontSize: 14 } });
