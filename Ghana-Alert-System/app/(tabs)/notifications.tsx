import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useEmergency, IncidentStatus } from '@/contexts/EmergencyContext';
import { useTheme } from '@/contexts/ThemeContext';

type NotificationItem = {
  id: string;
  incidentId: string;
  type: string;
  status: IncidentStatus;
  timestamp: string;
  note?: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GH', {
    timeZone: 'Africa/Accra',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function NotificationsScreen() {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { incidents } = useEmergency();

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    incidents.forEach((incident) => {
      incident.timeline.forEach((entry, idx) => {
        // Treat anything beyond "submitted" or with a note as an agent/system notification.
        if (entry.status === 'submitted' && !entry.note) return;
        items.push({
          id: `${incident.id}:${idx}`,
          incidentId: incident.id,
          type: incident.type,
          status: entry.status,
          timestamp: entry.timestamp,
          note: entry.note ?? undefined,
        });
      });
    });
    return items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [incidents]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (notifications.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: topPad + 16 }]}>
        <View style={styles.empty}>
          <MaterialCommunityIcons
            name="bell-off-outline"
            size={64}
            color={C.textTertiary}
          />
          <Text
            style={[
              styles.emptyTitle,
              { color: C.text, fontFamily: 'Rubik_700Bold' },
            ]}
          >
            No notifications yet
          </Text>
          <Text
            style={[
              styles.emptySub,
              { color: C.textSecondary, fontFamily: 'Rubik_400Regular' },
            ]}
          >
            When agents update your reports, their messages will appear here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 8,
            borderBottomColor: C.border,
            backgroundColor: C.background,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: C.text, fontFamily: 'Rubik_700Bold' },
          ]}
        >
          Notifications
        </Text>
        <Text
          style={[
            styles.headerSub,
            { color: C.textSecondary, fontFamily: 'Rubik_400Regular' },
          ]}
        >
          Updates from agents and system about your incidents.
        </Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: tabBarHeight + 20,
          paddingTop: 12,
          gap: 10,
        }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: C.card, borderColor: C.border },
            ]}
          >
            <View style={styles.cardIconWrap}>
              <Ionicons name="notifications" size={18} color={C.tint} />
            </View>
            <View style={styles.cardMain}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: C.text, fontFamily: 'Rubik_600SemiBold' },
                ]}
              >
                Incident update: {item.status.toUpperCase()}
              </Text>
              {item.note ? (
                <Text
                  style={[
                    styles.cardNote,
                    { color: C.textSecondary, fontFamily: 'Rubik_400Regular' },
                  ]}
                  numberOfLines={3}
                >
                  {item.note}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.cardNote,
                    { color: C.textSecondary, fontFamily: 'Rubik_400Regular' },
                  ]}
                >
                  Your {item.type} incident status was updated by responders.
                </Text>
              )}
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons
                    name="time-outline"
                    size={12}
                    color={C.textTertiary}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      {
                        color: C.textTertiary,
                        fontFamily: 'Rubik_400Regular',
                      },
                    ]}
                  >
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    alignItems: 'flex-start',
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginTop: 2,
  },
  cardMain: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
  },
  cardNote: {
    fontSize: 13,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
  },
});

