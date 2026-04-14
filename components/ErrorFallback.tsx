import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  error?: Error;
  onReset?: () => void;
}

export default function ErrorFallback({ error, onReset }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error?.message || "An unexpected error occurred."}</Text>
      {onReset && (
        <TouchableOpacity style={styles.btn} onPress={onReset} activeOpacity={0.7}>
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#0F172A" },
  message: { fontSize: 14, color: "#64748B", textAlign: "center" },
  btn: {
    backgroundColor: "#0EA5E9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
