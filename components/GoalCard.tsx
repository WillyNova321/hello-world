import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "../hooks/useColors";
import { Goal } from "../lib/storage";

interface Props {
  goal: Goal;
  onComplete?: (id: string) => void;
}

const DEADLINE_LABELS: Record<string, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
};

export default function GoalCard({ goal, onComplete }: Props) {
  const colors = useColors();
  const progress = goal.target > 0 ? Math.min(goal.current / goal.target, 1) : 0;
  const pct = Math.round(progress * 100);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: goal.completed ? 0.65 : 1 },
      ]}
    >
      <View style={styles.header}>
        {goal.completed && <Ionicons name="checkmark-circle" size={18} color={colors.pulseGreen} />}
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
          {goal.title}
        </Text>
        {goal.deadline && !goal.completed && (
          <View style={[styles.deadlinePill, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.deadlineText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              {DEADLINE_LABELS[goal.deadline]}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.progressRow}>
        <View style={[styles.barBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.barFill,
              { width: `${pct}%` as any, backgroundColor: goal.completed ? colors.pulseGreen : colors.primary },
            ]}
          />
        </View>
        <Text style={[styles.pct, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          {pct}%
        </Text>
      </View>

      {!goal.completed && onComplete && (
        <TouchableOpacity
          style={[styles.completeBtn, { borderColor: colors.primary }]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onComplete(goal.id);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.completeBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
            Mark Complete
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { flex: 1, fontSize: 14 },
  deadlinePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  deadlineText: { fontSize: 11 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barBg: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  pct: { fontSize: 12, minWidth: 32, textAlign: "right" },
  completeBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  completeBtnText: { fontSize: 13 },
});
