import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { router, useGlobalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Typography, FontSizes, Radius } from "@/constants/theme";
import { WorkspaceHeader } from "@/components/employee/WorkspaceHeader";
import { SubAppCard } from "@/components/employee/SubAppCard";
import { MetricCard } from "@/components/employee/MetricCard";
import { TimelineItem } from "@/components/employee/TimelineItem";
import { SearchBar } from "@/components/ui/SearchBar";
import { CustomerCard } from "@/components/employee/CustomerCard";
import { LeadCard } from "@/components/employee/LeadCard";
import { fetchDashboardStatsApi, fetchCustomersFromApi, DashboardStats } from "@/services/customerService";
import { fetchLeadsFromApi } from "@/services/leadService";
import { Customer } from "@/data/mockCustomers";
import { Lead } from "@/data/mockLeads";
import {
  fetchUserPermissionsApi,
  AllowedApp,
  UserPermissionProfile,
  DEFAULT_ALLOWED_APPS,
} from "@/services/permissionService";
import {
  fetchHRMSDashboardApi,
  fetchHRMSEmployeesApi,
  handleLeaveActionApi,
  punchAttendanceApi,
  HRMSDashboardData,
  EmployeeDirectoryItem,
  PendingLeave,
} from "@/services/hrmsService";

export default function EmployeeHomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const globalParams = useGlobalSearchParams<{ tab?: string }>();
  const isStaffTab = globalParams.tab === "staff";

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [userProfile, setUserProfile] = useState<UserPermissionProfile | null>(null);
  const [allowedApps, setAllowedApps] = useState<AllowedApp[]>(DEFAULT_ALLOWED_APPS);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  // HRMS State
  const [hrmsData, setHrmsData] = useState<HRMSDashboardData | null>(null);
  const [hrmsEmployees, setHrmsEmployees] = useState<EmployeeDirectoryItem[]>([]);
  const [hrmsSearch, setHrmsSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all");
  const [isPunching, setIsPunching] = useState(false);
  const [processingLeaveId, setProcessingLeaveId] = useState<number | null>(null);

  // Check if current user is Business Manager (Vibhuti Panwar)
  const isBusinessManager = useMemo(() => {
    const profileRole = (userProfile?.user?.role || "").toLowerCase();
    const authRole = ((user as any)?.role || "").toLowerCase();
    const username = ((user as any)?.username || userProfile?.user?.username || "").toLowerCase();
    return (
      profileRole.includes("business") ||
      authRole.includes("business") ||
      authRole.includes("buss_mgr") ||
      username.includes("vibhuti")
    );
  }, [userProfile, user]);

  // Check if current user is an HR Manager/Staff
  const isHR = useMemo(() => {
    const profileRole = (userProfile?.user?.role || "").toLowerCase();
    const authRole = ((user as any)?.role || "").toLowerCase();
    const isStrictHRPersona = allowedApps.length <= 2 && allowedApps.some((a) => a.id === "hrms");
    return (
      profileRole.includes("hr") ||
      profileRole.includes("human resource") ||
      authRole.includes("hr") ||
      authRole.includes("human resource") ||
      isStrictHRPersona
    );
  }, [userProfile, allowedApps, user]);

  // ── Load live permissions & apps ──────────────────────────────────────────
  const loadPermissionsAndApps = useCallback(async () => {
    try {
      const data = await fetchUserPermissionsApi();
      setUserProfile(data);
      if (Array.isArray(data.allowed_apps) && data.allowed_apps.length > 0) {
        setAllowedApps((data.allowed_apps || []).filter((a: any) => a.id !== "leads"));
        // If user is purely HR, switch default category to hrms if not yet selected
        const isUserHR = (data.user?.role || "").toLowerCase().includes("hr") || (data.allowed_apps.length <= 2 && data.allowed_apps.some((a) => a.id === "hrms"));
        if (isUserHR) {
          setSelectedCategory((prev) => (prev === "all" ? "all" : prev));
        }
      }
    } catch {
      // Graceful fallback
    }
  }, []);

  // ── Load dashboard stats ──────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const data = await fetchDashboardStatsApi();
      setStats(data);
    } catch {
      // Ignored
    }
  }, []);

  // ── Load HRMS data ────────────────────────────────────────────────────────
  const loadHRMS = useCallback(async () => {
    try {
      const [dash, emps] = await Promise.all([
        fetchHRMSDashboardApi(),
        fetchHRMSEmployeesApi(),
      ]);
      setHrmsData(dash);
      setHrmsEmployees(emps);
    } catch {
      // Ignored
    }
  }, []);

  // ── Load customers for category view ──────────────────────────────────────
  const loadCustomers = useCallback(async () => {
    try {
      const data = await fetchCustomersFromApi({ search: searchQuery });
      setCustomers(data);
    } catch {
      // Ignored
    }
  }, [searchQuery]);

  // ── Load leads for category view ──────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    try {
      const data = await fetchLeadsFromApi({ search: searchQuery });
      setLeads(data);
    } catch {
      // Ignored
    }
  }, [searchQuery]);

  useEffect(() => {
    loadPermissionsAndApps();
    loadStats();
    loadHRMS();
  }, [loadPermissionsAndApps, loadStats, loadHRMS]);

  useEffect(() => {
    if (selectedCategory === "customers" || (selectedCategory === "all" && searchQuery)) {
      loadCustomers();
    }
    if (selectedCategory === "leads" || (selectedCategory === "all" && searchQuery)) {
      loadLeads();
    }
    if (selectedCategory === "hrms" || isHR) {
      loadHRMS();
    }
  }, [selectedCategory, searchQuery, isHR, loadCustomers, loadLeads, loadHRMS]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadPermissionsAndApps(),
      loadStats(),
      loadHRMS(),
      loadCustomers(),
      loadLeads(),
    ]);
    setRefreshing(false);
  }, [loadPermissionsAndApps, loadStats, loadHRMS, loadCustomers, loadLeads]);

  // ── HR Leave Action (Approve / Reject) ─────────────────────────────────────
  const onLeaveAction = async (leaveId: number, action: "approve" | "reject") => {
    setProcessingLeaveId(leaveId);
    try {
      const res = await handleLeaveActionApi(leaveId, action);
      if (res.success) {
        Alert.alert("Success", res.message || `Leave application #${leaveId} has been ${action}d.`);
        // Optimistically update list
        setHrmsData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            stats: {
              ...prev.stats,
              pending_leaves: Math.max(0, prev.stats.pending_leaves - 1),
            },
            pending_leaves: prev.pending_leaves.filter((l) => l.id !== leaveId),
          };
        });
      } else {
        Alert.alert("Error", res.message);
      }
    } finally {
      setProcessingLeaveId(null);
    }
  };

  // ── HR Punch Action (Punch In / Punch Out) ────────────────────────────────
  const onPunchAttendance = async () => {
    setIsPunching(true);
    try {
      const res = await punchAttendanceApi();
      if (res.success) {
        Alert.alert("Attendance Marked", res.message);
        loadHRMS();
      } else {
        Alert.alert("Punch Notice", res.message);
      }
    } finally {
      setIsPunching(false);
    }
  };

  const handleProfilePress = () => {
    router.push("/(employee)/profile" as any);
  };

  const isAdmin = user?.role === "admin" || userProfile?.user?.role?.toLowerCase() === "admin";

  // App icon mapping
  const getAppIconName = (id: string, isSelected: boolean): keyof typeof Ionicons.glyphMap => {
    switch (id) {
      case "all":
        return isSelected ? "grid" : "grid-outline";
      case "customers":
        return isSelected ? "people" : "people-outline";
      case "leads":
        return isSelected ? "filter" : "filter-outline";
      case "inventory":
        return isSelected ? "cube" : "cube-outline";
      case "proforma":
        return isSelected ? "document-text" : "document-text-outline";
      case "hrms":
        return isSelected ? "briefcase" : "briefcase-outline";
      case "incentives":
        return isSelected ? "trophy" : "trophy-outline";
      default:
        return isSelected ? "apps" : "apps-outline";
    }
  };

  const getAppAccent = (id: string) => {
    switch (id) {
      case "all":
        return isDark ? "#35D6A0" : "#00A879";
      case "customers":
        return isDark ? "#38BDF8" : "#0284C7";
      case "leads":
        return isDark ? "#FBBF24" : "#D97706";
      case "inventory":
        return isDark ? "#818CF8" : "#4F46E5";
      case "proforma":
        return isDark ? "#34D399" : "#059669";
      case "hrms":
        return isDark ? "#35D6A0" : "#00A879";
      case "incentives":
        return isDark ? "#FACC15" : "#CA8A04";
      default:
        return isDark ? "#35D6A0" : "#00A879";
    }
  };

  // Filtered employees in directory
  const filteredEmployees = useMemo(() => {
    let list = [...hrmsEmployees];
    if (hrmsSearch.trim()) {
      const q = hrmsSearch.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employee_code.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
      );
    }
    if (selectedDeptFilter !== "all") {
      list = list.filter((e) => e.department.toLowerCase() === selectedDeptFilter.toLowerCase());
    }
    return list;
  }, [hrmsEmployees, hrmsSearch, selectedDeptFilter]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 96 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#35D6A0" : "#00A879"}
            colors={[isDark ? "#35D6A0" : "#00A879"]}
          />
        }
      >
        {/* Workspace Header */}
        <WorkspaceHeader onProfilePress={handleProfilePress} />

        {/* Global Search Bar (hidden for HR when in hrms view to avoid duplicate inputs) */}
        {selectedCategory !== "hrms" && (
          <View style={styles.searchBarWrapper}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={isHR ? "Search staff, notices or records..." : "Search customers, accounts, or records..."}
              onClear={() => setSearchQuery("")}
            />
          </View>
        )}

        {/* ── Horizontal App Categories Row (Food App Pattern) ──────────────── */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={allowedApps}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item.id;
              const accentColor = getAppAccent(item.id);

              return (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => setSelectedCategory(item.id)}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.categoryCircle,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? (isDark ? "rgba(53, 214, 160, 0.16)" : "rgba(0, 168, 121, 0.12)")
                            : "rgba(219, 39, 119, 0.10)"
                          : isDark
                          ? "#121F1B"
                          : "#FFFFFF",
                        borderColor: isSelected
                          ? accentColor
                          : isDark
                          ? "#294039"
                          : "#D8E0DC",
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getAppIconName(item.id, isSelected)}
                      size={24}
                      color={isSelected ? accentColor : isDark ? "#8FA09A" : "#5E6964"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryLabel,
                      {
                        color: isSelected
                          ? isDark
                            ? "#F1F7F4"
                            : "#101513"
                          : isDark
                          ? "#8FA09A"
                          : "#5E6964",
                        fontFamily: isSelected ? Typography.bold : Typography.medium,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View
                      style={[
                        styles.activeIndicator,
                        { backgroundColor: accentColor },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* ── 1. ALL CATEGORY VIEW ─────────────────────────────────────────── */}
        {selectedCategory === "all" && (
          <>
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.heroHeading,
                      { color: isDark ? "#F1F7F4" : "#101513" },
                    ]}
                  >
                    {isHR ? (isStaffTab ? "Workforce Directory" : "HR Operations Suite") : isBusinessManager ? "Business Operations Suite" : "Let's build momentum."}
                  </Text>
                  <Text
                    style={[
                      styles.heroSubheading,
                      { color: isDark ? "#8FA09A" : "#5E6964" },
                    ]}
                  >
                    Role: {isBusinessManager ? "Business Manager" : (userProfile?.user?.role || "Employee")} • Unit: Oblu Healthcare Pvt Ltd
                  </Text>
                </View>

                {isHR && (
                  <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: isDark ? "rgba(53, 214, 160, 0.14)" : "#E8F5EE",
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(53, 214, 160, 0.28)" : "#C0E8D7",
                    }}
                    onPress={() => {
                      router.replace({
                        pathname: "/(employee)",
                        params: { tab: isStaffTab ? "dashboard" : "staff" },
                      } as any);
                    }}
                  >
                    <Ionicons
                      name={isStaffTab ? "grid-outline" : "people-outline"}
                      size={14}
                      color={isDark ? "#35D6A0" : "#00A879"}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: Typography.medium,
                        color: isDark ? "#35D6A0" : "#00A879",
                      }}
                    >
                      {isStaffTab ? "Dashboard" : "Directory"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* If user is HR, show HR Bento Suite instead of Sales CRM */}
            {isHR ? (
              <View style={styles.bentoSection}>
                {/* Workforce Directory Tile */}
                <TouchableOpacity
                  style={[
                    styles.hrBentoTile,
                    {
                      backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                      borderColor: isDark ? "#294039" : "#D8E0DC",
                    },
                  ]}
                  onPress={() => setSelectedCategory("hrms")}
                  activeOpacity={0.8}
                >
                  <View style={styles.hrBentoHeader}>
                    <View style={[styles.hrBentoIconBox, { backgroundColor: isDark ? "rgba(53, 214, 160, 0.14)" : "rgba(0, 168, 121, 0.10)" }]}>
                      <Ionicons name="people" size={24} color={isDark ? "#35D6A0" : "#00A879"} />
                    </View>
                    <View style={styles.hrBentoTag}>
                      <Text style={[styles.hrBentoTagText, { color: isDark ? "#35D6A0" : "#00A879" }]}>ACTIVE STAFF</Text>
                    </View>
                  </View>
                  <Text style={[styles.hrBentoStatNum, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                    {hrmsData?.stats?.total_employees ?? 12}
                  </Text>
                  <Text style={[styles.hrBentoStatSub, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                    Employees enrolled across 5 departments
                  </Text>
                </TouchableOpacity>

                {/* Attendance & Kiosk Tile */}
                <TouchableOpacity
                  style={[
                    styles.hrBentoTile,
                    {
                      backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                      borderColor: isDark ? "#294039" : "#D8E0DC",
                    },
                  ]}
                  onPress={() => setSelectedCategory("hrms")}
                  activeOpacity={0.8}
                >
                  <View style={styles.hrBentoHeader}>
                    <View style={[styles.hrBentoIconBox, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                      <Ionicons name="finger-print" size={24} color="#10B981" />
                    </View>
                    <View style={[styles.hrBentoTag, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                      <Text style={[styles.hrBentoTagText, { color: "#10B981" }]}>TODAY PRESENT</Text>
                    </View>
                  </View>
                  <Text style={[styles.hrBentoStatNum, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                    {hrmsData?.stats?.present_today ?? 4}
                  </Text>
                  <Text style={[styles.hrBentoStatSub, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                    {hrmsData?.stats?.absent_today ?? 8} staff on leave / absent today
                  </Text>
                </TouchableOpacity>

                {/* Leave Approvals Tile */}
                <TouchableOpacity
                  style={[
                    styles.hrBentoTile,
                    {
                      backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                      borderColor: isDark ? "#294039" : "#D8E0DC",
                    },
                  ]}
                  onPress={() => setSelectedCategory("hrms")}
                  activeOpacity={0.8}
                >
                  <View style={styles.hrBentoHeader}>
                    <View style={[styles.hrBentoIconBox, { backgroundColor: isDark ? "rgba(53, 214, 160, 0.14)" : "rgba(0, 168, 121, 0.10)" }]}>
                      <Ionicons name="calendar" size={24} color={isDark ? "#35D6A0" : "#00A879"} />
                    </View>
                    <View style={[styles.hrBentoTag, { backgroundColor: isDark ? "rgba(53, 214, 160, 0.12)" : "rgba(0, 168, 121, 0.10)" }]}>
                      <Text style={[styles.hrBentoTagText, { color: isDark ? "#35D6A0" : "#00A879" }]}>ACTION REQUIRED</Text>
                    </View>
                  </View>
                  <Text style={[styles.hrBentoStatNum, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                    {hrmsData?.stats?.pending_leaves ?? 2}
                  </Text>
                  <Text style={[styles.hrBentoStatSub, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                    Pending leave requests awaiting review
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Standard Sales Bento Suite */
              <View style={styles.bentoSection}>
                <SubAppCard
                  type="customers"
                  onPress={() => router.push("/(employee)/customers" as any)}
                  customersCount={stats?.totalCustomers ?? 0}
                  followUpsCount={stats?.followUpsDueCount ?? 0}
                />
                <SubAppCard
                  type="call_tracker"
                  onPress={() =>
                    router.push({ pathname: "/(user)/status", params: { from: "workspace" } } as any)
                  }
                  callsCount={0}
                  syncStatusText="Active • Telephony Sync Ready"
                />
              </View>
            )}

            {/* Momentum Section */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                {isHR ? "Workforce Telemetry" : "Momentum Metrics"}
              </Text>
              <Text style={[styles.sectionTag, { color: isDark ? "#35D6A0" : "#00A879" }]}>
                Live Sync
              </Text>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricsRow}>
                <MetricCard
                  label="Total Staff"
                  value={String(hrmsData?.stats?.total_employees ?? 12)}
                  subValue="in directory"
                  icon="people-outline"
                />
                <MetricCard
                  label="Checked In"
                  value={String(hrmsData?.stats?.present_today ?? 4)}
                  subValue="present today"
                  icon="checkmark-circle-outline"
                  isHighlight
                />
              </View>
              <View style={styles.metricsRow}>
                <MetricCard
                  label="Pending Leaves"
                  value={String(hrmsData?.stats?.pending_leaves ?? 2)}
                  subValue="approvals due"
                  icon="calendar-outline"
                  isHighlight
                />
                <MetricCard
                  label="Departments"
                  value={String(hrmsData?.stats?.total_departments ?? 5)}
                  subValue="divisions"
                  icon="business-outline"
                />
              </View>
            </View>

            
          </>
        )}

        {/* ── 2. FULL WORKING HRMS OPERATIONS SUITE ─────────────────────────── */}
        {selectedCategory === "hrms" && (
          <View style={styles.moduleSection}>
            {/* Header */}
            <View style={styles.moduleHeader}>
              <View>
                <Text style={[styles.moduleTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  HRMS Operations
                </Text>
                <Text style={[styles.moduleSubtitle, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                  Workforce Management, Attendance & Leave Approvals
                </Text>
              </View>
              <View style={[styles.liveStatusChip, { backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#D1FAE5" }]}>
                <View style={styles.greenDot} />
                <Text style={[styles.liveStatusText, { color: "#10B981" }]}>Live Kiosk</Text>
              </View>
            </View>

            {/* 4 Telemetry Metric Tiles */}
            <View style={styles.hrmsMetricsGrid}>
              <View style={[styles.hrmsMetricTile, { backgroundColor: isDark ? "#0E1714" : "#FFFFFF", borderColor: isDark ? "#294039" : "#D8E0DC" }]}>
                <Text style={styles.hrmsMetricLabel}>WORKFORCE</Text>
                <Text style={[styles.hrmsMetricValue, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  {hrmsData?.stats?.total_employees ?? 12}
                </Text>
                <Text style={styles.hrmsMetricSub}>Active employees</Text>
              </View>

              <View style={[styles.hrmsMetricTile, { backgroundColor: isDark ? "#0E1714" : "#FFFFFF", borderColor: isDark ? "#294039" : "#D8E0DC" }]}>
                <Text style={[styles.hrmsMetricLabel, { color: "#10B981" }]}>PRESENT TODAY</Text>
                <Text style={[styles.hrmsMetricValue, { color: "#10B981" }]}>
                  {hrmsData?.stats?.present_today ?? 4}
                </Text>
                <Text style={styles.hrmsMetricSub}>{hrmsData?.stats?.absent_today ?? 8} on leave / absent</Text>
              </View>

              <View style={[styles.hrmsMetricTile, { backgroundColor: isDark ? "#0E1714" : "#FFFFFF", borderColor: isDark ? "#294039" : "#D8E0DC" }]}>
                <Text style={[styles.hrmsMetricLabel, { color: isDark ? "#35D6A0" : "#00A879" }]}>PENDING LEAVES</Text>
                <Text style={[styles.hrmsMetricValue, { color: isDark ? "#35D6A0" : "#00A879" }]}>
                  {hrmsData?.stats?.pending_leaves ?? 2}
                </Text>
                <Text style={styles.hrmsMetricSub}>Approvals required</Text>
              </View>

              <View style={[styles.hrmsMetricTile, { backgroundColor: isDark ? "#0E1714" : "#FFFFFF", borderColor: isDark ? "#294039" : "#D8E0DC" }]}>
                <Text style={styles.hrmsMetricLabel}>DEPARTMENTS</Text>
                <Text style={[styles.hrmsMetricValue, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  {hrmsData?.stats?.total_departments ?? 5}
                </Text>
                <Text style={styles.hrmsMetricSub}>Corporate units</Text>
              </View>
            </View>

            {/* Attendance Punch Terminal Card */}
            {!isStaffTab && (
            <>
            <View style={[styles.punchTerminalCard, { backgroundColor: isDark ? "#0E1714" : "#FFFFFF", borderColor: isDark ? "#294039" : "#D8E0DC" }]}>
              <View style={styles.punchTerminalTop}>
                <View style={styles.punchIconBox}>
                  <Ionicons name="time" size={24} color={isDark ? "#35D6A0" : "#00A879"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.punchTerminalTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                    Attendance Terminal
                  </Text>
                  <Text style={[styles.punchTerminalSub, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                    {hrmsData?.user_punch?.has_punched_in
                      ? `Checked in at ${hrmsData.user_punch.punch_in_time}`
                      : "Not punched in yet today"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.punchActionButton,
                    {
                      backgroundColor: hrmsData?.user_punch?.has_punched_in
                        ? isDark
                          ? "rgba(239, 68, 68, 0.16)"
                          : "#FEE2E2"
                        : isDark
                        ? "rgba(16, 185, 129, 0.16)"
                        : "#D1FAE5",
                      borderColor: hrmsData?.user_punch?.has_punched_in ? "#EF4444" : "#10B981",
                    },
                  ]}
                  onPress={onPunchAttendance}
                  disabled={isPunching}
                  activeOpacity={0.8}
                >
                  {isPunching ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <>
                      <Ionicons
                        name={hrmsData?.user_punch?.has_punched_in ? "log-out" : "log-in"}
                        size={16}
                        color={hrmsData?.user_punch?.has_punched_in ? "#EF4444" : "#10B981"}
                      />
                      <Text
                        style={[
                          styles.punchActionText,
                          { color: hrmsData?.user_punch?.has_punched_in ? "#EF4444" : "#10B981" },
                        ]}
                      >
                        {hrmsData?.user_punch?.has_punched_in ? "Punch Out" : "Punch In"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Office Kiosk Info */}
              <View style={[styles.kioskInfoBox, { backgroundColor: isDark ? "#121F1B" : "#F8FAFC" }]}>
                <Ionicons name="videocam" size={16} color="#8FA09A" />
                <Text style={[styles.kioskInfoText, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                  Reception Face Biometric Tablet active. Real-time synchronous 1:1 facial verification enabled.
                </Text>
              </View>
            </View>

            {/* Pending Leave Approvals Queue (Actionable) */}
            <View style={styles.subSectionHeader}>
              <Text style={[styles.subSectionTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                Pending Leave Applications ({hrmsData?.pending_leaves?.length ?? 0})
              </Text>
              <Text style={styles.subSectionBadge}>Action Required</Text>
            </View>

            {hrmsData?.pending_leaves && hrmsData.pending_leaves.length > 0 ? (
              <View style={{ gap: 10, marginBottom: 20 }}>
                {hrmsData.pending_leaves.map((leave) => (
                  <View
                    key={leave.id}
                    style={[
                      styles.leaveCard,
                      {
                        backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                        borderColor: isDark ? "#294039" : "#D8E0DC",
                      },
                    ]}
                  >
                    <View style={styles.leaveCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.leaveEmployeeName, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                          {leave.employee_name} ({leave.employee_code})
                        </Text>
                        <Text style={[styles.leaveDepartment, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                          {leave.department} • {leave.leave_type} ({leave.total_days} day{leave.total_days === 1 ? "" : "s"})
                        </Text>
                      </View>
                      <View style={styles.leaveDaysBadge}>
                        <Text style={styles.leaveDaysText}>{leave.start_date}</Text>
                      </View>
                    </View>

                    <Text style={[styles.leaveReasonText, { color: isDark ? "#C1CDC7" : "#334155" }]}>
                      "{leave.reason}"
                    </Text>

                    {/* Action Buttons: Approve / Reject */}
                    <View style={styles.leaveActionsRow}>
                      <TouchableOpacity
                        style={[styles.leaveBtn, styles.approveBtn]}
                        onPress={() => onLeaveAction(leave.id, "approve")}
                        disabled={processingLeaveId === leave.id}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-circle" size={15} color="#FFFFFF" />
                        <Text style={styles.leaveBtnText}>Approve</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.leaveBtn, styles.rejectBtn]}
                        onPress={() => onLeaveAction(leave.id, "reject")}
                        disabled={processingLeaveId === leave.id}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="close-circle" size={15} color="#FFFFFF" />
                        <Text style={styles.leaveBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyBox, { backgroundColor: isDark ? "#0E1714" : "#FFFFFF", borderColor: isDark ? "#294039" : "#D8E0DC" }]}>
                <Ionicons name="checkmark-done-circle" size={36} color="#10B981" />
                <Text style={[styles.emptyBoxTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  All Leave Requests Resolved
                </Text>
                <Text style={styles.emptyBoxSub}>
                  No pending employee leave applications requiring approval.
                </Text>
              </View>
            )}

            </>
            )}
            {/* On HRMS Dashboard tab: Quick Link to Staff Directory */}
            {!isStaffTab ? (
              <TouchableOpacity
                style={[
                  styles.hrmsLaunchBanner,
                  {
                    backgroundColor: isDark ? "rgba(53, 214, 160, 0.12)" : "#E8F5EE",
                    borderColor: isDark ? "rgba(53, 214, 160, 0.3)" : "#C0E8D7",
                    marginTop: 16,
                  },
                ]}
                onPress={() => router.replace({ pathname: "/(employee)", params: { tab: "staff" } } as any)}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                  <View style={styles.hrmsLaunchIcon}>
                    <Ionicons name="people" size={20} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.hrmsLaunchTitle, { color: isDark ? "#F1F7F4" : "#0E3E2B" }]}>
                      Workforce Staff Directory ({filteredEmployees.length})
                    </Text>
                    <Text style={[styles.hrmsLaunchSub, { color: isDark ? "#8FA09A" : "#32634E" }]}>
                      Search directory, call or email staff across all departments
                    </Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color={isDark ? "#35D6A0" : "#00A879"} />
              </TouchableOpacity>
            ) : (
              <>
                {/* Dedicated Workforce Staff Directory (Staff Tab Only) */}
                <View style={styles.subSectionHeader}>
                  <Text style={[styles.subSectionTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                    Workforce Directory ({filteredEmployees.length})
                  </Text>
                </View>

                {/* Search within Directory */}
                <View style={styles.directorySearchWrapper}>
                  <Ionicons name="search" size={16} color="#8FA09A" style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.directorySearchInput, { color: isDark ? "#F1F7F4" : "#101513" }]}
                    placeholder="Search staff by name, code or department..."
                    placeholderTextColor={isDark ? "#8FA09A" : "#5E6964"}
                    value={hrmsSearch}
                    onChangeText={setHrmsSearch}
                  />
                  {hrmsSearch ? (
                    <TouchableOpacity onPress={() => setHrmsSearch("")}>
                      <Ionicons name="close-circle" size={16} color="#8FA09A" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </>
            )}

            {/* Employee Cards List */}
            <View style={{ gap: 10 }}>
              {filteredEmployees.map((emp) => {
                const initials = emp.name
                  .split(" ")
                  .filter(Boolean)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "EM";

                const handleCall = () => {
                  if (emp.phone) {
                    Linking.openURL(`tel:${emp.phone}`).catch(() => {});
                  }
                };

                const handleEmail = () => {
                  if (emp.email) {
                    Linking.openURL(`mailto:${emp.email}`).catch(() => {});
                  }
                };

                return (
                  <View
                    key={emp.id}
                    style={[
                      styles.employeeCard,
                      {
                        backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                        borderColor: isDark ? "#294039" : "#D8E0DC",
                      },
                    ]}
                  >
                    <View style={styles.employeeCardTop}>
                      <View style={[styles.employeeAvatar, { backgroundColor: isDark ? "#1E293B" : "#EDE9FE" }]}>
                        <Text style={[styles.employeeAvatarText, { color: isDark ? "#A78BFA" : "#7C3AED" }]}>
                          {initials}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.employeeName, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                          {emp.name}
                        </Text>
                        <Text style={[styles.employeeDesig, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                          {emp.designation} • {emp.employee_code}
                        </Text>
                      </View>
                      <View style={[styles.deptChip, { backgroundColor: isDark ? "rgba(53, 214, 160, 0.12)" : "#E8F5EE" }]}>
                        <Text style={styles.deptChipText}>{emp.department}</Text>
                      </View>
                    </View>

                    {/* Actions: Call & Email */}
                    <View style={styles.employeeFooter}>
                      <Text style={[styles.joinedText, { color: isDark ? "#64748B" : "#94A3B8" }]}>
                        Joined {emp.date_of_joining}
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {emp.phone ? (
                          <TouchableOpacity
                            style={[styles.contactCircleBtn, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}
                            onPress={handleCall}
                          >
                            <Ionicons name="call" size={14} color="#10B981" />
                          </TouchableOpacity>
                        ) : null}
                        {emp.email ? (
                          <TouchableOpacity
                            style={[styles.contactCircleBtn, { backgroundColor: isDark ? "rgba(53, 214, 160, 0.14)" : "rgba(0, 168, 121, 0.10)" }]}
                            onPress={handleEmail}
                          >
                            <Ionicons name="mail" size={14} color={isDark ? "#35D6A0" : "#00A879"} />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── 3. CUSTOMERS VIEW ────────────────────────────────────────────── */}
        {selectedCategory === "customers" && !isHR && (
          <View style={styles.moduleSection}>
            <View style={styles.moduleHeader}>
              <View>
                <Text style={[styles.moduleTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  Customers Directory
                </Text>
                <Text style={[styles.moduleSubtitle, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                  {customers.length} account{customers.length === 1 ? "" : "s"} accessible
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.moduleActionBtn, { backgroundColor: isDark ? "#121F1B" : "#DDF4EA" }]}
                onPress={() => router.push("/(employee)/customers" as any)}
              >
                <Text style={[styles.moduleActionBtnText, { color: isDark ? "#35D6A0" : "#00A879" }]}>
                  Open Full App →
                </Text>
              </TouchableOpacity>
            </View>

            {customers.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: isDark ? "#0E1714" : "#FFFFFF", borderColor: isDark ? "#294039" : "#D8E0DC" }]}>
                <Ionicons name="people-outline" size={36} color={isDark ? "#5A6D66" : "#A0ACA6"} />
                <Text style={[styles.emptyCardTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  No Customers Found
                </Text>
                <Text style={[styles.emptyCardSub, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                  {searchQuery ? `No matches for "${searchQuery}".` : "Your portfolio has no customer accounts assigned yet."}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {customers.slice(0, 5).map((customer) => (
                  <CustomerCard
                    key={String(customer.id)}
                    customer={customer}
                    onPress={() => router.push(`/(employee)/customers/${customer.id}` as any)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── 4. LEADS VIEW ────────────────────────────────────────────────── */}
        {selectedCategory === "leads" && !isHR && (
          <View style={styles.moduleSection}>
            <View style={styles.moduleHeader}>
              <View>
                <Text style={[styles.moduleTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  Leads Pipeline
                </Text>
                <Text style={[styles.moduleSubtitle, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                  {leads.length} active prospect{leads.length === 1 ? "" : "s"}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.moduleActionBtn, { backgroundColor: isDark ? "#121F1B" : "#FEF3C7" }]}
                onPress={() => router.push("/(employee)/leads" as any)}
              >
                <Text style={[styles.moduleActionBtnText, { color: isDark ? "#FBBF24" : "#D97706" }]}>
                  Open Full App →
                </Text>
              </TouchableOpacity>
            </View>

            {leads.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: isDark ? "#0E1714" : "#FFFFFF", borderColor: isDark ? "#294039" : "#D8E0DC" }]}>
                <Ionicons name="filter-outline" size={36} color={isDark ? "#5A6D66" : "#A0ACA6"} />
                <Text style={[styles.emptyCardTitle, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  No Leads Found
                </Text>
                <Text style={[styles.emptyCardSub, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                  {searchQuery ? `No leads match "${searchQuery}".` : "Your pipeline has no leads registered yet."}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {leads.slice(0, 5).map((lead) => (
                  <LeadCard
                    key={String(lead.id)}
                    lead={lead}
                    onPress={() => router.push(`/(employee)/leads/${lead.id}` as any)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  searchBarWrapper: {
    marginBottom: 12,
  },
  categoriesContainer: {
    marginBottom: 20,
    marginHorizontal: -16,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryItem: {
    alignItems: "center",
    width: 68,
  },
  categoryCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  activeIndicator: {
    width: 18,
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
  },
  heroSection: {
    marginBottom: 20,
  },
  heroHeading: {
    fontSize: 28,
    fontFamily: Typography.bold,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  heroSubheading: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.regular,
    marginTop: 4,
  },
  bentoSection: {
    marginBottom: 20,
    gap: 12,
  },
  hrBentoTile: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  hrBentoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  hrBentoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  hrBentoTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(53, 214, 160, 0.12)",
  },
  hrBentoTagText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  hrBentoStatNum: {
    fontSize: 26,
    fontFamily: Typography.bold,
    letterSpacing: -0.5,
  },
  hrBentoStatSub: {
    fontSize: 12,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: FontSizes.sectionTitle,
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
  },
  sectionTag: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  metricsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  hrmsLaunchBanner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 20,
  },
  hrmsLaunchIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#35D6A0",
    justifyContent: "center",
    alignItems: "center",
  },
  hrmsLaunchTitle: {
    fontSize: 13,
    fontFamily: Typography.bold,
  },
  hrmsLaunchSub: {
    fontSize: 11,
    fontFamily: Typography.regular,
    marginTop: 1,
  },
  moduleSection: {
    marginBottom: 24,
  },
  moduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  moduleTitle: {
    fontSize: 20,
    fontFamily: Typography.bold,
    letterSpacing: -0.4,
  },
  moduleSubtitle: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  liveStatusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  liveStatusText: {
    fontSize: 11,
    fontFamily: Typography.bold,
  },
  hrmsMetricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  hrmsMetricTile: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  hrmsMetricLabel: {
    fontSize: 10,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
    color: "#64748B",
    marginBottom: 4,
  },
  hrmsMetricValue: {
    fontSize: 22,
    fontFamily: Typography.bold,
    letterSpacing: -0.4,
  },
  hrmsMetricSub: {
    fontSize: 11,
    fontFamily: Typography.regular,
    color: "#8FA09A",
    marginTop: 2,
  },
  punchTerminalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  punchTerminalTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  punchIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(53, 214, 160, 0.14)",
    justifyContent: "center",
    alignItems: "center",
  },
  punchTerminalTitle: {
    fontSize: 15,
    fontFamily: Typography.bold,
  },
  punchTerminalSub: {
    fontSize: 12,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  punchActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  punchActionText: {
    fontSize: 12,
    fontFamily: Typography.bold,
  },
  kioskInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  kioskInfoText: {
    fontSize: 11,
    fontFamily: Typography.regular,
    flex: 1,
    lineHeight: 16,
  },
  subSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 4,
  },
  subSectionTitle: {
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  subSectionBadge: {
    fontSize: 11,
    fontFamily: Typography.bold,
    color: "#35D6A0",
  },
  leaveCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  leaveCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  leaveEmployeeName: {
    fontSize: 14,
    fontFamily: Typography.bold,
  },
  leaveDepartment: {
    fontSize: 12,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  leaveDaysBadge: {
    backgroundColor: "rgba(53, 214, 160, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  leaveDaysText: {
    fontSize: 11,
    fontFamily: Typography.bold,
    color: "#35D6A0",
  },
  leaveReasonText: {
    fontSize: 13,
    fontFamily: Typography.regular,
    fontStyle: "italic",
    marginBottom: 12,
  },
  leaveActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  leaveBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  approveBtn: {
    backgroundColor: "#10B981",
  },
  rejectBtn: {
    backgroundColor: "#EF4444",
  },
  leaveBtnText: {
    fontSize: 12,
    fontFamily: Typography.bold,
    color: "#FFFFFF",
  },
  emptyBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  emptyBoxTitle: {
    fontSize: 15,
    fontFamily: Typography.bold,
  },
  emptyBoxSub: {
    fontSize: 12,
    fontFamily: Typography.regular,
    color: "#8FA09A",
    textAlign: "center",
  },
  directorySearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8E0DC",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  directorySearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: Typography.regular,
  },
  employeeCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  employeeCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  employeeAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  employeeAvatarText: {
    fontSize: 13,
    fontFamily: Typography.bold,
  },
  employeeName: {
    fontSize: 14,
    fontFamily: Typography.bold,
  },
  employeeDesig: {
    fontSize: 11,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  deptChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deptChipText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: "#35D6A0",
  },
  employeeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.4)",
  },
  joinedText: {
    fontSize: 11,
    fontFamily: Typography.regular,
  },
  contactCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  moduleActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  moduleActionBtnText: {
    fontSize: 12,
    fontFamily: Typography.bold,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  emptyCardSub: {
    fontSize: 13,
    fontFamily: Typography.regular,
    textAlign: "center",
  },
});
