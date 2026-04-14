import { Transaction } from "./storage";

/**
 * Returns true if `tx` appears to be a duplicate of any transaction in `existing`.
 * Duplicate = same amount + same category + timestamp within 60 seconds.
 */
export function isDuplicateTransaction(tx: Transaction, existing: Transaction[]): boolean {
  const window = 60 * 1000; // 60 seconds
  return existing.some(
    (e) =>
      e.amount === tx.amount &&
      e.category === tx.category &&
      Math.abs(e.timestamp - tx.timestamp) < window
  );
}
