import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../hooks/useColors";
import { useApp } from "../context/AppContext";
import { generateQuarterlyReport, QuarterlyReport } from "../lib/engines/quarterlyReportEngine";
import { saveQuarterlyReport, getQuarterlyReports } from "../lib/engines/quarterlyReportStorage";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

export default function Reports() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions, profile } = useApp();
  const [reports, setReports] = useState<QuarterlyReport[]>([]);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    const load = async () => {
      // Generate current and past few quarters
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentQ = Math.ceil((now.getMonth() + 1) / 3);
      const generated: QuarterlyReport[] = [];
      for (let i = 0; i < 4; i++) {
        let q = currentQ - i;
        let y = currentYear;
        while (q <= 0) { q += 4; y--; }
        const report = generateQuarterlyReport(transactions, q, y, profile.monthlyBudget);
        if (report.months.some((m) => m.transactionCount > 0)) {
          await saveQuarterlyReport(report);
          generated.push(report);
        }
      }
      setReports(generated);
    };
    load();
  }, [transactions, profile.monthlyBudget]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Quarterly Reports
        </Text>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bar-chart-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No quarterly reports yet. Add transactions to generate reports.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/report-detail", params: { id: item.id, year: item.year, quarter: item.quarter } })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardLabel, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                {item.label}
              </Text>
              <View style={[styles.trendPill, { backgroundColor: item.behaviorTrend === "improving" ? colors.pulseGreen + "20" : item.behaviorTrend === "declining" ? colors.pulseRed + "20" : colors.secondary }]}>
                <Text style={[styles.trendText, { color: item.behaviorTrend === "improving" ? colors.pulseGreen : item.behaviorTrend === "declining" ? colors.pulseRed : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  {item.behaviorTrend}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardTotal, { color: item.totalSpend <= item.budget ? colors.pulseGreen : colors.pulseRed, fontFamily: "Inter_600SemiBold" }]}>
              {formatCurrency(item.totalSpend)} / {formatCurrency(item.budget)}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Avg {formatCurrency(item.avgMonthlySpend)}/month · Top: {item.topCategory || "—"}
            </Text>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 22 },
  list: { padding: 16, gap: 12 },
  empty: { alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  reportCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { fontSize: 18 },
  trendPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  trendText: { fontSize: 12 },
  cardTotal: { fontSize: 16 },
  cardSub: { fontSize: 13 },
});
