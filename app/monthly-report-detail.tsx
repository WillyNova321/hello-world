import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../hooks/useColors";
import { useApp } from "../context/AppContext";
import { generateMonthlyReport, MonthlyReport } from "../lib/engines/monthlyReportEngine";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

export default function MonthlyReportDetail() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { year, month } = useLocalSearchParams<{ year: string; month: string }>();
  const { transactions, profile } = useApp();
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (year && month) {
      const r = generateMonthlyReport(transactions, parseInt(month), parseInt(year), profile.monthlyBudget);
      setReport(r);
    }
  }, [year, month, transactions, profile.monthlyBudget]);

  if (!report) return null;

  const totalCat = Object.values(report.byCategory).reduce((s, v) => s + v, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          {report.label}
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Total</Text>
              <Text style={[styles.statValue, { color: report.underBudget ? colors.pulseGreen : colors.pulseRed, fontFamily: "Inter_700Bold" }]}>
                {formatCurrency(report.totalSpend)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Budget</Text>
              <Text style={[styles.statValue, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                {formatCurrency(report.budget)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Daily Avg</Text>
              <Text style={[styles.statValue, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                {formatCurrency(report.dailyAverage)}
              </Text>
            </View>
          </View>
          {report.biggestDayDate && (
            <Text style={[styles.biggestDay, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Biggest day: {report.biggestDayDate} ({formatCurrency(report.biggestDay)})
            </Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Category Breakdown
          </Text>
          {Object.entries(report.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <View key={cat} style={styles.catRow}>
              <Text style={[styles.catName, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
              <View style={[styles.catBar, { backgroundColor: colors.secondary }]}>
                <View style={[styles.catBarFill, { width: `${totalCat > 0 ? Math.round((amt / totalCat) * 100) : 0}%` as any, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.catAmt, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                {formatCurrency(amt)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 20 },
  scroll: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15 },
  statsRow: { flexDirection: "row" },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 20 },
  biggestDay: { fontSize: 12 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  catName: { width: 90, fontSize: 13 },
  catBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  catBarFill: { height: 6, borderRadius: 3 },
  catAmt: { width: 60, textAlign: "right", fontSize: 12 },
});
