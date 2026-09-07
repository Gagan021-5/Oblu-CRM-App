import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface SkeletonCardProps {
  height?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ height = 110 }) => {
  const { isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [animatedValue]);

  const blockBg = isDark ? "#1C2D26" : "#E4ECE8";

  return (
    <Animated.View
      style={[
        styles.card,
        {
          height,
          backgroundColor: isDark ? "#0E1714" : "#FFFFFF",
          borderColor: isDark ? "#294039" : "#D8E0DC",
          opacity: animatedValue,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.avatar, { backgroundColor: blockBg }]} />
        <View style={styles.headerText}>
          <View style={[styles.titleBar, { backgroundColor: blockBg }]} />
          <View style={[styles.subtitleBar, { backgroundColor: blockBg }]} />
        </View>
        <View style={[styles.pillBar, { backgroundColor: blockBg }]} />
      </View>
      <View style={styles.bottomRow}>
        <View style={[styles.infoBar, { backgroundColor: blockBg }]} />
        <View style={[styles.infoBarSmall, { backgroundColor: blockBg }]} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  titleBar: {
    height: 14,
    width: "70%",
    borderRadius: 6,
    marginBottom: 6,
  },
  subtitleBar: {
    height: 10,
    width: "45%",
    borderRadius: 4,
  },
  pillBar: {
    height: 20,
    width: 60,
    borderRadius: 10,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  infoBar: {
    height: 10,
    width: "40%",
    borderRadius: 4,
  },
  infoBarSmall: {
    height: 10,
    width: "25%",
    borderRadius: 4,
  },
});
