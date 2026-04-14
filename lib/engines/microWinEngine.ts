import { BehaviorState } from "./behaviorEngine";
import { UserBehaviorProfile } from "./profileEngine";

export interface MicroWin {
  id: string;
  priority: number;
  icon: string;
  title: string;
  message: string;
}

export function detectMicroWin(
  bs: BehaviorState,
  profile: UserBehaviorProfile
): MicroWin | null {
  const { shortTermMemory } = profile;
  const { txCountThisMonth, thisMonthSpend, budget, daysElapsed } = bs;
  const { consecutiveLowDays, recentRecovery } = shortTermMemory;

  const candidates: MicroWin[] = [];

  if (recentRecovery) {
    candidates.push({
      id: "successful_recovery",
      priority: 100,
      icon: "checkmark-circle",
      title: "Recovery Complete!",
      message: "You bounced back from a tough streak. That's real financial resilience.",
    });
  }

  if (consecutiveLowDays >= 7 && txCountThisMonth >= 5) {
    candidates.push({
      id: "week_streak",
      priority: 90,
      icon: "flame",
      title: "7-Day Streak!",
      message: "A full week on track. Your spending discipline is paying off.",
    });
  }

  if (consecutiveLowDays >= 5) {
    candidates.push({
      id: "five_day_streak",
      priority: 80,
      icon: "flame",
      title: "5-Day Streak!",
      message: "Five days in a row under your limit — you're building a habit.",
    });
  }

  if (consecutiveLowDays >= 3) {
    candidates.push({
      id: "three_day_streak",
      priority: 70,
      icon: "trending-up",
      title: "3-Day Streak",
      message: "Three days on track. Consistency is where lasting change happens.",
    });
  }

  if (
    daysElapsed >= 14 &&
    thisMonthSpend < budget * 0.44 &&
    txCountThisMonth >= 5
  ) {
    candidates.push({
      id: "halfway_under",
      priority: 60,
      icon: "star",
      title: "Halfway & Under Budget",
      message: `${daysElapsed} days in and still under half your budget. Excellent pacing.`,
    });
  }

  if (
    profile.behaviorTrend === "improving" &&
    daysElapsed >= 12 &&
    txCountThisMonth >= 8 &&
    !bs.recoveryNeeded
  ) {
    candidates.push({
      id: "improved_pacing",
      priority: 50,
      icon: "arrow-up-circle",
      title: "Improving Trend",
      message: "Your spending pace has improved compared to earlier this month.",
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0];
}
