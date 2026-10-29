import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Line, Rect, Text as SvgText } from "react-native-svg";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, hasRole } from "@/services/permissionService";
import { Typography } from "@/constants/theme";
import { Customer } from "@/data/customerTypes";
import { fetchCustomerMapPointsFromApi } from "@/services/customerService";

type DistrictCluster = {
  district: string;
  state: string;
  lat: number;
  lon: number;
  count: number;
  customers: Customer[];
};

// India Geographic Bounding Box
const MIN_LON = 68.0;
const MAX_LON = 97.5;
const MIN_LAT = 8.0;
const MAX_LAT = 37.0;

export default function CustomerMapScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, permissionProfile } = useAuth();
  const username = (permissionProfile?.user.username || user?.username || "").toLowerCase();
  const role = `${user?.role || ""} ${permissionProfile?.user.role || ""}`.toLowerCase();
  const isRsm = hasRole(permissionProfile, "rsm") || role.includes("rsm") || role.includes("regional sales manager");
  const canOpen = hasPermission(permissionProfile, "customer.view_all") && !isRsm && username !== "bhavya_bhardwaj" && username !== "bhavya";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<DistrictCluster | null>(null);

  const load = useCallback(async () => {
    if (!canOpen) return;
    setError("");
    try {
      const data = await fetchCustomerMapPointsFromApi();
      setCustomers(data);
    } catch (err: any) {
      const status = err?.response?.status;
      console.warn("[CustomerMap] Map API request failed:", status ? `HTTP ${status}` : err?.message || "Network error");
      setCustomers([]);
      setError("Customer locations could not be loaded from the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [canOpen]);

  useEffect(() => {
    if (!canOpen) {
      router.replace("/(employee)/customers/dashboard");
      return;
    }
    void load();
  }, [canOpen, load]);

  const foreground = isDark ? "#F1F7F4" : "#101827";
  const muted = isDark ? "#9AA9A3" : "#637083";
  const card = { backgroundColor: isDark ? "#111B18" : "#FFFFFF", borderColor: isDark ? "#263A32" : "#E4EAF0" };

  const locatedCustomers = useMemo(() => {
    return customers.filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
  }, [customers]);

  // Aggregate into district clusters matching detailed_map.html
  const districtClusters = useMemo<DistrictCluster[]>(() => {
    const map = new Map<string, DistrictCluster>();
    for (const c of locatedCustomers) {
      const dist = (c.district || c.city || "Unknown").trim();
      const state = ((c as any).state || "").trim();
      const key = `${dist}__${state}`.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.customers.push(c);
      } else {
        map.set(key, {
          district: dist,
          state: state,
          lat: Number(c.latitude),
          lon: Number(c.longitude),
          count: 1,
          customers: [c],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [locatedCustomers]);

  const filteredClusters = useMemo(() => {
    if (!searchQuery.trim()) return districtClusters;
    const q = searchQuery.toLowerCase().trim();
    return districtClusters.filter(
      (dc) =>
        dc.district.toLowerCase().includes(q) ||
        dc.state.toLowerCase().includes(q) ||
        dc.customers.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [districtClusters, searchQuery]);

  const screenWidth = Dimensions.get("window").width;
  const mapWidth = Math.max(300, screenWidth - 36);
  const mapHeight = 380;

  // Projection formulas
  const projectX = (lon: number) => {
    const clamped = Math.max(MIN_LON, Math.min(MAX_LON, lon));
    return ((clamped - MIN_LON) / (MAX_LON - MIN_LON)) * (mapWidth - 40) + 20;
  };

  const projectY = (lat: number) => {
    const clamped = Math.max(MIN_LAT, Math.min(MAX_LAT, lat));
    return ((MAX_LAT - clamped) / (MAX_LAT - MIN_LAT)) * (mapHeight - 50) + 25;
  };

  const openMapApp = async (lat: number, lon: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
  };

  if (!canOpen) return null;

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: 110 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <View style={styles.top}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.back, card]}>
            <Ionicons name="arrow-back" size={20} color={foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>CUSTOMERS</Text>
            <Text style={[styles.title, { color: foreground }]}>Detailed Map</Text>
          </View>
        </View>

        {error ? (
          <TouchableOpacity onPress={() => { setLoading(true); void load(); }} style={[styles.banner, { backgroundColor: isDark ? "#33251A" : "#FFF4E5" }]}>
            <Text style={{ color: foreground, fontFamily: Typography.regular }}>{error} Tap to retry.</Text>
          </TouchableOpacity>
        ) : null}

        {/* Top Summary Banner */}
        <View style={[styles.banner, { backgroundColor: "#0E9E83" }]}>
          <Ionicons name="map" size={24} color="white" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Customer Distribution Map (District-Level)</Text>
            <Text style={styles.bannerSub}>
              {locatedCustomers.length} accounts mapped across {districtClusters.length} districts in India
            </Text>
          </View>
        </View>

        {/* Search District / Client */}
        <View style={[styles.searchBox, card]}>
          <Ionicons name="search-outline" size={18} color="#159A7C" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search district, state, or client name…"
            placeholderTextColor={muted}
            style={[styles.searchInput, { color: foreground }]}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Interactive Marked Map Container */}
        <View style={[styles.mapContainer, card]}>
          <View style={styles.mapHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={styles.mapDotLive} />
              <Text style={[styles.mapHeaderTitle, { color: foreground }]}>India Geographic Plot</Text>
            </View>
            <Text style={[styles.mapHeaderHint, { color: muted }]}>Tap pin for details</Text>
          </View>

          {loading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator color="#20B99A" size="large" />
              <Text style={{ color: muted, marginTop: 8, fontSize: 12 }}>Loading coordinates…</Text>
            </View>
          ) : (
            <View style={[styles.canvasWrapper, { backgroundColor: isDark ? "#0A100E" : "#F1F5F9" }]}>
              <Svg width={mapWidth} height={mapHeight}>
                {/* Geographic Grid Lines */}
                {[0.25, 0.5, 0.75].map((factor, i) => (
                  <Line
                    key={`h-${i}`}
                    x1="10"
                    y1={mapHeight * factor}
                    x2={mapWidth - 10}
                    y2={mapHeight * factor}
                    stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}
                {[0.25, 0.5, 0.75].map((factor, i) => (
                  <Line
                    key={`v-${i}`}
                    x1={mapWidth * factor}
                    y1="10"
                    x2={mapWidth * factor}
                    y2={mapHeight - 10}
                    stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {/* Plot District Pins */}
                {districtClusters.map((dc) => {
                  const cx = projectX(dc.lon);
                  const cy = projectY(dc.lat);
                  const isSelected = selectedCluster?.district === dc.district;
                  const radius = Math.min(22, Math.max(9, Math.sqrt(dc.count) * 4.5));

                  return (
                    <G key={`${dc.district}-${dc.state}`}>
                      {/* Pulse Ring for Selected / Dense clusters */}
                      {(isSelected || dc.count > 5) && (
                        <Circle
                          cx={cx}
                          cy={cy}
                          r={radius + (isSelected ? 7 : 4)}
                          fill={isSelected ? "rgba(32, 185, 154, 0.3)" : "rgba(14, 165, 233, 0.18)"}
                        />
                      )}

                      {/* Main District Bubble */}
                      <Circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={isSelected ? "#20B99A" : dc.count > 10 ? "#0EA5E9" : dc.count > 3 ? "#6366F1" : "#159A7C"}
                        stroke={isDark ? "#0A100E" : "#FFFFFF"}
                        strokeWidth={isSelected ? 3 : 1.5}
                        opacity={0.92}
                      />

                      {/* Customer Count Number Inside Marker */}
                      <SvgText
                        x={cx}
                        y={cy + 3.5}
                        fontSize={radius > 12 ? "10" : "8"}
                        fontWeight="bold"
                        fill="#FFFFFF"
                        textAnchor="middle"
                      >
                        {dc.count}
                      </SvgText>
                    </G>
                  );
                })}
              </Svg>

              {/* Touch Overlay Buttons for exact pin targeting */}
              {districtClusters.map((dc) => {
                const cx = projectX(dc.lon);
                const cy = projectY(dc.lat);
                const radius = Math.min(22, Math.max(9, Math.sqrt(dc.count) * 4.5));
                const touchSize = Math.max(34, radius * 2);

                return (
                  <TouchableOpacity
                    key={`touch-${dc.district}-${dc.state}`}
                    style={[
                      styles.touchTarget,
                      {
                        left: cx - touchSize / 2,
                        top: cy - touchSize / 2,
                        width: touchSize,
                        height: touchSize,
                      },
                    ]}
                    onPress={() => setSelectedCluster(dc)}
                    activeOpacity={0.7}
                  />
                );
              })}
            </View>
          )}

          {/* Interactive Legend */}
          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#159A7C" }]} />
              <Text style={[styles.legendText, { color: muted }]}>1-3 Accounts</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#6366F1" }]} />
              <Text style={[styles.legendText, { color: muted }]}>4-10 Accounts</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#0EA5E9" }]} />
              <Text style={[styles.legendText, { color: muted }]}>10+ Cluster</Text>
            </View>
          </View>
        </View>

        {/* Selected District Inspector Card */}
        {selectedCluster ? (
          <View style={[styles.selectedCard, card]}>
            <View style={styles.selectedHeader}>
              <View style={styles.selectedAvatar}>
                <Ionicons name="location" size={20} color="#159A7C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.selectedTitle, { color: foreground }]}>
                  {selectedCluster.district}, {selectedCluster.state}
                </Text>
                <Text style={[styles.selectedSub, { color: muted }]}>
                  {selectedCluster.count} {selectedCluster.count === 1 ? "customer account" : "customer accounts"} in this district
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedCluster(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color={muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.customerList}>
              {selectedCluster.customers.map((c) => (
                <TouchableOpacity
                  key={`sel-cust-${c.id}`}
                  style={[styles.customerItem, { borderColor: card.borderColor }]}
                  onPress={() => router.push(`/(employee)/customers/${c.id}` as any)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.custName, { color: foreground }]}>{c.name}</Text>
                    {c.assignedSalesperson ? (
                      <Text style={[styles.custMeta, { color: muted }]}>SP: {c.assignedSalesperson}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={muted} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.openMapsBtn}
              onPress={() => openMapApp(selectedCluster.lat, selectedCluster.lon)}
            >
              <Ionicons name="navigate-outline" size={16} color="white" />
              <Text style={styles.openMapsBtnText}>Open {selectedCluster.district} in Google Maps</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* District Directory Listing */}
        <View style={styles.directorySection}>
          <Text style={[styles.sectionTitle, { color: foreground }]}>
            All Districts ({filteredClusters.length})
          </Text>

          {filteredClusters.map((dc) => (
            <TouchableOpacity
              key={`dir-${dc.district}-${dc.state}`}
              style={[styles.districtRow, card]}
              onPress={() => setSelectedCluster(dc)}
              activeOpacity={0.75}
            >
              <View style={[styles.badgeCount, { backgroundColor: isDark ? "rgba(32, 185, 154, 0.15)" : "#E2F7F1" }]}>
                <Text style={{ color: "#159A7C", fontFamily: Typography.bold, fontSize: 13 }}>{dc.count}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.distName, { color: foreground }]}>
                  {dc.district}
                </Text>
                <Text style={[styles.distState, { color: muted }]}>{dc.state || "India"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, gap: 14 },
  top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  back: { borderWidth: 1, width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#20B99A", fontFamily: Typography.bold, fontSize: 10, letterSpacing: 1 },
  title: { fontFamily: Typography.heading, fontSize: 24, marginTop: 2 },
  banner: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16 },
  bannerTitle: { color: "white", fontFamily: Typography.headingSemi, fontSize: 15 },
  bannerSub: { color: "#D9FFF5", fontFamily: Typography.regular, fontSize: 11, marginTop: 3 },
  searchBox: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, minHeight: 46, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, fontFamily: Typography.regular, fontSize: 13, paddingVertical: 8 },
  mapContainer: { borderWidth: 1, borderRadius: 18, overflow: "hidden" },
  mapHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  mapDotLive: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#20B99A" },
  mapHeaderTitle: { fontFamily: Typography.semiBold, fontSize: 13 },
  mapHeaderHint: { fontFamily: Typography.regular, fontSize: 11 },
  mapLoading: { height: 320, alignItems: "center", justifyContent: "center" },
  canvasWrapper: { position: "relative", alignItems: "center", justifyContent: "center" },
  touchTarget: { position: "absolute", zIndex: 10 },
  mapLegend: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#E2E8F0" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontFamily: Typography.regular, fontSize: 11 },
  selectedCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 12 },
  selectedHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  selectedAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#E2F7F1", alignItems: "center", justifyContent: "center" },
  selectedTitle: { fontFamily: Typography.headingSemi, fontSize: 16 },
  selectedSub: { fontFamily: Typography.regular, fontSize: 12, marginTop: 2 },
  customerList: { gap: 8, maxHeight: 180 },
  customerItem: { borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  custName: { fontFamily: Typography.semiBold, fontSize: 13 },
  custMeta: { fontFamily: Typography.regular, fontSize: 11, marginTop: 2 },
  openMapsBtn: { backgroundColor: "#159A7C", borderRadius: 12, paddingVertical: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  openMapsBtnText: { color: "white", fontFamily: Typography.semiBold, fontSize: 13 },
  directorySection: { gap: 10, marginTop: 4 },
  sectionTitle: { fontFamily: Typography.headingSemi, fontSize: 16 },
  districtRow: { borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  badgeCount: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  distName: { fontFamily: Typography.semiBold, fontSize: 13 },
  distState: { fontFamily: Typography.regular, fontSize: 11, marginTop: 2 },
});
