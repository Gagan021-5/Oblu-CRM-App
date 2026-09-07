/**
 * Admin — Home Dashboard (NEXUS CRM Graphite Mint Design System)
 * Reproduces the reference dashboard composition:
 * 1. Header with contextual greeting, search, and notification bell with mint badge.
 * 2. Momentum card with large score 84, +12 vs last week, 7-day mint bar chart, 4 inline metrics.
 * 3. Today activity timeline with connecting line & status dots.
 * 4. Lead Radar visualization with circular grid, mint data points, and counts.
 * 5. Connected team member metrics & search.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Typography, FontSizes, Spacing, Radius, Shadows } from "@/constants/theme";

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  device_id: string | null;
  device_model: string | null;
  total_call_logs: number;
  last_call_timestamp?: string | null;
  date_joined: string;
}

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { isDark, colors } = useTheme();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [period, setPeriod] = useState<"This week" | "Last week">("This week");

  // Settings / Profile Modal
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPasswordConfirm, setEditPasswordConfirm] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Notifications State
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  // Fetch admin profile
  const fetchAdminProfile = useCallback(async () => {
    try {
      const resp = await api.get("/admin/profile/");
      if (resp.data.username) setEditUsername(resp.data.username);
      if (resp.data.email) setEditEmail(resp.data.email);
    } catch {
      //
    }
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/admin/users/");
      const data = response.data.results || response.data;
      setUsers(data);
    } catch {
      //
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminProfile();
    fetchUsers();
  }, [fetchAdminProfile, fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminProfile();
    fetchUsers();
  };

  const handleSaveSettings = async () => {
    if (!editUsername.trim()) {
      Alert.alert("Required", "Username cannot be empty.");
      return;
    }
    if (editPassword && editPassword !== editPasswordConfirm) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }
    setSavingSettings(true);
    try {
      const payload: Record<string, string> = {
        username: editUsername.trim(),
        email: editEmail.trim(),
      };
      if (editPassword) payload.password = editPassword;
      await api.patch("/admin/profile/", payload);
      Alert.alert("Success", "Profile updated successfully.");
      setSettingsVisible(false);
      setEditPassword("");
      setEditPasswordConfirm("");
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Failed to update profile.";
      Alert.alert("Error", msg);
    } finally {
      setSavingSettings(false);
    }
  };

  // Real aggregate stats
  const totalCalls = useMemo(() => {
    return users.reduce((acc, u) => acc + (u.total_call_logs || 0), 0);
  }, [users]);

  const activeAgents = useMemo(() => {
    return users.filter((u) => u.device_id).length;
  }, [users]);

  // Contextual greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { sub: "Good morning,", main: "Let's keep\nthe momentum." };
    if (hour < 18) return { sub: "Good afternoon,", main: "Keep driving\nthe pipeline." };
    return { sub: "Good evening,", main: "Momentum\nnever sleeps." };
  }, []);

  // Weekly bar data
  const weekBars = [
    { day: "Mon", height: 42, active: false },
    { day: "Tue", height: 58, active: false },
    { day: "Wed", height: 48, active: false },
    { day: "Thu", height: 75, active: false },
    { day: "Fri", height: 92, active: true },
    { day: "Sat", height: 110, active: true },
    { day: "Sun", height: 60, active: false },
  ];

  // Today activities
  const todayTimeline = [
    {
      time: "9:00 AM",
      completed: true,
      title: "Call — Acme Co.",
      desc: "Discovery call · 28m",
      onPress: () => router.push("/(admin)/call-logs"),
    },
    {
      time: "10:30 AM",
      completed: true,
      title: "Follow up — Nova Labs",
      desc: "Send proposal",
      onPress: () => router.push("/(admin)/leads"),
    },
    {
      time: "1:00 PM",
      completed: false,
      title: "Call — Frontier Health",
      desc: "Intro call",
      onPress: () => router.push("/(admin)/call-logs"),
    },
  ];

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16) + 90, // Leave room for floating dock
          paddingHorizontal: Spacing.screenPadding,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── 1. Header ────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
              {greeting.sub}
            </Text>
            <Text style={[styles.greetingMain, { color: colors.textPrimary }]}>
              {greeting.main}
            </Text>
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSearchVisible(!searchVisible)}
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="search-outline" size={19} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setNotificationsVisible(true)}
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons name="notifications-outline" size={19} color={colors.textPrimary} />
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar (if opened) */}
        {searchVisible && (
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search team members or calls..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── 2. Momentum Section ──────────────────────────────── */}
        <View
          style={[
            styles.momentumCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Card Top */}
          <View style={styles.momentumTopRow}>
            <Text style={[styles.momentumLabel, { color: colors.textPrimary }]}>
              Momentum
            </Text>
            <TouchableOpacity
              style={[
                styles.periodPill,
                {
                  backgroundColor: colors.secondarySurface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() =>
                setPeriod(period === "This week" ? "Last week" : "This week")
              }
            >
              <Text style={[styles.periodText, { color: colors.textSecondary }]}>
                {period}
              </Text>
              <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Large Score & Comparison */}
          <View style={styles.scoreRow}>
            <Text style={[styles.dominantScore, { color: colors.textPrimary }]}>
              84
            </Text>
            <View style={styles.comparisonBox}>
              <View style={styles.deltaRow}>
                <Text style={[styles.deltaIcon, { color: colors.primary }]}>▲</Text>
                <Text style={[styles.deltaText, { color: colors.primary }]}>+12</Text>
              </View>
              <Text style={[styles.deltaSub, { color: colors.textMuted }]}>
                vs last week
              </Text>
            </View>
          </View>

          {/* Vertical Bar Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.yAxis}>
              <Text style={[styles.axisText, { color: colors.textMuted }]}>120</Text>
              <Text style={[styles.axisText, { color: colors.textMuted }]}>60</Text>
              <Text style={[styles.axisText, { color: colors.textMuted }]}>0</Text>
            </View>

            <View style={styles.barsRow}>
              {weekBars.map((bar, i) => (
                <View key={bar.day} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${bar.height}%`,
                          backgroundColor: bar.active ? colors.brightMint : colors.primary,
                          opacity: bar.active ? 1 : 0.65,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.dayLabel, { color: colors.textMuted }]}>
                    {bar.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Supporting Insight Sentence */}
          <Text style={[styles.supportingSentence, { color: colors.textSecondary }]}>
            More calls. More conversations. More pipeline.
          </Text>

          {/* 4 Inline Metrics with Thin Dividers */}
          <View
            style={[
              styles.inlineMetricsContainer,
              {
                backgroundColor: colors.secondarySurface,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.metricBlock}>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {totalCalls > 0 ? totalCalls : 132}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Calls</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.metricBlock}>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>28</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Meetings</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.metricBlock}>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                {activeAgents > 0 ? activeAgents * 6 : 17}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>New leads</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.borderLight }]} />

            <View style={styles.metricBlock}>
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>$420K</Text>
              <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Pipeline</Text>
            </View>
          </View>
        </View>

        {/* ── 3. Today Section ─────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Today
            </Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push("/(admin)/call-logs")}
            >
              <Text style={[styles.viewAllText, { color: colors.textSecondary }]}>
                View all
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.todayTimelineSurface,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {todayTimeline.map((item, index) => {
              const isLast = index === todayTimeline.length - 1;
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={item.onPress}
                  style={styles.timelineRow}
                >
                  {/* Time Label */}
                  <Text style={[styles.timelineTime, { color: colors.textSecondary }]}>
                    {item.time}
                  </Text>

                  {/* Status Indicator & Connecting Line */}
                  <View style={styles.indicatorCol}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor: item.completed
                            ? colors.primary
                            : "transparent",
                          borderColor: item.completed
                            ? colors.primary
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {item.completed && (
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      )}
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.connectingLine,
                          { backgroundColor: colors.borderLight },
                        ]}
                      />
                    )}
                  </View>

                  {/* Activity Details */}
                  <View style={styles.activityInfo}>
                    <Text
                      style={[styles.activityTitle, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={[styles.activityDesc, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {item.desc}
                    </Text>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textMuted}
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── 4. Lead Radar Section ────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Lead Radar
            </Text>
            <View style={styles.radarLegend}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                High intent
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/leads")}
            style={[
              styles.radarCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Visual Radar Semicircle Grid */}
            <View style={styles.radarVisualContainer}>
              <View
                style={[
                  styles.radarCircleOuter,
                  {
                    borderColor: colors.borderLight,
                    backgroundColor: colors.mintTintedSurface,
                  },
                ]}
              >
                <View
                  style={[
                    styles.radarCircleMid,
                    { borderColor: colors.borderLight },
                  ]}
                >
                  <View
                    style={[
                      styles.radarCircleInner,
                      { borderColor: colors.borderLight },
                    ]}
                  />
                </View>

                {/* Radar Target Blips */}
                <View
                  style={[
                    styles.blip,
                    { top: 28, left: "32%", backgroundColor: colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.blip,
                    { top: 48, right: "28%", backgroundColor: colors.brightMint },
                  ]}
                />
                <View
                  style={[
                    styles.blip,
                    { bottom: 32, left: "48%", backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>

            {/* Radar Stage Counts */}
            <View style={styles.radarCountsList}>
              <View style={styles.radarCountRow}>
                <Text style={[styles.radarNumber, { color: colors.textPrimary }]}>
                  12
                </Text>
                <Text style={[styles.radarStageName, { color: colors.textSecondary }]}>
                  High intent
                </Text>
              </View>
              <View style={styles.radarCountRow}>
                <Text style={[styles.radarNumber, { color: colors.textPrimary }]}>
                  28
                </Text>
                <Text style={[styles.radarStageName, { color: colors.textSecondary }]}>
                  Warming
                </Text>
              </View>
              <View style={styles.radarCountRow}>
                <Text style={[styles.radarNumber, { color: colors.textPrimary }]}>
                  54
                </Text>
                <Text style={[styles.radarStageName, { color: colors.textSecondary }]}>
                  Early stage
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 5. Team Directory (Preserved Real Data) ──────────── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
              Sales Team ({filteredUsers.length})
            </Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => setSettingsVisible(true)}
            >
              <Text style={[styles.viewAllText, { color: colors.textSecondary }]}>
                Admin Settings
              </Text>
              <Ionicons name="settings-outline" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: 20 }}
            />
          ) : filteredUsers.length === 0 ? (
            <View
              style={[
                styles.emptyTeamCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.emptyTeamText, { color: colors.textMuted }]}>
                No team members found.
              </Text>
            </View>
          ) : (
            filteredUsers.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: "/(admin)/call-logs",
                    params: { user_id: item.id.toString(), username: item.username },
                  })
                }
                style={[
                  styles.teamMemberRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatarBox,
                    { backgroundColor: colors.mintTintedSurface },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {item.username.substring(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.teamMemberInfo}>
                  <Text
                    style={[styles.teamMemberName, { color: colors.textPrimary }]}
                  >
                    {item.username}
                  </Text>
                  <Text
                    style={[styles.teamMemberRole, { color: colors.textMuted }]}
                  >
                    {item.role === "admin" ? "Sales Director" : "Account Executive"} ·{" "}
                    {item.total_call_logs} calls
                  </Text>
                </View>

                <View style={styles.teamMemberRight}>
                  <View
                    style={[
                      styles.deviceChip,
                      {
                        backgroundColor: item.device_id
                          ? colors.mintTintedSurface
                          : colors.secondarySurface,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.deviceDot,
                        {
                          backgroundColor: item.device_id
                            ? colors.primary
                            : colors.textMuted,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.deviceText,
                        {
                          color: item.device_id
                            ? colors.primary
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {item.device_id ? "Active" : "Offline"}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textMuted}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Settings & Profile Modal ──────────────────────────── */}
      <Modal
        visible={settingsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSettingsVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Admin Settings
              </Text>
              <TouchableOpacity onPress={() => setSettingsVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  Username
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={editUsername}
                  onChangeText={setEditUsername}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  Email Address
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  New Password (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: colors.inputBg,
                      borderColor: colors.inputBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="Leave empty to keep current"
                  placeholderTextColor={colors.textMuted}
                  value={editPassword}
                  onChangeText={setEditPassword}
                  secureTextEntry
                />
              </View>

              {editPassword.length > 0 && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    Confirm New Password
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: colors.inputBorder,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={editPasswordConfirm}
                    onChangeText={setEditPasswordConfirm}
                    secureTextEntry
                  />
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                  savingSettings && { opacity: 0.6 },
                ]}
                onPress={handleSaveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Notification Sheet ────────────────────────────────── */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.notifSheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Notifications
              </Text>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.notifItem}>
              <View
                style={[
                  styles.notifIcon,
                  { backgroundColor: colors.mintTintedSurface },
                ]}
              >
                <Ionicons name="flash" size={16} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>
                  High Buying Intent Detected
                </Text>
                <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>
                  Orion Systems score increased to 92. Recommended call within 24h.
                </Text>
              </View>
            </View>

            <View style={styles.notifItem}>
              <View
                style={[
                  styles.notifIcon,
                  { backgroundColor: colors.secondarySurface },
                ]}
              >
                <Ionicons name="call" size={16} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.notifTitle, { color: colors.textPrimary }]}>
                  Call Log Sync Completed
                </Text>
                <Text style={[styles.notifDesc, { color: colors.textSecondary }]}>
                  All mobile activity updated successfully.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  greetingSub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
    letterSpacing: 0.1,
    marginBottom: 4,
  },
  greetingMain: {
    fontFamily: Typography.heading,
    fontSize: FontSizes.mainHeading,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  unreadDot: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
  },

  // Momentum Card
  momentumCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.sectionSpacing,
    ...Shadows.card,
  },
  momentumTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  momentumLabel: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.sectionTitle,
    letterSpacing: -0.2,
  },
  periodPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: 4,
  },
  periodText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
    marginBottom: 14,
  },
  dominantScore: {
    fontFamily: Typography.heading,
    fontSize: FontSizes.largeMetric,
    letterSpacing: -1.5,
    lineHeight: 64,
  },
  comparisonBox: {
    gap: 2,
  },
  deltaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  deltaIcon: {
    fontSize: 10,
  },
  deltaText: {
    fontFamily: Typography.bold,
    fontSize: FontSizes.bodySmall,
  },
  deltaSub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.caption,
  },

  // Vertical Bar Chart
  chartContainer: {
    flexDirection: "row",
    height: 110,
    alignItems: "flex-end",
    marginBottom: 14,
    paddingTop: 8,
  },
  yAxis: {
    justifyContent: "space-between",
    height: "100%",
    paddingRight: 10,
    paddingBottom: 22,
  },
  axisText: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.micro,
    textAlign: "right",
  },
  barsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "100%",
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
  },
  barTrack: {
    flex: 1,
    width: 7,
    justifyContent: "flex-end",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
  },
  dayLabel: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.micro,
    marginTop: 8,
  },
  supportingSentence: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
    letterSpacing: 0.1,
    marginBottom: Spacing.md,
  },

  // 4 Inline Metrics
  inlineMetricsContainer: {
    flexDirection: "row",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricBlock: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontFamily: Typography.headingSemi,
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  metricLabel: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.caption,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },

  // Today Section
  sectionWrap: {
    marginBottom: Spacing.sectionSpacing,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeading: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.sectionTitle,
    letterSpacing: -0.2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
  },
  todayTimelineSurface: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.card,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  timelineTime: {
    width: 68,
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
  },
  indicatorCol: {
    alignItems: "center",
    width: 24,
    marginRight: 10,
  },
  statusDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    zIndex: 2,
  },
  connectingLine: {
    position: "absolute",
    top: 18,
    bottom: -18,
    width: 1.5,
    zIndex: 1,
  },
  activityInfo: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.body,
  },
  activityDesc: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },
  chevron: {
    marginLeft: 8,
  },

  // Lead Radar
  radarLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
  },
  radarCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.card,
  },
  radarVisualContainer: {
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
  },
  radarCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  radarCircleMid: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  radarCircleInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
  },
  blip: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowColor: "#00A879",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  radarCountsList: {
    flex: 1,
    paddingLeft: 24,
    gap: 12,
  },
  radarCountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  radarNumber: {
    fontFamily: Typography.headingSemi,
    fontSize: 20,
    width: 28,
  },
  radarStageName: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.bodySmall,
  },

  // Team Directory
  emptyTeamCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
  },
  emptyTeamText: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
  },
  teamMemberRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: Typography.bold,
    fontSize: 13,
  },
  teamMemberInfo: {
    flex: 1,
    gap: 2,
  },
  teamMemberName: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.body,
  },
  teamMemberRole: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },
  teamMemberRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deviceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    gap: 5,
  },
  deviceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  deviceText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.caption,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.sectionTitle,
  },
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
    marginBottom: 6,
  },
  formInput: {
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
  },
  saveBtn: {
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  saveBtnText: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.button,
    color: "#FFFFFF",
  },

  // Notification Sheet
  notifSheet: {
    margin: 20,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  notifIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  notifTitle: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.bodySmall,
    marginBottom: 2,
  },
  notifDesc: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
    lineHeight: 16,
  },
});
