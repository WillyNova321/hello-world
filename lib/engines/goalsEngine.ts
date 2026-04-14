import { Transaction, Goal } from "../storage";
import { sumByCategory, filterThisMonth } from "./spendingAnalysis";

export function generateMicroGoals(transactions: Transaction[], monthlyBudget: number): Goal[] {
  const thisMonth = filterThisMonth(transactions);
  const byCategory = sumByCategory(thisMonth);
  const goals: Goal[] = [];

  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const topCat = sortedCats[0];
  const secondCat = sortedCats[1];

  if (topCat && topCat[1] > monthlyBudget * 0.2) {
    goals.push({
      id: `goal_reduce_${topCat[0]}_${Date.now()}`,
      title: `Reduce ${topCat[0]} spending by 20%`,
      target: Math.round(topCat[1] * 0.8),
      current: Math.round(topCat[1]),
      unit: "USD",
      type: "reduce_spending",
      category: topCat[0],
      deadline: "month",
      completed: false,
      createdAt: Date.now(),
    });
  }

  if (secondCat && secondCat[1] > 50) {
    goals.push({
      id: `goal_limit_${secondCat[0]}_${Date.now() + 1}`,
      title: `Keep ${secondCat[0]} under $${Math.round(secondCat[1] * 0.85)}`,
      target: Math.round(secondCat[1] * 0.85),
      current: Math.round(secondCat[1]),
      unit: "USD",
      type: "limit_category",
      category: secondCat[0],
      deadline: "week",
      completed: false,
      createdAt: Date.now() + 1,
    });
  }

  if (transactions.length < 15) {
    goals.push({
      id: `goal_logging_${Date.now() + 2}`,
      title: "Log every transaction for 7 days",
      target: 7,
      current: Math.min(transactions.length, 7),
      unit: "days",
      type: "logging",
      deadline: "week",
      completed: false,
      createdAt: Date.now() + 2,
    });
  }

  return goals.slice(0, 3);
}
