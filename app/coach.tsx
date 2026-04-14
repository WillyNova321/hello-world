import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "../hooks/useColors";
import { useApp } from "../context/AppContext";
import { getCoachResponse } from "../lib/engines/coachEngine";
import { formatCurrency } from "../lib/engines/spendingAnalysis";

interface Message {
  id: string;
  role: "user" | "coach";
  text: string;
  suggestions?: string[];
}

export default function Coach() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const { behaviorState, userBehaviorProfile, profile } = useApp();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "coach",
      text: `Hi ${profile.name}! I'm your MindCents coach. I can help you understand your budget, spot spending patterns, and build better habits. What would you like to explore?`,
      suggestions: ["How's my budget?", "Am I on track?", "Give me saving tips"],
    },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = (text: string) => {
    if (!text.trim() || !behaviorState || !userBehaviorProfile) return;
    Haptics.selectionAsync();
    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: "user",
      text,
    };
    const response = getCoachResponse(text, behaviorState, userBehaviorProfile);
    const coachMsg: Message = {
      id: `c_${Date.now()}`,
      role: "coach",
      text: response.text,
      suggestions: response.suggestions,
    };
    setMessages((prev) => [...prev, userMsg, coachMsg]);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? 20 : insets.top) + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
            Financial Coach
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
            Rule-based guidance
          </Text>
        </View>
      </View>

      {/* Context Banner */}
      {behaviorState && (
        <View style={[styles.contextBanner, { backgroundColor: colors.primary + "10", borderBottomColor: colors.primary + "20" }]}>
          <Text style={[styles.contextText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
            Month: {formatCurrency(behaviorState.thisMonthSpend)} spent / {formatCurrency(behaviorState.budget)} budget · Safe daily: {formatCurrency(behaviorState.safeDaily)}
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.messages, { paddingBottom: 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === "user"
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.coachBubble, { backgroundColor: colors.card, borderColor: colors.border }],
            ]}
          >
            {msg.role === "coach" && (
              <View style={[styles.coachIcon, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="pulse" size={14} color={colors.primary} />
              </View>
            )}
            <View style={styles.bubbleContent}>
              <Text
                style={[
                  styles.bubbleText,
                  {
                    color: msg.role === "user" ? colors.primaryForeground : colors.text,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
              >
                {msg.text}
              </Text>
              {msg.suggestions && msg.suggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {msg.suggestions.map((s, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.suggChip, { borderColor: colors.primary + "40", backgroundColor: colors.primary + "10" }]}
                      onPress={() => sendMessage(s)}
                    >
                      <Text style={[styles.suggChipText, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={[styles.inputRow, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={[styles.chatInput, { backgroundColor: colors.secondary, color: colors.text, borderColor: colors.border, fontFamily: "Inter_400Regular" }]}
          placeholder="Ask your coach..."
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage(input)}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.border }]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={18} color={input.trim() ? colors.primaryForeground : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 18 },
  headerSub: { fontSize: 12 },
  contextBanner: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  contextText: { fontSize: 12 },
  messages: { padding: 16, gap: 12 },
  bubble: { flexDirection: "row", gap: 10, maxWidth: "85%" },
  userBubble: { alignSelf: "flex-end", borderRadius: 16, borderBottomRightRadius: 4, padding: 14 },
  coachBubble: { alignSelf: "flex-start", borderRadius: 16, borderBottomLeftRadius: 4, padding: 14, borderWidth: 1 },
  coachIcon: { width: 24, height: 24, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 2 },
  bubbleContent: { flex: 1, gap: 10 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  suggChip: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  suggChipText: { fontSize: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  chatInput: { flex: 1, borderWidth: 1, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
