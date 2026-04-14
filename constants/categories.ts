export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isFixed: boolean;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "food",          name: "Food & Dining",   icon: "restaurant",          color: "#F97316", isFixed: false },
  { id: "transport",     name: "Transport",        icon: "car",                 color: "#0EA5E9", isFixed: false },
  { id: "shopping",      name: "Shopping",         icon: "bag",                 color: "#8B5CF6", isFixed: false },
  { id: "entertainment", name: "Entertainment",    icon: "film",                color: "#EC4899", isFixed: false },
  { id: "health",        name: "Health",           icon: "heart",               color: "#EF4444", isFixed: false },
  { id: "groceries",     name: "Groceries",        icon: "nutrition",           color: "#10B981", isFixed: false },
  { id: "utilities",     name: "Utilities",        icon: "flash",               color: "#F59E0B", isFixed: true  },
  { id: "subscriptions", name: "Subscriptions",    icon: "repeat",              color: "#6366F1", isFixed: true  },
  { id: "coffee",        name: "Coffee",           icon: "cafe",                color: "#92400E", isFixed: false },
  { id: "travel",        name: "Travel",           icon: "airplane",            color: "#0891B2", isFixed: false },
  { id: "education",     name: "Education",        icon: "book",                color: "#059669", isFixed: false },
  { id: "other",         name: "Other",            icon: "ellipsis-horizontal", color: "#64748B", isFixed: false },
];

export function getCategoryById(id: string): Category | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.id === id);
}

// Keyword ruleset for category suggestion
const KEYWORD_RULES: Array<{ keywords: string[]; category: string }> = [
  { keywords: ["restaurant", "burger", "pizza", "sushi", "taco", "sandwich", "diner", "grill", "bistro", "cafe", "mcdonald", "chipotle", "subway", "domino", "wendy", "chick-fil", "panera", "popeyes", "kfc", "dunkin"], category: "food" },
  { keywords: ["starbucks", "coffee", "espresso", "latte", "cappuccino", "brew", "roast", "bean"], category: "coffee" },
  { keywords: ["uber", "lyft", "gas", "fuel", "shell", "bp", "chevron", "exxon", "transit", "parking", "metro", "taxi", "bus", "train", "amtrak"], category: "transport" },
  { keywords: ["amazon", "ebay", "shop", "store", "mall", "target", "walmart", "costco", "nordstrom", "zara", "h&m", "uniqlo", "clothing", "apparel", "fashion"], category: "shopping" },
  { keywords: ["netflix", "spotify", "hulu", "disney", "apple", "google play", "subscription", "monthly plan", "membership"], category: "subscriptions" },
  { keywords: ["movie", "cinema", "theater", "concert", "ticketmaster", "event", "game", "bowling", "arcade", "amusement"], category: "entertainment" },
  { keywords: ["doctor", "pharmacy", "cvs", "walgreens", "hospital", "clinic", "dental", "optician", "medical", "health", "gym", "fitness", "yoga", "peloton"], category: "health" },
  { keywords: ["grocery", "whole foods", "trader joe", "safeway", "kroger", "wegmans", "aldi", "sprouts", "market", "supermarket"], category: "groceries" },
  { keywords: ["electric", "utility", "water", "internet", "cable", "verizon", "at&t", "comcast", "xfinity", "gas company", "pge", "con ed"], category: "utilities" },
  { keywords: ["hotel", "airbnb", "flight", "airline", "delta", "united", "southwest", "american airlines", "expedia", "booking.com", "resort", "vacation"], category: "travel" },
  { keywords: ["school", "tuition", "course", "udemy", "coursera", "textbook", "university", "college", "class", "masterclass"], category: "education" },
];

export function suggestCategory(
  notes: string,
  merchantInput: string,
  usageMap?: Record<string, string>
): string {
  const text = `${merchantInput} ${notes}`.toLowerCase();

  // Check merchant memory first
  if (usageMap) {
    const merchantKey = merchantInput.toLowerCase().trim();
    if (merchantKey && usageMap[merchantKey]) {
      return usageMap[merchantKey];
    }
  }

  // Keyword rules
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.category;
    }
  }

  return "other";
}
