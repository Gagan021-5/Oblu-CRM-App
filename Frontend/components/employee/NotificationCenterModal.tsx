import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Shadows } from "@/constants/theme";
import { useNotifications } from "@/contexts/NotificationContext";

interface NotificationCenterModalProps {
  visible: boolean;
  onClose: () => void;
}

type FilterTab = "all" | "unread" | "followups" | "tickets";

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  visible,
  onClose,
}) => {
  const { isDark } = useTheme();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
  } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const ticketCount = useMemo(
    () => notifications.filter((n) => n.type === "payment_ticket_raised").length,
    [notifications]
  );

  const followUpCount = useMemo(
    () => notifications.filter((n) => n.type === "1_day_reminder").length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "followups":
        return notifications.filter((n) => n.type === "1_day_reminder");
      case "tickets":
        return notifications.filter((n) => n.type === "payment_ticket_raised");
      case "all":
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const handleItemPress = (customerId?: string) => {
    onClose();
    if (customerId) {
      router.push(`/(employee)/customers/${customerId}` as any);
    } else {
      router.push("/(employee)/customers" as any);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.backdrop,
            { backgroundColor: isDark ? "rgba(0,0,0,0.72)" : "rgba(16,21,19,0.5)" },
          ]}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                  borderColor: isDark ? "#294039" : "#D8E0DC",
                },
                Shadows.cardElevated,
              ]}
            >
              {/* Clean Header */}
              <View
                style={[
                  styles.header,
                  {
                    borderBottomColor: isDark
                      ? "rgba(41, 64, 57, 0.6)"
                      : "rgba(216, 224, 220, 0.8)",
                  },
                ]}
              >
                <View style={styles.headerLeft}>
                  <Text
                    style={[
                      styles.headerTitle,
                      { color: isDark ? "#F1F7F4" : "#101513" },
                    ]}
                  >
                    Notifications
                  </Text>
                  {unreadCount > 0 && (
                    <View
                      style={[
                        styles.unreadBadge,
                        {
                          backgroundColor: isDark
                            ? "rgba(53, 214, 160, 0.16)"
                            : "#DDF4EA",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.unreadBadgeText,
                          { color: isDark ? "#35D6A0" : "#00A879" },
                        ]}
                      >
                        {unreadCount} new
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.headerRight}>
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      onPress={markAllAsRead}
                      style={styles.markAllReadBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text
                        style={[
                          styles.markAllReadText,
                          { color: isDark ? "#35D6A0" : "#00A879" },
                        ]}
                      >
                        Mark all read
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={onClose}
                    style={[
                      styles.closeBtn,
                      {
                        backgroundColor: isDark ? "#15221D" : "#F7F9F8",
                        borderColor: isDark ? "#294039" : "#D8E0DC",
                      },
                    ]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={isDark ? "#8FA09A" : "#5E6964"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Refined Filter Chips */}
              <View
                style={[
                  styles.filterRow,
                  {
                    borderBottomColor: isDark
                      ? "rgba(41, 64, 57, 0.4)"
                      : "rgba(216, 224, 220, 0.6)",
                  },
                ]}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterScrollContent}
                >
                  {(
                    [
                      { key: "all", label: `All (${notifications.length})` },
                      { key: "unread", label: `Unread (${unreadCount})` },
                      { key: "followups", label: `Follow-ups (${followUpCount})` },
                      { key: "tickets", label: `Tickets (${ticketCount})` },
                    ] as const
                  ).map((tab) => {
                    const isSelected = activeFilter === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? "rgba(53, 214, 160, 0.16)"
                                : "#DDF4EA"
                              : isDark
                              ? "#121F1B"
                              : "#F7F9F8",
                            borderColor: isSelected
                              ? isDark
                                ? "#35D6A0"
                                : "#00A879"
                              : isDark
                              ? "#294039"
                              : "#D8E0DC",
                          },
                        ]}
                        onPress={() => setActiveFilter(tab.key)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: isSelected
                                ? isDark
                                  ? "#35D6A0"
                                  : "#00A879"
                                : isDark
                                ? "#8FA09A"
                                : "#5E6964",
                              fontFamily: isSelected
                                ? Typography.semiBold
                                : Typography.medium,
                            },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Notification Cards List */}
              <ScrollView
                style={styles.list}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              >
                {filteredNotifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View
                      style={[
                        styles.emptyIconBg,
                        {
                          backgroundColor: isDark
                            ? "rgba(53, 214, 160, 0.08)"
                            : "#EEF8F4",
                        },
                      ]}
                    >
                      <Ionicons
                        name="checkmark-done-circle-outline"
                        size={36}
                        color={isDark ? "#35D6A0" : "#00A879"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.emptyTitle,
                        { color: isDark ? "#F1F7F4" : "#101513" },
                      ]}
                    >
                      All caught up
                    </Text>
                    <Text
                      style={[
                        styles.emptyBody,
                        { color: isDark ? "#8FA09A" : "#5E6964" },
                      ]}
                    >
                      {activeFilter === "unread"
                        ? "You have no unread notifications."
                        : activeFilter === "tickets"
                        ? "No raised payment tickets."
                        : "Follow-up reminders and payment alerts will appear here."}
                    </Text>
                  </View>
                ) : (
                  filteredNotifications.map((item) => {
                    const isTicket = item.type === "payment_ticket_raised";
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.notifCard,
                          {
                            backgroundColor: isDark
                              ? item.read
                                ? "#111D19"
                                : "#14251F"
                              : item.read
                              ? "#FFFFFF"
                              : "#F6FAF8",
                            borderColor: isDark
                              ? item.read
                                ? "#1E3029"
                                : "rgba(53, 214, 160, 0.35)"
                              : item.read
                              ? "#E1E8E4"
                              : "rgba(0, 168, 121, 0.3)",
                          },
                        ]}
                        onPress={() => handleItemPress(item.customerId)}
                        activeOpacity={0.85}
                      >
                        {/* Top Row: Clean Category Pill + Time + Delete */}
                        <View style={styles.notifTopRow}>
                          <View style={styles.pillContainer}>
                            {!item.read && (
                              <View
                                style={[
                                  styles.liveDot,
                                  {
                                    backgroundColor: isTicket
                                      ? "#FF4D4F"
                                      : isDark
                                      ? "#35D6A0"
                                      : "#00A879",
                                  },
                                ]}
                              />
                            )}
                            <View
                              style={[
                                styles.cleanPill,
                                {
                                  backgroundColor: isTicket
                                    ? isDark
                                      ? "rgba(255, 77, 79, 0.12)"
                                      : "#FDECEB"
                                    : isDark
                                    ? "rgba(53, 214, 160, 0.12)"
                                    : "#DDF4EA",
                                },
                              ]}
                            >
                              <Ionicons
                                name={isTicket ? "alert-circle" : "calendar"}
                                size={11}
                                color={
                                  isTicket
                                    ? isDark
                                      ? "#FF7875"
                                      : "#D9363E"
                                    : isDark
                                    ? "#35D6A0"
                                    : "#00A879"
                                }
                              />
                              <Text
                                style={[
                                  styles.cleanPillText,
                                  {
                                    color: isTicket
                                      ? isDark
                                        ? "#FF7875"
                                        : "#D9363E"
                                      : isDark
                                      ? "#35D6A0"
                                      : "#00A879",
                                  },
                                ]}
                              >
                                {isTicket ? "Payment Ticket" : "Follow-up"}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.topRightActions}>
                            <Text
                              style={[
                                styles.itemDate,
                                {
                                  color: isTicket
                                    ? isDark
                                      ? "#FF9C9C"
                                      : "#CF1322"
                                    : isDark
                                    ? "#8FA09A"
                                    : "#5E6964",
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {isTicket
                                ? `Overdue • ${item.expectedDate || "Passed"}`
                                : `${item.followUpDate || "Scheduled"} • ${item.followUpTime || ""}`}
                            </Text>

                            <TouchableOpacity
                              onPress={(e) => {
                                e.stopPropagation();
                                deleteNotification(item.id);
                              }}
                              style={styles.trashIconBtn}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={14}
                                color={isDark ? "#6E8079" : "#9AA6A0"}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Customer Name */}
                        <Text
                          style={[
                            styles.customerTitle,
                            { color: isDark ? "#F1F7F4" : "#101513" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.customerName}
                        </Text>

                        {/* Context Line: Invoice or Purpose */}
                        <View style={styles.contextLine}>
                          <Ionicons
                            name={isTicket ? "receipt-outline" : "bookmark-outline"}
                            size={13}
                            color={isDark ? "#8FA09A" : "#5E6964"}
                          />
                          <Text
                            style={[
                              styles.contextText,
                              { color: isDark ? "#8FA09A" : "#5E6964" },
                            ]}
                            numberOfLines={1}
                          >
                            {isTicket
                              ? `Invoice #${item.invoiceNumber || "INV"} • Amount: ${item.amount || ""}`
                              : item.purpose || "Customer Follow-up"}
                          </Text>
                        </View>

                        {/* Note/Snippet (Clean text without heavy nested boxes) */}
                        {isTicket ? (
                          <Text
                            style={[
                              styles.messageSnippet,
                              { color: isDark ? "#B8C9C2" : "#4A5852" },
                            ]}
                            numberOfLines={2}
                          >
                            Expected payment date ({item.expectedDate}) passed. Automated alert dispatched to accounts.
                          </Text>
                        ) : item.notes ? (
                          <Text
                            style={[
                              styles.messageSnippet,
                              { color: isDark ? "#B8C9C2" : "#4A5852" },
                            ]}
                            numberOfLines={2}
                          >
                            "{item.notes}"
                          </Text>
                        ) : null}

                        {/* Footer action link */}
                        <View style={styles.notifFooter}>
                          <Text
                            style={[
                              styles.actionHint,
                              {
                                color: isDark ? "#35D6A0" : "#00A879",
                              },
                            ]}
                          >
                            {isTicket ? "View invoice details" : "View customer profile"}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={12}
                            color={isDark ? "#35D6A0" : "#00A879"}
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxHeight: "80%",
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
  },
  unreadBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontFamily: Typography.bold,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  markAllReadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  markAllReadText: {
    fontSize: 13,
    fontFamily: Typography.semiBold,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    borderBottomWidth: 1,
  },
  filterScrollContent: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  list: {
    maxHeight: 460,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  notifCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  notifTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pillContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cleanPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cleanPillText: {
    fontSize: 11,
    fontFamily: Typography.semiBold,
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemDate: {
    fontSize: 11,
    fontFamily: Typography.medium,
  },
  trashIconBtn: {
    padding: 2,
  },
  customerTitle: {
    fontSize: 15,
    fontFamily: Typography.bold,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  contextLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  contextText: {
    fontSize: 12,
    fontFamily: Typography.regular,
    flex: 1,
  },
  messageSnippet: {
    fontSize: 12,
    fontFamily: Typography.regular,
    lineHeight: 17,
    marginBottom: 8,
  },
  notifFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(143, 160, 154, 0.2)",
  },
  actionHint: {
    fontSize: 12,
    fontFamily: Typography.semiBold,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  emptyBody: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    textAlign: "center",
    lineHeight: 18,
  },
});
