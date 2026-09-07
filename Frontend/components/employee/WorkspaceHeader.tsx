import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";
import { mockEmployee } from "@/data/mockEmployee";

interface WorkspaceHeaderProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  onNotificationPress,
  onProfilePress,
}) => {
  const { colors, isDark, mode, setMode } = useTheme();

  // Dynamic greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Formatted date: "Monday, 7 September"
  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const toggleTheme = () => {
    setMode(isDark ? "light" : "dark");
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
          {/* Sync Status Capsule */}
          <View
            style={[
              styles.syncCapsule,
              {
                backgroundColor: isDark
                  ? "rgba(53, 214, 160, 0.12)"
                  : "#DDF4EA",
                borderColor: isDark
                  ? "rgba(53, 214, 160, 0.28)"
                  : "rgba(0, 168, 121, 0.25)",
              },
            ]}
          >
            <View
              style={[
                styles.syncDot,
                { backgroundColor: isDark ? "#35D6A0" : "#00A879" },
              ]}
            />
            <Text
              style={[
                styles.syncText,
                { color: isDark ? "#35D6A0" : "#00A879" },
              ]}
            >
              Synced
            </Text>
          </View>

          <Text
            style={[
              styles.dateText,
              { color: isDark ? "#8FA09A" : "#5E6964" },
            ]}
          >
            {formattedDate}
          </Text>
        </View>

        {/* Right Actions: Theme Toggle, Notifications, Avatar */}
        <View style={styles.rightActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isDark ? "#121F1B" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={18}
              color={isDark ? "#35D6A0" : "#00A879"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: isDark ? "#121F1B" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="notifications-outline"
              size={18}
              color={isDark ? "#F1F7F4" : "#101513"}
            />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.avatar,
              {
                backgroundColor: isDark ? "#1B2B25" : "#00A879",
                borderColor: isDark ? "#35D6A0" : "rgba(0, 168, 121, 0.3)",
              },
            ]}
            onPress={onProfilePress}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isDark ? "#35D6A0" : "#FFFFFF" },
              ]}
            >
              {mockEmployee.avatarInitials}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting Heading */}
      <Text
        style={[
          styles.greetingTitle,
          { color: isDark ? "#F1F7F4" : "#101513" },
        ]}
      >
        {greeting}, {mockEmployee.name.split(" ")[0]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  leftMeta: {
    flexDirection: "column",
  },
  syncCapsule: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  syncText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  dateText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.medium,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#19C997",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  avatarText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.bold,
  },
  greetingTitle: {
    fontSize: 24,
    fontFamily: Typography.bold,
    letterSpacing: -0.5,
  },
});
