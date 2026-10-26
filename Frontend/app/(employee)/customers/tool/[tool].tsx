import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, hasRole } from "@/services/permissionService";
import { Typography } from "@/constants/theme";

type ToolRow = Record<string, string | number | boolean | null | undefined>;
type RsmOption = { id: number | string; name: string };
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
  const { user, permissionProfile } = useAuth();
  const roleText = `${user?.role || ""} ${permissionProfile?.user.role || ""}`.toLowerCase();
  const isSuperuser = roleText.includes("superuser");
  const userHasRole = (role: string) => hasRole(permissionProfile, role) ||
    (role === "rsm" && (roleText.includes("rsm") || roleText.includes("regional sales manager"))) ||
    (role === "sales_head" && (roleText.includes("sales head") || roleText.includes("sales_head"))) ||
    (role === "business" && roleText.includes("business manager"));
  const isAdminUser = isSuperuser || userHasRole("admin") || roleText.includes("admin");
  const isAccountant = userHasRole("accountant") || roleText.includes("accountant") || roleText.includes("finance");
  const accessByTool: Record<string, boolean> = {
    "team-customers": hasPermission(permissionProfile, "customer.view"),
    "payment-followups": hasPermission(permissionProfile, "payment.view"),
    "monthly-sales": hasPermission(permissionProfile, "customer.view") || hasPermission(permissionProfile, "customer.view_all") || hasPermission(permissionProfile, "payment.view"),
    "my-incentives": true,
    "rsm-incentives": isAdminUser || isAccountant || userHasRole("rsm") || userHasRole("sales_head"),
    "sales-head-incentives": isAdminUser || userHasRole("sales_head") || userHasRole("business"),
    "cross-selling": hasPermission(permissionProfile, "customer.view"),
    "voucher-approvals": isAdminUser || hasRole(permissionProfile, "accounts_operations"),
  };
  const canOpen = Boolean(accessByTool[tool]);
  const [rows, setRows] = useState<ToolRow[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState("");
  const [productRows, setProductRows] = useState<ToolRow[]>([]);
  const [rsmOptions, setRsmOptions] = useState<RsmOption[]>([]); const [selectedRsm, setSelectedRsm] = useState<string | null>(null);
  const [reportMonth, setReportMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const monthKey = `${reportMonth.getFullYear()}-${String(reportMonth.getMonth() + 1).padStart(2, "0")}`;
  const isMonthlyReport = ["monthly-sales", "my-incentives", "rsm-incentives", "sales-head-incentives"].includes(tool);
  const [summary, setSummary] = useState("");
  const title = TITLES[tool] || "Customer Workspace";
  const load = useCallback(async () => {
    if (!canOpen) return;
    setError("");
    try {
      const reportParams = tool === "monthly-sales" ? { month: monthKey } : isMonthlyReport ? { month_picker: monthKey } : {};
      const result = await api.get(`/customers/workspace/${tool}/`, { params: { ...reportParams, ...(tool === "rsm-incentives" && selectedRsm ? { rsm: selectedRsm } : {}) } });
      setRows(Array.isArray(result.data) ? result.data : (result.data?.rows || []));
      setProductRows(tool === "my-incentives" && Array.isArray(result.data?.products) ? result.data.products : []);
      if (tool === "rsm-incentives") {
        const options = Array.isArray(result.data?.rsms) ? result.data.rsms : [];
        setRsmOptions(options);
        if (result.data?.rsm_id != null && selectedRsm !== String(result.data.rsm_id)) setSelectedRsm(String(result.data.rsm_id));
      }
      if (tool === "monthly-sales") {
        setSummary(`Total sales: ₹${Number(result.data?.total || 0).toLocaleString("en-IN")}`);
      } else if (tool === "sales-head-incentives") {
        const totals = result.data?.summary || {};
        setSummary(`Potential ₹${Number(totals.potential || 0).toLocaleString("en-IN")}  ·  Payable ₹${Number(totals.payable || 0).toLocaleString("en-IN")}  ·  Pending ₹${Number(totals.pending || 0).toLocaleString("en-IN")}`);
      } else if (tool === "my-incentives" || tool === "rsm-incentives") {
        const totals = result.data?.summary || {};
        const subject = tool === "rsm-incentives" && result.data?.rsm ? `${result.data.rsm} · ` : "";
        setSummary(`${subject}Potential ₹${Number(totals.potential || 0).toLocaleString("en-IN")}  ·  Payable ₹${Number(totals.payable || 0).toLocaleString("en-IN")}  ·  Pending ₹${Number(totals.pending || 0).toLocaleString("en-IN")}`);
      } else {
        setSummary("");
      }
    }
    catch (e: any) { setRows([]); setProductRows([]); setError(e?.response?.status === 403 ? "Your account does not have permission to view this section." : "Could not load this section. Check your connection and try again."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [canOpen, isMonthlyReport, monthKey, selectedRsm, tool]);
  useEffect(() => { if (!canOpen) { router.replace("/(employee)/customers/dashboard"); return; } void load(); }, [canOpen, load]);
  const approve = async (id: unknown, action: "approve" | "reject") => {
    try { await api.post(`/customers/workspace/${tool}/`, { id, action }); setRows((current) => current.filter((row) => row.id !== id)); }
    catch { Alert.alert("Could not update claim", "Refresh the list and try again."); }
  };
  const foreground = isDark ? "#F1F7F4" : "#101827"; const muted = isDark ? "#9AA9A3" : "#637083";
  const card = { backgroundColor: isDark ? "#111B18" : "#FFFFFF", borderColor: isDark ? "#263A32" : "#E4EAF0" };
  const rowTitle = (row: ToolRow) => String(tool === "sales-head-incentives" ? row.customer || row.employee || "Sale" : row.customer || row.employee || row.name || row.voucher || "Record");
  const rowDetails = (row: ToolRow) => Object.entries(row).filter(([key, value]) => key !== "id" && value !== null && value !== undefined && value !== "" && key !== "customer" && (tool === "sales-head-incentives" || key !== "employee")).map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join("  ·  ");
  if (!canOpen) return null;
  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: insets.bottom + 105 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.top}><TouchableOpacity accessibilityLabel="Back" onPress={() => router.back()} style={[styles.back, card]}><Ionicons name="arrow-back" size={20} color={foreground} /></TouchableOpacity><View style={styles.heading}><Text style={styles.eyebrow}>CUSTOMERS</Text><Text style={[styles.title, { color: foreground }]}>{title}</Text></View></View>
    {error ? <TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={[styles.notice, { backgroundColor: isDark ? "#33251A" : "#FFF4E5" }]}><Text style={{ color: foreground, fontFamily: Typography.regular }}>{error}  Tap to retry.</Text></TouchableOpacity> : null}
    {isMonthlyReport ? <View style={[styles.monthPicker, card]}><TouchableOpacity accessibilityLabel="Previous month" onPress={() => setReportMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} style={styles.monthArrow}><Ionicons name="chevron-back" size={19} color={foreground} /></TouchableOpacity><Text style={[styles.monthLabel, { color: foreground }]}>{reportMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}{tool === "monthly-sales" ? ` · ${rows.length} sales records` : ""}</Text><TouchableOpacity accessibilityLabel="Next month" onPress={() => setReportMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} style={styles.monthArrow}><Ionicons name="chevron-forward" size={19} color={foreground} /></TouchableOpacity></View> : null}
    {tool === "rsm-incentives" && rsmOptions.length > 0 ? <TouchableOpacity onPress={() => Alert.alert("Select RSM", "Choose the team you are permitted to view.", [...rsmOptions.map((option) => ({ text: option.name, onPress: () => setSelectedRsm(String(option.id)) })), { text: "Cancel", style: "cancel" }])} style={[styles.selector, card]}><Text style={[styles.summaryText, { color: foreground }]}>{selectedRsm ? `RSM: ${rsmOptions.find((option) => String(option.id) === selectedRsm)?.name || "Selected"}` : "Select RSM"}</Text><Ionicons name="chevron-down" size={18} color={muted} /></TouchableOpacity> : null}
    {!!summary ? <View style={[styles.summary, card]}><Text style={[styles.summaryText, { color: foreground }]}>{summary}</Text></View> : null}
    {productRows.length > 0 ? <View style={[styles.productSection, card]}><Text style={[styles.sectionTitle, { color: foreground }]}>Incentive by product</Text>{productRows.map((product, index) => <View key={`${String(product.name)}-${index}`} style={styles.productRow}><Text style={[styles.rowTitle, { color: foreground }]}>{String(product.name || "Product")}</Text><Text style={[styles.detail, { color: muted }]}>Quantity: {String(product.quantity ?? 0)}  ·  Rate: ₹{String(product.rate ?? 0)}</Text><Text style={[styles.detail, { color: muted }]}>Potential: ₹{String(product.potential ?? 0)}  ·  Payable: ₹{String(product.payable ?? 0)}</Text></View>)}</View> : null}
    {loading ? <ActivityIndicator style={{ marginTop: 20 }} color="#20B99A" /> : rows.map((row, index) => <View key={String(row.id ?? index)} style={[styles.row, card]}>
      <View style={styles.icon}><Ionicons name={ICONS[tool] || "document-text-outline"} size={19} color="#159A7C" /></View><View style={{ flex: 1, gap: 5 }}><Text style={[styles.rowTitle, { color: foreground }]}>{rowTitle(row)}</Text><Text style={[styles.detail, { color: muted }]}>{rowDetails(row)}</Text></View>
      {tool === "voucher-approvals" ? <View style={styles.actions}><TouchableOpacity accessibilityLabel="Approve claim" onPress={() => void approve(row.id, "approve")} style={styles.approve}><Ionicons name="checkmark" size={18} color="white" /></TouchableOpacity><TouchableOpacity accessibilityLabel="Reject claim" onPress={() => void approve(row.id, "reject")} style={styles.reject}><Ionicons name="close" size={18} color="white" /></TouchableOpacity></View> : null}
    </View>)}
    {!loading && !error && rows.length === 0 ? <View style={[styles.empty, card]}><Ionicons name={ICONS[tool] || "document-text-outline"} size={28} color="#159A7C" /><Text style={[styles.emptyTitle, { color: foreground }]}>No records to show</Text><Text style={[styles.detail, { color: muted }]}>Pull down to refresh.</Text></View> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({ content: { padding: 16, gap: 12 }, top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }, back: { borderWidth: 1, width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" }, heading: { flex: 1 }, eyebrow: { color: "#20B99A", fontFamily: Typography.bold, fontSize: 10, letterSpacing: 1 }, title: { fontFamily: Typography.heading, fontSize: 22, marginTop: 3 }, notice: { padding: 12, borderRadius: 12 }, monthPicker: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, monthArrow: { width: 34, height: 34, alignItems: "center", justifyContent: "center" }, monthLabel: { flex: 1, textAlign: "center", fontFamily: Typography.semiBold, fontSize: 13 }, summary: { borderWidth: 1, borderRadius: 14, padding: 14 }, selector: { borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, summaryText: { fontFamily: Typography.semiBold, fontSize: 14 }, productSection: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 }, sectionTitle: { fontFamily: Typography.headingSemi, fontSize: 15 }, productRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DCE5E8", paddingTop: 10, gap: 3 }, row: { minHeight: 76, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }, icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#DDF8F0", alignItems: "center", justifyContent: "center" }, rowTitle: { fontFamily: Typography.semiBold, fontSize: 13 }, detail: { fontFamily: Typography.regular, fontSize: 11, lineHeight: 16 }, actions: { gap: 6 }, approve: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#159A7C", alignItems: "center", justifyContent: "center" }, reject: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#DF5262", alignItems: "center", justifyContent: "center" }, empty: { minHeight: 150, borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8 }, emptyTitle: { fontFamily: Typography.semiBold, fontSize: 14 } });
