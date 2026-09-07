import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "file-tray-outline",
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: isDark
              ? "rgba(53, 214, 160, 0.10)"
              : "#DDF4EA",
            borderColor: isDark
              ? "rgba(53, 214, 160, 0.22)"
              : "rgba(0, 168, 121, 0.20)",
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={32}
          color={isDark ? "#35D6A0" : "#00A879"}
        />
      </View>
      <Text
        style={[
          styles.title,
          { color: isDark ? "#F1F7F4" : "#101513" },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          { color: isDark ? "#8FA09A" : "#5E6964" },
        ]}
      >
        {description}
      </Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
          ]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.buttonText,
              { color: isDark ? "#080C0B" : "#FFFFFF" },
            ]}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: FontSizes.sectionTitle,
    fontFamily: Typography.semiBold,
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.regular,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.semiBold,
  },
});
