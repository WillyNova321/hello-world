import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../hooks/useColors";
import { RecoveryMode } from "../lib/engines/recoveryEngine";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

interface Props {
  data: RecoveryMode;
}

export default function RecoveryBanner({ data }: Props) {
  const colors = useColors();

  if (!data.active) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.pulseRed + "15", borderColor: colors.pulseRed + "40" }]}>
      <View style={styles.header}>
        <Ionicons name="alert-circle" size={20} color={colors.pulseRed} />
        <Text style={[styles.title, { color: colors.pulseRed, fontFamily: "Inter_700Bold" }]}>
          Recovery Mode
        </Text>
        <View style={[styles.overagePill, { backgroundColor: colors.pulseRed + "20" }]}>
          <Text style={[styles.overage, { color: colors.pulseRed, fontFamily: "Inter_600SemiBold" }]}>
            +{formatCurrency(data.projectedOverage)} projected
          </Text>
        </View>
      </View>

      <View style={[styles.limitRow, { backgroundColor: colors.card, borderRadius: 8 }]}>
        <Text style={[styles.limitLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Daily Target
        </Text>
        <Text style={[styles.limitAmount, { color: colors.pulseRed, fontFamily: "Inter_700Bold" }]}>
          {formatCurrency(data.dailyRecoveryLimit)}/day
        </Text>
      </View>

      <View style={styles.actions}>
        {data.actions.map((action, i) => (
          <View key={i} style={styles.actionRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.pulseRed} />
            <Text style={[styles.actionText, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
              {action}
            </Text>
          </View>
        ))}
      </View>

      {data.reassuranceLine && (
        <Text style={[styles.reassurance, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {data.reassuranceLine}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { fontSize: 15 },
  overagePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  overage: { fontSize: 12 },
  limitRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12 },
  limitLabel: { fontSize: 13 },
  limitAmount: { fontSize: 18 },
  actions: { gap: 8 },
  actionRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  actionText: { flex: 1, fontSize: 13, lineHeight: 18 },
  reassurance: { fontSize: 12, fontStyle: "italic", lineHeight: 17 },
});
