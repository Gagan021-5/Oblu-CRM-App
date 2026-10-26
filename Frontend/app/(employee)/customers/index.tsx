import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Typography, FontSizes } from "@/constants/theme";
import { SearchBar } from "@/components/ui/SearchBar";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CustomerCard } from "@/components/employee/CustomerCard";
import { Customer } from "@/data/customerTypes";
import { DashboardStats, fetchCustomersFromApi, fetchDashboardStatsApi } from "@/services/customerService";
import { CustomerNavDrawer } from "@/components/CustomerNavDrawer";
import { CustomerBalanceFilter, CustomerFilterSheet, CustomerPaymentFilter, CustomerSortOption } from "@/components/ui/CustomerFilterSheet";

function getOutstandingAmount(value: string): number {
  const normalized = (value || "").replace(/[^0-9.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

type FilterTab = "all" | "followup_due" | "payment_pending" | "recently_contacted";

// Memoized List Item row to prevent unnecessary re-renders in large VirtualizedLists
const CustomerListItem = React.memo(
  ({
    item,
    onPress,
  }: {
    item: Customer;
    onPress: (id: string | number) => void;
  }) => {
    const handlePress = useCallback(() => {
      onPress(item.id);
    }, [item.id, onPress]);

    return <CustomerCard customer={item} onPress={handlePress} />;
  },
  (prev, next) => {
    return (
      prev.item.id === next.item.id &&
      prev.item.name === next.item.name &&
      prev.item.paymentStatus === next.item.paymentStatus &&
      prev.item.lastContactTime === next.item.lastContactTime &&
      prev.item.nextFollowUp === next.item.nextFollowUp &&
      prev.onPress === next.onPress
    );
  }
);


export default function CustomerDashboardScreen() {
  const routeParams = useLocalSearchParams<{ filter?: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const isBusinessManager = useMemo(() => {
    const role = (user?.role || "").toLowerCase();
    const uname = (user?.username || "").toLowerCase();
    return role.includes("business") || role.includes("buss_mgr") || uname.includes("vibhuti");
  }, [user]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>(() => {
    const value = routeParams.filter;
    return value === "followup_due" || value === "payment_pending" || value === "recently_contacted" ? value : "all";
  });

  useEffect(() => {
    const value = routeParams.filter;
    setActiveFilter(value === "followup_due" || value === "payment_pending" || value === "recently_contacted" ? value : "all");
  }, [routeParams.filter]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<CustomerPaymentFilter>("all");
  const [balanceFilter, setBalanceFilter] = useState<CustomerBalanceFilter>("all");
  const [sortOption, setSortOption] = useState<CustomerSortOption>("default");

  const loadDashboardStats = useCallback(async () => {
    try {
      const stats = await fetchDashboardStatsApi();
      setDashboardStats(stats);
    } catch {
      setDashboardStats(null);
    }
  }, []);

  useEffect(() => { void loadDashboardStats(); }, [loadDashboardStats]);

  const loadData = useCallback(async (isPullToRefresh = false) => {
    if (!isPullToRefresh) setLoading(true);
    setLoadError("");
    try {
      const data = await fetchCustomersFromApi({
        search: searchQuery,
        filter: activeFilter,
      });
      setCustomers(data);
    } catch {
      setCustomers([]);
      setLoadError("Could not load customer records from the server. Check your connection and access, then retry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
    void loadDashboardStats();
  };

  // Filter and search logic
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.contactPerson.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }

    // Tab filter
    switch (activeFilter) {
      case "followup_due":
        list = list.filter((c) => (c.followupsDue || 0) > 0);
        break;
      case "payment_pending":
        list = list.filter(
          (c) => c.paymentStatus === "pending" || c.paymentStatus === "overdue"
        );
        break;
      case "recently_contacted":
        list = list.filter(
          (c) =>
            (c.lastContactTime || "").toLowerCase().includes("today") ||
            (c.lastContactTime || "").toLowerCase().includes("yesterday")
        );
        break;
      case "all":
      default:
        break;
    }

    if (paymentFilter !== "all") {
      list = list.filter((customer) => customer.paymentStatus === paymentFilter);
    }
    if (balanceFilter === "outstanding") {
      list = list.filter((customer) => getOutstandingAmount(customer.outstandingPayment) > 0);
    }

    if (sortOption === "name_asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "name_desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === "outstanding_high") {
      list.sort((a, b) => getOutstandingAmount(b.outstandingPayment) - getOutstandingAmount(a.outstandingPayment));
    } else if (sortOption === "outstanding_low") {
      list.sort((a, b) => getOutstandingAmount(a.outstandingPayment) - getOutstandingAmount(b.outstandingPayment));
    }

    return list;
  }, [customers, searchQuery, activeFilter, paymentFilter, balanceFilter, sortOption]);

  const filtersActive = activeFilter !== "all" || paymentFilter !== "all" || balanceFilter !== "all" || sortOption !== "default";

  const resetDirectoryFilters = useCallback(() => {
    setActiveFilter("all");
    setPaymentFilter("all");
    setBalanceFilter("all");
    setSortOption("default");
  }, []);

  const listHeaderComponent = useMemo(() => (
    <View>
      {/* Top Workspace Bar */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: isDark ? "#121F1B" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
          onPress={() => setDrawerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open customer navigation"
          activeOpacity={0.7}
        >
          <Ionicons
            name="menu"
            size={18}
            color={isDark ? "#F1F7F4" : "#101513"}
          />
        </TouchableOpacity>

        <View style={styles.titleColumn}>
          <Text
            style={[
              styles.screenTitle,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            {isBusinessManager ? "Enterprise Accounts" : "Customers"}
          </Text>
          <Text
            style={[
              styles.screenSubtitle,
              { color: isDark ? "#8FA09A" : "#5E6964" },
            ]}
          >
            {customers.length} {isBusinessManager || user?.hierarchy_scope?.can_view_all_salespersons ? "enterprise relationships" : "assigned accounts"}
          </Text>
        </View>

      </View>

      {/* Summary Bento Card */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
            borderColor: isDark ? "#294039" : "#D8E0DC",
          },
        ]}
      >
        <Text
          style={[
            styles.summaryTitle,
            { color: isDark ? "#8FA09A" : "#5E6964" },
          ]}
        >
          PORTFOLIO SUMMARY
        </Text>
        <View style={styles.summaryMetricsRow}>
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryVal,
                { color: isDark ? "#F1F7F4" : "#101513" },
              ]}
            >
              {dashboardStats?.totalCustomers ?? 0}
            </Text>
            <Text
              style={[
                styles.summaryLbl,
                { color: isDark ? "#8FA09A" : "#5E6964" },
              ]}
            >
              Total
            </Text>
          </View>
          <View
            style={[
              styles.summaryDivider,
              { backgroundColor: isDark ? "#1C2D26" : "#E8EFEB" },
            ]}
          />
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryVal,
                { color: isDark ? "#35D6A0" : "#00A879" },
              ]}
            >
              {dashboardStats?.activeCustomersCount ?? 0}
            </Text>
            <Text
              style={[
                styles.summaryLbl,
                { color: isDark ? "#8FA09A" : "#5E6964" },
              ]}
            >
              Active
            </Text>
          </View>
          <View
            style={[
              styles.summaryDivider,
              { backgroundColor: isDark ? "#1C2D26" : "#E8EFEB" },
            ]}
          />
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryVal,
                { color: isDark ? "#B7F34A" : "#2E7D32" },
              ]}
            >
              {dashboardStats?.followUpsDueCount ?? 0}
            </Text>
            <Text
              style={[
                styles.summaryLbl,
                { color: isDark ? "#8FA09A" : "#5E6964" },
              ]}
            >
              Follow-ups
            </Text>
          </View>
          <View
            style={[
              styles.summaryDivider,
              { backgroundColor: isDark ? "#1C2D26" : "#E8EFEB" },
            ]}
          />
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryVal,
                { color: isDark ? "#F2B84B" : "#C97A1E" },
              ]}
            >
              {dashboardStats?.pendingPaymentsCount ?? 0}
            </Text>
            <Text
              style={[
                styles.summaryLbl,
                { color: isDark ? "#8FA09A" : "#5E6964" },
              ]}
            >
              Pending
            </Text>
          </View>
        </View>
      </View>

      {/* Search with filters beside it */}
      <View style={styles.searchFilterRow}>
        <View style={styles.searchInputWrap}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by company, contact person, city..."
          />
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Filter and sort customers"
          accessibilityState={{ selected: filtersActive }}
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.75}
          style={[styles.filterButton, { backgroundColor: isDark ? "#121F1B" : "#FFFFFF", borderColor: filtersActive ? (isDark ? "#35D6A0" : "#00A879") : (isDark ? "#294039" : "#D8E0DC") }]}
        >
          <Ionicons name="options-outline" size={20} color={filtersActive ? (isDark ? "#35D6A0" : "#00A879") : (isDark ? "#F1F7F4" : "#101513")} />
        </TouchableOpacity>
      </View>

      {/* List Header Count */}
      <View style={styles.listHeaderRow}>
        <Text
          style={[
            styles.listCountText,
            { color: isDark ? "#8FA09A" : "#5E6964" },
          ]}
        >
          Showing {filteredCustomers.length} customer
          {filteredCustomers.length === 1 ? "" : "s"}
        </Text>
      </View>
    </View>
  ), [
    isDark,
    isBusinessManager,
    searchQuery,
    activeFilter,
    filtersActive,
    loadError,
    customers.length,
    filteredCustomers.length,
    dashboardStats,
  ]);

  const handleCustomerPress = useCallback((id: string | number) => {
    router.push(`/(employee)/customers/${id}` as any);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Customer }) => (
      <CustomerListItem item={item} onPress={handleCustomerPress} />
    ),
    [handleCustomerPress]
  );

  const keyExtractor = useCallback((item: Customer) => String(item.id), []);

  const emptyComponent = useMemo(
    () => (
      <EmptyState
        icon={loadError ? "cloud-offline-outline" : "search-outline"}
        title={loadError ? "Customer data unavailable" : "No customers found"}
        description={loadError || (searchQuery || filtersActive || activeFilter !== "all"
          ? "No customer matched your search or filters. Try changing the search keywords or filter options."
          : "No customers matching this filter criteria.")}
        actionLabel={loadError ? "Retry" : "Reset Filters"}
        onAction={() => {
          if (loadError) { void loadData(); return; }
          setSearchQuery("");
          resetDirectoryFilters();
        }}
      />
    ),
    [searchQuery, filtersActive, activeFilter, resetDirectoryFilters, loadError, loadData]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          {listHeaderComponent}
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={listHeaderComponent}
          ListEmptyComponent={emptyComponent}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 96 },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === "android"}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "#35D6A0" : "#00A879"}
              colors={[isDark ? "#35D6A0" : "#00A879"]}
            />
          }
        />
      )}
      <CustomerFilterSheet
        visible={filterVisible}
        activityFilter={activeFilter}
        onActivityFilterChange={setActiveFilter}
        paymentFilter={paymentFilter}
        balanceFilter={balanceFilter}
        sortOption={sortOption}
        onPaymentFilterChange={setPaymentFilter}
        onBalanceFilterChange={setBalanceFilter}
        onSortOptionChange={setSortOption}
        onClose={() => setFilterVisible(false)}
        onReset={resetDirectoryFilters}
      />
      <CustomerNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    paddingHorizontal: 16,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 4,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  titleColumn: {
    flex: 1,
    marginLeft: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: Typography.bold,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
  },
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  summaryMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryVal: {
    fontSize: 20,
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
  },
  summaryLbl: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.medium,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 28,
  },
  searchFilterRow: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInputWrap: {
    flex: 1,
  },
  filterButton: {
    width: 44,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 13,
  },
  listHeaderRow: {
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  listCountText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.medium,
  },
});
