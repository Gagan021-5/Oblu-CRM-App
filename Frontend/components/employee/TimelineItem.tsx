import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

interface TimelineItemProps {
  time?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  isLast?: boolean;
  type?: "call" | "followup" | "payment" | "demo" | "note";
  onPress?: () => void;
}

const TimelineItemComponent: React.FC<TimelineItemProps> = ({
  time,
  title,
  subtitle,
  tag,
  isLast = false,
  type = "followup",
  onPress,
}) => {
  const { colors, isDark } = useTheme();

  const getIconInfo = () => {
    switch (type) {
      case "call":
        return {
          name: "call-outline" as const,
          color: isDark ? "#35D6A0" : "#00A879",
          bg: isDark ? "rgba(53, 214, 160, 0.12)" : "#DDF4EA",
        };
      case "payment":
        return {
          name: "card-outline" as const,
          color: isDark ? "#F2B84B" : "#C97A1E",
          bg: isDark ? "rgba(242, 184, 75, 0.14)" : "rgba(228, 155, 49, 0.12)",
        };
      case "demo":
        return {
          name: "videocam-outline" as const,
          color: isDark ? "#20E3AD" : "#19C997",
          bg: isDark ? "rgba(32, 227, 173, 0.12)" : "rgba(25, 201, 151, 0.12)",
        };
      case "note":
        return {
          name: "document-text-outline" as const,
          color: isDark ? "#8FA09A" : "#5E6964",
          bg: isDark ? "rgba(255, 255, 255, 0.08)" : "#F1F4F2",
        };
      case "followup":
      default:
        return {
          name: "calendar-outline" as const,
          color: isDark ? "#35D6A0" : "#00A879",
          bg: isDark ? "rgba(53, 214, 160, 0.12)" : "#DDF4EA",
        };
    }
  };

  const icon = getIconInfo();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      {/* Left indicator with connecting vertical line */}
      <View style={styles.leftColumn}>
        <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={14} color={icon.color} />
        </View>
        {!isLast && (
          <View
            style={[
              styles.verticalLine,
              { backgroundColor: isDark ? "#1C2D26" : "#E4ECE8" },
            ]}
          />
        )}
      </View>

      {/* Right Content */}
      <View style={styles.contentColumn}>
        <View style={styles.headerRow}>
          <Text
            style={[
              styles.title,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            {title}
          </Text>
          {time && (
            <Text
              style={[
                styles.timeText,
                { color: isDark ? "#8FA09A" : "#5E6964" },
              ]}
            >
              {time}
            </Text>
          )}
        </View>

        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? "#8FA09A" : "#5E6964" },
            ]}
          >
            {subtitle}
          </Text>
        )}

        {tag && (
          <View
            style={[
              styles.tagBadge,
              {
                backgroundColor: isDark
                  ? "rgba(53, 214, 160, 0.08)"
                  : "rgba(0, 168, 121, 0.06)",
              },
            ]}
          >
            <Text
              style={[
                styles.tagText,
                { color: isDark ? "#35D6A0" : "#00A879" },
              ]}
            >
              {tag}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const TimelineItem = React.memo(TimelineItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 4,
  },
  leftColumn: {
    alignItems: "center",
    width: 32,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  verticalLine: {
    width: 1.5,
    flex: 1,
    marginVertical: 4,
  },
  contentColumn: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.semiBold,
    flex: 1,
  },
  timeText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.regular,
    marginLeft: 8,
  },
  subtitle: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  tagBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  tagText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.medium,
  },
});
