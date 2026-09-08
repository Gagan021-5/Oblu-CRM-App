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
            { backgroundColor: isDark ? "rgba(0,0,0,0.78)" : "rgba(16,21,19,0.55)" },
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
              {/* Header */}
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
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDark
                          ? "rgba(53, 214, 160, 0.14)"
                          : "#DDF4EA",
                      },
                    ]}
                  >
                    <Ionicons
                      name="notifications"
                      size={18}
                      color={isDark ? "#35D6A0" : "#00A879"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.headerTitle,
                        { color: isDark ? "#F1F7F4" : "#101513" },
                      ]}
                      numberOfLines={1}
                    >
                      Notifications
                    </Text>
                    <Text
                      style={[
                        styles.headerSubtitle,
                        { color: isDark ? "#8FA09A" : "#5E6964" },
                      ]}
                      numberOfLines={1}
                    >
                      {unreadCount > 0
                        ? `${unreadCount} unread reminder${unreadCount > 1 ? "s" : ""}`
                        : "All reminders up to date"}
                    </Text>
                  </View>
                </View>

                <View style={styles.headerRight}>
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      onPress={markAllAsRead}
                      style={[
                        styles.actionTextBtn,
                        {
                          backgroundColor: isDark
                            ? "rgba(53, 214, 160, 0.12)"
                            : "#EEF8F4",
                        },
                      ]}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name="checkmark-done-outline"
                        size={14}
                        color={isDark ? "#35D6A0" : "#00A879"}
                      />
                      <Text
                        style={[
                          styles.markReadText,
                          { color: isDark ? "#35D6A0" : "#00A879" },
                        ]}
                      >
                        Read
                      </Text>
                    </TouchableOpacity>
                  )}

                  {notifications.length > 0 && (
                    <TouchableOpacity
                      onPress={clearAllNotifications}
                      style={[
                        styles.actionTextBtn,
                        {
                          backgroundColor: isDark
                            ? "rgba(255, 107, 107, 0.1)"
                            : "#FFF1F0",
                        },
                      ]}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={13}
                        color={isDark ? "#FF8080" : "#E03131"}
                      />
                      <Text
                        style={[
                          styles.markReadText,
                          { color: isDark ? "#FF8080" : "#E03131" },
                        ]}
                      >
                        Clear
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
                      size={18}
                      color={isDark ? "#8FA09A" : "#5E6964"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter Tabs - Horizontal Scroll to prevent wrapping or overflowing */}
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
                      { key: "followups", label: "Follow-ups" },
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

              {/* Notification List */}
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
                        size={40}
                        color={isDark ? "#35D6A0" : "#00A879"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.emptyTitle,
                        { color: isDark ? "#F1F7F4" : "#101513" },
                      ]}
                    >
                      All Caught Up
                    </Text>
                    <Text
                      style={[
                        styles.emptyBody,
                        { color: isDark ? "#8FA09A" : "#5E6964" },
                      ]}
                    >
                      {activeFilter === "unread"
                        ? "You have no unread follow-up notifications."
                        : activeFilter === "tickets"
                        ? "No raised payment tickets right now."
                        : "Scheduled customer follow-up reminders and payment alerts appear here."}
                    </Text>
                  </View>
                ) : (
                  filteredNotifications.map((item) => {
                    const isTicket = item.type === "payment_ticket_raised";
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.notifCard,
                          {
                            backgroundColor: isTicket
                              ? isDark
                                ? item.read
                                  ? "#160E0E"
                                  : "#241010"
                                : item.read
                                ? "#FFFBFB"
                                : "#FFF1F0"
                              : isDark
                              ? item.read
                                ? "#121F1B"
                                : "#152822"
                              : item.read
                              ? "#FFFFFF"
                              : "#F4FAF7",
                            borderColor: isTicket
                              ? isDark
                                ? "rgba(255, 77, 79, 0.5)"
                                : "#FFA39E"
                              : isDark
                              ? item.read
                                ? "#1E3029"
                                : "rgba(53, 214, 160, 0.45)"
                              : item.read
                              ? "#E1E8E4"
                              : "rgba(0, 168, 121, 0.35)",
                          },
                        ]}
                      >
                        {/* Top Row: Type Tag & Time Due */}
                        <View style={styles.notifTopRow}>
                          <View
                            style={[
                              styles.tagCapsule,
                              {
                                backgroundColor: isTicket
                                  ? isDark
                                    ? "rgba(255, 77, 79, 0.15)"
                                    : "#FFEAEA"
                                  : isDark
                                  ? "rgba(53, 214, 160, 0.15)"
                                  : "#DDF4EA",
                                borderColor: isTicket
                                  ? isDark
                                    ? "rgba(255, 77, 79, 0.3)"
                                    : "#FFCCC7"
                                  : isDark
                                  ? "rgba(53, 214, 160, 0.3)"
                                  : "#B5E8D5",
                              },
                            ]}
                          >
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
                            <Ionicons
                              name={isTicket ? "alert-circle" : "time-outline"}
                              size={12}
                              color={
                                isTicket
                                  ? isDark
                                    ? "#FF4D4F"
                                    : "#CF1322"
                                  : isDark
                                  ? "#35D6A0"
                                  : "#00A879"
                              }
                            />
                            <Text
                              style={[
                                styles.tagText,
                                {
                                  color: isTicket
                                    ? isDark
                                      ? "#FF4D4F"
                                      : "#CF1322"
                                    : isDark
                                    ? "#35D6A0"
                                    : "#00A879",
                                },
                              ]}
                            >
                              {isTicket ? "🚨 TICKET RAISED" : "1-DAY REMINDER"}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.itemDate,
                              {
                                color: isTicket
                                  ? isDark
                                    ? "#FF8585"
                                    : "#D4380D"
                                  : isDark
                                  ? "#8FA09A"
                                  : "#5E6964",
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {isTicket
                              ? `Overdue (${item.expectedDate || "Passed"})`
                              : `${item.followUpDate} • ${item.followUpTime}`}
                          </Text>
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

                        {/* Purpose / Invoice Detail */}
                        <View style={styles.purposeRow}>
                          <Ionicons
                            name={
                              isTicket
                                ? "receipt-outline"
                                : "calendar-outline"
                            }
                            size={13}
                            color={isDark ? "#8FA09A" : "#5E6964"}
                          />
                          <Text
                            style={[
                              styles.purposeText,
                              { color: isDark ? "#8FA09A" : "#5E6964" },
                            ]}
                            numberOfLines={1}
                          >
                            {isTicket
                              ? `Invoice #${item.invoiceNumber || "INV"} • Amount: ${item.amount || ""}`
                              : item.purpose}
                          </Text>
                        </View>

                        {/* Automated Gmail Callout / Notes Box */}
                        {isTicket ? (
                          <View
                            style={[
                              styles.notesBox,
                              {
                                backgroundColor: isDark
                                  ? "rgba(255, 77, 79, 0.08)"
                                  : "rgba(255, 77, 79, 0.05)",
                                borderLeftColor: isDark ? "#FF4D4F" : "#CF1322",
                              },
                            ]}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
                              <Ionicons
                                name="mail-outline"
                                size={13}
                                color={isDark ? "#FF8585" : "#CF1322"}
                              />
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontFamily: Typography.bold,
                                  color: isDark ? "#FF8585" : "#CF1322",
                                }}
                              >
                                Automated Gmail Alert Dispatched
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.notesText,
                                { color: isDark ? "#D3ADAD" : "#724747" },
                              ]}
                              numberOfLines={2}
                            >
                              Expected date ({item.expectedDate}) crossed. Automatic alert dispatched to accounts and salesperson.
                            </Text>
                          </View>
                        ) : item.notes ? (
                          <View
                            style={[
                              styles.notesBox,
                              {
                                backgroundColor: isDark
                                  ? "rgba(0,0,0,0.25)"
                                  : "rgba(0,0,0,0.025)",
                                borderLeftColor: isDark
                                  ? "#35D6A0"
                                  : "#00A879",
                              },
                            ]}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 3 }}>
                              <Ionicons
                                name="chatbubble-ellipses-outline"
                                size={12}
                                color={isDark ? "#35D6A0" : "#00A879"}
                              />
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontFamily: Typography.bold,
                                  color: isDark ? "#35D6A0" : "#00A879",
                                }}
                              >
                                Follow-up Note
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.notesText,
                                { color: isDark ? "#8FA09A" : "#5E6964" },
                              ]}
                              numberOfLines={2}
                            >
                              "{item.notes}"
                            </Text>
                          </View>
                        ) : null}

                        {/* Card Footer: View Customer & Delete Action */}
                        <View style={styles.notifFooter}>
                          <TouchableOpacity
                            style={styles.actionLink}
                            onPress={() => handleItemPress(item.customerId)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.actionHint,
                                {
                                  color: isTicket
                                    ? isDark
                                      ? "#FF7875"
                                      : "#D4380D"
                                    : isDark
                                    ? "#35D6A0"
                                    : "#00A879",
                                },
                              ]}
                            >
                              {isTicket
                                ? "View Invoice & Payment Details"
                                : "View Customer Profile"}
                            </Text>
                            <Ionicons
                              name="arrow-forward"
                              size={13}
                              color={
                                isTicket
                                  ? isDark
                                    ? "#FF7875"
                                    : "#D4380D"
                                  : isDark
                                  ? "#35D6A0"
                                  : "#00A879"
                              }
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => deleteNotification(item.id)}
                            style={[
                              styles.dismissBtn,
                              {
                                backgroundColor: isDark
                                  ? "rgba(255,255,255,0.06)"
                                  : "rgba(0,0,0,0.04)",
                              },
                            ]}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={14}
                              color={isDark ? "#8FA09A" : "#87928D"}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
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
    maxHeight: "82%",
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
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Typography.bold,
  },
  headerSubtitle: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.regular,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  actionTextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markReadText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
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
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FontSizes.caption,
  },
  list: {
    maxHeight: 460,
  },
  listContent: {
    padding: 16,
    gap: 12,
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
    gap: 8,
  },
  tagCapsule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tagText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    letterSpacing: 0.3,
  },
  itemDate: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
    flexShrink: 0,
    textAlign: "right",
  },
  customerTitle: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.bold,
    marginBottom: 4,
  },
  purposeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  purposeText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.medium,
    flex: 1,
  },
  notesBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  notesText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    lineHeight: 16,
  },
  notifFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
  },
  actionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  actionHint: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  dismissBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 44,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
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
