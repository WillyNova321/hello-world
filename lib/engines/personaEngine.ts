import { Transaction } from "../storage";

export interface Persona {
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  color: string;
  traits: string[];
  tips: string[];
}

export function computePersona(
  transactions: Transaction[],
  pattern: "weekend" | "evening" | "category" | null,
  monthlyBudget: number
): Persona {
  if (transactions.length < 5) {
    return {
      name: "The Mindful Tracker",
      emoji: "✨",
      tagline: "Just getting started",
      description: "You're building the habit of tracking. Every transaction logged is a step toward financial clarity.",
      color: "#0EA5E9",
      traits: ["Intentional", "Building habits", "Self-aware"],
      tips: [
        "Log every purchase for 7 days to see your patterns",
        "Start with your biggest spending categories",
        "Set a monthly budget that reflects your real lifestyle",
      ],
    };
  }

  // Check if consistent saver (under budget, steady)
  const dailyBudget = monthlyBudget / 30;
  const dailyMap: Record<string, number> = {};
  for (const tx of transactions) {
    const d = new Date(tx.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    dailyMap[key] = (dailyMap[key] || 0) + Math.abs(tx.amount);
  }
  const dailyValues = Object.values(dailyMap);
  const overDays = dailyValues.filter((s) => s > dailyBudget * 1.1).length;
  const pctOver = dailyValues.length > 0 ? overDays / dailyValues.length : 0;

  if (pattern === "weekend") {
    return {
      name: "The Weekend Warrior",
      emoji: "🎪",
      tagline: "Lives for the weekend",
      description: "Your spending spikes on weekends. You're disciplined during the week but let loose when the weekend hits.",
      color: "#8B5CF6",
      traits: ["Energetic weekends", "Weekday discipline", "Social spender"],
      tips: [
        "Set a specific weekend budget separate from your weekday budget",
        "Plan weekend activities in advance to avoid impulse spending",
        "Track Friday-evening decisions — that's your highest-risk moment",
      ],
    };
  }

  if (pattern === "evening") {
    return {
      name: "The Evening Optimizer",
      emoji: "🌙",
      tagline: "Decisions made after dark",
      description: "Most of your spending happens in the evening. Late-day fatigue and relaxation mode can loosen spending discipline.",
      color: "#6366F1",
      traits: ["Evening-heavy", "Decision fatigue risk", "Mood-driven"],
      tips: [
        "Set an evening spending rule: anything over $20 waits until morning",
        "Review your daily spend before 6pm to stay accountable",
        "Avoid browsing shopping apps after 8pm",
      ],
    };
  }

  if (pattern === "category") {
    return {
      name: "The Category Concentrator",
      emoji: "🎯",
      tagline: "All-in on one thing",
      description: "One spending category dominates your budget. Whether it's food, entertainment, or shopping — you go deep in one area.",
      color: "#EC4899",
      traits: ["Focused spender", "Category loyalty", "High single-category risk"],
      tips: [
        "Set a hard monthly cap on your top category",
        "Find one substitute per week (e.g., cook instead of dining out)",
        "Track your top category daily to stay aware",
      ],
    };
  }

  if (pctOver < 0.2 && transactions.length >= 10) {
    return {
      name: "The Consistent Saver",
      emoji: "🏦",
      tagline: "Steady wins the race",
      description: "Your spending is remarkably consistent. You stick close to your daily limits and rarely overshoot.",
      color: "#10B981",
      traits: ["Disciplined", "Consistent", "Low variance"],
      tips: [
        "Your habits are strong — now optimize: find your biggest savings opportunity",
        "Consider automating savings with what you consistently under-spend",
        "Challenge yourself to a 'no-spend week' once a quarter",
      ],
    };
  }

  if (pctOver > 0.4) {
    return {
      name: "The Spontaneous Spender",
      emoji: "🎯",
      tagline: "Riding the waves",
      description: "Your spending varies widely day to day. High energy days lead to high-spend days — and that unpredictability is the main challenge.",
      color: "#F97316",
      traits: ["Impulsive", "High variance", "Mood-driven"],
      tips: [
        "Introduce a 24-hour rule for any purchase over $30",
        "Keep a running mental budget: ask 'what have I spent today?' before each purchase",
        "Identify your top impulse trigger (time of day, location, mood)",
      ],
    };
  }

  return {
    name: "The Mindful Tracker",
    emoji: "✨",
    tagline: "Balanced and aware",
    description: "You're tracking your spending thoughtfully and staying broadly on pace. Your awareness is your biggest financial asset.",
    color: "#0EA5E9",
    traits: ["Aware", "Balanced", "Improving"],
    tips: [
      "Use your patterns to build a more precise budget",
      "Celebrate low-spend days — they compound over months",
      "Try one spending challenge per month to level up",
    ],
  };
}
