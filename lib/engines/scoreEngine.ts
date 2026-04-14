import { BehaviorState } from "./behaviorEngine";

export interface PulseScore {
  score: number;
  level: "safe" | "caution" | "danger";
  label: "On Track" | "Caution" | "At Risk";
  confidence: "high" | "medium" | "low";
  reasons: string[];
  explanation: string;
}

export function calcPulseScore(state: BehaviorState): PulseScore {
  const { budget, thisMonthSpend, flexibleSpend, expectedNow, fixedSpend, todaySpend, dailyBudget, txCountThisMonth, daysElapsed } = state;

  // Factor 1 (50%): Projected outcome
  const overallRatio = budget > 0 ? state.projectedTotal / budget : 1;
  const flexibleRatio = budget > 0 ? (flexibleSpend / Math.max(daysElapsed, 1)) * state.totalDays / budget : 1;
  const blendedRatio = overallRatio * 0.6 + flexibleRatio * 0.4;
  let f1 = 100;
  if (blendedRatio <= 0.85) f1 = 100;
  else if (blendedRatio >= 1.2) f1 = 0;
  else f1 = Math.round(100 * (1.2 - blendedRatio) / (1.2 - 0.85));

  // Factor 2 (30%): Current pace
  const paceRatio = expectedNow > 0 ? thisMonthSpend / expectedNow : 1;
  // Fixed coverage: if fixedSpend explains a portion of excess, reduce penalty
  const fixedCoverage = expectedNow > 0 ? Math.min(fixedSpend / Math.max(thisMonthSpend - expectedNow, 1), 1) : 0;
  const adjustedPaceRatio = paceRatio > 1 ? 1 + (paceRatio - 1) * (1 - fixedCoverage * 0.6) : paceRatio;
  let f2 = 100;
  if (adjustedPaceRatio <= 0.85) f2 = 100;
  else if (adjustedPaceRatio >= 1.3) f2 = 0;
  else f2 = Math.round(100 * (1.3 - adjustedPaceRatio) / (1.3 - 0.85));

  // Factor 3 (20%): Today's flexible spend
  const todayFlexRatio = (dailyBudget * 1.5) > 0 ? todaySpend / (dailyBudget * 1.5) : 1;
  let f3 = 100;
  if (todayFlexRatio <= 0.7) f3 = 100;
  else if (todayFlexRatio >= 1.2) f3 = 0;
  else f3 = Math.round(100 * (1.2 - todayFlexRatio) / (1.2 - 0.7));

  const rawScore = f1 * 0.5 + f2 * 0.3 + f3 * 0.2;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let level: "safe" | "caution" | "danger";
  let label: "On Track" | "Caution" | "At Risk";
  if (score >= 65) { level = "safe"; label = "On Track"; }
  else if (score >= 40) { level = "caution"; label = "Caution"; }
  else { level = "danger"; label = "At Risk"; }

  let confidence: "high" | "medium" | "low";
  if (txCountThisMonth >= 15 && daysElapsed >= 7) confidence = "high";
  else if (txCountThisMonth >= 5 && daysElapsed >= 3) confidence = "medium";
  else confidence = "low";

  const reasons: string[] = [];
  const pct = Math.round(blendedRatio * 100);
  if (blendedRatio <= 0.9) reasons.push(`You're projected to finish the month under budget — great pacing.`);
  else if (blendedRatio <= 1.05) reasons.push(`Your spending is on pace with your budget for the month.`);
  else reasons.push(`At this rate, you're projected to spend ${pct}% of your budget — consider slowing down.`);

  const paceLabel = paceRatio > 1.1 ? "ahead of" : paceRatio < 0.9 ? "behind" : "on par with";
  reasons.push(`Your current pace is ${paceLabel} where you'd expect to be mid-month.`);

  if (todaySpend > dailyBudget) reasons.push(`Today's spending exceeded your daily budget of $${Math.round(dailyBudget)}.`);
  else if (todaySpend > 0) reasons.push(`Today's spending is within your daily limit so far.`);

  if (confidence === "low") reasons.push(`Score confidence is low — keep logging to improve accuracy.`);

  const explanation =
    score >= 65
      ? `Your finances look healthy for this month.`
      : score >= 40
      ? `Your spending needs attention to stay on track.`
      : `Immediate action is recommended to avoid going over budget.`;

  return { score, level, label, confidence, reasons, explanation };
}
