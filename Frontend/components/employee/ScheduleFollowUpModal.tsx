import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

interface ScheduleFollowUpModalProps {
  visible: boolean;
  onClose: () => void;
  onSchedule: (data: { date: string; time: string; purpose: string; notes: string }) => void;
  targetName?: string;
}

const COMMON_PURPOSES = [
  "Contract Review",
  "Product Demo",
  "Payment Reminder",
  "Account Health Check",
  "Proposal Discussion",
];

const PRESET_DATES = ["Today", "Tomorrow", "In 3 Days", "Next Monday"];
const PRESET_TIMES = ["10:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"];

export const ScheduleFollowUpModal: React.FC<ScheduleFollowUpModalProps> = ({
  visible,
  onClose,
  onSchedule,
  targetName,
}) => {
  const { colors, isDark } = useTheme();

  const [purpose, setPurpose] = useState(COMMON_PURPOSES[0]);
  const [date, setDate] = useState(PRESET_DATES[1]);
  const [time, setTime] = useState(PRESET_TIMES[0]);
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    onSchedule({
      purpose,
      date,
      time,
      notes: notes.trim() || "Follow up on scheduled agenda.",
    });
    setNotes("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
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
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: isDark ? "#294039" : "#D8E0DC" },
                  ]}
                />

                <View style={styles.header}>
                  <View>
                    <Text
                      style={[
                        styles.title,
                        { color: isDark ? "#F1F7F4" : "#101513" },
                      ]}
                    >
                      Schedule Follow-up
                    </Text>
                    {targetName && (
                      <Text
                        style={[
                          styles.subtitle,
                          { color: isDark ? "#8FA09A" : "#5E6964" },
                        ]}
                      >
                        with {targetName}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons
                      name="close"
                      size={22}
                      color={isDark ? "#8FA09A" : "#5E6964"}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Purpose Chips */}
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: isDark ? "#8FA09A" : "#5E6964" },
                    ]}
                  >
                    Select Purpose
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.chipRow}
                  >
                    {COMMON_PURPOSES.map((item) => {
                      const isSelected = purpose === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? "rgba(53, 214, 160, 0.16)"
                                  : "#DDF4EA"
                                : isDark
                                ? "#121F1B"
                                : "#F7F9F8",
                              borderColor: isSelected
                                ? colors.primary
                                : isDark
                                ? "#294039"
                                : "#D8E0DC",
                            },
                          ]}
                          onPress={() => setPurpose(item)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : isDark
                                  ? "#8FA09A"
                                  : "#5E6964",
                              },
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Date Chips */}
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: isDark ? "#8FA09A" : "#5E6964" },
                    ]}
                  >
                    Date
                  </Text>
                  <View style={styles.gridRow}>
                    {PRESET_DATES.map((item) => {
                      const isSelected = date === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.gridChip,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? "rgba(53, 214, 160, 0.16)"
                                  : "#DDF4EA"
                                : isDark
                                ? "#121F1B"
                                : "#F7F9F8",
                              borderColor: isSelected
                                ? colors.primary
                                : isDark
                                ? "#294039"
                                : "#D8E0DC",
                            },
                          ]}
                          onPress={() => setDate(item)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : isDark
                                  ? "#8FA09A"
                                  : "#5E6964",
                              },
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Time Chips */}
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: isDark ? "#8FA09A" : "#5E6964" },
                    ]}
                  >
                    Time
                  </Text>
                  <View style={styles.gridRow}>
                    {PRESET_TIMES.map((item) => {
                      const isSelected = time === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.gridChip,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? "rgba(53, 214, 160, 0.16)"
                                  : "#DDF4EA"
                                : isDark
                                ? "#121F1B"
                                : "#F7F9F8",
                              borderColor: isSelected
                                ? colors.primary
                                : isDark
                                ? "#294039"
                                : "#D8E0DC",
                            },
                          ]}
                          onPress={() => setTime(item)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSelected
                                  ? colors.primary
                                  : isDark
                                  ? "#8FA09A"
                                  : "#5E6964",
                              },
                            ]}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Agenda Notes */}
                  <Text
                    style={[
                      styles.sectionLabel,
                      { color: isDark ? "#8FA09A" : "#5E6964" },
                    ]}
                  >
                    Notes & Agenda (optional)
                  </Text>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                        borderColor: isDark ? "#294039" : "#D8E0DC",
                        color: isDark ? "#F1F7F4" : "#101513",
                      },
                    ]}
                    placeholder="Specific questions or items to review..."
                    placeholderTextColor={isDark ? "#65756F" : "#87928D"}
                    multiline
                    numberOfLines={2}
                    value={notes}
                    onChangeText={setNotes}
                    textAlignVertical="top"
                  />

                  {/* Schedule Button */}
                  <TouchableOpacity
                    style={[
                      styles.scheduleButton,
                      { backgroundColor: colors.primary },
                    ]}
                    onPress={handleSave}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.scheduleButtonText,
                        { color: isDark ? "#080C0B" : "#FFFFFF" },
                      ]}
                    >
                      Confirm Schedule
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
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
    maxHeight: "85%",
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
    marginBottom: 8,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  gridChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  chipText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.medium,
  },
  textArea: {
    height: 64,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.regular,
    marginBottom: 18,
  },
  scheduleButton: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  scheduleButtonText: {
    fontSize: FontSizes.button,
    fontFamily: Typography.semiBold,
  },
});
