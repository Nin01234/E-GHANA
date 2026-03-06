import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  useColorScheme, Platform, Image, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useEmergency, IncidentType, LocationData } from '@/contexts/EmergencyContext';
import { t } from '@/constants/translations';
import { getFirstAidAdvice, buildFirstAidSpeech } from '@/lib/firstAid';

type IncidentConfig = {
  label: string;
  icon: string;
  color: string;
  bg: string;
};

const INCIDENT_TYPES: Record<string, IncidentConfig> = {
  police: { label: 'Police', icon: 'police-badge', color: '#003580', bg: 'rgba(0,53,128,0.12)' },
  fire: { label: 'Fire', icon: 'fire', color: '#FF4500', bg: 'rgba(255,69,0,0.12)' },
  medical: { label: 'Medical', icon: 'ambulance', color: '#00897B', bg: 'rgba(0,137,123,0.12)' },
  other: { label: 'Other', icon: 'alert-circle', color: '#7B2FBE', bg: 'rgba(123,47,190,0.12)' },
};

type PoliceCase = {
  label: string;
  icon: string;
  keywords?: string[];
};

const POLICE_CASES: PoliceCase[] = [
  { label: 'Armed robbery', icon: 'pistol', keywords: ['robbery', 'gun', 'armed'] },
  { label: 'Burglary / theft', icon: 'home-lock', keywords: ['burglary', 'theft', 'stolen', 'break-in'] },
  { label: 'Domestic violence', icon: 'home-heart', keywords: ['domestic', 'abuse', 'family'] },
  { label: 'Assault / fighting', icon: 'karate', keywords: ['assault', 'fight', 'violence'] },
  { label: 'Kidnapping / missing person', icon: 'account-search', keywords: ['kidnap', 'missing', 'abduction'] },
  { label: 'Sexual offence', icon: 'alert-octagon', keywords: ['sexual', 'rape', 'harassment'] },
  { label: 'Fraud / cybercrime', icon: 'shield-bug', keywords: ['fraud', 'scam', 'cyber', 'online'] },
  { label: 'Traffic accident', icon: 'car-crash', keywords: ['traffic', 'accident', 'crash', 'vehicle'] },
  { label: 'Other police case', icon: 'shield-account', keywords: ['other'] },
];

function formatTimestamp(date: Date): string {
  return date.toLocaleString('en-GH', {
    timeZone: 'Africa/Accra',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function TypePill({ typeKey, val, selected, onSelect }: {
  typeKey: string; val: IncidentConfig; selected: boolean; onSelect: (k: string) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.typePill, animStyle]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => onSelect(typeKey)}
        style={[
          styles.typePillInner,
          { backgroundColor: selected ? val.color : val.bg, borderColor: val.color + (selected ? 'FF' : '40') }
        ]}
        accessibilityLabel={`Select ${val.label}`}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name={val.icon as any} size={20} color={selected ? '#FFFFFF' : val.color} />
        <Text style={[styles.typePillLabel, { color: selected ? '#FFFFFF' : val.color, fontFamily: 'Rubik_600SemiBold' }]}>
          {val.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function TypeSelector({ selected, onSelect, C }: {
  selected: string; onSelect: (t: string) => void; C: typeof Colors.light;
}) {
  return (
    <View style={styles.typeRow}>
      {Object.entries(INCIDENT_TYPES).map(([key, val]) => (
        <TypePill key={key} typeKey={key} val={val} selected={selected === key} onSelect={onSelect} />
      ))}
    </View>
  );
}

export default function ReportScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { type: paramType } = useLocalSearchParams<{ type: string }>();
  const { submitIncident, language } = useEmergency();
  const { isAuthenticated } = useAuth();

  const [incidentType, setIncidentType] = useState<string>(paramType || 'other');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationText, setLocationText] = useState('Acquiring location...');
  const [photos, setPhotos] = useState<string[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const audioRecordingRef = useRef<Audio.Recording | null>(null);
  const audioPlaybackRef = useRef<Audio.Sound | null>(null);
  const [videoUris, setVideoUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [timestamp, setTimestamp] = useState('');
  const spamWindowRef = useRef<{ windowStart: number; count: number }>({ windowStart: 0, count: 0 });
  const [isFirstAidPlaying, setIsFirstAidPlaying] = useState(false);
  const locationWatcher = useRef<Location.LocationSubscription | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const submitScale = useSharedValue(1);
  const submitAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: submitScale.value }] }));
  const liveFirstAid = incidentType === 'medical'
    ? getFirstAidAdvice(description, incidentType as IncidentType)
    : null;
  const [policeCase, setPoliceCase] = useState<string | null>(null);
  const [policeCaseQuery, setPoliceCaseQuery] = useState('');

  const filteredPoliceCases = useMemo(() => {
    const q = policeCaseQuery.trim().toLowerCase();
    if (!q) return POLICE_CASES;
    return POLICE_CASES.filter((c) => {
      const base = c.label.toLowerCase();
      if (base.includes(q)) return true;
      return (c.keywords || []).some((k) => k.toLowerCase().includes(q));
    });
  }, [policeCaseQuery]);

  useEffect(() => {
    setTimestamp(formatTimestamp(new Date()));
    const timer = setInterval(() => setTimestamp(formatTimestamp(new Date())), 1000);
    const startWatcher = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationText('Location permission denied');
          return;
        }

        if (locationWatcher.current) {
          locationWatcher.current.remove();
          locationWatcher.current = null;
        }

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 5000,
          },
          async (loc) => {
            try {
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
            } catch {
              setLocationText('Location unavailable');
            }
          },
        );

        locationWatcher.current = subscription;
      } catch {
        setLocationText('Location unavailable');
      }
    };

    startWatcher();

    return () => {
      clearInterval(timer);
      if (locationWatcher.current) {
        locationWatcher.current.remove();
        locationWatcher.current = null;
      }
      if (isFirstAidPlaying) {
        Speech.stop();
      }
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.unloadAsync();
        audioPlaybackRef.current = null;
      }
    };
  }, [isFirstAidPlaying]);

  const acquireLocation = async (): Promise<LocationData | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationText('Location permission denied');
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

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to capture evidence.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleToggleAudioPlayback = async () => {
    if (!audioUri) {
      Alert.alert('No audio', 'Record an audio note first.');
      return;
    }
    try {
      // If already playing, stop
      if (isAudioPlaying && audioPlaybackRef.current) {
        await audioPlaybackRef.current.stopAsync();
        setIsAudioPlaying(false);
        return;
      }

      // Clean up any previous sound
      if (audioPlaybackRef.current) {
        await audioPlaybackRef.current.unloadAsync();
        audioPlaybackRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      audioPlaybackRef.current = sound;
      setIsAudioPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setIsAudioPlaying(false);
          sound.setOnPlaybackStatusUpdate(null);
        }
      });

      await sound.playAsync();
    } catch {
      setIsAudioPlaying(false);
      Alert.alert('Error', 'Failed to play audio note.');
    }
  };

  const fromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is needed to attach evidence.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      for (const asset of result.assets) {
        const isVideo = asset.type === 'video' || (asset as any).duration != null || /\.(mp4|mov|m4v)$/i.test(asset.uri);
        if (isVideo) {
          setVideoUris((prev) => [...prev, asset.uri]);
        } else {
          setPhotos((prev) => [...prev, asset.uri]);
        }
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Login required', 'Please log in first. You can still submit as anonymous after logging in.');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    submitScale.value = withSpring(0.96);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Simple local spam warning: more than 5 reports in 5 minutes from this device.
    const now = Date.now();
    const windowMs = 5 * 60_000;
    const maxInWindow = 5;
    const current = spamWindowRef.current;
    if (now - current.windowStart > windowMs) {
      spamWindowRef.current = { windowStart: now, count: 1 };
    } else {
      spamWindowRef.current = { windowStart: current.windowStart, count: current.count + 1 };
    }
    if (spamWindowRef.current.count > maxInWindow) {
      Alert.alert(
        t('tooManyReportsTitle', language),
        t('tooManyReportsBody', language),
      );
    }

    try {
      let locToUse = location;
      if (!locToUse) {
        locToUse = await acquireLocation();
      }

      const mediaUris: string[] = [
        ...photos,
        ...(audioUri ? [audioUri] : []),
        ...videoUris,
      ];

      const finalDescription =
        incidentType === 'police' && policeCase
          ? `[Police case: ${policeCase}] ${description || ''}`.trim()
          : description;

      const result = await submitIncident({
        type: incidentType as IncidentType,
        description: finalDescription,
        location: locToUse,
        mediaUris,
        isAnonymous,
        priorityScore: incidentType === 'fire' || incidentType === 'medical' ? 4 : 3,
      });
      submitScale.value = withSpring(1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result.mode === 'queued') {
        Alert.alert(
          t('reportSubmitted', language),
          t('queuedOfflineMessage', language),
        );
        router.back();
      } else {
        router.replace({ pathname: '/incident/[id]', params: { id: result.incident.id } });
      }
    } catch (e) {
      setIsSubmitting(false);
      submitScale.value = withSpring(1);
      const msg = e instanceof Error ? e.message : 'Failed to submit report. Please try again.';
      Alert.alert('Error', msg);
    }
  };

  const cfg = INCIDENT_TYPES[incidentType];
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: C.background, borderBottomColor: C.border }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn} accessibilityLabel="Close" accessibilityRole="button">
          <Ionicons name="close" size={26} color={C.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>
          {t('reportIncident', language)}
        </Text>
        <View style={styles.headerRight}>
          <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={14} color={cfg.color} />
            <Text style={[styles.typeBadgeText, { color: cfg.color, fontFamily: 'Rubik_600SemiBold' }]}>{cfg.label}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.locationCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={16} color={location ? C.success : C.warning} />
            <Text style={[styles.locationLabel, { color: C.textSecondary, fontFamily: 'Rubik_500Medium' }]}>
              {t('yourLocation', language)}
            </Text>
            <Pressable onPress={acquireLocation} style={styles.refreshBtn} accessibilityLabel="Refresh location" accessibilityRole="button">
              <Ionicons name="refresh" size={14} color={C.tint} />
            </Pressable>
          </View>
          <Text style={[styles.locationValue, { color: C.text, fontFamily: 'Rubik_400Regular' }]} numberOfLines={1}>
            {locationText}
          </Text>
          <Text style={[styles.locationTime, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>{timestamp}</Text>
          {location && (
            <View style={styles.locationMeta}>
              <Text style={[styles.locationMetaText, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>
                ±{location.accuracy}m accuracy · GPS
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>
          {t('selectIncidentType', language)}
        </Text>
        <TypeSelector selected={incidentType} onSelect={setIncidentType} C={C} />

        {incidentType === 'police' && (
          <>
            <Text style={[styles.sectionLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>
              Police case type
            </Text>

            <View style={[styles.policeCaseCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <LinearGradient
                colors={isDark ? ['rgba(74,144,217,0.14)', 'rgba(0,0,0,0)'] : ['rgba(0,53,128,0.10)', 'rgba(255,255,255,0)']}
                style={styles.policeCaseCardBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />

              <View style={styles.policeCaseHeaderRow}>
                <View style={styles.policeCaseHeaderLeft}>
                  <View style={[styles.policeCaseIconBadge, { backgroundColor: (isDark ? 'rgba(74,144,217,0.18)' : 'rgba(0,53,128,0.10)') }]}>
                    <MaterialCommunityIcons name="police-badge" size={18} color={isDark ? '#4A90D9' : '#003580'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.policeCaseTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>
                      Choose the closest match
                    </Text>
                    <Text style={[styles.policeCaseSubtitle, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
                      Helps route your report faster. You can change this later.
                    </Text>
                  </View>
                </View>

                <View style={styles.policeQuickActions}>
                  <Pressable
                    onPress={() => Linking.openURL('tel:191')}
                    style={[styles.policeQuickBtn, { borderColor: (isDark ? 'rgba(74,144,217,0.40)' : 'rgba(0,53,128,0.35)') }]}
                    accessibilityRole="button"
                    accessibilityLabel="Call police 191"
                  >
                    <MaterialCommunityIcons name="phone" size={14} color={isDark ? '#4A90D9' : '#003580'} />
                    <Text style={[styles.policeQuickBtnText, { color: isDark ? '#4A90D9' : '#003580', fontFamily: 'Rubik_600SemiBold' }]}>
                      Call 191
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Linking.openURL('tel:112')}
                    style={[styles.policeQuickBtn, { borderColor: C.border }]}
                    accessibilityRole="button"
                    accessibilityLabel="Call national emergency 112"
                  >
                    <MaterialCommunityIcons name="phone-alert" size={14} color={C.textSecondary} />
                    <Text style={[styles.policeQuickBtnText, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>
                      Call 112
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={[styles.policeSearchRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', borderColor: C.border }]}>
                <Ionicons name="search" size={16} color={C.textTertiary} />
                <TextInput
                  value={policeCaseQuery}
                  onChangeText={setPoliceCaseQuery}
                  placeholder="Search police cases…"
                  placeholderTextColor={C.textTertiary}
                  style={[styles.policeSearchInput, { color: C.text, fontFamily: 'Rubik_400Regular' }]}
                  accessibilityLabel="Search police case types"
                />
                {policeCaseQuery.length > 0 && (
                  <Pressable
                    onPress={() => setPoliceCaseQuery('')}
                    style={styles.policeSearchClear}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                  >
                    <Ionicons name="close-circle" size={18} color={C.textTertiary} />
                  </Pressable>
                )}
              </View>

              {policeCase && (
                <View style={[styles.policeSelectedRow, { borderColor: C.border }]}>
                  <MaterialCommunityIcons name="check-decagram" size={16} color={isDark ? '#4A90D9' : '#003580'} />
                  <Text style={[styles.policeSelectedText, { color: C.textSecondary, fontFamily: 'Rubik_500Medium' }]} numberOfLines={1}>
                    Selected: <Text style={{ color: C.text, fontFamily: 'Rubik_600SemiBold' }}>{policeCase}</Text>
                  </Text>
                  <Pressable
                    onPress={() => setPoliceCase(null)}
                    style={styles.policeSelectedClear}
                    accessibilityRole="button"
                    accessibilityLabel="Clear selected police case"
                  >
                    <Text style={[styles.policeSelectedClearText, { color: C.tint, fontFamily: 'Rubik_600SemiBold' }]}>Clear</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.caseGrid}>
                {filteredPoliceCases.map((c) => {
                  const active = policeCase === c.label;
                  return (
                    <Pressable
                      key={c.label}
                      onPress={() => {
                        setPoliceCase(prev => (prev === c.label ? null : c.label));
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.caseCard,
                        {
                          backgroundColor: active ? (isDark ? 'rgba(74,144,217,0.20)' : 'rgba(0,53,128,0.08)') : C.surface,
                          borderColor: active ? (isDark ? '#4A90D9' : '#003580') : C.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={c.label}
                    >
                      <View style={styles.caseCardTopRow}>
                        <View style={[
                          styles.caseCardIconWrap,
                          { backgroundColor: active ? (isDark ? 'rgba(74,144,217,0.20)' : 'rgba(0,53,128,0.10)') : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)') }
                        ]}>
                          <MaterialCommunityIcons
                            name={c.icon as any}
                            size={16}
                            color={active ? (isDark ? '#4A90D9' : '#003580') : C.textSecondary}
                          />
                        </View>
                        {active && (
                          <MaterialCommunityIcons name="check" size={16} color={isDark ? '#4A90D9' : '#003580'} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.caseCardText,
                          {
                            color: active ? C.text : C.textSecondary,
                            fontFamily: active ? 'Rubik_600SemiBold' : 'Rubik_400Regular',
                          },
                        ]}
                        numberOfLines={2}
                      >
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {filteredPoliceCases.length === 0 && (
                <Text style={[styles.policeEmptyText, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>
                  No matches. Try a different search.
                </Text>
              )}
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>
          {t('addDescription', language)}
        </Text>
        <View style={[styles.inputWrapper, { backgroundColor: C.surface, borderColor: C.border }]}>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t('describeEmergency', language)}
            placeholderTextColor={C.textTertiary}
            multiline
            numberOfLines={4}
            style={[styles.descInput, { color: C.text, fontFamily: 'Rubik_400Regular' }]}
            accessibilityLabel="Emergency description"
          />
        </View>

        {incidentType === 'medical' && liveFirstAid && (
          <View style={[styles.firstAidCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.firstAidHeaderRow}>
              <View style={styles.firstAidTitleColumn}>
                <View style={[styles.firstAidChip, { backgroundColor: C.tint + '20' }]}>
                  <MaterialCommunityIcons name="medical-bag" size={14} color={C.tint} />
                  <Text style={[styles.firstAidChipText, { color: C.tint, fontFamily: 'Rubik_600SemiBold' }]}>
                    Live first aid
                  </Text>
                </View>
                <Text style={[styles.firstAidTitle, { color: C.text, fontFamily: 'Rubik_600SemiBold' }]}>
                  {liveFirstAid.title}
                </Text>
                <Text style={[styles.firstAidMetaText, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>
                  Updates as you type and does not replace professional care.
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  if (!liveFirstAid) return;
                  if (isFirstAidPlaying) {
                    Speech.stop();
                    setIsFirstAidPlaying(false);
                    return;
                  }
                  const { text, speechLang, rate } = buildFirstAidSpeech(liveFirstAid, language);
                  setIsFirstAidPlaying(true);
                  Speech.speak(text, {
                    language: speechLang,
                    rate,
                    onDone: () => setIsFirstAidPlaying(false),
                    onStopped: () => setIsFirstAidPlaying(false),
                    onError: () => setIsFirstAidPlaying(false),
                  });
                }}
                style={styles.firstAidAudioBtn}
                accessibilityRole="button"
                accessibilityLabel={isFirstAidPlaying ? 'Stop first aid audio' : 'Play first aid audio'}
              >
                <MaterialCommunityIcons
                  name={isFirstAidPlaying ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={22}
                  color={C.tint}
                />
                <Text style={[styles.firstAidAudioText, { color: C.tint, fontFamily: 'Rubik_500Medium' }]}>
                  {isFirstAidPlaying ? 'Stop audio' : 'Hear steps'}
                </Text>
              </Pressable>
            </View>
            <View style={styles.firstAidDivider} />
            {liveFirstAid.bullets.map((b, idx) => (
              <View key={idx} style={styles.firstAidBulletRow}>
                <View style={[styles.firstAidDot, { backgroundColor: C.tint }]} />
                <Text style={[styles.firstAidBulletText, { color: C.text, fontFamily: 'Rubik_400Regular' }]}>
                  {b}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>
          {t('attachEvidence', language)}
        </Text>
        <View style={styles.evidenceRow}>
          <Pressable
            onPress={takePhoto}
            style={[styles.evidenceBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            accessibilityLabel={t('takePhoto', language)}
            accessibilityRole="button"
          >
            <Ionicons name="camera" size={24} color={C.tint} />
            <Text style={[styles.evidenceBtnText, { color: C.text, fontFamily: 'Rubik_500Medium' }]}>
              {t('takePhoto', language)}
            </Text>
          </Pressable>
          <Pressable
            onPress={fromGallery}
            style={[styles.evidenceBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            accessibilityLabel={t('fromGallery', language)}
            accessibilityRole="button"
          >
            <Ionicons name="images" size={24} color={C.tint} />
            <Text style={[styles.evidenceBtnText, { color: C.text, fontFamily: 'Rubik_500Medium' }]}>
              {t('fromGallery', language)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.evidenceRow}>
          <Pressable
            onPress={async () => {
              if (isRecordingAudio) {
                if (audioRecordingRef.current) {
                  try {
                    setIsRecordingAudio(false);
                    await audioRecordingRef.current.stopAndUnloadAsync();
                    const uri = audioRecordingRef.current.getURI();
                    if (uri) {
                      setAudioUri(uri);
                    }
                  } catch {
                    Alert.alert('Error', 'Failed to stop audio recording.');
                  } finally {
                    audioRecordingRef.current = null;
                  }
                }
              } else {
                try {
                  const { status } = await Audio.requestPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission Required', 'Microphone permission is needed to record audio.');
                    return;
                  }
                  await Audio.setAudioModeAsync({
                    allowsRecordingIOS: true,
                    playsInSilentModeIOS: true,
                  });
                  const { recording } = await Audio.Recording.createAsync(
                    Audio.RecordingOptionsPresets.HIGH_QUALITY,
                  );
                  audioRecordingRef.current = recording;
                  setIsRecordingAudio(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                } catch {
                  Alert.alert('Error', 'Failed to start audio recording.');
                }
              }
            }}
            style={[styles.evidenceBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            accessibilityLabel="Record audio note"
            accessibilityRole="button"
          >
            <Ionicons name={isRecordingAudio ? 'stop-circle' : 'mic'} size={24} color={C.tint} />
            <Text style={[styles.evidenceBtnText, { color: C.text, fontFamily: 'Rubik_500Medium' }]}>
              {isRecordingAudio ? 'Stop audio recording' : 'Record audio'}
            </Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera permission is needed to record live video.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                quality: 0.8,
                videoMaxDuration: 60,
              });
              if (!result.canceled && result.assets[0]) {
                setVideoUris(prev => [...prev, result.assets[0].uri]);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
            }}
            style={[styles.evidenceBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            accessibilityLabel="Record live video"
            accessibilityRole="button"
          >
            <Ionicons name="videocam" size={24} color={C.tint} />
            <Text style={[styles.evidenceBtnText, { color: C.text, fontFamily: 'Rubik_500Medium' }]}>
              Live video
            </Text>
          </Pressable>
        </View>

        {(audioUri || videoUris.length > 0) && (
          <View style={styles.mediaSummaryRow}>
            {audioUri && (
              <Pressable
                onPress={handleToggleAudioPlayback}
                style={styles.mediaBadge}
                accessibilityRole="button"
                accessibilityLabel={isAudioPlaying ? 'Stop audio note playback' : 'Play audio note'}
              >
                <Ionicons name={isAudioPlaying ? 'pause' : 'mic'} size={16} color={C.tint} />
                <Text style={[styles.mediaBadgeText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
                  {isAudioPlaying ? 'Playing audio note… tap to stop' : 'Audio note attached · tap to play'}
                </Text>
              </Pressable>
            )}
            {videoUris.length > 0 && (
              <View style={styles.mediaBadge}>
                <Ionicons name="videocam" size={16} color={C.tint} />
                <Text style={[styles.mediaBadgeText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
                  {videoUris.length} video{videoUris.length > 1 ? 's' : ''} attached
                </Text>
              </View>
            )}
          </View>
        )}

        {photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {photos.map((uri, i) => (
              <View key={i} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photoThumb} />
                <Pressable
                  onPress={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                  style={styles.removePhoto}
                  accessibilityLabel="Remove photo"
                  accessibilityRole="button"
                >
                  <Ionicons name="close-circle" size={22} color="#E8001C" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={[styles.anonRow, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.anonLeft}>
            <MaterialCommunityIcons name="incognito" size={20} color={isAnonymous ? C.tint : C.textSecondary} />
            <View>
              <Text style={[styles.anonTitle, { color: C.text, fontFamily: 'Rubik_600SemiBold' }]}>
                {t('anonymous', language)}
              </Text>
              <Text style={[styles.anonDesc, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
                Report without revealing identity
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => { setIsAnonymous(!isAnonymous); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={[styles.toggle, { backgroundColor: isAnonymous ? C.tint : C.border }]}
            accessibilityLabel="Toggle anonymous mode"
            accessibilityRole="switch"
          >
            <View style={[styles.toggleThumb, { transform: [{ translateX: isAnonymous ? 18 : 2 }] }]} />
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.submitArea, { backgroundColor: C.background, paddingBottom: insets.bottom + 16, borderTopColor: C.border }]}>
        <Animated.View style={submitAnimStyle}>
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitBtn, { opacity: isSubmitting ? 0.7 : 1 }]}
            accessibilityLabel={t('submitReport', language)}
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#CC0000', '#E8001C']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <Text style={[styles.submitText, { fontFamily: 'Rubik_700Bold' }]}>{t('submitting', language)}</Text>
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                  <Text style={[styles.submitText, { fontFamily: 'Rubik_700Bold' }]}>{t('submitReport', language)}</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  closeBtn: { padding: 4 },
  headerTitle: { fontSize: 18 },
  headerRight: {},
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  typeBadgeText: { fontSize: 12 },
  content: { padding: 20, gap: 12 },
  locationCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationLabel: { fontSize: 12, flex: 1 },
  refreshBtn: { padding: 4 },
  locationValue: { fontSize: 13 },
  locationTime: { fontSize: 11 },
  locationMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  locationMetaText: { fontSize: 11 },
  caseChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  caseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  caseChipText: {
    fontSize: 11,
  },
  policeCaseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
    marginTop: 8,
    gap: 12,
  },
  policeCaseCardBg: {
    ...StyleSheet.absoluteFillObject,
  },
  policeCaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  policeCaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
    paddingRight: 6,
  },
  policeCaseIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policeCaseTitle: {
    fontSize: 14,
  },
  policeCaseSubtitle: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  policeQuickActions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  policeQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  policeQuickBtnText: {
    fontSize: 12,
  },
  policeSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  policeSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  policeSearchClear: {
    padding: 2,
  },
  policeSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  policeSelectedText: {
    flex: 1,
    fontSize: 12,
  },
  policeSelectedClear: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  policeSelectedClearText: {
    fontSize: 12,
  },
  caseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  caseCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minHeight: 74,
    justifyContent: 'space-between',
  },
  caseCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  caseCardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseCardText: {
    fontSize: 12,
    lineHeight: 16,
  },
  policeEmptyText: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typePill: {},
  typePillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  typePillLabel: { fontSize: 13 },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  descInput: {
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  evidenceRow: { flexDirection: 'row', gap: 12 },
  evidenceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  evidenceBtnText: { fontSize: 14 },
  mediaSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  mediaBadgeText: { fontSize: 12 },
  photoScroll: { marginTop: 4 },
  photoWrapper: { marginRight: 10, position: 'relative' },
  photoThumb: { width: 80, height: 80, borderRadius: 10 },
  removePhoto: { position: 'absolute', top: -6, right: -6 },
  anonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  anonLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  anonTitle: { fontSize: 14 },
  anonDesc: { fontSize: 12, marginTop: 2 },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  submitArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  submitBtn: { borderRadius: 16, overflow: 'hidden' },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  firstAidCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  firstAidHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  firstAidTitleColumn: {
    flex: 1,
    gap: 4,
  },
  firstAidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  firstAidChipText: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  firstAidTitle: {
    fontSize: 14,
  },
  firstAidMetaText: {
    fontSize: 11,
  },
  firstAidAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  firstAidAudioText: {
    fontSize: 12,
  },
  firstAidDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginVertical: 4,
  },
  firstAidBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 3,
  },
  firstAidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  firstAidBulletText: {
    flex: 1,
    fontSize: 13,
  },
});
