import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";
import { mockEmployee } from "@/data/mockEmployee";

import { router } from "expo-router";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationCenterModal } from "@/components/employee/NotificationCenterModal";

interface WorkspaceHeaderProps {
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

const WorkspaceHeaderComponent: React.FC<WorkspaceHeaderProps> = ({
  onNotificationPress,
  onProfilePress,
}) => {
  const { colors, isDark, mode, setMode } = useTheme();
  const {
    unreadCount,
    openNotificationCenter,
    closeNotificationCenter,
    isNotificationCenterVisible,
  } = useNotifications();

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

  const handleNotificationClick = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      openNotificationCenter();
    }
  };

  const handleProfileClick = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      router.push("/(employee)/profile" as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
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
            onPress={handleNotificationClick}
            activeOpacity={0.7}
          >
            <Ionicons
              name={unreadCount > 0 ? "notifications" : "notifications-outline"}
              size={18}
              color={
                unreadCount > 0
                  ? isDark
                    ? "#35D6A0"
                    : "#00A879"
                  : isDark
                  ? "#F1F7F4"
                  : "#101513"
              }
            />
            {unreadCount > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  { backgroundColor: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isDark ? "#0A1612" : "#FFFFFF" },
                  ]}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.avatar,
              {
                backgroundColor: isDark ? "#1B2B25" : "#00A879",
                borderColor: isDark ? "#35D6A0" : "rgba(0, 168, 121, 0.3)",
              },
            ]}
            onPress={handleProfileClick}
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

      {/* Interactive Notification Center Modal */}
      <NotificationCenterModal
        visible={isNotificationCenterVisible}
        onClose={closeNotificationCenter}
      />
    </View>
  );
};

export const WorkspaceHeader = React.memo(WorkspaceHeaderComponent);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
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
    justifyContent: "center",
  },
  dateText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.semiBold,
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
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Typography.bold,
    textAlign: "center",
    lineHeight: 11,
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
