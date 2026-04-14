import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../hooks/useColors";
import { OneMoveCard } from "../lib/engines/checkInEngine";

interface Props {
  data: OneMoveCard;
}

const TAG_COLORS: Record<string, string> = {
  Recovery: "#EF4444",
  "Spending Cap": "#F59E0B",
  "Pattern Break": "#8B5CF6",
  Timing: "#0EA5E9",
  Pace: "#F97316",
  Momentum: "#10B981",
  Mindfulness: "#64748B",
};

export default function OneMoveCardDisplay({ data }: Props) {
  const colors = useColors();
  const tagColor = data.tag ? TAG_COLORS[data.tag] || colors.primary : colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
          TODAY'S ONE MOVE
        </Text>
        {data.tag && (
          <View style={[styles.tag, { backgroundColor: tagColor + "20" }]}>
            <Text style={[styles.tagText, { color: tagColor, fontFamily: "Inter_600SemiBold" }]}>
              {data.tag}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: tagColor + "15" }]}>
          <Ionicons name={data.icon as any} size={24} color={tagColor} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            {data.title}
          </Text>
          <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {data.description}
          </Text>
          {data.rationale && (
            <Text style={[styles.rationale, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {data.rationale}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { fontSize: 10, letterSpacing: 1 },
  tag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  tagText: { fontSize: 11 },
  body: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, gap: 4 },
  title: { fontSize: 16 },
  desc: { fontSize: 13, lineHeight: 19 },
  rationale: { fontSize: 12, lineHeight: 17, fontStyle: "italic" },
});
