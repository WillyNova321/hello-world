import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../hooks/useColors";
import { saveProfile, saveCategoryConfig, markOnboardingComplete } from "../lib/storage";
import { DEFAULT_CATEGORIES } from "../constants/categories";

const ONBOARDING_CATS = DEFAULT_CATEGORIES.filter(
  (c) => !["other", "travel", "education"].includes(c.id)
);
const TOTAL_STEPS = 7;
const { width } = Dimensions.get("window");

export default function Onboarding() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [budget, setBudget] = useState("");
  const [income, setIncome] = useState("");
  const [catConfig, setCatConfig] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.id, c.isFixed]))
  );
  const [saving, setSaving] = useState(false);

  const goNext = () => {
    Haptics.selectionAsync();
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const goBack = () => {
    Haptics.selectionAsync();
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveProfile({
      name: name.trim() || "Friend",
      monthlyBudget: parseFloat(budget) || 2000,
      monthlyIncome: parseFloat(income) || 5000,
      currency: "USD",
    });
    await saveCategoryConfig(catConfig);
    await markOnboardingComplete();
    setSaving(false);
    router.replace("/(tabs)");
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.logoWrap, { backgroundColor: colors.primary + "20" }]}>
              <Ionicons name="pulse" size={52} color={colors.primary} />
            </View>
            <Text style={[styles.appName, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              MindCents
            </Text>
            <Text style={[styles.tagline, { color: colors.text, fontFamily: "Inter_600SemiBold" }]}>
              Track smarter.{"\n"}Spend intentionally.
            </Text>
            <Text style={[styles.desc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              A behavioral budgeting app that learns your patterns and helps you make better financial decisions every day.
            </Text>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              What should we call you?
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Your name helps personalize your coaching experience.
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.secondary, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
              placeholder="Your first name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              autoFocus
              returnKeyType="next"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Monthly spending budget?
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              This is your target for total spending each month.
            </Text>
            <View style={[styles.amountRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.dollarSign, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text, fontFamily: "Inter_700Bold" }]}
                placeholder="2000"
                placeholderTextColor={colors.mutedForeground}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                autoFocus
              />
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Monthly take-home income?
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Used to calculate your savings rate. Optional.
            </Text>
            <View style={[styles.amountRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.dollarSign, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text, fontFamily: "Inter_700Bold" }]}
                placeholder="5000"
                placeholderTextColor={colors.mutedForeground}
                value={income}
                onChangeText={setIncome}
                keyboardType="numeric"
                autoFocus
              />
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Set your category types
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Fixed costs (rent, utilities) don't flex. Toggle accordingly.
            </Text>
            <ScrollView style={styles.catList} showsVerticalScrollIndicator={false}>
              {ONBOARDING_CATS.map((cat) => (
                <View
                  key={cat.id}
                  style={[styles.catRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.catIcon, { backgroundColor: cat.color + "20" }]}>
                    <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                  </View>
                  <Text style={[styles.catName, { color: colors.text, fontFamily: "Inter_500Medium" }]}>
                    {cat.name}
                  </Text>
                  <View style={styles.catToggleWrap}>
                    <Text style={[styles.catToggleLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                      {catConfig[cat.id] ? "Fixed" : "Flexible"}
                    </Text>
                    <Switch
                      value={catConfig[cat.id] || false}
                      onValueChange={(v) => {
                        Haptics.selectionAsync();
                        setCatConfig((prev) => ({ ...prev, [cat.id]: v }));
                      }}
                      trackColor={{ false: colors.border, true: colors.primary + "60" }}
                      thumbColor={catConfig[cat.id] ? colors.primary : colors.mutedForeground}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.featureIcon, { backgroundColor: colors.accent + "20" }]}>
              <Ionicons name="flash" size={36} color={colors.accent} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              Smart Capture
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              MindCents can simulate real-time transaction capture from your bank. When a new transaction is detected, you'll get a quick confirmation modal to categorize it instantly.
            </Text>
            <View style={[styles.mockCapture, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.mockMerchant, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
                Blue Bottle Coffee
              </Text>
              <Text style={[styles.mockAmount, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
                $6.50
              </Text>
              <Text style={[styles.mockCat, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                Predicted: Coffee ✓
              </Text>
            </View>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.successIcon, { backgroundColor: colors.pulseGreen + "20" }]}>
              <Ionicons name="checkmark-circle" size={56} color={colors.pulseGreen} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
              You're all set!
            </Text>
            <Text style={[styles.stepDesc, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              Welcome to MindCents, {name.trim() || "friend"}! Start logging transactions to unlock your personalized behavioral insights.
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

  const canContinue = () => {
    if (step === 1) return true; // name is optional
    if (step === 2) return parseFloat(budget) > 0;
    return true;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === step ? colors.primary : i < step ? colors.primary + "60" : colors.border },
            ]}
          />
        ))}
      </View>

      {/* Back button */}
      {step > 0 && (
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step < TOTAL_STEPS - 1 ? (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: canContinue() ? colors.primary : colors.border }]}
            onPress={goNext}
            disabled={!canContinue()}
            activeOpacity={0.8}
          >
            <Text style={[styles.nextBtnText, { color: canContinue() ? colors.primaryForeground : colors.mutedForeground, fontFamily: "Inter_600SemiBold" }]}>
              {step === 0 ? "Get Started" : "Continue"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={18}
              color={canContinue() ? colors.primaryForeground : colors.mutedForeground}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={handleFinish}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Ionicons name="pulse" size={18} color={colors.primaryForeground} />
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground, fontFamily: "Inter_600SemiBold" }]}>
              Open MindCents
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 16 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  backBtn: { position: "absolute", top: 50, left: 20, zIndex: 10, padding: 8 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 20 },
  stepContent: { flex: 1, justifyContent: "center", gap: 20, paddingTop: 20 },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  appName: { fontSize: 36, textAlign: "center" },
  tagline: { fontSize: 28, textAlign: "center", lineHeight: 36 },
  desc: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  stepTitle: { fontSize: 26, textAlign: "center", lineHeight: 34 },
  stepDesc: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dollarSign: { fontSize: 32 },
  amountInput: { flex: 1, fontSize: 42, paddingLeft: 4 },
  catList: { maxHeight: 300 },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  catIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catName: { flex: 1, fontSize: 14 },
  catToggleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  catToggleLabel: { fontSize: 12 },
  featureIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  mockCapture: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  mockMerchant: { fontSize: 20 },
  mockAmount: { fontSize: 34 },
  mockCat: { fontSize: 14 },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  footer: { padding: 24, paddingBottom: 12 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextBtnText: { fontSize: 17 },
});
