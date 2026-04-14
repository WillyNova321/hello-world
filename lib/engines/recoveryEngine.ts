import { BehaviorState } from "./behaviorEngine";
import { formatCurrency } from "./spendingAnalysis";
import { sumByCategory, splitFixedFlexible } from "./spendingAnalysis";

export interface RecoveryMode {
  active: boolean;
  projectedOverage: number;
  dailyRecoveryLimit: number;
  topCategoryToReduce: string;
  actions: string[];
  reassuranceLine?: string;
}

export function computeRecoveryMode(state: BehaviorState): RecoveryMode {
  const { recoveryNeeded, projectedTotal, budget, daysLeft, recoveryDailyTarget, topDriftCategory, thisMonth } = state;

  if (!recoveryNeeded || daysLeft <= 0) {
    return {
      active: false,
      projectedOverage: 0,
      dailyRecoveryLimit: recoveryDailyTarget,
      topCategoryToReduce: topDriftCategory || "discretionary spending",
      actions: [],
    };
  }

  const overage = projectedTotal - budget;
  const { flexible } = splitFixedFlexible(thisMonth);
  const flexByCategory = sumByCategory(flexible);

  // Sort flexible categories by spend
  const flexCats = Object.entries(flexByCategory).sort((a, b) => b[1] - a[1]);
  const topCat = flexCats[0];
  const secondCat = flexCats[1];

  const actions: string[] = [];

  if (topCat) {
    const saving1 = topCat[1] * 0.4;
    actions.push(`Cut ${topCat[0]} spending by 40% — saves ~${formatCurrency(saving1)}`);
  }

  if (secondCat) {
    const saving2 = secondCat[1] * 0.25;
    actions.push(`Reduce ${secondCat[0]} by 25% — saves ~${formatCurrency(saving2)}`);
  }

  actions.push(`Stay under ${formatCurrency(recoveryDailyTarget)}/day for the next ${daysLeft} days`);

  if (overage > 50) {
    const skipCount = overage > 150 ? "2–3" : "1–2";
    actions.push(`Skip ${skipCount} non-essential purchases this week`);
  }

  let reassuranceLine: string | undefined;
  if (overage < 30) {
    reassuranceLine = "You're very close — a couple of mindful days will get you there.";
  } else if (overage < 100) {
    reassuranceLine = "This is recoverable with a few intentional choices this week.";
  } else if (daysLeft >= 10) {
    reassuranceLine = `You have ${daysLeft} days — that's enough time to turn this around.`;
  } else {
    reassuranceLine = "Focus on necessities only — you've got this.";
  }

  return {
    active: true,
    projectedOverage: overage,
    dailyRecoveryLimit: recoveryDailyTarget,
    topCategoryToReduce: topCat ? topCat[0] : topDriftCategory || "discretionary spending",
    actions: actions.slice(0, 4),
    reassuranceLine,
  };
}
