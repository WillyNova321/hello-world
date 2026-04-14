import { Transaction } from "../storage";

// ─── Time Helpers ─────────────────────────────────────────────────────────────

export function startOfMonth(now: Date = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

export function startOfLastMonth(now: Date = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
}

export function endOfLastMonth(now: Date = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
}

export function startOfToday(now: Date = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function getDaysInMonth(now: Date = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

export function getDaysLeft(now: Date = new Date()): number {
  const totalDays = getDaysInMonth(now);
  return totalDays - now.getDate();
}

export function getDayOfMonth(now: Date = new Date()): number {
  return now.getDate();
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export function filterThisMonth(txs: Transaction[], now: Date = new Date()): Transaction[] {
  const start = startOfMonth(now);
  return txs.filter((t) => t.timestamp >= start && t.timestamp <= now.getTime());
}

export function filterLastMonth(txs: Transaction[], now: Date = new Date()): Transaction[] {
  const start = startOfLastMonth(now);
  const end = endOfLastMonth(now);
  return txs.filter((t) => t.timestamp >= start && t.timestamp <= end);
}

export function filterToday(txs: Transaction[], now: Date = new Date()): Transaction[] {
  const start = startOfToday(now);
  const end = start + 86400000;
  return txs.filter((t) => t.timestamp >= start && t.timestamp < end);
}

// ─── Aggregates ───────────────────────────────────────────────────────────────

export function sumAmounts(txs: Transaction[]): number {
  return txs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function sumByCategory(txs: Transaction[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of txs) {
    map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
  }
  return map;
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatCurrency(n: number): string {
  const abs = Math.abs(Math.round(n));
  return `$${abs.toLocaleString("en-US")}`;
}

export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Merchant Helpers ─────────────────────────────────────────────────────────

export function getRecentMerchants(txs: Transaction[], limit = 8): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  const sorted = [...txs].sort((a, b) => b.timestamp - a.timestamp);
  for (const tx of sorted) {
    const name = tx.merchant || tx.notes || "";
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
      if (result.length >= limit) break;
    }
  }
  return result;
}

// ─── Fixed / Flexible ─────────────────────────────────────────────────────────

export const FIXED_CATEGORY_IDS = new Set(["utilities", "subscriptions"]);

export function isFixedCategory(id: string, overrides?: Record<string, boolean>): boolean {
  if (overrides && overrides[id] !== undefined) return overrides[id];
  return FIXED_CATEGORY_IDS.has(id);
}

export function splitFixedFlexible(
  txs: Transaction[],
  overrides?: Record<string, boolean>
): { fixed: Transaction[]; flexible: Transaction[] } {
  const fixed: Transaction[] = [];
  const flexible: Transaction[] = [];
  for (const tx of txs) {
    if (isFixedCategory(tx.category, overrides)) fixed.push(tx);
    else flexible.push(tx);
  }
  return { fixed, flexible };
}
