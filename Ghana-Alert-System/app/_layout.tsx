import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useSegments, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, ActivityIndicator, LogBox } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLockProvider } from "@/contexts/AppLockContext";
import { AppLockGate } from "@/components/AppLockGate";
import { queryClient } from "@/lib/query-client";
import { EmergencyProvider } from "@/contexts/EmergencyContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_900Black,
} from "@expo-google-fonts/rubik";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

// In development, React Native will turn certain console errors (including
// Supabase's "TypeError: Network request failed" when offline) into a full‑screen
// red overlay. We still want offline incidents to be queued silently, so we
// ignore just this specific log message.
if (__DEV__) {
  LogBox.ignoreLogs(["TypeError: Network request failed"]);
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const navRouter = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";

    if (!isAuthenticated && !inAuthGroup) {
      navRouter.replace("/auth/login");
    } else if (isAuthenticated && inAuthGroup) {
      navRouter.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, navRouter, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0A0A0E" }}>
        <ActivityIndicator size="large" color="#E8001C" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <AuthGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth/login" options={{ headerShown: false, animation: "fade" }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false, animation: "slide_from_right" }} />
          <Stack.Screen
            name="auth/forgot-password"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="auth/face-verify"
            options={{ headerShown: false, presentation: "fullScreenModal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="report"
            options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="panic"
            options={{ headerShown: false, presentation: "fullScreenModal", animation: "fade" }}
          />
          <Stack.Screen
            name="incident/[id]"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
        </Stack>
      </AuthGuard>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Rubik_900Black,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <EmergencyProvider>
            <AppLockProvider>
              <ThemeProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <AppLockGate>
                      <RootLayoutNav />
                    </AppLockGate>
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </ThemeProvider>
            </AppLockProvider>
          </EmergencyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
