import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Shadows } from "@/constants/theme";

interface FloatingTabBarProps {
  onQuickActionPress: () => void;
}

const FloatingTabBarComponent: React.FC<FloatingTabBarProps> = ({
  onQuickActionPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const pathname = usePathname();

  // Route active checks
  const isHome =
    pathname === "/(employee)" ||
    pathname === "/(employee)/" ||
    pathname === "/" ||
    pathname === "/index" ||
    pathname === "";
  const isCustomers = pathname.includes("customers");
  const isLeads = pathname.includes("leads");
  const isCalls =
    pathname.includes("status") ||
    pathname.includes("(user)") ||
    pathname.includes("calls");

  const navItems = [
    {
      key: "home",
      label: "Home",
      iconActive: "home" as const,
      iconInactive: "home-outline" as const,
      isActive: isHome,
      onPress: () => {
        if (!isHome) {
          router.replace("/(employee)" as any);
        }
      },
    },
    {
      key: "customers",
      label: "Customers",
      iconActive: "people" as const,
      iconInactive: "people-outline" as const,
      isActive: isCustomers,
      onPress: () => {
        if (!isCustomers) {
          router.replace("/(employee)/customers" as any);
        }
      },
    },
  ];

  const navItemsRight = [
    {
      key: "leads",
      label: "Leads",
      iconActive: "trending-up" as const,
      iconInactive: "trending-up-outline" as const,
      isActive: isLeads,
      onPress: () => {
        if (!isLeads) {
          router.replace("/(employee)/leads" as any);
        }
      },
    },
    {
      key: "calls",
      label: "Calls",
      iconActive: "call" as const,
      iconInactive: "call-outline" as const,
      isActive: isCalls,
      onPress: () => {
        if (!isCalls) {
          router.replace({ pathname: "/(user)/status", params: { from: "workspace" } } as any);
        }
      },
    },
  ];

  const bottomOffset = Math.max(insets.bottom, 12);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.dockWrapper,
        {
          bottom: bottomOffset,
        },
      ]}
    >
      <View
        style={[
          styles.dockContainer,
          {
            backgroundColor: isDark ? "#0C1411" : "#121A16",
            borderColor: isDark
              ? "rgba(53, 214, 160, 0.22)"
              : "rgba(255, 255, 255, 0.12)",
          },
          Shadows.floatingDock,
        ]}
      >
        {/* Left 2 items */}
        {navItems.map((item) => {
          const color = item.isActive
            ? isDark
              ? "#35D6A0"
              : "#19C997"
            : "#8FA09A";
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabButton}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.isActive ? item.iconActive : item.iconInactive}
                size={20}
                color={color}
              />
              <Text style={[styles.tabLabel, { color }]}>{item.label}</Text>
              {item.isActive && (
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: isDark ? "#35D6A0" : "#19C997" },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Center Quick Action Button */}
        <TouchableOpacity
          style={[
            styles.centerButton,
            {
              backgroundColor: isDark ? "#35D6A0" : "#00A879",
            },
            Shadows.mintButton,
          ]}
          onPress={onQuickActionPress}
          activeOpacity={0.85}
        >
          <Ionicons
            name="add"
            size={26}
            color={isDark ? "#080C0B" : "#FFFFFF"}
          />
        </TouchableOpacity>

        {/* Right 2 items */}
        {navItemsRight.map((item) => {
          const color = item.isActive
            ? isDark
              ? "#35D6A0"
              : "#19C997"
            : "#8FA09A";
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabButton}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.isActive ? item.iconActive : item.iconInactive}
                size={20}
                color={color}
              />
              <Text style={[styles.tabLabel, { color }]}>{item.label}</Text>
              {item.isActive && (
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: isDark ? "#35D6A0" : "#19C997" },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const FloatingTabBar = React.memo(FloatingTabBarComponent);

const styles = StyleSheet.create({
  dockWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  dockContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 32,
    borderWidth: 1,
    width: "92%",
    maxWidth: 380,
    height: 64,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
  },
  tabLabel: {
    fontSize: FontSizes.tabLabel,
    fontFamily: Typography.medium,
    marginTop: 2,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  centerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
});
