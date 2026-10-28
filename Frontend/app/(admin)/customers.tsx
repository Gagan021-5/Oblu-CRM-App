/**
 * Admin — Customer Directory Screen (Real Database Data)
 * Fetches live customer data from the backend API.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Linking,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Spacing, Radius, Shadows } from "@/constants/theme";
import { StatusPill } from "@/components/ui/StatusPill";
import { Customer } from "@/data/customerTypes";
import { fetchCustomerPageFromApi } from "@/services/customerService";
import { CustomerNavDrawer } from "@/components/CustomerNavDrawer";
import { CustomerBalanceFilter, CustomerFilterSheet, CustomerPaymentFilter, CustomerSortOption } from "@/components/ui/CustomerFilterSheet";

function getOutstandingAmount(value: string): number {
  const normalized = (value || "").replace(/[^0-9.-]/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<CustomerPaymentFilter>("all");
  const [balanceFilter, setBalanceFilter] = useState<CustomerBalanceFilter>("all");
  const [sortOption, setSortOption] = useState<CustomerSortOption>("default");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = useCallback(async (isPull = false, page = 1, append = false) => {
    if (page === 1 && !isPull) setLoading(true);
    if (page > 1) setLoadingMore(true);
    if (page === 1) setLoadError("");
    try {
      const result = await fetchCustomerPageFromApi({
        search: debouncedSearch,
        payment_status: paymentFilter,
        has_outstanding: balanceFilter === "outstanding",
        ordering: sortOption,
        page,
        page_size: 25,
      });
      const customerList = result?.customers || [];
      setCustomers((previous) => append ? [...previous, ...customerList] : customerList);
      setNextPage(result?.nextPage ?? null);
    } catch (error: any) {
      if (!append) setCustomers([]);
      if (page === 1) setLoadError(error?.response?.status === 403
        ? "This account does not have permission to view the customer directory."
        : "Could not load customer records from the server. Check the connection and retry.");
    } finally {
      if (page === 1) setLoading(false);
      if (page > 1) setLoadingMore(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, paymentFilter, balanceFilter, sortOption]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadData(true);
  };

  const loadNextPage = useCallback(() => {
    if (nextPage && !loadingMore && !loading && !loadError) {
      void loadData(false, nextPage, true);
    }
  }, [nextPage, loadingMore, loading, loadError, loadData]);

  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = customers.filter(
      (c) =>
        !q ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.contactPerson || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q)
    );

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
  }, [customers, search, paymentFilter, balanceFilter, sortOption]);

  const filtersActive = paymentFilter !== "all" || balanceFilter !== "all" || sortOption !== "default";

  const resetDirectoryFilters = () => {
    setPaymentFilter("all");
    setBalanceFilter("all");
    setSortOption("default");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VIP": return { bg: "rgba(239, 68, 68, 0.1)", text: "#EF4444", border: "rgba(239, 68, 68, 0.3)" };
      case "Active": return { bg: colors.mintTintedSurface, text: colors.primary, border: colors.primaryBorder };
      case "Inactive": return { bg: "rgba(156, 163, 175, 0.1)", text: "#9CA3AF", border: "rgba(156, 163, 175, 0.3)" };
      default: return { bg: colors.mintTintedSurface, text: colors.primary, border: colors.primaryBorder };
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "overdue": return "#EF4444";
      case "pending": return "#F59E0B";
      case "paid": return "#10B981";
      default: return colors.textMuted;
    }
  };

  const renderCustomerCard = ({ item }: { item: Customer }) => {
    const paymentColor = getPaymentColor(item.paymentStatus);
    const initials = (item.name || "Customer")
      .split(" ")
      .filter(Boolean)
      .map((w: string) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "CU";

    const paymentVariant =
      item.paymentStatus === "paid"
        ? "paid"
        : item.paymentStatus === "pending"
        ? "pending"
        : item.paymentStatus === "overdue"
        ? "overdue"
        : "neutral";

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/(employee)/customers/${item.id}`)}
        style={[
          styles.clientCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        {/* Top Row: Circular Avatar + Identity + Status Pill */}
        <View style={styles.clientTopRow}>
          <View style={styles.clientHeaderLeft}>
            <View
              style={[
                styles.avatarBox,
                {
                  backgroundColor: isDark
                    ? "rgba(53, 214, 160, 0.14)"
                    : "rgba(0, 168, 121, 0.12)",
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                {initials}
              </Text>
            </View>

            <View style={styles.clientIdentity}>
              <Text
                style={[styles.clientName, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[styles.clientSub, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.contactPerson || "Contact"} • {item.city || "Headquarters"}
              </Text>
            </View>
          </View>

          <StatusPill
            label={item.paymentStatus || item.status || "active"}
            variant={paymentVariant as any}
            size="small"
          />
        </View>

        {/* Middle Row: Soft RGBA Surface for Metrics */}
        <View
          style={[
            styles.metaContainer,
            {
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.03)"
                : "rgba(16, 21, 19, 0.03)",
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "rgba(16, 21, 19, 0.06)",
            },
          ]}
        >
          <View style={styles.metaCol}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              OUTSTANDING
            </Text>
            <Text style={[styles.fieldValue, { color: paymentColor }]}>
              {item.outstandingPayment || "₹0.00"}
            </Text>
          </View>

          <View
            style={[
              styles.metaDivider,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(16, 21, 19, 0.08)",
              },
            ]}
          />

          <View style={styles.metaCol}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
              SALESPERSON
            </Text>
            <Text
              style={[styles.fieldValueSmall, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.assignedSalesperson || "Assigned Rep"}
            </Text>
          </View>
        </View>

        {/* Footer Row: Last Contact / Credit & Quick Action Pill */}
        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            <Ionicons
              name="time-outline"
              size={13}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.footerText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.lastContactTime
                ? `Last contact: ${item.lastContactTime}`
                : `Credit: ${item.creditPeriod || "30 Days"}`}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.callPillBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(53, 214, 160, 0.12)"
                    : "rgba(0, 168, 121, 0.10)",
                  borderColor: isDark
                    ? "rgba(53, 214, 160, 0.25)"
                    : "rgba(0, 168, 121, 0.20)",
                },
              ]}
              onPress={() => {
                const cleaned = (item.phone || "").replace(/[^0-9+]/g, "");
                if (cleaned) {
                  Linking.openURL(`tel:${cleaned}`).catch(() => {
                    Alert.alert("Error", "Could not open dialer.");
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="call"
                size={12}
                color={isDark ? "#35D6A0" : "#00A879"}
              />
              <Text
                style={[
                  styles.callPillText,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                Call
              </Text>
            </TouchableOpacity>

            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.textMuted}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 14),
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => setDrawerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open customer navigation"
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={21} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.screenHeading, { color: colors.textPrimary }]} numberOfLines={1}>
          Customer Directory
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search customers, contacts, city..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setFilterVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Filter and sort customers"
            style={styles.filterButton}
          >
            <Ionicons
              name="options-outline"
              size={21}
              color={filtersActive ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading customers from database...
          </Text>
        </View>
      ) : filteredCustomers.length === 0 ? (
        <View style={styles.loadingWrap}>
          <Ionicons name={loadError ? "cloud-offline-outline" : "people-outline"} size={48} color={colors.textMuted} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
          {loadError || (search || filtersActive ? "No customers match these search and filter options" : "No customers found")}
          </Text>
          {loadError ? <TouchableOpacity onPress={() => { void loadData(); }} style={styles.retryButton}><Text style={styles.retryText}>Retry</Text></TouchableOpacity> : null}
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCustomerCard}
          onEndReached={loadNextPage}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} color={colors.primary} /> : null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: Spacing.screenPadding,
            paddingBottom: Math.max(insets.bottom, 16) + 90,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
      <CustomerFilterSheet
        visible={filterVisible}
        paymentFilter={paymentFilter}
        balanceFilter={balanceFilter}
        sortOption={sortOption}
        onPaymentFilterChange={setPaymentFilter}
        onBalanceFilterChange={setBalanceFilter}
        onSortOptionChange={setSortOption}
        onClose={() => setFilterVisible(false)}
        onReset={resetDirectoryFilters}
      />
      <CustomerNavDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} isAdmin />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  screenHeading: {
    flex: 1,
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.screenTitle,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  menuBtn: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSpacer: {
    width: 34,
    height: 34,
  },
  searchWrap: {
    paddingHorizontal: Spacing.screenPadding,
    marginVertical: Spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
  },
  filterButton: {
    width: 32,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  clientCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    ...Shadows.card,
  },
  clientTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  clientHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    fontFamily: Typography.bold,
    fontSize: 14,
  },
  clientIdentity: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontFamily: Typography.bold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  clientSub: {
    fontFamily: Typography.medium,
    fontSize: 13,
  },
  metaContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  metaDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 10,
  },
  fieldLabel: {
    fontFamily: Typography.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fieldValue: {
    fontFamily: Typography.bold,
    fontSize: 15,
  },
  fieldValueSmall: {
    fontFamily: Typography.bold,
    fontSize: 13,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  footerText: {
    fontFamily: Typography.medium,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: 4,
  },
  callPillText: {
    fontFamily: Typography.bold,
    fontSize: 11,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: Typography.regular,
    fontSize: 14,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: "#00A879",
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.bodySmall,
  },
});
