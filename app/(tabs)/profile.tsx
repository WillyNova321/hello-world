import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useColors } from "../../hooks/useColors";
import { useApp } from "../../context/AppContext";
import { useCaptureContext } from "../../context/CaptureContext";
import { DEFAULT_CATEGORIES } from "../../constants/categories";
import { exportAllData, importAllData, clearTransactionData } from "../../lib/storage";
import { formatCurrency } from "../../lib/engines/spendingAnalysis";

export default function Profile() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    profile,
    transactions,
    categoryConfig,
    notificationsEnabled,
    updateProfile,
    updateCategoryConfig,
    enableNotifications,
    refresh,
  } = useApp();
  const { simulateIncoming, pendingCount } = useCaptureContext();
  const [editingProfile, setEditingProfile] = useState(false);
  const [localName, setLocalName] = useState(profile.name);
  const [localBudget, setLocalBudget] = useState(String(profile.monthlyBudget));
  const [localIncome, setLocalIncome] = useState(String(profile.monthlyIncome));
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState("");
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleSaveProfile = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateProfile({
      ...profile,
      name: localName.trim() || profile.name,
      monthlyBudget: parseFloat(localBudget) || profile.monthlyBudget,
      monthlyIncome: parseFloat(localIncome) || profile.monthlyIncome,
    });
    setEditingProfile(false);
  };

  const handleExport = async () => {
    try {
      const json = await exportAllData();
      if (Platform.OS === "web") {
        // For web, just show alert with data
        Alert.alert("Export", "Data exported. Check console.");
        console.log(json);
        return;
      }
      const path = `${FileSystem.documentDirectory}mindcents_backup.json`;
      await FileSystem.writeAsStringAsync(path, json);
      await Sharing.shareAsync(path, { mimeType: "application/json" });
    } catch {
      Alert.alert("Export Failed", "Unable to export data.");
    }
  };

  const handleImport = async () => {
    const success = await importAllData(importJson);
    if (success) {
      Alert.alert("Import Successful", "Your data has been imported.");
      setShowImportModal(false);
      setImportJson("");
      refresh();
    } else {
      Alert.alert("Import Failed", "Invalid JSON format.");
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset All Data",
      "This will delete all transactions, goals, and history. Your profile settings will remain. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await clearTransactionData();
            await refresh();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: (Platform.OS === "web" ? 80 : insets.bottom + 70) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar card */}
        <View style={[styles.avatarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarInitial, { color: colors.primaryForeground, fontFamily: "Inter_700Bold" }]}>
              {(profile.name || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            {profile.name}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                {transactions.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Transactions
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                {formatCurrency(transactions.reduce((s, t) => s + Math.abs(t.amount), 0))}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Total Tracked
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                {formatCurrency(profile.monthlyBudget)}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Budget
              </Text>
            </View>
          </View>
        </View>

        {/* Financial Settings */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              Financial Settings
            </Text>
            {!editingProfile ? (
              <TouchableOpacity onPress={() => {
                setLocalName(profile.name);
                setLocalBudget(String(profile.monthlyBudget));
                setLocalIncome(String(profile.monthlyIncome));
                setEditingProfile(true);
              }}>
                <Text style={[styles.editBtn, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSaveProfile}>
                <Text style={[styles.editBtn, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
                  Save
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {editingProfile ? (
            <View style={styles.editForm}>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Name
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                  value={localName}
                  onChangeText={setLocalName}
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Monthly Budget ($)
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                  value={localBudget}
                  onChangeText={setLocalBudget}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.field}>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                  Monthly Income ($)
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
                  value={localIncome}
                  onChangeText={setLocalIncome}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ) : (
            <View style={styles.profileDisplay}>
              {[
                { label: "Name", value: profile.name },
                { label: "Budget", value: formatCurrency(profile.monthlyBudget) + "/month" },
                { label: "Income", value: formatCurrency(profile.monthlyIncome) + "/month" },
              ].map((row) => (
                <View key={row.label} style={[styles.displayRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.displayLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {row.label}
                  </Text>
                  <Text style={[styles.displayValue, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Category Types */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Category Types
          </Text>
          {DEFAULT_CATEGORIES.map((cat) => (
            <View key={cat.id} style={[styles.catRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + "20" }]}>
                <Ionicons name={cat.icon as any} size={16} color={cat.color} />
              </View>
              <Text style={[styles.catName, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                {cat.name}
              </Text>
              <Text style={[styles.catType, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                {categoryConfig[cat.id] ? "Fixed" : "Flexible"}
              </Text>
              <Switch
                value={categoryConfig[cat.id] || false}
                onValueChange={(v) => {
                  Haptics.selectionAsync();
                  updateCategoryConfig({ ...categoryConfig, [cat.id]: v });
                }}
                trackColor={{ false: colors.border, true: colors.primary + "60" }}
                thumbColor={categoryConfig[cat.id] ? colors.primary : colors.mutedForeground}
              />
            </View>
          ))}
        </View>

        {/* Smart Capture Demo */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Smart Capture Demo
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Simulate a real-time bank transaction to see the capture modal in action.
          </Text>
          {pendingCount > 0 && (
            <View style={[styles.pendingBanner, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={[styles.pendingText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                {pendingCount} pending transaction{pendingCount !== 1 ? "s" : ""} in queue
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.simulateBtn, { backgroundColor: colors.accent }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              simulateIncoming();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={18} color="#fff" />
            <Text style={[styles.simulateBtnText, { color: "#fff", fontFamily: "Inter_600SemiBold" }]}>
              Simulate Incoming Transaction
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.notifRow}>
            <Ionicons name="notifications" size={20} color={colors.primary} />
            <Text style={[styles.notifLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
              Smart Notifications
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={(v) => {
                if (v) enableNotifications();
              }}
              trackColor={{ false: colors.border, true: colors.primary + "60" }}
              thumbColor={notificationsEnabled ? colors.primary : colors.mutedForeground}
            />
          </View>
        </View>

        {/* Navigation rows */}
        {[
          { icon: "chatbubbles", label: "Financial Coach", route: "/coach" },
          { icon: "cloud-download", label: "Import from Bank", route: "/csv-import" },
          { icon: "calendar", label: "Monthly Reports", route: "/monthly-reports" },
          { icon: "bar-chart", label: "Quarterly Reports", route: "/reports" },
        ].map((row) => (
          <TouchableOpacity
            key={row.route}
            style={[styles.navRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(row.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.navIcon, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name={row.icon as any} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.navLabel, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
              {row.label}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}

        {/* About */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            About
          </Text>
          <Text style={[styles.aboutText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            MindCents v1.0.0 · All data stored locally on your device. No backend, no accounts.
          </Text>
        </View>

        {/* Data & Privacy */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
            Data & Privacy
          </Text>
          <TouchableOpacity style={[styles.dataBtn, { borderColor: colors.primary }]} onPress={handleExport}>
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={[styles.dataBtnText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              Export Backup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dataBtn, { borderColor: colors.primary }]} onPress={() => setShowImportModal(true)}>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
            <Text style={[styles.dataBtnText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              Import Backup
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dataBtn, { borderColor: colors.destructive }]} onPress={handleReset}>
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            <Text style={[styles.dataBtnText, { color: colors.destructive, fontFamily: "Inter_500Medium" }]}>
              Reset All Data
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Import Backup
            </Text>
            <Text style={[styles.modalDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Paste your exported JSON backup below.
            </Text>
            <TextInput
              style={[styles.jsonInput, { backgroundColor: colors.secondary, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              multiline
              value={importJson}
              onChangeText={setImportJson}
              placeholder='{"transactions": [...], ...}'
              placeholderTextColor={colors.mutedForeground}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border }]}
                onPress={() => { setShowImportModal(false); setImportJson(""); }}
              >
                <Text style={[styles.modalBtnText, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleImport}
              >
                <Text style={[styles.modalBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
                  Import
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  avatarCard: { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: "center", gap: 12 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 32 },
  profileName: { fontSize: 22 },
  statsRow: { flexDirection: "row", width: "100%" },
  stat: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 18 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1, height: 32, alignSelf: "center" },
  section: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15 },
  sectionDesc: { fontSize: 13, lineHeight: 18 },
  editBtn: { fontSize: 14 },
  editForm: { gap: 12 },
  field: { gap: 5 },
  fieldLabel: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  profileDisplay: { gap: 0 },
  displayRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1 },
  displayLabel: { fontSize: 13 },
  displayValue: { fontSize: 13 },
  catRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  catIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  catName: { flex: 1, fontSize: 14 },
  catType: { fontSize: 12 },
  pendingBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8 },
  pendingText: { fontSize: 13 },
  simulateBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 12 },
  simulateBtnText: { fontSize: 15 },
  notifRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  notifLabel: { flex: 1, fontSize: 15 },
  navRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 14, borderWidth: 1 },
  navIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  navLabel: { flex: 1, fontSize: 15 },
  aboutText: { fontSize: 13, lineHeight: 19 },
  dataBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  dataBtnText: { fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, paddingBottom: 40 },
  modalTitle: { fontSize: 20 },
  modalDesc: { fontSize: 14 },
  jsonInput: { borderWidth: 1, borderRadius: 12, padding: 12, height: 150, fontSize: 12, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 12 },
  modalBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  modalBtnText: { fontSize: 14 },
});
