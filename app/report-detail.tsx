import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../hooks/useColors";
import { useApp } from "../context/AppContext";
import { generateQuarterlyReport, QuarterlyReport } from "../lib/engines/quarterlyReportEngine";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

export default function ReportDetail() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { year, quarter } = useLocalSearchParams<{ year: string; quarter: string }>();
  const { transactions, profile } = useApp();
  const [report, setReport] = useState<QuarterlyReport | null>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    if (year && quarter) {
      const r = generateQuarterlyReport(transactions, parseInt(quarter), parseInt(year), profile.monthlyBudget);
      setReport(r);
    }
  }, [year, quarter, transactions, profile.monthlyBudget]);

  if (!report) return null;

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
        {/* Summary */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Summary
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Total Spend</Text>
              <Text style={[styles.statValue, { color: report.totalSpend <= report.budget ? colors.pulseGreen : colors.pulseRed, fontFamily: "Inter_700Bold" }]}>
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
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Avg/Month</Text>
              <Text style={[styles.statValue, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                {formatCurrency(report.avgMonthlySpend)}
              </Text>
            </View>
          </View>
          <View style={[styles.trendRow, { backgroundColor: report.behaviorTrend === "improving" ? colors.pulseGreen + "15" : report.behaviorTrend === "declining" ? colors.pulseRed + "15" : colors.secondary }]}>
            <Ionicons
              name={report.behaviorTrend === "improving" ? "trending-down" : report.behaviorTrend === "declining" ? "trending-up" : "remove"}
              size={16}
              color={report.behaviorTrend === "improving" ? colors.pulseGreen : report.behaviorTrend === "declining" ? colors.pulseRed : colors.mutedForeground}
            />
            <Text style={[styles.trendText, { color: report.behaviorTrend === "improving" ? colors.pulseGreen : report.behaviorTrend === "declining" ? colors.pulseRed : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              Spending trend: {report.behaviorTrend}
            </Text>
          </View>
        </View>

        {/* Monthly breakdown */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Monthly Breakdown
          </Text>
          {report.months.map((m) => (
            <View key={m.id} style={[styles.monthRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.monthLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                {m.label}
              </Text>
              <Text style={[styles.monthSpend, { color: m.underBudget ? colors.pulseGreen : colors.pulseRed, fontFamily: "Inter_600SemiBold" }]}>
                {formatCurrency(m.totalSpend)}
              </Text>
              <Text style={[styles.monthTxCount, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {m.transactionCount} txs
              </Text>
            </View>
          ))}
        </View>

        {/* Category breakdown */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Top Categories
          </Text>
          {Object.entries(report.byCategory).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, amt]) => (
            <View key={cat} style={styles.catRow}>
              <Text style={[styles.catName, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Text>
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
  trendRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8 },
  trendText: { fontSize: 13 },
  monthRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  monthLabel: { flex: 1, fontSize: 14 },
  monthSpend: { fontSize: 14, marginRight: 12 },
  monthTxCount: { fontSize: 12 },
  catRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  catName: { fontSize: 14 },
  catAmt: { fontSize: 14 },
});
