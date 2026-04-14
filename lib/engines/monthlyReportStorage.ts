import AsyncStorage from "@react-native-async-storage/async-storage";
import { MonthlyReport } from "./monthlyReportEngine";

const KEY = "@mindcents/monthly_reports";

export async function getMonthlyReports(): Promise<MonthlyReport[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveMonthlyReport(report: MonthlyReport): Promise<void> {
  try {
    const reports = await getMonthlyReports();
    const idx = reports.findIndex((r) => r.id === report.id);
    if (idx >= 0) reports[idx] = report;
    else reports.push(report);
    await AsyncStorage.setItem(KEY, JSON.stringify(reports));
  } catch {}
}

export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReport | null> {
  const reports = await getMonthlyReports();
  return reports.find((r) => r.year === year && r.month === month) || null;
}
