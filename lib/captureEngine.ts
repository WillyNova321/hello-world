import { PendingCapture } from "./storage";
import { suggestCategory } from "../constants/categories";

export const MOCK_INCOMING = [
  { rawMerchant: "SQ *BLUE BOTTLE COFFEE", amount: 6.5, cardName: "Chase ••4521" },
  { rawMerchant: "TST* SHAKE SHACK", amount: 14.75, cardName: "Chase ••4521" },
  { rawMerchant: "AMAZON.COM*MK9LZ3WQ2", amount: 34.99, cardName: "Visa ••2190" },
  { rawMerchant: "UBER   TRIP JAN 14", amount: 12.4, cardName: "Chase ••4521" },
  { rawMerchant: "NETFLIX.COM", amount: 15.49, cardName: "Visa ••2190" },
  { rawMerchant: "WHOLE FOODS MARKET #123", amount: 67.8, cardName: "Amex ••9991" },
  { rawMerchant: "STARBUCKS #04821", amount: 5.75, cardName: "Chase ••4521" },
  { rawMerchant: "LYFT *RIDE SUN 11AM", amount: 9.8, cardName: "Chase ••4521" },
];

export function cleanMerchantName(raw: string): string {
  return raw
    .replace(/^(SQ \*|TST\*|TST \*)/i, "")
    .replace(/\*/g, "")
    .replace(/[#\d]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .split(" ")
    .map((w) =>
      w.length > 1
        ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        : w.toUpperCase()
    )
    .join(" ");
}

export function processCapture(
  raw: { rawMerchant: string; amount: number; cardName: string },
  memory: Record<string, string>,
  usageMap: Record<string, number | string>
): PendingCapture {
  const cleaned = cleanMerchantName(raw.rawMerchant);
  const predictedCategory = suggestCategory("", cleaned, memory);

  // Confidence based on whether memory had a match
  const memoryKey = cleaned.toLowerCase().trim();
  const confidence = memory[memoryKey] ? 0.95 : predictedCategory !== "other" ? 0.75 : 0.5;

  return {
    id: `capture_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    rawMerchant: raw.rawMerchant,
    cleanedMerchant: cleaned,
    amount: raw.amount,
    timestamp: Date.now(),
    cardName: raw.cardName,
    predictedCategory,
    confidence,
  };
}
