import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../hooks/useColors";
import { MomentumData } from "../lib/engines/streakEngine";

interface Props {
  data: MomentumData;
}

export default function MomentumCard({ data }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name="flame" size={22} color={colors.accent} />
        <Text style={[styles.streakNum, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          {data.currentStreak}
        </Text>
        <Text style={[styles.streakLabel, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
          day{data.currentStreak !== 1 ? "s" : ""} streak
        </Text>
        {data.bestStreak > 0 && (
          <View style={[styles.bestPill, { backgroundColor: colors.accent + "20" }]}>
            <Text style={[styles.bestText, { color: colors.accent, fontFamily: "Inter_500Medium" }]}>
              Best: {data.bestStreak}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
        {data.description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  streakNum: { fontSize: 32 },
  streakLabel: { fontSize: 16 },
  bestPill: { marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  bestText: { fontSize: 12 },
  desc: { fontSize: 13, lineHeight: 18 },
});
