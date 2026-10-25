import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Customer } from "@/data/mockCustomers";
import { fetchCustomersFromApi } from "@/services/customerService";

export default function CustomerMapScreen() {
  const insets = useSafeAreaInsets(); const { colors, isDark } = useTheme();
  const [customers, setCustomers] = useState<Customer[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => { setCustomers(await fetchCustomersFromApi({ page_size: 200 })); setLoading(false); setRefreshing(false); }, []);
  useEffect(() => { void load(); }, [load]);
  const foreground = isDark ? "#F1F7F4" : "#101827"; const muted = isDark ? "#9AA9A3" : "#637083"; const card = { backgroundColor: isDark ? "#111B18" : "#FFFFFF", borderColor: isDark ? "#263A32" : "#E4EAF0" };
  const located = customers.filter((c) => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
  const openMap = async (customer: Customer) => { if (customer.latitude == null || customer.longitude == null) return; const url = `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`; if (await Linking.canOpenURL(url)) await Linking.openURL(url); };
  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 8, paddingBottom: 110 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.top}><TouchableOpacity onPress={() => router.back()} style={[styles.back, card]}><Ionicons name="arrow-back" size={20} color={foreground} /></TouchableOpacity><View><Text style={styles.eyebrow}>CUSTOMERS</Text><Text style={[styles.title, { color: foreground }]}>Detailed Map</Text></View></View>
    <View style={[styles.banner, { backgroundColor: "#0E9E83" }]}><Ionicons name="map" size={22} color="white"/><View style={{ flex: 1 }}><Text style={styles.bannerTitle}>{located.length} customers with coordinates</Text><Text style={styles.bannerSub}>Tap a customer to open the location in your map app.</Text></View></View>
    {loading ? <ActivityIndicator color="#20B99A" /> : customers.map((customer) => <TouchableOpacity key={customer.id} onPress={() => openMap(customer)} disabled={customer.latitude == null || customer.longitude == null} style={[styles.row, card]}><View style={styles.pin}><Ionicons name="location" size={18} color="#159A7C" /></View><View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.name, { color: foreground }]}>{customer.name}</Text><Text style={[styles.location, { color: muted }]}>{[customer.city, (customer as any).state].filter(Boolean).join(", ") || "Location not available"}</Text></View><Ionicons name={customer.latitude != null && customer.longitude != null ? "navigate" : "location-outline"} size={18} color={customer.latitude != null && customer.longitude != null ? "#159A7C" : muted}/></TouchableOpacity>)}
    {!loading && customers.length === 0 ? <Text style={{ color: muted }}>No customer records are available for your account.</Text> : null}
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 18, gap: 12 }, top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 }, back: { borderWidth: 1, width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" }, eyebrow: { color: "#20B99A", fontSize: 10, fontWeight: "800", letterSpacing: 1 }, title: { fontSize: 25, fontWeight: "800", marginTop: 3 }, banner: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, padding: 16, marginBottom: 4 }, bannerTitle: { color: "white", fontWeight: "800", fontSize: 15 }, bannerSub: { color: "#D9FFF5", fontSize: 11, marginTop: 3 }, row: { borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 11, minHeight: 66 }, pin: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#DDF8F0", alignItems: "center", justifyContent: "center" }, name: { fontSize: 13, fontWeight: "700" }, location: { fontSize: 11, marginTop: 3 } });
