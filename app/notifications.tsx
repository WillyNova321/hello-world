import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../hooks/useColors";
import { useApp } from "../context/AppContext";
import { NotificationRecord } from "../lib/notificationStorage";

const TIER_COLORS: Record<number, string> = {
  1: "#EF4444",
  2: "#F59E0B",
  3: "#0EA5E9",
};

function groupByDay(records: NotificationRecord[]): Array<{ date: string; items: NotificationRecord[] }> {
  const map: Record<string, NotificationRecord[]> = {};
  for (const r of records) {
    const dateStr = new Date(r.timestamp).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!map[dateStr]) map[dateStr] = [];
    map[dateStr].push(r);
  }
  return Object.entries(map).map(([date, items]) => ({ date, items }));
}

export default function Notifications() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notificationFeed, markNotificationsRead, markAllNotificationsRead } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const groups = groupByDay(notificationFeed);
  const hasUnread = notificationFeed.some((n) => !n.read);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text, fontFamily: "Inter_700Bold" }]}>
          Notifications
        </Text>
        {hasUnread && (
          <TouchableOpacity onPress={markAllNotificationsRead}>
            <Text style={[styles.markAll, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.date}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              No notifications yet
            </Text>
          </View>
        }
        renderItem={({ item: group }) => (
          <View style={styles.group}>
            <Text style={[styles.groupDate, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
              {group.date}
            </Text>
            {group.items.map((record) => (
              <TouchableOpacity
                key={record.id}
                style={[
                  styles.notifItem,
                  { backgroundColor: record.read ? colors.card : colors.primary + "08", borderColor: colors.border },
                ]}
                onPress={() => markNotificationsRead([record.id])}
                activeOpacity={0.7}
              >
                <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[record.tier] }]} />
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, { color: colors.text, fontFamily: record.read ? "Inter_500Medium" : "Inter_700Bold" }]}>
                    {record.title}
                  </Text>
                  <Text style={[styles.notifBody, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {record.body}
                  </Text>
                  <Text style={[styles.notifTime, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
                    {new Date(record.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </Text>
                </View>
                {!record.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 22 },
  markAll: { fontSize: 14 },
  list: { padding: 16, gap: 16 },
  empty: { alignItems: "center", justifyContent: "center", padding: 60, gap: 12 },
  emptyText: { fontSize: 14 },
  group: { gap: 8 },
  groupDate: { fontSize: 12 },
  notifItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  tierDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  notifContent: { flex: 1, gap: 4 },
  notifTitle: { fontSize: 14 },
  notifBody: { fontSize: 13, lineHeight: 18 },
  notifTime: { fontSize: 11 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
});
