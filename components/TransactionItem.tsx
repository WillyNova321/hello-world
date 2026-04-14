import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "../hooks/useColors";
import { Transaction } from "../lib/storage";
import { getCategoryById } from "../constants/categories";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

interface Props {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

export default function TransactionItem({ transaction, onDelete }: Props) {
  const colors = useColors();
  const cat = getCategoryById(transaction.category);

  const dateStr = new Date(transaction.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete?.(transaction.id),
      },
    ]);
  };

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: cat?.color || colors.primary }]} />
      <View style={styles.info}>
        <Text style={[styles.merchant, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
          {transaction.merchant || transaction.notes || cat?.name || "Transaction"}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {cat?.name} · {dateStr}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
          {formatCurrency(transaction.amount)}
        </Text>
        {transaction.isPlanned && (
          <View style={[styles.plannedPill, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.plannedText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              Planned
            </Text>
          </View>
        )}
      </View>
      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color={colors.destructive} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  info: { flex: 1, gap: 3 },
  merchant: { fontSize: 14 },
  meta: { fontSize: 12 },
  right: { alignItems: "flex-end", gap: 3 },
  amount: { fontSize: 15 },
  plannedPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100 },
  plannedText: { fontSize: 10 },
  deleteBtn: { padding: 4 },
});
