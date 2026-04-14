import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../hooks/useColors";
import { DetectedSubscription } from "../lib/engines/subscriptionEngine";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

interface Props {
  sub: DetectedSubscription;
}

export default function SubscriptionCard({ sub }: Props) {
  const colors = useColors();

  const lastDate = new Date(sub.lastChargedDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const nextDate = new Date(sub.nextExpectedDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
          <Ionicons name="repeat" size={16} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.label, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            {sub.label}
          </Text>
          <Text style={[styles.dates, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Last: {lastDate} · Next: ~{nextDate}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            {formatCurrency(sub.amount)}
          </Text>
          <View style={[styles.freqPill, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.freqText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              {sub.frequency}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 3 },
  label: { fontSize: 14 },
  dates: { fontSize: 12 },
  right: { alignItems: "flex-end", gap: 4 },
  amount: { fontSize: 16 },
  freqPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  freqText: { fontSize: 11 },
});
