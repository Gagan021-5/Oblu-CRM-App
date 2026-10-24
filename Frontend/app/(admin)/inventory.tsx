import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Typography, FontSizes, Radius, Shadows } from "@/constants/theme";
import { SearchBar } from "@/components/ui/SearchBar";
import { FilterChip } from "@/components/ui/FilterChip";
import { MetricCard } from "@/components/employee/MetricCard";
import { StatusPill } from "@/components/ui/StatusPill";
import { FloatingTabBar } from "@/components/employee/FloatingTabBar";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  reorderLevel: number;
  unitPrice: string;
  status: "In Stock" | "Low Stock" | "Critical";
  location: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "1", name: "Oblu Premium Dental Implant 3.5mm", sku: "SKU-IMP-001", category: "Implants", stock: 120, reorderLevel: 25, unitPrice: "₹4,200", status: "In Stock", location: "Bin A-14" },
  { id: "2", name: "Oblu Surgical Drill Kit Complete", sku: "SKU-DRL-004", category: "Surgical", stock: 8, reorderLevel: 10, unitPrice: "₹18,500", status: "Low Stock", location: "Shelf B-02" },
  { id: "3", name: "Prosthetic Titanium Abutment 4.0mm", sku: "SKU-ABT-012", category: "Prosthetics", stock: 240, reorderLevel: 50, unitPrice: "₹1,850", status: "In Stock", location: "Bin C-08" },
  { id: "4", name: "Bone Graft Particulate 0.5cc", sku: "SKU-BNG-002", category: "Biomaterials", stock: 3, reorderLevel: 15, unitPrice: "₹3,400", status: "Critical", location: "Cold Vault 1" },
  { id: "5", name: "Collagen Membrane Resorbable 15x20", sku: "SKU-MBR-003", category: "Biomaterials", stock: 45, reorderLevel: 15, unitPrice: "₹2,900", status: "In Stock", location: "Cold Vault 2" },
  { id: "6", name: "Internal Hex Implant 4.5 x 10mm", sku: "SKU-IMP-009", category: "Implants", stock: 85, reorderLevel: 20, unitPrice: "₹4,600", status: "In Stock", location: "Bin A-18" },
  { id: "7", name: "Torque Wrench Prosthetic Driver 1.25", sku: "SKU-INS-022", category: "Instruments", stock: 5, reorderLevel: 8, unitPrice: "₹7,800", status: "Low Stock", location: "Shelf D-01" },
  { id: "8", name: "Healing Cap Titanium 4.5mm Wide", sku: "SKU-CAP-005", category: "Prosthetics", stock: 310, reorderLevel: 60, unitPrice: "₹850", status: "In Stock", location: "Bin C-12" },
];

export default function InventoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = (user?.role || "").toLowerCase().includes("admin");

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const filteredItems = useMemo(() => {
    return INITIAL_INVENTORY.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFilter =
        activeFilter === "all" ||
        (activeFilter === "in_stock" && item.status === "In Stock") ||
        (activeFilter === "low_stock" && item.status === "Low Stock") ||
        (activeFilter === "critical" && item.status === "Critical");

      return matchSearch && matchFilter;
    });
  }, [searchQuery, activeFilter]);

  const counts = useMemo(() => {
    const total = INITIAL_INVENTORY.length;
    const inStock = INITIAL_INVENTORY.filter((i) => i.status === "In Stock").length;
    const lowStock = INITIAL_INVENTORY.filter((i) => i.status === "Low Stock").length;
    const critical = INITIAL_INVENTORY.filter((i) => i.status === "Critical").length;
    return { total, inStock, lowStock, critical };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* ── Top Workspace Bar with Back Button ── */}
      <View style={[styles.topBar, { borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? "#121F1B" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace(isAdmin ? "/(admin)/users" : "/(employee)"))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color={isDark ? "#F1F7F4" : "#101513"} />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={[styles.screenHeading, { color: colors.textPrimary }]}>
            Inventory & Warehouse
          </Text>
          <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
            542 catalog SKUs • Warehouse telemetry
          </Text>
        </View>

        <View style={styles.topBarRightPlaceholder} />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Search Bar */}
            <View style={styles.searchWrapper}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search catalog by SKU, name or category..."
                onClear={() => setSearchQuery("")}
              />
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsRow}>
              <MetricCard
                label="Total Catalog Items"
                value="542"
                subValue="SKUs active"
                icon="cube-outline"
              />
              <MetricCard
                label="Low Stock Alerts"
                value="14"
                subValue="below reorder level"
                icon="warning-outline"
                isHighlight
              />
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <FilterChip
                label="All SKUs"
                count={counts.total}
                isActive={activeFilter === "all"}
                onPress={() => setActiveFilter("all")}
              />
              <FilterChip
                label="In Stock"
                count={counts.inStock}
                isActive={activeFilter === "in_stock"}
                onPress={() => setActiveFilter("in_stock")}
              />
              <FilterChip
                label="Low Stock"
                count={counts.lowStock}
                isActive={activeFilter === "low_stock"}
                onPress={() => setActiveFilter("low_stock")}
              />
              <FilterChip
                label="Critical"
                count={counts.critical}
                isActive={activeFilter === "critical"}
                onPress={() => setActiveFilter("critical")}
              />
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          const pillVariant =
            item.status === "In Stock"
              ? "paid"
              : item.status === "Low Stock"
              ? "pending"
              : "overdue";

          return (
            <View
              style={[
                styles.itemCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.itemTopRow}>
                <View
                  style={[
                    styles.itemAvatar,
                    {
                      backgroundColor:
                        item.status === "Critical"
                          ? isDark ? "rgba(239, 68, 68, 0.14)" : "rgba(239, 68, 68, 0.12)"
                          : item.status === "Low Stock"
                          ? isDark ? "rgba(245, 158, 11, 0.14)" : "rgba(245, 158, 11, 0.12)"
                          : isDark ? "rgba(53, 214, 160, 0.14)" : "rgba(0, 168, 121, 0.12)",
                    },
                  ]}
                >
                  <Ionicons
                    name="cube"
                    size={18}
                    color={
                      item.status === "Critical"
                        ? "#DC2626"
                        : item.status === "Low Stock"
                        ? "#D97706"
                        : isDark ? "#35D6A0" : "#00A879"
                    }
                  />
                </View>

                <View style={styles.itemIdentity}>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    {item.sku} • {item.category} • {item.location}
                  </Text>
                </View>

                <StatusPill label={item.status} variant={pillVariant as any} size="small" />
              </View>

              {/* Meta Container */}
              <View
                style={[
                  styles.metaContainer,
                  {
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(16, 21, 19, 0.03)",
                    borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(16, 21, 19, 0.06)",
                  },
                ]}
              >
                <View style={styles.metaCol}>
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>CURRENT STOCK</Text>
                  <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                    {item.stock} <Text style={{ fontSize: 11, fontFamily: Typography.medium, color: colors.textSecondary }}>units</Text>
                  </Text>
                </View>
                <View style={[styles.metaDivider, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(16, 21, 19, 0.08)" }]} />
                <View style={styles.metaCol}>
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>REORDER LEVEL</Text>
                  <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                    {item.reorderLevel} <Text style={{ fontSize: 11, fontFamily: Typography.medium, color: colors.textSecondary }}>units</Text>
                  </Text>
                </View>
                <View style={[styles.metaDivider, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(16, 21, 19, 0.08)" }]} />
                <View style={styles.metaCol}>
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>UNIT VALUE</Text>
                  <Text style={[styles.metaValueHighlight, { color: isDark ? "#35D6A0" : "#00A879" }]}>
                    {item.unitPrice}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No SKUs found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Try adjusting your search query or filters.
            </Text>
          </View>
        }
      />

      <FloatingTabBar />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 10,
  },
  screenHeading: {
    fontFamily: Typography.bold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  screenSub: {
    fontFamily: Typography.medium,
    fontSize: 12,
    marginTop: 1,
  },
  topBarRightPlaceholder: {
    width: 38,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerBlock: {
    marginBottom: 8,
  },
  searchWrapper: {
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    ...Shadows.card,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  itemAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  itemIdentity: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontFamily: Typography.bold,
    fontSize: 15,
    letterSpacing: -0.2,
  },
  itemSub: {
    fontFamily: Typography.medium,
    fontSize: 12,
    marginTop: 2,
  },
  metaContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  metaDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  metaLabel: {
    fontFamily: Typography.semiBold,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  metaValue: {
    fontFamily: Typography.bold,
    fontSize: 13,
  },
  metaValueHighlight: {
    fontFamily: Typography.bold,
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Typography.bold,
    fontSize: 16,
  },
  emptySubtitle: {
    fontFamily: Typography.medium,
    fontSize: 13,
  },
});
