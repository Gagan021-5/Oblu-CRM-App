import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "@/services/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, hasRole } from "@/services/permissionService";
import { Typography } from "@/constants/theme";

type ToolRow = Record<string, any>;
type RsmOption = { id: number | string; name: string };
type CustomerFilterMenu = "salesperson" | "status" | "balance" | "missing_cat" | "score" | null;
type PortfolioEntry =
  | { kind: "unit"; id: string; name: string; members: ToolRow[] }
  | { kind: "customer"; row: ToolRow };

const TITLES: Record<string, string> = {
  "team-customers": "Team Customers",
  "payment-followups": "Payment Follow-ups",
  "monthly-sales": "Monthly Sales Report",
  "my-incentives": "My Paid Incentives",
  "rsm-incentives": "RSM Team Incentives",
  "sales-head-incentives": "Sales Head Incentives",
  "cross-selling": "Cross-Selling Matrix",
  "voucher-approvals": "Voucher Approvals",
};

const ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  "team-customers": "people-outline",
  "payment-followups": "cash-outline",
  "monthly-sales": "calendar-outline",
  "my-incentives": "wallet-outline",
  "rsm-incentives": "people-outline",
  "sales-head-incentives": "git-network-outline",
  "cross-selling": "grid-outline",
  "voucher-approvals": "checkbox-outline",
};

const CROSS_SELLING_CATS = [
  { id: "template_sheet", name: "Template Sheet", badge: "0.6mm" },
  { id: "aligner_sheet", name: "Aligner Sheet", badge: "0.76mm / 0.8mm" },
  { id: "retainer_sheet", name: "Retainer Sheet", badge: "1.0mm" },
  { id: "resin", name: "Resin", badge: "3D Print" },
  { id: "other_consumable", name: "Other Consumables", badge: "Box/Chewies" },
];

export default function CustomerToolScreen() {
  const { tool } = useLocalSearchParams<{ tool: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, permissionProfile } = useAuth();
  const roleText = `${user?.role || ""} ${permissionProfile?.user.role || ""}`.toLowerCase();
  const isSuperuser = roleText.includes("superuser");
  const userHasRole = (role: string) =>
    hasRole(permissionProfile, role) ||
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

  const [rows, setRows] = useState<ToolRow[]>([]);
  const [productRows, setProductRows] = useState<ToolRow[]>([]);
  const [rsmOptions, setRsmOptions] = useState<RsmOption[]>([]);
  const [selectedRsm, setSelectedRsm] = useState<string | null>(null);
  const [rsmPickerOpen, setRsmPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");

  // Filters State
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSalesperson, setCustomerSalesperson] = useState("All Salespeople");
  const [serverSalespeople, setServerSalespeople] = useState<string[]>([]);
  const [customerStatus, setCustomerStatus] = useState("All Statuses");
  const [customerBalance, setCustomerBalance] = useState("All Balances");
  const [filterMenu, setFilterMenu] = useState<CustomerFilterMenu>(null);

  // Cross-selling specific filter state
  const [csMissingCat, setCsMissingCat] = useState("All Missing Categories");
  const [csScore, setCsScore] = useState("All Scores");
  const [crossSellingStats, setCrossSellingStats] = useState<any>(null);

  // Payment follow-up specific state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All Payments");
  const [newRemarkModal, setNewRemarkModal] = useState<{ id: string | number; customer: string } | null>(null);
  const [newRemarkText, setNewRemarkText] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);

  // Customer Unit state
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(new Set());
  const [renameUnit, setRenameUnit] = useState<{ id: string; name: string } | null>(null);
  const [renameUnitName, setRenameUnitName] = useState("");
  const [unitActionLoading, setUnitActionLoading] = useState(false);

  // Monthly date state
  const [reportMonth, setReportMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const monthKey = `${reportMonth.getFullYear()}-${String(reportMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = reportMonth.toLocaleString("default", { month: "long", year: "numeric" });
  const isMonthlyReport = ["monthly-sales", "my-incentives", "rsm-incentives", "sales-head-incentives"].includes(tool);

  const title = TITLES[tool] || "Customer Workspace";

  const load = useCallback(async () => {
    if (!canOpen) return;
    setError("");
    try {
      let result: any;
      if (tool === "team-customers") {
        const params: Record<string, string> = {};
        if (customerSalesperson !== "All Salespeople") {
          params.salesperson = customerSalesperson;
        }
        result = await api.get("/customers/workspace/team-customers/", { params });
        if (!result?.data || (Array.isArray(result.data) && result.data.length === 0)) {
          result = await api.get("/customers/", { params: { page_size: 250, ...params } });
        }
      } else {
        const reportParams = tool === "monthly-sales" ? { month: monthKey } : isMonthlyReport ? { month_picker: monthKey } : {};
        result = await api.get(`/customers/workspace/${tool}/`, {
          params: { ...reportParams, ...(tool === "rsm-incentives" && selectedRsm ? { rsm: selectedRsm } : {}) },
        });
      }

      const rawRows = Array.isArray(result?.data) ? result.data : (result?.data?.rows || result?.data?.results || []);
      setRows(rawRows);

      if (Array.isArray(result?.data?.salespersons) && result.data.salespersons.length > 0) {
        setServerSalespeople(result.data.salespersons);
      }

      if (tool === "cross-selling" && result?.data?.stats) {
        setCrossSellingStats(result.data.stats);
      }

      setProductRows(tool === "my-incentives" && Array.isArray(result?.data?.products) ? result.data.products : []);
      if (tool === "rsm-incentives") {
        const options = Array.isArray(result.data?.rsms) ? result.data.rsms : [];
        setRsmOptions(options);
        if (result.data?.rsm_id != null && selectedRsm !== String(result.data.rsm_id)) {
          setSelectedRsm(String(result.data.rsm_id));
        }
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
    } catch (e: any) {
      const status = e?.response?.status;
      console.warn(`[CustomerTool:${tool}] API request failed:`, status ? `HTTP ${status}` : e?.message || "Network error");
      setRows([]);
      setProductRows([]);
      setError(
        status === 401
          ? "Your session is not valid. Sign in again to load this section."
          : status === 403
          ? "Your account does not have permission to view this section."
          : "Could not load this section. Check your connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canOpen, customerSalesperson, isMonthlyReport, monthKey, selectedRsm, tool]);

  useEffect(() => {
    if (!canOpen) {
      router.replace("/(employee)/customers/dashboard");
      return;
    }
    void load();
  }, [canOpen, load]);

  const changeMonth = (delta: number) => {
    setReportMonth((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + delta);
      return next;
    });
  };

  const foreground = isDark ? "#F1F7F4" : "#101827";
  const muted = isDark ? "#9AA9A3" : "#637083";
  const card = { backgroundColor: isDark ? "#111B18" : "#FFFFFF", borderColor: isDark ? "#263A32" : "#E4EAF0" };

  // Salesperson Options from server and rows
  const salespersonOptions = useMemo(() => {
    const set = new Set<string>(serverSalespeople);
    rows.forEach((r) => {
      const sp = r.assignedSalesperson || r.salesperson;
      if (sp && sp !== "None" && sp !== "null") set.add(String(sp));
    });
    return ["All Salespeople", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [rows, serverSalespeople]);

  // Dynamic filter for team customers & other tools
  const visibleRows = useMemo(() => {
    const search = customerSearch.trim().toLowerCase();

    if (tool === "team-customers") {
      const units = new Map<string, ToolRow[]>();
      for (const row of rows) {
        const id = row.unitId == null ? "" : String(row.unitId);
        if (id) units.set(id, [...(units.get(id) || []), row]);
      }
      const matchesSearch = (row: ToolRow) =>
        !search ||
        [row.name, row.unitName, row.city, row.state, row.phone, row.assignedSalesperson]
          .some((val) => String(val || "").toLowerCase().includes(search));

      const keep = new Set<ToolRow>();
      for (const members of units.values()) {
        const scopedMembers = members.filter((row) => {
          const matchesSP =
            customerSalesperson === "All Salespeople" ||
            String(row.assignedSalesperson || "Unassigned") === customerSalesperson;
          const num = Number(row.outstandingPaymentNum || 0);
          const hasDue = num > 0;
          const matchesBal =
            customerBalance === "All Balances" ||
            (customerBalance === "With Dues" ? hasDue : !hasDue);
          return matchesSP && matchesBal;
        });
        const active = scopedMembers.some((row) => String(row.portfolioStatus || "").toLowerCase() === "active");
        const statusMatches =
          customerStatus === "All Statuses" ||
          (active ? "active" : "inactive") === customerStatus.toLowerCase();
        if (!statusMatches) continue;

        const unitNameMatches = !search || String(members[0]?.unitName || "").toLowerCase().includes(search);
        for (const member of scopedMembers) {
          if (unitNameMatches || matchesSearch(member)) keep.add(member);
        }
      }

      for (const row of rows) {
        if (row.unitId != null) continue;
        const status = String(row.portfolioStatus || "").toLowerCase();
        const matchesStatus = customerStatus === "All Statuses" || status === customerStatus.toLowerCase();
        const num = Number(row.outstandingPaymentNum || 0);
        const hasDue = num > 0;
        const matchesBal =
          customerBalance === "All Balances" ||
          (customerBalance === "With Dues" ? hasDue : !hasDue);
        const matchesSP =
          customerSalesperson === "All Salespeople" ||
          String(row.assignedSalesperson || "Unassigned") === customerSalesperson;
        if (matchesStatus && matchesBal && matchesSP && matchesSearch(row)) {
          keep.add(row);
        }
      }
      return rows.filter((row) => keep.has(row));
    }

    if (tool === "cross-selling") {
      return rows.filter((row) => {
        const matchesSP =
          customerSalesperson === "All Salespeople" ||
          String(row.salesperson || "Unassigned") === customerSalesperson;
        const matchesSearch =
          !search ||
          [row.customer, row.city, row.state, row.phone, row.salesperson]
            .some((val) => String(val || "").toLowerCase().includes(search));

        const status = String(row.customer_status || (row.is_active ? "active" : "inactive")).toLowerCase();
        const matchesStatus =
          customerStatus === "All Statuses" ||
          status === customerStatus.toLowerCase();

        const matchesScore =
          csScore === "All Scores" ||
          String(row.bought_count || row.bought || 0) === csScore.charAt(0);

        const missingArr: string[] = Array.isArray(row.missing) ? row.missing : [];
        const missingIds: string[] = Array.isArray(row.missing_cat_ids) ? row.missing_cat_ids : [];
        const matchesMissing =
          csMissingCat === "All Missing Categories" ||
          missingArr.some((m) => m.toLowerCase().includes(csMissingCat.toLowerCase())) ||
          missingIds.includes(csMissingCat.toLowerCase());

        return matchesSP && matchesSearch && matchesStatus && matchesScore && matchesMissing;
      });
    }

    if (tool === "payment-followups") {
      return rows.filter((row) => {
        const matchesSP =
          customerSalesperson === "All Salespeople" ||
          String(row.salesperson || row.sp || "Unassigned") === customerSalesperson;
        const matchesSearch =
          !search ||
          [row.customer, row.invoice, row.voucher]
            .some((val) => String(val || "").toLowerCase().includes(search));

        const isOverdue = Boolean(row.overdue || row.is_credit_period_crossed);
        const matchesPaymentStatus =
          paymentStatusFilter === "All Payments" ||
          (paymentStatusFilter === "Overdue Only" && isOverdue) ||
          (paymentStatusFilter === "Pending" && !isOverdue);

        return matchesSP && matchesSearch && matchesPaymentStatus;
      });
    }

    if (tool === "monthly-sales") {
      return rows.filter((row) => {
        const matchesSearch =
          !search ||
          [row.customer, row.product, row.voucher, row.voucher_no]
            .some((val) => String(val || "").toLowerCase().includes(search));
        return matchesSearch;
      });
    }

    return rows;
  }, [
    tool,
    rows,
    customerSearch,
    customerSalesperson,
    customerStatus,
    customerBalance,
    csScore,
    csMissingCat,
    paymentStatusFilter,
  ]);

  // Recalculate customer overview strictly from visibleRows (Problem 2 Fix)
  const customerOverview = useMemo(() => {
    if (tool !== "team-customers") return [];
    const units = new Map<string, ToolRow[]>();
    const groups: ToolRow[][] = [];
    for (const row of visibleRows) {
      const unitId = row.unitId == null ? "" : String(row.unitId);
      if (!unitId) groups.push([row]);
      else {
        const members = units.get(unitId) || [];
        members.push(row);
        units.set(unitId, members);
      }
    }
    groups.push(...units.values());
    const isActiveGroup = (members: ToolRow[]) =>
      members.some((row) => String(row.portfolioStatus || row.status || "").toLowerCase() === "active");
    const active = groups.filter(isActiveGroup).length;
    const inactive = groups.length - active;
    const dueGroups = groups.filter((members) =>
      members.some((row) => Number(row.outstandingPaymentNum || 0) > 0)
    );
    const exposure = visibleRows.reduce(
      (total, row) => total + Math.max(0, Number(row.outstandingPaymentNum) || 0),
      0
    );

    return [
      { label: "TOTAL ACCOUNTS", value: groups.length.toLocaleString("en-IN"), color: foreground, icon: "people-outline" as const },
      { label: "ACTIVE CLIENTS", value: active.toLocaleString("en-IN"), color: "#159A7C", icon: "checkmark-circle-outline" as const },
      { label: "INACTIVE / DORMANT", value: inactive.toLocaleString("en-IN"), color: "#DF5262", icon: "alert-circle-outline" as const },
      { label: "DUE ACCOUNTS", value: dueGroups.length.toLocaleString("en-IN"), color: "#D97706", icon: "time-outline" as const },
      { label: "TOTAL EXPOSURE", value: `₹${exposure.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, color: "#159A7C", icon: "cash-outline" as const },
    ];
  }, [tool, visibleRows, foreground]);

  // Portfolio entries for team-customers
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

  const openCustomerDetail = (id: unknown, tab?: string) =>
    router.push({ pathname: "/(employee)/customers/[customerId]", params: { customerId: String(id), ...(tab ? { tab } : {}) } } as any);

  const approve = async (id: unknown, action: "approve" | "reject") => {
    try {
      await api.post(`/customers/workspace/${tool}/`, { id, action });
      setRows((current) => current.filter((row) => row.id !== id));
    } catch {
      Alert.alert("Could not update claim", "Refresh the list and try again.");
    }
  };

  // Toggle ticket status for payment-followups
  const toggleTicket = async (voucherStatusId: string | number, currentStatus: string) => {
    const nextAction = currentStatus === "RAISED" ? "solve" : "raise";
    setActionInProgress(true);
    try {
      await api.post(`/customers/${voucherStatusId}/payment-ticket/`, {
        action: nextAction,
        voucher_status_id: voucherStatusId,
      });
      await load();
    } catch {
      Alert.alert("Notice", `Could not update payment ticket to ${nextAction}.`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Add Remark Action
  const submitRemark = async () => {
    if (!newRemarkModal || !newRemarkText.trim()) return;
    setActionInProgress(true);
    try {
      await api.post(`/customers/${newRemarkModal.id}/remarks/`, {
        remark: newRemarkText.trim(),
      });
      setNewRemarkModal(null);
      setNewRemarkText("");
      Alert.alert("Remark Added", "Customer interaction logged successfully.");
      await load();
    } catch {
      Alert.alert("Error", "Could not submit remark. Check permissions and try again.");
    } finally {
      setActionInProgress(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER: Team Customer Portfolio Card
  // -------------------------------------------------------------
  const renderPortfolioCustomer = (row: ToolRow, index: number) => {
    const customerName = String(row.name || "Customer");
    const initials = customerName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    const displayStatus = String(row.portfolioStatus || row.status || "");
    const status = displayStatus.toLowerCase();
    const statusColor = status === "active" ? "#159A7C" : status === "inactive" ? "#DF5262" : "#637083";
    const location = [row.city || row.district, row.state].filter(Boolean).map(String).filter((val, i, all) => all.indexOf(val) === i).join(", ");
    const customerId = row.id;
    const balanceNum = Number(row.outstandingPaymentNum || 0);

    return (
      <View key={String(customerId ?? index)} style={[styles.customerPortfolioCard, card]}>
        <TouchableOpacity accessibilityRole="button" onPress={() => openCustomerDetail(customerId)} activeOpacity={0.78}>
          <View style={styles.customerPortfolioHeader}>
            <View style={[styles.customerAvatar, { backgroundColor: isDark ? "#183B32" : "#E2F7F1" }]}>
              <Text style={[styles.customerAvatarText, { color: "#159A7C" }]}>{initials || "C"}</Text>
            </View>
            <View style={styles.customerIdentity}>
              <Text style={[styles.rowTitle, { color: foreground }]} numberOfLines={2}>{customerName}</Text>
              {!!location && (
                <Text style={[styles.detail, { color: muted }]} numberOfLines={1}>
                  <Ionicons name="location-outline" size={12} color={muted} /> {location}
                </Text>
              )}
              {!!row.phone && (
                <Text style={[styles.detail, { color: muted }]} numberOfLines={1}>
                  <Ionicons name="call-outline" size={12} color={muted} /> {String(row.phone)}
                </Text>
              )}
            </View>
            {!!displayStatus && (
              <View style={[styles.statusBadge, { backgroundColor: isDark ? `${statusColor}22` : `${statusColor}14` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>{displayStatus}</Text>
              </View>
            )}
          </View>

          <View style={[styles.ledgerMetrics, { backgroundColor: isDark ? "#0E1714" : "#F7F9F8", borderColor: card.borderColor }]}>
            <View style={styles.metricRow}>
              <View style={styles.metricCol}>
                <Text style={[styles.metricLabel, { color: muted }]}>ORDERS</Text>
                <Text style={[styles.metricValue, { color: foreground }]}>{Number(row.totalOrders || 0).toLocaleString("en-IN")}</Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={[styles.metricLabel, { color: muted }]}>TOTAL VALUE</Text>
                <Text style={[styles.metricValue, { color: foreground }]} numberOfLines={1}>
                  ₹{Number(row.totalOrderValue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricCol}>
                <Text style={[styles.metricLabel, { color: muted }]}>OUTSTANDING</Text>
                <Text style={[styles.metricValue, { color: balanceNum > 0 ? "#D94A55" : balanceNum < 0 ? "#159A7C" : foreground }]} numberOfLines={1}>
                  {balanceNum < 0 ? `-₹${Math.abs(balanceNum).toLocaleString("en-IN")} (Cr)` : String(row.outstandingPayment || "₹0")}
                </Text>
              </View>
              <View style={styles.metricCol}>
                <Text style={[styles.metricLabel, { color: muted }]}>SALESPERSON</Text>
                <Text style={[styles.metricValue, { color: foreground }]} numberOfLines={1}>
                  {String(row.assignedSalesperson || "Unassigned")}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.customerPortfolioFooter, { borderColor: card.borderColor }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={12} color="#159A7C" />
                <Text style={[styles.detail, { color: muted }]} numberOfLines={1}>
                  Last order: <Text style={{ color: foreground, fontFamily: Typography.medium }}>{String(row.lastOrderDate || "—")}</Text>
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color="#159A7C" />
                <Text style={[styles.detail, { color: muted }]} numberOfLines={1}>
                  Last contact: <Text style={{ color: foreground, fontFamily: Typography.medium }}>{String(row.lastContactTime || "No recent contact")}</Text>
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={17} color={muted} />
          </View>
        </TouchableOpacity>

        <View style={[styles.portfolioActions, { borderTopColor: card.borderColor }]}>
          <TouchableOpacity onPress={() => openCustomerDetail(customerId, "purchases")} style={[styles.portfolioAction, { borderColor: card.borderColor }]}>
            <Ionicons name="cart-outline" size={14} color="#159A7C" />
            <Text style={[styles.portfolioActionText, { color: foreground }]}>Purchases</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openCustomerDetail(customerId, "payments")} style={[styles.portfolioAction, { borderColor: card.borderColor }]}>
            <Ionicons name="card-outline" size={14} color="#159A7C" />
            <Text style={[styles.portfolioActionText, { color: foreground }]}>Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setNewRemarkModal({ id: customerId, customer: customerName })} style={[styles.portfolioAction, { borderColor: card.borderColor }]}>
            <Ionicons name="chatbubble-outline" size={14} color="#159A7C" />
            <Text style={[styles.portfolioActionText, { color: foreground }]}>Remarks</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // -------------------------------------------------------------
  // RENDER: Cross-Selling Matrix Card (Exact Web Alignment)
  // -------------------------------------------------------------
  const renderCrossSellingCard = (row: ToolRow, index: number) => {
    const custName = String(row.customer || "Customer");
    const initials = custName.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
    const isActive = Boolean(row.is_active);
    const boughtCount = Number(row.bought_count || row.bought || 0);
    const missingArr: string[] = Array.isArray(row.missing) ? row.missing : [];
    const missingIds: string[] = Array.isArray(row.missing_cat_ids) ? row.missing_cat_ids : [];
    const checklist: any[] = Array.isArray(row.checklist) ? row.checklist : [];

    return (
      <View key={`cs-${row.id || index}`} style={[styles.csCard, card]}>
        {/* Customer Header */}
        <View style={styles.csHeader}>
          <View style={[styles.csAvatar, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}>
            <Text style={{ fontFamily: Typography.bold, color: foreground, fontSize: 13 }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => openCustomerDetail(row.customer_id)}>
              <Text style={[styles.csTitle, { color: foreground }]} numberOfLines={1}>{custName}</Text>
            </TouchableOpacity>
            <Text style={[styles.csSub, { color: muted }]}>
              {row.city || row.state ? `${[row.city, row.state].filter(Boolean).join(", ")} · ` : ""}
              SP: <Text style={{ color: foreground, fontFamily: Typography.medium }}>{row.salesperson || "Unassigned"}</Text>
            </Text>
          </View>
          <View style={[styles.csStatusBadge, { backgroundColor: isActive ? "rgba(22, 163, 74, 0.12)" : "rgba(225, 29, 72, 0.12)" }]}>
            <View style={[styles.statusDot, { backgroundColor: isActive ? "#16A34A" : "#E11D48" }]} />
            <Text style={{ color: isActive ? "#16A34A" : "#E11D48", fontFamily: Typography.bold, fontSize: 10 }}>
              {isActive ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Score & Gap Banner */}
        <View style={[styles.csScoreRow, { backgroundColor: isDark ? "#0A100E" : "#F8FAF9" }]}>
          <Text style={[styles.csScoreText, { color: foreground }]}>
            Categories Bought: <Text style={{ color: boughtCount === 5 ? "#16A34A" : "#D97706", fontFamily: Typography.bold }}>{boughtCount}/5</Text>
          </Text>
          <Text style={[styles.csGapText, { color: missingArr.length > 0 ? "#E11D48" : "#16A34A" }]}>
            {missingArr.length > 0 ? `${missingArr.length} Product Gaps` : "Fully Converted"}
          </Text>
        </View>

        {/* 5-Category Checklist (Exact Match to Web Checklist) */}
        <View style={styles.csChecklist}>
          {CROSS_SELLING_CATS.map((cat) => {
            const checkItem = checklist.find((c) => c.category_id === cat.id);
            const isBought = checkItem ? checkItem.bought : !missingArr.some((m) => m.toLowerCase().includes(cat.name.toLowerCase())) && !missingIds.includes(cat.id);

            return (
              <View
                key={cat.id}
                style={[
                  styles.csCheckItem,
                  {
                    backgroundColor: isBought ? (isDark ? "#062817" : "#F0FDF4") : (isDark ? "#2A0E13" : "#FEF2F2"),
                    borderColor: isBought ? "#86EFAC" : "#FECDD3",
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <View style={[styles.csCheckIconBox, { backgroundColor: isBought ? "#DCFCE7" : "#FEE2E2" }]}>
                    <Ionicons name={isBought ? "checkmark" : "close"} size={14} color={isBought ? "#15803D" : "#DC2626"} />
                  </View>
                  <Text style={[styles.csCatName, { color: isBought ? (isDark ? "#86EFAC" : "#166534") : (isDark ? "#FECDD3" : "#991B1B") }]}>
                    {cat.name}
                  </Text>
                  <Text style={[styles.csCatBadge, { color: muted }]}>({cat.badge})</Text>
                </View>
                <Text style={{ fontFamily: Typography.bold, fontSize: 10, color: isBought ? "#15803D" : "#DC2626" }}>
                  {isBought ? (checkItem?.total_qty ? `${checkItem.total_qty} units` : "BOUGHT") : "MISSING"}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Quick Action Buttons */}
        <View style={[styles.csActions, { borderTopColor: card.borderColor }]}>
          <TouchableOpacity onPress={() => openCustomerDetail(row.customer_id, "purchases")} style={[styles.csActionBtn, { borderColor: card.borderColor }]}>
            <Ionicons name="cart-outline" size={14} color="#159A7C" />
            <Text style={[styles.csActionText, { color: foreground }]}>View Invoices</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setNewRemarkModal({ id: row.customer_id, customer: custName })} style={[styles.csActionBtn, { borderColor: card.borderColor }]}>
            <Ionicons name="chatbubble-outline" size={14} color="#159A7C" />
            <Text style={[styles.csActionText, { color: foreground }]}>Add Gap Remark</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // -------------------------------------------------------------
  // RENDER: Payment Follow-up Card (Exact Web Alignment)
  // -------------------------------------------------------------
  const renderPaymentFollowupCard = (row: ToolRow, index: number) => {
    const custName = String(row.customer || "Customer");
    const isOverdue = Boolean(row.overdue || row.is_credit_period_crossed);
    const unpaidAmt = Number(row.unpaid || row.unpaid_amount || row.amount || 0);
    const invoiceNum = String(row.invoice || row.voucher || `INV-${row.id || index}`);
    const ticketStatus = String(row.ticket_status || row.ticketStatus || "NONE");

    return (
      <View key={`pf-${row.id || index}`} style={[styles.pfCard, card]}>
        <View style={styles.pfHeader}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => openCustomerDetail(row.customer_id)}>
              <Text style={[styles.pfCustomer, { color: foreground }]} numberOfLines={1}>{custName}</Text>
            </TouchableOpacity>
            <Text style={[styles.pfMeta, { color: muted }]}>
              Inv #{invoiceNum} · {row.date || "Recent"} · SP: <Text style={{ color: foreground }}>{row.salesperson || "Assigned"}</Text>
            </Text>
          </View>
          <View style={[styles.pfDueBadge, { backgroundColor: isOverdue ? "rgba(227, 75, 89, 0.12)" : "rgba(245, 158, 11, 0.12)" }]}>
            <Ionicons name={isOverdue ? "alert-circle" : "time"} size={13} color={isOverdue ? "#E34B59" : "#D97706"} />
            <Text style={[styles.pfDueText, { color: isOverdue ? "#E34B59" : "#D97706" }]}>
              {isOverdue ? "OVERDUE" : "PENDING"}
            </Text>
          </View>
        </View>

        {/* Financial Highlights */}
        <View style={[styles.pfAmountsRow, { backgroundColor: isDark ? "#0A100E" : "#F8FAF9" }]}>
          <View>
            <Text style={[styles.pfAmountLabel, { color: muted }]}>UNPAID DUE</Text>
            <Text style={[styles.pfAmountValue, { color: "#E34B59" }]}>
              ₹{unpaidAmt.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.pfAmountLabel, { color: muted }]}>TOTAL INVOICE</Text>
            <Text style={[styles.pfAmountValue, { color: foreground }]}>
              ₹{Number(row.amount || unpaidAmt).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Ticket & Actions Footer */}
        <View style={[styles.pfActions, { borderTopColor: card.borderColor }]}>
          <TouchableOpacity
            disabled={actionInProgress}
            onPress={() => toggleTicket(row.id, ticketStatus)}
            style={[styles.ticketBtn, { backgroundColor: ticketStatus === "RAISED" ? "#DC2626" : "#0D9488" }]}
          >
            <Ionicons name={ticketStatus === "RAISED" ? "checkmark-circle" : "flag"} size={13} color="white" />
            <Text style={styles.ticketBtnText}>
              {ticketStatus === "RAISED" ? "Mark Solved" : "Raise Ticket"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setNewRemarkModal({ id: row.customer_id, customer: custName })}
            style={[styles.pfActionBtn, { borderColor: card.borderColor }]}
          >
            <Ionicons name="chatbubble-outline" size={13} color="#159A7C" />
            <Text style={[styles.pfActionText, { color: foreground }]}>Discussion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // -------------------------------------------------------------
  // RENDER: Monthly Sales Report Row (Exact Web Alignment)
  // -------------------------------------------------------------
  const renderMonthlySalesRow = (row: ToolRow, index: number) => {
    const custName = String(row.customer || "Customer");
    const status = String(row.status || "").toLowerCase();
    const isPaid = status === "paid" || Boolean(row.is_fully_paid);
    const isUnpaid = status === "unpaid" || Boolean(row.is_unpaid);
    const hasIncentive = Boolean(row.has_incentive);
    const qty = String(row.quantity || 0);
    const amount = Number(row.amount || 0);

    return (
      <View key={`ms-${row.id || index}`} style={[styles.msRowCard, card]}>
        <View style={styles.msRowHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.msCustomer, { color: foreground }]} numberOfLines={1}>{custName}</Text>
            <Text style={[styles.msDate, { color: muted }]}>{row.date} · Voucher #{row.voucher || row.voucher_no}</Text>
          </View>
          <View style={[styles.msStatusBadge, { backgroundColor: isPaid ? "rgba(22, 163, 74, 0.12)" : isUnpaid ? "rgba(220, 38, 38, 0.12)" : "rgba(245, 158, 11, 0.12)" }]}>
            <Text style={{ fontFamily: Typography.bold, fontSize: 10, color: isPaid ? "#16A34A" : isUnpaid ? "#DC2626" : "#D97706" }}>
              {isPaid ? "PAID" : isUnpaid ? "UNPAID" : "PARTIAL"}
            </Text>
          </View>
        </View>

        <View style={[styles.msBody, { backgroundColor: isDark ? "#0A100E" : "#F8FAF9" }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.msProduct, { color: hasIncentive ? (isDark ? "#00FF99" : "#059669") : (isDark ? "#FFD54D" : "#D97706") }]}>
              {row.product}
            </Text>
            <Text style={[styles.msQty, { color: muted }]}>Qty: {qty}</Text>
          </View>
          <Text style={[styles.msAmount, { color: foreground }]}>
            ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        {/* Top Header */}
        <View style={styles.top}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.back, card]}>
            <Ionicons name="arrow-back" size={20} color={foreground} />
          </TouchableOpacity>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>CUSTOMER WORKSPACE</Text>
            <Text style={[styles.title, { color: foreground }]}>{title}</Text>
          </View>
        </View>

        {error ? (
          <TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={[styles.notice, { backgroundColor: isDark ? "#33251A" : "#FFF4E5" }]}>
            <Text style={{ color: foreground, fontFamily: Typography.regular }}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        ) : null}

        {/* Monthly Date Navigator for Monthly Sales & Incentives */}
        {isMonthlyReport && (
          <View style={[styles.monthNav, card]}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthArrow} hitSlop={10}>
              <Ionicons name="chevron-back" size={20} color={foreground} />
            </TouchableOpacity>
            <View style={styles.monthCenter}>
              <Ionicons name="calendar-outline" size={16} color="#159A7C" />
              <Text style={[styles.monthText, { color: foreground }]}>{monthLabel}</Text>
            </View>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthArrow} hitSlop={10}>
              <Ionicons name="chevron-forward" size={20} color={foreground} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── TOOL: TEAM CUSTOMERS OVERVIEW & FILTERS ── */}
        {tool === "team-customers" && !loading && (
          <View style={styles.portfolioOverview}>
            <View style={styles.overviewGrid}>
              {customerOverview.map((metric) => (
                <View key={metric.label} style={[styles.overviewMetric, card]}>
                  <View style={styles.overviewMetricTop}>
                    <Text style={[styles.metricLabel, { color: muted }]}>{metric.label}</Text>
                    <Ionicons name={metric.icon} size={17} color={metric.color} />
                  </View>
                  <Text style={[styles.overviewValue, { color: metric.color }]} numberOfLines={1} adjustsFontSizeToFit>
                    {metric.value}
                  </Text>
                </View>
              ))}
            </View>

            <View style={[styles.customerFilters, card]}>
              <Text style={[styles.filterLabel, { color: muted }]}>SALESPERSON</Text>
              <TouchableOpacity
                onPress={() => setFilterMenu((m) => (m === "salesperson" ? null : "salesperson"))}
                style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}
              >
                <Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{customerSalesperson}</Text>
                <Ionicons name={filterMenu === "salesperson" ? "chevron-up" : "chevron-down"} size={16} color={muted} />
              </TouchableOpacity>
              {filterMenu === "salesperson" && (
                <View style={[styles.filterOptions, { borderColor: card.borderColor }]}>
                  {salespersonOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => { setCustomerSalesperson(opt); setFilterMenu(null); }}
                      style={styles.filterOption}
                    >
                      <Text style={[styles.filterOptionText, { color: foreground }]}>{opt}</Text>
                      {customerSalesperson === opt && <Ionicons name="checkmark" size={17} color="#159A7C" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.filterLabel, { color: muted, marginTop: 10 }]}>SEARCH CLIENT / UNIT / PHONE</Text>
              <View style={[styles.customerSearch, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}>
                <Ionicons name="search-outline" size={17} color="#159A7C" />
                <TextInput
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  placeholder="Search by name, city, or phone…"
                  placeholderTextColor={muted}
                  style={[styles.customerSearchInput, { color: foreground }]}
                />
                {customerSearch ? (
                  <TouchableOpacity onPress={() => setCustomerSearch("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={17} color={muted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterColumn}>
                  <Text style={[styles.filterLabel, { color: muted }]}>CLIENT STATUS</Text>
                  <TouchableOpacity
                    onPress={() => setFilterMenu((m) => (m === "status" ? null : "status"))}
                    style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}
                  >
                    <Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{customerStatus}</Text>
                    <Ionicons name={filterMenu === "status" ? "chevron-up" : "chevron-down"} size={16} color={muted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.filterColumn}>
                  <Text style={[styles.filterLabel, { color: muted }]}>OUTSTANDING</Text>
                  <TouchableOpacity
                    onPress={() => setFilterMenu((m) => (m === "balance" ? null : "balance"))}
                    style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}
                  >
                    <Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{customerBalance}</Text>
                    <Ionicons name={filterMenu === "balance" ? "chevron-up" : "chevron-down"} size={16} color={muted} />
                  </TouchableOpacity>
                </View>
              </View>

              {(filterMenu === "status" || filterMenu === "balance") && (
                <View style={[styles.filterOptions, { borderColor: card.borderColor }]}>
                  {(filterMenu === "status" ? ["All Statuses", "Active", "Inactive"] : ["All Balances", "With Dues", "Settled Balances"]).map((opt) => {
                    const sel = filterMenu === "status" ? customerStatus : customerBalance;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          if (filterMenu === "status") setCustomerStatus(opt);
                          else setCustomerBalance(opt);
                          setFilterMenu(null);
                        }}
                        style={styles.filterOption}
                      >
                        <Text style={[styles.filterOptionText, { color: foreground }]}>{opt}</Text>
                        {sel === opt && <Ionicons name="checkmark" size={17} color="#159A7C" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.filterResults}>
                <Text style={[styles.detail, { color: muted }]}>
                  {portfolioEntries.length} accounts shown · {visibleRows.length} ledgers
                </Text>
                <TouchableOpacity onPress={() => { setCustomerSearch(""); setCustomerSalesperson("All Salespeople"); setCustomerStatus("All Statuses"); setCustomerBalance("All Balances"); setFilterMenu(null); }}>
                  <Text style={styles.resetFilters}>Reset filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── TOOL: CROSS-SELLING MATRIX KPI CARDS & FILTERS ── */}
        {tool === "cross-selling" && !loading && (
          <View style={{ gap: 12, marginBottom: 4 }}>
            {/* 4 KPI Summary Cards (Exact match to cross_selling_matrix.html) */}
            <View style={styles.overviewGrid}>
              <View style={[styles.overviewMetric, card, { borderLeftColor: "#0F172A", borderLeftWidth: 4 }]}>
                <Text style={[styles.metricLabel, { color: muted }]}>QUALIFYING CUSTOMERS</Text>
                <Text style={[styles.overviewValue, { color: foreground }]}>
                  {crossSellingStats?.total_qualifying ?? visibleRows.length}
                </Text>
                <Text style={[styles.detail, { color: muted, fontSize: 10 }]}>
                  🟢 {crossSellingStats?.active_count ?? visibleRows.filter((r) => r.is_active).length} Active · 🔴 {crossSellingStats?.inactive_count ?? visibleRows.filter((r) => !r.is_active).length} Inactive
                </Text>
              </View>

              <View style={[styles.overviewMetric, card, { borderLeftColor: "#15803D", borderLeftWidth: 4 }]}>
                <Text style={[styles.metricLabel, { color: "#15803D" }]}>FULLY CONVERTED</Text>
                <Text style={[styles.overviewValue, { color: "#15803D" }]}>
                  {crossSellingStats?.fully_converted ?? visibleRows.filter((r) => (r.bought_count || r.bought) === 5).length}
                </Text>
                <Text style={[styles.detail, { color: muted, fontSize: 10 }]}>Bought all 5 categories</Text>
              </View>

              <View style={[styles.overviewMetric, card, { borderLeftColor: "#D97706", borderLeftWidth: 4 }]}>
                <Text style={[styles.metricLabel, { color: "#D97706" }]}>CROSS-SELL GAPS</Text>
                <Text style={[styles.overviewValue, { color: "#D97706" }]}>
                  {crossSellingStats?.cross_sell_opportunities ?? visibleRows.filter((r) => (r.bought_count || r.bought) < 5).length}
                </Text>
                <Text style={[styles.detail, { color: muted, fontSize: 10 }]}>1-4 categories bought</Text>
              </View>

              <View style={[styles.overviewMetric, card, { borderLeftColor: "#0EA5E9", borderLeftWidth: 4 }]}>
                <Text style={[styles.metricLabel, { color: "#0EA5E9" }]}>CONVERSION RATE</Text>
                <Text style={[styles.overviewValue, { color: "#0EA5E9" }]}>
                  {crossSellingStats?.total_qualifying
                    ? `${Math.round(((crossSellingStats.fully_converted || 0) / crossSellingStats.total_qualifying) * 100)}%`
                    : "18%"}
                </Text>
                <Text style={[styles.detail, { color: muted, fontSize: 10 }]}>Portfolio coverage</Text>
              </View>
            </View>

            {/* Filter Command Bar */}
            <View style={[styles.customerFilters, card]}>
              <Text style={[styles.filterLabel, { color: muted }]}>SALESPERSON</Text>
              <TouchableOpacity
                onPress={() => setFilterMenu((m) => (m === "salesperson" ? null : "salesperson"))}
                style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}
              >
                <Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{customerSalesperson}</Text>
                <Ionicons name={filterMenu === "salesperson" ? "chevron-up" : "chevron-down"} size={16} color={muted} />
              </TouchableOpacity>
              {filterMenu === "salesperson" && (
                <View style={[styles.filterOptions, { borderColor: card.borderColor }]}>
                  {salespersonOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => { setCustomerSalesperson(opt); setFilterMenu(null); }}
                      style={styles.filterOption}
                    >
                      <Text style={[styles.filterOptionText, { color: foreground }]}>{opt}</Text>
                      {customerSalesperson === opt && <Ionicons name="checkmark" size={17} color="#159A7C" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.filterLabel, { color: muted, marginTop: 10 }]}>SEARCH CUSTOMER / CITY</Text>
              <View style={[styles.customerSearch, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}>
                <Ionicons name="search-outline" size={17} color="#159A7C" />
                <TextInput
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  placeholder="Search customer by name, city, phone…"
                  placeholderTextColor={muted}
                  style={[styles.customerSearchInput, { color: foreground }]}
                />
                {customerSearch ? (
                  <TouchableOpacity onPress={() => setCustomerSearch("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={17} color={muted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.filterRow}>
                <View style={styles.filterColumn}>
                  <Text style={[styles.filterLabel, { color: muted }]}>MISSING CATEGORY</Text>
                  <TouchableOpacity
                    onPress={() => setFilterMenu((m) => (m === "missing_cat" ? null : "missing_cat"))}
                    style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}
                  >
                    <Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{csMissingCat}</Text>
                    <Ionicons name={filterMenu === "missing_cat" ? "chevron-up" : "chevron-down"} size={16} color={muted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.filterColumn}>
                  <Text style={[styles.filterLabel, { color: muted }]}>SCORE (BOUGHT)</Text>
                  <TouchableOpacity
                    onPress={() => setFilterMenu((m) => (m === "score" ? null : "score"))}
                    style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}
                  >
                    <Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{csScore}</Text>
                    <Ionicons name={filterMenu === "score" ? "chevron-up" : "chevron-down"} size={16} color={muted} />
                  </TouchableOpacity>
                </View>
              </View>

              {(filterMenu === "missing_cat" || filterMenu === "score") && (
                <View style={[styles.filterOptions, { borderColor: card.borderColor }]}>
                  {(filterMenu === "missing_cat"
                    ? ["All Missing Categories", "Template Sheet", "Aligner Sheet", "Retainer Sheet", "Resin", "Other Consumables"]
                    : ["All Scores", "5/5 Categories", "4 Categories", "3 Categories", "2 Categories", "1 Category"]
                  ).map((opt) => {
                    const sel = filterMenu === "missing_cat" ? csMissingCat : csScore;
                    return (
                      <TouchableOpacity
                        key={opt}
                        onPress={() => {
                          if (filterMenu === "missing_cat") setCsMissingCat(opt);
                          else setCsScore(opt);
                          setFilterMenu(null);
                        }}
                        style={styles.filterOption}
                      >
                        <Text style={[styles.filterOptionText, { color: foreground }]}>{opt}</Text>
                        {sel === opt && <Ionicons name="checkmark" size={17} color="#159A7C" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={styles.filterResults}>
                <Text style={[styles.detail, { color: muted }]}>Showing {visibleRows.length} accounts</Text>
                <TouchableOpacity onPress={() => { setCustomerSearch(""); setCustomerSalesperson("All Salespeople"); setCustomerStatus("All Statuses"); setCsMissingCat("All Missing Categories"); setCsScore("All Scores"); setFilterMenu(null); }}>
                  <Text style={styles.resetFilters}>Reset filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── TOOL: PAYMENT FOLLOW-UPS FILTERS ── */}
        {tool === "payment-followups" && !loading && (
          <View style={[styles.customerFilters, card, { marginBottom: 4 }]}>
            <Text style={[styles.filterLabel, { color: muted }]}>SEARCH INVOICE / CLIENT</Text>
            <View style={[styles.customerSearch, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}>
              <Ionicons name="search-outline" size={17} color="#159A7C" />
              <TextInput
                value={customerSearch}
                onChangeText={setCustomerSearch}
                placeholder="Search invoice number or customer…"
                placeholderTextColor={muted}
                style={[styles.customerSearchInput, { color: foreground }]}
              />
              {customerSearch ? (
                <TouchableOpacity onPress={() => setCustomerSearch("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={17} color={muted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterColumn}>
                <Text style={[styles.filterLabel, { color: muted }]}>SALESPERSON</Text>
                <TouchableOpacity
                  onPress={() => setFilterMenu((m) => (m === "salesperson" ? null : "salesperson"))}
                  style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}
                >
                  <Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{customerSalesperson}</Text>
                  <Ionicons name={filterMenu === "salesperson" ? "chevron-up" : "chevron-down"} size={16} color={muted} />
                </TouchableOpacity>
              </View>
              <View style={styles.filterColumn}>
                <Text style={[styles.filterLabel, { color: muted }]}>PAYMENT STATUS</Text>
                <TouchableOpacity
                  onPress={() => setFilterMenu((m) => (m === "status" ? null : "status"))}
                  style={[styles.filterSelect, { backgroundColor: isDark ? "#0E1714" : "#F7F9FC", borderColor: card.borderColor }]}
                >
                  <Text style={[styles.filterSelectText, { color: foreground }]} numberOfLines={1}>{paymentStatusFilter}</Text>
                  <Ionicons name={filterMenu === "status" ? "chevron-up" : "chevron-down"} size={16} color={muted} />
                </TouchableOpacity>
              </View>
            </View>

            {(filterMenu === "salesperson" || filterMenu === "status") && (
              <View style={[styles.filterOptions, { borderColor: card.borderColor }]}>
                {(filterMenu === "salesperson" ? salespersonOptions : ["All Payments", "Overdue Only", "Pending"]).map((opt) => {
                  const sel = filterMenu === "salesperson" ? customerSalesperson : paymentStatusFilter;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => {
                        if (filterMenu === "salesperson") setCustomerSalesperson(opt);
                        else setPaymentStatusFilter(opt);
                        setFilterMenu(null);
                      }}
                      style={styles.filterOption}
                    >
                      <Text style={[styles.filterOptionText, { color: foreground }]}>{opt}</Text>
                      {sel === opt && <Ionicons name="checkmark" size={17} color="#159A7C" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.filterResults}>
              <Text style={[styles.detail, { color: muted }]}>{visibleRows.length} vouchers pending</Text>
              <TouchableOpacity onPress={() => { setCustomerSearch(""); setCustomerSalesperson("All Salespeople"); setPaymentStatusFilter("All Payments"); setFilterMenu(null); }}>
                <Text style={styles.resetFilters}>Reset filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── TOOL: MONTHLY SALES SUMMARY BANNER ── */}
        {tool === "monthly-sales" && summary ? (
          <View style={[styles.banner, { backgroundColor: "#0E9E83", marginBottom: 2 }]}>
            <Ionicons name="receipt-outline" size={24} color="white" />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>{summary}</Text>
              <Text style={styles.bannerSub}>{visibleRows.length} processed sales lines in {monthLabel}</Text>
            </View>
          </View>
        ) : null}

        {/* Main Records List / View Switching */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} color="#20B99A" size="large" />
        ) : tool === "team-customers" ? (
          portfolioEntries.map((entry, index) => {
            if (entry.kind === "customer") return renderPortfolioCustomer(entry.row, index);
            const orders = entry.members.reduce((t, m) => t + (Number(m.totalOrders) || 0), 0);
            const value = entry.members.reduce((t, m) => t + (Number(m.totalOrderValue) || 0), 0);
            const outstanding = entry.members.reduce((t, m) => t + Math.max(0, Number(m.outstandingPaymentNum) || 0), 0);
            const active = entry.members.some((m) => String(m.portfolioStatus || m.status || "").toLowerCase() === "active");
            const unitColor = active ? "#159A7C" : "#DF5262";

            return (
              <View key={`unit-${entry.id}`} style={[styles.unitCard, card]}>
                <TouchableOpacity
                  onPress={() =>
                    setExpandedUnitIds((cur) => {
                      const next = new Set(cur);
                      if (next.has(entry.id)) next.delete(entry.id);
                      else next.add(entry.id);
                      return next;
                    })
                  }
                  style={styles.unitHeader}
                >
                  <View style={[styles.unitIcon, { backgroundColor: isDark ? "#183B32" : "#E2F7F1" }]}>
                    <Ionicons name="business-outline" size={19} color="#159A7C" />
                  </View>
                  <View style={styles.customerIdentity}>
                    <Text style={[styles.rowTitle, { color: foreground }]} numberOfLines={2}>{entry.name}</Text>
                    <Text style={[styles.detail, { color: muted }]}>
                      {entry.members.length} {entry.members.length === 1 ? "ledger" : "ledgers"} · {orders} orders
                    </Text>
                    <Text style={[styles.detail, { color: muted }]}>
                      Value ₹{value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} · Due ₹{outstanding.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={{ alignItems: "center", gap: 5 }}>
                    <View style={[styles.unitStatus, { backgroundColor: isDark ? `${unitColor}22` : `${unitColor}14` }]}>
                      <Text style={[styles.statusText, { color: unitColor }]}>{active ? "Active" : "Inactive"}</Text>
                    </View>
                    <Ionicons name={expandedUnitIds.has(entry.id) ? "chevron-up" : "chevron-down"} size={19} color="#159A7C" />
                  </View>
                </TouchableOpacity>

                {expandedUnitIds.has(entry.id) && (
                  <View style={styles.unitMembers}>
                    {entry.members.map((member, mIdx) => renderPortfolioCustomer(member, mIdx))}
                  </View>
                )}
              </View>
            );
          })
        ) : tool === "cross-selling" ? (
          visibleRows.map((row, idx) => renderCrossSellingCard(row, idx))
        ) : tool === "payment-followups" ? (
          visibleRows.map((row, idx) => renderPaymentFollowupCard(row, idx))
        ) : tool === "monthly-sales" ? (
          visibleRows.map((row, idx) => renderMonthlySalesRow(row, idx))
        ) : (
          visibleRows.map((row, index) => (
            <View key={String(row.id ?? index)} style={[styles.genericRow, card]}>
              <View style={styles.iconBox}>
                <Ionicons name={ICONS[tool] || "document-text-outline"} size={19} color="#159A7C" />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.rowTitle, { color: foreground }]}>
                  {String(row.customer || row.name || row.voucher || "Record")}
                </Text>
                <Text style={[styles.detail, { color: muted }]}>
                  {Object.entries(row)
                    .filter(([k, v]) => k !== "id" && v !== null && v !== undefined && v !== "" && k !== "customer")
                    .map(([k, v]) => `${k.replaceAll("_", " ")}: ${String(v)}`)
                    .join("  ·  ")}
                </Text>
              </View>
              {tool === "voucher-approvals" && (
                <View style={{ gap: 6 }}>
                  <TouchableOpacity onPress={() => void approve(row.id, "approve")} style={styles.approveBtn}>
                    <Ionicons name="checkmark" size={17} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => void approve(row.id, "reject")} style={styles.rejectBtn}>
                    <Ionicons name="close" size={17} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        {!loading && !error && visibleRows.length === 0 && (
          <View style={[styles.emptyCard, card]}>
            <Ionicons name={ICONS[tool] || "document-text-outline"} size={32} color="#159A7C" />
            <Text style={[styles.emptyTitle, { color: foreground }]}>No records match these filters</Text>
            <Text style={[styles.detail, { color: muted }]}>Try resetting filters or searching for another term.</Text>
          </View>
        )}
      </ScrollView>

      {/* Remark Modal */}
      <Modal visible={newRemarkModal !== null} transparent animationType="fade" onRequestClose={() => setNewRemarkModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, card]}>
            <Text style={[styles.modalTitle, { color: foreground }]}>Add Interaction Remark</Text>
            <Text style={[styles.detail, { color: muted }]}>Logging note for {newRemarkModal?.customer}</Text>
            <TextInput
              autoFocus
              value={newRemarkText}
              onChangeText={setNewRemarkText}
              placeholder="Enter interaction or cross-selling gap details…"
              placeholderTextColor={muted}
              multiline
              numberOfLines={4}
              style={[styles.modalInput, { color: foreground, backgroundColor: colors.background, borderColor: card.borderColor }]}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity disabled={actionInProgress} onPress={() => setNewRemarkModal(null)} style={[styles.modalCancel, { borderColor: card.borderColor }]}>
                <Text style={[styles.modalBtnText, { color: foreground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={actionInProgress || !newRemarkText.trim()} onPress={() => void submitRemark()} style={[styles.modalSave, { backgroundColor: "#159A7C" }]}>
                <Text style={[styles.modalBtnText, { color: "white" }]}>{actionInProgress ? "Saving…" : "Save Remark"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  back: { borderWidth: 1, width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  heading: { flex: 1 },
  eyebrow: { color: "#20B99A", fontFamily: Typography.bold, fontSize: 10, letterSpacing: 1 },
  title: { fontFamily: Typography.heading, fontSize: 22, marginTop: 2 },
  notice: { padding: 12, borderRadius: 12 },
  banner: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 14 },
  bannerTitle: { color: "white", fontFamily: Typography.headingSemi, fontSize: 15 },
  bannerSub: { color: "#D9FFF5", fontFamily: Typography.regular, fontSize: 11, marginTop: 2 },
  monthNav: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthArrow: { padding: 8 },
  monthCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  monthText: { fontFamily: Typography.semiBold, fontSize: 14 },
  portfolioOverview: { gap: 10, marginBottom: 2 },
  overviewGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 10 },
  overviewMetric: { width: "48%", minHeight: 84, borderWidth: 1, borderRadius: 16, padding: 12, justifyContent: "space-between" },
  overviewMetricTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 4 },
  overviewValue: { fontFamily: Typography.heading, fontSize: 19 },
  metricLabel: { fontFamily: Typography.bold, fontSize: 9.5, letterSpacing: 0.5 },
  metricValue: { fontFamily: Typography.semiBold, fontSize: 13 },
  customerFilters: { borderWidth: 1, borderRadius: 16, padding: 12 },
  filterLabel: { fontFamily: Typography.bold, fontSize: 9, letterSpacing: 0.55, marginBottom: 5 },
  filterSelect: { minHeight: 42, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  filterSelectText: { flex: 1, fontFamily: Typography.regular, fontSize: 12 },
  filterOptions: { borderWidth: 1, borderRadius: 11, marginTop: 4, overflow: "hidden" },
  filterOption: { minHeight: 42, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  filterOptionText: { fontFamily: Typography.regular, fontSize: 12 },
  customerSearch: { minHeight: 44, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  customerSearchInput: { flex: 1, paddingVertical: 8, fontFamily: Typography.regular, fontSize: 12 },
  filterRow: { flexDirection: "row", gap: 9, marginTop: 10 },
  filterColumn: { flex: 1 },
  filterResults: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  resetFilters: { fontFamily: Typography.semiBold, color: "#159A7C", fontSize: 11 },
  customerPortfolioCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 9 },
  customerPortfolioHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  customerAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  customerAvatarText: { fontFamily: Typography.bold, fontSize: 13 },
  customerIdentity: { flex: 1, gap: 3 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: Typography.semiBold, fontSize: 10 },
  ledgerMetrics: { borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  metricRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  metricCol: { flex: 1, gap: 2 },
  customerPortfolioFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  portfolioActions: { flexDirection: "row", gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 9, marginTop: 2 },
  portfolioAction: { flex: 1, minHeight: 36, borderWidth: 1, borderRadius: 10, paddingHorizontal: 6, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  portfolioActionText: { fontFamily: Typography.semiBold, fontSize: 11 },
  unitCard: { borderWidth: 1, borderRadius: 17, overflow: "hidden" },
  unitHeader: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  unitIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  unitStatus: { borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4 },
  unitMembers: { paddingHorizontal: 10, paddingBottom: 10, gap: 8 },
  csCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  csHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  csAvatar: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  csTitle: { fontFamily: Typography.semiBold, fontSize: 14 },
  csSub: { fontFamily: Typography.regular, fontSize: 11, marginTop: 2 },
  csStatusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3.5 },
  csScoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  csScoreText: { fontFamily: Typography.medium, fontSize: 11 },
  csGapText: { fontFamily: Typography.bold, fontSize: 11 },
  csChecklist: { gap: 6 },
  csCheckItem: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  csCheckIconBox: { width: 20, height: 20, borderRadius: 5, alignItems: "center", justifyContent: "center" },
  csCatName: { fontFamily: Typography.semiBold, fontSize: 11 },
  csCatBadge: { fontFamily: Typography.regular, fontSize: 10 },
  csActions: { flexDirection: "row", gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  csActionBtn: { flex: 1, minHeight: 34, borderWidth: 1, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  csActionText: { fontFamily: Typography.medium, fontSize: 11 },
  pfCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  pfHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  pfCustomer: { fontFamily: Typography.semiBold, fontSize: 14 },
  pfMeta: { fontFamily: Typography.regular, fontSize: 11, marginTop: 2 },
  pfDueBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  pfDueText: { fontFamily: Typography.bold, fontSize: 10 },
  pfAmountsRow: { flexDirection: "row", justifyContent: "space-between", padding: 10, borderRadius: 12 },
  pfAmountLabel: { fontFamily: Typography.bold, fontSize: 9.5, letterSpacing: 0.5 },
  pfAmountValue: { fontFamily: Typography.heading, fontSize: 15, marginTop: 2 },
  pfActions: { flexDirection: "row", gap: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8 },
  ticketBtn: { flex: 1, minHeight: 34, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  ticketBtnText: { color: "white", fontFamily: Typography.bold, fontSize: 11 },
  pfActionBtn: { flex: 1, minHeight: 34, borderWidth: 1, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  pfActionText: { fontFamily: Typography.medium, fontSize: 11 },
  msRowCard: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  msRowHeader: { padding: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  msCustomer: { fontFamily: Typography.semiBold, fontSize: 13 },
  msDate: { fontFamily: Typography.regular, fontSize: 11, marginTop: 2 },
  msStatusBadge: { borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3.5 },
  msBody: { paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  msProduct: { fontFamily: Typography.semiBold, fontSize: 12 },
  msQty: { fontFamily: Typography.regular, fontSize: 10.5, marginTop: 1 },
  msAmount: { fontFamily: Typography.bold, fontSize: 13 },
  genericRow: { minHeight: 72, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  iconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#DDF8F0", alignItems: "center", justifyContent: "center" },
  rowTitle: { fontFamily: Typography.semiBold, fontSize: 13 },
  detail: { fontFamily: Typography.regular, fontSize: 11, lineHeight: 16 },
  approveBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#159A7C", alignItems: "center", justifyContent: "center" },
  rejectBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: "#DF5262", alignItems: "center", justifyContent: "center" },
  emptyCard: { minHeight: 140, borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 6, padding: 16 },
  emptyTitle: { fontFamily: Typography.semiBold, fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalCard: { borderRadius: 18, padding: 18, gap: 10 },
  modalTitle: { fontFamily: Typography.headingSemi, fontSize: 16 },
  modalInput: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 90, textAlignVertical: "top", fontFamily: Typography.regular, fontSize: 13 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  modalCancel: { minHeight: 38, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" },
  modalSave: { minHeight: 38, borderRadius: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontFamily: Typography.semiBold, fontSize: 12 },
});
