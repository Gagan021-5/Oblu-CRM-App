import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
type CustomerFilterMenu = "salesperson" | "status" | "balance" | null;
type PortfolioEntry = { kind: "unit"; id: string; name: string; members: ToolRow[] } | { kind: "customer"; row: ToolRow };
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

const portfolioStyles = StyleSheet.create({
  unitCard: { borderWidth: 1, borderRadius: 17, overflow: "hidden" },
  unitHeader: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  unitIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  unitMeta: { marginTop: 3 },
  unitStatus: { borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4 },
  unitActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingVertical: 9 },
  unitMembers: { paddingHorizontal: 10, paddingBottom: 10, gap: 8 },
  ledgerMetrics: { flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderRadius: 13, padding: 10, gap: 8 },
  ledgerMetric: { width: "47%", gap: 3 },
  actions: { flexDirection: "row", gap: 7, flexWrap: "wrap", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E4EAF0", paddingTop: 10 },
  action: { minHeight: 34, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontFamily: Typography.semiBold, fontSize: 10 },
});

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
    "team-customers": hasPermission(permissionProfile, "customer.view") || hasPermission(permissionProfile, "customer.view_all"),
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
  const [rsmPickerOpen, setRsmPickerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSalesperson, setCustomerSalesperson] = useState("All Salespeople");
  const [customerStatus, setCustomerStatus] = useState("All Statuses");
  const [customerBalance, setCustomerBalance] = useState("All Balances");
  const [customerFilterMenu, setCustomerFilterMenu] = useState<CustomerFilterMenu>(null);
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(new Set());
  const [renameUnit, setRenameUnit] = useState<{ id: string; name: string } | null>(null);
  const [renameUnitName, setRenameUnitName] = useState("");
  const [unitActionLoading, setUnitActionLoading] = useState(false);
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
  const customerOverview = tool === "team-customers" ? (() => {
    const units = new Map<string, ToolRow[]>();
    const groups: ToolRow[][] = [];
    for (const row of rows) {
      const unitId = row.unitId == null ? "" : String(row.unitId);
      if (!unitId) groups.push([row]);
      else { const members = units.get(unitId) || []; members.push(row); units.set(unitId, members); }
    }
    groups.push(...units.values());
    const isActiveGroup = (members: ToolRow[]) => members.some((row) => String(row.portfolioStatus || row.status || "").toLowerCase() === "active");
    const active = groups.filter(isActiveGroup).length;
    const inactive = groups.length - active;
    const dueGroups = groups.filter((members) => members.some((row) => Number(row.outstandingPaymentNum || 0) > 0));
    const exposure = rows.reduce((total, row) => total + Math.max(0, Number(row.outstandingPaymentNum) || 0), 0);
    return [
      { label: "TOTAL ACCOUNTS", value: groups.length.toLocaleString("en-IN"), color: foreground, icon: "people-outline" as const },
      { label: "ACTIVE CLIENTS", value: active.toLocaleString("en-IN"), color: "#159A7C", icon: "checkmark-circle-outline" as const },
      { label: "INACTIVE / DORMANT", value: inactive.toLocaleString("en-IN"), color: "#DF5262", icon: "alert-circle-outline" as const },
      { label: "DUE ACCOUNTS", value: dueGroups.length.toLocaleString("en-IN"), color: "#D97706", icon: "time-outline" as const },
      { label: "TOTAL EXPOSURE", value: `₹${exposure.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#159A7C", icon: "cash-outline" as const },
    ];
  })() : [];
  const salespersonOptions = ["All Salespeople", ...Array.from(new Set(rows.map((row) => String(row.assignedSalesperson || "Unassigned"))).values()).sort((a, b) => a.localeCompare(b))];
  const customerStatusOptions = ["All Statuses", "Active", "Inactive"];
  const customerBalanceOptions = ["All Balances", "With Dues", "Settled Balances"];
  const visibleRows = useMemo(() => {
    if (tool !== "team-customers") return rows;
    const search = customerSearch.trim().toLowerCase();
    const units = new Map<string, ToolRow[]>();
    for (const row of rows) {
      const id = row.unitId == null ? "" : String(row.unitId);
      if (id) units.set(id, [...(units.get(id) || []), row]);
    }
    const matchesSearch = (row: ToolRow) => !search || [row.name, row.unitName, row.city, row.state, row.phone, row.assignedSalesperson].some((value) => String(value || "").toLowerCase().includes(search));
    const keep = new Set<ToolRow>();
    for (const members of units.values()) {
      const scopedMembers = members.filter((row) => {
        const matchesSalesperson = customerSalesperson === "All Salespeople" || String(row.assignedSalesperson || "Unassigned") === customerSalesperson;
        const hasDue = Number(row.outstandingPaymentNum || 0) > 0;
        const matchesBalance = customerBalance === "All Balances" || (customerBalance === "With Dues" ? hasDue : !hasDue);
        return matchesSalesperson && matchesBalance;
      });
      const active = scopedMembers.some((row) => String(row.portfolioStatus || "").toLowerCase() === "active");
      const statusMatches = customerStatus === "All Statuses" || (active ? "active" : "inactive") === customerStatus.toLowerCase();
      if (!statusMatches) continue;
      const unitNameMatches = !search || String(members[0]?.unitName || "").toLowerCase().includes(search);
      for (const member of scopedMembers) if (unitNameMatches || matchesSearch(member)) keep.add(member);
    }
    for (const row of rows) {
      if (row.unitId != null) continue;
      const status = String(row.portfolioStatus || "").toLowerCase();
      const matchesStatus = customerStatus === "All Statuses" || status === customerStatus.toLowerCase();
      const hasDue = Number(row.outstandingPaymentNum || 0) > 0;
      const matchesBalance = customerBalance === "All Balances" || (customerBalance === "With Dues" ? hasDue : !hasDue);
      const matchesSalesperson = customerSalesperson === "All Salespeople" || String(row.assignedSalesperson || "Unassigned") === customerSalesperson;
      if (matchesStatus && matchesBalance && matchesSalesperson && matchesSearch(row)) keep.add(row);
    }
    return rows.filter((row) => keep.has(row));
  }, [tool, rows, customerSearch, customerStatus, customerBalance, customerSalesperson]);
  const portfolioEntries = useMemo<PortfolioEntry[]>(() => {
    if (tool !== "team-customers") return [];
    const entries: PortfolioEntry[] = [];
    const units = new Map<string, ToolRow[]>();
    for (const row of visibleRows) {
      const unitId = row.unitId == null ? "" : String(row.unitId);
      if (!unitId) entries.push({ kind: "customer", row });
      else {
        const members = units.get(unitId) || [];
        members.push(row);
        units.set(unitId, members);
      }
    }
    const addedUnits = new Set<string>();
    for (const row of visibleRows) {
      const unitId = row.unitId == null ? "" : String(row.unitId);
      if (!unitId || addedUnits.has(unitId)) continue;
      addedUnits.add(unitId);
      entries.push({ kind: "unit", id: unitId, name: String(row.unitName || row.name || "Customer unit"), members: units.get(unitId) || [] });
    }
    return entries.sort((a, b) => {
      const nameA = a.kind === "unit" ? a.name : String(a.row.name || "");
      const nameB = b.kind === "unit" ? b.name : String(b.row.name || "");
      return nameA.localeCompare(nameB);
    });
  }, [tool, visibleRows]);
  const rowTitle = (row: ToolRow) => String(tool === "sales-head-incentives" ? row.customer || row.employee || "Sale" : row.customer || row.employee || row.name || row.voucher || "Record");
  const rowDetails = (row: ToolRow) => Object.entries(row).filter(([key, value]) => key !== "id" && value !== null && value !== undefined && value !== "" && key !== "customer" && (tool === "sales-head-incentives" || key !== "employee")).map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join("  ·  ");
  const openCustomerDetail = (id: unknown, tab?: string) => router.push({ pathname: "/(employee)/customers/[customerId]", params: { customerId: String(id), ...(tab ? { tab } : {}) } } as any);
  const canEditCustomers = isAdminUser || hasPermission(permissionProfile, "customer.edit");
  const saveUnitName = async () => {
    if (!renameUnit || !renameUnitName.trim()) return;
    setUnitActionLoading(true);
    try {
      await api.post(`/customers/workspace/team-customers/`, { action: "rename_unit", unit_id: renameUnit.id, unit_name: renameUnitName.trim() });
      setRenameUnit(null);
      await load();
    } catch (e: any) {
      Alert.alert("Could not rename unit", e?.response?.data?.detail || e?.response?.data?.error || "Check your permission and try again.");
    } finally { setUnitActionLoading(false); }
  };
  const deleteUnit = (unit: { id: string; name: string }) => Alert.alert("Delete customer unit?", `This removes the grouping for “${unit.name}”. The customer ledgers themselves stay in the system.`, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete unit", style: "destructive", onPress: () => { void (async () => {
      setUnitActionLoading(true);
      try { await api.post(`/customers/workspace/team-customers/`, { action: "delete_unit", unit_id: unit.id }); await load(); }
      catch (e: any) { Alert.alert("Could not delete unit", e?.response?.data?.detail || e?.response?.data?.error || "Check your permission and try again."); }
      finally { setUnitActionLoading(false); }
    })(); } },
  ]);
  const renderPortfolioCustomer = (row: ToolRow, index: number) => {
    const customerName = String(row.name || "Customer");
    const initials = customerName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const displayStatus = String(row.portfolioStatus || row.status || "");
    const status = displayStatus.toLowerCase();
    const statusColor = status === "active" ? "#159A7C" : status === "inactive" ? "#DF5262" : "#637083";
    const location = [row.city || row.district, row.state].filter(Boolean).map(String).filter((value, i, all) => all.indexOf(value) === i).join(", ");
    const customerId = row.id;
    return <View key={String(customerId ?? index)} style={[styles.customerPortfolioCard, card]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open ${customerName} details`} onPress={() => openCustomerDetail(customerId)} activeOpacity={0.78}>
        <View style={styles.customerPortfolioHeader}>
          <View style={[styles.customerAvatar, { backgroundColor: isDark ? "#183B32" : "#E2F7F1" }]}><Text style={[styles.customerAvatarText, { color: "#159A7C" }]}>{initials || "C"}</Text></View>
          <View style={styles.customerIdentity}>
            <Text style={[styles.rowTitle, { color: foreground }]} numberOfLines={2}>{customerName}</Text>
            {!!location && <Text style={[styles.detail, { color: muted }]} numberOfLines={1}><Ionicons name="location-outline" size={12} /> {location}</Text>}
            {!!row.phone && <Text style={[styles.detail, { color: muted }]} numberOfLines={1}><Ionicons name="call-outline" size={12} /> {String(row.phone)}</Text>}
          </View>
          {!!displayStatus && <View style={[styles.statusBadge, { backgroundColor: isDark ? `${statusColor}22` : `${statusColor}14` }]}><View style={[styles.statusDot, { backgroundColor: statusColor }]} /><Text style={[styles.statusText, { color: statusColor }]}>{displayStatus}</Text></View>}
        </View>
        <View style={[portfolioStyles.ledgerMetrics, { backgroundColor: isDark ? "#0E1714" : "#F7F9F8", borderColor: card.borderColor }]}>
          <View style={portfolioStyles.ledgerMetric}><Text style={[styles.metricLabel, { color: muted }]}>ORDERS</Text><Text style={[styles.metricValue, { color: foreground }]}>{Number(row.totalOrders || 0).toLocaleString("en-IN")}</Text></View>
          <View style={portfolioStyles.ledgerMetric}><Text style={[styles.metricLabel, { color: muted }]}>TOTAL VALUE</Text><Text style={[styles.metricValue, { color: foreground }]} numberOfLines={1}>₹{Number(row.totalOrderValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></View>
          <View style={portfolioStyles.ledgerMetric}><Text style={[styles.metricLabel, { color: muted }]}>OUTSTANDING</Text><Text style={[styles.metricValue, { color: Number(row.outstandingPaymentNum || 0) > 0 ? "#D94A55" : "#159A7C" }]} numberOfLines={1}>{String(row.outstandingPayment || "₹0")}</Text></View>
          <View style={portfolioStyles.ledgerMetric}><Text style={[styles.metricLabel, { color: muted }]}>SALESPERSON</Text><Text style={[styles.metricValue, { color: foreground }]} numberOfLines={1}>{String(row.assignedSalesperson || "Unassigned")}</Text></View>
        </View>
        <View style={styles.customerPortfolioFooter}><View style={{ flex: 1, gap: 3 }}><Text style={[styles.detail, { color: muted }]}><Ionicons name="calendar-outline" size={12} /> Last order: {String(row.lastOrderDate || "—")}</Text><Text style={[styles.detail, { color: muted }]}><Ionicons name="time-outline" size={12} /> Last contact: {String(row.lastContactTime || "No recent contact")}</Text></View><Ionicons name="chevron-forward" size={17} color={muted} /></View>
      </TouchableOpacity>
      <View style={portfolioStyles.actions}>
        <TouchableOpacity onPress={() => openCustomerDetail(customerId, "purchases")} style={[portfolioStyles.action, { borderColor: card.borderColor }]}><Ionicons name="cart-outline" size={14} color="#159A7C" /><Text style={[portfolioStyles.actionText, { color: foreground }]}>Purchases</Text></TouchableOpacity>
        {hasPermission(permissionProfile, "payment.view") || isAdminUser || isAccountant ? <TouchableOpacity onPress={() => openCustomerDetail(customerId, "payments")} style={[portfolioStyles.action, { borderColor: card.borderColor }]}><Ionicons name="card-outline" size={14} color="#159A7C" /><Text style={[portfolioStyles.actionText, { color: foreground }]}>Payments</Text></TouchableOpacity> : null}
        <TouchableOpacity onPress={() => openCustomerDetail(customerId, "remarks")} style={[portfolioStyles.action, { borderColor: card.borderColor }]}><Ionicons name="chatbubble-outline" size={14} color="#159A7C" /><Text style={[portfolioStyles.actionText, { color: foreground }]}>Remarks</Text></TouchableOpacity>
      </View>
    </View>;
  };
  if (!canOpen) return null;
  return <><ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: insets.bottom + 105 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.top}><TouchableOpacity accessibilityLabel="Back" onPress={() => router.back()} style={[styles.back, card]}><Ionicons name="arrow-back" size={20} color={foreground} /></TouchableOpacity><View style={styles.heading}><Text style={styles.eyebrow}>CUSTOMERS</Text><Text style={[styles.title, { color: foreground }]}>{title}</Text></View></View>
    {error ? <TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={[styles.notice, { backgroundColor: isDark ? "#33251A" : "#FFF4E5" }]}><Text style={{ color: foreground, fontFamily: Typography.regular }}>{error}  Tap to retry.</Text></TouchableOpacity> : null}
    {isMonthlyReport ? <View style={[styles.monthPicker, card]}><TouchableOpacity accessibilityLabel="Previous month" onPress={() => setReportMonth((value) => new Date(value.getFullYear(), value.getMonth() - 1, 1))} style={styles.monthArrow}><Ionicons name="chevron-back" size={19} color={foreground} /></TouchableOpacity><Text style={[styles.monthLabel, { color: foreground }]}>{reportMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}{tool === "monthly-sales" ? ` · ${rows.length} sales records` : ""}</Text><TouchableOpacity accessibilityLabel="Next month" onPress={() => setReportMonth((value) => new Date(value.getFullYear(), value.getMonth() + 1, 1))} style={styles.monthArrow}><Ionicons name="chevron-forward" size={19} color={foreground} /></TouchableOpacity></View> : null}
    {tool === "rsm-incentives" && rsmOptions.length > 0 ? <View style={[styles.rsmPicker, card]}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Choose RSM team" accessibilityState={{ expanded: rsmPickerOpen }} onPress={() => setRsmPickerOpen((open) => !open)} style={styles.selector}>
        <Text style={[styles.summaryText, { color: foreground }]}>{selectedRsm ? `RSM: ${rsmOptions.find((option) => String(option.id) === selectedRsm)?.name || "Select a team"}` : "Select RSM team"}</Text>
        <Ionicons name={rsmPickerOpen ? "chevron-up" : "chevron-down"} size={18} color={muted} />
      </TouchableOpacity>
      {rsmPickerOpen ? <View style={[styles.rsmOptions, { borderTopColor: card.borderColor }]}>
        {rsmOptions.map((option) => {
          const isSelected = String(option.id) === selectedRsm;
          return <TouchableOpacity key={String(option.id)} accessibilityRole="radio" accessibilityState={{ checked: isSelected }} onPress={() => { setSelectedRsm(String(option.id)); setRsmPickerOpen(false); }} style={[styles.rsmOption, isSelected && { backgroundColor: isDark ? "#183B32" : "#EAF9F5" }]}>
            <Text style={[styles.rsmOptionText, { color: foreground }]}>{option.name}</Text>
            {isSelected ? <Ionicons name="checkmark" size={19} color="#159A7C" /> : null}
          </TouchableOpacity>;
        })}
      </View> : null}
    </View> : null}
    {tool === "team-customers" && !loading ? <View style={styles.portfolioOverview}>
      <View style={styles.overviewGrid}>{customerOverview.map((metric) => <View key={metric.label} style={[styles.overviewMetric, card]}>
        <View style={styles.overviewMetricTop}><Text style={[styles.metricLabel, { color: muted }]}>{metric.label}</Text><Ionicons name={metric.icon} size={17} color={metric.color} /></View>
        <Text style={[styles.overviewValue, { color: metric.color }]} numberOfLines={1} adjustsFontSizeToFit>{metric.value}</Text>
      </View>)}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilters}>
        {[
          { label: "All Accounts", active: customerStatus === "All Statuses" && customerBalance === "All Balances", onPress: () => { setCustomerStatus("All Statuses"); setCustomerBalance("All Balances"); } },
          { label: "Active Only", active: customerStatus === "Active", onPress: () => { setCustomerStatus("Active"); setCustomerBalance("All Balances"); } },
          { label: "Inactive Only", active: customerStatus === "Inactive", onPress: () => { setCustomerStatus("Inactive"); setCustomerBalance("All Balances"); } },
          { label: "With Dues", active: customerBalance === "With Dues", onPress: () => setCustomerBalance("With Dues") },
          { label: "Settled Balances", active: customerBalance === "Settled Balances", onPress: () => setCustomerBalance("Settled Balances") },
        ].map((filter) => <TouchableOpacity key={filter.label} onPress={filter.onPress} style={[styles.quickFilter, filter.active && styles.quickFilterActive, { borderColor: filter.active ? "#159A7C" : card.borderColor }]}><Text style={[styles.quickFilterText, { color: filter.active ? "#FFFFFF" : foreground }]}>{filter.label}</Text></TouchableOpacity>)}
      </ScrollView>
      <View style={[styles.customerFilters, card]}>
        <Text style={[styles.filterLabel, { color: muted }]}>SALESPERSON</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Filter by salesperson" accessibilityState={{ expanded: customerFilterMenu === "salesperson" }} onPress={() => setCustomerFilterMenu((menu) => menu === "salesperson" ? null : "salesperson")} style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}>
          <Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{customerSalesperson}</Text><Ionicons name={customerFilterMenu === "salesperson" ? "chevron-up" : "chevron-down"} size={16} color={muted} />
        </TouchableOpacity>
        {customerFilterMenu === "salesperson" ? <View style={[styles.filterOptions, { borderColor: card.borderColor }]}>{salespersonOptions.map((option) => <TouchableOpacity key={option} onPress={() => { setCustomerSalesperson(option); setCustomerFilterMenu(null); }} style={styles.filterOption}><Text style={[styles.filterOptionText, { color: foreground }]}>{option}</Text>{customerSalesperson === option ? <Ionicons name="checkmark" size={17} color="#159A7C" /> : null}</TouchableOpacity>)}</View> : null}
        <Text style={[styles.filterLabel, { color: muted, marginTop: 10 }]}>SEARCH CLIENT / UNIT / PHONE</Text>
        <View style={[styles.customerSearch, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}><Ionicons name="search-outline" size={17} color="#159A7C" /><TextInput accessibilityLabel="Search customers" value={customerSearch} onChangeText={setCustomerSearch} placeholder="Search by name, city, or phone…" placeholderTextColor={muted} style={[styles.customerSearchInput, { color: foreground }]} returnKeyType="search" /><TouchableOpacity accessibilityLabel="Clear search" onPress={() => setCustomerSearch("")} hitSlop={8}><Ionicons name="close-circle" size={17} color={muted} /></TouchableOpacity></View>
        <View style={styles.filterRow}>
          <View style={styles.filterColumn}><Text style={[styles.filterLabel, { color: muted }]}>CLIENT STATUS</Text><TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: customerFilterMenu === "status" }} onPress={() => setCustomerFilterMenu((menu) => menu === "status" ? null : "status")} style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}><Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{customerStatus}</Text><Ionicons name={customerFilterMenu === "status" ? "chevron-up" : "chevron-down"} size={16} color={muted} /></TouchableOpacity></View>
          <View style={styles.filterColumn}><Text style={[styles.filterLabel, { color: muted }]}>OUTSTANDING</Text><TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: customerFilterMenu === "balance" }} onPress={() => setCustomerFilterMenu((menu) => menu === "balance" ? null : "balance")} style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}><Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{customerBalance}</Text><Ionicons name={customerFilterMenu === "balance" ? "chevron-up" : "chevron-down"} size={16} color={muted} /></TouchableOpacity></View>
        </View>
        {customerFilterMenu === "status" || customerFilterMenu === "balance" ? <View style={[styles.filterOptions, { borderColor: card.borderColor }]}>{(customerFilterMenu === "status" ? customerStatusOptions : customerBalanceOptions).map((option) => { const selected = customerFilterMenu === "status" ? customerStatus : customerBalance; return <TouchableOpacity key={option} onPress={() => { if (customerFilterMenu === "status") setCustomerStatus(option); else setCustomerBalance(option); setCustomerFilterMenu(null); }} style={styles.filterOption}><Text style={[styles.filterOptionText, { color: foreground }]}>{option}</Text>{selected === option ? <Ionicons name="checkmark" size={17} color="#159A7C" /> : null}</TouchableOpacity>; })}</View> : null}
        <View style={styles.filterResults}><Text style={[styles.detail, { color: muted }]}>{portfolioEntries.length} accounts shown · {visibleRows.length} ledgers</Text><TouchableOpacity onPress={() => { setCustomerSearch(""); setCustomerSalesperson("All Salespeople"); setCustomerStatus("All Statuses"); setCustomerBalance("All Balances"); setCustomerFilterMenu(null); }}><Text style={styles.resetFilters}>Reset filters</Text></TouchableOpacity></View>
      </View>
    </View> : null}
    {!!summary ? <View style={[styles.summary, card]}><Text style={[styles.summaryText, { color: foreground }]}>{summary}</Text></View> : null}
    {productRows.length > 0 ? <View style={[styles.productSection, card]}><Text style={[styles.sectionTitle, { color: foreground }]}>Incentive by product</Text>{productRows.map((product, index) => <View key={`${String(product.name)}-${index}`} style={styles.productRow}><Text style={[styles.rowTitle, { color: foreground }]}>{String(product.name || "Product")}</Text><Text style={[styles.detail, { color: muted }]}>Quantity: {String(product.quantity ?? 0)}  ·  Rate: ₹{String(product.rate ?? 0)}</Text><Text style={[styles.detail, { color: muted }]}>Potential: ₹{String(product.potential ?? 0)}  ·  Payable: ₹{String(product.payable ?? 0)}</Text></View>)}</View> : null}
    {loading ? <ActivityIndicator style={{ marginTop: 20 }} color="#20B99A" /> : tool === "team-customers" ? portfolioEntries.map((entry, index) => {
      if (entry.kind === "customer") return renderPortfolioCustomer(entry.row, index);
      const orders = entry.members.reduce((total, member) => total + (Number(member.totalOrders) || 0), 0);
      const value = entry.members.reduce((total, member) => total + (Number(member.totalOrderValue) || 0), 0);
      const outstanding = entry.members.reduce((total, member) => total + Math.max(0, Number(member.outstandingPaymentNum) || 0), 0);
      const active = entry.members.some((member) => String(member.portfolioStatus || member.status || "").toLowerCase() === "active");
      const unitStatusColor = active ? "#159A7C" : "#DF5262";
      return <View key={`unit-${entry.id}`} style={[portfolioStyles.unitCard, card]}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${expandedUnitIds.has(entry.id) ? "Collapse" : "Expand"} ${entry.name}, ${entry.members.length} ledgers`} accessibilityState={{ expanded: expandedUnitIds.has(entry.id) }} onPress={() => setExpandedUnitIds((current) => { const next = new Set(current); if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id); return next; })} style={portfolioStyles.unitHeader}>
          <View style={[portfolioStyles.unitIcon, { backgroundColor: isDark ? "#183B32" : "#E2F7F1" }]}><Ionicons name="business-outline" size={19} color="#159A7C" /></View>
          <View style={styles.customerIdentity}><Text style={[styles.rowTitle, { color: foreground }]} numberOfLines={2}>{entry.name}</Text><Text style={[styles.detail, { color: muted }]}>{entry.members.length} {entry.members.length === 1 ? "ledger" : "ledgers"} · {orders} orders</Text><Text style={[styles.detail, portfolioStyles.unitMeta, { color: muted }]}>Value ₹{value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} · Due ₹{outstanding.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</Text></View>
          <View style={{ alignItems: "center", gap: 5 }}><View style={[portfolioStyles.unitStatus, { backgroundColor: isDark ? `${unitStatusColor}22` : `${unitStatusColor}14` }]}><Text style={[styles.statusText, { color: unitStatusColor }]}>{active ? "Active" : "Inactive"}</Text></View><Ionicons name={expandedUnitIds.has(entry.id) ? "chevron-up" : "chevron-down"} size={19} color="#159A7C" /></View>
        </TouchableOpacity>
        {canEditCustomers ? <View style={[portfolioStyles.unitActions, { borderTopColor: card.borderColor }]}>
          <TouchableOpacity accessibilityRole="button" onPress={() => { setRenameUnit({ id: entry.id, name: entry.name }); setRenameUnitName(entry.name); }} style={[portfolioStyles.action, { borderColor: card.borderColor }]}><Ionicons name="create-outline" size={14} color={muted} /><Text style={[portfolioStyles.actionText, { color: foreground }]}>Rename</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => deleteUnit({ id: entry.id, name: entry.name })} style={[portfolioStyles.action, { borderColor: "#F3C5CB" }]}><Ionicons name="trash-outline" size={14} color="#DF5262" /><Text style={[portfolioStyles.actionText, { color: "#DF5262" }]}>Delete Unit</Text></TouchableOpacity>
        </View> : null}
        {expandedUnitIds.has(entry.id) ? <View style={portfolioStyles.unitMembers}>{entry.members.map((member, memberIndex) => renderPortfolioCustomer(member, memberIndex))}</View> : null}
      </View>;
    }) : visibleRows.map((row, index) => {
      return <View key={String(row.id ?? index)} style={[styles.row, card]}>
        <View style={styles.icon}><Ionicons name={ICONS[tool] || "document-text-outline"} size={19} color="#159A7C" /></View><View style={{ flex: 1, gap: 5 }}><Text style={[styles.rowTitle, { color: foreground }]}>{rowTitle(row)}</Text><Text style={[styles.detail, { color: muted }]}>{rowDetails(row)}</Text></View>
        {tool === "voucher-approvals" ? <View style={styles.actions}><TouchableOpacity accessibilityLabel="Approve claim" onPress={() => void approve(row.id, "approve")} style={styles.approve}><Ionicons name="checkmark" size={18} color="white" /></TouchableOpacity><TouchableOpacity accessibilityLabel="Reject claim" onPress={() => void approve(row.id, "reject")} style={styles.reject}><Ionicons name="close" size={18} color="white" /></TouchableOpacity></View> : null}
      </View>;
    })}
    {!loading && !error && visibleRows.length === 0 ? <View style={[styles.empty, card]}><Ionicons name={ICONS[tool] || "document-text-outline"} size={28} color="#159A7C" /><Text style={[styles.emptyTitle, { color: foreground }]}>{tool === "team-customers" && rows.length ? "No customers match these filters" : "No records to show"}</Text><Text style={[styles.detail, { color: muted }]}>{tool === "team-customers" && rows.length ? "Try changing the search or filters." : "Pull down to refresh."}</Text></View> : null}
  </ScrollView><Modal visible={renameUnit !== null} transparent animationType="fade" onRequestClose={() => setRenameUnit(null)}>
    <View style={styles.modalBackdrop}><View style={[styles.renameModal, card]}>
      <Text style={[styles.sectionTitle, { color: foreground }]}>Rename customer unit</Text>
      <TextInput accessibilityLabel="Customer unit name" autoFocus value={renameUnitName} onChangeText={setRenameUnitName} placeholder="Unit name" placeholderTextColor={muted} style={[styles.renameInput, { color: foreground, backgroundColor: colors.background, borderColor: card.borderColor }]} maxLength={255} returnKeyType="done" onSubmitEditing={() => void saveUnitName()} />
      <View style={styles.renameButtons}><TouchableOpacity disabled={unitActionLoading} onPress={() => setRenameUnit(null)} style={[styles.renameButton, { borderColor: card.borderColor }]}><Text style={[styles.renameButtonText, { color: foreground }]}>Cancel</Text></TouchableOpacity><TouchableOpacity disabled={unitActionLoading || !renameUnitName.trim()} onPress={() => void saveUnitName()} style={[styles.renameButton, styles.renameSave]}><Text style={[styles.renameButtonText, { color: "#FFFFFF" }]}>{unitActionLoading ? "Saving…" : "Save"}</Text></TouchableOpacity></View>
    </View></View>
  </Modal></>;
}

const styles = StyleSheet.create({ content: { padding: 16, gap: 12 }, top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 }, back: { borderWidth: 1, width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" }, heading: { flex: 1 }, eyebrow: { color: "#20B99A", fontFamily: Typography.bold, fontSize: 10, letterSpacing: 1 }, title: { fontFamily: Typography.heading, fontSize: 22, marginTop: 3 }, notice: { padding: 12, borderRadius: 12 }, monthPicker: { minHeight: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, monthArrow: { width: 34, height: 34, alignItems: "center", justifyContent: "center" }, monthLabel: { flex: 1, textAlign: "center", fontFamily: Typography.semiBold, fontSize: 13 }, summary: { borderWidth: 1, borderRadius: 14, padding: 14 }, rsmPicker: { borderWidth: 1, borderRadius: 14, overflow: "hidden" }, selector: { minHeight: 50, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rsmOptions: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 4 }, rsmOption: { minHeight: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, rsmOptionText: { fontFamily: Typography.semiBold, fontSize: 14 }, summaryText: { fontFamily: Typography.semiBold, fontSize: 14 }, portfolioOverview: { gap: 10, marginBottom: 2 }, overviewGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 }, overviewMetric: { width: "48%", minHeight: 82, borderWidth: 1, borderRadius: 16, padding: 12, justifyContent: "space-between" }, overviewMetricTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 3 }, overviewValue: { fontFamily: Typography.heading, fontSize: 20 }, customerFilters: { borderWidth: 1, borderRadius: 16, padding: 12 }, filterLabel: { fontFamily: Typography.bold, fontSize: 9, letterSpacing: 0.55, marginBottom: 5 }, filterSelect: { minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }, filterSelectText: { flex: 1, fontFamily: Typography.regular, fontSize: 12 }, filterOptions: { borderWidth: 1, borderRadius: 11, marginTop: 4, overflow: "hidden" }, filterOption: { minHeight: 42, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, filterOptionText: { fontFamily: Typography.regular, fontSize: 12 }, customerSearch: { minHeight: 44, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 }, customerSearchInput: { flex: 1, paddingVertical: 8, fontFamily: Typography.regular, fontSize: 12 }, filterRow: { flexDirection: "row", gap: 9, marginTop: 10 }, filterColumn: { flex: 1 }, filterResults: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, resetFilters: { fontFamily: Typography.semiBold, color: "#159A7C", fontSize: 11 }, quickFilters: { gap: 7, paddingVertical: 1 }, quickFilter: { minHeight: 35, borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" }, quickFilterActive: { backgroundColor: "#159A7C" }, quickFilterText: { fontFamily: Typography.semiBold, fontSize: 11 }, modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 22 }, renameModal: { borderRadius: 18, padding: 18, gap: 14 }, renameInput: { minHeight: 46, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, fontFamily: Typography.regular, fontSize: 14 }, renameButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 9 }, renameButton: { minHeight: 40, borderWidth: 1, borderRadius: 11, paddingHorizontal: 16, justifyContent: "center", alignItems: "center" }, renameSave: { backgroundColor: "#159A7C", borderColor: "#159A7C" }, renameButtonText: { fontFamily: Typography.semiBold, fontSize: 13 }, productSection: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 }, sectionTitle: { fontFamily: Typography.headingSemi, fontSize: 15 }, productRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DCE5E8", paddingTop: 10, gap: 3 }, customerPortfolioCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 12 }, customerPortfolioHeader: { flexDirection: "row", alignItems: "center", gap: 10 }, customerAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, customerAvatarText: { fontFamily: Typography.bold, fontSize: 13 }, customerIdentity: { flex: 1, gap: 3 }, statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 }, statusDot: { width: 6, height: 6, borderRadius: 3 }, statusText: { fontFamily: Typography.semiBold, fontSize: 10 }, customerMetrics: { flexDirection: "row", borderWidth: 1, borderRadius: 13, padding: 10 }, customerMetric: { flex: 1, gap: 3 }, metricDivider: { width: StyleSheet.hairlineWidth, marginHorizontal: 10 }, metricLabel: { fontFamily: Typography.bold, fontSize: 9, letterSpacing: 0.5 }, metricValue: { fontFamily: Typography.semiBold, fontSize: 13 }, customerPortfolioFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, row: { minHeight: 76, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 }, icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#DDF8F0", alignItems: "center", justifyContent: "center" }, rowTitle: { fontFamily: Typography.semiBold, fontSize: 13 }, detail: { fontFamily: Typography.regular, fontSize: 11, lineHeight: 16 }, actions: { gap: 6 }, approve: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#159A7C", alignItems: "center", justifyContent: "center" }, reject: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#DF5262", alignItems: "center", justifyContent: "center" }, empty: { minHeight: 150, borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 8 }, emptyTitle: { fontFamily: Typography.semiBold, fontSize: 14 } });
