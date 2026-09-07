/**
 * App entry point — role-based redirect.
 *
 * Unauthenticated → Login
 * role='admin'    → Admin dashboard
 * role='user'     → Check consent → Consent screen or Status screen
 */

import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Index() {
  const { user, isLoading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) return;

    (async () => {
      if (!user) {
        router.replace("/(auth)/login");
        return;
      }

      if (user.role === "admin") {
        router.replace("/(admin)/users");
        return;
      }

      // User role — direct to Employee Workspace Dashboard (Customers, Leads, Call Tracker)
      router.replace("/(employee)");
    })();
  }, [user, isLoading]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
