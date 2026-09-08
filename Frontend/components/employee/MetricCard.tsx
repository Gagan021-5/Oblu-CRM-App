import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: keyof typeof Ionicons.glyphMap;
  isHighlight?: boolean;
}

const MetricCardComponent: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon,
  isHighlight = false,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
          borderColor: isHighlight
            ? isDark
              ? "rgba(183, 243, 74, 0.4)"
              : "rgba(166, 226, 46, 0.5)"
            : isDark
            ? "#294039"
            : "#D8E0DC",
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isHighlight
                ? isDark
                  ? "rgba(183, 243, 74, 0.14)"
                  : "rgba(166, 226, 46, 0.18)"
                : isDark
                ? "rgba(53, 214, 160, 0.10)"
                : "#DDF4EA",
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={16}
            color={
              isHighlight
                ? isDark
                  ? "#B7F34A"
                  : "#2E7D32"
                : isDark
                ? "#35D6A0"
                : "#00A879"
            }
          />
        </View>
        {isHighlight && (
          <View
            style={[
              styles.highlightDot,
              { backgroundColor: isDark ? "#B7F34A" : "#A6E22E" },
            ]}
          />
        )}
      </View>

      <Text
        style={[
          styles.valueText,
          {
            color: isHighlight
              ? isDark
                ? "#B7F34A"
                : "#101513"
              : isDark
              ? "#F1F7F4"
              : "#101513",
          },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.labelText,
          { color: isDark ? "#8FA09A" : "#5E6964" },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {subValue && (
        <Text
          style={[
            styles.subValueText,
            { color: isDark ? "#35D6A0" : "#00A879" },
          ]}
          numberOfLines={1}
        >
          {subValue}
        </Text>
      )}
    </View>
  );
};

export const MetricCard = React.memo(MetricCardComponent);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    minWidth: 140,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  valueText: {
    fontSize: 20,
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  labelText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.medium,
  },
  subValueText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
    marginTop: 3,
  },
});
