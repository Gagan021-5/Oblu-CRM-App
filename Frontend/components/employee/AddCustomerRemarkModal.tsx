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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

interface AddCustomerRemarkModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (remarkText: string) => void;
  customerName?: string;
}

export const AddCustomerRemarkModal: React.FC<AddCustomerRemarkModalProps> = ({
  visible,
  onClose,
  onSave,
  customerName,
}) => {
  const { colors, isDark } = useTheme();
  const [text, setText] = useState("");

  const handleSave = () => {
    if (!text.trim()) return;
    onSave(text.trim());
    setText("");
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
                      Add Remark
                    </Text>
                    {customerName && (
                      <Text
                        style={[
                          styles.subtitle,
                          { color: isDark ? "#8FA09A" : "#5E6964" },
                        ]}
                      >
                        for {customerName}
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

                {/* Input Area */}
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: isDark ? "#121F1B" : "#F7F9F8",
                      borderColor: isDark ? "#294039" : "#D8E0DC",
                      color: isDark ? "#F1F7F4" : "#101513",
                    },
                  ]}
                  placeholder="Record customer notes, discussion points, or next steps..."
                  placeholderTextColor={isDark ? "#65756F" : "#87928D"}
                  multiline
                  numberOfLines={4}
                  value={text}
                  onChangeText={setText}
                  textAlignVertical="top"
                />

                {/* Save Button */}
                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    {
                      backgroundColor: text.trim()
                        ? colors.primary
                        : isDark
                        ? "#1C2F29"
                        : "#D8E0DC",
                    },
                  ]}
                  onPress={handleSave}
                  disabled={!text.trim()}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.saveButtonText,
                      {
                        color: text.trim()
                          ? isDark
                            ? "#080C0B"
                            : "#FFFFFF"
                          : isDark
                          ? "#65756F"
                          : "#87928D",
                      },
                    ]}
                  >
                    Save Remark
                  </Text>
                </TouchableOpacity>
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
  textArea: {
    height: 110,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    fontSize: FontSizes.body,
    fontFamily: Typography.regular,
    marginBottom: 18,
  },
  saveButton: {
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: FontSizes.button,
    fontFamily: Typography.semiBold,
  },
});
