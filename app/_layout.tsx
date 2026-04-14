import { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { AppProvider } from "../context/AppContext";
import { CaptureProvider } from "../context/CaptureContext";
import { isOnboardingComplete } from "../lib/storage";

SplashScreen.preventAutoHideAsync();

function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    const checkOnboarding = async () => {
      const complete = await isOnboardingComplete();
      if (!complete) {
        router.replace("/onboarding");
      }
      setOnboardingChecked(true);
      SplashScreen.hideAsync();
    };

    checkOnboarding();
  }, [fontsLoaded]);

  if (!fontsLoaded || !onboardingChecked) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="add-transaction" options={{ presentation: "modal" }} />
        <Stack.Screen name="csv-import" options={{ presentation: "modal" }} />
        <Stack.Screen name="coach" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="report-detail" />
        <Stack.Screen name="monthly-reports" />
        <Stack.Screen name="monthly-report-detail" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}

export default function Layout() {
  return (
    <AppProvider>
      <CaptureProvider>
        <RootLayout />
      </CaptureProvider>
    </AppProvider>
  );
}
