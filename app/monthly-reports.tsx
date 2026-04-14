import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../hooks/useColors";
import { useApp } from "../context/AppContext";
import { generateMonthlyReport, MonthlyReport } from "../lib/engines/monthlyReportEngine";
import { saveMonthlyReport } from "../lib/engines/monthlyReportStorage";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

export default function MonthlyReports() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { transactions, profile } = useApp();
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  useEffect(() => {
    const load = async () => {
      const now = new Date();
      const generated: MonthlyReport[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const report = generateMonthlyReport(transactions, d.getMonth() + 1, d.getFullYear(), profile.monthlyBudget);
        if (report.transactionCount > 0) {
          await saveMonthlyReport(report);
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
          Monthly Reports
        </Text>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(r) => r.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No monthly reports yet.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: "/monthly-report-detail", params: { year: item.year, month: item.month } })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardLabel, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                {item.label}
              </Text>
              {item.underBudget ? (
                <Ionicons name="checkmark-circle" size={20} color={colors.pulseGreen} />
              ) : (
                <Ionicons name="alert-circle" size={20} color={colors.pulseRed} />
              )}
            </View>
            <Text style={[styles.cardTotal, { color: item.underBudget ? colors.pulseGreen : colors.pulseRed, fontFamily: "Inter_600SemiBold" }]}>
              {formatCurrency(item.totalSpend)} / {formatCurrency(item.budget)}
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {item.transactionCount} transactions · Avg {formatCurrency(item.dailyAverage)}/day
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
  emptyText: { fontSize: 14, textAlign: "center" },
  reportCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { fontSize: 18 },
  cardTotal: { fontSize: 16 },
  cardSub: { fontSize: 13 },
});
