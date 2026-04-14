import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../hooks/useColors";
import { Insight } from "../lib/engines/insightEngine";

interface Props {
  insight: Insight;
}

const TYPE_COLORS: Record<string, string> = {
  warning: "#EF4444",
  tip: "#0EA5E9",
  pattern: "#8B5CF6",
  achievement: "#10B981",
};

const TYPE_ICONS: Record<string, string> = {
  warning: "warning",
  tip: "bulb",
  pattern: "analytics",
  achievement: "trophy",
};

const IMPACT_LABELS: Record<string, string> = {
  high: "High Impact",
  medium: "Medium",
  low: "Low",
};

export default function InsightCard({ insight }: Props) {
  const colors = useColors();
  const typeColor = TYPE_COLORS[insight.type] || colors.primary;
  const icon = TYPE_ICONS[insight.type] || "information-circle";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.bar, { backgroundColor: typeColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: typeColor + "20" }]}>
            <Ionicons name={icon as any} size={16} color={typeColor} />
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            {insight.title}
          </Text>
          {insight.impactLevel && (
            <View style={[styles.impactPill, { backgroundColor: typeColor + "15" }]}>
              <Text style={[styles.impactText, { color: typeColor, fontFamily: "Inter_500Medium" }]}>
                {IMPACT_LABELS[insight.impactLevel]}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.message, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {insight.message}
        </Text>
        {insight.detail && (
          <Text style={[styles.detail, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {insight.detail}
          </Text>
        )}
        {insight.action && (
          <Text style={[styles.action, { color: typeColor, fontFamily: "Inter_500Medium" }]}>
            → {insight.action}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  bar: { width: 4 },
  content: { flex: 1, padding: 14, gap: 6 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 14 },
  impactPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  impactText: { fontSize: 10 },
  message: { fontSize: 13, lineHeight: 19 },
  detail: { fontSize: 12, lineHeight: 17, fontStyle: "italic" },
  action: { fontSize: 13 },
});
