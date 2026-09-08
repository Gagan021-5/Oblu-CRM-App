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
import { mockEmployee } from "@/data/mockEmployee";
import { getMockCustomers, Customer } from "@/data/mockCustomers";

export default function EmployeeProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors, isDark, mode, setMode } = useTheme();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    getMockCustomers(0).then((data) => {
      setCustomers(data.slice(0, 4)); // Top 4 key assigned accounts
    });
  }, []);

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

  const displayName = user?.username ? user.username : mockEmployee.name;

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
                  borderColor: isDark ? "#35D6A0" : "rgba(0, 168, 121, 0.35)",
                },
              ]}
            >
              <Text
                style={[
                  styles.avatarInitials,
                  { color: isDark ? "#35D6A0" : "#FFFFFF" },
                ]}
              >
                {mockEmployee.avatarInitials}
              </Text>
            </View>

            <View style={styles.heroInfo}>
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isDark ? "#35D6A0" : "#00A879" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: isDark ? "#35D6A0" : "#00A879" },
                  ]}
                >
                  ACTIVE SALES ACCOUNT
                </Text>
              </View>

              <Text
                style={[
                  styles.profileName,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
              >
                {displayName}
              </Text>

              <Text
                style={[
                  styles.profileRole,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                {mockEmployee.designation}
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
                  {mockEmployee.id}
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
                {mockEmployee.activeAccounts}
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
                {mockEmployee.totalDeals}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Open Leads
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
              onPress={() =>
                router.push({
                  pathname: "/(user)/status",
                  params: { from: "workspace" },
                } as any)
              }
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.statValue,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                12
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                Calls Synced
              </Text>
            </TouchableOpacity>
          </View>
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
                {mockEmployee.email}
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
                {mockEmployee.phone}
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
                {mockEmployee.department}
              </Text>
              <Text
                style={[
                  styles.infoSubtext,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                {mockEmployee.region} • {mockEmployee.location}
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
                {mockEmployee.manager}
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
});
