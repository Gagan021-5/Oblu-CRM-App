import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { FloatingTabBar } from "@/components/employee/FloatingTabBar";

export default function EmployeeLayout() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "none",
        }}
      >
        <Stack.Screen name="index" options={{ animation: "none" }} />
        <Stack.Screen name="profile" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="customers/index" options={{ animation: "none" }} />
        <Stack.Screen name="customers/[customerId]" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="leads/index" options={{ animation: "none" }} />
        <Stack.Screen name="leads/[leadId]" options={{ animation: "slide_from_right" }} />
      </Stack>

      {/* Persistent Floating Bottom Navigation (Clean 4-tab dock) */}
      <FloatingTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
