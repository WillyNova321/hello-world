import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Data Models ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  timestamp: number;
  notes?: string;
  merchant?: string;
  isPlanned?: boolean;
  status?: "pending" | "posted";
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  type: "reduce_spending" | "limit_category" | "daily_limit" | "logging" | "recovery";
  category?: string;
  deadline?: "today" | "week" | "month";
  completed: boolean;
  createdAt: number;
}

export interface UserProfile {
  name: string;
  monthlyBudget: number;
  monthlyIncome: number;
  currency: string;
}

export interface InsightSnapshot {
  id: string;
  type: "warning" | "tip" | "pattern" | "achievement";
  title: string;
  message: string;
  detail?: string;
  action?: string;
  impactLevel?: "low" | "medium" | "high";
}

export interface CategoryConfig {
  categoryId: string;
  isFixed: boolean;
}

export interface PendingCapture {
  id: string;
  rawMerchant: string;
  cleanedMerchant: string;
  amount: number;
  timestamp: number;
  cardName: string;
  predictedCategory: string;
  confidence: number;
}

// ─── Keys ────────────────────────────────────────────────────────────────────

const KEYS = {
  TRANSACTIONS: "@mindcents/transactions",
  GOALS: "@mindcents/goals",
  PROFILE: "@mindcents/profile",
  INSIGHT_SNAPSHOT: "@mindcents/insight_snapshot_v2",
  CATEGORY_USAGE: "@mindcents/category_usage",
  CATEGORY_CONFIG: "@mindcents/category_config",
  MERCHANT_MEMORY: "@mindcents/merchant_memory",
  PENDING_QUEUE: "@mindcents/pending_capture_queue",
  ONBOARDING_COMPLETE: "@mindcents/onboarding_complete",
  SCHEMA_VERSION: "@mindcents/schema_version",
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getTransactions(): Promise<Transaction[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTransaction(tx: Transaction): Promise<void> {
  try {
    const txs = await getTransactions();
    const idx = txs.findIndex((t) => t.id === tx.id);
    if (idx >= 0) txs[idx] = tx;
    else txs.push(tx);
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch {}
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const txs = await getTransactions();
    await AsyncStorage.setItem(
      KEYS.TRANSACTIONS,
      JSON.stringify(txs.filter((t) => t.id !== id))
    );
  } catch {}
}

export async function bulkSaveTransactions(newTxs: Transaction[]): Promise<void> {
  try {
    const existing = await getTransactions();
    const merged = [...existing];
    for (const tx of newTxs) {
      const idx = merged.findIndex((t) => t.id === tx.id);
      if (idx >= 0) merged[idx] = tx;
      else merged.push(tx);
    }
    await AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(merged));
  } catch {}
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function getGoals(): Promise<Goal[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GOALS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveGoals(goals: Goal[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  } catch {}
}

export async function addGoal(goal: Goal): Promise<void> {
  try {
    const goals = await getGoals();
    goals.push(goal);
    await saveGoals(goals);
  } catch {}
}

export async function updateGoal(goal: Goal): Promise<void> {
  try {
    const goals = await getGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) goals[idx] = goal;
    await saveGoals(goals);
  } catch {}
}

// ─── Profile ──────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: UserProfile = {
  name: "Friend",
  monthlyBudget: 2000,
  monthlyIncome: 5000,
  currency: "USD",
};

export async function getProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROFILE);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch {}
}

// ─── Insight Snapshot ─────────────────────────────────────────────────────────

export async function getInsightSnapshot(): Promise<InsightSnapshot[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.INSIGHT_SNAPSHOT);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveInsightSnapshot(snapshots: InsightSnapshot[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.INSIGHT_SNAPSHOT, JSON.stringify(snapshots));
  } catch {}
}

// ─── Category Usage ───────────────────────────────────────────────────────────

export async function getCategoryUsage(): Promise<Record<string, number>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CATEGORY_USAGE);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function recordCategoryUsage(categoryId: string): Promise<void> {
  try {
    const usage = await getCategoryUsage();
    usage[categoryId] = (usage[categoryId] || 0) + 1;
    await AsyncStorage.setItem(KEYS.CATEGORY_USAGE, JSON.stringify(usage));
  } catch {}
}

// ─── Category Config ──────────────────────────────────────────────────────────

export async function getCategoryConfig(): Promise<Record<string, boolean>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CATEGORY_CONFIG);
    if (!raw) return {};
    const arr: CategoryConfig[] = JSON.parse(raw);
    const map: Record<string, boolean> = {};
    for (const c of arr) map[c.categoryId] = c.isFixed;
    return map;
  } catch {
    return {};
  }
}

export async function saveCategoryConfig(config: Record<string, boolean>): Promise<void> {
  try {
    const arr: CategoryConfig[] = Object.entries(config).map(([categoryId, isFixed]) => ({
      categoryId,
      isFixed,
    }));
    await AsyncStorage.setItem(KEYS.CATEGORY_CONFIG, JSON.stringify(arr));
  } catch {}
}

// ─── Merchant Memory ──────────────────────────────────────────────────────────

export async function getMerchantMemory(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.MERCHANT_MEMORY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveMerchantMemory(memory: Record<string, string>): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.MERCHANT_MEMORY, JSON.stringify(memory));
  } catch {}
}

export async function recordMerchantCategory(merchant: string, category: string): Promise<void> {
  try {
    if (!merchant.trim()) return;
    const memory = await getMerchantMemory();
    memory[merchant.toLowerCase().trim()] = category;
    await saveMerchantMemory(memory);
  } catch {}
}

// ─── Pending Capture Queue ───────────────────────────────────────────────────

export async function getPendingQueue(): Promise<PendingCapture[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PENDING_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function enqueuePendingCapture(capture: PendingCapture): Promise<void> {
  try {
    const queue = await getPendingQueue();
    queue.push(capture);
    await AsyncStorage.setItem(KEYS.PENDING_QUEUE, JSON.stringify(queue));
  } catch {}
}

export async function dequeueFirstCapture(): Promise<PendingCapture | null> {
  try {
    const queue = await getPendingQueue();
    if (queue.length === 0) return null;
    const first = queue[0];
    await AsyncStorage.setItem(KEYS.PENDING_QUEUE, JSON.stringify(queue.slice(1)));
    return first;
  } catch {
    return null;
  }
}

export async function clearPendingQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.PENDING_QUEUE, JSON.stringify([]));
  } catch {}
}

// ─── Onboarding ───────────────────────────────────────────────────────────────

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
    return val === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, "true");
  } catch {}
}

// ─── Schema Version ───────────────────────────────────────────────────────────

export async function getSchemaVersion(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(KEYS.SCHEMA_VERSION);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function setSchemaVersion(version: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.SCHEMA_VERSION, String(version));
  } catch {}
}

// ─── Export / Import / Reset ─────────────────────────────────────────────────

export async function exportAllData(): Promise<string> {
  try {
    const [transactions, goals, profile, categoryConfig, merchantMemory] = await Promise.all([
      getTransactions(),
      getGoals(),
      getProfile(),
      getCategoryConfig(),
      getMerchantMemory(),
    ]);
    return JSON.stringify({ transactions, goals, profile, categoryConfig, merchantMemory, exportedAt: Date.now() }, null, 2);
  } catch {
    return "{}";
  }
}

export async function importAllData(jsonString: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonString);
    const ops: Promise<void>[] = [];
    if (data.transactions) ops.push(AsyncStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(data.transactions)));
    if (data.goals) ops.push(AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(data.goals)));
    if (data.profile) ops.push(AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(data.profile)));
    if (data.categoryConfig) ops.push(saveCategoryConfig(data.categoryConfig));
    if (data.merchantMemory) ops.push(saveMerchantMemory(data.merchantMemory));
    await Promise.all(ops);
    return true;
  } catch {
    return false;
  }
}

export async function clearTransactionData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      KEYS.TRANSACTIONS,
      KEYS.GOALS,
      KEYS.INSIGHT_SNAPSHOT,
      KEYS.CATEGORY_USAGE,
      KEYS.MERCHANT_MEMORY,
      KEYS.PENDING_QUEUE,
    ]);
  } catch {}
}
