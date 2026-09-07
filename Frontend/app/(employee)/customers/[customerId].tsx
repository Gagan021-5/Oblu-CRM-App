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
  Customer,
} from "@/data/mockCustomers";

type SegmentTab = "overview" | "remarks" | "followups" | "payments";

export default function CustomerDetailScreen() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<SegmentTab>("overview");
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false);

  const fetchCustomer = useCallback(async () => {
    if (!customerId) return;
    const data = await getMockCustomerById(customerId);
    if (data) setCustomer(data);
  }, [customerId]);

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
                size={16}
                color={isDark ? "#35D6A0" : "#00A879"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#35D6A0" : "#00A879" },
                ]}
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
                size={16}
                color={isDark ? "#F1F7F4" : "#101513"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
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
                size={16}
                color={isDark ? "#F1F7F4" : "#101513"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
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
                size={16}
                color={isDark ? "#F1F7F4" : "#101513"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isDark ? "#F1F7F4" : "#101513" },
                ]}
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
              customer.payments.map((p) => (
                <View
                  key={p.id}
                  style={[
                    styles.paymentRow,
                    {
                      backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                      borderColor: isDark ? "#1C2D26" : "#E8EFEB",
                    },
                  ]}
                >
                  <View style={styles.paymentLeft}>
                    <Text
                      style={[
                        styles.invoiceNum,
                        { color: isDark ? "#F1F7F4" : "#101513" },
                      ]}
                    >
                      {p.invoiceNumber}
                    </Text>
                    <Text
                      style={[
                        styles.paymentDueDate,
                        { color: isDark ? "#8FA09A" : "#5E6964" },
                      ]}
                    >
                      Due {p.dueDate}
                    </Text>
                  </View>

                  <View style={styles.paymentRight}>
                    <Text
                      style={[
                        styles.paymentAmount,
                        { color: isDark ? "#F1F7F4" : "#101513" },
                      ]}
                    >
                      {p.amount}
                    </Text>
                    <StatusPill
                      label={p.status}
                      variant={p.status}
                      size="small"
                    />
                  </View>
                </View>
              ))
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  actionBtnText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
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
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: FontSizes.caption,
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
  },
  followUpDateText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
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
  paymentLeft: {},
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
});
