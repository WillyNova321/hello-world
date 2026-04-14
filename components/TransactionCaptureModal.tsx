import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "../hooks/useColors";
import { PendingCapture } from "../lib/storage";
import { DEFAULT_CATEGORIES, getCategoryById } from "../constants/categories";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

interface Props {
  capture: PendingCapture;
  onConfirm: (category: string) => Promise<void>;
  onDismiss: () => Promise<void>;
}

export default function TransactionCaptureModal({ capture, onConfirm, onDismiss }: Props) {
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState(capture.predictedCategory);
  const [showPicker, setShowPicker] = useState(false);

  const cat = getCategoryById(selectedCategory);

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.header}>
            <Text style={[styles.cardName, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {capture.cardName}
            </Text>
            <Text style={[styles.merchant, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              {capture.cleanedMerchant}
            </Text>
            <Text style={[styles.amount, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              {formatCurrency(capture.amount)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.question, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Is this category correct?
          </Text>

          <View style={styles.categoryRow}>
            <View
              style={[
                styles.catChip,
                { backgroundColor: cat ? cat.color + "20" : colors.secondary, borderColor: cat ? cat.color + "40" : colors.border },
              ]}
            >
              <Ionicons name={cat ? (cat.icon as any) : "help-circle"} size={18} color={cat?.color || colors.primary} />
              <Text style={[styles.catName, { color: cat?.color || colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                {cat?.name || "Other"}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.changeBtn, { borderColor: colors.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                setShowPicker(!showPicker);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.changeBtnText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                {showPicker ? "Done" : "Change"}
              </Text>
            </TouchableOpacity>
          </View>

          {showPicker && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pickerScroll}
              contentContainerStyle={styles.pickerContent}
            >
              {DEFAULT_CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.pickerItem,
                    {
                      backgroundColor: selectedCategory === c.id ? c.color + "20" : colors.secondary,
                      borderWidth: 1.5,
                      borderColor: selectedCategory === c.id ? c.color : "transparent",
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedCategory(c.id);
                    setShowPicker(false);
                  }}
                >
                  <Ionicons name={c.icon as any} size={16} color={c.color} />
                  <Text style={[styles.pickerItemText, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.dismissBtn, { borderColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onDismiss();
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dismissText, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                Dismiss
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onConfirm(selectedCategory);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark" size={18} color={colors.primaryForeground} />
              <Text style={[styles.confirmText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                Looks Right
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 4 },
  header: { alignItems: "center", gap: 6 },
  cardName: { fontSize: 12 },
  merchant: { fontSize: 22 },
  amount: { fontSize: 34 },
  divider: { height: 1 },
  question: { fontSize: 14, textAlign: "center" },
  categoryRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  catName: { fontSize: 15 },
  changeBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  changeBtnText: { fontSize: 14 },
  pickerScroll: { maxHeight: 80 },
  pickerContent: { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
  },
  pickerItemText: { fontSize: 12 },
  actions: { flexDirection: "row", gap: 12 },
  dismissBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  dismissText: { fontSize: 15 },
  confirmBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  confirmText: { fontSize: 15 },
});
