import { BehaviorState } from "./behaviorEngine";
import { UserBehaviorProfile } from "./profileEngine";
import { MicroWin } from "./microWinEngine";
import { NotificationRecord, NotificationState } from "../notificationStorage";

export type NotificationEventType =
  | "daily_limit_crossed"
  | "recovery_triggered"
  | "near_limit"
  | "evening_pattern"
  | "micro_win"
  | "reinforcement"
  | "daily_summary";

export interface NotificationDecision {
  eventType: NotificationEventType;
  tier: 1 | 2 | 3;
  title: string;
  body: string;
  mergeKey?: string;
  shouldPush: boolean;
  id: string;
}

function isQuietHours(hour: number): boolean {
  return hour >= 8 && hour <= 22;
}

export function computeNotificationDecisions(
  bs: BehaviorState,
  prevBs: BehaviorState | null,
  profile: UserBehaviorProfile,
  microWin: MicroWin | null,
  notifState: NotificationState,
  hour: number
): NotificationDecision[] {
  const decisions: NotificationDecision[] = [];
  const remainingBudget = notifState.maxPerDay - notifState.sentToday;

  const wasOver = prevBs ? prevBs.todaySpend > prevBs.safeDaily : false;
  const isNowOver = bs.todaySpend > bs.safeDaily;

  // Tier 1: Always fire on state transitions
  if (!wasOver && isNowOver) {
    decisions.push({
      id: `daily_limit_${bs.now}`,
      eventType: "daily_limit_crossed",
      tier: 1,
      title: "Daily Limit Reached",
      body: `You've hit today's budget of $${Math.round(bs.safeDaily)}. Pause on non-essentials.`,
      mergeKey: "daily_limit",
      shouldPush: true,
    });
  }

  const wasRecovery = prevBs ? prevBs.recoveryNeeded : false;
  if (!wasRecovery && bs.recoveryNeeded) {
    decisions.push({
      id: `recovery_${bs.now}`,
      eventType: "recovery_triggered",
      tier: 1,
      title: "Recovery Mode Activated",
      body: `You're projected to go over budget. Daily target: $${Math.round(bs.safeDaily)}.`,
      mergeKey: "recovery",
      shouldPush: true,
    });
  }

  // Tier 2: Only during quiet hours and if budget allows
  if (isQuietHours(hour)) {
    const wasNear = prevBs ? prevBs.todaySpend > prevBs.safeDaily * 0.75 : false;
    const isNearNow = bs.todaySpend > bs.safeDaily * 0.75 && !isNowOver;

    if (!wasNear && isNearNow && remainingBudget > 0) {
      decisions.push({
        id: `near_limit_${bs.now}`,
        eventType: "near_limit",
        tier: 2,
        title: "Approaching Daily Limit",
        body: `You've used ${Math.round((bs.todaySpend / bs.safeDaily) * 100)}% of today's budget.`,
        mergeKey: "near_limit",
        shouldPush: remainingBudget > 0,
      });
    }

    if (hour >= 17 && hour <= 21 && bs.dominantPattern === "evening") {
      decisions.push({
        id: `evening_pattern_${new Date().toDateString()}`,
        eventType: "evening_pattern",
        tier: 2,
        title: "Evening Spending Alert",
        body: "Most of your spending happens in the evening. Pause before the next purchase.",
        mergeKey: "evening_pattern",
        shouldPush: remainingBudget > 0,
      });
    }
  }

  // Tier 3: Low-priority, quiet hours only
  if (isQuietHours(hour)) {
    if (microWin && remainingBudget > 0) {
      decisions.push({
        id: `micro_win_${microWin.id}_${new Date().toDateString()}`,
        eventType: "micro_win",
        tier: 3,
        title: microWin.title,
        body: microWin.message,
        mergeKey: `micro_win_${microWin.id}`,
        shouldPush: remainingBudget > 0,
      });
    }

    if (
      profile.shortTermMemory.consecutiveLowDays >= 3 &&
      hour >= 9 &&
      hour <= 20 &&
      remainingBudget > 0
    ) {
      decisions.push({
        id: `reinforcement_${new Date().toDateString()}`,
        eventType: "reinforcement",
        tier: 3,
        title: "You're On a Roll!",
        body: `${profile.shortTermMemory.consecutiveLowDays} days in a row under your daily limit.`,
        mergeKey: "reinforcement",
        shouldPush: remainingBudget > 0,
      });
    }

    if (hour >= 20 && remainingBudget > 0) {
      decisions.push({
        id: `daily_summary_${new Date().toDateString()}`,
        eventType: "daily_summary",
        tier: 3,
        title: "Daily Summary",
        body: `Spent $${Math.round(bs.todaySpend)} today. ${bs.todaySpend <= bs.safeDaily ? "Great job staying on track!" : "Tomorrow is a fresh start."}`,
        mergeKey: "daily_summary",
        shouldPush: remainingBudget > 0,
      });
    }
  }

  // Dedup by mergeKey: higher tier wins
  const merged: Record<string, NotificationDecision> = {};
  for (const d of decisions) {
    const key = d.mergeKey || d.id;
    if (!merged[key] || d.tier < merged[key].tier) {
      merged[key] = d;
    }
  }

  return Object.values(merged);
}
