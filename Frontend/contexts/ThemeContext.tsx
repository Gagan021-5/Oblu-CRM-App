/**
 * Theme Context for DealCall (NEXUS CRM Graphite Mint Design System)
 * Handles light, dark, and system follow modes with persistent storage.
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightTheme, DarkTheme, ThemeColors } from "@/constants/theme";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const STORAGE_KEY = "@calltracer_theme_mode";

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  isDark: true,
  colors: DarkTheme,
  setMode: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system") {
          setModeState(saved);
        }
      } catch {
        // Fallback to dark
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    // Non-blocking disk persistence so UI responds instantly
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const isDark = useMemo(() => {
    if (mode === "system") {
      return systemColorScheme === "dark";
    }
    return mode === "dark";
  }, [mode, systemColorScheme]);

  const colors = useMemo<ThemeColors>(() => {
    return isDark ? DarkTheme : LightTheme;
  }, [isDark]);

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors,
      setMode,
    }),
    [mode, isDark, colors, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
