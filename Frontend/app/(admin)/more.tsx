/**
 * Admin — More & Settings Screen (NEXUS CRM Graphite Mint Design System)
 * Includes persistent Light / Dark / System theme switcher, profile info, and navigation links.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Typography, FontSizes, Spacing, Radius, Shadows } from "@/constants/theme";

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { mode, isDark, colors, setMode } = useTheme();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const themeModes: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "system", label: "System", icon: "phone-portrait-outline" },
    { key: "light", label: "Light", icon: "sunny-outline" },
    { key: "dark", label: "Dark", icon: "moon-outline" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.headerRow,
          {
            paddingTop: Math.max(insets.top, 14),
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <Text style={[styles.screenHeading, { color: colors.textPrimary }]}>
          Settings & Hub
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenPadding,
          paddingTop: Spacing.md,
          paddingBottom: Math.max(insets.bottom, 16) + 90, // Leave room for floating dock
        }}
      >
        {/* User Card */}
        <View
          style={[
            styles.userCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.avatarLarge,
              { backgroundColor: colors.mintTintedSurface },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.username ? user.username.substring(0, 2).toUpperCase() : "AD"}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.username || "Admin"}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]}>
              {user?.username ? `${user.username.toLowerCase()}@nexus.io` : "admin@nexus.io"}
            </Text>
            <View
              style={[
                styles.rolePill,
                { backgroundColor: colors.secondarySurface, borderColor: colors.borderLight },
              ]}
            >
              <Text style={[styles.roleText, { color: colors.primary }]}>
                {user?.role === "admin" ? "Sales Director" : "Account Executive"}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Theme Mode Switcher ──────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            APPEARANCE & THEME
          </Text>
        </View>

        <View
          style={[
            styles.themeCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.themeRow}>
            {themeModes.map((item) => {
              const isSelected = mode === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.75}
                  onPress={() => setMode(item.key)}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: isSelected
                        ? colors.mintTintedSurface
                        : colors.secondarySurface,
                      borderColor: isSelected
                        ? colors.primaryBorder
                        : colors.borderLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.themeBtnText,
                      {
                        color: isSelected ? colors.primary : colors.textSecondary,
                        fontFamily: isSelected ? Typography.semiBold : Typography.regular,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Hub Links ────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            CRM CAPABILITIES
          </Text>
        </View>

        <View
          style={[
            styles.menuList,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => router.push("/(admin)/leads")}
          >
            <View
              style={[
                styles.menuIconBox,
                { backgroundColor: colors.mintTintedSurface },
              ]}
            >
              <Ionicons name="flash" size={18} color={colors.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                Lead Signals & Radar
              </Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                AI scoring & buying intent
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
            onPress={() => router.push("/(admin)/customers")}
          >
            <View
              style={[
                styles.menuIconBox,
                { backgroundColor: colors.secondarySurface },
              ]}
            >
              <Ionicons name="people" size={18} color={colors.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                Client Directory
              </Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                Manage company relationships
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(admin)/stats")}
          >
            <View
              style={[
                styles.menuIconBox,
                { backgroundColor: colors.secondarySurface },
              ]}
            >
              <Ionicons name="stats-chart" size={18} color={colors.primary} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>
                Analytics & Reports
              </Text>
              <Text style={[styles.menuSub, { color: colors.textMuted }]}>
                Performance trends & charts
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Sign Out Button ──────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSignOut}
          style={[
            styles.signOutBtn,
            {
              backgroundColor: colors.secondarySurface,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.signOutText, { color: colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  screenHeading: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.screenTitle,
    letterSpacing: -0.2,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: 14,
    ...Shadows.card,
  },
  avatarLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: Typography.bold,
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontFamily: Typography.headingSemi,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  userEmail: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
  },
  rolePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 4,
  },
  roleText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.caption,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.caption,
    letterSpacing: 0.6,
  },
  themeCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 8,
    marginBottom: 20,
    ...Shadows.card,
  },
  themeRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  themeBtnText: {
    fontSize: FontSizes.label,
  },
  menuList: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 24,
    ...Shadows.card,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  menuInfo: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.body,
  },
  menuSub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },
  signOutBtn: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  signOutText: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.button,
  },
});
