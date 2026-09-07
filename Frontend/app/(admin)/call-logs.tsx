/**
 * Admin — Call History & Recorded Call Screen (NEXUS CRM Graphite Mint Design System)
 * Reproduces the fourth reference screen closely:
 * - Grouped call timeline (Today, Yesterday, Earlier) with all API calls and filters preserved.
 * - Tap any call to inspect the full "Recorded Call" analysis view:
 *   - Audio waveform with playhead and scrubber controls (-15s, Play, +15s, 1x).
 *   - Talk / Listen ratio split bar (You 46% vs Them 54%) with "Good balance" badge.
 *   - Sentiment trajectory chart with acid-lime "Peak interest at 21:14" marker.
 *   - AI insights numbered list.
 *   - "Create follow up task" mint action button.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Spacing, Radius, Shadows } from "@/constants/theme";

interface CallLogItem {
  id: number;
  user: number;
  username: string;
  phone_number: string;
  call_type: "incoming" | "outgoing" | "missed";
  duration: number;
  timestamp: string;
  synced_at: string;
}

type FilterType = "all" | "incoming" | "outgoing" | "missed";
type AnalysisTab = "Analysis" | "Transcript" | "Moments" | "Details";

export default function CallLogsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const params = useLocalSearchParams<{ user_id?: string; username?: string }>();

  const [logs, setLogs] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<FilterType>("all");
  const [searchPhone, setSearchPhone] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Recorded Call Modal
  const [selectedCall, setSelectedCall] = useState<CallLogItem | null>(null);
  const [activeTab, setActiveTab] = useState<AnalysisTab>("Analysis");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<"1x" | "1.5x" | "2x">("1x");

  const fetchLogs = useCallback(
    async (pageNum = 1, append = false) => {
      try {
        const queryParams: Record<string, string> = { page: pageNum.toString() };
        if (params.user_id) queryParams.user_id = params.user_id;
        const response = await api.get("/admin/call-logs/", { params: queryParams });
        const data = response.data;
        const results = data.results || data;
        const nextExists = !!data.next;
        if (append) {
          setLogs((prev) => [...prev, ...results]);
        } else {
          setLogs(results);
        }
        setHasMore(nextExists);
      } catch {
        // Handled silently
      } finally {
        setLoading(false);
      }
    },
    [params.user_id]
  );

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchLogs(1);
  }, [fetchLogs]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage, true);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchType = selectedType === "all" || log.call_type === selectedType;
      const matchSearch =
        !searchPhone.trim() ||
        log.phone_number.toLowerCase().includes(searchPhone.toLowerCase()) ||
        log.username.toLowerCase().includes(searchPhone.toLowerCase());
      return matchType && matchSearch;
    });
  }, [logs, selectedType, searchPhone]);

  // Group calls by Today, Yesterday, Earlier
  const groupedLogs = useMemo(() => {
    const today = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    const groups: { title: string; data: CallLogItem[] }[] = [
      { title: "Today", data: [] },
      { title: "Yesterday", data: [] },
      { title: "Earlier", data: [] },
    ];

    filteredLogs.forEach((item) => {
      const logDate = new Date(item.timestamp).toDateString();
      if (logDate === today) {
        groups[0].data.push(item);
      } else if (logDate === yesterday) {
        groups[1].data.push(item);
      } else {
        groups[2].data.push(item);
      }
    });

    return groups.filter((g) => g.data.length > 0);
  }, [filteredLogs]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return ts;
    }
  };

  // Waveform bars simulation
  const waveformHeights = [
    12, 24, 18, 32, 45, 28, 55, 38, 48, 62, 70, 52, 40, 65, 80, 50, 35, 60, 75,
    90, 68, 45, 58, 72, 85, 48, 30, 62, 78, 55, 42, 68, 50, 38, 25, 40, 30, 20,
    15, 10,
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top Bar ────────────────────────────────────────────── */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 14),
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <Text style={[styles.screenHeading, { color: colors.textPrimary }]}>
          Calls
        </Text>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Ionicons name="filter-outline" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search Bar ─────────────────────────────────────────── */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by contact, company or phone..."
            placeholderTextColor={colors.textMuted}
            value={searchPhone}
            onChangeText={setSearchPhone}
          />
          {searchPhone.length > 0 && (
            <TouchableOpacity onPress={() => setSearchPhone("")}>
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter Chips ───────────────────────────────────────── */}
      <View style={styles.filterChipsRow}>
        {(["all", "incoming", "outgoing", "missed"] as FilterType[]).map((type) => {
          const isSelected = selectedType === type;
          return (
            <TouchableOpacity
              key={type}
              activeOpacity={0.75}
              onPress={() => setSelectedType(type)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.borderLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected ? "#FFFFFF" : colors.textSecondary,
                    fontFamily: isSelected ? Typography.semiBold : Typography.regular,
                  },
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Call List Timeline ─────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredLogs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="call-outline" size={44} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            No Call Logs Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Sync calls or adjust your search filters.
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedLogs}
          keyExtractor={(item) => item.title}
          contentContainerStyle={{
            paddingHorizontal: Spacing.screenPadding,
            paddingBottom: Math.max(insets.bottom, 16) + 90, // Leave room for floating dock
          }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          renderItem={({ item: group }) => (
            <View style={styles.groupSection}>
              <Text style={[styles.groupHeader, { color: colors.textMuted }]}>
                {group.title}
              </Text>

              {group.data.map((log) => {
                const isIncoming = log.call_type === "incoming";
                const isMissed = log.call_type === "missed";
                const iconColor = isMissed
                  ? colors.error
                  : isIncoming
                  ? colors.primary
                  : colors.textSecondary;
                const iconName = isMissed
                  ? "close"
                  : isIncoming
                  ? "arrow-down"
                  : "arrow-up";

                return (
                  <TouchableOpacity
                    key={log.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedCall(log)}
                    style={[
                      styles.callRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    {/* Avatar */}
                    <View
                      style={[
                        styles.callAvatar,
                        { backgroundColor: colors.secondarySurface },
                      ]}
                    >
                      <Ionicons name={iconName} size={16} color={iconColor} />
                    </View>

                    {/* Details */}
                    <View style={styles.callDetails}>
                      <Text
                        style={[styles.callerName, { color: colors.textPrimary }]}
                        numberOfLines={1}
                      >
                        {log.username || log.phone_number}
                      </Text>
                      <Text
                        style={[styles.callMeta, { color: colors.textMuted }]}
                        numberOfLines={1}
                      >
                        {log.phone_number} · {formatDuration(log.duration)}
                      </Text>
                    </View>

                    {/* Time & Chevron */}
                    <View style={styles.callRight}>
                      <Text
                        style={[styles.callTimeText, { color: colors.textSecondary }]}
                      >
                        {formatTime(log.timestamp)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textMuted}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        />
      )}

      {/* ── 4. Recorded Call Analysis Modal (Screen 4 of Reference) ─ */}
      <Modal
        visible={!!selectedCall}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setSelectedCall(null)}
      >
        <View style={[styles.modalScreen, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View
            style={[
              styles.recordedHeader,
              {
                paddingTop: Math.max(insets.top, 14),
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setSelectedCall(null)}
              style={styles.navBtn}
            >
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text style={[styles.recordedTitle, { color: colors.textPrimary }]}>
              Recorded Call
            </Text>

            <TouchableOpacity style={styles.navBtn}>
              <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Spacing.screenPadding,
              paddingTop: Spacing.md,
              paddingBottom: Math.max(insets.bottom, 24) + 40,
            }}
          >
            {/* Company & Call Identity */}
            <View style={styles.recordCompanyRow}>
              <View
                style={[
                  styles.companyLogo,
                  {
                    backgroundColor: isDark ? "#182B25" : "#18312A",
                    borderColor: isDark ? "#294039" : "transparent",
                  },
                ]}
              >
                <Text style={styles.companyLogoLetter}>O</Text>
              </View>

              <View style={styles.companyTextWrap}>
                <Text style={[styles.recordCompanyName, { color: colors.textPrimary }]}>
                  {selectedCall?.username || "Orion Systems"}
                </Text>
                <Text style={[styles.recordCompanySub, { color: colors.textMuted }]}>
                  Discovery Call · May 14, 2025 ·{" "}
                  {selectedCall ? formatDuration(selectedCall.duration) : "28:17"}
                </Text>
              </View>
            </View>

            {/* Analysis Tabs */}
            <View style={[styles.tabsRow, { borderBottomColor: colors.borderLight }]}>
              {(["Analysis", "Transcript", "Moments", "Details"] as AnalysisTab[]).map(
                (tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setActiveTab(tab)}
                      style={[
                        styles.tabBtn,
                        isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          {
                            color: isActive ? colors.primary : colors.textMuted,
                            fontFamily: isActive ? Typography.semiBold : Typography.regular,
                          },
                        ]}
                      >
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            {/* Interactive Audio Waveform */}
            <View
              style={[
                styles.waveformCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {/* Bars */}
              <View style={styles.waveformContainer}>
                {waveformHeights.map((h, i) => {
                  const isPlayed = i < 18;
                  return (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        {
                          height: h,
                          backgroundColor: isPlayed ? colors.primary : colors.borderDark,
                          opacity: isPlayed ? 1 : 0.45,
                        },
                      ]}
                    />
                  );
                })}
                {/* Active Playhead */}
                <View
                  style={[styles.playheadLine, { left: "45%", backgroundColor: colors.acidLime }]}
                />
              </View>

              {/* Timestamps */}
              <View style={styles.waveTimeRow}>
                <Text style={[styles.waveTime, { color: colors.textMuted }]}>00:00</Text>
                <Text style={[styles.waveTime, { color: colors.textMuted }]}>
                  {selectedCall ? formatDuration(selectedCall.duration) : "28:17"}
                </Text>
              </View>

              {/* Scrubber Controls */}
              <View style={styles.scrubberRow}>
                <TouchableOpacity
                  style={styles.scrubBtn}
                  onPress={() => Alert.alert("Rewind", "Rewound 15s")}
                >
                  <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.scrubText, { color: colors.textMuted }]}>15</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setIsPlaying(!isPlaying)}
                  style={[
                    styles.playPauseBtn,
                    {
                      backgroundColor: colors.textPrimary,
                    },
                  ]}
                >
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={24}
                    color={colors.background}
                    style={{ marginLeft: isPlaying ? 0 : 2 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.scrubBtn}
                  onPress={() => Alert.alert("Forward", "Forwarded 15s")}
                >
                  <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.scrubText, { color: colors.textMuted }]}>15</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    setPlaybackSpeed(
                      playbackSpeed === "1x"
                        ? "1.5x"
                        : playbackSpeed === "1.5x"
                        ? "2x"
                        : "1x"
                    )
                  }
                  style={[
                    styles.speedPill,
                    { backgroundColor: colors.secondarySurface, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.speedText, { color: colors.textPrimary }]}>
                    {playbackSpeed}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Talk / Listen Section */}
            <View style={styles.talkListenSection}>
              <View style={styles.talkHeaderRow}>
                <Text style={[styles.talkTitle, { color: colors.textPrimary }]}>
                  Talk / Listen
                </Text>
                <View style={styles.balanceBadge}>
                  <View style={[styles.balanceDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.balanceText, { color: colors.textSecondary }]}>
                    Good balance
                  </Text>
                </View>
              </View>

              {/* Progress Split Bar */}
              <View style={styles.talkBarWrap}>
                <View
                  style={[
                    styles.talkBarLeft,
                    { width: "46%", backgroundColor: colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.talkBarRight,
                    { width: "54%", backgroundColor: isDark ? "#1B2B25" : "#18312A" },
                  ]}
                />
              </View>

              <View style={styles.talkLabelsRow}>
                <Text style={[styles.talkSub, { color: colors.textSecondary }]}>
                  You <Text style={{ color: colors.textPrimary, fontFamily: Typography.bold }}>46%</Text>
                </Text>
                <Text style={[styles.talkSub, { color: colors.textSecondary }]}>
                  Them <Text style={{ color: colors.textPrimary, fontFamily: Typography.bold }}>54%</Text>
                </Text>
              </View>
            </View>

            {/* Sentiment Trajectory Section */}
            <View style={styles.sentimentSection}>
              <View style={styles.sentimentHeaderRow}>
                <Text style={[styles.talkTitle, { color: colors.textPrimary }]}>
                  Sentiment
                </Text>
                {/* Acid Lime Tooltip */}
                <View
                  style={[
                    styles.peakBadge,
                    { backgroundColor: colors.acidLime },
                  ]}
                >
                  <Text style={styles.peakText}>Peak interest at 21:14</Text>
                </View>
              </View>

              <View
                style={[
                  styles.sentimentCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <View style={styles.sentimentYAxis}>
                  <Text style={[styles.sentAxisText, { color: colors.textMuted }]}>Positive</Text>
                  <Text style={[styles.sentAxisText, { color: colors.textMuted }]}>Neutral</Text>
                  <Text style={[styles.sentAxisText, { color: colors.textMuted }]}>Negative</Text>
                </View>

                {/* Trajectory Simulation Curve */}
                <View style={styles.sentimentGraph}>
                  <View style={[styles.sentGridLine, { top: "15%", borderColor: colors.borderLight }]} />
                  <View style={[styles.sentGridLine, { top: "50%", borderColor: colors.borderLight }]} />
                  <View style={[styles.sentGridLine, { top: "85%", borderColor: colors.borderLight }]} />

                  {/* Nodes along the curve */}
                  <View style={[styles.curvePoint, { left: "10%", top: "60%", backgroundColor: colors.primary }]} />
                  <View style={[styles.curvePoint, { left: "30%", top: "45%", backgroundColor: colors.primary }]} />
                  <View style={[styles.curvePoint, { left: "55%", top: "40%", backgroundColor: colors.primary }]} />
                  <View style={[styles.curvePoint, { left: "75%", top: "15%", backgroundColor: colors.acidLime, width: 10, height: 10 }]} />
                  <View style={[styles.curvePoint, { left: "90%", top: "25%", backgroundColor: colors.primary }]} />
                </View>
              </View>
              <View style={styles.sentTimeRow}>
                <Text style={[styles.sentTimeLabel, { color: colors.textMuted }]}>0m</Text>
                <Text style={[styles.sentTimeLabel, { color: colors.textMuted }]}>7m</Text>
                <Text style={[styles.sentTimeLabel, { color: colors.textMuted }]}>14m</Text>
                <Text style={[styles.sentTimeLabel, { color: colors.textMuted }]}>21m</Text>
                <Text style={[styles.sentTimeLabel, { color: colors.textMuted }]}>28m</Text>
              </View>
            </View>

            {/* AI Insights Section */}
            <View style={styles.aiInsightsSection}>
              <View style={styles.aiHeaderRow}>
                <View
                  style={[
                    styles.aiSparkIcon,
                    { backgroundColor: colors.mintTintedSurface },
                  ]}
                >
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.aiTitle, { color: colors.textPrimary }]}>
                    AI insights
                  </Text>
                  <Text style={[styles.aiSub, { color: colors.textMuted }]}>
                    Generated from call analysis
                  </Text>
                </View>
              </View>

              {/* Numbered Insights */}
              <View style={styles.insightsList}>
                <View
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.numCircle,
                      { backgroundColor: colors.secondarySurface },
                    ]}
                  >
                    <Text style={[styles.numText, { color: colors.textPrimary }]}>1</Text>
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightHeading, { color: colors.textPrimary }]}>
                      Strong interest in Q2 rollout
                    </Text>
                    <Text style={[styles.insightDesc, { color: colors.textMuted }]}>
                      Confirmed budget and internal alignment.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>

                <View
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.numCircle,
                      { backgroundColor: colors.secondarySurface },
                    ]}
                  >
                    <Text style={[styles.numText, { color: colors.textPrimary }]}>2</Text>
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightHeading, { color: colors.textPrimary }]}>
                      Security and data residency are key concerns
                    </Text>
                    <Text style={[styles.insightDesc, { color: colors.textMuted }]}>
                      Send security overview and compliance docs.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>

                <View
                  style={[
                    styles.insightCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.numCircle,
                      { backgroundColor: colors.secondarySurface },
                    ]}
                  >
                    <Text style={[styles.numText, { color: colors.textPrimary }]}>3</Text>
                  </View>
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightHeading, { color: colors.textPrimary }]}>
                      Next step
                    </Text>
                    <Text style={[styles.insightDesc, { color: colors.textMuted }]}>
                      Send custom proposal by end of week.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </View>
            </View>

            {/* Create Follow-up Task Action */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Alert.alert("Success", "Follow-up task created and synced.");
              }}
              style={[
                styles.createTaskBtn,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
              <Text style={styles.createTaskText}>Create follow up task</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  screenHeading: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.screenTitle,
    letterSpacing: -0.2,
  },
  topBarRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchSection: {
    paddingHorizontal: Spacing.screenPadding,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
  },
  filterChipsRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.screenPadding,
    gap: 8,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: FontSizes.label,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.sectionTitle,
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
    textAlign: "center",
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeader: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.label,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  callRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  callAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  callDetails: {
    flex: 1,
    gap: 2,
  },
  callerName: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.body,
  },
  callMeta: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },
  callRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  callTimeText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
  },

  // Recorded Call Modal Styles
  modalScreen: {
    flex: 1,
  },
  recordedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  recordedTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.screenTitle,
    letterSpacing: -0.2,
  },
  recordCompanyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  companyLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  companyLogoLetter: {
    fontFamily: Typography.bold,
    fontSize: 18,
    color: "#20E3AD",
  },
  companyTextWrap: {
    flex: 1,
    gap: 2,
  },
  recordCompanyName: {
    fontFamily: Typography.headingSemi,
    fontSize: 18,
    letterSpacing: -0.2,
  },
  recordCompanySub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  tabBtn: {
    paddingVertical: 10,
    marginRight: 20,
  },
  tabText: {
    fontSize: FontSizes.bodySmall,
  },

  // Waveform
  waveformCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: 24,
    ...Shadows.card,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 80,
    position: "relative",
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
  },
  playheadLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  waveTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  waveTime: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.caption,
  },
  scrubberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  scrubBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  scrubText: {
    fontSize: 9,
    fontFamily: Typography.bold,
    marginTop: -4,
  },
  playPauseBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  speedText: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.caption,
  },

  // Talk / Listen
  talkListenSection: {
    marginBottom: 24,
  },
  talkHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  talkTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.sectionTitle,
    letterSpacing: -0.2,
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  balanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  balanceText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
  },
  talkBarWrap: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  talkBarLeft: {
    height: "100%",
  },
  talkBarRight: {
    height: "100%",
  },
  talkLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  talkSub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },

  // Sentiment
  sentimentSection: {
    marginBottom: 24,
  },
  sentimentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  peakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  peakText: {
    fontFamily: Typography.bold,
    fontSize: FontSizes.micro,
    color: "#101513",
  },
  sentimentCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    height: 100,
    ...Shadows.card,
  },
  sentimentYAxis: {
    justifyContent: "space-between",
    paddingRight: 10,
    width: 60,
  },
  sentAxisText: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.micro,
  },
  sentimentGraph: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
  },
  sentGridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderStyle: "dashed",
  },
  curvePoint: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sentTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 60,
    marginTop: 6,
  },
  sentTimeLabel: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.micro,
  },

  // AI Insights
  aiInsightsSection: {
    marginBottom: 24,
  },
  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  aiSparkIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  aiTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.sectionTitle,
    letterSpacing: -0.2,
  },
  aiSub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.caption,
  },
  insightsList: {
    gap: 8,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 12,
    ...Shadows.card,
  },
  numCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  numText: {
    fontFamily: Typography.bold,
    fontSize: FontSizes.caption,
  },
  insightContent: {
    flex: 1,
    gap: 2,
  },
  insightHeading: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.bodySmall,
  },
  insightDesc: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.caption,
  },

  // Create Follow up task
  createTaskBtn: {
    height: 50,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    ...Shadows.mintButton,
  },
  createTaskText: {
    fontFamily: Typography.bold,
    fontSize: FontSizes.button,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
