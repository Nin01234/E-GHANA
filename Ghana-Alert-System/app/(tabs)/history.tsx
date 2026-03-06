import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList,
  useColorScheme, Platform, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle, useSharedValue, withSpring,
  FadeInRight, FadeOutLeft,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Swipeable } from 'react-native-gesture-handler';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/colors';
import { useEmergency, Incident, IncidentType, IncidentStatus } from '@/contexts/EmergencyContext';
import type { OfflineIncidentItem } from '@/lib/offlineIncidents';
import { t } from '@/constants/translations';

const TYPE_CONFIG: Record<IncidentType, { icon: string; color: string }> = {
  police: { icon: 'police-badge', color: '#003580' },
  fire: { icon: 'fire', color: '#FF4500' },
  medical: { icon: 'ambulance', color: '#00897B' },
  other: { icon: 'alert-circle', color: '#7B2FBE' },
};

const STATUS_CONFIG: Record<IncidentStatus, { label: string; color: string; icon: string }> = {
  submitted: { label: 'Submitted', color: '#FF9F0A', icon: 'clock-outline' },
  received: { label: 'Received', color: '#007AFF', icon: 'check-circle-outline' },
  verified: { label: 'Verified', color: '#30D158', icon: 'shield-check' },
  dispatched: { label: 'Dispatched', color: '#AF52DE', icon: 'send' },
  enroute: { label: 'En Route', color: '#FF6B35', icon: 'car-emergency' },
  onscene: { label: 'On Scene', color: '#FF9F0A', icon: 'map-marker' },
  resolved: { label: 'Resolved', color: '#30D158', icon: 'check-decagram' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GH', {
    timeZone: 'Africa/Accra',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function DeleteAction({ onDelete }: { onDelete: () => void }) {
  return (
    <Pressable
      onPress={onDelete}
      style={styles.deleteAction}
      accessibilityLabel="Delete incident"
      accessibilityRole="button"
    >
      <MaterialCommunityIcons name="delete" size={24} color="#FFFFFF" />
      <Text style={[styles.deleteActionText, { fontFamily: 'Rubik_600SemiBold' }]}>Delete</Text>
    </Pressable>
  );
}

function IncidentCard({
  incident,
  onDelete,
  onSelect,
  isSelected,
}: {
  incident: Incident;
  onDelete: (id: string) => void;
  onSelect: (incident: Incident) => void;
  isSelected: boolean;
}) {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const typeConf = TYPE_CONFIG[incident.type as IncidentType] || TYPE_CONFIG.other;
  const statusConf = STATUS_CONFIG[incident.status as IncidentStatus] || STATUS_CONFIG.submitted;

  const handleDelete = () => {
    Alert.alert(
      'Delete Report',
      'Are you sure you want to delete this incident report?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete(incident.id);
          },
        },
      ]
    );
  };

  return (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={animStyle}>
      <Swipeable
        renderRightActions={() => <DeleteAction onDelete={handleDelete} />}
        overshootRight={false}
      >
        <Pressable
          onPressIn={() => { scale.value = withSpring(0.97); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          onPressOut={() => { scale.value = withSpring(1); }}
          onPress={() => {
            onSelect(incident);
            router.push({ pathname: '/incident/[id]', params: { id: incident.id } });
          }}
          style={[
            styles.card,
            {
              backgroundColor: C.card,
              borderColor: isSelected ? C.tint : typeConf.color + '25',
            },
          ]}
          accessibilityLabel={`View incident ${incident.id}`}
          accessibilityRole="button"
        >
          <View style={[styles.cardIconWrap, { backgroundColor: typeConf.color + '18' }]}>
            <MaterialCommunityIcons name={typeConf.icon as any} size={24} color={typeConf.color} />
          </View>
          <View style={styles.cardMain}>
            <View style={styles.cardTop}>
              <Text style={[styles.cardType, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>
                {(incident.type || 'other').charAt(0).toUpperCase() + (incident.type || 'other').slice(1)} Emergency
              </Text>
              <View style={[styles.statusPill, { backgroundColor: statusConf.color + '20' }]}>
                <MaterialCommunityIcons name={statusConf.icon as any} size={10} color={statusConf.color} />
                <Text style={[styles.statusText, { color: statusConf.color, fontFamily: 'Rubik_600SemiBold' }]}>
                  {statusConf.label}
                </Text>
              </View>
            </View>
            {incident.description ? (
              <Text style={[styles.cardDesc, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]} numberOfLines={1}>
                {incident.description}
              </Text>
            ) : null}
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={12} color={C.textTertiary} />
                <Text style={[styles.metaText, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>
                  {formatDate(incident.createdAt)}
                </Text>
              </View>
              {(incident.address || (incident.latitude && incident.longitude)) && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={12} color={C.textTertiary} />
                  <Text style={[styles.metaText, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>
                    {incident.address
                      ? incident.address
                      : `${parseFloat(String(incident.latitude)).toFixed(3)}, ${parseFloat(String(incident.longitude)).toFixed(3)}`}
                  </Text>
                </View>
              )}
            </View>
            {(incident.priorityScore ?? 0) >= 4 && (
              <View style={styles.priorityBadge}>
                <MaterialCommunityIcons name="alert" size={10} color="#E8001C" />
                <Text style={[styles.priorityText, { fontFamily: 'Rubik_600SemiBold' }]}>HIGH PRIORITY</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

function EmptyState({ C, language }: { C: typeof Colors.light; language: string }) {
  return (
    <View style={styles.empty}>
      <MaterialCommunityIcons name="clipboard-text-clock-outline" size={64} color={C.textTertiary} />
      <Text style={[styles.emptyTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>
        {t('noHistory', language as any)}
      </Text>
      <Text style={[styles.emptySub, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
        Your emergency reports will appear here
      </Text>
    </View>
  );
}

function OfflineIncidentCard({
  item,
  onRetry,
  onRemove,
}: {
  item: OfflineIncidentItem;
  onRetry: (localId: string) => void;
  onRemove: (localId: string) => void;
}) {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  const statusLabel =
    item.status === 'queued' ? 'Queued' :
    item.status === 'sending' ? 'Sending…' :
    'Failed';

  const statusColor =
    item.status === 'queued' ? C.warning :
    item.status === 'sending' ? C.tint :
    C.error;

  const desc = item.data.description || '';
  const type = item.data.type || 'other';
  const isPanic = !!item.data.panicMode;

  return (
    <View style={[styles.card, { backgroundColor: C.card, borderColor: statusColor + '35' }]}>
      <View style={[styles.cardIconWrap, { backgroundColor: statusColor + '18' }]}>
        <MaterialCommunityIcons name="upload" size={22} color={statusColor} />
      </View>
      <View style={styles.cardMain}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardType, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>
            {isPanic ? `Offline panic · ${item.data.panicMode}` : `Offline report · ${String(type).charAt(0).toUpperCase() + String(type).slice(1)}`}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '20' }]}>
            <MaterialCommunityIcons name="cloud-upload" size={10} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor, fontFamily: 'Rubik_600SemiBold' }]}>
              {statusLabel}
            </Text>
          </View>
        </View>
        {desc ? (
          <Text style={[styles.cardDesc, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]} numberOfLines={1}>
            {desc}
          </Text>
        ) : null}
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={12} color={C.textTertiary} />
            <Text style={[styles.metaText, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          {item.data.location?.humanReadable ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={12} color={C.textTertiary} />
              <Text style={[styles.metaText, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]} numberOfLines={1}>
                {item.data.location.humanReadable}
              </Text>
            </View>
          ) : null}
        </View>
        {item.status !== 'sending' && (
          <View style={styles.offlineActions}>
            <Pressable onPress={() => onRetry(item.localId)} style={styles.offlineActionBtn} accessibilityRole="button">
              <Text style={[styles.offlineActionText, { color: C.tint, fontFamily: 'Rubik_600SemiBold' }]}>Retry</Text>
            </Pressable>
            <Pressable onPress={() => onRemove(item.localId)} style={styles.offlineActionBtn} accessibilityRole="button">
              <Text style={[styles.offlineActionText, { color: C.textTertiary, fontFamily: 'Rubik_600SemiBold' }]}>Remove</Text>
            </Pressable>
          </View>
        )}
        {item.status === 'failed' && item.lastError ? (
          <Text style={[styles.offlineError, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]} numberOfLines={2}>
            {item.lastError}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { incidents, offlineIncidents, retryOfflineIncident, removeOfflineIncident, isLoading, loadIncidents, deleteIncident, language } = useEmergency();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // Clear selected incident if it no longer exists (e.g. deleted or reloaded)
  useEffect(() => {
    if (!selectedIncident) return;
    const stillExists = incidents.some(i => i.id === selectedIncident.id);
    if (!stillExists) {
      setSelectedIncident(null);
    }
  }, [incidents, selectedIncident]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteIncident(id);
        // If the deleted incident was selected, remove it from the map
        setSelectedIncident(prev => (prev?.id === id ? null : prev));
      } catch {
        Alert.alert('Error', 'Failed to delete report. Please try again.');
      }
    },
    [deleteIncident],
  );

  const handleRetryOffline = useCallback(async (localId: string) => {
    try {
      await retryOfflineIncident(localId);
    } catch {
      Alert.alert('Error', 'Failed to retry. Please try again.');
    }
  }, [retryOfflineIncident]);

  const handleRemoveOffline = useCallback(async (localId: string) => {
    Alert.alert('Remove from pending uploads', 'Delete this offline report from your phone?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await removeOfflineIncident(localId); } },
    ]);
  }, [removeOfflineIncident]);

  const handleRetryAllOffline = useCallback(async () => {
    if (offlineIncidents.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // best-effort, sequential
    for (const it of offlineIncidents) {
      try {
        await retryOfflineIncident(it.localId);
      } catch {
        // ignore
      }
    }
  }, [offlineIncidents, retryOfflineIncident]);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: C.text, fontFamily: 'Rubik_900Black' }]}>
            {t('history', language as any)}
          </Text>
          <Text style={[styles.headerSub, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
            {incidents.length} {incidents.length === 1 ? 'report' : 'reports'} · Swipe left to delete
          </Text>
        </View>
        {offlineIncidents.length > 0 && (
          <Pressable
            onPress={handleRetryAllOffline}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, padding: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border }]}
            accessibilityRole="button"
            accessibilityLabel="Retry all pending uploads"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="refresh" size={16} color={C.tint} />
              <Text style={{ color: C.tint, fontFamily: 'Rubik_600SemiBold', fontSize: 12 }}>Retry all</Text>
            </View>
          </Pressable>
        )}
      </View>

      {selectedIncident && selectedIncident.latitude && selectedIncident.longitude && (
        <View style={styles.mapWrapper}>
          <View style={styles.mapHeader}>
            <View style={styles.mapHeaderLeft}>
              <Ionicons name="map" size={16} color={C.tint} />
              <Text style={[styles.mapTitle, { color: C.text, fontFamily: 'Rubik_600SemiBold' }]}>
                Incident location
              </Text>
            </View>
            <Text style={[styles.mapSubtitle, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
              {selectedIncident.address || 'Precise location saved'}
            </Text>
          </View>
          <View style={styles.mapContainer}>
            <WebView
              style={styles.map}
              source={{
                uri: `https://www.google.com/maps/search/?api=1&query=${selectedIncident.latitude},${selectedIncident.longitude}&hl=en-GH&region=GH`,
              }}
              javaScriptEnabled
              domStorageEnabled
            />
          </View>
        </View>
      )}

      <FlatList
        data={incidents}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <IncidentCard
            incident={item}
            onDelete={handleDelete}
            onSelect={setSelectedIncident}
            isSelected={selectedIncident?.id === item.id}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + 20 },
          incidents.length === 0 && styles.emptyContainer,
        ]}
        scrollEnabled={!!incidents.length}
        ListHeaderComponent={
          offlineIncidents.length > 0 ? (
            <View style={{ gap: 12, marginBottom: 16 }}>
              <Text style={[styles.sectionHeader, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>
                Pending uploads
              </Text>
              {offlineIncidents.map((it) => (
                <OfflineIncidentCard
                  key={it.localId}
                  item={it}
                  onRetry={handleRetryOffline}
                  onRemove={handleRemoveOffline}
                />
              ))}
              <Text style={[styles.sectionHint, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>
                These reports will send automatically when internet is available.
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<EmptyState C={C} language={language} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadIncidents}
            tintColor={C.tint}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 4 },
  mapWrapper: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  mapHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  mapHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapTitle: {
    fontSize: 13,
  },
  mapSubtitle: {
    fontSize: 11,
    flex: 1,
    marginLeft: 8,
    textAlign: 'right',
  },
  mapContainer: {
    height: 200,
  },
  map: {
    flex: 1,
  },
  listContent: { paddingHorizontal: 20, paddingTop: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardMain: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  cardType: { fontSize: 15, flex: 1 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, letterSpacing: 0.3 },
  cardDesc: { fontSize: 13, marginBottom: 6 },
  cardMeta: { gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11 },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  priorityText: { fontSize: 10, color: '#E8001C', letterSpacing: 0.5 },
  deleteAction: {
    backgroundColor: '#E8001C',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    borderRadius: 16,
    gap: 4,
    marginLeft: 8,
  },
  deleteActionText: { color: '#FFFFFF', fontSize: 12 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyTitle: { fontSize: 20 },
  emptySub: { fontSize: 14, textAlign: 'center' },
  sectionHeader: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionHint: { fontSize: 12, marginTop: -4 },
  offlineActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  offlineActionBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  offlineActionText: { fontSize: 13 },
  offlineError: { fontSize: 11, marginTop: 6 },
});
