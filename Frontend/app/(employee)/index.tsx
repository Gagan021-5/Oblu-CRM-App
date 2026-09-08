import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Spacing } from "@/constants/theme";
import { WorkspaceHeader } from "@/components/employee/WorkspaceHeader";
import { SubAppCard } from "@/components/employee/SubAppCard";
import { MetricCard } from "@/components/employee/MetricCard";
import { TimelineItem } from "@/components/employee/TimelineItem";

export default function EmployeeHomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 600));
    setRefreshing(false);
  }, []);

  const handleProfilePress = () => {
    router.push("/(employee)/profile" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 96 }, // Extra space for Floating Dock
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? "#35D6A0" : "#00A879"}
            colors={[isDark ? "#35D6A0" : "#00A879"]}
          />
        }
      >
        {/* Workspace Header */}
        <WorkspaceHeader
          onProfilePress={handleProfilePress}
        />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text
            style={[
              styles.heroHeading,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            Let’s build momentum.
          </Text>
          <Text
            style={[
              styles.heroSubheading,
              { color: isDark ? "#8FA09A" : "#5E6964" },
            ]}
          >
            Here is your sales operating summary for today.
          </Text>
        </View>

        {/* Bento Sub-App Launcher */}
        <View style={styles.bentoSection}>
          {/* Customer Dashboard & Leads Bento Cards */}
          <SubAppCard
            type="customers"
            onPress={() => router.replace("/(employee)/customers" as any)}
            customersCount={128}
            followUpsCount={7}
          />

          <SubAppCard
            type="leads"
            onPress={() => router.replace("/(employee)/leads" as any)}
            leadsCount={34}
            pipelineValue="₹4.2L"
          />

          {/* Call Tracker Horizontal Wide Card */}
          <SubAppCard
            type="call_tracker"
            onPress={() =>
              router.replace({ pathname: "/(user)/status", params: { from: "workspace" } } as any)
            }
            callsCount={12}
            syncStatusText="Active • 12 calls synced today"
          />
        </View>

        {/* Momentum Section */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            Momentum Metrics
          </Text>
          <Text
            style={[
              styles.sectionTag,
              { color: isDark ? "#35D6A0" : "#00A879" },
            ]}
          >
            Today's Pace
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <MetricCard
              label="Calls Logged"
              value="12"
              subValue="4 outbound"
              icon="call-outline"
            />
            <MetricCard
              label="Follow-ups"
              value="7"
              subValue="3 completed"
              icon="calendar-outline"
              isHighlight
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              label="New Leads"
              value="5"
              subValue="+2 from web"
              icon="trending-up-outline"
            />
            <MetricCard
              label="Pipeline Value"
              value="₹4.2L"
              subValue="8 high intent"
              icon="cash-outline"
              isHighlight
            />
          </View>
        </View>

        {/* Today Section — Timeline */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            Today's Schedule
          </Text>
          <Text
            style={[
              styles.sectionTag,
              { color: isDark ? "#8FA09A" : "#5E6964" },
            ]}
          >
            4 Tasks
          </Text>
        </View>

        <View
          style={[
            styles.timelineBox,
            {
              backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
        >
          <TimelineItem
            time="11:30 AM"
            title="Follow up with Orion Systems"
            subtitle="Contract review & revised commercial quote with Vikram"
            tag="Follow-up due"
            type="followup"
            onPress={() => router.push("/(employee)/customers/cust-001" as any)}
          />

          <TimelineItem
            time="02:00 PM"
            title="Call Nova Labs Diagnostics"
            subtitle="Payment clearance confirmation with Dr. Sameer Sen"
            tag="Overdue recovery"
            type="call"
            onPress={() => router.push("/(employee)/customers/cust-002" as any)}
          />

          <TimelineItem
            time="03:30 PM"
            title="Payment reminder for Acme Corporation"
            subtitle="Check invoice INV-2026-902 status with Rohan Mehta"
            tag="Invoice due"
            type="payment"
            onPress={() => router.push("/(employee)/customers/cust-003" as any)}
          />

          <TimelineItem
            time="05:30 PM"
            title="Lead demo with Frontier Health"
            subtitle="Product capability walkthrough with Pooja Verma"
            tag="VIP Prospect"
            type="demo"
            isLast
            onPress={() => router.push("/(employee)/customers/cust-004" as any)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  heroSection: {
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  heroHeading: {
    fontSize: 28,
    fontFamily: Typography.bold,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  heroSubheading: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.regular,
    marginTop: 4,
  },
  bentoSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: FontSizes.sectionTitle,
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
  },
  sectionTag: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  metricsGrid: {
    gap: 10,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  timelineBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 4,
  },
});
