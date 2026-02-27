import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions,
  useColorScheme, Platform, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle, useSharedValue, withRepeat, withTiming,
  withSpring, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useEmergency } from '@/contexts/EmergencyContext';
import { t } from '@/constants/translations';
import { LinearGradient } from 'expo-linear-gradient';
import { useConnectivity } from '@/lib/connectivity';

const EMERGENCY_NUMBERS = [
  { number: '112', label: 'National', color: '#E8001C', icon: 'shield-alert' as const, bg: 'rgba(232,0,28,0.15)' },
  { number: '191', label: 'Police', color: '#003580', icon: 'police-badge' as const, bg: 'rgba(0,53,128,0.15)' },
  { number: '192', label: 'Fire', color: '#FF4500', icon: 'fire' as const, bg: 'rgba(255,69,0,0.15)' },
  { number: '193', label: 'Ambulance', color: '#00897B', icon: 'ambulance' as const, bg: 'rgba(0,137,123,0.15)' },
];

function PulsingRing({ color, size }: { color: string; size: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: color,
    }, style]} />
  );
}

function EmergencyTypeCard({ type, label, icon, color, bg, onPress }: {
  type: string; label: string; icon: string; color: string; bg: string; onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.94); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={[styles.typeCard, { backgroundColor: bg, borderColor: color + '40' }]}
        accessibilityLabel={`Report ${label} emergency`}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name={icon as any} size={28} color={color} />
        <Text style={[styles.typeLabel, { color: C.text, fontFamily: 'Rubik_600SemiBold' }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function QuickDialButton({ number, label, color, icon, bg }: {
  number: string; label: string; color: string; icon: string; bg: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.dialButton, animStyle]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.92); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => Linking.openURL(`tel:${number}`)}
        style={[styles.dialInner, { backgroundColor: bg, borderColor: color + '50' }]}
        accessibilityLabel={`Call ${label} ${number}`}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        <Text style={[styles.dialNumber, { color, fontFamily: 'Rubik_700Bold' }]}>{number}</Text>
        <Text style={[styles.dialLabel, { color: color + 'AA', fontFamily: 'Rubik_400Regular' }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function EmergencyHome() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { language } = useEmergency();
  const { width } = useWindowDimensions();
  const connectivity = useConnectivity();

  const goToReport = useCallback((type?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({ pathname: '/report', params: { type: type || 'other' } });
  }, []);

  const goToPanic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.push('/panic');
  }, []);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  // Responsive sizing for the central panic button so it fits comfortably
  // on smaller devices while staying prominent on larger screens.
  const panicSize = Math.min(width * 0.6, 220);

  return (
    <LinearGradient
      colors={isDark ? ['#0A0A0E', '#12000A', '#0A0A0E'] : ['#F5F5F7', '#FFF0F0', '#F5F5F7']}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding + 8, paddingBottom: tabBarHeight + 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {connectivity !== 'online' && (
          <View style={[styles.banner, { backgroundColor: connectivity === 'offline' ? '#8B1A1A' : '#8B6A00' }]}>
            <MaterialCommunityIcons
              name={connectivity === 'offline' ? 'cloud-off-outline' : 'signal-cellular-2'}
              size={16}
              color="#FFFFFF"
            />
            <Text style={[styles.bannerText, { fontFamily: 'Rubik_500Medium' }]}>
              {connectivity === 'offline'
                ? t('offlineNoInternetBanner', language)
                : t('offlineSlowBanner', language)}
            </Text>
          </View>
        )}
        <View style={[styles.header, { maxWidth: 640, alignSelf: 'center', width: '100%' }]}>
          <View>
            <Text style={[styles.appName, { color: C.emergency, fontFamily: 'Rubik_900Black' }]}>E-GHANA</Text>
            <Text style={[styles.appSubtitle, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
              Emergency Response System
            </Text>
          </View>
          <View style={[styles.ghanaFlag, { borderColor: C.border }]}>
            <View style={[styles.flagBand, { backgroundColor: '#006B3F' }]} />
            <View style={[styles.flagBand, { backgroundColor: '#FFD100' }]}>
              <View style={styles.flagStar} />
            </View>
            <View style={[styles.flagBand, { backgroundColor: '#E8001C' }]} />
          </View>
        </View>

        <Pressable
          onPress={goToPanic}
          accessibilityLabel="Trigger panic alert"
          accessibilityRole="button"
        >
          <View style={[styles.panicContainer, { height: panicSize + 40 }]}>
            <PulsingRing color={C.emergency} size={panicSize + 40} />
            <PulsingRing color={C.emergency} size={panicSize + 80} />
            <LinearGradient
              colors={['#CC0000', '#E8001C', '#FF1A1A']}
              style={[styles.panicButton, { width: panicSize, height: panicSize, borderRadius: panicSize / 2 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="shield-alert" size={52} color="#FFFFFF" />
              <Text style={[styles.panicText, { fontFamily: 'Rubik_900Black' }]}>PANIC</Text>
              <Text style={[styles.panicSubText, { fontFamily: 'Rubik_500Medium' }]}>Hold to trigger</Text>
            </LinearGradient>
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>
          {t('selectIncidentType', language)}
        </Text>

        <View style={styles.typeGrid}>
          <EmergencyTypeCard type="police" label={t('police', language)} icon="police-badge" color={C.police} bg={isDark ? 'rgba(74,144,217,0.12)' : 'rgba(0,53,128,0.08)'} onPress={() => goToReport('police')} />
          <EmergencyTypeCard type="fire" label={t('fire', language)} icon="fire" color={C.fire} bg={isDark ? 'rgba(255,107,53,0.12)' : 'rgba(255,69,0,0.08)'} onPress={() => goToReport('fire')} />
          <EmergencyTypeCard type="medical" label={t('medical', language)} icon="ambulance" color={C.ambulance} bg={isDark ? 'rgba(38,198,180,0.12)' : 'rgba(0,137,123,0.08)'} onPress={() => goToReport('medical')} />
          <EmergencyTypeCard type="other" label={t('other', language)} icon="alert-circle" color={C.other} bg={isDark ? 'rgba(168,85,247,0.12)' : 'rgba(123,47,190,0.08)'} onPress={() => goToReport('other')} />
        </View>

        <Text style={[styles.sectionTitle, { color: C.text, fontFamily: 'Rubik_700Bold', marginTop: 8 }]}>
          {t('quickDial', language)}
        </Text>

        <View style={styles.dialGrid}>
          {EMERGENCY_NUMBERS.map((item) => (
            <QuickDialButton key={item.number} {...item} />
          ))}
        </View>

        <View style={[styles.legalBadge, { backgroundColor: C.surface, borderColor: C.border }]}>
          <MaterialCommunityIcons name="shield-check" size={14} color={C.success} />
          <Text style={[styles.legalText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
            Compliant with Ghana Data Protection Act (Act 843)
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    gap: 18,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bannerText: { color: '#FFFFFF', fontSize: 12, flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  ghanaFlag: {
    width: 40,
    height: 28,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    flexDirection: 'column',
  },
  flagBand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagStar: {
    width: 8,
    height: 8,
    backgroundColor: '#000000',
    transform: [{ rotate: '45deg' }],
  },
  panicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  panicButton: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E8001C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    gap: 4,
  },
  panicText: {
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  panicSubText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  typeCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  typeLabel: {
    fontSize: 14,
  },
  dialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  dialButton: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  dialInner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  dialNumber: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  dialLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  legalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  legalText: {
    fontSize: 11,
    flex: 1,
  },
});
