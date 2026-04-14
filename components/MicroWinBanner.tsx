import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../hooks/useColors";
import { MicroWin } from "../lib/engines/microWinEngine";

interface Props {
  data: MicroWin;
}

export default function MicroWinBanner({ data }: Props) {
  const colors = useColors();

  return (
    <View style={[styles.banner, { backgroundColor: colors.pulseGreen + "15", borderColor: colors.pulseGreen + "40" }]}>
      <Ionicons name={data.icon as any} size={20} color={colors.pulseGreen} />
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.pulseGreen, fontFamily: "Inter_700Bold" }]}>
          {data.title}
        </Text>
        <Text style={[styles.message, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
          {data.message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  text: { flex: 1, gap: 3 },
  title: { fontSize: 14 },
  message: { fontSize: 13, lineHeight: 18 },
});
