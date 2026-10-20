import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Radius, Shadows } from "@/constants/theme";

function FloatingBottomDock({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const bottomPad = Math.max(insets.bottom, 12);

  // Map route names to visual labels and icons (4 Clean Tabs: Home, Customers, Calls, More)
  const dockTabs = [
    {
      name: "users",
      label: "Home",
      iconActive: "home" as const,
      iconInactive: "home-outline" as const,
    },
    {
      name: "customers",
      label: "Customers",
      iconActive: "people" as const,
      iconInactive: "people-outline" as const,
    },
    {
      name: "call-logs",
      label: "Calls",
      iconActive: "call" as const,
      iconInactive: "call-outline" as const,
    },
    {
      name: "more",
      label: "More",
      iconActive: "grid" as const,
      iconInactive: "grid-outline" as const,
    },
  ];

  return (
    <View
      pointerEvents="box-none"
      style={[styles.dockWrapper, { bottom: bottomPad }]}
    >
      <View
        style={[
          styles.dockContainer,
          {
            backgroundColor: isDark ? "#0E1714" : "#18312A",
            borderColor: isDark ? "#294039" : "rgba(255, 255, 255, 0.12)",
          },
        ]}
      >
        {dockTabs.map((item) => {
          const routeIndex = state.routes.findIndex((r: any) => r.name === item.name);
          const isFocused = routeIndex !== -1 && state.index === routeIndex;

          const onPress = () => {
            const route = state.routes.find((r: any) => r.name === item.name);
            if (!route) return;
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const activeColor = isDark ? "#35D6A0" : "#20E3AD";
          const inactiveColor = "rgba(241, 247, 244, 0.55)";

          return (
            <TouchableOpacity
              key={item.name}
              activeOpacity={0.7}
              onPress={onPress}
              style={styles.dockItem}
            >
              <Ionicons
                name={isFocused ? item.iconActive : item.iconInactive}
                size={21}
                color={isFocused ? activeColor : inactiveColor}
              />
              <Text
                style={[
                  styles.dockLabel,
                  {
                    color: isFocused ? activeColor : inactiveColor,
                    fontFamily: isFocused ? Typography.semiBold : Typography.regular,
                  },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <FloatingBottomDock {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="users" options={{ title: "Home" }} />
      <Tabs.Screen name="customers" options={{ title: "Customers" }} />
      <Tabs.Screen name="call-logs" options={{ title: "Calls" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
      <Tabs.Screen name="leads" options={{ href: null }} />
      <Tabs.Screen name="stats" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 100,
  },
  dockContainer: {
    width: "100%",
    maxWidth: 420,
    height: 64,
    borderRadius: Radius.dock,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderWidth: 1,
    ...Shadows.floatingDock,
  },
  dockItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 3,
  },
  dockLabel: {
    fontSize: FontSizes.tabLabel,
    letterSpacing: 0.2,
  },
});
