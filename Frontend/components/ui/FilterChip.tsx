import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

interface FilterChipProps {
  label: string;
  count?: number;
  isActive: boolean;
  onPress: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  isActive,
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isActive
            ? isDark
              ? "rgba(53, 214, 160, 0.16)"
              : "#DDF4EA"
            : isDark
            ? "#121F1B"
            : "#FFFFFF",
          borderColor: isActive
            ? colors.primary
            : isDark
            ? "#294039"
            : "#D8E0DC",
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: isActive
              ? colors.primary
              : isDark
              ? "#8FA09A"
              : "#5E6964",
            fontFamily: isActive ? Typography.semiBold : Typography.medium,
          },
        ]}
      >
        {label}
      </Text>
      {count !== undefined && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: isActive
                ? colors.primary
                : isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(16, 21, 19, 0.06)",
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: isActive
                  ? isDark
                    ? "#080C0B"
                    : "#FFFFFF"
                  : isDark
                  ? "#8FA09A"
                  : "#5E6964",
              },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  label: {
    fontSize: FontSizes.bodySmall,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
  },
});
