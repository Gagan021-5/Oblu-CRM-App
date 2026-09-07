/**
 * Auth stack layout — shared styling for login/register screens.
 */

import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0E1A" },
        animation: "slide_from_right",
      }}
    />
  );
}
