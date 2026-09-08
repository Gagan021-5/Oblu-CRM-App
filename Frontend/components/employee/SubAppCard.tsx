import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

interface SubAppCardProps {
  type: "customers" | "leads" | "call_tracker";
  onPress: () => void;
  // Optional custom metrics
  customersCount?: number;
  followUpsCount?: number;
  leadsCount?: number;
  pipelineValue?: string;
  callsCount?: number;
  syncStatusText?: string;
}

const SubAppCardComponent: React.FC<SubAppCardProps> = ({
  type,
  onPress,
  customersCount = 128,
  followUpsCount = 7,
  leadsCount = 34,
  pipelineValue = "₹4.2L",
  callsCount = 12,
  syncStatusText = "Active • Last sync 4m ago",
}) => {
  const { colors, isDark } = useTheme();

  if (type === "call_tracker") {
    // Wide horizontal card with waveform visual
    return (
      <TouchableOpacity
        style={[
          styles.horizontalCard,
          {
            backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
            borderColor: isDark ? "#294039" : "#D8E0DC",
          },
        ]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <View style={styles.horizontalLeft}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isDark
                  ? "rgba(53, 214, 160, 0.12)"
                  : "#DDF4EA",
                borderColor: isDark
                  ? "rgba(53, 214, 160, 0.25)"
                  : "rgba(0, 168, 121, 0.25)",
              },
            ]}
          >
            <Ionicons
              name="call-outline"
              size={22}
              color={isDark ? "#35D6A0" : "#00A879"}
            />
          </View>
          <View style={styles.horizontalTexts}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
              >
                Call Tracker
              </Text>
              <View
                style={[
                  styles.liveIndicator,
                  { backgroundColor: isDark ? "#35D6A0" : "#00A879" },
                ]}
              />
            </View>
            <Text
              style={[
                styles.syncSubtext,
                { color: isDark ? "#8FA09A" : "#5E6964" },
              ]}
            >
              {syncStatusText}
            </Text>
          </View>
        </View>

        {/* Waveform graphic bars + calls count */}
        <View style={styles.horizontalRight}>
          <View style={styles.waveformContainer}>
            <View style={[styles.waveBar, { height: 10, backgroundColor: isDark ? "#35D6A0" : "#00A879" }]} />
            <View style={[styles.waveBar, { height: 22, backgroundColor: isDark ? "#20E3AD" : "#19C997" }]} />
            <View style={[styles.waveBar, { height: 16, backgroundColor: isDark ? "#35D6A0" : "#00A879" }]} />
            <View style={[styles.waveBar, { height: 28, backgroundColor: isDark ? "#B7F34A" : "#A6E22E" }]} />
            <View style={[styles.waveBar, { height: 14, backgroundColor: isDark ? "#35D6A0" : "#00A879" }]} />
            <View style={[styles.waveBar, { height: 20, backgroundColor: isDark ? "#20E3AD" : "#19C997" }]} />
          </View>

          <View style={styles.callsBadge}>
            <Text
              style={[
                styles.callsCountText,
                { color: isDark ? "#35D6A0" : "#00A879" },
              ]}
            >
              {callsCount} synced
            </Text>
            <Ionicons
              name="chevron-forward"
              size={14}
              color={isDark ? "#35D6A0" : "#00A879"}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Bento Card for Customers or Leads
  const isCustomer = type === "customers";
  const iconName = isCustomer ? "people-outline" : "trending-up-outline";
  const title = isCustomer ? "Customer Dashboard" : "Leads";
  const description = isCustomer
    ? "Manage relationships, payments and follow-ups"
    : "Track prospects and move opportunities forward";
  const primaryMetric = isCustomer
    ? `${customersCount} customers`
    : `${leadsCount} active leads`;
  const secondaryMetric = isCustomer
    ? `${followUpsCount} follow-ups due`
    : `${pipelineValue} pipeline`;

  return (
    <TouchableOpacity
      style={[
        styles.bentoCard,
        {
          backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
          borderColor: isDark ? "#294039" : "#D8E0DC",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.bentoTop}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: isDark
                ? "rgba(53, 214, 160, 0.12)"
                : "#DDF4EA",
              borderColor: isDark
                ? "rgba(53, 214, 160, 0.25)"
                : "rgba(0, 168, 121, 0.25)",
            },
          ]}
        >
          <Ionicons
            name={iconName}
            size={22}
            color={isDark ? "#35D6A0" : "#00A879"}
          />
        </View>
        <View
          style={[
            styles.arrowCircle,
            {
              backgroundColor: isDark ? "#15221D" : "#F7F9F8",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
        >
          <Ionicons
            name="arrow-forward"
            size={16}
            color={isDark ? "#35D6A0" : "#00A879"}
          />
        </View>
      </View>

      <View style={styles.bentoMiddle}>
        <Text
          style={[
            styles.cardTitle,
            { color: isDark ? "#F1F7F4" : "#101513" },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.cardDescription,
            { color: isDark ? "#8FA09A" : "#5E6964" },
          ]}
          numberOfLines={2}
        >
          {description}
        </Text>
      </View>

      <View
        style={[
          styles.bentoFooter,
          {
            borderTopColor: isDark ? "#1C2D26" : "#E8EFEB",
          },
        ]}
      >
        <View style={styles.metricItem}>
          <Text
            style={[
              styles.metricPrimaryText,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            {primaryMetric}
          </Text>
        </View>
        <View style={styles.metricDot} />
        <View style={styles.metricItem}>
          <Text
            style={[
              styles.metricSecondaryText,
              { color: isDark ? "#35D6A0" : "#00A879" },
            ]}
          >
            {secondaryMetric}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const SubAppCard = React.memo(SubAppCardComponent);

const styles = StyleSheet.create({
  bentoCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  bentoTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bentoMiddle: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: Typography.bold,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardDescription: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.regular,
    lineHeight: 18,
  },
  bentoFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metricItem: {
    flexShrink: 1,
  },
  metricPrimaryText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  metricDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#8FA09A",
    marginHorizontal: 8,
  },
  metricSecondaryText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  horizontalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  horizontalLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  horizontalTexts: {
    marginLeft: 12,
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  syncSubtext: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  horizontalRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 30,
    marginBottom: 4,
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2,
  },
  callsBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  callsCountText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
    marginRight: 2,
  },
});
