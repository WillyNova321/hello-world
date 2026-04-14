import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../hooks/useColors";
import { DailyCheckIn } from "../lib/engines/checkInEngine";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

interface Props {
  data: DailyCheckIn;
}

export default function DailyCheckInCard({ data }: Props) {
  const colors = useColors();

  const statusColor =
    data.statusLevel === "on_pace"
      ? colors.pulseGreen
      : data.statusLevel === "slightly_over"
      ? colors.pulseYellow
      : colors.pulseRed;

  const statusIcon =
    data.statusLevel === "on_pace"
      ? "checkmark-circle"
      : data.statusLevel === "slightly_over"
      ? "time"
      : "alert-circle";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: statusColor + "20" }]}>
          <Ionicons name={statusIcon as any} size={18} color={statusColor} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
          Today's Check-In
        </Text>
      </View>

      <Text style={[styles.statusMsg, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
        {data.statusMessage}
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Safe Daily
          </Text>
          <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {formatCurrency(data.safeDaily)}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Spent Today
          </Text>
          <Text style={[styles.statValue, { color: statusColor, fontFamily: "Inter_700Bold" }]}>
            {formatCurrency(data.todaySpend)}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Remaining
          </Text>
          <Text style={[styles.statValue, { color: data.remainingToday > 0 ? colors.pulseGreen : colors.pulseRed, fontFamily: "Inter_700Bold" }]}>
            {data.remainingToday > 0 ? formatCurrency(data.remainingToday) : "Over"}
          </Text>
        </View>
      </View>

      <View style={[styles.actionRow, { backgroundColor: statusColor + "10", borderRadius: 8 }]}>
        <Ionicons name="arrow-forward-circle" size={16} color={statusColor} />
        <Text style={[styles.actionText, { color: statusColor, fontFamily: "Inter_500Medium" }]}>
          {data.recommendedAction}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15 },
  statusMsg: { fontSize: 14, lineHeight: 20 },
  statsRow: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center", gap: 3 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 18 },
  divider: { width: 1, height: 32 },
  actionRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10 },
  actionText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
