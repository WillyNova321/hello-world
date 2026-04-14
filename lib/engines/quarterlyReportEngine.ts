import { Transaction } from "../storage";
import { MonthlyReport, generateMonthlyReport } from "./monthlyReportEngine";
import { sumAmounts, sumByCategory } from "./spendingAnalysis";

export interface QuarterlyReport {
  id: string;
  quarter: number;
  year: number;
  label: string;
  months: MonthlyReport[];
  totalSpend: number;
  avgMonthlySpend: number;
  budget: number;
  byCategory: Record<string, number>;
  topCategory: string;
  behaviorTrend: "improving" | "stable" | "declining";
  generatedAt: number;
}

export function generateQuarterlyReport(
  transactions: Transaction[],
  quarter: number,
  year: number,
  monthlyBudget: number
): QuarterlyReport {
  const startMonth = (quarter - 1) * 3 + 1;
  const months: MonthlyReport[] = [];

  for (let m = startMonth; m < startMonth + 3; m++) {
    months.push(generateMonthlyReport(transactions, m, year, monthlyBudget));
  }

  const totalSpend = months.reduce((s, m) => s + m.totalSpend, 0);
  const avgMonthlySpend = totalSpend / 3;

  // Aggregate categories
  const byCategory: Record<string, number> = {};
  for (const m of months) {
    for (const [cat, amt] of Object.entries(m.byCategory)) {
      byCategory[cat] = (byCategory[cat] || 0) + amt;
    }
  }

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

  // Trend: compare first month vs last month
  let behaviorTrend: "improving" | "stable" | "declining";
  const firstMonth = months[0].totalSpend;
  const lastMonth = months[2].totalSpend;
  if (lastMonth < firstMonth * 0.88) behaviorTrend = "improving";
  else if (lastMonth > firstMonth * 1.12) behaviorTrend = "declining";
  else behaviorTrend = "stable";

  return {
    id: `quarterly_${year}_Q${quarter}`,
    quarter,
    year,
    label: `Q${quarter} ${year}`,
    months,
    totalSpend,
    avgMonthlySpend,
    budget: monthlyBudget * 3,
    byCategory,
    topCategory,
    behaviorTrend,
    generatedAt: Date.now(),
  };
}
