/**
 * Admin Tab Layout — NEXUS CRM Floating Dock Navigation
 * Floating dock matching the Graphite Mint reference:
 * [Home] [Leads] [+] [Calls] [More]
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { Tabs, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Radius, Shadows } from "@/constants/theme";

interface QuickAction {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function FloatingBottomDock({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const [quickCreateVisible, setQuickCreateVisible] = useState(false);

  const bottomPad = Math.max(insets.bottom, 12);

  // Map route names to visual labels and icons
  const dockTabs = [
    {
      name: "users",
      label: "Home",
      iconActive: "home" as const,
      iconInactive: "home-outline" as const,
    },
    {
      name: "leads",
      label: "Leads",
      iconActive: "people" as const,
      iconInactive: "people-outline" as const,
    },
    {
      isCenter: true,
      name: "__create__",
      label: "Add",
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

  const quickActions: QuickAction[] = [
    {
      icon: "flash",
      title: "New Lead Signal",
      subtitle: "Add target company & evaluate intent score",
      onPress: () => {
        setQuickCreateVisible(false);
        router.push("/(admin)/leads");
      },
    },
    {
      icon: "call",
      title: "Log Activity / Call",
      subtitle: "Track outreach, notes & customer call",
      onPress: () => {
        setQuickCreateVisible(false);
        router.push("/(admin)/call-logs");
      },
    },
    {
      icon: "business",
      title: "Add Client Profile",
      subtitle: "Register company into directory",
      onPress: () => {
        setQuickCreateVisible(false);
        router.push("/(admin)/customers");
      },
    },
  ];

  return (
    <>
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
          {dockTabs.map((item, idx) => {
            if (item.isCenter) {
              return (
                <TouchableOpacity
                  key="__center_create__"
                  activeOpacity={0.85}
                  onPress={() => setQuickCreateVisible(true)}
                  style={[
                    styles.centerButton,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                    },
                  ]}
                >
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              );
            }

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

      {/* Quick Action Modal */}
      <Modal
        visible={quickCreateVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuickCreateVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setQuickCreateVisible(false)}
        >
          <View
            style={[
              styles.quickCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                bottom: bottomPad + 76,
              },
            ]}
          >
            <View style={styles.quickHeader}>
              <Text style={[styles.quickTitle, { color: colors.textPrimary }]}>
                Quick Actions
              </Text>
              <TouchableOpacity onPress={() => setQuickCreateVisible(false)}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={action.onPress}
                style={[
                  styles.quickRow,
                  {
                    borderBottomColor: colors.borderLight,
                    borderBottomWidth: index === quickActions.length - 1 ? 0 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.quickIconBox,
                    { backgroundColor: colors.mintTintedSurface },
                  ]}
                >
                  <Ionicons name={action.icon} size={20} color={colors.primary} />
                </View>
                <View style={styles.quickTextWrap}>
                  <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>
                    {action.title}
                  </Text>
                  <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                    {action.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
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
      <Tabs.Screen name="leads" options={{ title: "Leads" }} />
      <Tabs.Screen name="call-logs" options={{ title: "Calls" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
      <Tabs.Screen name="customers" options={{ href: null }} />
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
  centerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  quickCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    position: "absolute",
    ...Shadows.floatingDock,
  },
  quickHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.15)",
  },
  quickTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.sectionTitle,
  },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  quickIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  quickTextWrap: {
    flex: 1,
  },
  quickActionTitle: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.body,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },
});
