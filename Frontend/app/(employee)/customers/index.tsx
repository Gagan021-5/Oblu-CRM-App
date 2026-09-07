import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChip } from "@/components/ui/FilterChip";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { CustomerCard } from "@/components/employee/CustomerCard";
import { WeeklyActivityChart } from "@/components/employee/WeeklyActivityChart";
import { getMockCustomers, Customer } from "@/data/mockCustomers";

type FilterTab = "all" | "followup_due" | "payment_pending" | "recently_contacted";

export default function CustomerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [showSearch, setShowSearch] = useState(false);

  const loadData = useCallback(async (isPullToRefresh = false) => {
    if (!isPullToRefresh) setLoading(true);
    try {
      const data = await getMockCustomers(isPullToRefresh ? 500 : 350);
      setCustomers(data);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
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
        list = list.filter(
          (c) =>
            c.nextFollowUp.toLowerCase().includes("today") ||
            c.nextFollowUp.toLowerCase().includes("tomorrow")
        );
        break;
      case "payment_pending":
        list = list.filter(
          (c) => c.paymentStatus === "pending" || c.paymentStatus === "overdue"
        );
        break;
      case "recently_contacted":
        list = list.filter(
          (c) =>
            c.lastContactTime.toLowerCase().includes("today") ||
            c.lastContactTime.toLowerCase().includes("yesterday")
        );
        break;
      case "all":
      default:
        break;
    }

    return list;
  }, [customers, searchQuery, activeFilter]);

  // Counts for filter chips
  const counts = useMemo(() => {
    const total = customers.length;
    const followups = customers.filter(
      (c) =>
        c.nextFollowUp.toLowerCase().includes("today") ||
        c.nextFollowUp.toLowerCase().includes("tomorrow")
    ).length;
    const pending = customers.filter(
      (c) => c.paymentStatus === "pending" || c.paymentStatus === "overdue"
    ).length;
    const recent = customers.filter(
      (c) =>
        c.lastContactTime.toLowerCase().includes("today") ||
        c.lastContactTime.toLowerCase().includes("yesterday")
    ).length;
    return { total, followups, pending, recent };
  }, [customers]);

  const renderHeader = () => (
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
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
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
            Customers
          </Text>
          <Text
            style={[
              styles.screenSubtitle,
              { color: isDark ? "#8FA09A" : "#5E6964" },
            ]}
          >
            128 relationships
          </Text>
        </View>

        <View style={styles.rightNav}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: showSearch
                  ? isDark
                    ? "rgba(53, 214, 160, 0.16)"
                    : "#DDF4EA"
                  : isDark
                  ? "#121F1B"
                  : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
            onPress={() => setShowSearch(!showSearch)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={
                showSearch
                  ? isDark
                    ? "#35D6A0"
                    : "#00A879"
                  : isDark
                  ? "#F1F7F4"
                  : "#101513"
              }
            />
          </TouchableOpacity>
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
              128
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
              96
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
              7
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
              12
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

      {/* Weekly Customer Activity Chart */}
      <WeeklyActivityChart />

      {/* Collapsible Search Input */}
      {showSearch && (
        <View style={styles.searchWrap}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by company, contact person, city..."
          />
        </View>
      )}

      {/* Filter Chips Horizontal Bar */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: "all", label: "All", count: counts.total },
            { key: "followup_due", label: "Follow-up Due", count: counts.followups },
            { key: "payment_pending", label: "Payment Pending", count: counts.pending },
            { key: "recently_contacted", label: "Recently Contacted", count: counts.recent },
          ]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              count={item.count}
              isActive={activeFilter === item.key}
              onPress={() => setActiveFilter(item.key as FilterTab)}
            />
          )}
        />
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
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          {renderHeader()}
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
          <SkeletonCard height={120} />
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CustomerCard
              customer={item}
              onPress={() => router.push(`/(employee)/customers/${item.id}` as any)}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No customers found"
              description={
                searchQuery
                  ? `No customer matched "${searchQuery}". Try changing your search keywords or filter tab.`
                  : "No customers matching this filter criteria."
              }
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 96 },
          ]}
          showsVerticalScrollIndicator={false}
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
  rightNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  searchWrap: {
    marginBottom: 12,
  },
  filterBar: {
    marginBottom: 12,
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
