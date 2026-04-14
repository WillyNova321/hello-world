import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "../hooks/useColors";
import { useApp } from "../context/AppContext";
import { Transaction } from "../lib/storage";
import { suggestCategory } from "../constants/categories";

interface ParsedRow {
  date: string;
  amount: string;
  merchant: string;
  category: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
  const dateIdx = headers.findIndex((h) => h.includes("date"));
  const amtIdx = headers.findIndex((h) => h.includes("amount") || h.includes("price"));
  const descIdx = headers.findIndex((h) => h.includes("desc") || h.includes("merchant") || h.includes("name") || h.includes("memo"));

  if (dateIdx === -1 || amtIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
    const merchant = descIdx >= 0 ? cols[descIdx] || "" : "";
    return {
      date: cols[dateIdx] || "",
      amount: cols[amtIdx] || "",
      merchant,
      category: suggestCategory("", merchant, {}),
    };
  }).filter((r) => r.date && r.amount && !isNaN(parseFloat(r.amount)));
}

export default function CsvImport() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bulkAddTransactions } = useApp();
  const [csvText, setCsvText] = useState("");
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleParse = () => {
    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      Alert.alert("Parse Failed", "No valid rows found. Check that your CSV has date, amount, and description columns.");
      return;
    }
    setParsed(rows);
  };

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const txs: Transaction[] = parsed.map((row, i) => ({
      id: `csv_${Date.now()}_${i}`,
      amount: Math.abs(parseFloat(row.amount)),
      category: row.category,
      timestamp: new Date(row.date).getTime() || Date.now(),
      merchant: row.merchant || undefined,
    }));
    await bulkAddTransactions(txs);
    setImporting(false);
    Alert.alert("Import Successful", `${txs.length} transactions imported.`, [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 12, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Import from Bank
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            CSV Format
          </Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Export a CSV from your bank with columns: Date, Amount, Description/Merchant. The first row should be headers.
          </Text>
          <Text style={[styles.infoExample, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            {"Date,Amount,Description\n2024-01-15,-25.00,Starbucks\n2024-01-16,-12.50,Uber"}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Paste CSV here
          </Text>
          <TextInput
            style={[styles.csvInput, { backgroundColor: colors.secondary, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
            multiline
            value={csvText}
            onChangeText={setCsvText}
            placeholder={"Date,Amount,Description\n2024-01-15,-25.00,Starbucks"}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <TouchableOpacity
          style={[styles.parseBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          onPress={handleParse}
          activeOpacity={0.8}
        >
          <Text style={[styles.parseBtnText, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Preview Transactions
          </Text>
        </TouchableOpacity>

        {parsed.length > 0 && (
          <View style={[styles.preview, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.previewTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              Preview ({parsed.length} rows)
            </Text>
            {parsed.slice(0, 10).map((row, i) => (
              <View key={i} style={[styles.previewRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.previewDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  {row.date}
                </Text>
                <Text style={[styles.previewMerchant, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                  {row.merchant || "—"}
                </Text>
                <Text style={[styles.previewAmt, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
                  ${Math.abs(parseFloat(row.amount)).toFixed(2)}
                </Text>
              </View>
            ))}
            {parsed.length > 10 && (
              <Text style={[styles.moreRows, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                +{parsed.length - 10} more rows...
              </Text>
            )}

            <TouchableOpacity
              style={[styles.importBtn, { backgroundColor: colors.primary }]}
              onPress={handleImport}
              disabled={importing}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload" size={18} color={colors.primaryForeground} />
              <Text style={[styles.importBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                Import {parsed.length} Transactions
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 20 },
  scroll: { padding: 16, gap: 16 },
  infoCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  infoTitle: { fontSize: 14 },
  infoText: { fontSize: 13, lineHeight: 18 },
  infoExample: { fontSize: 11, fontFamily: "monospace", lineHeight: 18 },
  field: { gap: 8 },
  fieldLabel: { fontSize: 13 },
  csvInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 12, height: 150, textAlignVertical: "top" },
  parseBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  parseBtnText: { fontSize: 15 },
  preview: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 0 },
  previewTitle: { fontSize: 14, marginBottom: 8 },
  previewRow: { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1 },
  previewDate: { width: 90, fontSize: 11 },
  previewMerchant: { flex: 1, fontSize: 13 },
  previewAmt: { fontSize: 13 },
  moreRows: { fontSize: 12, textAlign: "center", paddingVertical: 8 },
  importBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 12, paddingVertical: 14, marginTop: 12 },
  importBtnText: { fontSize: 15 },
});
