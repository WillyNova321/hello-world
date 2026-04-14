import AsyncStorage from "@react-native-async-storage/async-storage";
import { QuarterlyReport } from "./quarterlyReportEngine";

const KEY = "@mindcents/quarterly_reports";

export async function getQuarterlyReports(): Promise<QuarterlyReport[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveQuarterlyReport(report: QuarterlyReport): Promise<void> {
  try {
    const reports = await getQuarterlyReports();
    const idx = reports.findIndex((r) => r.id === report.id);
    if (idx >= 0) reports[idx] = report;
    else reports.push(report);
    await AsyncStorage.setItem(KEY, JSON.stringify(reports));
  } catch {}
}

export async function getQuarterlyReport(year: number, quarter: number): Promise<QuarterlyReport | null> {
  const reports = await getQuarterlyReports();
  return reports.find((r) => r.year === year && r.quarter === quarter) || null;
}
