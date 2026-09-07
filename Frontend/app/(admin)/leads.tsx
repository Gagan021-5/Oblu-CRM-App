/**
 * Admin — Lead Signal Screen (NEXUS CRM Graphite Mint Design System)
 * Reproduces the second reference screen closely:
 * - Back button, centered "Lead Signal" title, more-options button.
 * - High-intent badge, company identity (Orion Systems), intent score 92.
 * - Strategy quote, evaluation chips (Budget, Authority, Timeline).
 * - Buying intent signals (4 signal rows with strength bars).
 * - Pipeline position arrow chevrons (Lead -> Discovery -> Demo -> Proposal -> Close).
 * - Next-best-action panel in dark graphite with acid-lime lightning bolt & "Start call" button.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes, Spacing, Radius, Shadows } from "@/constants/theme";

interface LeadData {
  id: string;
  name: string;
  industry: string;
  size: string;
  score: number;
  updated: string;
  quote: string;
  budget: string;
  authority: string;
  timeline: string;
  stage: "Lead" | "Discovery" | "Demo" | "Proposal" | "Close";
  phone: string;
}

const SAMPLE_LEADS: LeadData[] = [
  {
    id: "1",
    name: "Orion Systems",
    industry: "IT Infrastructure",
    size: "500–1,000 employees",
    score: 92,
    updated: "Updated 12m ago",
    quote: '"Actively evaluating CRM solutions for Q2 rollout."',
    budget: "High",
    authority: "Strong",
    timeline: "Q2",
    stage: "Discovery",
    phone: "+1 (555) 019-2834",
  },
  {
    id: "2",
    name: "Acme Dynamics",
    industry: "Enterprise SaaS",
    size: "200–500 employees",
    score: 87,
    updated: "Updated 1h ago",
    quote: '"Looking to consolidate multi-channel outbound calling."',
    budget: "High",
    authority: "Moderate",
    timeline: "Immediate",
    stage: "Demo",
    phone: "+1 (555) 392-1082",
  },
  {
    id: "3",
    name: "Nova Labs",
    industry: "HealthTech AI",
    size: "100–250 employees",
    score: 79,
    updated: "Updated 3h ago",
    quote: '"Compliance and audit-ready call tracking required."',
    budget: "Moderate",
    authority: "Strong",
    timeline: "Q3",
    stage: "Proposal",
    phone: "+1 (555) 441-9923",
  },
];

export default function LeadsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const [selectedLead, setSelectedLead] = useState<LeadData>(SAMPLE_LEADS[0]);
  const [leadPickerVisible, setLeadPickerVisible] = useState(false);

  const stages: Array<LeadData["stage"]> = [
    "Lead",
    "Discovery",
    "Demo",
    "Proposal",
    "Close",
  ];

  const handleStartCall = () => {
    Alert.alert(
      "Start Outreach Call",
      `Dial ${selectedLead.name} at ${selectedLead.phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Now",
          onPress: () => {
            Linking.openURL(`tel:${selectedLead.phone}`).catch(() => {
              Alert.alert("Dialer Error", "Unable to launch mobile dialer.");
            });
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Top App Bar ────────────────────────────────────────── */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 14),
            borderBottomColor: colors.borderLight,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.navBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setLeadPickerVisible(true)}
          style={styles.titleWrap}
        >
          <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>
            Lead Signal
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setLeadPickerVisible(true)}
          style={styles.navBtn}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenPadding,
          paddingTop: Spacing.md,
          paddingBottom: Math.max(insets.bottom, 16) + 100, // Safe room for floating dock
        }}
      >
        {/* ── Header Badge Row ─────────────────────────────────── */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.highIntentBadge,
              {
                backgroundColor: colors.mintTintedSurface,
                borderColor: colors.primaryBorder,
              },
            ]}
          >
            <Text style={styles.flameIcon}>🔥</Text>
            <Text style={[styles.highIntentText, { color: colors.primary }]}>
              High intent
            </Text>
          </View>
          <Text style={[styles.updatedText, { color: colors.textMuted }]}>
            {selectedLead.updated}
          </Text>
        </View>

        {/* ── Company Identity & Intent Score ──────────────────── */}
        <View style={styles.companyRow}>
          <View style={styles.companyLeft}>
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

            <View style={styles.companyText}>
              <Text style={[styles.companyName, { color: colors.textPrimary }]}>
                {selectedLead.name}
              </Text>
              <Text style={[styles.companySub, { color: colors.textSecondary }]}>
                {selectedLead.industry} · {selectedLead.size}
              </Text>
            </View>
          </View>

          <View style={styles.scoreCol}>
            <Text style={[styles.intentScoreNum, { color: colors.primary }]}>
              {selectedLead.score}
            </Text>
            <Text style={[styles.intentScoreLabel, { color: colors.textMuted }]}>
              Intent score
            </Text>
          </View>
        </View>

        {/* ── Strategic Quote ──────────────────────────────────── */}
        <Text style={[styles.quoteText, { color: colors.textPrimary }]}>
          {selectedLead.quote}
        </Text>

        {/* ── Evaluation Chips ─────────────────────────────────── */}
        <View style={styles.evalChipsRow}>
          <View
            style={[
              styles.evalChip,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Text style={[styles.chipKey, { color: colors.textSecondary }]}>
              Budget
            </Text>
            <Text style={[styles.chipVal, { color: colors.primary }]}>
              {selectedLead.budget}
            </Text>
          </View>

          <View
            style={[
              styles.evalChip,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Text style={[styles.chipKey, { color: colors.textSecondary }]}>
              Authority
            </Text>
            <Text style={[styles.chipVal, { color: colors.primary }]}>
              {selectedLead.authority}
            </Text>
          </View>

          <View
            style={[
              styles.evalChip,
              {
                backgroundColor: colors.card,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Text style={[styles.chipKey, { color: colors.textSecondary }]}>
              Timeline
            </Text>
            <Text style={[styles.chipVal, { color: colors.textPrimary }]}>
              {selectedLead.timeline}
            </Text>
          </View>
        </View>

        {/* ── Buying Intent Signals ────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Buying intent
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Signals from 12 sources
          </Text>
        </View>

        <View
          style={[
            styles.signalsContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Signal 1 */}
          <View style={styles.signalRow}>
            <View
              style={[
                styles.signalIconBox,
                { backgroundColor: colors.secondarySurface },
              ]}
            >
              <Ionicons name="globe-outline" size={17} color={colors.primary} />
            </View>
            <View style={styles.signalDetails}>
              <Text style={[styles.signalTitle, { color: colors.textPrimary }]}>
                Visited pricing page
              </Text>
              <Text style={[styles.signalDesc, { color: colors.textMuted }]}>
                3 times in last 7 days
              </Text>
            </View>
            <View style={styles.signalStrengthCol}>
              <View style={styles.signalBars}>
                <View style={[styles.bar, { height: 6, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 9, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 12, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 15, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.strengthText, { color: colors.primary }]}>High</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Signal 2 */}
          <View style={styles.signalRow}>
            <View
              style={[
                styles.signalIconBox,
                { backgroundColor: colors.secondarySurface },
              ]}
            >
              <Ionicons name="people-outline" size={17} color={colors.primary} />
            </View>
            <View style={styles.signalDetails}>
              <Text style={[styles.signalTitle, { color: colors.textPrimary }]}>
                Multiple stakeholders
              </Text>
              <Text style={[styles.signalDesc, { color: colors.textMuted }]}>
                4 people from same company
              </Text>
            </View>
            <View style={styles.signalStrengthCol}>
              <View style={styles.signalBars}>
                <View style={[styles.bar, { height: 6, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 9, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 12, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 15, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.strengthText, { color: colors.primary }]}>High</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Signal 3 */}
          <View style={styles.signalRow}>
            <View
              style={[
                styles.signalIconBox,
                { backgroundColor: colors.secondarySurface },
              ]}
            >
              <Ionicons name="shield-checkmark-outline" size={17} color={colors.primary} />
            </View>
            <View style={styles.signalDetails}>
              <Text style={[styles.signalTitle, { color: colors.textPrimary }]}>
                Competitor research
              </Text>
              <Text style={[styles.signalDesc, { color: colors.textMuted }]}>
                Viewed 2 competitor pages
              </Text>
            </View>
            <View style={styles.signalStrengthCol}>
              <View style={styles.signalBars}>
                <View style={[styles.bar, { height: 6, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 9, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 12, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 15, backgroundColor: colors.textMuted, opacity: 0.3 }]} />
              </View>
              <Text style={[styles.strengthText, { color: colors.textSecondary }]}>Medium</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          {/* Signal 4 */}
          <View style={styles.signalRow}>
            <View
              style={[
                styles.signalIconBox,
                { backgroundColor: colors.secondarySurface },
              ]}
            >
              <Ionicons name="download-outline" size={17} color={colors.primary} />
            </View>
            <View style={styles.signalDetails}>
              <Text style={[styles.signalTitle, { color: colors.textPrimary }]}>
                Downloaded ROI guide
              </Text>
              <Text style={[styles.signalDesc, { color: colors.textMuted }]}>
                2 days ago
              </Text>
            </View>
            <View style={styles.signalStrengthCol}>
              <View style={styles.signalBars}>
                <View style={[styles.bar, { height: 6, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 9, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 12, backgroundColor: colors.primary }]} />
                <View style={[styles.bar, { height: 15, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.strengthText, { color: colors.primary }]}>High</Text>
            </View>
          </View>
        </View>

        {/* ── Pipeline Position ────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Pipeline position
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            Stage: {selectedLead.stage}
          </Text>
        </View>

        <View style={styles.pipelineBar}>
          {stages.map((stg) => {
            const isActive = stg === selectedLead.stage;
            return (
              <View
                key={stg}
                style={[
                  styles.pipelineStageBlock,
                  {
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderColor: isActive ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pipelineStageText,
                    {
                      color: isActive ? "#FFFFFF" : colors.textMuted,
                      fontFamily: isActive ? Typography.semiBold : Typography.regular,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {stg}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── Next Best Action Panel ───────────────────────────── */}
        <View
          style={[
            styles.nextActionCard,
            {
              backgroundColor: isDark ? "#1B2B25" : "#18312A",
              borderColor: isDark ? "#294039" : "rgba(255, 255, 255, 0.12)",
            },
          ]}
        >
          {/* Header Row with Lightning Bolt */}
          <View style={styles.actionHeaderRow}>
            <View style={styles.lightningIconWrap}>
              <Ionicons name="flash" size={16} color={colors.acidLime} />
            </View>
            <Text style={[styles.actionTag, { color: colors.textSecondary }]}>
              Next best action
            </Text>
          </View>

          {/* Action Title & Reason */}
          <Text style={styles.actionTitle}>Call within 24 hours</Text>
          <Text style={styles.actionReason}>
            High buying intent. Recommended while interest is high.
          </Text>

          {/* Action Buttons Row */}
          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleStartCall}
              style={[
                styles.startCallBtn,
                {
                  backgroundColor: colors.acidLime,
                },
              ]}
            >
              <Ionicons name="call" size={17} color="#101513" />
              <Text style={styles.startCallText}>Start call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setLeadPickerVisible(true)}
              style={styles.moreActionBtn}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#F1F7F4" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── Lead Selector Modal ───────────────────────────────── */}
      <Modal
        visible={leadPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLeadPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLeadPickerVisible(false)}
        >
          <View
            style={[
              styles.leadPickerSheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
                Switch Lead Signal
              </Text>
              <TouchableOpacity onPress={() => setLeadPickerVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {SAMPLE_LEADS.map((lead) => (
              <TouchableOpacity
                key={lead.id}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedLead(lead);
                  setLeadPickerVisible(false);
                }}
                style={[
                  styles.leadPickItem,
                  {
                    backgroundColor:
                      selectedLead.id === lead.id
                        ? colors.mintTintedSurface
                        : "transparent",
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.leadPickName, { color: colors.textPrimary }]}>
                    {lead.name}
                  </Text>
                  <Text style={[styles.leadPickSub, { color: colors.textSecondary }]}>
                    {lead.industry} · Stage: {lead.stage}
                  </Text>
                </View>
                <Text style={[styles.leadPickScore, { color: colors.primary }]}>
                  {lead.score}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
    alignItems: "center",
    justifyContent: "space-between",
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
  titleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  screenTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.screenTitle,
    letterSpacing: -0.2,
  },

  // Badge Row
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  highIntentBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    gap: 5,
  },
  flameIcon: {
    fontSize: 12,
  },
  highIntentText: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.label,
  },
  updatedText: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },

  // Company Row
  companyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  companyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  companyLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  companyLogoLetter: {
    fontFamily: Typography.bold,
    fontSize: 20,
    color: "#20E3AD",
  },
  companyText: {
    flex: 1,
    gap: 2,
  },
  companyName: {
    fontFamily: Typography.headingSemi,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  companySub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },
  scoreCol: {
    alignItems: "flex-end",
  },
  intentScoreNum: {
    fontFamily: Typography.heading,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  intentScoreLabel: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.caption,
  },

  // Quote
  quoteText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.body,
    lineHeight: 22,
    marginBottom: 16,
    letterSpacing: 0.1,
  },

  // Evaluation Chips
  evalChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  evalChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: "center",
    gap: 2,
  },
  chipKey: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.micro,
    textTransform: "uppercase",
  },
  chipVal: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.bodySmall,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.sectionTitle,
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },

  // Buying Intent Signals
  signalsContainer: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: 24,
    ...Shadows.card,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 12,
  },
  signalIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  signalDetails: {
    flex: 1,
    gap: 2,
  },
  signalTitle: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.bodySmall,
  },
  signalDesc: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.caption,
  },
  signalStrengthCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  signalBars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  strengthText: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.micro,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },

  // Pipeline Position
  pipelineBar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 24,
  },
  pipelineStageBlock: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pipelineStageText: {
    fontSize: FontSizes.caption,
    letterSpacing: 0.1,
  },

  // Next Best Action Panel
  nextActionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.floatingDock,
  },
  actionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  lightningIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(166, 226, 46, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionTag: {
    fontFamily: Typography.medium,
    fontSize: FontSizes.label,
    letterSpacing: 0.2,
  },
  actionTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: 20,
    color: "#F1F7F4",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  actionReason: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.bodySmall,
    color: "rgba(241, 247, 244, 0.7)",
    marginBottom: 16,
    lineHeight: 18,
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  startCallBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startCallText: {
    fontFamily: Typography.bold,
    fontSize: FontSizes.button,
    color: "#101513",
    letterSpacing: 0.2,
  },
  moreActionBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  leadPickerSheet: {
    width: "100%",
    maxWidth: 380,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 18,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.15)",
  },
  pickerTitle: {
    fontFamily: Typography.headingSemi,
    fontSize: FontSizes.sectionTitle,
  },
  leadPickItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 6,
  },
  leadPickName: {
    fontFamily: Typography.semiBold,
    fontSize: FontSizes.body,
    marginBottom: 2,
  },
  leadPickSub: {
    fontFamily: Typography.regular,
    fontSize: FontSizes.label,
  },
  leadPickScore: {
    fontFamily: Typography.headingSemi,
    fontSize: 22,
  },
});
