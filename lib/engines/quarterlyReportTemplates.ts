import { QuarterlyReport } from "./quarterlyReportEngine";
import { formatCurrency } from "./spendingAnalysis";

export function quarterlyReportSummary(report: QuarterlyReport): string {
  const overBudget = report.totalSpend > report.budget;
  const trendText =
    report.behaviorTrend === "improving"
      ? "Your spending improved each month — great momentum."
      : report.behaviorTrend === "declining"
      ? "Your spending increased month-over-month this quarter."
      : "Your spending was consistent across the quarter.";

  return [
    `${report.label} Summary`,
    `Total: ${formatCurrency(report.totalSpend)} / ${formatCurrency(report.budget)} budget`,
    `Monthly average: ${formatCurrency(report.avgMonthlySpend)}`,
    overBudget
      ? `You went ${formatCurrency(report.totalSpend - report.budget)} over budget this quarter.`
      : `You came in ${formatCurrency(report.budget - report.totalSpend)} under budget — well done!`,
    report.topCategory ? `Biggest category: ${report.topCategory}` : "",
    trendText,
  ]
    .filter(Boolean)
    .join("\n");
}
