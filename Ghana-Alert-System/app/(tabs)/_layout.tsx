import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useEmergency } from "@/contexts/EmergencyContext";
import { t } from "@/constants/translations";

function TabIcon({ name, color, size, focused }: { name: string; color: string; size: number; focused: boolean }) {
  const icons: Record<string, { icon: React.ComponentType<any>; iconName: string }> = {
    emergency: { icon: MaterialCommunityIcons, iconName: focused ? 'shield-alert' : 'shield-alert-outline' },
    contacts: { icon: MaterialCommunityIcons, iconName: focused ? 'phone-in-talk' : 'phone-outline' },
    history: { icon: Ionicons, iconName: focused ? 'time' : 'time-outline' },
    notifications: { icon: Ionicons, iconName: focused ? 'notifications' : 'notifications-outline' },
    settings: { icon: Ionicons, iconName: focused ? 'settings' : 'settings-outline' },
  };
  const item = icons[name];
  if (!item) return null;
  const IconComponent = item.icon;
  return <IconComponent name={item.iconName as any} size={size} color={color} />;
}

function ClassicTabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const C = isDark ? Colors.dark : Colors.light;
  const { language } = useEmergency();
  const insets = useSafeAreaInsets();

  const tabBarStyle = {
    position: "absolute" as const,
    left: 16,
    right: 16,
    bottom: Platform.OS === "web" ? 24 : insets.bottom + 10,
    borderRadius: 24,
    backgroundColor: Platform.select({
      ios: "transparent",
      android: isDark ? "#0A0A0E" : "#FFFFFF",
      web: isDark ? "#0A0A0E" : "#FFFFFF",
    }),
    borderTopWidth: Platform.OS === "web" ? 1 : 0,
    borderTopColor: C.border,
    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    paddingBottom: Platform.OS === "android" ? 10 : 8 + insets.bottom * 0.2,
    paddingTop: 6,
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.emergency,
        tabBarInactiveTintColor: C.tabIconDefault,
        headerShown: false,
        tabBarStyle,
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: 'Rubik_500Medium',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('emergency', language),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="emergency" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: t('contacts', language),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="contacts" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('history', language),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="history" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t('notifications', language),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="notifications" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="responders"
        options={{
          title: t('responders', language),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="responders" color={color} size={size} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings', language),
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name="settings" color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return <ClassicTabLayout />;
}
