import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Radius } from "@/constants/theme";

export type PillVariant =
  | "paid"
  | "pending"
  | "overdue"
  | "no_payment"
  | "high_intent"
  | "medium_intent"
  | "low_intent"
  | "stage_new"
  | "stage_contacted"
  | "stage_qualified"
  | "stage_proposal"
  | "stage_won"
  | "neutral";

interface StatusPillProps {
  label: string;
  variant?: PillVariant;
  size?: "small" | "medium";
  showDot?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = "neutral",
  size = "medium",
  showDot = true,
}) => {
  const { colors, isDark } = useTheme();

  const getStyleForVariant = () => {
    switch (variant) {
      case "paid":
      case "stage_won":
        return {
          bg: isDark ? "rgba(53, 214, 160, 0.14)" : "rgba(0, 168, 121, 0.12)",
          text: isDark ? "#35D6A0" : "#00A879",
          border: isDark ? "rgba(53, 214, 160, 0.28)" : "rgba(0, 168, 121, 0.22)",
          dot: isDark ? "#35D6A0" : "#00A879",
        };
      case "high_intent":
        return {
          bg: isDark ? "rgba(53, 214, 160, 0.14)" : "rgba(0, 168, 121, 0.12)",
          text: isDark ? "#35D6A0" : "#00A879",
          border: isDark ? "rgba(53, 214, 160, 0.28)" : "rgba(0, 168, 121, 0.22)",
          dot: isDark ? "#35D6A0" : "#00A879",
        };
      case "pending":
      case "medium_intent":
      case "stage_proposal":
        return {
          bg: isDark ? "rgba(242, 184, 75, 0.14)" : "rgba(245, 158, 11, 0.12)",
          text: isDark ? "#FBBF24" : "#D97706",
          border: isDark ? "rgba(242, 184, 75, 0.28)" : "rgba(245, 158, 11, 0.25)",
          dot: isDark ? "#FBBF24" : "#D97706",
        };
      case "overdue":
        return {
          bg: isDark ? "rgba(239, 68, 68, 0.14)" : "rgba(239, 68, 68, 0.12)",
          text: isDark ? "#F87171" : "#DC2626",
          border: isDark ? "rgba(239, 68, 68, 0.28)" : "rgba(239, 68, 68, 0.25)",
          dot: isDark ? "#F87171" : "#DC2626",
        };
      case "low_intent":
      case "no_payment":
      case "stage_new":
      case "neutral":
      default:
        return {
          bg: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(16, 21, 19, 0.05)",
          text: isDark ? "#8FA09A" : "#5E6964",
          border: isDark ? "rgba(255, 255, 255, 0.10)" : "rgba(16, 21, 19, 0.10)",
          dot: isDark ? "#6E7E78" : "#87928D",
        };
    }
  };

  const current = getStyleForVariant();
  const isSmall = size === "small";

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: current.bg,
          borderColor: current.border,
          paddingHorizontal: isSmall ? 8 : 10,
          paddingVertical: isSmall ? 3 : 4,
        },
      ]}
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: current.dot,
            },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: current.text,
            fontSize: isSmall ? 11 : 12,
            fontFamily: Typography.medium,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontFamily: Typography.medium,
    textTransform: "capitalize",
    letterSpacing: 0.2,
  },
});
