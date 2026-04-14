// ─── Re-exports from all engines ─────────────────────────────────────────────
export * from "./engines/spendingAnalysis";
export * from "./engines/behaviorEngine";
export * from "./engines/scoreEngine";
export * from "./engines/insightEngine";
export * from "./engines/recoveryEngine";
export * from "./engines/checkInEngine";
export * from "./engines/subscriptionEngine";
export * from "./engines/streakEngine";
export * from "./engines/profileEngine";
export * from "./engines/microWinEngine";
export * from "./engines/notificationEngine";
export * from "./engines/goalsEngine";
export * from "./engines/personaEngine";
export * from "./engines/coachEngine";
export * from "./engines/monthlyReportEngine";
export * from "./engines/quarterlyReportEngine";

import { Transaction } from "./storage";
import { BehaviorState, computeBehaviorState } from "./engines/behaviorEngine";
import { sumAmounts, splitFixedFlexible, filterThisMonth } from "./engines/spendingAnalysis";
import { formatCurrency } from "./engines/spendingAnalysis";

// ─── SpendingPattern ─────────────────────────────────────────────────────────

export interface SpendingPattern {
  byDayOfWeek: Record<number, number>;
  byHour: Record<number, number>;
  byCategory: Record<string, number>;
  avgDailySpend: number;
  todaySpend: number;
  thisMonthSpend: number;
  lastMonthSpend: number;
  txCountThisMonth: number;
  daysElapsed: number;
  daysInMonth: number;
  daysLeft: number;
  expectedSpend: number;
  projectedTotal: number;
  fixedSpend: number;
  flexibleSpend: number;
}

export function analyzeSpending(txs: Transaction[], budget: number): SpendingPattern {
  const bs = computeBehaviorState(txs, budget, 0);
  return {
    byDayOfWeek: bs.byDayOfWeek,
    byHour: bs.byHour,
    byCategory: bs.byCategory,
    avgDailySpend: bs.avgDaily,
    todaySpend: bs.todaySpend,
    thisMonthSpend: bs.thisMonthSpend,
    lastMonthSpend: bs.lastMonthSpend,
    txCountThisMonth: bs.txCountThisMonth,
    daysElapsed: bs.daysElapsed,
    daysInMonth: bs.totalDays,
    daysLeft: bs.daysLeft,
    expectedSpend: bs.expectedNow,
    projectedTotal: bs.projectedTotal,
    fixedSpend: bs.fixedSpend,
    flexibleSpend: bs.flexibleSpend,
  };
}

// ─── Projection ───────────────────────────────────────────────────────────────

export interface WhatIfScenario {
  label: string;
  projectedBalance: number;
  savings: number;
  reductionPct?: number;
  category?: string;
}

export interface Projection {
  currentBalance: number;
  projectedBalance: number;
  daysLeft: number;
  avgDailySpend: number;
  safeDaily: number;
  isOverspending: boolean;
  scenarios: WhatIfScenario[];
}

export function calcProjection(
  pattern: SpendingPattern,
  budget: number,
  _income: number
): Projection {
  const currentBalance = budget - pattern.thisMonthSpend;
  const projectedBalance = budget - pattern.projectedTotal;
  const isOverspending = projectedBalance < 0;

  // Scenario 1: 20% cut in flexible
  const flex20 = pattern.flexibleSpend * 0.2;
  const proj20 = pattern.projectedTotal - flex20 * (pattern.daysLeft / Math.max(pattern.daysElapsed, 1));

  // Scenario 2: 40% cut in flexible
  const flex40 = pattern.flexibleSpend * 0.4;
  const proj40 = pattern.projectedTotal - flex40 * (pattern.daysLeft / Math.max(pattern.daysElapsed, 1));

  // Scenario 3: 50% cut in top category
  const topCatEntries = Object.entries(pattern.byCategory).sort((a, b) => b[1] - a[1]);
  const topCat = topCatEntries[0];
  const topCatCut = topCat ? topCat[1] * 0.5 : 0;
  const proj50 = pattern.projectedTotal - topCatCut * (pattern.daysLeft / Math.max(pattern.daysElapsed, 1));

  const scenarios: WhatIfScenario[] = [
    {
      label: "Cut flexible 20%",
      projectedBalance: budget - proj20,
      savings: proj20 < pattern.projectedTotal ? pattern.projectedTotal - proj20 : 0,
      reductionPct: 20,
    },
    {
      label: "Cut flexible 40%",
      projectedBalance: budget - proj40,
      savings: proj40 < pattern.projectedTotal ? pattern.projectedTotal - proj40 : 0,
      reductionPct: 40,
    },
    {
      label: topCat ? `Cut ${topCat[0]} 50%` : "Cut top category 50%",
      projectedBalance: budget - proj50,
      savings: proj50 < pattern.projectedTotal ? pattern.projectedTotal - proj50 : 0,
      reductionPct: 50,
      category: topCat ? topCat[0] : undefined,
    },
  ];

  return {
    currentBalance,
    projectedBalance,
    daysLeft: pattern.daysLeft,
    avgDailySpend: pattern.avgDailySpend,
    safeDaily: pattern.daysLeft > 0 ? currentBalance / pattern.daysLeft : 0,
    isOverspending,
    scenarios,
  };
}

// ─── RecoveryPlan ─────────────────────────────────────────────────────────────

export interface RecoveryPlan {
  needed: boolean;
  steps: string[];
  dailyLimit: number;
}

export function generateRecoveryPlan(
  projection: Projection,
  pattern: SpendingPattern,
  budget: number
): RecoveryPlan {
  if (!projection.isOverspending) {
    return { needed: false, steps: [], dailyLimit: projection.safeDaily };
  }

  const overage = Math.abs(projection.projectedBalance);
  const steps: string[] = [];

  const topCats = Object.entries(pattern.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  if (topCats[0]) {
    steps.push(`Reduce ${topCats[0][0]} by 40% — saves ${formatCurrency(topCats[0][1] * 0.4)}`);
  }
  if (topCats[1]) {
    steps.push(`Reduce ${topCats[1][0]} by 25% — saves ${formatCurrency(topCats[1][1] * 0.25)}`);
  }
  steps.push(`Stay under ${formatCurrency(projection.safeDaily)}/day for the remaining ${projection.daysLeft} days`);

  return { needed: true, steps, dailyLimit: projection.safeDaily };
}
