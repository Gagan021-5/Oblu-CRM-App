/**
 * User stack layout — consent and status screens.
 */

import { Stack } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function UserLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "none",
      }}
    />
  );
}
