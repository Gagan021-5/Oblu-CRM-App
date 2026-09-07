/**
 * Login Screen — NEXUS CRM Graphite Mint Design System.
 * All auth logic and API calls preserved exactly.
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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { colors, isDark } = useTheme();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Required Fields", "Please enter both your username and password.");
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(username.trim(), password);
      if (loggedUser?.role === "admin") {
        router.replace("/(admin)/users");
      } else {
        router.replace("/(user)/status");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Login failed. Please check your credentials and connection.";
      Alert.alert("Sign In Failed", msg);
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
            paddingTop: topPadding + 20,
            paddingBottom: Math.max(insets.bottom, 24) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.pandaLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
            Oblu Nexus
          </Text>
          <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
            High-Performance Calling & Pipeline
          </Text>
        </View>

        {/* Login Card */}
        <View
          style={[
            styles.loginCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Sign In
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            Access your sales dashboard and call logs
          </Text>

          <View style={styles.form}>
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
                  placeholder="Enter your username"
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={setUsername}
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
                  placeholder="Enter your password"
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && styles.buttonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                Don't have an account?{" "}
              </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={[styles.linkText, { color: colors.primary }]}>
                    Register
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>

            {/* Demo Workspace Link */}
            <TouchableOpacity
              style={{
                marginTop: 20,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: "center",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: isDark ? "rgba(53, 214, 160, 0.35)" : "rgba(0, 168, 121, 0.35)",
                backgroundColor: isDark ? "rgba(53, 214, 160, 0.10)" : "#DDF4EA",
              }}
              onPress={() => router.push("/(employee)" as any)}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13, fontFamily: Typography.semiBold, color: isDark ? "#35D6A0" : "#00A879" }}>
                🚀 Launch Employee Workspace (Demo)
              </Text>
            </TouchableOpacity>
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
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: Radius.lg,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  pandaLogo: {
    width: 68,
    height: 68,
  },
  brandTitle: {
    fontFamily: Typography.heading,
    fontSize: 26,
    letterSpacing: -0.6,
  },
  brandSubtitle: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
    marginTop: 4,
    letterSpacing: 0.2,
  },
  loginCard: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xxl,
    ...Shadows.card,
  },
  cardTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
    marginTop: 4,
    marginBottom: Spacing.xxl,
  },
  form: {
    gap: Spacing.lg,
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
    height: 50,
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
    marginTop: Spacing.sm,
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
