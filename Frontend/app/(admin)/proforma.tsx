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

interface ProformaItem {
  id: string;
  piNumber: string;
  clientName: string;
  amount: string;
  gstAmount: string;
  date: string;
  rep: string;
  status: "Approved" | "Pending" | "Billed";
}

const INITIAL_PROFORMAS: ProformaItem[] = [
  { id: "1", piNumber: "PI-2026-0891", clientName: "Apex Dental Multispeciality", amount: "₹1,84,000", gstAmount: "₹33,120 (18%)", date: "22 Oct 2026", rep: "Gagan Sharma", status: "Approved" },
  { id: "2", piNumber: "PI-2026-0892", clientName: "Care & Cure Maxillofacial Clinic", amount: "₹92,500", gstAmount: "₹16,650 (18%)", date: "21 Oct 2026", rep: "Bhavya Bhardwaj", status: "Pending" },
  { id: "3", piNumber: "PI-2026-0888", clientName: "Shanti Memorial Hospital", amount: "₹4,12,000", gstAmount: "₹74,160 (18%)", date: "20 Oct 2026", rep: "Vivek Kumar", status: "Billed" },
  { id: "4", piNumber: "PI-2026-0885", clientName: "Elite Implantology Institute", amount: "₹2,45,000", gstAmount: "₹44,100 (18%)", date: "19 Oct 2026", rep: "Gagan Sharma", status: "Approved" },
  { id: "5", piNumber: "PI-2026-0881", clientName: "Dr. Bansal Ortho & Dental Care", amount: "₹68,000", gstAmount: "₹12,240 (18%)", date: "18 Oct 2026", rep: "Anshika Verma", status: "Pending" },
];

export default function ProformaScreen() {
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
    return INITIAL_PROFORMAS.filter((item) => {
      const matchSearch =
        searchQuery === "" ||
        item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.piNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.rep.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFilter =
        activeFilter === "all" ||
        (activeFilter === "approved" && item.status === "Approved") ||
        (activeFilter === "pending" && item.status === "Pending") ||
        (activeFilter === "billed" && item.status === "Billed");

      return matchSearch && matchFilter;
    });
  }, [searchQuery, activeFilter]);

  const counts = useMemo(() => {
    const total = INITIAL_PROFORMAS.length;
    const approved = INITIAL_PROFORMAS.filter((i) => i.status === "Approved").length;
    const pending = INITIAL_PROFORMAS.filter((i) => i.status === "Pending").length;
    const billed = INITIAL_PROFORMAS.filter((i) => i.status === "Billed").length;
    return { total, approved, pending, billed };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
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
            Proforma & Quotations
          </Text>
          <Text style={[styles.screenSub, { color: colors.textSecondary }]}>
            Pricing approvals & auto-GST billing
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
            <View style={styles.searchWrapper}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search proforma by client, PI# or sales rep..."
                onClear={() => setSearchQuery("")}
              />
            </View>

            <View style={styles.metricsRow}>
              <MetricCard
                label="Quotations Pipeline"
                value="₹14.8L"
                subValue="5 active drafts"
                icon="document-text-outline"
              />
              <MetricCard
                label="Pending Approvals"
                value="2"
                subValue="rate clearance"
                icon="time-outline"
                isHighlight
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <FilterChip
                label="All Quotations"
                count={counts.total}
                isActive={activeFilter === "all"}
                onPress={() => setActiveFilter("all")}
              />
              <FilterChip
                label="Approved"
                count={counts.approved}
                isActive={activeFilter === "approved"}
                onPress={() => setActiveFilter("approved")}
              />
              <FilterChip
                label="Pending"
                count={counts.pending}
                isActive={activeFilter === "pending"}
                onPress={() => setActiveFilter("pending")}
              />
              <FilterChip
                label="Billed"
                count={counts.billed}
                isActive={activeFilter === "billed"}
                onPress={() => setActiveFilter("billed")}
              />
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => {
          const pillVariant =
            item.status === "Approved"
              ? "paid"
              : item.status === "Pending"
              ? "pending"
              : "neutral";

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
                        item.status === "Approved"
                          ? isDark ? "rgba(53, 214, 160, 0.14)" : "rgba(0, 168, 121, 0.12)"
                          : item.status === "Pending"
                          ? isDark ? "rgba(245, 158, 11, 0.14)" : "rgba(245, 158, 11, 0.12)"
                          : isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(16, 21, 19, 0.05)",
                    },
                  ]}
                >
                  <Ionicons
                    name="document-text"
                    size={18}
                    color={
                      item.status === "Approved"
                        ? isDark ? "#35D6A0" : "#00A879"
                        : item.status === "Pending"
                        ? "#D97706"
                        : isDark ? "#8FA09A" : "#5E6964"
                    }
                  />
                </View>

                <View style={styles.itemIdentity}>
                  <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.clientName}
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                    {item.piNumber} • {item.date} • {item.rep}
                  </Text>
                </View>

                <StatusPill label={item.status} variant={pillVariant as any} size="small" />
              </View>

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
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>TOTAL INVOICED</Text>
                  <Text style={[styles.metaValueHighlight, { color: isDark ? "#35D6A0" : "#00A879" }]}>
                    {item.amount}
                  </Text>
                </View>
                <View style={[styles.metaDivider, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(16, 21, 19, 0.08)" }]} />
                <View style={styles.metaCol}>
                  <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>TAX / GST</Text>
                  <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                    {item.gstAmount}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />

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
});
