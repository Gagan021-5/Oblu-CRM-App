/**
 * DealCall Employee Registration Screen
 * NEXUS CRM Graphite Mint Design System.
 * Supports selecting organizational role (Admin, Sales Mgr, Buss Mgr, HR, Accounts & Ops, Warehouse, RSM, ASM)
 * and displays live preview of the Yellow Box permissions associated with their view.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { router, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Typography, FontSizes, Spacing, Radius, Shadows } from "@/constants/theme";
import { getRoleAndUserDetails } from "@/data/rolesData";

interface RegistrationRoleOption {
  key: string;
  title: string;
  shortTitle: string;
  badgeColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
}

const REGISTRATION_ROLES: RegistrationRoleOption[] = [
  {
    key: "admin",
    title: "Admin (Executive Leadership)",
    shortTitle: "ADMIN",
    badgeColor: "#8B5CF6",
    icon: "shield-checkmark",
    subtitle: "Complete authority, stock req, audit logs, and dispatch overrides",
  },
  {
    key: "sales_mgr",
    title: "Sales Manager",
    shortTitle: "SALES MGR",
    badgeColor: "#3B82F6",
    icon: "trending-up",
    subtitle: "Commercial Sales & Growth, Incentive Review, Price (sales)",
  },
  {
    key: "buss_mgr",
    title: "Business Manager",
    shortTitle: "BUSS. MGR",
    badgeColor: "#0EA5E9",
    icon: "briefcase",
    subtitle: "Operations, Customer Edit, Credit Period, Requirement Logs",
  },
  {
    key: "hr",
    title: "HR (Human Resources)",
    shortTitle: "HR",
    badgeColor: "#EC4899",
    icon: "people",
    subtitle: "Talent Management, Inventory, Incentive Review, Req Logs",
  },
  {
    key: "accounts_ops",
    title: "Accounts & Operations",
    shortTitle: "ACCOUNTS & OPS",
    badgeColor: "#F59E0B",
    icon: "calculator",
    subtitle: "Payment Status Verification, Stock Requisition & Dispatch Release",
  },
  {
    key: "warehouse",
    title: "Warehouse & Logistics",
    shortTitle: "WAREHOUSE",
    badgeColor: "#78716C",
    icon: "cube",
    subtitle: "Physical Inventory & Proforma Invoice Dispatch Clearance",
  },
  {
    key: "rsm_ankush",
    title: "RSM (Ankush Unit)",
    shortTitle: "RSM (ANKUSH)",
    badgeColor: "#10B981",
    icon: "earth",
    subtitle: "Regional Sales (West & North), Individual Data & PI Creation",
  },
  {
    key: "rsm_aman",
    title: "RSM (Aman Unit)",
    shortTitle: "RSM (AMAN)",
    badgeColor: "#059669",
    icon: "compass",
    subtitle: "Regional Sales (East & South), Team Dashboard, Customer Transfer",
  },
  {
    key: "asm",
    title: "Area Sales Manager",
    shortTitle: "ASM",
    badgeColor: "#14B8A6",
    icon: "pin",
    subtitle: "Field Sales, Team Accounts, Customer Transfer, Incentive Reviews",
  },
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { colors, isDark } = useTheme();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("asm");
  const [selectedManager, setSelectedManager] = useState<string>("Ankush");
  const [loading, setLoading] = useState(false);

  // Active yellow box permissions lookup for preview
  const { role: previewRole } = getRoleAndUserDetails(selectedRole);

  const handleRegister = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();

    if (!trimmedUsername || !trimmedEmail || !password || !passwordConfirm) {
      Alert.alert("Required Fields", "Please complete all required fields.");
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert("Password Error", "Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Password Length", "Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await register({
        username: trimmedUsername,
        email: trimmedEmail,
        password,
        password_confirm: passwordConfirm,
        role: selectedRole,
        first_name: trimmedFullName || trimmedUsername,
        manager: selectedRole === "asm" ? selectedManager : undefined,
        device_model: Platform.OS === "android" ? "Android Phone" : "Mobile Device",
      });
      router.replace("/(employee)/profile" as any);
    } catch (error: any) {
      const data = error.response?.data;
      let msg = "Registration failed.";
      if (data) {
        const errors = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
          .join("\n");
        msg = errors || msg;
      }
      Alert.alert("Registration Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const topPadding = Math.max(insets.top, 24);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topPadding + 10,
            paddingBottom: Math.max(insets.bottom, 24) + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.pandaLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            Join Oblu Nexus
          </Text>
          <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
            Create your employee account with your designated role & access
          </Text>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.registerCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Full Name
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="id-card-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="e.g. Vikram Malhotra"
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Username
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Choose a username"
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Work Email
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="name@oblu.in"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Confirm Password
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  placeholder="Re-enter password"
                  placeholderTextColor={colors.textMuted}
                  value={passwordConfirm}
                  onChangeText={setPasswordConfirm}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Organizational Role Selector */}
            <View style={styles.roleSectionContainer}>
              <View style={styles.roleSectionHeader}>
                <Ionicons name="briefcase" size={16} color={isDark ? "#35D6A0" : "#00A879"} />
                <Text style={[styles.inputLabel, { color: colors.textPrimary, marginBottom: 0 }]}>
                  Designated Role & Access Level
                </Text>
              </View>
              <Text style={[styles.roleSectionHelper, { color: colors.textMuted }]}>
                Select your designated role from the organizational flowchart:
              </Text>

              <View style={styles.rolesGrid}>
                {REGISTRATION_ROLES.map((r) => {
                  const isSelected = selectedRole === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[
                        styles.roleCard,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? "rgba(20, 184, 166, 0.14)" : "rgba(20, 184, 166, 0.08)")
                            : (isDark ? "#121F1B" : "#F7FAF8"),
                          borderColor: isSelected
                            ? r.badgeColor
                            : (isDark ? "#294039" : "#D8E0DC"),
                        },
                      ]}
                      onPress={() => setSelectedRole(r.key)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.roleCardTop}>
                        <View
                          style={[
                            styles.roleIconBubble,
                            { backgroundColor: r.badgeColor + "22" },
                          ]}
                        >
                          <Ionicons name={r.icon} size={16} color={r.badgeColor} />
                        </View>
                        <View
                          style={[
                            styles.roleBadgePill,
                            {
                              backgroundColor: r.badgeColor + "20",
                              borderColor: r.badgeColor + "55",
                            },
                          ]}
                        >
                          <Text style={[styles.roleBadgePillText, { color: r.badgeColor }]}>
                            {r.shortTitle}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={[styles.selectedCheck, { backgroundColor: r.badgeColor }]}>
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          </View>
                        )}
                      </View>

                      <Text
                        style={[
                          styles.roleCardTitle,
                          {
                            color: isSelected
                              ? (isDark ? "#F1F7F4" : "#101513")
                              : colors.textPrimary,
                            fontFamily: isSelected ? Typography.bold : Typography.semiBold,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {r.title}
                      </Text>
                      <Text
                        style={[styles.roleCardSubtitle, { color: colors.textMuted }]}
                        numberOfLines={2}
                      >
                        {r.subtitle}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Reporting Manager Selector (If ASM is chosen) */}
            {selectedRole === "asm" && (
              <View
                style={[
                  styles.managerPickerBox,
                  {
                    backgroundColor: isDark ? "rgba(20, 184, 166, 0.08)" : "rgba(20, 184, 166, 0.05)",
                    borderColor: isDark ? "rgba(20, 184, 166, 0.40)" : "rgba(20, 184, 166, 0.35)",
                  },
                ]}
              >
                <View style={styles.managerHeaderRow}>
                  <Ionicons name="people-circle-outline" size={18} color="#14B8A6" />
                  <Text style={[styles.managerPickerTitle, { color: colors.textPrimary }]}>
                    Reporting Regional Sales Manager (RSM)
                  </Text>
                </View>
                <Text style={[styles.managerPickerSub, { color: colors.textMuted }]}>
                  According to the org chart, choose which RSM branch you belong to:
                </Text>

                <View style={styles.managerOptionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.managerOptionBtn,
                      {
                        backgroundColor: selectedManager === "Ankush"
                          ? "#10B981"
                          : (isDark ? "#0E1714" : "#FFFFFF"),
                        borderColor: selectedManager === "Ankush"
                          ? "#10B981"
                          : (isDark ? "#294039" : "#D8E0DC"),
                      },
                    ]}
                    onPress={() => setSelectedManager("Ankush")}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="earth"
                      size={14}
                      color={selectedManager === "Ankush" ? "#FFFFFF" : "#10B981"}
                    />
                    <Text
                      style={[
                        styles.managerOptionText,
                        {
                          color: selectedManager === "Ankush" ? "#FFFFFF" : colors.textPrimary,
                          fontFamily: selectedManager === "Ankush" ? Typography.bold : Typography.medium,
                        },
                      ]}
                    >
                      Ankush Oblu (RSM)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.managerOptionBtn,
                      {
                        backgroundColor: selectedManager === "Aman"
                          ? "#059669"
                          : (isDark ? "#0E1714" : "#FFFFFF"),
                        borderColor: selectedManager === "Aman"
                          ? "#059669"
                          : (isDark ? "#294039" : "#D8E0DC"),
                      },
                    ]}
                    onPress={() => setSelectedManager("Aman")}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="compass"
                      size={14}
                      color={selectedManager === "Aman" ? "#FFFFFF" : "#059669"}
                    />
                    <Text
                      style={[
                        styles.managerOptionText,
                        {
                          color: selectedManager === "Aman" ? "#FFFFFF" : colors.textPrimary,
                          fontFamily: selectedManager === "Aman" ? Typography.bold : Typography.medium,
                        },
                      ]}
                    >
                      Aman Poddar (RSM)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Live Role Access Preview Card (Yellow Box Specification) */}
            <View
              style={[
                styles.previewAccessCard,
                {
                  backgroundColor: isDark ? "rgba(245, 158, 11, 0.08)" : "#FEF8E7",
                  borderColor: isDark ? "rgba(245, 158, 11, 0.35)" : "rgba(245, 158, 11, 0.40)",
                },
              ]}
            >
              <View style={styles.previewAccessHeader}>
                <View style={styles.previewTagBadge}>
                  <Ionicons name="sparkles" size={12} color="#D97706" />
                  <Text style={styles.previewTagText}>YELLOW BOX ACCESS PREVIEW</Text>
                </View>
                <Text style={[styles.previewRoleTitle, { color: colors.textPrimary }]}>
                  View Privileges for {previewRole.shortTitle}
                </Text>
              </View>

              <View style={styles.previewBadgesWrap}>
                {previewRole.permissions.customerDashboard.enabled && (
                  <View style={styles.accessChip}>
                    <Ionicons name="people" size={13} color="#00A879" />
                    <Text style={styles.accessChipText}>
                      Dashboard: {previewRole.permissions.customerDashboard.scope}
                    </Text>
                  </View>
                )}

                {previewRole.permissions.performaInvoice.enabled && (
                  <View style={styles.accessChip}>
                    <Ionicons name="receipt" size={13} color="#F59E0B" />
                    <Text style={styles.accessChipText}>
                      PI: {previewRole.permissions.performaInvoice.features.join(", ")}
                    </Text>
                  </View>
                )}

                {previewRole.permissions.inventory.enabled && (
                  <View style={styles.accessChip}>
                    <Ionicons name="cube" size={13} color="#3B82F6" />
                    <Text style={styles.accessChipText}>
                      Inventory: {previewRole.permissions.inventory.label}
                    </Text>
                  </View>
                )}

                {previewRole.permissions.incentiveCall.enabled && (
                  <View style={styles.accessChip}>
                    <Ionicons name="cash" size={13} color="#10B981" />
                    <Text style={styles.accessChipText}>
                      IncentiveCall: {previewRole.permissions.incentiveCall.scope}
                    </Text>
                  </View>
                )}

                {previewRole.permissions.logs.enabled && (
                  <View style={styles.accessChip}>
                    <Ionicons name="list" size={13} color="#8B5CF6" />
                    <Text style={styles.accessChipText}>
                      Logs: {previewRole.permissions.logs.type}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Create Employee Account</Text>
              )}
            </TouchableOpacity>

            {/* Link to Login */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Already registered?{" "}
              </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  pandaLogo: {
    width: 64,
    height: 64,
  },
  brandTitle: {
    fontFamily: Typography.heading,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
    marginTop: 4,
    letterSpacing: 0.2,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  registerCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  form: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
  },
  eyeIcon: {
    padding: 4,
  },
  // Role selector section
  roleSectionContainer: {
    marginTop: 6,
    gap: 8,
  },
  roleSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  roleSectionHelper: {
    fontSize: 12,
    fontFamily: Typography.regular,
    marginTop: -2,
  },
  rolesGrid: {
    gap: 8,
    marginTop: 4,
  },
  roleCard: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 4,
  },
  roleCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  roleIconBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  roleBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  roleBadgePillText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    letterSpacing: 0.5,
  },
  selectedCheck: {
    marginLeft: "auto",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  roleCardTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  roleCardSubtitle: {
    fontSize: 11,
    fontFamily: Typography.regular,
    lineHeight: 15,
  },
  // Manager picker
  managerPickerBox: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
    marginTop: 2,
  },
  managerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  managerPickerTitle: {
    fontSize: 12,
    fontFamily: Typography.bold,
  },
  managerPickerSub: {
    fontSize: 11,
    fontFamily: Typography.regular,
    marginTop: -2,
  },
  managerOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  managerOptionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  managerOptionText: {
    fontSize: 12,
  },
  // Live preview card
  previewAccessCard: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  previewAccessHeader: {
    gap: 4,
  },
  previewTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  previewTagText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: "#D97706",
    letterSpacing: 0.5,
  },
  previewRoleTitle: {
    fontSize: 13,
    fontFamily: Typography.bold,
  },
  previewBadgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  accessChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accessChipText: {
    fontSize: 11,
    fontFamily: Typography.medium,
    color: "#374151",
  },
  // Submit & Footer
  submitButton: {
    height: 50,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
    ...Shadows.mintButton,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: Typography.bold,
    color: "#FFFFFF",
    fontSize: FontSizes.button,
    letterSpacing: 0.2,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  footerText: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
  },
  linkText: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.bodySmall,
  },
});
