import { BehaviorState } from "./behaviorEngine";
import { UserBehaviorProfile } from "./profileEngine";
import { formatCurrency } from "./spendingAnalysis";

interface CoachResponse {
  text: string;
  suggestions?: string[];
}

const FAQ_PAIRS: Array<{ patterns: string[]; response: (bs: BehaviorState) => CoachResponse }> = [
  {
    patterns: ["budget", "how much", "afford", "left"],
    response: (bs) => ({
      text: `You've spent ${formatCurrency(bs.thisMonthSpend)} of your ${formatCurrency(bs.budget)} budget this month. You have ${bs.daysLeft} days left and a safe daily spend of ${formatCurrency(bs.safeDaily)}.`,
      suggestions: ["How am I trending?", "What's my biggest spend?", "Am I on track?"],
    }),
  },
  {
    patterns: ["on track", "doing", "trending", "pace"],
    response: (bs) => ({
      text:
        bs.projectedStatus === "under"
          ? `You're in great shape! Projected to finish ${formatCurrency(bs.budget - bs.projectedTotal)} under budget.`
          : bs.projectedStatus === "on_track"
          ? `You're on pace — projected to land close to your ${formatCurrency(bs.budget)} budget.`
          : `You're projected to go ${formatCurrency(bs.projectedTotal - bs.budget)} over budget. Now's a good time to slow down.`,
      suggestions: ["What should I cut?", "How do I recover?", "Show me my categories"],
    }),
  },
  {
    patterns: ["recover", "over budget", "fix", "help"],
    response: (bs) => ({
      text: bs.recoveryNeeded
        ? `You're in recovery mode. Your daily target is ${formatCurrency(bs.safeDaily)}. Focus on cutting ${bs.topDriftCategory || "discretionary"} spending first — it's your biggest driver.`
        : `You're not over budget yet, but staying under ${formatCurrency(bs.safeDaily)}/day will keep you on track.`,
      suggestions: ["What's my top category?", "Show me my daily limit", "Tips for saving"],
    }),
  },
  {
    patterns: ["category", "biggest", "most", "spend on"],
    response: (bs) => ({
      text: bs.topDriftCategory
        ? `Your biggest flexible category is ${bs.topDriftCategory} at ${formatCurrency(bs.topDriftAmount)} this month. That's ${Math.round((bs.topDriftAmount / bs.budget) * 100)}% of your budget.`
        : `Your spending looks fairly distributed this month — keep tracking to see clearer patterns.`,
      suggestions: ["How do I reduce it?", "What are my other categories?", "Set a category limit"],
    }),
  },
  {
    patterns: ["save", "tip", "advice", "suggestion"],
    response: (bs) => ({
      text: `Here are 3 quick wins: 1) Stay under ${formatCurrency(bs.safeDaily)} today. 2) Skip one ${bs.topDriftCategory || "discretionary"} purchase this week. 3) Log every purchase — awareness alone reduces spending by 15%.`,
      suggestions: ["Tell me more", "What's my streak?", "How am I doing today?"],
    }),
  },
  {
    patterns: ["today", "day", "so far"],
    response: (bs) => ({
      text: `You've spent ${formatCurrency(bs.todaySpend)} today. Your safe daily limit is ${formatCurrency(bs.safeDaily)}, so you have ${formatCurrency(Math.max(0, bs.safeDaily - bs.todaySpend))} left.`,
      suggestions: ["How's my month looking?", "Am I on track?", "What's my daily budget?"],
    }),
  },
  {
    patterns: ["goal", "set", "target"],
    response: (_bs) => ({
      text: `Effective micro-goals are specific and short-term. Try: "No coffee shop purchases this week" or "Stay under $${Math.round(_bs.dailyBudget)} every day for 5 days." The app can auto-suggest goals based on your patterns.`,
      suggestions: ["Suggest goals for me", "Show my current goals", "How do I complete a goal?"],
    }),
  },
];

export function getCoachResponse(
  message: string,
  bs: BehaviorState,
  profile: UserBehaviorProfile
): CoachResponse {
  const lower = message.toLowerCase();

  for (const pair of FAQ_PAIRS) {
    if (pair.patterns.some((p) => lower.includes(p))) {
      return pair.response(bs);
    }
  }

  // Context-aware fallback
  if (profile.tone === "intervention") {
    return {
      text: `I can see you're in recovery mode. The most important thing right now is staying under ${formatCurrency(bs.safeDaily)} per day. What specific area would you like help with?`,
      suggestions: ["How do I recover?", "What's my biggest spend?", "Daily limit tips"],
    };
  }

  if (profile.tone === "nudge") {
    return {
      text: `You're close to your daily limit today. A little mindfulness now goes a long way. Would you like spending tips or a budget check-in?`,
      suggestions: ["Budget check-in", "Saving tips", "Show today's spend"],
    };
  }

  return {
    text: `I'm your MindCents coach! I can help you understand your budget, spot patterns, and build better habits. What would you like to know?`,
    suggestions: ["How's my budget?", "Am I on track?", "Give me saving tips"],
  };
}
