import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../hooks/useColors";
import { PulseScore } from "../lib/engines/scoreEngine";

interface Props {
  data: PulseScore;
}

export default function PulseScoreDisplay({ data }: Props) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const levelColor =
    data.level === "safe"
      ? colors.pulseGreen
      : data.level === "caution"
      ? colors.pulseYellow
      : colors.pulseRed;

  const confidenceLabel =
    data.confidence === "high"
      ? "High confidence"
      : data.confidence === "medium"
      ? "Building confidence"
      : "Still early";

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={styles.scoreWrap}>
          <Text style={[styles.scoreNum, { color: levelColor, fontFamily: "Inter_700Bold" }]}>
            {data.score}
          </Text>
          <Text style={[styles.scoreLabel, { color: levelColor, fontFamily: "Inter_600SemiBold" }]}>
            {data.label}
          </Text>
        </View>
        <View style={styles.right}>
          <View style={[styles.confidencePill, { backgroundColor: levelColor + "20" }]}>
            <Text style={[styles.confidenceText, { color: levelColor, fontFamily: "Inter_500Medium" }]}>
              {confidenceLabel}
            </Text>
          </View>
          <Text style={[styles.explanation, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {data.explanation}
          </Text>
        </View>
      </View>

      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.barFill,
            { width: `${data.score}%` as any, backgroundColor: levelColor },
          ]}
        />
      </View>

      <TouchableOpacity
        style={styles.expandBtn}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={[styles.expandText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
          {expanded ? "Hide details" : "Why this score?"}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color={colors.primary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.reasons}>
          {data.reasons.map((r, i) => (
            <View key={i} style={styles.reasonRow}>
              <View style={[styles.reasonDot, { backgroundColor: levelColor }]} />
              <Text style={[styles.reasonText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {r}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  topRow: { flexDirection: "row", gap: 16, alignItems: "flex-start" },
  scoreWrap: { alignItems: "center", minWidth: 64 },
  scoreNum: { fontSize: 48, lineHeight: 52 },
  scoreLabel: { fontSize: 13, marginTop: 2 },
  right: { flex: 1, gap: 6 },
  confidencePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
  },
  confidenceText: { fontSize: 11 },
  explanation: { fontSize: 13, lineHeight: 18 },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  expandBtn: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  expandText: { fontSize: 13 },
  reasons: { gap: 8 },
  reasonRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  reasonDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  reasonText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
