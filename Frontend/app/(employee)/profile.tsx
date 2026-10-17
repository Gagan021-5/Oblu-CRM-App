import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Shadows, Spacing, Radius } from "@/constants/theme";
import { getMockCustomers, Customer } from "@/data/mockCustomers";
import { ORG_ROLES, getRoleAndUserDetails, DummyTestUser } from "@/data/rolesData";

export default function EmployeeProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, mockLogin } = useAuth();
  const { colors, isDark, mode, setMode } = useTheme();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  // Dynamic user & role lookup based on active logged-in account
  const { role, user: targetUser } = getRoleAndUserDetails(user?.username || user?.role);

  const handleSwitchRole = async (target: DummyTestUser) => {
    if (mockLogin) {
      const switched = await mockLogin(target.username);
      if (switched?.role === "admin") {
        router.replace("/(admin)/users" as any);
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out of Oblu CRM",
      "Are you sure you want to sign out? Your synchronized call logs and follow-up reminders will stay safely on the cloud.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              setLoggingOut(true);
              await logout();
              router.replace("/(auth)/login" as any);
            } catch (err) {
              setLoggingOut(false);
              Alert.alert("Error", "Could not sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const displayName = targetUser?.name || user?.username || "Employee";

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Top Navigation Bar */}
      <View
        style={[
          styles.navBar,
          {
            borderBottomColor: isDark
              ? "rgba(41, 64, 57, 0.45)"
              : "rgba(216, 224, 220, 0.7)",
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? "#121F1B" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push("/(employee)" as any);
            }
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={isDark ? "#F1F7F4" : "#101513"}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.navTitle,
            { color: isDark ? "#F1F7F4" : "#101513" },
          ]}
        >
          Employee Account
        </Text>

        <TouchableOpacity
          style={[
            styles.themeToggleBtn,
            {
              backgroundColor: isDark ? "#121F1B" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
          onPress={() => setMode(isDark ? "light" : "dark")}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isDark ? "sunny-outline" : "moon-outline"}
            size={17}
            color={isDark ? "#35D6A0" : "#00A879"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 96 },
        ]}
      >
        {/* Quick Role Tester Switcher Bar */}
        <View style={styles.roleSwitcherContainer}>
          <View style={styles.roleSwitcherHeader}>
            <View style={styles.testBadge}>
              <Ionicons name="swap-horizontal" size={12} color="#D97706" />
              <Text style={styles.testBadgeText}>ROLE SIMULATOR</Text>
            </View>
            <Text style={[styles.roleSwitcherTitle, { color: colors.textPrimary }]}>
              Switch Test Role (Org Chart)
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rolePillsRow}>
            {ORG_ROLES.map((r) => {
              const isCurrent = targetUser.username === r.users[0].username;
              return (
                <React.Fragment key={r.key}>
                  <TouchableOpacity
                    style={[
                      styles.rolePill,
                      {
                        backgroundColor: isCurrent ? r.badgeColor : (isDark ? "#121F1B" : "#FFFFFF"),
                        borderColor: isCurrent ? r.badgeColor : (isDark ? "#294039" : "#D8E0DC"),
                      },
                    ]}
                    onPress={() => handleSwitchRole(r.users[0])}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.rolePillText, { color: isCurrent ? "#FFFFFF" : (isDark ? "#F1F7F4" : "#101513") }]}>
                      {r.shortTitle}
                    </Text>
                    <Text style={[styles.rolePillSub, { color: isCurrent ? "rgba(255,255,255,0.85)" : (isDark ? "#8FA09A" : "#5E6964") }]}>
                      {r.users[0].name.split(" ")[0]}
                    </Text>
                  </TouchableOpacity>

                  {/* Sub-role pills (e.g. Satish & Naveen under Ankush / Kaushik & Rushikesh under Aman) */}
                  {r.subRole?.users.map((subU) => {
                    const isSubCurrent = targetUser.username === subU.username;
                    return (
                      <TouchableOpacity
                        key={subU.username}
                        style={[
                          styles.rolePill,
                          {
                            backgroundColor: isSubCurrent
                              ? r.subRole!.badgeColor
                              : (isDark ? "#0A1411" : "#F2FBF8"),
                            borderColor: isSubCurrent
                              ? r.subRole!.badgeColor
                              : (isDark ? "rgba(20, 184, 166, 0.45)" : "#BCEBE1"),
                          },
                        ]}
                        onPress={() => handleSwitchRole(subU)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.rolePillText, { color: isSubCurrent ? "#FFFFFF" : "#14B8A6" }]}>
                          ↳ ASM
                        </Text>
                        <Text style={[styles.rolePillSub, { color: isSubCurrent ? "rgba(255,255,255,0.85)" : (isDark ? "#8FA09A" : "#5E6964") }]}>
                          {subU.name.split(" ")[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>

        {/* Amazon-Style Profile Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
            Shadows.cardElevated,
          ]}
        >
          <View style={styles.heroTopRow}>
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: isDark ? "#1A2B25" : "#00A879",
                  borderColor: isDark ? role.badgeColor : "rgba(0, 168, 121, 0.35)",
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarInitials,
                  { color: isDark ? "#35D6A0" : "#FFFFFF" },
                ]}
              >
                {targetUser.avatarInitials}
              </Text>
            </View>

            <View style={styles.heroInfo}>
              <View style={[styles.statusPill, { backgroundColor: role.badgeColor + "20", borderColor: role.badgeColor + "55" }]}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: role.badgeColor },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: role.badgeColor },
                  ]}
                >
                  {role.shortTitle}
                </Text>
              </View>

              <Text
                style={[
                  styles.profileName,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
              >
                {targetUser.name}
              </Text>

              <Text
                style={[
                  styles.profileRole,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                {targetUser.designation}
              </Text>

              <View style={styles.empIdBadge}>
                <Ionicons
                  name="shield-checkmark"
                  size={12}
                  color={isDark ? "#35D6A0" : "#00A879"}
                />
                <Text
                  style={[
                    styles.empIdText,
                    { color: isDark ? "#35D6A0" : "#00A879" },
                  ]}
                >
                  @{targetUser.username}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View
            style={[
              styles.statsGrid,
              {
                borderTopColor: isDark
                  ? "rgba(41, 64, 57, 0.5)"
                  : "rgba(216, 224, 220, 0.8)",
              },
            ]}
          >
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => router.push("/(employee)/customers" as any)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statValue,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                {targetUser.activeAccounts}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Accounts
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.statDivider,
                {
                  backgroundColor: isDark
                    ? "rgba(41, 64, 57, 0.5)"
                    : "rgba(216, 224, 220, 0.8)",
                },
              ]}
            />

            <TouchableOpacity
              style={styles.statBox}
              onPress={() => router.push("/(employee)/leads" as any)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statValue,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                {targetUser.totalDeals}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Open Deals
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.statDivider,
                {
                  backgroundColor: isDark
                    ? "rgba(41, 64, 57, 0.5)"
                    : "rgba(216, 224, 220, 0.8)",
                },
              ]}
            />

            <View style={styles.statBox}>
              <Text
                style={[
                  styles.statValue,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                {targetUser.pipelineValue}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Pipeline
              </Text>
            </View>
          </View>
        </View>

        {/* Admin Command Center Banner (When Admin is selected or logged in) */}
        {(role.key === "admin" || user?.role === "admin") && (
          <TouchableOpacity
            style={{
              backgroundColor: isDark ? "rgba(139, 92, 246, 0.15)" : "#EDE9FE",
              borderColor: isDark ? "#8B5CF6" : "#A78BFA",
              borderWidth: 1.5,
              borderRadius: Radius.lg,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
            onPress={() => router.push("/(admin)/users" as any)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#8B5CF6",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="stats-chart" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Typography.bold, fontSize: 14, color: isDark ? "#EDE9FE" : "#5B21B6" }}>
                  Open Admin Dashboard
                </Text>
                <Text style={{ fontFamily: Typography.regular, fontSize: 12, color: isDark ? "#C4B5FD" : "#7C3AED" }}>
                  View Momentum, Leads Radar & Team Call History
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle" size={26} color="#8B5CF6" />
          </TouchableOpacity>
        )}

        {/* Yellow Box Official Permissions Section */}
        <View style={styles.yellowBoxSection}>
          <View style={styles.yellowBoxHeaderRow}>
            <View style={styles.yellowBoxTag}>
              <Ionicons name="document-text" size={13} color="#D97706" />
              <Text style={styles.yellowBoxTagText}>YELLOW BOX SPECIFICATION</Text>
            </View>
            <View
              style={[
                styles.currentRoleCapsule,
                {
                  backgroundColor: role.badgeColor + "20",
                  borderColor: role.badgeColor + "55",
                },
              ]}
            >
              <Text style={[styles.currentRoleCapsuleText, { color: role.badgeColor }]}>
                {role.shortTitle}
              </Text>
            </View>
          </View>

          <Text style={[styles.yellowBoxHeading, { color: colors.textPrimary }]}>
            Role Access & Authorized Capabilities
          </Text>
          <Text style={[styles.yellowBoxSubtitle, { color: colors.textMuted }]}>
            Below are the exact system permissions written in the flowchart yellow box for {role.shortTitle}:
          </Text>

          {/* 1. Customer Dashboard */}
          <View
            style={[
              styles.permCard,
              {
                backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
          >
            <View style={styles.permCardTop}>
              <View
                style={[
                  styles.permIconCircle,
                  {
                    backgroundColor: role.permissions.customerDashboard.enabled
                      ? "rgba(53, 214, 160, 0.15)"
                      : "rgba(255, 77, 79, 0.12)",
                  },
                ]}
              >
                <Ionicons
                  name="people"
                  size={18}
                  color={
                    role.permissions.customerDashboard.enabled
                      ? isDark
                        ? "#35D6A0"
                        : "#00A879"
                      : "#FF4D4F"
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permCardTitle, { color: colors.textPrimary }]}>
                  Customer Dashboard
                </Text>
                <Text style={[styles.permCardScope, { color: isDark ? "#35D6A0" : "#00A879" }]}>
                  Scope: {role.permissions.customerDashboard.scope}
                </Text>
              </View>
              <View
                style={[
                  styles.permStatusBadge,
                  {
                    backgroundColor: role.permissions.customerDashboard.enabled
                      ? "rgba(53, 214, 160, 0.15)"
                      : "rgba(255, 77, 79, 0.12)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.permStatusText,
                    {
                      color: role.permissions.customerDashboard.enabled
                        ? isDark
                          ? "#35D6A0"
                          : "#00A879"
                        : "#FF4D4F",
                    },
                  ]}
                >
                  {role.permissions.customerDashboard.enabled ? "AUTHORIZED" : "RESTRICTED"}
                </Text>
              </View>
            </View>

            {role.permissions.customerDashboard.features.length > 0 && (
              <View style={styles.featuresBadgeWrap}>
                {role.permissions.customerDashboard.features.map((feat) => (
                  <View
                    key={feat}
                    style={[
                      styles.featurePill,
                      {
                        backgroundColor: isDark
                          ? "rgba(53, 214, 160, 0.08)"
                          : "#E8F8F2",
                        borderColor: isDark
                          ? "rgba(53, 214, 160, 0.22)"
                          : "rgba(0, 168, 121, 0.25)",
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={11}
                      color={isDark ? "#35D6A0" : "#00A879"}
                    />
                    <Text
                      style={[
                        styles.featurePillText,
                        { color: isDark ? "#35D6A0" : "#00A879" },
                      ]}
                    >
                      {feat}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={[styles.permDescription, { color: colors.textMuted }]}>
              {role.permissions.customerDashboard.description}
            </Text>
          </View>

          {/* 2. Inventory */}
          <View
            style={[
              styles.permCard,
              {
                backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
          >
            <View style={styles.permCardTop}>
              <View
                style={[
                  styles.permIconCircle,
                  {
                    backgroundColor: role.permissions.inventory.enabled
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(120, 113, 108, 0.12)",
                  },
                ]}
              >
                <Ionicons
                  name="cube"
                  size={18}
                  color={role.permissions.inventory.enabled ? "#3B82F6" : "#78716C"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permCardTitle, { color: colors.textPrimary }]}>
                  Inventory & Stock
                </Text>
                <Text
                  style={[
                    styles.permCardScope,
                    {
                      color: role.permissions.inventory.enabled
                        ? "#3B82F6"
                        : colors.textMuted,
                    },
                  ]}
                >
                  {role.permissions.inventory.label}
                </Text>
              </View>
              <View
                style={[
                  styles.permStatusBadge,
                  {
                    backgroundColor: role.permissions.inventory.enabled
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(120, 113, 108, 0.12)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.permStatusText,
                    {
                      color: role.permissions.inventory.enabled
                        ? "#3B82F6"
                        : "#78716C",
                    },
                  ]}
                >
                  {role.permissions.inventory.enabled ? "ACTIVE" : "LOCKED"}
                </Text>
              </View>
            </View>
          </View>

          {/* 3. Incentive Call */}
          <View
            style={[
              styles.permCard,
              {
                backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
          >
            <View style={styles.permCardTop}>
              <View
                style={[
                  styles.permIconCircle,
                  {
                    backgroundColor: role.permissions.incentiveCall.enabled
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(120, 113, 108, 0.12)",
                  },
                ]}
              >
                <Ionicons
                  name="cash"
                  size={18}
                  color={
                    role.permissions.incentiveCall.enabled ? "#10B981" : "#78716C"
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permCardTitle, { color: colors.textPrimary }]}>
                  Incentive Call Reviews
                </Text>
                <Text style={[styles.permCardScope, { color: "#10B981" }]}>
                  Scope: {role.permissions.incentiveCall.scope}
                </Text>
              </View>
              <View
                style={[
                  styles.permStatusBadge,
                  {
                    backgroundColor: role.permissions.incentiveCall.enabled
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(120, 113, 108, 0.12)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.permStatusText,
                    {
                      color: role.permissions.incentiveCall.enabled
                        ? "#10B981"
                        : "#78716C",
                    },
                  ]}
                >
                  {role.permissions.incentiveCall.enabled
                    ? role.permissions.incentiveCall.scope
                    : "NOT APPLICABLE"}
                </Text>
              </View>
            </View>
          </View>

          {/* 4. Logs & Tracking */}
          <View
            style={[
              styles.permCard,
              {
                backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
          >
            <View style={styles.permCardTop}>
              <View
                style={[
                  styles.permIconCircle,
                  {
                    backgroundColor: role.permissions.logs.enabled
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(120, 113, 108, 0.12)",
                  },
                ]}
              >
                <Ionicons
                  name="list"
                  size={18}
                  color={role.permissions.logs.enabled ? "#8B5CF6" : "#78716C"}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permCardTitle, { color: colors.textPrimary }]}>
                  Audit & Logs
                </Text>
                <Text style={[styles.permCardScope, { color: "#8B5CF6" }]}>
                  {role.permissions.logs.label}
                </Text>
              </View>
              <View
                style={[
                  styles.permStatusBadge,
                  {
                    backgroundColor: role.permissions.logs.enabled
                      ? "rgba(139, 92, 246, 0.15)"
                      : "rgba(120, 113, 108, 0.12)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.permStatusText,
                    {
                      color: role.permissions.logs.enabled ? "#8B5CF6" : "#78716C",
                    },
                  ]}
                >
                  {role.permissions.logs.type}
                </Text>
              </View>
            </View>
          </View>

          {/* 5. Performa Invoice */}
          <View
            style={[
              styles.permCard,
              {
                backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
          >
            <View style={styles.permCardTop}>
              <View
                style={[
                  styles.permIconCircle,
                  { backgroundColor: "rgba(245, 158, 11, 0.15)" },
                ]}
              >
                <Ionicons name="receipt" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.permCardTitle, { color: colors.textPrimary }]}>
                  Performa Invoice
                </Text>
                <Text style={[styles.permCardScope, { color: "#F59E0B" }]}>
                  {role.permissions.performaInvoice.features.join(" • ")}
                </Text>
              </View>
              <View
                style={[
                  styles.permStatusBadge,
                  { backgroundColor: "rgba(245, 158, 11, 0.15)" },
                ]}
              >
                <Text style={[styles.permStatusText, { color: "#F59E0B" }]}>
                  AUTHORIZED
                </Text>
              </View>
            </View>
            <View style={styles.featuresBadgeWrap}>
              {role.permissions.performaInvoice.features.map((action) => (
                <View
                  key={action}
                  style={[
                    styles.featurePill,
                    {
                      backgroundColor: isDark
                        ? "rgba(245, 158, 11, 0.1)"
                        : "#FEF3C7",
                      borderColor: isDark
                        ? "rgba(245, 158, 11, 0.25)"
                        : "rgba(245, 158, 11, 0.35)",
                    },
                  ]}
                >
                  <Ionicons name="checkbox-outline" size={11} color="#D97706" />
                  <Text style={[styles.featurePillText, { color: "#D97706" }]}>
                    {action}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.permDescription, { color: colors.textMuted }]}>
              {role.permissions.performaInvoice.description}
            </Text>
          </View>

          {/* Other Members in this Role */}
          {role.users.length > 1 && (
            <View
              style={[
                styles.teamCard,
                {
                  backgroundColor: isDark ? "#0E1714" : "#F7FAF8",
                  borderColor: isDark ? "#294039" : "#D8E0DC",
                },
              ]}
            >
              <Text style={[styles.teamCardTitle, { color: colors.textSecondary }]}>
                Other Colleagues with {role.shortTitle} Role:
              </Text>
              <View style={styles.teamAvatarsRow}>
                {role.users.map((colleague) => {
                  const isActive = colleague.username === targetUser.username;
                  return (
                    <TouchableOpacity
                      key={colleague.username}
                      style={[
                        styles.colleaguePill,
                        {
                          backgroundColor: isActive
                            ? isDark
                              ? "#1F382E"
                              : "#DDF4EA"
                            : isDark
                            ? "#162520"
                            : "#FFFFFF",
                          borderColor: isActive
                            ? isDark
                              ? "#35D6A0"
                              : "#00A879"
                            : isDark
                            ? "#294039"
                            : "#D8E0DC",
                        },
                      ]}
                      onPress={() => handleSwitchRole(colleague)}
                    >
                      <Text
                        style={[
                          styles.colleagueName,
                          {
                            color: isActive
                              ? isDark
                                ? "#35D6A0"
                                : "#00A879"
                              : colors.textPrimary,
                          },
                        ]}
                      >
                        {colleague.name} {isActive ? "(Active)" : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Section: Employee & Organization Details */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            Organization & Contact
          </Text>
        </View>

        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
        >
          {/* Work Email */}
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? "rgba(53, 214, 160, 0.12)"
                    : "#DDF4EA",
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={isDark ? "#35D6A0" : "#00A879"}
              />
            </View>
            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Work Email
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
              >
                {targetUser.email}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.rowDivider,
              {
                backgroundColor: isDark
                  ? "rgba(41, 64, 57, 0.4)"
                  : "rgba(216, 224, 220, 0.6)",
              },
            ]}
          />

          {/* Official Phone */}
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? "rgba(53, 214, 160, 0.12)"
                    : "#DDF4EA",
                },
              ]}
            >
              <Ionicons
                name="call-outline"
                size={18}
                color={isDark ? "#35D6A0" : "#00A879"}
              />
            </View>
            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Work Mobile
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
              >
                +91 98765 {targetUser.username.slice(0, 5).toUpperCase()}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.rowDivider,
              {
                backgroundColor: isDark
                  ? "rgba(41, 64, 57, 0.4)"
                  : "rgba(216, 224, 220, 0.6)",
              },
            ]}
          />

          {/* Department & Territory */}
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? "rgba(53, 214, 160, 0.12)"
                    : "#DDF4EA",
                },
              ]}
            >
              <Ionicons
                name="business-outline"
                size={18}
                color={isDark ? "#35D6A0" : "#00A879"}
              />
            </View>
            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Department & Territory
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
              >
                {targetUser.department}
              </Text>
              <Text
                style={[
                  styles.infoSubtext,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                {targetUser.region}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.rowDivider,
              {
                backgroundColor: isDark
                  ? "rgba(41, 64, 57, 0.4)"
                  : "rgba(216, 224, 220, 0.6)",
              },
            ]}
          />

          {/* Reporting Line */}
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? "rgba(53, 214, 160, 0.12)"
                    : "#DDF4EA",
                },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={18}
                color={isDark ? "#35D6A0" : "#00A879"}
              />
            </View>
            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Reporting Manager
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
              >
                {targetUser.manager || "Executive Board (Direct)"}
              </Text>
            </View>
          </View>
        </View>

        {/* Section: My Assigned Customers (Amazon-style Customer Accounts Portfolio) */}
        <View style={styles.sectionHeaderWithLink}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            My Managed Customers
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(employee)/customers" as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.seeAllLink,
                { color: isDark ? "#35D6A0" : "#00A879" },
              ]}
            >
              View All 128 →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.customerList}>
          {customers.map((cust) => (
            <TouchableOpacity
              key={cust.id}
              style={[
                styles.customerCard,
                {
                  backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                  borderColor: isDark ? "#294039" : "#D8E0DC",
                },
              ]}
              onPress={() =>
                router.push(`/(employee)/customers/${cust.id}` as any)
              }
              activeOpacity={0.75}
            >
              <View style={styles.custCardLeft}>
                <View
                  style={[
                    styles.custAvatar,
                    {
                      backgroundColor: isDark
                        ? "rgba(53, 214, 160, 0.14)"
                        : "#EEF8F4",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.custAvatarText,
                      { color: isDark ? "#35D6A0" : "#00A879" },
                    ]}
                  >
                    {cust.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.custMeta}>
                  <Text
                    style={[
                      styles.custName,
                      { color: isDark ? "#F1F7F4" : "#101513" },
                    ]}
                    numberOfLines={1}
                  >
                    {cust.name}
                  </Text>
                  <Text
                    style={[
                      styles.custContact,
                      { color: isDark ? "#8FA09A" : "#5E6964" },
                    ]}
                  >
                    {cust.contactPerson} • {cust.city}
                  </Text>
                </View>
              </View>

              <View style={styles.custCardRight}>
                <View
                  style={[
                    styles.custStatusTag,
                    {
                      backgroundColor:
                        cust.status === "VIP"
                          ? isDark
                            ? "rgba(245, 166, 35, 0.15)"
                            : "#FFF8EC"
                          : isDark
                          ? "rgba(53, 214, 160, 0.15)"
                          : "#DDF4EA",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.custStatusText,
                      {
                        color:
                          cust.status === "VIP"
                            ? "#F5A623"
                            : isDark
                            ? "#35D6A0"
                            : "#00A879",
                      },
                    ]}
                  >
                    {cust.status}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isDark ? "#8FA09A" : "#5E6964"}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section: System & App Status */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            System & Sync Services
          </Text>
        </View>

        <View
          style={[
            styles.cardGroup,
            {
              backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
        >
          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? "rgba(53, 214, 160, 0.12)"
                    : "#DDF4EA",
                },
              ]}
            >
              <Ionicons
                name="notifications-outline"
                size={18}
                color={isDark ? "#35D6A0" : "#00A879"}
              />
            </View>
            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                1-Day Follow-Up Reminders
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                Enabled • Active Notification Center
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.rowDivider,
              {
                backgroundColor: isDark
                  ? "rgba(41, 64, 57, 0.4)"
                  : "rgba(216, 224, 220, 0.6)",
              },
            ]}
          />

          <View style={styles.infoRow}>
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: isDark
                    ? "rgba(53, 214, 160, 0.12)"
                    : "#DDF4EA",
                },
              ]}
            >
              <Ionicons
                name="sync-circle-outline"
                size={18}
                color={isDark ? "#35D6A0" : "#00A879"}
              />
            </View>
            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Continuous Call Logging
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                Active • 30s Heartbeat Sync
              </Text>
            </View>
          </View>
        </View>

        {/* Prominent Sign Out Section */}
        <View style={styles.signOutSection}>
          <TouchableOpacity
            style={[
              styles.signOutButton,
              {
                backgroundColor: isDark ? "rgba(255, 77, 79, 0.12)" : "#FFF1F0",
                borderColor: isDark ? "rgba(255, 77, 79, 0.35)" : "#FFA39E",
              },
            ]}
            onPress={handleSignOut}
            activeOpacity={0.8}
            disabled={loggingOut}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={isDark ? "#FF4D4F" : "#CF1322"}
            />
            <Text
              style={[
                styles.signOutText,
                { color: isDark ? "#FF4D4F" : "#CF1322" },
              ]}
            >
              {loggingOut ? "Signing Out..." : "Sign Out of Account"}
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.versionFooter,
              { color: isDark ? "#63736D" : "#8A9691" },
            ]}
          >
            Oblu Nexus CRM v2.4.0 • Enterprise Edition{"\n"}
            Logged in as {displayName}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  themeToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 24,
    fontFamily: Typography.bold,
  },
  heroInfo: {
    flex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 18,
    fontFamily: Typography.bold,
    marginBottom: 2,
  },
  profileRole: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.medium,
    marginBottom: 6,
  },
  empIdBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  empIdText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.bold,
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 12,
  },
  statBox: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 18,
    fontFamily: Typography.bold,
  },
  statLabel: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.medium,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 4,
  },
  sectionHeaderWithLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Typography.bold,
    letterSpacing: 0.2,
  },
  seeAllLink: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  cardGroup: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.medium,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.semiBold,
    marginTop: 2,
  },
  infoSubtext: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
    marginVertical: 6,
  },
  customerList: {
    gap: 10,
    marginBottom: 16,
  },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  custCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  custAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  custAvatarText: {
    fontSize: 13,
    fontFamily: Typography.bold,
  },
  custMeta: {
    flex: 1,
  },
  custName: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.semiBold,
  },
  custContact: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    marginTop: 1,
  },
  custCardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  custStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  custStatusText: {
    fontSize: 10,
    fontFamily: Typography.bold,
  },
  signOutSection: {
    marginTop: 12,
    alignItems: "center",
    gap: 12,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.bold,
  },
  versionFooter: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    textAlign: "center",
    lineHeight: 18,
  },
  roleSwitcherContainer: {
    marginBottom: 16,
  },
  roleSwitcherHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  testBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  testBadgeText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: "#D97706",
    letterSpacing: 0.5,
  },
  roleSwitcherTitle: {
    fontSize: 13,
    fontFamily: Typography.semiBold,
  },
  rolePillsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  rolePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 80,
  },
  rolePillText: {
    fontSize: 11,
    fontFamily: Typography.bold,
    letterSpacing: 0.3,
  },
  rolePillSub: {
    fontSize: 10,
    fontFamily: Typography.medium,
    marginTop: 1,
  },
  yellowBoxSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  yellowBoxHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  yellowBoxTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 5,
  },
  yellowBoxTagText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: "#D97706",
    letterSpacing: 0.6,
  },
  currentRoleCapsule: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  currentRoleCapsuleText: {
    fontSize: 11,
    fontFamily: Typography.bold,
    letterSpacing: 0.4,
  },
  yellowBoxHeading: {
    fontSize: 18,
    fontFamily: Typography.headingSemi,
    letterSpacing: -0.3,
  },
  yellowBoxSubtitle: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  permCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  permCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  permIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  permCardTitle: {
    fontSize: 14,
    fontFamily: Typography.bold,
  },
  permCardScope: {
    fontSize: 11,
    fontFamily: Typography.medium,
    marginTop: 1,
  },
  permStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  permStatusText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    letterSpacing: 0.4,
  },
  featuresBadgeWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  featurePillText: {
    fontSize: 11,
    fontFamily: Typography.semiBold,
  },
  permDescription: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    marginTop: 8,
    lineHeight: 17,
  },
  teamCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  teamCardTitle: {
    fontSize: 12,
    fontFamily: Typography.semiBold,
    marginBottom: 8,
  },
  teamAvatarsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colleaguePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  colleagueName: {
    fontSize: 11,
    fontFamily: Typography.medium,
  },
});
