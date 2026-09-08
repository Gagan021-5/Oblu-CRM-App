import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";
import { StatusPill } from "@/components/ui/StatusPill";
import { TimelineItem } from "@/components/employee/TimelineItem";
import { AddCustomerRemarkModal } from "@/components/employee/AddCustomerRemarkModal";
import { ScheduleFollowUpModal } from "@/components/employee/ScheduleFollowUpModal";
import {
  getMockCustomerById,
  addMockCustomerRemark,
  scheduleMockCustomerFollowUp,
  raiseMockPaymentTicket,
  solveMockPaymentTicket,
  sendMockPaymentReminderEmail,
  Customer,
} from "@/data/mockCustomers";
import { scheduleFollowUpNotifications } from "@/services/followUpNotificationService";
import { useNotifications } from "@/contexts/NotificationContext";

type SegmentTab = "overview" | "remarks" | "followups" | "payments";

export default function CustomerDetailScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { notifyPaymentTicket } = useNotifications();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<SegmentTab>("overview");
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    const data = await getMockCustomerById(customerId);
    if (data) setCustomer(data);
  }, [customerId]);

  const handleRaiseTicket = async (
    paymentId: string,
    invoiceNum: string,
    amount: string,
    expDate: string
  ) => {
    if (!customer) return;
    try {
      await raiseMockPaymentTicket(customer.id, paymentId);
      await notifyPaymentTicket({
        customerName: customer.name,
        customerId: customer.id,
        invoiceNumber: invoiceNum,
        amount: amount,
        expectedDate: expDate || "Crossed",
        recipientEmail: "finance@oblutools.com, " + (customer.email || ""),
      });
      await fetchCustomer();
      Alert.alert(
        "Payment Ticket Raised",
        `Ticket for Invoice #${invoiceNum} (${amount}) has been RAISED.\n\nAutomated Gmail notification dispatched to accounts team and ${customer.assignedSalesperson}.`
      );
    } catch {
      Alert.alert("Error", "Could not raise payment ticket.");
    }
  };

  const handleSolveTicket = async (paymentId: string) => {
    if (!customer) return;
    try {
      await solveMockPaymentTicket(customer.id, paymentId);
      await fetchCustomer();
      Alert.alert("Ticket Resolved", "Payment ticket marked as SOLVED.");
    } catch {
      Alert.alert("Error", "Could not resolve payment ticket.");
    }
  };

  const handleSendReminderEmail = async (paymentId: string, invoiceNum: string) => {
    if (!customer) return;
    try {
      const res = await sendMockPaymentReminderEmail(customer.id, paymentId);
      await fetchCustomer();
      Alert.alert(
        "Automated Gmail Sent",
        `Payment reminder for Invoice #${invoiceNum} successfully sent via Gmail automation to:\n${res.recipient}\n\nTimestamp: ${res.sentAt}`
      );
    } catch {
      Alert.alert("Error", "Could not send payment reminder email.");
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleCall = () => {
    if (!customer) return;
    const cleaned = customer.phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert("Unable to place call", customer.phone);
    });
  };

  const handleMessage = () => {
    if (!customer) return;
    const cleaned = customer.phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`sms:${cleaned}`).catch(() => {
      Alert.alert("Unable to open SMS", customer.phone);
    });
  };

  const handleAddRemark = async (text: string) => {
    if (!customer) return;
    const newRem = await addMockCustomerRemark(customer.id, text);
    setCustomer((prev) =>
      prev
        ? {
            ...prev,
            remarks: [newRem, ...prev.remarks],
            lastContactTime: `Today, ${newRem.time}`,
          }
        : null
    );
  };

  const handleScheduleFollowUp = async (data: any) => {
    if (!customer) return;
    const newFol = await scheduleMockCustomerFollowUp(customer.id, data);
    setCustomer((prev) =>
      prev
        ? {
            ...prev,
            followUps: [newFol, ...prev.followUps],
            nextFollowUp: `${newFol.date}, ${newFol.time}`,
          }
        : null
    );

    // Schedule 1-day before outer mobile & in-app notification
    await scheduleFollowUpNotifications({
      customerName: customer.name,
      customerId: customer.id,
      followUpDate: data.date,
      followUpTime: data.time,
      purpose: data.purpose,
      notes: data.notes,
    });
  };

  if (!customer) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: isDark ? "#8FA09A" : "#5E6964" }}>
          Loading customer record...
        </Text>
      </View>
    );
  }

  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Header Row */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={[
            styles.backBtn,
            {
              backgroundColor: isDark ? "#121F1B" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={18}
            color={isDark ? "#F1F7F4" : "#101513"}
          />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? "#F1F7F4" : "#101513" },
          ]}
        >
          Customer Profile
        </Text>

        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 96 },
        ]}
      >
        {/* Customer Header Card */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
        >
          <View style={styles.avatarRow}>
            <View
              style={[
                styles.largeAvatar,
                {
                  backgroundColor: isDark ? "#15221D" : "#DDF4EA",
                  borderColor: isDark
                    ? "rgba(53, 214, 160, 0.3)"
                    : "rgba(0, 168, 121, 0.3)",
                },
              ]}
            >
              <Text
                style={[
                  styles.largeAvatarText,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
              >
                {initials}
              </Text>
            </View>

            <View style={styles.companyMeta}>
              <View style={styles.titleStatusRow}>
                <Text
                  style={[
                    styles.companyName,
                    { color: isDark ? "#F1F7F4" : "#101513" },
                  ]}
                >
                  {customer.name}
                </Text>
                <StatusPill
                  label={customer.status}
                  variant={customer.status === "VIP" ? "high_intent" : "neutral"}
                  size="small"
                />
              </View>

              <Text
                style={[
                  styles.contactPerson,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                {customer.contactPerson}
              </Text>

              <View style={styles.contactDetails}>
                <Text
                  style={[
                    styles.detailItem,
                    { color: isDark ? "#8FA09A" : "#5E6964" },
                  ]}
                >
                  {customer.phone} • {customer.city}
                </Text>
                <Text
                  style={[
                    styles.detailItem,
                    { color: isDark ? "#8FA09A" : "#5E6964" },
                  ]}
                >
                  {customer.email}
                </Text>
              </View>
            </View>
          </View>

          {/* Primary Action Buttons */}
          <View style={styles.primaryActionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(53, 214, 160, 0.14)"
                    : "#DDF4EA",
                  borderColor: isDark
                    ? "rgba(53, 214, 160, 0.3)"
                    : "rgba(0, 168, 121, 0.3)",
                },
              ]}
              onPress={handleCall}
              activeOpacity={0.7}
            >
              <Ionicons
                name="call"
                size={18}
                color={isDark ? "#35D6A0" : "#00A879"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Call
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                  borderColor: isDark ? "#294039" : "#D8E0DC",
                },
              ]}
              onPress={handleMessage}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chatbubble-outline"
                size={18}
                color={isDark ? "#F1F7F4" : "#101513"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                  borderColor: isDark ? "#294039" : "#D8E0DC",
                },
              ]}
              onPress={() => setRemarkModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-outline"
                size={18}
                color={isDark ? "#F1F7F4" : "#101513"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Remark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                  borderColor: isDark ? "#294039" : "#D8E0DC",
                },
              ]}
              onPress={() => setFollowUpModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color={isDark ? "#F1F7F4" : "#101513"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Follow-up
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Segmented Tabs */}
        <View
          style={[
            styles.segmentBar,
            {
              backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
              borderColor: isDark ? "#294039" : "#D8E0DC",
            },
          ]}
        >
          {(
            [
              { key: "overview", label: "Overview" },
              { key: "remarks", label: `Remarks (${customer.remarks.length})` },
              { key: "followups", label: `Follow-ups (${customer.followUps.length})` },
              { key: "payments", label: `Payments (${customer.payments.length})` },
            ] as const
          ).map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.segmentItem,
                  isSelected && {
                    backgroundColor: isDark
                      ? "rgba(53, 214, 160, 0.14)"
                      : "#DDF4EA",
                  },
                ]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
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
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
          >
            <Text
              style={[
                styles.boxTitle,
                { color: isDark ? "#8FA09A" : "#5E6964" },
              ]}
            >
              RELATIONSHIP PARAMETERS
            </Text>

            <View style={styles.grid2x2}>
              <View style={styles.paramItem}>
                <Text style={[styles.paramLabel, { color: isDark ? "#65756F" : "#87928D" }]}>
                  Assigned Salesperson
                </Text>
                <Text style={[styles.paramValue, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  {customer.assignedSalesperson}
                </Text>
              </View>

              <View style={styles.paramItem}>
                <Text style={[styles.paramLabel, { color: isDark ? "#65756F" : "#87928D" }]}>
                  Customer Since
                </Text>
                <Text style={[styles.paramValue, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  {customer.customerSince}
                </Text>
              </View>

              <View style={styles.paramItem}>
                <Text style={[styles.paramLabel, { color: isDark ? "#65756F" : "#87928D" }]}>
                  Credit Period
                </Text>
                <Text style={[styles.paramValue, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  {customer.creditPeriod}
                </Text>
              </View>

              <View style={styles.paramItem}>
                <Text style={[styles.paramLabel, { color: isDark ? "#65756F" : "#87928D" }]}>
                  Outstanding Payment
                </Text>
                <Text
                  style={[
                    styles.paramValue,
                    {
                      color:
                        customer.outstandingPayment === "₹0"
                          ? isDark
                            ? "#35D6A0"
                            : "#00A879"
                          : isDark
                          ? "#F2B84B"
                          : "#C97A1E",
                    },
                  ]}
                >
                  {customer.outstandingPayment}
                </Text>
              </View>

              <View style={styles.paramItem}>
                <Text style={[styles.paramLabel, { color: isDark ? "#65756F" : "#87928D" }]}>
                  Last Interaction
                </Text>
                <Text style={[styles.paramValue, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                  {customer.lastContactTime}
                </Text>
              </View>

              <View style={styles.paramItem}>
                <Text style={[styles.paramLabel, { color: isDark ? "#65756F" : "#87928D" }]}>
                  Upcoming Follow-up
                </Text>
                <Text
                  style={[
                    styles.paramValue,
                    { color: isDark ? "#35D6A0" : "#00A879", fontFamily: Typography.bold },
                  ]}
                >
                  {customer.nextFollowUp}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab 2: Remarks Activity Timeline */}
        {activeTab === "remarks" && (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.boxTitle,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                REMARKS TIMELINE
              </Text>
              <TouchableOpacity
                onPress={() => setRemarkModalVisible(true)}
                style={styles.inlineAddBtn}
              >
                <Ionicons
                  name="add"
                  size={14}
                  color={isDark ? "#35D6A0" : "#00A879"}
                />
                <Text
                  style={[
                    styles.inlineAddText,
                    { color: isDark ? "#35D6A0" : "#00A879" },
                  ]}
                >
                  Add Remark
                </Text>
              </TouchableOpacity>
            </View>

            {customer.remarks.map((rem, idx) => (
              <TimelineItem
                key={rem.id}
                time={`${rem.date}, ${rem.time}`}
                title={rem.text}
                subtitle={`Logged by ${rem.author}`}
                type="note"
                isLast={idx === customer.remarks.length - 1}
              />
            ))}
          </View>
        )}

        {/* Tab 3: Follow-ups */}
        {activeTab === "followups" && (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
          >
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.boxTitle,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                SCHEDULED FOLLOW-UPS
              </Text>
              <TouchableOpacity
                onPress={() => setFollowUpModalVisible(true)}
                style={styles.inlineAddBtn}
              >
                <Ionicons
                  name="add"
                  size={14}
                  color={isDark ? "#35D6A0" : "#00A879"}
                />
                <Text
                  style={[
                    styles.inlineAddText,
                    { color: isDark ? "#35D6A0" : "#00A879" },
                  ]}
                >
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>

            {customer.followUps.map((fol) => (
              <View
                key={fol.id}
                style={[
                  styles.followUpCard,
                  {
                    backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                    borderColor: isDark ? "#1C2D26" : "#E8EFEB",
                  },
                ]}
              >
                <View style={styles.followUpTop}>
                  <View style={styles.followUpDateTime}>
                    <Ionicons
                      name="calendar"
                      size={14}
                      color={isDark ? "#35D6A0" : "#00A879"}
                    />
                    <Text
                      style={[
                        styles.followUpDateText,
                        { color: isDark ? "#F1F7F4" : "#101513" },
                      ]}
                    >
                      {fol.date} at {fol.time}
                    </Text>
                  </View>
                  <StatusPill
                    label={fol.status}
                    variant={fol.status === "scheduled" ? "paid" : "neutral"}
                    size="small"
                  />
                </View>
                <Text
                  style={[
                    styles.followUpPurpose,
                    { color: isDark ? "#F1F7F4" : "#101513" },
                  ]}
                >
                  {fol.purpose}
                </Text>
                {fol.notes ? (
                  <Text
                    style={[
                      styles.followUpNotes,
                      { color: isDark ? "#8FA09A" : "#5E6964" },
                    ]}
                  >
                    {fol.notes}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Tab 4: Payments */}
        {activeTab === "payments" && (
          <View
            style={[
              styles.cardBox,
              {
                backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                borderColor: isDark ? "#294039" : "#D8E0DC",
              },
            ]}
          >
            <Text
              style={[
                styles.boxTitle,
                { color: isDark ? "#8FA09A" : "#5E6964" },
              ]}
            >
              INVOICES & RECOVERY
            </Text>

            {customer.payments.length === 0 ? (
              <Text
                style={[
                  styles.emptySubtext,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
              >
                No pending or past invoices recorded for this customer.
              </Text>
            ) : (
              customer.payments.map((p) => {
                const isTicketRaised = p.ticketStatus === "RAISED";
                const isSolved = p.ticketStatus === "SOLVED";

                return (
                  <View
                    key={p.id}
                    style={[
                      styles.paymentCard,
                      {
                        backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                        borderColor: isTicketRaised
                          ? "#FF4D4F"
                          : p.isDateCrossed
                          ? "#FFA940"
                          : isDark
                          ? "#1C2D26"
                          : "#E8EFEB",
                      },
                    ]}
                  >
                    {/* Header Row: Invoice & Status Pill / Ticket Pill */}
                    <View style={styles.paymentCardHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Ionicons
                          name="receipt-outline"
                          size={18}
                          color={isDark ? "#35D6A0" : "#00A879"}
                        />
                        <Text
                          style={[
                            styles.invoiceNum,
                            { color: isDark ? "#F1F7F4" : "#101513" },
                          ]}
                        >
                          {p.invoiceNumber}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {isTicketRaised && (
                          <View style={styles.ticketBadgeRaised}>
                            <Ionicons name="alert-circle" size={11} color="#FF4D4F" />
                            <Text style={styles.ticketBadgeRaisedText}>TICKET RAISED</Text>
                          </View>
                        )}
                        {isSolved && (
                          <View style={styles.ticketBadgeSolved}>
                            <Ionicons name="checkmark-circle" size={11} color="#35D6A0" />
                            <Text style={styles.ticketBadgeSolvedText}>RESOLVED</Text>
                          </View>
                        )}
                        <StatusPill label={p.status} variant={p.status} size="small" />
                      </View>
                    </View>

                    {/* Amount & Due Date Details */}
                    <View style={styles.paymentDetailRow}>
                      <View>
                        <Text style={[styles.paymentSubLabel, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                          Amount
                        </Text>
                        <Text style={[styles.paymentAmountLarge, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                          {p.amount}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.paymentSubLabel, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                          Due Date
                        </Text>
                        <Text style={[styles.paymentDetailValue, { color: isDark ? "#F1F7F4" : "#101513" }]}>
                          {p.dueDate}
                        </Text>
                      </View>
                    </View>

                    {/* Expected Date Warning Banner */}
                    {p.expectedDate && (
                      <View
                        style={[
                          styles.expectedDateBox,
                          {
                            backgroundColor: p.isDateCrossed
                              ? isDark ? "rgba(255, 77, 79, 0.12)" : "#FFF1F0"
                              : isDark ? "#162821" : "#EEF5F1",
                            borderColor: p.isDateCrossed
                              ? isDark ? "rgba(255, 77, 79, 0.3)" : "#FFCCC7"
                              : isDark ? "#294039" : "#D8E0DC",
                          },
                        ]}
                      >
                        <Ionicons
                          name={p.isDateCrossed ? "warning" : "calendar-outline"}
                          size={15}
                          color={p.isDateCrossed ? "#FF4D4F" : isDark ? "#35D6A0" : "#00A879"}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.expectedDateText,
                              {
                                color: p.isDateCrossed
                                  ? "#FF4D4F"
                                  : isDark ? "#F1F7F4" : "#101513",
                              },
                            ]}
                          >
                            Expected Date: {p.expectedDate}
                            {p.isDateCrossed ? " (Crossed - Overdue)" : ""}
                          </Text>
                          {p.ticketRaisedAt && (
                            <Text style={[styles.ticketRaisedSub, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                              Auto-escalated ticket logged at {p.ticketRaisedAt}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Automated Gmail Notification Notice */}
                    {p.emailSent && (
                      <View
                        style={[
                          styles.gmailNoticeBox,
                          {
                            backgroundColor: isDark ? "rgba(53, 214, 160, 0.08)" : "#E6F7F0",
                            borderColor: isDark ? "rgba(53, 214, 160, 0.25)" : "#B5E8D5",
                          },
                        ]}
                      >
                        <Ionicons
                          name="mail-unread-outline"
                          size={15}
                          color={isDark ? "#35D6A0" : "#00A879"}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.gmailNoticeTitle,
                              { color: isDark ? "#35D6A0" : "#007A57" },
                            ]}
                          >
                            Automated Gmail Alert Dispatched
                          </Text>
                          <Text
                            style={[
                              styles.gmailNoticeDetail,
                              { color: isDark ? "#A0B5AC" : "#4A5E55" },
                            ]}
                            numberOfLines={2}
                          >
                            Sent to: {p.emailRecipient || "Finance & Sales Team"}
                            {p.emailSentAt ? ` • ${p.emailSentAt}` : ""}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.paymentActionRow}>
                      {isTicketRaised ? (
                        <>
                          <TouchableOpacity
                            style={[styles.actionBtnSecondary, { borderColor: isDark ? "#294039" : "#D8E0DC" }]}
                            onPress={() => handleSendReminderEmail(p.id, p.invoiceNumber)}
                          >
                            <Ionicons name="mail" size={13} color={isDark ? "#35D6A0" : "#00A879"} />
                            <Text style={[styles.actionBtnSecondaryText, { color: isDark ? "#35D6A0" : "#00A879" }]}>
                              Resend Gmail Alert
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionBtnPrimary}
                            onPress={() => handleSolveTicket(p.id)}
                          >
                            <Ionicons name="checkmark-done" size={13} color="#000" />
                            <Text style={styles.actionBtnPrimaryText}>Mark Solved</Text>
                          </TouchableOpacity>
                        </>
                      ) : p.isDateCrossed && !isSolved ? (
                        <TouchableOpacity
                          style={styles.actionBtnDanger}
                          onPress={() =>
                            handleRaiseTicket(
                              p.id,
                              p.invoiceNumber,
                              p.amount,
                              p.expectedDate || p.dueDate
                            )
                          }
                        >
                          <Ionicons name="alert-circle" size={14} color="#FFF" />
                          <Text style={styles.actionBtnDangerText}>Raise Ticket & Send Gmail</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Screen Modals */}
      <AddCustomerRemarkModal
        visible={remarkModalVisible}
        onClose={() => setRemarkModalVisible(false)}
        onSave={handleAddRemark}
        customerName={customer.name}
      />

      <ScheduleFollowUpModal
        visible={followUpModalVisible}
        onClose={() => setFollowUpModalVisible(false)}
        onSchedule={handleScheduleFollowUp}
        targetName={customer.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Typography.bold,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  largeAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  largeAvatarText: {
    fontSize: 20,
    fontFamily: Typography.bold,
  },
  companyMeta: {
    flex: 1,
  },
  titleStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  companyName: {
    fontSize: 18,
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 8,
  },
  contactPerson: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.medium,
    marginBottom: 4,
  },
  contactDetails: {
    gap: 2,
  },
  detailItem: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
  },
  primaryActionRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.12)",
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 5,
    minHeight: 58,
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: Typography.semiBold,
    textAlign: "center",
  },
  segmentBar: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 3,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
  },
  segmentText: {
    fontSize: 11,
    textAlign: "center",
  },
  cardBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  boxTitle: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  inlineAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  inlineAddText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  grid2x2: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
  },
  paramItem: {
    width: "50%",
    paddingRight: 8,
  },
  paramLabel: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.regular,
    marginBottom: 2,
  },
  paramValue: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.semiBold,
  },
  followUpCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  followUpTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  followUpDateTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  followUpDateText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
    flexShrink: 1,
  },
  followUpPurpose: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.semiBold,
    marginBottom: 2,
  },
  followUpNotes: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  paymentLeft: {
    flex: 1,
    marginRight: 10,
  },
  invoiceNum: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.semiBold,
  },
  paymentDueDate: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  paymentAmount: {
    fontSize: FontSizes.body,
    fontFamily: Typography.bold,
  },
  emptySubtext: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.regular,
    paddingVertical: 12,
  },
  paymentCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 12,
  },
  paymentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  ticketBadgeRaised: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 77, 79, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 79, 0.3)",
  },
  ticketBadgeRaisedText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: "#FF4D4F",
    letterSpacing: 0.5,
  },
  ticketBadgeSolved: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(53, 214, 160, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(53, 214, 160, 0.3)",
  },
  ticketBadgeSolvedText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: "#35D6A0",
    letterSpacing: 0.5,
  },
  paymentDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  paymentSubLabel: {
    fontSize: 11,
    fontFamily: Typography.medium,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paymentAmountLarge: {
    fontSize: FontSizes.sectionTitle,
    fontFamily: Typography.bold,
  },
  paymentDetailValue: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.semiBold,
  },
  expectedDateBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  expectedDateText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  ticketRaisedSub: {
    fontSize: 10,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  gmailNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  gmailNoticeTitle: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.bold,
  },
  gmailNoticeDetail: {
    fontSize: 11,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  paymentActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 4,
  },
  actionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnSecondaryText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#35D6A0",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.bold,
    color: "#05130D",
  },
  actionBtnDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF4D4F",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnDangerText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.bold,
    color: "#FFFFFF",
  },
});
