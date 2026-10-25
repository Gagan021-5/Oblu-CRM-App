import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

type Props = { visible: boolean; onClose: () => void };
const entries = [
  { title: "Dashboard", icon: "home-outline" as const, route: "/(employee)/customers/dashboard" },
  { title: "Customer Directory", icon: "people-outline" as const, route: "/(employee)/customers" },
  { title: "Payment Follow-ups", icon: "cash-outline" as const, route: "/(employee)/customers?filter=payment_pending" },
  { title: "Analytics", icon: "bar-chart-outline" as const, route: "/(employee)/customers/analytics" },
  { title: "Detailed Map", icon: "map-outline" as const, route: "/(employee)/customers/map" },
  { title: "My Incentives", icon: "wallet-outline" as const, route: "/(employee)/incentives" },
];

export function CustomerNavDrawer({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets(); const { colors, isDark } = useTheme();
  const foreground = isDark ? "#F1F7F4" : "#101827"; const muted = isDark ? "#9AA9A3" : "#637083";
  const bg = isDark ? "#0E1714" : "#FFFFFF";
  const navigate = (route: string) => { onClose(); router.push(route as never); };
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.frame}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={[styles.drawer, { backgroundColor: bg, paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.brandRow}><View style={styles.logo}><Ionicons name="paw" size={21} color="#159A7C" /></View><View style={{ flex: 1 }}><Text style={[styles.brand, { color: foreground }]}>Oblu Customer</Text><Text style={[styles.caption, { color: muted }]}>Customer workspace</Text></View><TouchableOpacity accessibilityLabel="Close menu" onPress={onClose} style={styles.close}><Ionicons name="close" size={23} color={muted} /></TouchableOpacity></View>
        <Text style={[styles.section, { color: muted }]}>WORKSPACE</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {entries.map((item, index) => <TouchableOpacity key={item.title} onPress={() => navigate(item.route)} style={[styles.entry, index === 0 && styles.entrySelected]}>
            <Ionicons name={item.icon} size={20} color={index === 0 ? "#159A7C" : muted} /><Text style={[styles.entryText, { color: index === 0 ? "#159A7C" : foreground }]}>{item.title}</Text><Ionicons name="chevron-forward" size={16} color={muted} />
          </TouchableOpacity>)}
        </ScrollView>
        <Text style={[styles.footer, { color: muted }]}>Your access follows your account permissions.</Text>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({ frame: { flex: 1, flexDirection: "row" }, scrim: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(10,20,18,0.45)" }, drawer: { width: "84%", maxWidth: 340, height: "100%", paddingHorizontal: 18, paddingBottom: 28, elevation: 16 }, brandRow: { flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#DDE5E1" }, logo: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#DDF8F0", alignItems: "center", justifyContent: "center" }, brand: { fontSize: 16, fontWeight: "800" }, caption: { fontSize: 11, marginTop: 3 }, close: { width: 38, height: 38, alignItems: "center", justifyContent: "center" }, section: { marginTop: 24, marginBottom: 9, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 }, entry: { height: 54, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 13, borderRadius: 12 }, entrySelected: { backgroundColor: "#EAF8F4" }, entryText: { flex: 1, fontSize: 14, fontWeight: "600" }, footer: { fontSize: 10, lineHeight: 15, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#DDE5E1" } });
