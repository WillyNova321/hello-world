import { Transaction } from "../storage";

export interface DetectedSubscription {
  id: string;
  label: string;
  amount: number;
  frequency: "weekly" | "monthly";
  lastChargedDate: number;
  nextExpectedDate: number;
  occurrences: number;
}

function normalizeLabel(raw: string): string {
  return (raw || "")
    .replace(/\d+/g, "")
    .replace(/[^a-z\s]/gi, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");
}

export function detectSubscriptions(txs: Transaction[]): DetectedSubscription[] {
  const groups: Record<string, Transaction[]> = {};

  for (const tx of txs) {
    const raw = tx.merchant || tx.notes || "";
    const label = normalizeLabel(raw);
    if (!label) continue;
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  }

  const results: DetectedSubscription[] = [];

  for (const [label, group] of Object.entries(groups)) {
    if (group.length < 2) continue;

    // Check amount similarity (within 10%)
    const amounts = group.map((t) => Math.abs(t.amount));
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const allSimilar = amounts.every((a) => Math.abs(a - avgAmount) / avgAmount < 0.1);
    if (!allSimilar) continue;

    // Sort by timestamp
    const sorted = [...group].sort((a, b) => a.timestamp - b.timestamp);
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push((sorted[i].timestamp - sorted[i - 1].timestamp) / (1000 * 60 * 60 * 24));
    }

    if (intervals.length === 0) continue;

    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const variance =
      intervals.reduce((s, v) => s + Math.pow(v - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Variance check: stdDev < 35% of avgInterval
    if (stdDev > avgInterval * 0.35) continue;

    let frequency: "weekly" | "monthly";
    if (avgInterval >= 5 && avgInterval <= 10) {
      frequency = "weekly";
    } else if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = "monthly";
    } else {
      continue;
    }

    const lastTx = sorted[sorted.length - 1];
    const nextExpected = lastTx.timestamp + avgInterval * 24 * 60 * 60 * 1000;

    results.push({
      id: `sub_${label.replace(/\s/g, "_")}`,
      label: label.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      amount: avgAmount,
      frequency,
      lastChargedDate: lastTx.timestamp,
      nextExpectedDate: nextExpected,
      occurrences: group.length,
    });

    if (results.length >= 6) break;
  }

  return results;
}
