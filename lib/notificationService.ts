import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === "web") return false;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleLocalNotification(title: string, body: string): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // immediate
    });
  } catch {}
}

export async function clearBadge(): Promise<void> {
  try {
    if (Platform.OS === "web") return;
    await Notifications.setBadgeCountAsync(0);
  } catch {}
}
