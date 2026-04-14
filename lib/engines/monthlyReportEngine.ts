import { Transaction } from "../storage";
import { sumAmounts, sumByCategory } from "./spendingAnalysis";

export interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  label: string;
  totalSpend: number;
  budget: number;
  dailyAverage: number;
  biggestDay: number;
  biggestDayDate: string;
  byCategory: Record<string, number>;
  transactionCount: number;
  underBudget: boolean;
  generatedAt: number;
}

export function generateMonthlyReport(
  transactions: Transaction[],
  month: number,
  year: number,
  budget: number
): MonthlyReport {
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 0, 23, 59, 59, 999).getTime();
  const monthTxs = transactions.filter((t) => t.timestamp >= start && t.timestamp <= end);

  const totalSpend = sumAmounts(monthTxs);
  const byCategory = sumByCategory(monthTxs);

  const dailyMap: Record<string, number> = {};
  for (const tx of monthTxs) {
    const d = new Date(tx.timestamp);
    const key = d.toDateString();
    dailyMap[key] = (dailyMap[key] || 0) + Math.abs(tx.amount);
  }

  const dailyValues = Object.entries(dailyMap);
  const biggestEntry = dailyValues.sort((a, b) => b[1] - a[1])[0];

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyAverage = daysInMonth > 0 ? totalSpend / daysInMonth : 0;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return {
    id: `monthly_${year}_${month}`,
    month,
    year,
    label: `${monthNames[month - 1]} ${year}`,
    totalSpend,
    budget,
    dailyAverage,
    biggestDay: biggestEntry ? biggestEntry[1] : 0,
    biggestDayDate: biggestEntry ? biggestEntry[0] : "",
    byCategory,
    transactionCount: monthTxs.length,
    underBudget: totalSpend <= budget,
    generatedAt: Date.now(),
  };
}
