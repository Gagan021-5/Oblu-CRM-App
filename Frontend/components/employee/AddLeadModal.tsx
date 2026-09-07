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

interface AddLeadModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (leadData: {
    companyName: string;
    contactPerson: string;
    phone: string;
    estimatedValue: string;
    leadSource: "Referral" | "Website" | "Cold Call" | "LinkedIn" | "Exhibition";
  }) => void;
}

const SOURCES: Array<"Referral" | "Website" | "Cold Call" | "LinkedIn" | "Exhibition"> = [
  "Website",
  "Referral",
  "LinkedIn",
  "Cold Call",
  "Exhibition",
];

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const { colors, isDark } = useTheme();

  const [companyName, setCompanyName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [estimatedValue, setEstimatedValue] = useState("₹");
  const [source, setSource] = useState<
    "Referral" | "Website" | "Cold Call" | "LinkedIn" | "Exhibition"
  >("Website");

  const canSubmit =
    companyName.trim().length > 1 &&
    contactPerson.trim().length > 1 &&
    phone.trim().length > 5;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onCreate({
      companyName: companyName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      estimatedValue: estimatedValue.trim().length > 1 ? estimatedValue : "₹50,000",
      leadSource: source,
    });

    // Reset form
    setCompanyName("");
    setContactPerson("");
    setPhone("+91 ");
    setEstimatedValue("₹");
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
                  <Text
                    style={[
                      styles.title,
                      { color: isDark ? "#F1F7F4" : "#101513" },
                    ]}
                  >
                    Add Prospective Lead
                  </Text>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons
                      name="close"
                      size={22}
                      color={isDark ? "#8FA09A" : "#5E6964"}
                    />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Company Name */}
                  <Text style={[styles.fieldLabel, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                    Company / Organization *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                        borderColor: isDark ? "#294039" : "#D8E0DC",
                        color: isDark ? "#F1F7F4" : "#101513",
                      },
                    ]}
                    placeholder="e.g. Apex Global Logistics"
                    placeholderTextColor={isDark ? "#65756F" : "#87928D"}
                    value={companyName}
                    onChangeText={setCompanyName}
                  />

                  {/* Contact Person */}
                  <Text style={[styles.fieldLabel, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                    Contact Person Name *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                        borderColor: isDark ? "#294039" : "#D8E0DC",
                        color: isDark ? "#F1F7F4" : "#101513",
                      },
                    ]}
                    placeholder="e.g. Rajesh Kumar"
                    placeholderTextColor={isDark ? "#65756F" : "#87928D"}
                    value={contactPerson}
                    onChangeText={setContactPerson}
                  />

                  {/* Phone */}
                  <Text style={[styles.fieldLabel, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                    Phone Number *
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                        borderColor: isDark ? "#294039" : "#D8E0DC",
                        color: isDark ? "#F1F7F4" : "#101513",
                      },
                    ]}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={isDark ? "#65756F" : "#87928D"}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />

                  {/* Estimated Value */}
                  <Text style={[styles.fieldLabel, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                    Estimated Deal Value
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                        borderColor: isDark ? "#294039" : "#D8E0DC",
                        color: isDark ? "#F1F7F4" : "#101513",
                      },
                    ]}
                    placeholder="₹85,000"
                    placeholderTextColor={isDark ? "#65756F" : "#87928D"}
                    value={estimatedValue}
                    onChangeText={setEstimatedValue}
                  />

                  {/* Source Chips */}
                  <Text style={[styles.fieldLabel, { color: isDark ? "#8FA09A" : "#5E6964" }]}>
                    Lead Source
                  </Text>
                  <View style={styles.sourcesRow}>
                    {SOURCES.map((item) => {
                      const isSelected = source === item;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.sourceChip,
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
                          onPress={() => setSource(item)}
                        >
                          <Text
                            style={[
                              styles.sourceText,
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

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      {
                        backgroundColor: canSubmit
                          ? colors.primary
                          : isDark
                          ? "#1C2F29"
                          : "#D8E0DC",
                      },
                    ]}
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.submitBtnText,
                        {
                          color: canSubmit
                            ? isDark
                              ? "#080C0B"
                              : "#FFFFFF"
                            : isDark
                            ? "#65756F"
                            : "#87928D",
                        },
                      ]}
                    >
                      Create Lead
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
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: Typography.bold,
    letterSpacing: -0.3,
  },
  fieldLabel: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.semiBold,
    marginBottom: 6,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: FontSizes.body,
    fontFamily: Typography.regular,
  },
  sourcesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  sourceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  sourceText: {
    fontSize: FontSizes.bodySmall,
    fontFamily: Typography.medium,
  },
  submitBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  submitBtnText: {
    fontSize: FontSizes.button,
    fontFamily: Typography.semiBold,
  },
});
