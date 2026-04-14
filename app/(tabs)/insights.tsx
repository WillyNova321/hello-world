import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "../../hooks/useColors";
import { useApp } from "../../context/AppContext";
import InsightCard from "../../components/InsightCard";
import RecoveryBanner from "../../components/RecoveryBanner";
import GoalCard from "../../components/GoalCard";
import SubscriptionCard from "../../components/SubscriptionCard";
import { formatCurrency } from "../../lib/engines/spendingAnalysis";
import { generateMicroGoals } from "../../lib/engines/goalsEngine";
import { computePersona } from "../../lib/engines/personaEngine";

type TabType = "overview" | "goals" | "features";

export default function Insights() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showPersona, setShowPersona] = useState(false);
  const app = useApp();

  const {
    insights,
    recoveryMode,
    projection,
    subscriptions,
    goals,
    transactions,
    profile,
    behaviorState,
    completeGoal,
    addGoal,
  } = app;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const tabs: { key: TabType; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "goals", label: "Goals" },
    { key: "features", label: "Features" },
  ];

  const persona = computePersona(
    transactions,
    behaviorState?.dominantPattern || null,
    profile.monthlyBudget
  );

  const handleSuggestGoals = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const suggested = generateMicroGoals(transactions, profile.monthlyBudget);
    for (const g of suggested) {
      await addGoal(g);
    }
  };

  const activeGoals = goals.filter((g) => !g.completed);
  const completedGoals = goals.filter((g) => g.completed);

  // Category breakdown
  const byCategory = behaviorState?.byCategory || {};
  const catEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const totalCat = catEntries.reduce((s, [, v]) => s + v, 0);

  // Day of week
  const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowEntries = behaviorState?.byDayOfWeek || {};
  const maxDow = Math.max(1, ...Object.values(dowEntries));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Insights
        </Text>
        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.secondary }]}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tab,
                activeTab === t.key && { backgroundColor: colors.card, borderRadius: 8 },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(t.key);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: activeTab === t.key ? colors.text : colors.mutedForeground,
                    fontFamily: activeTab === t.key ? "Inter_600SemiBold" : "Inter_400Regular",
                  },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: (Platform.OS === "web" ? 80 : insets.bottom + 70) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            {/* Projection card */}
            {projection && (
              <View style={[styles.projCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  Month Projection
                </Text>
                <View style={styles.projRow}>
                  <View style={styles.projStat}>
                    <Text style={[styles.projStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Projected Balance
                    </Text>
                    <Text style={[styles.projStatValue, { color: projection.projectedBalance >= 0 ? colors.pulseGreen : colors.pulseRed, fontFamily: "Inter_700Bold" }]}>
                      {projection.projectedBalance >= 0 ? formatCurrency(projection.projectedBalance) : `-${formatCurrency(Math.abs(projection.projectedBalance))}`}
                    </Text>
                  </View>
                  <View style={styles.projStat}>
                    <Text style={[styles.projStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Safe Daily
                    </Text>
                    <Text style={[styles.projStatValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                      {formatCurrency(projection.safeDaily)}
                    </Text>
                  </View>
                  <View style={styles.projStat}>
                    <Text style={[styles.projStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Days Left
                    </Text>
                    <Text style={[styles.projStatValue, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                      {projection.daysLeft}
                    </Text>
                  </View>
                </View>
                {projection.scenarios.length > 0 && (
                  <View style={styles.scenarios}>
                    <Text style={[styles.scenariosTitle, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                      What-if Scenarios
                    </Text>
                    {projection.scenarios.map((s, i) => (
                      <View key={i} style={[styles.scenarioRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.scenarioLabel, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
                          {s.label}
                        </Text>
                        <Text style={[styles.scenarioValue, { color: s.projectedBalance >= 0 ? colors.pulseGreen : colors.pulseRed, fontFamily: "Inter_600SemiBold" }]}>
                          {s.projectedBalance >= 0 ? formatCurrency(s.projectedBalance) : `-${formatCurrency(Math.abs(s.projectedBalance))}`}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {recoveryMode.active && <RecoveryBanner data={recoveryMode} />}

            {/* Fixed vs Flexible */}
            {behaviorState && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  Fixed vs Flexible
                </Text>
                <View style={styles.fixFlexRow}>
                  <View style={styles.fixFlexItem}>
                    <Text style={[styles.fixFlexLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Fixed
                    </Text>
                    <Text style={[styles.fixFlexValue, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                      {formatCurrency(behaviorState.fixedSpend)}
                    </Text>
                  </View>
                  <View style={[styles.fixFlexBar, { backgroundColor: colors.secondary }]}>
                    <View
                      style={[
                        styles.fixFlexFill,
                        {
                          width: behaviorState.thisMonthSpend > 0
                            ? `${Math.round((behaviorState.fixedSpend / behaviorState.thisMonthSpend) * 100)}%` as any
                            : "0%",
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.fixFlexItem}>
                    <Text style={[styles.fixFlexLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      Flexible
                    </Text>
                    <Text style={[styles.fixFlexValue, { color: colors.accent, fontFamily: "Inter_700Bold" }]}>
                      {formatCurrency(behaviorState.flexibleSpend)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Subscriptions */}
            {subscriptions.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  Likely Subscriptions
                </Text>
                {subscriptions.map((s) => (
                  <SubscriptionCard key={s.id} sub={s} />
                ))}
              </View>
            )}

            {/* Day of week chart */}
            {Object.keys(dowEntries).length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  Spending by Day
                </Text>
                <View style={styles.barChart}>
                  {DOW_LABELS.map((label, i) => {
                    const val = dowEntries[i] || 0;
                    const pct = maxDow > 0 ? val / maxDow : 0;
                    const isWeekend = i === 0 || i === 6;
                    return (
                      <View key={i} style={styles.barCol}>
                        <View style={[styles.barTrack, { backgroundColor: colors.secondary }]}>
                          <View
                            style={[
                              styles.barValue,
                              {
                                height: `${Math.round(pct * 100)}%` as any,
                                backgroundColor: isWeekend ? colors.accent : colors.primary,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.barLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                          {label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Category breakdown */}
            {catEntries.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  Category Breakdown
                </Text>
                {catEntries.slice(0, 6).map(([cat, amt]) => (
                  <View key={cat} style={styles.catRow}>
                    <Text style={[styles.catName, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                    <View style={[styles.catBar, { backgroundColor: colors.secondary }]}>
                      <View
                        style={[
                          styles.catBarFill,
                          {
                            width: `${totalCat > 0 ? Math.round((amt / totalCat) * 100) : 0}%` as any,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.catAmt, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                      {formatCurrency(amt)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Persona */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.personaHeader}>
                <Text style={[styles.personaEmoji]}>{persona.emoji}</Text>
                <View style={styles.personaInfo}>
                  <Text style={[styles.personaName, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                    {persona.name}
                  </Text>
                  <Text style={[styles.personaTagline, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {persona.tagline}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.viewProfileBtn, { borderColor: colors.primary }]}
                onPress={() => setShowPersona(true)}
              >
                <Text style={[styles.viewProfileBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  See Full Profile
                </Text>
              </TouchableOpacity>
            </View>

            {/* All insights */}
            <View style={styles.allInsights}>
              {insights.map((ins) => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          </View>
        )}

        {activeTab === "goals" && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={[styles.suggestBtn, { backgroundColor: colors.primary }]}
              onPress={handleSuggestGoals}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles" size={18} color={colors.primaryForeground} />
              <Text style={[styles.suggestBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                Suggest Goals For Me
              </Text>
            </TouchableOpacity>

            {activeGoals.length > 0 && (
              <View style={styles.goalsSection}>
                <Text style={[styles.goalsSectionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  Active Goals
                </Text>
                {activeGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} onComplete={completeGoal} />
                ))}
              </View>
            )}

            {completedGoals.length > 0 && (
              <View style={styles.goalsSection}>
                <Text style={[styles.goalsSectionTitle, { color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
                  Completed
                </Text>
                {completedGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} />
                ))}
              </View>
            )}

            {goals.length === 0 && (
              <View style={styles.goalsEmpty}>
                <Ionicons name="flag-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.goalsEmptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Tap "Suggest Goals For Me" to get personalized micro-goals
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "features" && (
          <View style={styles.tabContent}>
            {[
              { icon: "chatbubbles", label: "Financial Coach", route: "/coach" },
              { icon: "person-circle", label: "Spending Persona", action: () => setShowPersona(true) },
              { icon: "cloud-download", label: "Import from Bank", route: "/csv-import" },
              { icon: "bar-chart", label: "Quarterly Reports", route: "/reports" },
              { icon: "calendar", label: "Monthly Reports", route: "/monthly-reports" },
            ].map((f, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.featureRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (f.action) f.action();
                  else if (f.route) router.push(f.route as any);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + "20" }]}>
                  <Ionicons name={f.icon as any} size={22} color={colors.primary} />
                </View>
                <Text style={[styles.featureLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                  {f.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Persona Modal */}
      <Modal visible={showPersona} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.personaModalEmoji}>{persona.emoji}</Text>
              <Text style={[styles.personaModalName, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                {persona.name}
              </Text>
              <Text style={[styles.personaModalTagline, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                {persona.tagline}
              </Text>
              <Text style={[styles.personaModalDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {persona.description}
              </Text>
              <View style={styles.traitsWrap}>
                {persona.traits.map((t, i) => (
                  <View key={i} style={[styles.traitChip, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.traitText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                      {t}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.tipsTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                Tips for You
              </Text>
              {persona.tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {tip}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalClose, { backgroundColor: colors.secondary }]}
              onPress={() => setShowPersona(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  title: { fontSize: 24 },
  tabBar: { flexDirection: "row", borderRadius: 10, padding: 4 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 8 },
  tabText: { fontSize: 13 },
  scroll: { padding: 16, gap: 12 },
  tabContent: { gap: 12 },
  projCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15 },
  projRow: { flexDirection: "row" },
  projStat: { flex: 1, gap: 4, alignItems: "center" },
  projStatLabel: { fontSize: 11 },
  projStatValue: { fontSize: 20 },
  scenarios: { gap: 8 },
  scenariosTitle: { fontSize: 12, marginBottom: 4 },
  scenarioRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1 },
  scenarioLabel: { fontSize: 13 },
  scenarioValue: { fontSize: 13 },
  fixFlexRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fixFlexItem: { alignItems: "center", gap: 4, minWidth: 60 },
  fixFlexLabel: { fontSize: 12 },
  fixFlexValue: { fontSize: 16 },
  fixFlexBar: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden" },
  fixFlexFill: { height: 10, borderRadius: 5 },
  barChart: { flexDirection: "row", height: 80, gap: 8, alignItems: "flex-end" },
  barCol: { flex: 1, alignItems: "center", gap: 4, height: "100%" },
  barTrack: { flex: 1, width: "100%", borderRadius: 4, justifyContent: "flex-end", overflow: "hidden" },
  barValue: { width: "100%", borderRadius: 4 },
  barLabel: { fontSize: 10 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  catName: { width: 90, fontSize: 13 },
  catBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  catBarFill: { height: 6, borderRadius: 3 },
  catAmt: { width: 60, textAlign: "right", fontSize: 12 },
  personaHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  personaEmoji: { fontSize: 36 },
  personaInfo: { flex: 1, gap: 3 },
  personaName: { fontSize: 18 },
  personaTagline: { fontSize: 13 },
  viewProfileBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  viewProfileBtnText: { fontSize: 14 },
  allInsights: { gap: 8 },
  suggestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 14 },
  suggestBtnText: { fontSize: 15 },
  goalsSection: { gap: 8 },
  goalsSectionTitle: { fontSize: 14 },
  goalsEmpty: { alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  goalsEmptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 12, borderWidth: 1 },
  featureIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  featureLabel: { flex: 1, fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "90%", gap: 16, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E2E8F0", alignSelf: "center", marginBottom: 8 },
  personaModalEmoji: { fontSize: 52, textAlign: "center" },
  personaModalName: { fontSize: 24, textAlign: "center", marginTop: 8 },
  personaModalTagline: { fontSize: 15, textAlign: "center", marginTop: 4 },
  personaModalDesc: { fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12 },
  traitsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 16 },
  traitChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100 },
  traitText: { fontSize: 13 },
  tipsTitle: { fontSize: 16, marginTop: 20, marginBottom: 8 },
  tipRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", marginBottom: 10 },
  tipText: { flex: 1, fontSize: 14, lineHeight: 20 },
  modalClose: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  modalCloseText: { fontSize: 15 },
});
