/**
 * Admin — Client Directory Screen (NEXUS CRM Graphite Mint Design System)
 * Manages accounts, contacts, and customer relationships with Graphite Mint styling.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Spacing, Radius, Shadows } from "@/constants/theme";

interface ClientItem {
  id: string;
  name: string;
  contact: string;
  role: string;
  phone: string;
  industry: string;
  status: "Active" | "Evaluating" | "Contracted";
  pipelineValue: string;
}

const CLIENTS: ClientItem[] = [
  {
    id: "1",
    name: "Orion Systems",
    contact: "Marcus Vance",
    role: "VP Infrastructure",
    phone: "+1 (555) 019-2834",
    industry: "IT & Cloud",
    status: "Evaluating",
    pipelineValue: "$120,000",
  },
  {
    id: "2",
    name: "Acme Dynamics",
    contact: "Sarah Jenkins",
    role: "Head of RevOps",
    phone: "+1 (555) 392-1082",
    industry: "Enterprise SaaS",
    status: "Evaluating",
    pipelineValue: "$85,000",
  },
  {
    id: "3",
    name: "Nova Labs",
    contact: "David Chen",
    role: "Chief Compliance Officer",
    phone: "+1 (555) 441-9923",
    industry: "HealthTech AI",
    status: "Active",
    pipelineValue: "$150,000",
  },
  {
    id: "4",
    name: "Frontier Health",
    contact: "Elena Gomez",
    role: "Operations Director",
    phone: "+1 (555) 781-4209",
    industry: "Healthcare Systems",
    status: "Contracted",
    pipelineValue: "$65,000",
  },
];

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [search, setSearch] = useState("");

  const filteredClients = CLIENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.contact.toLowerCase().includes(search.toLowerCase()) ||
      c.industry.toLowerCase().includes(search.toLowerCase())
  );

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
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.screenHeading, { color: colors.textPrimary }]}>
          Client Directory
        </Text>
        <View style={{ width: 36 }} />
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
            placeholder="Search clients, contacts, or industry..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenPadding,
          paddingBottom: Math.max(insets.bottom, 16) + 90,
        }}
      >
        {filteredClients.map((client) => (
          <View
            key={client.id}
            style={[
              styles.clientCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.clientTopRow}>
              <View style={styles.clientIdentity}>
                <Text style={[styles.clientName, { color: colors.textPrimary }]}>
                  {client.name}
                </Text>
                <Text style={[styles.clientSub, { color: colors.textSecondary }]}>
                  {client.contact} · {client.role}
                </Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: colors.mintTintedSurface,
                    borderColor: colors.primaryBorder,
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: colors.primary }]}>
                  {client.status}
                </Text>
              </View>
            </View>

            <View style={[styles.cardDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.clientBottomRow}>
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                  Pipeline Value
                </Text>
                <Text style={[styles.fieldValue, { color: colors.textPrimary }]}>
                  {client.pipelineValue}
                </Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.actionIconBtn,
                    { backgroundColor: colors.secondarySurface },
                  ]}
                  onPress={() => {
                    Linking.openURL(`tel:${client.phone}`).catch(() => {
                      Alert.alert("Error", "Could not open dialer.");
                    });
                  }}
                >
                  <Ionicons name="call-outline" size={17} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionIconBtn,
                    { backgroundColor: colors.secondarySurface },
                  ]}
                  onPress={() => {
                    router.push("/(admin)/leads");
                  }}
                >
                  <Ionicons name="flash-outline" size={17} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
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
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  screenHeading: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.screenTitle,
    letterSpacing: -0.2,
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
  clientCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    ...Shadows.card,
  },
  clientTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  clientIdentity: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    fontFamily: Typography.headingSemi,
    fontSize: 17,
  },
  clientSub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.caption,
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  clientBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.micro,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  fieldValue: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.body,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
});
