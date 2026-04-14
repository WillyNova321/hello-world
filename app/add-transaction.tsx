import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useColors } from "../hooks/useColors";
import { useApp } from "../context/AppContext";
import CategoryPicker from "../components/CategoryPicker";
import { suggestCategory } from "../constants/categories";
import { getMerchantMemory } from "../lib/storage";

export default function AddTransaction() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addTransaction, transactions, recentMerchants, profile } = useApp();

  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("food");
  const [isPlanned, setIsPlanned] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<"date" | "time">("date");
  const [saving, setSaving] = useState(false);
  const [merchantMemory, setMerchantMemory] = useState<Record<string, string>>({});

  useEffect(() => {
    getMerchantMemory().then(setMerchantMemory);
  }, []);

  // Auto-suggest category
  useEffect(() => {
    const suggested = suggestCategory(notes, merchant, merchantMemory);
    if (suggested !== "other" || (!merchant && !notes)) {
      setCategory(suggested);
    }
  }, [merchant, notes, merchantMemory]);

  const recentTxs = transactions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const suggestions = merchant
    ? recentMerchants.filter((m) => m.toLowerCase().includes(merchant.toLowerCase()) && m !== merchant)
    : [];

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addTransaction({
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      amount: amt,
      category,
      timestamp: date.getTime(),
      notes: notes.trim() || undefined,
      merchant: merchant.trim() || undefined,
      isPlanned,
    });
    setSaving(false);
    router.back();
  };

  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
          Add Transaction
        </Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: !amount || parseFloat(amount) <= 0 ? colors.border : colors.primary }]}
          onPress={handleSave}
          disabled={saving || !amount || parseFloat(amount) <= 0}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveBtnText, { color: !amount || parseFloat(amount) <= 0 ? colors.mutedForeground : colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text style={[styles.dollarSign, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>$</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text, fontFamily: "Inter_700Bold" }]}
            placeholder="0"
            placeholderTextColor={colors.border}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            autoFocus
          />
        </View>

        {/* Repeat Recent */}
        {recentTxs.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentScroll}
          >
            {recentTxs.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                style={[styles.recentChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setAmount(String(tx.amount));
                  setMerchant(tx.merchant || "");
                  setNotes(tx.notes || "");
                  setCategory(tx.category);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.recentChipText, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
                  {tx.merchant || tx.notes || tx.category} ${tx.amount}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Merchant */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Merchant / Where
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.secondary, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
            placeholder="e.g. Starbucks"
            placeholderTextColor={colors.mutedForeground}
            value={merchant}
            onChangeText={setMerchant}
          />
          {suggestions.length > 0 && (
            <View style={[styles.suggestions, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {suggestions.slice(0, 3).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                  onPress={() => { setMerchant(s); }}
                >
                  <Text style={[styles.suggestionText, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Category
          </Text>
          <CategoryPicker selected={category} onSelect={setCategory} />
        </View>

        {/* Notes */}
        <View style={[styles.field, styles.fieldPad]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            Notes
          </Text>
          <TextInput
            style={[styles.notesInput, { backgroundColor: colors.secondary, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
            placeholder="Optional note..."
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* Planned toggle */}
        <View style={[styles.toggleRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.toggleLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
              Planned Purchase
            </Text>
            <Text style={[styles.toggleDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Excluded from impulse scoring
            </Text>
          </View>
          <Switch
            value={isPlanned}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              setIsPlanned(v);
            }}
            trackColor={{ false: colors.border, true: colors.primary + "60" }}
            thumbColor={isPlanned ? colors.primary : colors.mutedForeground}
          />
        </View>

        {/* Date & Time */}
        <View style={[styles.dateRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Ionicons name="calendar-outline" size={20} color={colors.mutedForeground} />
          {Platform.OS === "web" ? (
            <TextInput
              style={[styles.dateInput, { color: colors.text, fontFamily: "Inter_400Regular" }]}
              value={date.toISOString().split("T")[0]}
              onChangeText={(v) => {
                const d = new Date(v);
                if (!isNaN(d.getTime())) setDate(d);
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedForeground}
            />
          ) : (
            <TouchableOpacity
              style={styles.dateBtn}
              onPress={() => {
                if (Platform.OS === "android") {
                  setDatePickerMode("date");
                  setShowDatePicker(true);
                } else {
                  setShowDatePicker(true);
                }
              }}
            >
              <Text style={[styles.dateBtnText, { color: colors.text, fontFamily: "Inter_400Regular" }]}>
                {dateStr}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === "android") {
                setDatePickerMode("time");
                setShowTimePicker(true);
              } else {
                setShowTimePicker(true);
              }
            }}
          >
            <Text style={[styles.timeText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {timeStr}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && Platform.OS !== "web" && (
          <DateTimePicker
            value={date}
            mode={Platform.OS === "android" ? datePickerMode : "date"}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, selected) => {
              if (Platform.OS === "android") {
                setShowDatePicker(false);
                if (selected) {
                  const next = new Date(selected);
                  next.setHours(date.getHours(), date.getMinutes());
                  setDate(next);
                  if (datePickerMode === "date") {
                    setDatePickerMode("time");
                    setShowTimePicker(true);
                  }
                }
              } else {
                if (selected) setDate(selected);
              }
            }}
          />
        )}

        {showTimePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={(event, selected) => {
              setShowTimePicker(false);
              if (selected) {
                const next = new Date(date);
                next.setHours(selected.getHours(), selected.getMinutes());
                setDate(next);
              }
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, textAlign: "center" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { fontSize: 15 },
  scroll: { padding: 16, gap: 20 },
  amountSection: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 20 },
  dollarSign: { fontSize: 36 },
  amountInput: { fontSize: 64, minWidth: 80, textAlign: "center" },
  recentScroll: { gap: 8, paddingHorizontal: 2 },
  recentChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: 1 },
  recentChipText: { fontSize: 13 },
  field: { gap: 8 },
  fieldPad: { paddingHorizontal: 0 },
  fieldLabel: { fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  suggestions: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  suggestionItem: { paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1 },
  suggestionText: { fontSize: 14 },
  notesInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, minHeight: 80, textAlignVertical: "top" },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, padding: 14 },
  toggleLabel: { fontSize: 15 },
  toggleDesc: { fontSize: 12, marginTop: 2 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  dateBtn: { flex: 1 },
  dateBtnText: { fontSize: 15 },
  dateInput: { flex: 1, fontSize: 15 },
  timeText: { fontSize: 14 },
});
