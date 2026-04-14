import { Transaction } from "../storage";

export interface MomentumData {
  currentStreak: number;
  bestStreak: number;
  streakType: string;
  description: string;
}

export function computeMomentum(txs: Transaction[], monthlyBudget: number): MomentumData {
  if (txs.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      streakType: "daily limit",
      description: "Log transactions to start tracking your streak.",
    };
  }

  const dailyBudget = monthlyBudget / 30;
  const limit = dailyBudget * 1.1;

  // Build a map of daily spend
  const dailySpend: Record<string, number> = {};
  for (const tx of txs) {
    const date = new Date(tx.timestamp);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    dailySpend[key] = (dailySpend[key] || 0) + Math.abs(tx.amount);
  }

  // Build sorted list of days (most recent first)
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    dates.push(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }

  // Count current streak (from today backwards)
  let currentStreak = 0;
  for (const key of dates) {
    const spend = dailySpend[key] || 0;
    // Days with no transactions don't break the streak
    if (spend === 0 || spend <= limit) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Count best streak
  let bestStreak = 0;
  let run = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const spend = dailySpend[dates[i]] || 0;
    if (spend === 0 || spend <= limit) {
      run++;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  bestStreak = Math.max(bestStreak, currentStreak);

  let description: string;
  if (currentStreak === 0) {
    description = "Get back under your daily limit to start a new streak.";
  } else if (currentStreak === 1) {
    description = "1 day within your daily limit — great start!";
  } else {
    description = `${currentStreak} days in a row within your daily limit — keep it going!`;
  }

  return {
    currentStreak,
    bestStreak,
    streakType: "daily limit",
    description,
  };
}
