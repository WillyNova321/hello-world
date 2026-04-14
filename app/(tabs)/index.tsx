import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "../../hooks/useColors";
import { useApp } from "../../context/AppContext";
import { formatCurrency } from "../../lib/engines/spendingAnalysis";
import PulseScoreDisplay from "../../components/PulseScore";
import DailyCheckInCard from "../../components/DailyCheckInCard";
import OneMoveCardDisplay from "../../components/OneMoveCard";
import RecoveryBanner from "../../components/RecoveryBanner";
import MomentumCard from "../../components/MomentumCard";
import MicroWinBanner from "../../components/MicroWinBanner";
import InsightCard from "../../components/InsightCard";

export default function Dashboard() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const app = useApp();

  const {
    profile,
    behaviorState,
    pulseScore,
    dailyCheckIn,
    oneMoveCard,
    recoveryMode,
    momentum,
    microWin,
    insights,
    notificationFeed,
    isLoading,
    refresh,
  } = app;

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const unreadCount = notificationFeed.filter((n) => !n.read).length;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const monthName = new Date().toLocaleString("en-US", { month: "long" });
  const year = new Date().getFullYear();

  if (!app.isReady) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Ionicons name="pulse" size={40} color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          Loading...
        </Text>
      </View>
    );
  }

  const budget = profile.monthlyBudget;
  const spent = behaviorState?.thisMonthSpend || 0;
  const fixed = behaviorState?.fixedSpend || 0;
  const flexible = behaviorState?.flexibleSpend || 0;
  const remaining = budget - spent;
  const isOver = remaining < 0;
  const projectedDelta = behaviorState ? budget - behaviorState.projectedTotal : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 8, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {greeting}, {profile.name}
            </Text>
            <Text style={[styles.monthLabel, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              {monthName} {year}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
              onPress={() => router.push("/notifications")}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.pulseRed }]}>
                  <Text style={[styles.badgeText, { fontFamily: "Inter_700Bold" }]}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.avatar, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.7}
            >
              <Text style={[styles.avatarText, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
                {(profile.name || "?").charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: isOver ? colors.pulseRed : colors.primary },
          ]}
        >
          <Text style={[styles.balanceLabel, { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium" }]}>
            {isOver ? "Over Budget" : "Budget Remaining"}
          </Text>
          <Text style={[styles.balanceAmount, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
            {isOver ? `+${formatCurrency(Math.abs(remaining))}` : formatCurrency(remaining)}
          </Text>
          <View style={styles.balanceStats}>
            <View style={styles.balanceStat}>
              <Text style={[styles.balanceStatLabel, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                Spent
              </Text>
              <Text style={[styles.balanceStatValue, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                {formatCurrency(spent)}
              </Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={[styles.balanceStatLabel, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                Fixed
              </Text>
              <Text style={[styles.balanceStatValue, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                {formatCurrency(fixed)}
              </Text>
            </View>
            <View style={styles.balanceStat}>
              <Text style={[styles.balanceStatLabel, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
                Flexible
              </Text>
              <Text style={[styles.balanceStatValue, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
                {formatCurrency(flexible)}
              </Text>
            </View>
          </View>
          {behaviorState && (
            <View style={[styles.projPill, { backgroundColor: projectedDelta >= 0 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.3)" }]}>
              <Ionicons
                name={projectedDelta >= 0 ? "trending-down" : "trending-up"}
                size={14}
                color="#fff"
              />
              <Text style={[styles.projText, { color: "#fff", fontFamily: "Inter_500Medium" }]}>
                Projected {projectedDelta >= 0 ? formatCurrency(projectedDelta) + " under" : formatCurrency(Math.abs(projectedDelta)) + " over"}
              </Text>
            </View>
          )}
        </View>

        {/* Pulse Score */}
        {pulseScore && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              Pulse Score
            </Text>
            <PulseScoreDisplay data={pulseScore} />
          </View>
        )}

        {/* Daily Check-In */}
        {dailyCheckIn && (
          <View style={styles.section}>
            <DailyCheckInCard data={dailyCheckIn} />
          </View>
        )}

        {/* Micro-Win */}
        {microWin && (
          <View style={styles.section}>
            <MicroWinBanner data={microWin} />
          </View>
        )}

        {/* One Move */}
        {oneMoveCard && (
          <View style={styles.section}>
            <OneMoveCardDisplay data={oneMoveCard} />
          </View>
        )}

        {/* Recovery Banner (takes priority over Momentum) */}
        {recoveryMode.active ? (
          <View style={styles.section}>
            <RecoveryBanner data={recoveryMode} />
          </View>
        ) : (
          momentum && (
            <View style={styles.section}>
              <MomentumCard data={momentum} />
            </View>
          )
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                Insights
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/insights")}>
                <Text style={[styles.seeAll, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.insightsList}>
              {insights.slice(0, 3).map((ins) => (
                <InsightCard key={ins.id} insight={ins} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: (Platform.OS === "web" ? 80 : insets.bottom + 70) + 16,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/add-transaction");
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  scroll: { paddingHorizontal: 16, gap: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerLeft: { gap: 2 },
  greeting: { fontSize: 13 },
  monthLabel: { fontSize: 22 },
  headerRight: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16 },
  balanceCard: { borderRadius: 20, padding: 20, gap: 12, marginBottom: 4 },
  balanceLabel: { fontSize: 13 },
  balanceAmount: { fontSize: 44 },
  balanceStats: { flexDirection: "row", gap: 0 },
  balanceStat: { flex: 1, gap: 2 },
  balanceStatLabel: { fontSize: 11 },
  balanceStatValue: { fontSize: 15 },
  projPill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  projText: { fontSize: 12 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16 },
  seeAll: { fontSize: 13 },
  insightsList: { gap: 8 },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
