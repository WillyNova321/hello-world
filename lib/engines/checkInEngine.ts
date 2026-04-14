import { BehaviorState } from "./behaviorEngine";
import { formatCurrency } from "./spendingAnalysis";

export interface DailyCheckIn {
  safeDaily: number;
  todaySpend: number;
  remainingToday: number;
  statusLevel: "on_pace" | "slightly_over" | "high_spend";
  isOnTrack: boolean;
  statusMessage: string;
  recommendedAction: string;
}

export interface OneMoveCard {
  icon: string;
  title: string;
  description: string;
  rationale?: string;
  tag?: string;
}

export function computeDailyCheckIn(state: BehaviorState): DailyCheckIn {
  const { safeDaily, todaySpend, dailyBudget } = state;

  const remainingToday = Math.max(0, safeDaily - todaySpend);

  let statusLevel: "on_pace" | "slightly_over" | "high_spend";
  let statusMessage: string;
  let recommendedAction: string;
  const isOnTrack = todaySpend <= safeDaily * 1.1;

  if (todaySpend <= safeDaily * 0.75) {
    statusLevel = "on_pace";
    statusMessage = `You're on pace today — ${formatCurrency(remainingToday)} left in your daily budget.`;
    recommendedAction = "Keep up the momentum and log any upcoming purchases.";
  } else if (todaySpend <= safeDaily * 1.1) {
    statusLevel = "slightly_over";
    statusMessage = `You're close to today's limit — ${formatCurrency(remainingToday)} remaining.`;
    recommendedAction = "Consider pausing on any non-essential spending for the rest of the day.";
  } else {
    statusLevel = "high_spend";
    statusMessage = `Today's spend is ${formatCurrency(todaySpend - safeDaily)} over your safe daily limit.`;
    recommendedAction = "No more discretionary spending today — let's make tomorrow count.";
  }

  return {
    safeDaily,
    todaySpend,
    remainingToday,
    statusLevel,
    isOnTrack,
    statusMessage,
    recommendedAction,
  };
}

interface OneMoveCandidate {
  priority: number;
  card: OneMoveCard;
}

export function computeOneMove(
  state: BehaviorState,
  categoryConfig?: Record<string, boolean>,
  profile?: { name?: string }
): OneMoveCard {
  const {
    projectedTotal,
    budget,
    recoveryNeeded,
    yesterdaySpend,
    avgDaily,
    todaySpend,
    safeDaily,
    dominantPattern,
    topDriftCategory,
    topDriftAmount,
    flexibleSpend,
    daysElapsed,
    dailyBudget,
    projectedStatus,
    now,
  } = state;

  const candidates: OneMoveCandidate[] = [];
  const hour = new Date(now).getHours();
  const dayOfWeek = new Date(now).getDay(); // 0=Sun...6=Sat
  const isWeekend = [0, 5, 6].includes(dayOfWeek); // Fri/Sat/Sun
  const hadHighYesterday = yesterdaySpend > avgDaily * 1.5;
  const isEarlyMonth = daysElapsed <= 7;

  if (projectedTotal > budget * 1.2) {
    candidates.push({
      priority: 100,
      card: {
        icon: "alert-circle",
        title: "Recovery Mode Active",
        description: `You're projected ${formatCurrency(projectedTotal - budget)} over budget. Every spend counts now.`,
        rationale: "Projected overage exceeds 20% of your budget.",
        tag: "Recovery",
      },
    });
  }

  if (recoveryNeeded && projectedTotal <= budget * 1.2) {
    candidates.push({
      priority: 85,
      card: {
        icon: "trending-down",
        title: "Rein It In Today",
        description: `You're on track to go over budget. Aim to stay under ${formatCurrency(safeDaily)} today.`,
        tag: "Recovery",
      },
    });
  }

  if (hadHighYesterday && todaySpend > avgDaily * 0.6) {
    candidates.push({
      priority: 80,
      card: {
        icon: "refresh-circle",
        title: "Reset After Yesterday",
        description: "Yesterday was a high-spend day. Make today a recovery day.",
        rationale: "Two consecutive high days significantly impact your monthly outlook.",
        tag: "Recovery",
      },
    });
  }

  if (todaySpend > safeDaily * 0.75) {
    candidates.push({
      priority: 75,
      card: {
        icon: "pause-circle",
        title: "Approaching Daily Limit",
        description: `You've used ${Math.round((todaySpend / safeDaily) * 100)}% of today's budget. Pause before the next purchase.`,
        tag: "Spending Cap",
      },
    });
  }

  if (dominantPattern === "evening" && hour >= 17) {
    candidates.push({
      priority: 72,
      card: {
        icon: "moon",
        title: "Evening Pause",
        description: "Your data shows most spending happens in the evening. Take a breath before any purchase right now.",
        tag: "Pattern Break",
      },
    });
  }

  if (dominantPattern === "weekend" && isWeekend) {
    candidates.push({
      priority: 70,
      card: {
        icon: "calendar",
        title: "Weekend Awareness",
        description: "You tend to spend more on weekends. Set a weekend cap before heading out.",
        tag: "Pattern Break",
      },
    });
  }

  if (topDriftAmount > budget * 0.25 && daysElapsed >= 5) {
    const catName = topDriftCategory || "your top category";
    const catActions: Record<string, string> = {
      food: "Try cooking at home for dinner tonight instead of dining out.",
      coffee: "Brew coffee at home for the next 3 days — save $10–15.",
      entertainment: "Look for a free activity this weekend to offset entertainment spend.",
      shopping: "Put any wish-list items in a 48-hour cart hold before buying.",
    };
    candidates.push({
      priority: 68,
      card: {
        icon: "pie-chart",
        title: `Rein In ${catName}`,
        description: catActions[topDriftCategory] || `${catName} is your biggest spend driver this month. Set a limit.`,
        tag: catName,
      },
    });
  }

  if (hour >= 17 && todaySpend < safeDaily * 0.5) {
    candidates.push({
      priority: 60,
      card: {
        icon: "checkmark-circle",
        title: "Looking Good Today",
        description: `You have ${formatCurrency(safeDaily - todaySpend)} left for today. You're ahead of pace.`,
        rationale: "Carrying a surplus today helps buffer future high-spend days.",
        tag: "Timing",
      },
    });
  }

  if (isEarlyMonth && avgDaily > dailyBudget * 1.1) {
    candidates.push({
      priority: 55,
      card: {
        icon: "speedometer",
        title: "Slow Down Early",
        description: "You're spending faster than your monthly budget allows. Ease off now to avoid a tough month-end.",
        tag: "Pace",
      },
    });
  }

  if (!hadHighYesterday && todaySpend < safeDaily * 0.3 && projectedStatus !== "over") {
    candidates.push({
      priority: 40,
      card: {
        icon: "flame",
        title: "Momentum Day",
        description: "You're well within budget. Keep this streak going — every low-spend day compounds.",
        tag: "Momentum",
      },
    });
  }

  // Default fallback
  candidates.push({
    priority: 0,
    card: {
      icon: "help-circle",
      title: "Pause Before Unplanned Purchases",
      description: "Before any spontaneous buy today, ask: is this planned or impulse? A 10-second pause saves money.",
      tag: "Mindfulness",
    },
  });

  // Pick highest priority
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0].card;
}
