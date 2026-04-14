import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationEventType } from "./engines/notificationEngine";

export interface NotificationRecord {
  id: string;
  tier: 1 | 2 | 3;
  eventType: NotificationEventType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  wasSent: boolean;
}

export interface NotificationState {
  notificationsEnabled: boolean;
  sentToday: number;
  totalSent: number;
  maxPerDay: number;
  lastResetDate: string; // ISO date string
}

const FEED_KEY = "@mindcents/notification_feed";
const STATE_KEY = "@mindcents/notification_state";

const DEFAULT_STATE: NotificationState = {
  notificationsEnabled: false,
  sentToday: 0,
  totalSent: 0,
  maxPerDay: 2,
  lastResetDate: new Date().toISOString().split("T")[0],
};

// ─── Feed ─────────────────────────────────────────────────────────────────────

export async function getNotificationFeed(): Promise<NotificationRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(FEED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function appendToFeed(record: NotificationRecord): Promise<void> {
  try {
    const feed = await getNotificationFeed();
    feed.unshift(record); // newest first
    // Keep max 100
    await AsyncStorage.setItem(FEED_KEY, JSON.stringify(feed.slice(0, 100)));
  } catch {}
}

export async function markFeedItemsRead(ids: string[]): Promise<void> {
  try {
    const feed = await getNotificationFeed();
    const updated = feed.map((r) => (ids.includes(r.id) ? { ...r, read: true } : r));
    await AsyncStorage.setItem(FEED_KEY, JSON.stringify(updated));
  } catch {}
}

export async function markAllFeedRead(): Promise<void> {
  try {
    const feed = await getNotificationFeed();
    await AsyncStorage.setItem(
      FEED_KEY,
      JSON.stringify(feed.map((r) => ({ ...r, read: true })))
    );
  } catch {}
}

// ─── State ────────────────────────────────────────────────────────────────────

export async function getNotificationState(): Promise<NotificationState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveNotificationState(state: NotificationState): Promise<void> {
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {}
}

export async function resetDailyBudgetIfNeeded(): Promise<NotificationState> {
  const state = await getNotificationState();
  const today = new Date().toISOString().split("T")[0];
  if (state.lastResetDate !== today) {
    const updated = { ...state, sentToday: 0, lastResetDate: today };
    await saveNotificationState(updated);
    return updated;
  }
  return state;
}
