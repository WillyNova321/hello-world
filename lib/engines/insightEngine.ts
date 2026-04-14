import { BehaviorState } from "./behaviorEngine";
import { sumByCategory } from "./spendingAnalysis";
import { formatCurrency } from "./spendingAnalysis";

export interface Insight {
  id: string;
  type: "warning" | "tip" | "pattern" | "achievement";
  title: string;
  message: string;
  detail?: string;
  action?: string;
  impactLevel?: "low" | "medium" | "high";
  confidence?: "high" | "medium" | "low";
}

const IMPACT_ORDER = { high: 0, medium: 1, low: 2, undefined: 3 };

export function generateInsights(state: BehaviorState): Insight[] {
  const {
    txCountThisMonth,
    daysElapsed,
    daysLeft,
    budget,
    thisMonthSpend,
    expectedNow,
    dailyBudget,
    todaySpend,
    yesterdaySpend,
    avgDaily,
    byDayOfWeek,
    byHour,
    dominantPattern,
    topDriftCategory,
    topDriftAmount,
    thisMonth,
  } = state;

  const insights: Insight[] = [];

  // Weekend vs weekday
  const weekendDays = [0, 6];
  const weekdayDays = [1, 2, 3, 4, 5];
  const weekendTotal = weekendDays.reduce((s, d) => s + (byDayOfWeek[d] || 0), 0);
  const weekdayTotal = weekdayDays.reduce((s, d) => s + (byDayOfWeek[d] || 0), 0);
  const weekendCount = weekendDays.filter((d) => byDayOfWeek[d] !== undefined).length || 1;
  const weekdayCount = weekdayDays.filter((d) => byDayOfWeek[d] !== undefined).length || 1;
  const avgWeekend = weekendTotal / weekendCount;
  const avgWeekday = weekdayTotal / weekdayCount;

  // Evening vs morning
  const eveningSpend = [17, 18, 19, 20, 21, 22, 23].reduce((s, h) => s + (byHour[h] || 0), 0);
  const morningSpend = [6, 7, 8, 9, 10, 11, 12].reduce((s, h) => s + (byHour[h] || 0), 0);

  // Small purchase creep
  const smallTxs = thisMonth.filter((t) => Math.abs(t.amount) < 15);
  const smallTotal = smallTxs.reduce((s, t) => s + Math.abs(t.amount), 0);

  if (txCountThisMonth >= 7 && daysElapsed >= 7 && avgWeekend > avgWeekday * 1.6) {
    insights.push({
      id: "weekend_spike",
      type: "pattern",
      title: "Weekend Spending Spike",
      message: `You spend ${formatCurrency(avgWeekend)} on average per weekend day vs ${formatCurrency(avgWeekday)} on weekdays.`,
      detail: "Weekend spending is driving a significant portion of your monthly total.",
      action: "Set a weekend spending cap to smooth out your monthly curve.",
      impactLevel: "medium",
    });
  }

  if (txCountThisMonth >= 8 && daysElapsed >= 5 && eveningSpend > morningSpend * 1.8) {
    insights.push({
      id: "evening_spend",
      type: "pattern",
      title: "Evening Spending Pattern",
      message: `${formatCurrency(eveningSpend)} of your spending happens in the evenings (after 5pm).`,
      detail: "Late-day decisions often lead to higher discretionary spending.",
      action: "Try a 10-minute pause before any purchases after 5pm.",
      impactLevel: "medium",
    });
  }

  if (smallTxs.length >= 10 && smallTotal > budget * 0.1 && smallTotal > 60) {
    insights.push({
      id: "small_purchase_creep",
      type: "warning",
      title: "Small Purchase Creep",
      message: `${smallTxs.length} purchases under $15 add up to ${formatCurrency(smallTotal)} this month.`,
      detail: "Micro-transactions fly under the radar but accumulate quickly.",
      action: "Track these 'invisible' expenses more intentionally.",
      impactLevel: "high",
    });
  }

  if (topDriftAmount > budget * 0.3 && topDriftAmount > 80) {
    insights.push({
      id: "top_category_risk",
      type: "warning",
      title: "Category Risk Alert",
      message: `${topDriftCategory} spending (${formatCurrency(topDriftAmount)}) is over 30% of your monthly budget.`,
      detail: "One category dominating your budget limits flexibility.",
      action: `Set a specific limit for ${topDriftCategory} next week.`,
      impactLevel: "high",
    });
  }

  if (daysElapsed >= 5 && thisMonthSpend > expectedNow * 1.15 && todaySpend <= dailyBudget) {
    insights.push({
      id: "monthly_pace_warning",
      type: "warning",
      title: "Monthly Pace Warning",
      message: `You've spent ${formatCurrency(thisMonthSpend)} but expected only ${formatCurrency(expectedNow)} by now.`,
      detail: "Today looks fine, but earlier spending has you behind pace.",
      action: "Stay below your daily limit for the next few days to recover.",
      impactLevel: "medium",
    });
  }

  if (daysElapsed <= 8 && txCountThisMonth >= 4 && thisMonthSpend > budget * 0.35) {
    insights.push({
      id: "early_month_surge",
      type: "warning",
      title: "Early Month Surge",
      message: `You've used ${Math.round((thisMonthSpend / budget) * 100)}% of your budget in just ${daysElapsed} days.`,
      detail: "An early month spending burst makes it hard to stay under budget.",
      action: "Aim for spending-free days this week to rebalance.",
      impactLevel: "high",
    });
  }

  if (yesterdaySpend > avgDaily * 1.5 && todaySpend > avgDaily * 0.9) {
    insights.push({
      id: "bounce_back_risk",
      type: "warning",
      title: "Bounce-Back Risk",
      message: "You had a high-spend day yesterday and today is trending similarly.",
      detail: "Two consecutive high-spend days significantly impact your monthly projection.",
      action: "Make today a minimal-spend day to offset yesterday's total.",
      impactLevel: "medium",
    });
  }

  if (todaySpend > avgDaily * 1.7 && todaySpend > 30) {
    insights.push({
      id: "today_high",
      type: "tip",
      title: "Today's Spend is High",
      message: `You've spent ${formatCurrency(todaySpend)} today — ${Math.round((todaySpend / avgDaily) * 100)}% of your daily average.`,
      action: "Pause on any remaining non-essential purchases today.",
      impactLevel: "low",
    });
  }

  if (dominantPattern === "category" && !insights.find((i) => i.id === "top_category_risk")) {
    insights.push({
      id: "category_pattern",
      type: "pattern",
      title: "Category Concentration",
      message: `Your spending is concentrated in ${topDriftCategory || "one category"}.`,
      action: "Try to diversify or set a specific category budget.",
      impactLevel: "medium",
    });
  }

  if (thisMonthSpend < budget * 0.45 && daysLeft < 15 && daysElapsed >= 15) {
    insights.push({
      id: "on_track",
      type: "achievement",
      title: "Halfway There — Well Done!",
      message: `With ${daysLeft} days left you've only used ${Math.round((thisMonthSpend / budget) * 100)}% of your budget.`,
      impactLevel: "low",
    });
  }

  // Fallbacks
  if (insights.length === 0) {
    if (txCountThisMonth < 5) {
      insights.push({
        id: "getting_started",
        type: "tip",
        title: "Getting Started",
        message: "Log a few more transactions to unlock personalized insights.",
        action: "Add at least 5 transactions to see your spending patterns.",
        impactLevel: "low",
      });
    } else {
      insights.push({
        id: "steady",
        type: "achievement",
        title: "Steady Progress",
        message: "Your spending looks balanced. Keep up the good work!",
        impactLevel: "low",
      });
    }
  }

  // Sort by impact, dedup, limit 3
  const sorted = insights.sort((a, b) => {
    const aOrder = a.impactLevel ? IMPACT_ORDER[a.impactLevel] : IMPACT_ORDER["undefined"];
    const bOrder = b.impactLevel ? IMPACT_ORDER[b.impactLevel] : IMPACT_ORDER["undefined"];
    return aOrder - bOrder;
  });

  const seen = new Set<string>();
  const deduped: Insight[] = [];
  for (const ins of sorted) {
    if (!seen.has(ins.id)) {
      seen.add(ins.id);
      deduped.push(ins);
    }
  }

  return deduped.slice(0, 3);
}
