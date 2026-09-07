import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Typography, FontSizes } from "@/constants/theme";

interface DayData {
  day: string;
  interactions: number;
  followups: number;
}

const WEEK_DATA: DayData[] = [
  { day: "Mon", interactions: 18, followups: 5 },
  { day: "Tue", interactions: 26, followups: 8 },
  { day: "Wed", interactions: 32, followups: 9 },
  { day: "Thu", interactions: 22, followups: 6 },
  { day: "Fri", interactions: 38, followups: 11 },
  { day: "Sat", interactions: 14, followups: 3 },
  { day: "Sun", interactions: 6, followups: 1 },
];

export const WeeklyActivityChart: React.FC = () => {
  const { colors, isDark } = useTheme();
  const [selectedDay, setSelectedDay] = useState<DayData>(WEEK_DATA[4]); // Friday as default

  const maxVal = Math.max(...WEEK_DATA.map((d) => d.interactions));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
          borderColor: isDark ? "#294039" : "#D8E0DC",
        },
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.title,
              { color: isDark ? "#F1F7F4" : "#101513" },
            ]}
          >
            Weekly Customer Activity
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? "#8FA09A" : "#5E6964" },
            ]}
          >
            Touchpoints & follow-ups across 7 days
          </Text>
        </View>

        {selectedDay && (
          <View
            style={[
              styles.tooltipBadge,
              {
                backgroundColor: isDark
                  ? "rgba(53, 214, 160, 0.12)"
                  : "#DDF4EA",
                borderColor: isDark
                  ? "rgba(53, 214, 160, 0.28)"
                  : "rgba(0, 168, 121, 0.25)",
              },
            ]}
          >
            <Text
              style={[
                styles.tooltipText,
                { color: isDark ? "#35D6A0" : "#00A879" },
              ]}
            >
              {selectedDay.day}: {selectedDay.interactions} acts • {selectedDay.followups} flw
            </Text>
          </View>
        )}
      </View>

      {/* Bar Chart Columns */}
      <View style={styles.chartArea}>
        {WEEK_DATA.map((item) => {
          const isSelected = selectedDay?.day === item.day;
          const barHeightPct = (item.interactions / maxVal) * 72; // max height 72px

          return (
            <TouchableOpacity
              key={item.day}
              style={styles.colContainer}
              onPress={() => setSelectedDay(item)}
              activeOpacity={0.7}
            >
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: Math.max(barHeightPct, 8),
                      backgroundColor: isSelected
                        ? isDark
                          ? "#B7F34A" // Accent lime on selected
                          : "#101513"
                        : isDark
                        ? "#35D6A0" // Mint on normal
                        : "#00A879",
                    },
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: isSelected
                      ? isDark
                        ? "#B7F34A"
                        : "#00A879"
                      : isDark
                      ? "#65756F"
                      : "#87928D",
                    fontFamily: isSelected
                      ? Typography.semiBold
                      : Typography.regular,
                  },
                ]}
              >
                {item.day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: FontSizes.body,
    fontFamily: Typography.semiBold,
  },
  subtitle: {
    fontSize: FontSizes.caption,
    fontFamily: Typography.regular,
    marginTop: 2,
  },
  tooltipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tooltipText: {
    fontSize: FontSizes.micro,
    fontFamily: Typography.semiBold,
  },
  chartArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 90,
    paddingTop: 8,
  },
  colContainer: {
    alignItems: "center",
    flex: 1,
  },
  barTrack: {
    height: 72,
    width: 20,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  barFill: {
    width: 12,
    borderRadius: 6,
  },
  dayLabel: {
    fontSize: FontSizes.micro,
    marginTop: 6,
  },
});
