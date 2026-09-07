import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

interface QuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddRemark: () => void;
  onScheduleFollowUp: () => void;
  onAddLead: () => void;
  onSyncCalls: () => Promise<void>;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  visible,
  onClose,
  onAddRemark,
  onScheduleFollowUp,
  onAddLead,
  onSyncCalls,
}) => {
  const { colors, isDark } = useTheme();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSyncPress = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      await onSyncCalls();
      setSyncSuccess(true);
      setTimeout(() => {
        setIsSyncing(false);
        setSyncSuccess(false);
        onClose();
      }, 1200);
    } catch {
      setIsSyncing(false);
    }
  };

  const actionItems = [
    {
      id: "remark",
      title: "Add Customer Remark",
      subtitle: "Log call summary, notes, or client requests",
      icon: "chatbubble-ellipses-outline" as const,
      color: isDark ? "#35D6A0" : "#00A879",
      bg: isDark ? "rgba(53, 214, 160, 0.12)" : "#DDF4EA",
      onPress: () => {
        onClose();
        onAddRemark();
      },
    },
    {
      id: "followup",
      title: "Schedule Follow-up",
      subtitle: "Set calendar reminder, review, or demo",
      icon: "calendar-outline" as const,
      color: isDark ? "#20E3AD" : "#19C997",
      bg: isDark ? "rgba(32, 227, 173, 0.12)" : "rgba(25, 201, 151, 0.12)",
      onPress: () => {
        onClose();
        onScheduleFollowUp();
      },
    },
    {
      id: "lead",
      title: "Add New Lead",
      subtitle: "Create prospective deal in pipeline",
      icon: "person-add-outline" as const,
      color: isDark ? "#B7F34A" : "#2E7D32",
      bg: isDark ? "rgba(183, 243, 74, 0.14)" : "rgba(166, 226, 46, 0.18)",
      onPress: () => {
        onClose();
        onAddLead();
      },
    },
  ];

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
            { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(16,21,19,0.5)" },
          ]}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
                  borderColor: isDark ? "#294039" : "#D8E0DC",
                },
              ]}
            >
              {/* Handle bar */}
              <View
                style={[
                  styles.handle,
                  { backgroundColor: isDark ? "#294039" : "#D8E0DC" },
                ]}
              />

              <View style={styles.sheetHeader}>
                <Text
                  style={[
                    styles.sheetTitle,
                    { color: isDark ? "#F1F7F4" : "#101513" },
                  ]}
                >
                  Quick Actions
                </Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons
                    name="close"
                    size={22}
                    color={isDark ? "#8FA09A" : "#5E6964"}
                  />
                </TouchableOpacity>
              </View>

              {/* Action List */}
              <View style={styles.actionList}>
                {actionItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.actionRow,
                      {
                        backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                        borderColor: isDark ? "#1C2D26" : "#E8EFEB",
                      },
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.actionIconBox, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>
                    <View style={styles.actionTexts}>
                      <Text
                        style={[
                          styles.actionTitle,
                          { color: isDark ? "#F1F7F4" : "#101513" },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          styles.actionSubtitle,
                          { color: isDark ? "#8FA09A" : "#5E6964" },
                        ]}
                      >
                        {item.subtitle}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isDark ? "#65756F" : "#87928D"}
                    />
                  </TouchableOpacity>
                ))}

                {/* Sync Calls Action */}
                <TouchableOpacity
                  style={[
                    styles.actionRow,
                    {
                      backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                      borderColor: isDark ? "#1C2D26" : "#E8EFEB",
                    },
                  ]}
                  onPress={handleSyncPress}
                  disabled={isSyncing}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.actionIconBox,
                      {
                        backgroundColor: isDark
                          ? "rgba(53, 214, 160, 0.12)"
                          : "#DDF4EA",
                      },
                    ]}
                  >
                    {isSyncing ? (
                      <ActivityIndicator
                        size="small"
                        color={isDark ? "#35D6A0" : "#00A879"}
                      />
                    ) : syncSuccess ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={isDark ? "#35D6A0" : "#00A879"}
                      />
                    ) : (
                      <Ionicons
                        name="sync-outline"
                        size={20}
                        color={isDark ? "#35D6A0" : "#00A879"}
                      />
                    )}
                  </View>
                  <View style={styles.actionTexts}>
                    <Text
                      style={[
                        styles.actionTitle,
                        { color: isDark ? "#F1F7F4" : "#101513" },
                      ]}
                    >
                      {syncSuccess ? "Sync Complete!" : "Sync Call Logs Now"}
                    </Text>
                    <Text
                      style={[
                        styles.actionSubtitle,
                        { color: isDark ? "#8FA09A" : "#5E6964" },
                      ]}
                    >
                      {syncSuccess
                        ? "Device logs updated successfully"
                        : "Trigger instant background synchronization"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={isDark ? "#65756F" : "#87928D"}
                  />
                </TouchableOpacity>
              </View>
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
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
  },
  actionList: {
    gap: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionTexts: {
    flex: 1,
  },
  actionTitle: {
    fontSize: FontSizes.body,
    fontFamily: Typography.semiBold,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
  },
});
