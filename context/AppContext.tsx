import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getTransactions,
  saveTransaction,
  deleteTransaction,
  bulkSaveTransactions,
  getGoals,
  saveGoals,
  addGoal,
  updateGoal,
  getProfile,
  saveProfile,
  saveInsightSnapshot,
  getCategoryConfig,
  saveCategoryConfig,
  getMerchantMemory,
  recordMerchantCategory,
  recordCategoryUsage,
  Transaction,
  Goal,
  UserProfile,
} from "../lib/storage";
import { isDuplicateTransaction } from "../lib/dedupe";
import { runMigrations } from "../lib/migrations";
import {
  computeBehaviorState,
  BehaviorState,
  analyzeSpending,
  SpendingPattern,
  calcPulseScore,
  PulseScore,
  generateInsights,
  Insight,
  computeRecoveryMode,
  RecoveryMode,
  computeDailyCheckIn,
  DailyCheckIn,
  computeOneMove,
  OneMoveCard,
  calcProjection,
  Projection,
  generateRecoveryPlan,
  RecoveryPlan,
  detectSubscriptions,
  DetectedSubscription,
  computeMomentum,
  MomentumData,
  getRecentMerchants,
  computeUserBehaviorProfile,
  UserBehaviorProfile,
  detectMicroWin,
  MicroWin,
  computeNotificationDecisions,
} from "../lib/engine";
import {
  getNotificationFeed,
  appendToFeed,
  markFeedItemsRead,
  markAllFeedRead,
  getNotificationState,
  saveNotificationState,
  resetDailyBudgetIfNeeded,
  NotificationRecord,
} from "../lib/notificationStorage";
import {
  scheduleLocalNotification,
  hasNotificationPermission,
  requestNotificationPermissions,
} from "../lib/notificationService";

interface AppState {
  transactions: Transaction[];
  goals: Goal[];
  profile: UserProfile;
  pattern: SpendingPattern | null;
  behaviorState: BehaviorState | null;
  userBehaviorProfile: UserBehaviorProfile | null;
  microWin: MicroWin | null;
  insights: Insight[];
  pulseScore: PulseScore | null;
  projection: Projection | null;
  recoveryPlan: RecoveryPlan | null;
  recoveryMode: RecoveryMode;
  dailyCheckIn: DailyCheckIn | null;
  oneMoveCard: OneMoveCard | null;
  subscriptions: DetectedSubscription[];
  momentum: MomentumData | null;
  recentMerchants: string[];
  categoryConfig: Record<string, boolean>;
  notificationFeed: NotificationRecord[];
  notificationsEnabled: boolean;
  isLoading: boolean;
  isReady: boolean;
}

interface AppActions {
  addTransaction: (tx: Transaction) => Promise<void>;
  bulkAddTransactions: (txs: Transaction[]) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addGoal: (goal: Goal) => Promise<void>;
  completeGoal: (id: string) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  updateCategoryConfig: (config: Record<string, boolean>) => Promise<void>;
  enableNotifications: () => Promise<boolean>;
  markNotificationsRead: (ids: string[]) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

type AppContextType = AppState & AppActions;

const DEFAULT_RECOVERY_MODE: RecoveryMode = {
  active: false,
  projectedOverage: 0,
  dailyRecoveryLimit: 0,
  topCategoryToReduce: "",
  actions: [],
};

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    transactions: [],
    goals: [],
    profile: { name: "Friend", monthlyBudget: 2000, monthlyIncome: 5000, currency: "USD" },
    pattern: null,
    behaviorState: null,
    userBehaviorProfile: null,
    microWin: null,
    insights: [],
    pulseScore: null,
    projection: null,
    recoveryPlan: null,
    recoveryMode: DEFAULT_RECOVERY_MODE,
    dailyCheckIn: null,
    oneMoveCard: null,
    subscriptions: [],
    momentum: null,
    recentMerchants: [],
    categoryConfig: {},
    notificationFeed: [],
    notificationsEnabled: false,
    isLoading: true,
    isReady: false,
  });

  const prevBsRef = useRef<BehaviorState | null>(null);

  const computeAndPersistAnalytics = useCallback(
    async (
      txs: Transaction[],
      prof: UserProfile,
      catConfig: Record<string, boolean>
    ) => {
      const bs = computeBehaviorState(txs, prof.monthlyBudget, prof.monthlyIncome);
      const ubp = computeUserBehaviorProfile(bs, txs);
      const mw = detectMicroWin(bs, ubp);
      const pattern = analyzeSpending(txs, prof.monthlyBudget);
      const insights = generateInsights(bs);
      const pulseScore = calcPulseScore(bs);
      const recoveryMode = computeRecoveryMode(bs);
      const dailyCheckIn = computeDailyCheckIn(bs);
      const oneMoveCard = computeOneMove(bs, catConfig, prof);
      const projection = calcProjection(pattern, prof.monthlyBudget, prof.monthlyIncome);
      const recoveryPlan = generateRecoveryPlan(projection, pattern, prof.monthlyBudget);
      const subscriptions = detectSubscriptions(txs);
      const momentum = computeMomentum(txs, prof.monthlyBudget);
      const recentMerchants = getRecentMerchants(txs);

      await saveInsightSnapshot(
        insights.map((i) => ({
          id: i.id,
          type: i.type,
          title: i.title,
          message: i.message,
          detail: i.detail,
          action: i.action,
          impactLevel: i.impactLevel,
        }))
      );

      // Async notification processing (non-blocking)
      processNotifications(bs, ubp, mw).catch(() => {});

      prevBsRef.current = bs;

      return {
        behaviorState: bs,
        userBehaviorProfile: ubp,
        microWin: mw,
        pattern,
        insights,
        pulseScore,
        recoveryMode,
        dailyCheckIn,
        oneMoveCard,
        projection,
        recoveryPlan,
        subscriptions,
        momentum,
        recentMerchants,
      };
    },
    []
  );

  const processNotifications = async (
    bs: BehaviorState,
    ubp: UserBehaviorProfile,
    mw: MicroWin | null
  ) => {
    const notifState = await resetDailyBudgetIfNeeded();
    const hour = new Date().getHours();
    const decisions = computeNotificationDecisions(
      bs,
      prevBsRef.current,
      ubp,
      mw,
      notifState,
      hour
    );

    let sentCount = notifState.sentToday;

    for (const d of decisions) {
      const record: NotificationRecord = {
        id: d.id,
        tier: d.tier,
        eventType: d.eventType,
        title: d.title,
        body: d.body,
        timestamp: Date.now(),
        read: false,
        wasSent: false,
      };

      let wasSent = false;
      if (d.shouldPush && notifState.notificationsEnabled && sentCount < notifState.maxPerDay) {
        const hasPerm = await hasNotificationPermission();
        if (hasPerm) {
          await scheduleLocalNotification(d.title, d.body);
          wasSent = true;
          sentCount++;
        }
      }

      await appendToFeed({ ...record, wasSent });
    }

    if (sentCount !== notifState.sentToday) {
      await saveNotificationState({ ...notifState, sentToday: sentCount, totalSent: notifState.totalSent + (sentCount - notifState.sentToday) });
    }

    const feed = await getNotificationFeed();
    setState((prev) => ({ ...prev, notificationFeed: feed }));
  };

  const loadAll = useCallback(async () => {
    try {
      await runMigrations();
      const [txs, goals, profile, catConfig, feed, notifState] = await Promise.all([
        getTransactions(),
        getGoals(),
        getProfile(),
        getCategoryConfig(),
        getNotificationFeed(),
        getNotificationState(),
      ]);

      const analytics = await computeAndPersistAnalytics(txs, profile, catConfig);

      setState((prev) => ({
        ...prev,
        transactions: txs,
        goals,
        profile,
        categoryConfig: catConfig,
        notificationFeed: feed,
        notificationsEnabled: notifState.notificationsEnabled,
        isLoading: false,
        isReady: true,
        ...analytics,
      }));
    } catch {
      setState((prev) => ({ ...prev, isLoading: false, isReady: true }));
    }
  }, [computeAndPersistAnalytics]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const addTransactionAction = useCallback(
    async (tx: Transaction) => {
      const existing = await getTransactions();
      if (isDuplicateTransaction(tx, existing)) return;
      await saveTransaction(tx);
      if (tx.merchant || tx.notes) {
        await recordMerchantCategory(tx.merchant || tx.notes || "", tx.category);
      }
      await recordCategoryUsage(tx.category);
      const [txs, profile, catConfig] = await Promise.all([getTransactions(), getProfile(), getCategoryConfig()]);
      const analytics = await computeAndPersistAnalytics(txs, profile, catConfig);
      setState((prev) => ({ ...prev, transactions: txs, ...analytics }));
    },
    [computeAndPersistAnalytics]
  );

  const bulkAddTransactionsAction = useCallback(
    async (newTxs: Transaction[]) => {
      await bulkSaveTransactions(newTxs);
      const [txs, profile, catConfig] = await Promise.all([getTransactions(), getProfile(), getCategoryConfig()]);
      const analytics = await computeAndPersistAnalytics(txs, profile, catConfig);
      setState((prev) => ({ ...prev, transactions: txs, ...analytics }));
    },
    [computeAndPersistAnalytics]
  );

  const removeTransactionAction = useCallback(
    async (id: string) => {
      await deleteTransaction(id);
      const [txs, profile, catConfig] = await Promise.all([getTransactions(), getProfile(), getCategoryConfig()]);
      const analytics = await computeAndPersistAnalytics(txs, profile, catConfig);
      setState((prev) => ({ ...prev, transactions: txs, ...analytics }));
    },
    [computeAndPersistAnalytics]
  );

  const addGoalAction = useCallback(async (goal: Goal) => {
    await addGoal(goal);
    const goals = await getGoals();
    setState((prev) => ({ ...prev, goals }));
  }, []);

  const completeGoalAction = useCallback(async (id: string) => {
    const goals = await getGoals();
    const goal = goals.find((g) => g.id === id);
    if (goal) await updateGoal({ ...goal, completed: true });
    const updated = await getGoals();
    setState((prev) => ({ ...prev, goals: updated }));
  }, []);

  const updateProfileAction = useCallback(
    async (profile: UserProfile) => {
      await saveProfile(profile);
      const [txs, catConfig] = await Promise.all([getTransactions(), getCategoryConfig()]);
      const analytics = await computeAndPersistAnalytics(txs, profile, catConfig);
      setState((prev) => ({ ...prev, profile, ...analytics }));
    },
    [computeAndPersistAnalytics]
  );

  const updateCategoryConfigAction = useCallback(
    async (config: Record<string, boolean>) => {
      await saveCategoryConfig(config);
      const [txs, profile] = await Promise.all([getTransactions(), getProfile()]);
      const analytics = await computeAndPersistAnalytics(txs, profile, config);
      setState((prev) => ({ ...prev, categoryConfig: config, ...analytics }));
    },
    [computeAndPersistAnalytics]
  );

  const enableNotificationsAction = useCallback(async (): Promise<boolean> => {
    const granted = await requestNotificationPermissions();
    const notifState = await getNotificationState();
    await saveNotificationState({ ...notifState, notificationsEnabled: granted });
    setState((prev) => ({ ...prev, notificationsEnabled: granted }));
    return granted;
  }, []);

  const markNotificationsReadAction = useCallback(async (ids: string[]) => {
    await markFeedItemsRead(ids);
    const feed = await getNotificationFeed();
    setState((prev) => ({ ...prev, notificationFeed: feed }));
  }, []);

  const markAllNotificationsReadAction = useCallback(async () => {
    await markAllFeedRead();
    const feed = await getNotificationFeed();
    setState((prev) => ({ ...prev, notificationFeed: feed }));
  }, []);

  const refreshAction = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await loadAll();
  }, [loadAll]);

  const value: AppContextType = {
    ...state,
    addTransaction: addTransactionAction,
    bulkAddTransactions: bulkAddTransactionsAction,
    removeTransaction: removeTransactionAction,
    addGoal: addGoalAction,
    completeGoal: completeGoalAction,
    updateProfile: updateProfileAction,
    updateCategoryConfig: updateCategoryConfigAction,
    enableNotifications: enableNotificationsAction,
    markNotificationsRead: markNotificationsReadAction,
    markAllNotificationsRead: markAllNotificationsReadAction,
    refresh: refreshAction,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
