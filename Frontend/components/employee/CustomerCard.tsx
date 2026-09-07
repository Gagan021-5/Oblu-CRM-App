import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";
import { StatusPill } from "@/components/ui/StatusPill";
import { Customer } from "@/data/mockCustomers";

interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onPress }) => {
  const { colors, isDark } = useTheme();

  const handleCall = (e: any) => {
    e.stopPropagation?.();
    const cleaned = customer.phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleaned}`).catch(() => {});
  };

  // Initials for avatar
  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
          borderColor: isDark ? "#294039" : "#D8E0DC",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top Row: Avatar + Name/City + Payment Pill */}
      <View style={styles.headerRow}>
        <View style={styles.nameBlock}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isDark ? "#15221D" : "#DDF4EA",
                borderColor: isDark ? "rgba(53, 214, 160, 0.25)" : "rgba(0, 168, 121, 0.25)",
              },
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                { color: isDark ? "#35D6A0" : "#00A879" },
              ]}
            >
              {initials}
            </Text>
          </View>
          <View style={styles.titleInfo}>
            <Text
              style={[
                styles.companyName,
                { color: isDark ? "#F1F7F4" : "#101513" },
              ]}
              numberOfLines={1}
            >
              {customer.name}
            </Text>
            <View style={styles.contactRow}>
              <Text
                style={[
                  styles.contactPerson,
                  { color: isDark ? "#8FA09A" : "#5E6964" },
                ]}
                numberOfLines={1}
              >
                {customer.contactPerson} • {customer.city}
              </Text>
            </View>
          </View>
        </View>

        <StatusPill
          label={customer.paymentStatus.replace("_", " ")}
          variant={customer.paymentStatus}
          size="small"
        />
      </View>

      {/* Middle Row: Follow-up & Last Contact */}
      <View
        style={[
          styles.metaContainer,
          {
            backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
            borderColor: isDark ? "#1C2D26" : "#E8EFEB",
          },
        ]}
      >
        <View style={styles.metaCol}>
          <Text
            style={[
              styles.metaLabel,
              { color: isDark ? "#65756F" : "#87928D" },
            ]}
          >
            Last Contact
          </Text>
          <Text
            style={[
              styles.metaValue,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
            numberOfLines={1}
          >
            {customer.lastContactTime}
          </Text>
        </View>

        <View
          style={[
            styles.metaDivider,
            { backgroundColor: isDark ? "#294039" : "#D8E0DC" },
          ]}
        />

        <View style={styles.metaCol}>
          <Text
            style={[
              styles.metaLabel,
              { color: isDark ? "#65756F" : "#87928D" },
            ]}
          >
            Next Follow-up
          </Text>
          <Text
            style={[
              styles.metaValueHighlight,
              { color: isDark ? "#35D6A0" : "#00A879" },
            ]}
            numberOfLines={1}
          >
            {customer.nextFollowUp}
          </Text>
        </View>
      </View>

      {/* Footer Row: Quick Call action & Chevron detail */}
      <View style={styles.footerRow}>
        <View style={styles.salespersonRow}>
          <Ionicons
            name="person-circle-outline"
            size={14}
            color={isDark ? "#8FA09A" : "#5E6964"}
          />
          <Text
            style={[
              styles.salespersonText,
              { color: isDark ? "#8FA09A" : "#5E6964" },
            ]}
          >
            {customer.assignedSalesperson}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.callButton,
              {
                backgroundColor: isDark
                  ? "rgba(53, 214, 160, 0.12)"
                  : "#DDF4EA",
                borderColor: isDark
                  ? "rgba(53, 214, 160, 0.25)"
                  : "rgba(0, 168, 121, 0.25)",
              },
            ]}
            onPress={handleCall}
            activeOpacity={0.7}
          >
            <Ionicons
              name="call"
              size={13}
              color={isDark ? "#35D6A0" : "#00A879"}
            />
            <Text
              style={[
                styles.callButtonText,
                { color: isDark ? "#35D6A0" : "#00A879" },
              ]}
            >
              Call
            </Text>
          </TouchableOpacity>

          <View style={styles.chevronWrap}>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isDark ? "#65756F" : "#87928D"}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  nameBlock: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.bold,
  },
  titleInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: FontSizes.body,
    fontFamily: Typography.semiBold,
    letterSpacing: -0.2,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  contactPerson: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
  },
  metaContainer: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.regular,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.medium,
  },
  metaValueHighlight: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
  },
  metaDivider: {
    width: 1,
    marginHorizontal: 10,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  salespersonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  salespersonText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.medium,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  callButtonText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
  },
  chevronWrap: {
    paddingLeft: 2,
  },
});
