import React from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  useColorScheme, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useEmergency, IncidentType, IncidentStatus } from '@/contexts/EmergencyContext';

const TYPE_CONFIG: Record<IncidentType, { icon: string; color: string; label: string; gradient: [string, string] }> = {
  police: { icon: 'police-badge', color: '#003580', label: 'Police Emergency', gradient: ['#001F5C', '#003580'] },
  fire: { icon: 'fire', color: '#FF4500', label: 'Fire Emergency', gradient: ['#CC3300', '#FF4500'] },
  medical: { icon: 'ambulance', color: '#00897B', label: 'Medical Emergency', gradient: ['#00574B', '#00897B'] },
  other: { icon: 'alert-circle', color: '#7B2FBE', label: 'Emergency Report', gradient: ['#5B0FA0', '#7B2FBE'] },
};

const STATUS_STEPS: IncidentStatus[] = [
  'submitted', 'received', 'verified', 'dispatched', 'enroute', 'onscene', 'resolved'
];

const STATUS_CONFIG: Record<IncidentStatus, { label: string; icon: string }> = {
  submitted: { label: 'Submitted', icon: 'clock-outline' },
  received: { label: 'Received', icon: 'check-circle-outline' },
  verified: { label: 'Verified', icon: 'shield-check' },
  dispatched: { label: 'Dispatched', icon: 'send' },
  enroute: { label: 'En Route', icon: 'car-emergency' },
  onscene: { label: 'On Scene', icon: 'map-marker' },
  resolved: { label: 'Resolved', icon: 'check-decagram' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GH', {
    timeZone: 'Africa/Accra',
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function IncidentDetailScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { incidents } = useEmergency();
  const incident = incidents.find(i => i.id === id);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (!incident) {
    return (
      <View style={[styles.container, { backgroundColor: C.background, paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { paddingHorizontal: 20 }]} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <View style={styles.notFound}>
          <MaterialCommunityIcons name="file-alert" size={48} color={C.textTertiary} />
          <Text style={[styles.notFoundText, { color: C.text, fontFamily: 'Rubik_600SemiBold' }]}>Incident not found</Text>
        </View>
      </View>
    );
  }

  const typeConf = TYPE_CONFIG[incident.type];
  const currentStepIndex = STATUS_STEPS.indexOf(incident.status);

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={typeConf.gradient}
        style={[styles.heroGradient, { paddingTop: topPad + 8 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.9)" />
          </Pressable>
          <Text style={[styles.heroLabel, { fontFamily: 'Rubik_500Medium' }]}>Incident Report</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.heroContent}>
          <MaterialCommunityIcons name={typeConf.icon as any} size={44} color="#FFFFFF" />
          <Text style={[styles.heroType, { fontFamily: 'Rubik_900Black' }]}>{typeConf.label}</Text>
          <View style={[styles.heroBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={[styles.heroId, { fontFamily: 'Rubik_500Medium' }]}>
              ID: {incident.id.substring(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.cardTitle, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>STATUS</Text>
          <View style={styles.statusTrack}>
            {STATUS_STEPS.map((step, idx) => {
              const conf = STATUS_CONFIG[step];
              const isDone = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <View key={step} style={styles.statusStep}>
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepDot, {
                      backgroundColor: isDone ? typeConf.color : C.border,
                      borderColor: isCurrent ? typeConf.color : 'transparent',
                      borderWidth: isCurrent ? 3 : 0,
                    }]}>
                      {isDone && <MaterialCommunityIcons name={conf.icon as any} size={12} color="#FFFFFF" />}
                    </View>
                    {idx < STATUS_STEPS.length - 1 && (
                      <View style={[styles.stepLine, { backgroundColor: idx < currentStepIndex ? typeConf.color : C.border }]} />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, {
                      color: isDone ? C.text : C.textTertiary,
                      fontFamily: isCurrent ? 'Rubik_700Bold' : 'Rubik_400Regular'
                    }]}>
                      {conf.label}
                    </Text>
                    {incident.timeline.find(t => t.status === step) && (
                      <Text style={[styles.stepTime, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>
                        {formatDate(incident.timeline.find(t => t.status === step)!.timestamp)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.cardTitle, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>DETAILS</Text>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={C.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: C.textSecondary, fontFamily: 'Rubik_500Medium' }]}>Reported At</Text>
              <Text style={[styles.detailValue, { color: C.text, fontFamily: 'Rubik_400Regular' }]}>{formatDate(incident.createdAt)}</Text>
            </View>
          </View>
          {(incident.address || (incident.latitude && incident.longitude)) && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color={C.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: C.textSecondary, fontFamily: 'Rubik_500Medium' }]}>Location</Text>
                <Text style={[styles.detailValue, { color: C.text, fontFamily: 'Rubik_400Regular' }]}>
                  {incident.address
                    ? incident.address
                    : `${parseFloat(String(incident.latitude)).toFixed(5)}, ${parseFloat(String(incident.longitude)).toFixed(5)}`}
                </Text>
                {incident.accuracyMeters && (
                  <Text style={[styles.detailSub, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>
                    ±{incident.accuracyMeters}m · {incident.gpsProvider || 'GPS'}
                  </Text>
                )}
              </View>
            </View>
          )}
          {incident.description ? (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={16} color={C.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: C.textSecondary, fontFamily: 'Rubik_500Medium' }]}>Description</Text>
                <Text style={[styles.detailValue, { color: C.text, fontFamily: 'Rubik_400Regular' }]}>{incident.description}</Text>
              </View>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name={incident.isAnonymous ? 'incognito' : 'account'} size={16} color={C.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: C.textSecondary, fontFamily: 'Rubik_500Medium' }]}>Identity</Text>
              <Text style={[styles.detailValue, { color: C.text, fontFamily: 'Rubik_400Regular' }]}>
                {incident.isAnonymous ? 'Anonymous Report' : 'Verified Report'}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="alert-decagram" size={16} color={C.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: C.textSecondary, fontFamily: 'Rubik_500Medium' }]}>Priority Score</Text>
              <Text style={[styles.detailValue, { color: typeConf.color, fontFamily: 'Rubik_700Bold' }]}>
                {incident.priorityScore}/5 — {incident.priorityScore >= 4 ? 'HIGH' : incident.priorityScore >= 3 ? 'MEDIUM' : 'LOW'}
              </Text>
            </View>
          </View>
        </View>

        {incident.panicMode && (
          <View style={[styles.panicBadgeCard, { backgroundColor: '#E8001C20', borderColor: '#E8001C40' }]}>
            <MaterialCommunityIcons name="shield-alert" size={24} color="#E8001C" />
            <View>
              <Text style={[styles.panicBadgeTitle, { color: '#E8001C', fontFamily: 'Rubik_700Bold' }]}>PANIC ALERT</Text>
              <Text style={[styles.panicBadgeSub, { color: '#E8001C99', fontFamily: 'Rubik_400Regular' }]}>
                Triggered via {incident.panicMode === 'silent' ? 'Silent' : 'Loud'} panic mode
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroGradient: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: { padding: 4 },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  heroContent: {
    alignItems: 'center',
    gap: 10,
  },
  heroType: {
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroId: {
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  content: { padding: 20, gap: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  cardTitle: {
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 16,
  },
  statusTrack: { gap: 0 },
  statusStep: {
    flexDirection: 'row',
    gap: 14,
  },
  stepLeft: {
    alignItems: 'center',
    width: 24,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 16,
  },
  stepLabel: { fontSize: 14 },
  stepTime: { fontSize: 11, marginTop: 2 },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.15)',
    alignItems: 'flex-start',
  },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 12 },
  detailValue: { fontSize: 14, marginTop: 2 },
  detailSub: { fontSize: 11, marginTop: 2 },
  panicBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  panicBadgeTitle: { fontSize: 15, letterSpacing: 1 },
  panicBadgeSub: { fontSize: 12, marginTop: 2 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 18 },
});
