import { Transaction } from "../storage";
import {
  startOfMonth,
  startOfLastMonth,
  endOfLastMonth,
  startOfToday,
  getDaysInMonth,
  getDaysLeft,
  getDayOfMonth,
  filterThisMonth,
  filterLastMonth,
  filterToday,
  sumAmounts,
  sumByCategory,
  splitFixedFlexible,
  isFixedCategory,
} from "./spendingAnalysis";

export interface BehaviorState {
  // Temporal context
  now: number;
  budget: number;
  monthlyIncome: number;
  totalDays: number;
  daysElapsed: number;
  daysLeft: number;

  // Transaction slices
  thisMonth: Transaction[];
  todayTxs: Transaction[];
  yesterdayTxs: Transaction[];

  // Aggregates
  thisMonthSpend: number;
  lastMonthSpend: number;
  todaySpend: number;
  yesterdaySpend: number;
  txCountThisMonth: number;
  byCategory: Record<string, number>;
  byDayOfWeek: Record<number, number>;  // 0=Sun...6=Sat
  byHour: Record<number, number>;
  fixedSpend: number;
  flexibleSpend: number;

  // Pacing
  avgDaily: number;
  dailyBudget: number;
  safeDaily: number;
  projectedTotal: number;
  expectedNow: number;

  // Behavioral assessment
  projectedStatus: "under" | "on_track" | "over";
  todayStatus: "under" | "on_track" | "over";
  topDriftCategory: string;
  topDriftAmount: number;
  dominantPattern: "weekend" | "evening" | "category" | null;
  recoveryNeeded: boolean;
  recoveryDailyTarget: number;
  recoveryDaysRequired: number;
  recoveryPrimaryLever: string;
}

export function computeBehaviorState(
  transactions: Transaction[],
  monthlyBudget: number,
  monthlyIncome: number,
  nowOverride?: number
): BehaviorState {
  const nowDate = nowOverride ? new Date(nowOverride) : new Date();
  const now = nowDate.getTime();

  const totalDays = getDaysInMonth(nowDate);
  const daysElapsed = getDayOfMonth(nowDate);
  const daysLeft = getDaysLeft(nowDate);

  const thisMonth = filterThisMonth(transactions, nowDate);
  const lastMonthTxs = filterLastMonth(transactions, nowDate);
  const todayTxs = filterToday(transactions, nowDate);

  const yesterdayStart = startOfToday(nowDate) - 86400000;
  const yesterdayEnd = startOfToday(nowDate);
  const yesterdayTxs = transactions.filter(
    (t) => t.timestamp >= yesterdayStart && t.timestamp < yesterdayEnd
  );

  const thisMonthSpend = sumAmounts(thisMonth);
  const lastMonthSpend = sumAmounts(lastMonthTxs);
  const todaySpend = sumAmounts(todayTxs);
  const yesterdaySpend = sumAmounts(yesterdayTxs);
  const txCountThisMonth = thisMonth.length;

  const byCategory = sumByCategory(thisMonth);

  // By day of week (0=Sun)
  const byDayOfWeek: Record<number, number> = {};
  for (const tx of thisMonth) {
    const d = new Date(tx.timestamp).getDay();
    byDayOfWeek[d] = (byDayOfWeek[d] || 0) + Math.abs(tx.amount);
  }

  // By hour
  const byHour: Record<number, number> = {};
  for (const tx of thisMonth) {
    const h = new Date(tx.timestamp).getHours();
    byHour[h] = (byHour[h] || 0) + Math.abs(tx.amount);
  }

  const { fixed, flexible } = splitFixedFlexible(thisMonth);
  const fixedSpend = sumAmounts(fixed);
  const flexibleSpend = sumAmounts(flexible);

  // Pacing
  const dailyBudget = monthlyBudget / totalDays;
  const avgDaily = daysElapsed > 0 ? thisMonthSpend / daysElapsed : 0;
  const safeDaily = daysLeft > 0 ? (monthlyBudget - thisMonthSpend) / daysLeft : 0;
  const projectedTotal = thisMonthSpend + avgDaily * daysLeft;
  const expectedNow = monthlyBudget * (daysElapsed / totalDays);

  // Projected status
  const projectedDelta = monthlyBudget - projectedTotal;
  let projectedStatus: "under" | "on_track" | "over";
  if (projectedDelta <= -(monthlyBudget * 0.05)) projectedStatus = "over";
  else if (projectedDelta <= monthlyBudget * 0.05) projectedStatus = "on_track";
  else projectedStatus = "under";

  // Today status
  const todayDelta = dailyBudget - todaySpend;
  let todayStatus: "under" | "on_track" | "over";
  if (todayDelta <= -(dailyBudget * 0.1)) todayStatus = "over";
  else if (todayDelta <= dailyBudget * 0.15) todayStatus = "on_track";
  else todayStatus = "under";

  // Top drift category (flexible only)
  const flexByCategory = sumByCategory(flexible);
  let topDriftCategory = "";
  let topDriftAmount = 0;
  for (const [cat, amt] of Object.entries(flexByCategory)) {
    if (amt > topDriftAmount) {
      topDriftAmount = amt;
      topDriftCategory = cat;
    }
  }

  // Weekend vs weekday spending
  const weekendDays = [0, 6];
  const weekdayDays = [1, 2, 3, 4, 5];
  const weekendTotal = weekendDays.reduce((s, d) => s + (byDayOfWeek[d] || 0), 0);
  const weekdayTotal = weekdayDays.reduce((s, d) => s + (byDayOfWeek[d] || 0), 0);
  const weekendCount = weekendDays.reduce(
    (n, d) => n + (byDayOfWeek[d] !== undefined ? 1 : 0),
    0
  );
  const weekdayCount = weekdayDays.reduce(
    (n, d) => n + (byDayOfWeek[d] !== undefined ? 1 : 0),
    0
  );
  const avgWeekend = weekendCount > 0 ? weekendTotal / weekendCount : 0;
  const avgWeekday = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;

  // Evening vs morning spending
  const eveningSpend = [17, 18, 19, 20, 21, 22, 23].reduce(
    (s, h) => s + (byHour[h] || 0),
    0
  );
  const morningSpend = [6, 7, 8, 9, 10, 11, 12].reduce(
    (s, h) => s + (byHour[h] || 0),
    0
  );

  // Dominant pattern
  let dominantPattern: "weekend" | "evening" | "category" | null = null;
  if (txCountThisMonth >= 7 && avgWeekend > avgWeekday * 1.6) {
    dominantPattern = "weekend";
  } else if (txCountThisMonth >= 8 && eveningSpend > morningSpend * 1.8) {
    dominantPattern = "evening";
  } else if (topDriftAmount > monthlyBudget * 0.3 && txCountThisMonth >= 5) {
    dominantPattern = "category";
  }

  // Recovery
  const recoveryNeeded = projectedTotal > monthlyBudget && daysLeft > 0;
  const recoveryDailyTarget = safeDaily;
  const recoveryDaysRequired = daysLeft;
  const recoveryPrimaryLever = topDriftCategory || "discretionary spending";

  return {
    now,
    budget: monthlyBudget,
    monthlyIncome,
    totalDays,
    daysElapsed,
    daysLeft,
    thisMonth,
    todayTxs,
    yesterdayTxs,
    thisMonthSpend,
    lastMonthSpend,
    todaySpend,
    yesterdaySpend,
    txCountThisMonth,
    byCategory,
    byDayOfWeek,
    byHour,
    fixedSpend,
    flexibleSpend,
    avgDaily,
    dailyBudget,
    safeDaily,
    projectedTotal,
    expectedNow,
    projectedStatus,
    todayStatus,
    topDriftCategory,
    topDriftAmount,
    dominantPattern,
    recoveryNeeded,
    recoveryDailyTarget,
    recoveryDaysRequired,
    recoveryPrimaryLever,
  };
}
