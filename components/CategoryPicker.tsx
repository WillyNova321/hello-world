import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "../hooks/useColors";
import { DEFAULT_CATEGORIES } from "../constants/categories";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

export default function CategoryPicker({ selected, onSelect }: Props) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {DEFAULT_CATEGORIES.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.item,
              {
                backgroundColor: isSelected ? cat.color + "20" : colors.secondary,
                borderColor: isSelected ? cat.color : "transparent",
                borderWidth: 1.5,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(cat.id);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: cat.color + "20" }]}>
              <Ionicons name={cat.icon as any} size={18} color={cat.color} />
            </View>
            <Text
              style={[
                styles.name,
                { color: isSelected ? cat.color : colors.text, fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular" },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 8, flexDirection: "row" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 13 },
});
