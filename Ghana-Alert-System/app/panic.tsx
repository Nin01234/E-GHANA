import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming,
  withSequence, withSpring, interpolateColor, Easing, runOnJS,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useEmergency, LocationData, PanicMode } from '@/contexts/EmergencyContext';
import { t } from '@/constants/translations';

type PanicPhase = 'ready' | 'holding' | 'activating' | 'active' | 'cancelled';

function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-GH', {
    timeZone: 'Africa/Accra',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function PanicScreen() {
  const insets = useSafeAreaInsets();
  const { triggerPanic, cancelPanic, removeOfflineIncident, language } = useEmergency();
  const [phase, setPhase] = useState<PanicPhase>('ready');
  const [mode, setMode] = useState<PanicMode>('loud');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [timestamp, setTimestamp] = useState('');
  const [locationText, setLocationText] = useState('Acquiring location...');
  const [delivery, setDelivery] = useState<'sent' | 'queued' | null>(null);
  const [queuedLocalId, setQueuedLocalId] = useState<string | null>(null);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdStartTime = useRef<number>(0);
  const HOLD_DURATION = 3000;

  const bgScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const alertOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const progressAnim = useSharedValue(0);

  useEffect(() => {
    const now = new Date();
    setTimestamp(formatTimestamp(now));
    const timer = setInterval(() => setTimestamp(formatTimestamp(new Date())), 1000);
    acquireLocation();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (phase === 'active') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
        true
      );
      bgScale.value = withRepeat(
        withSequence(
          withTiming(1.03, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
    }
  }, [phase]);

  const acquireLocation = async (): Promise<LocationData | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationText('Location unavailable');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const parts = [
        place?.name,
        place?.street,
        place?.subregion,
        place?.city || place?.district,
        place?.region,
        place?.country,
      ].filter(Boolean);

      const prettyAddress = parts.join(', ');

      const locationData: LocationData = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: Math.round(loc.coords.accuracy || 0),
        provider: 'GPS',
        timestamp: new Date(loc.timestamp).toISOString(),
        timestampUTC: new Date(loc.timestamp).toUTCString(),
        humanReadable: prettyAddress || `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`,
      };
      setLocation(locationData);
      setLocationText(locationData.humanReadable);
      return locationData;
    } catch {
      setLocationText('Location unavailable');
      return null;
    }
  };

  const startHold = useCallback(() => {
    if (phase !== 'ready') return;
    setPhase('holding');
    holdStartTime.current = Date.now();
    if (mode === 'loud') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - holdStartTime.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setHoldProgress(progress);
      progressAnim.value = progress;

      if (progress >= 1) {
        clearInterval(progressInterval.current!);
        runOnJS(activatePanic)();
      }
    }, 50);

    holdTimer.current = setTimeout(() => {
      activatePanic();
    }, HOLD_DURATION);
  }, [phase, mode, location]);

  const cancelHold = useCallback(() => {
    if (phase !== 'holding') return;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    setPhase('ready');
    setHoldProgress(0);
    progressAnim.value = withTiming(0, { duration: 200 });
  }, [phase]);

  const activatePanic = useCallback(async () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    setPhase('activating');
    if (mode === 'loud') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    setTimeout(async () => {
      try {
        let locToUse = location;
        if (!locToUse) {
          locToUse = await acquireLocation();
        }
        const res = await triggerPanic(mode, locToUse);
        setDelivery(res.mode);
        if (res.mode === 'queued') {
          setQueuedLocalId(res.localId);
        }
        setPhase('active');
        alertOpacity.value = withTiming(1, { duration: 500 });
        if (mode === 'loud' && res.mode === 'sent') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (e) {
        setPhase('ready');
        const msg = e instanceof Error ? e.message : 'Failed to trigger panic.';
        Alert.alert('Error', msg);
      }
    }, 1000);
  }, [mode, location, triggerPanic]);

  const handleCancel = useCallback(async () => {
    cancelPanic();
    if (queuedLocalId) {
      await removeOfflineIncident(queuedLocalId);
      setQueuedLocalId(null);
    }
    if (mode === 'loud') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [cancelPanic, mode, queuedLocalId, removeOfflineIncident]);

  const bgAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bgScale.value }],
  }));

  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: phase === 'holding' ? withSpring(0.94) : pulseScale.value }],
  }));

  const alertAnimStyle = useAnimatedStyle(() => ({
    opacity: alertOpacity.value,
  }));

  const circleProgress = holdProgress;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference * (1 - circleProgress);

  const getPhaseColor = () => {
    if (phase === 'active') return '#E8001C';
    if (phase === 'holding' || phase === 'activating') return '#FF6B35';
    return '#E8001C';
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={phase === 'active'
          ? ['#1A0005', '#2D0008', '#1A0005']
          : ['#0A0A0E', '#180005', '#0A0A0E']
        }
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        {phase !== 'active' && (
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
            <Ionicons name="chevron-down" size={28} color="rgba(255,255,255,0.7)" />
          </Pressable>
        )}
        <Text style={[styles.headerTitle, { fontFamily: 'Rubik_700Bold' }]}>
          {t('panicAlert', language)}
        </Text>
      </View>

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => setMode('silent')}
          style={[styles.modeBtn, mode === 'silent' && styles.modeBtnActive]}
          accessibilityLabel="Silent panic mode"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="volume-off" size={18} color={mode === 'silent' ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
          <Text style={[styles.modeBtnText, { color: mode === 'silent' ? '#FFFFFF' : 'rgba(255,255,255,0.5)', fontFamily: 'Rubik_600SemiBold' }]}>
            {t('silentMode', language)}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('loud')}
          style={[styles.modeBtn, mode === 'loud' && styles.modeBtnActive]}
          accessibilityLabel="Loud panic mode"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="volume-high" size={18} color={mode === 'loud' ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} />
          <Text style={[styles.modeBtnText, { color: mode === 'loud' ? '#FFFFFF' : 'rgba(255,255,255,0.5)', fontFamily: 'Rubik_600SemiBold' }]}>
            {t('loudMode', language)}
          </Text>
        </Pressable>
      </View>

      <View style={styles.centerArea}>
        {phase === 'active' ? (
          <Animated.View style={[styles.activeContainer, alertAnimStyle]}>
            <MaterialCommunityIcons name="shield-alert" size={80} color="#E8001C" />
            <Text style={[styles.activeTitle, { fontFamily: 'Rubik_900Black' }]}>
              {delivery === 'queued' ? 'QUEUED' : t('alertSent', language)}
            </Text>
            <Text style={[styles.activeSubtitle, { fontFamily: 'Rubik_500Medium' }]}>
              {delivery === 'queued'
                ? 'No internet. We saved your panic alert and will send it automatically when you’re online.'
                : t('helpIsOnTheWay', language)}
            </Text>
            <View style={styles.statusItems}>
              <View style={styles.statusItem}>
                <Ionicons name="location" size={16} color="#30D158" />
                <Text style={[styles.statusText, { fontFamily: 'Rubik_400Regular' }]}>
                  {delivery === 'queued' ? 'Location saved' : t('locationShared', language)}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Ionicons name="notifications" size={16} color="#30D158" />
                <Text style={[styles.statusText, { fontFamily: 'Rubik_400Regular' }]}>
                  {delivery === 'queued' ? 'Will notify responders when online' : t('responderNotified', language)}
                </Text>
              </View>
            </View>
            <View style={[styles.locationCard, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={[styles.locationLabel, { fontFamily: 'Rubik_500Medium' }]}>Location Transmitted</Text>
              <Text style={[styles.locationValue, { fontFamily: 'Rubik_400Regular' }]}>{locationText}</Text>
              <Text style={[styles.locationTime, { fontFamily: 'Rubik_400Regular' }]}>{timestamp}</Text>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.holdContainer}>
            <Animated.View style={[buttonAnimStyle, styles.holdOuter]}>
              <Pressable
                onPressIn={startHold}
                onPressOut={cancelHold}
                style={styles.holdButton}
                accessibilityLabel="Hold to trigger panic alert"
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={phase === 'holding' ? ['#FF4500', '#E8001C'] : ['#CC0000', '#E8001C']}
                  style={styles.holdGradient}
                >
                  <MaterialCommunityIcons name="shield-alert" size={64} color="#FFFFFF" />
                  <Text style={[styles.holdText, { fontFamily: 'Rubik_900Black' }]}>
                    {phase === 'holding' ? t('releaseToTrigger', language) :
                     phase === 'activating' ? t('activating', language) :
                     t('tapAndHold', language)}
                  </Text>
                  {phase === 'holding' && (
                    <Text style={[styles.holdSubText, { fontFamily: 'Rubik_400Regular' }]}>
                      {Math.round(circleProgress * 100)}%
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>
            {phase === 'holding' && (
              <View style={styles.progressRing}>
                <View style={[styles.progressFill, {
                  width: `${circleProgress * 100}%`,
                  backgroundColor: '#E8001C',
                }]} />
              </View>
            )}
          </View>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={[styles.locationBadge, { backgroundColor: 'rgba(255,255,255,0.07)' }]}>
          <Ionicons name="location" size={14} color={location ? '#30D158' : '#FF9F0A'} />
          <Text style={[styles.footerLocationText, { fontFamily: 'Rubik_400Regular' }]} numberOfLines={1}>
            {locationText}
          </Text>
        </View>
        <Text style={[styles.footerTime, { fontFamily: 'Rubik_400Regular' }]}>{timestamp}</Text>

        {phase === 'active' ? (
          <Pressable onPress={handleCancel} style={styles.cancelBtn} accessibilityLabel="Cancel alert" accessibilityRole="button">
            <Text style={[styles.cancelText, { fontFamily: 'Rubik_700Bold' }]}>
              {delivery === 'queued' ? 'Cancel queued alert' : t('cancelPanic', language)}
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.back()} style={styles.goBackBtn} accessibilityLabel="Go back" accessibilityRole="button">
            <Text style={[styles.goBackText, { fontFamily: 'Rubik_500Medium' }]}>Go Back</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 20,
    bottom: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },
  modeRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modeBtnActive: {
    borderColor: '#E8001C',
    backgroundColor: 'rgba(232,0,28,0.2)',
  },
  modeBtnText: { fontSize: 13 },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holdContainer: {
    alignItems: 'center',
  },
  holdOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    shadowColor: '#E8001C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 30,
  },
  holdButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
  },
  holdGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  holdText: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 1.5,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  holdSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 20,
  },
  progressRing: {
    width: '70%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginTop: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  activeContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  activeTitle: {
    fontSize: 36,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  activeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  statusItems: {
    gap: 10,
    alignSelf: 'stretch',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    color: '#30D158',
    fontSize: 14,
  },
  locationCard: {
    alignSelf: 'stretch',
    padding: 16,
    borderRadius: 14,
    gap: 4,
  },
  locationLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locationValue: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  locationTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  footer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  footerLocationText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    flex: 1,
  },
  footerTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
  },
  cancelBtn: {
    backgroundColor: 'rgba(232,0,28,0.15)',
    borderWidth: 1,
    borderColor: '#E8001C',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#E8001C',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  goBackBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  goBackText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
  },
});
