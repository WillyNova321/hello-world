import { Transaction } from "../storage";
import { BehaviorState } from "./behaviorEngine";
import { startOfToday } from "./spendingAnalysis";

export interface ShortTermMemory {
  consecutiveHighDays: number;
  consecutiveLowDays: number;
  recentRecovery: boolean;
  daysSinceLastOverspend: number;
  contextPhrase: string | null;
}

export interface UserBehaviorProfile {
  primaryWeakness: "evening" | "weekend" | "category" | "inconsistency" | null;
  strongestHabit: "consistency" | "recovery" | "low_spend_days" | null;
  sensitivity: "high" | "medium" | "low";
  recoveryStyle: "quick" | "slow" | "inconsistent" | null;
  topCategory: string;
  behaviorTrend: "improving" | "stable" | "declining";
  shortTermMemory: ShortTermMemory;
  tone: "calm" | "nudge" | "intervention" | "low_data";
}

export function computeUserBehaviorProfile(
  bs: BehaviorState,
  transactions: Transaction[]
): UserBehaviorProfile {
  const { dominantPattern, recoveryNeeded, todayStatus, txCountThisMonth, dailyBudget, daysElapsed, thisMonth, budget } = bs;

  // Build per-day spending map for the past 30 days
  const now = new Date(bs.now);
  const dailyMap: Record<string, number> = {};
  for (const tx of transactions) {
    const d = new Date(tx.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    dailyMap[key] = (dailyMap[key] || 0) + Math.abs(tx.amount);
  }

  const days: number[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    days.push(dailyMap[key] || 0);
  }

  const limit = dailyBudget * 1.1;
  const overDays = days.filter((s) => s > limit).length;
  const underDays = days.filter((s) => s > 0 && s <= limit).length;
  const activeDays = days.filter((s) => s > 0).length;

  const pctOver = activeDays > 0 ? overDays / activeDays : 0;

  // Primary weakness
  let primaryWeakness: UserBehaviorProfile["primaryWeakness"] = null;
  if (dominantPattern === "evening") primaryWeakness = "evening";
  else if (dominantPattern === "weekend") primaryWeakness = "weekend";
  else if (dominantPattern === "category") primaryWeakness = "category";
  else if (pctOver > 0.4) primaryWeakness = "inconsistency";

  // Sensitivity
  let sensitivity: "high" | "medium" | "low";
  if (pctOver > 0.45) sensitivity = "high";
  else if (pctOver > 0.22) sensitivity = "medium";
  else sensitivity = "low";

  // Behavior trend: compare first half vs second half daily avg
  const firstHalf = days.slice(15, 30);
  const secondHalf = days.slice(0, 15);
  const firstAvg = firstHalf.reduce((s, d) => s + d, 0) / (firstHalf.length || 1);
  const secondAvg = secondHalf.reduce((s, d) => s + d, 0) / (secondHalf.length || 1);
  let behaviorTrend: "improving" | "stable" | "declining";
  if (secondAvg < firstAvg * 0.88) behaviorTrend = "improving";
  else if (secondAvg > firstAvg * 1.12) behaviorTrend = "declining";
  else behaviorTrend = "stable";

  // Recovery style: find over-limit days and see how quickly they recover
  const recoveryTimes: number[] = [];
  let inOverRun = false;
  let overStart = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i] > limit && !inOverRun) {
      inOverRun = true;
      overStart = i;
    } else if (days[i] <= limit && inOverRun) {
      recoveryTimes.push(overStart - i);
      inOverRun = false;
    }
  }

  let recoveryStyle: UserBehaviorProfile["recoveryStyle"] = null;
  if (recoveryTimes.length >= 2) {
    const avgRecovery = recoveryTimes.reduce((s, v) => s + v, 0) / recoveryTimes.length;
    if (avgRecovery <= 1) recoveryStyle = "quick";
    else if (avgRecovery <= 3) recoveryStyle = "slow";
    else recoveryStyle = "inconsistent";
  }

  // Short-term memory (last 7 days)
  const last7 = days.slice(0, 7);
  let consecutiveHighDays = 0;
  for (const s of last7) {
    if (s > limit) consecutiveHighDays++;
    else break;
  }

  let consecutiveLowDays = 0;
  for (const s of last7) {
    if (s > 0 && s <= limit) consecutiveLowDays++;
    else if (s === 0) consecutiveLowDays++; // no spend days keep streak
    else break;
  }

  let daysSinceLastOverspend = 0;
  for (const s of days) {
    if (s <= limit) daysSinceLastOverspend++;
    else break;
  }

  const recentRecovery =
    consecutiveHighDays === 0 && daysSinceLastOverspend >= 1 && days.slice(1, 4).some((s) => s > limit);

  // Context phrase
  let contextPhrase: string | null = null;
  if (recentRecovery) {
    const toughDays = days.slice(1, 7).filter((s) => s > limit).length;
    contextPhrase = `back on track after ${toughDays} tougher day${toughDays !== 1 ? "s" : ""}`;
  } else if (consecutiveHighDays === 1) {
    contextPhrase = "second day above your daily limit";
  } else if (consecutiveHighDays === 2) {
    contextPhrase = "third day in a row above your limit";
  } else if (consecutiveHighDays >= 3) {
    contextPhrase = `${consecutiveHighDays + 1} days in a row above your limit`;
  } else if (consecutiveLowDays === 2) {
    contextPhrase = "second day in a row under your limit";
  } else if (consecutiveLowDays === 3) {
    contextPhrase = "third consecutive day on track";
  } else if (consecutiveLowDays >= 4) {
    contextPhrase = `${consecutiveLowDays} days in a row on track`;
  } else if (daysSinceLastOverspend >= 5) {
    contextPhrase = `${daysSinceLastOverspend} days without going over`;
  }

  const shortTermMemory: ShortTermMemory = {
    consecutiveHighDays,
    consecutiveLowDays,
    recentRecovery,
    daysSinceLastOverspend,
    contextPhrase,
  };

  // Strongest habit
  let strongestHabit: UserBehaviorProfile["strongestHabit"] = null;
  if (underDays >= 5) strongestHabit = "consistency";
  else if (recentRecovery && recoveryStyle === "quick") strongestHabit = "recovery";
  else if (underDays >= 3) strongestHabit = "low_spend_days";

  // Tone
  let tone: UserBehaviorProfile["tone"];
  if (txCountThisMonth < 5) tone = "low_data";
  else if (recoveryNeeded) tone = "intervention";
  else if (todayStatus === "over" || consecutiveHighDays >= 1) tone = "nudge";
  else tone = "calm";

  // Top category
  const topCategory = bs.topDriftCategory || "other";

  return {
    primaryWeakness,
    strongestHabit,
    sensitivity,
    recoveryStyle,
    topCategory,
    behaviorTrend,
    shortTermMemory,
    tone,
  };
}
