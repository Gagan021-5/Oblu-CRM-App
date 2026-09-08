import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  FollowUpNotificationItem,
  getStoredNotifications,
  markAllNotificationsRead,
  deleteStoredNotification,
  clearAllStoredNotifications,
  subscribeToNotifications,
  subscribeToInAppBanner,
  scheduleFollowUpNotifications,
  notifyPaymentTicketRaised,
  initializeNotifications,
} from "@/services/followUpNotificationService";
import { Typography, FontSizes, Shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

interface NotificationContextType {
  notifications: FollowUpNotificationItem[];
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  scheduleFollowUp: (params: {
    customerName: string;
    customerId?: string;
    followUpDate: string;
    followUpTime: string;
    purpose: string;
    notes?: string;
  }) => Promise<void>;
  notifyPaymentTicket: (params: {
    customerName: string;
    customerId?: string;
    invoiceNumber: string;
    amount: string;
    expectedDate: string;
    recipientEmail?: string;
  }) => Promise<void>;
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
  isNotificationCenterVisible: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [notifications, setNotifications] = useState<FollowUpNotificationItem[]>([]);
  const [activeBanner, setActiveBanner] = useState<FollowUpNotificationItem | null>(null);
  const [isNotificationCenterVisible, setIsNotificationCenterVisible] = useState(false);

  // Animated value for in-app banner slide
  const [bannerAnim] = useState(new Animated.Value(-180));

  useEffect(() => {
    initializeNotifications();

    // Initial load
    getStoredNotifications().then((items) => {
      setNotifications(items);
    });

    // Listen to changes
    const unsubStore = subscribeToNotifications(setNotifications);

    // Listen to in-app real-time banners
    const unsubBanner = subscribeToInAppBanner((item) => {
      setActiveBanner(item);
      const topTarget = insets.top > 0 ? insets.top + 8 : 16;
      Animated.spring(bannerAnim, {
        toValue: topTarget,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();

      // Auto-hide after 6 seconds
      setTimeout(() => {
        hideBanner();
      }, 6000);
    });

    return () => {
      unsubStore();
      unsubBanner();
    };
  }, [insets.top]);

  const hideBanner = useCallback(() => {
    Animated.timing(bannerAnim, {
      toValue: -180,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setActiveBanner(null));
  }, [bannerAnim]);

  const handleBannerPress = useCallback(() => {
    if (!activeBanner) return;
    const targetId = activeBanner.customerId || "cust-001";
    hideBanner();
    router.push(`/(employee)/customers/${targetId}` as any);
  }, [activeBanner, hideBanner]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllNotificationsRead();
  }, []);

  const handleDeleteNotification = useCallback(async (id: string) => {
    await deleteStoredNotification(id);
  }, []);

  const handleClearAll = useCallback(async () => {
    await clearAllStoredNotifications();
  }, []);

  const openNotificationCenter = useCallback(() => {
    setIsNotificationCenterVisible(true);
  }, []);

  const closeNotificationCenter = useCallback(() => {
    setIsNotificationCenterVisible(false);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const providerValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllAsRead: handleMarkAllRead,
      deleteNotification: handleDeleteNotification,
      clearAllNotifications: handleClearAll,
      scheduleFollowUp: scheduleFollowUpNotifications,
      notifyPaymentTicket: notifyPaymentTicketRaised,
      openNotificationCenter,
      closeNotificationCenter,
      isNotificationCenterVisible,
    }),
    [
      notifications,
      unreadCount,
      handleMarkAllRead,
      handleDeleteNotification,
      handleClearAll,
      openNotificationCenter,
      closeNotificationCenter,
      isNotificationCenterVisible,
    ]
  );

  return (
    <NotificationContext.Provider value={providerValue}>
      {children}

      {/* Real-time In-App Floating Notification Banner (WhatsApp / iOS heads-up style) */}
      {activeBanner && (
        <Animated.View
          style={[
            styles.bannerWrapper,
            {
              transform: [{ translateY: bannerAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.bannerCard,
              {
                backgroundColor: isDark ? "#121F1B" : "#FFFFFF",
                borderColor:
                  activeBanner.type === "payment_ticket_raised"
                    ? isDark
                      ? "#FF4D4F"
                      : "#CF1322"
                    : isDark
                    ? "#35D6A0"
                    : "#00A879",
              },
              Shadows.cardElevated,
            ]}
            onPress={handleBannerPress}
            activeOpacity={0.92}
          >
            <View
              style={[
                styles.bannerIconBox,
                {
                  backgroundColor:
                    activeBanner.type === "payment_ticket_raised"
                      ? isDark
                        ? "rgba(255, 77, 79, 0.16)"
                        : "#FFF1F0"
                      : isDark
                      ? "rgba(53, 214, 160, 0.16)"
                      : "#DDF4EA",
                },
              ]}
            >
              <Ionicons
                name={
                  activeBanner.type === "payment_ticket_raised"
                    ? "alert-circle"
                    : "calendar"
                }
                size={20}
                color={
                  activeBanner.type === "payment_ticket_raised"
                    ? isDark
                      ? "#FF4D4F"
                      : "#CF1322"
                    : isDark
                    ? "#35D6A0"
                    : "#00A879"
                }
              />
            </View>

            <View style={styles.bannerContent}>
              <View style={styles.bannerHeaderRow}>
                <View
                  style={[
                    styles.bannerCategoryPill,
                    {
                      backgroundColor:
                        activeBanner.type === "payment_ticket_raised"
                          ? isDark
                            ? "rgba(255, 77, 79, 0.2)"
                            : "#FFEAEA"
                          : isDark
                          ? "rgba(53, 214, 160, 0.18)"
                          : "#DDF4EA",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bannerCategory,
                      {
                        color:
                          activeBanner.type === "payment_ticket_raised"
                            ? isDark
                              ? "#FF4D4F"
                              : "#CF1322"
                            : isDark
                            ? "#35D6A0"
                            : "#00A879",
                      },
                    ]}
                  >
                    {activeBanner.type === "payment_ticket_raised"
                      ? "🚨 TICKET RAISED"
                      : "📅 FOLLOW-UP"}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.bannerTime,
                    { color: isDark ? "#8FA09A" : "#5E6964" },
                  ]}
                >
                  Just now
                </Text>
              </View>

              <Text
                style={[
                  styles.bannerTitle,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
                numberOfLines={1}
              >
                {activeBanner.customerName}
              </Text>

              <Text
                style={[
                  styles.bannerBody,
                  { color: isDark ? "#A0B5AC" : "#4A5E55" },
                ]}
                numberOfLines={2}
              >
                {activeBanner.type === "payment_ticket_raised"
                  ? `Expected date crossed for Inv #${activeBanner.invoiceNumber || ""}. Automated Gmail dispatched.`
                  : `${activeBanner.purpose} on ${activeBanner.followUpDate} at ${activeBanner.followUpTime}`}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.bannerCloseBtn}
              onPress={hideBanner}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="close"
                size={16}
                color={isDark ? "#8FA09A" : "#5E6964"}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  bannerWrapper: {
    position: "absolute",
    top: 0,
    left: 14,
    right: 14,
    zIndex: 99999,
  },
  bannerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  bannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 2,
    flexShrink: 0,
  },
  bannerContent: {
    flex: 1,
    marginRight: 6,
  },
  bannerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  bannerCategoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  bannerCategory: {
    fontSize: 10,
    fontFamily: Typography.bold,
    letterSpacing: 0.4,
  },
  bannerTime: {
    fontSize: 10,
    fontFamily: Typography.regular,
    flexShrink: 0,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: Typography.bold,
    marginBottom: 2,
  },
  bannerBody: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: Typography.regular,
  },
  bannerCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
});
