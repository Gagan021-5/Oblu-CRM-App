import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

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
}

export const StatusPill: React.FC<StatusPillProps> = ({
  label,
  variant = "neutral",
  size = "medium",
}) => {
  const { colors, isDark } = useTheme();

  const getStyleForVariant = () => {
    switch (variant) {
      case "paid":
      case "stage_won":
        return {
          bg: isDark ? "rgba(53, 214, 160, 0.14)" : "#DDF4EA",
          text: isDark ? "#35D6A0" : "#00A879",
          border: isDark ? "rgba(53, 214, 160, 0.28)" : "rgba(0, 168, 121, 0.22)",
        };
      case "high_intent":
        return {
          bg: isDark ? "rgba(183, 243, 74, 0.12)" : "rgba(166, 226, 46, 0.16)",
          text: isDark ? "#B7F34A" : "#2E7D32",
          border: isDark ? "rgba(183, 243, 74, 0.3)" : "rgba(166, 226, 46, 0.35)",
        };
      case "pending":
      case "medium_intent":
      case "stage_proposal":
        return {
          bg: isDark ? "rgba(242, 184, 75, 0.14)" : "rgba(228, 155, 49, 0.12)",
          text: isDark ? "#F2B84B" : "#C97A1E",
          border: isDark ? "rgba(242, 184, 75, 0.28)" : "rgba(228, 155, 49, 0.25)",
        };
      case "overdue":
        return {
          bg: isDark ? "rgba(255, 107, 107, 0.14)" : "rgba(216, 74, 74, 0.12)",
          text: isDark ? "#FF6B6B" : "#D84A4A",
          border: isDark ? "rgba(255, 107, 107, 0.28)" : "rgba(216, 74, 74, 0.25)",
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
          paddingHorizontal: isSmall ? 7 : 10,
          paddingVertical: isSmall ? 3 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: current.text,
            fontSize: isSmall ? FontSizes.micro : FontSizes.caption,
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
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontFamily: Typography.medium,
    textTransform: "capitalize",
    letterSpacing: 0.2,
  },
});
