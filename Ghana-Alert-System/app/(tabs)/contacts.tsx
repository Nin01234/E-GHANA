import React from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  useColorScheme, Platform, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useEmergency } from '@/contexts/EmergencyContext';
import { t } from '@/constants/translations';

const CONTACTS = [
  {
    number: '112',
    nameKey: 'national' as const,
    descKey: 'nationalDesc' as const,
    icon: 'shield-alert',
    color: '#E8001C',
    gradient: ['#8B0000', '#E8001C'] as [string, string],
    priority: true,
  },
  {
    number: '191',
    nameKey: 'police' as const,
    descKey: 'policeDesc' as const,
    icon: 'police-badge',
    color: '#003580',
    gradient: ['#001F5C', '#003580'] as [string, string],
    priority: false,
  },
  {
    number: '192',
    nameKey: 'fire' as const,
    descKey: 'fireDesc' as const,
    icon: 'fire',
    color: '#FF4500',
    gradient: ['#CC3300', '#FF4500'] as [string, string],
    priority: false,
  },
  {
    number: '193',
    nameKey: 'ambulance' as const,
    descKey: 'ambulanceDesc' as const,
    icon: 'ambulance',
    color: '#00897B',
    gradient: ['#00574B', '#00897B'] as [string, string],
    priority: false,
  },
];

const ADDITIONAL = [
  { name: 'Ghana Police Headquarters', number: '030 277 3606', icon: 'office-building' as const, color: '#003580' },
  { name: 'GNFS Headquarters', number: '030 222 3631', icon: 'fire-station' as const, color: '#FF4500' },
  { name: 'NECC Operations Centre', number: '030 296 1717', icon: 'shield-cross' as const, color: '#7B2FBE' },
  { name: 'NADMO (Disasters)', number: '0800 00 222 1', icon: 'tsunami' as const, color: '#FF9F0A' },
];

function EmergencyCard({ contact, language }: { contact: typeof CONTACTS[0]; language: string }) {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleCall = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Linking.openURL(`tel:${contact.number}`);
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={handleCall}
        style={[styles.card, { backgroundColor: C.card, borderColor: contact.color + '30' }]}
        accessibilityLabel={`Call ${contact.number}`}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={contact.gradient}
          style={[styles.cardIcon, { shadowColor: contact.color }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name={contact.icon as any} size={30} color="#FFFFFF" />
        </LinearGradient>
        <View style={styles.cardContent}>
          <Text style={[styles.cardNumber, { color: contact.color, fontFamily: 'Rubik_900Black' }]}>
            {contact.number}
          </Text>
          <Text style={[styles.cardName, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>
            {t(contact.nameKey as any, language as any)}
          </Text>
          <Text style={[styles.cardDesc, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
            {t(contact.descKey as any, language as any)}
          </Text>
        </View>
        <View style={[styles.callBadge, { backgroundColor: contact.color + '20' }]}>
          <Ionicons name="call" size={18} color={contact.color} />
          <Text style={[styles.callText, { color: contact.color, fontFamily: 'Rubik_600SemiBold' }]}>
            {t('callNow', language as any)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AdditionalContact({ item }: { item: typeof ADDITIONAL[0] }) {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => Linking.openURL(`tel:${item.number.replace(/\s/g, '')}`)}
        style={[styles.addCard, { backgroundColor: C.surface, borderColor: C.border }]}
        accessibilityLabel={`Call ${item.name}`}
        accessibilityRole="button"
      >
        <View style={[styles.addIcon, { backgroundColor: item.color + '20' }]}>
          <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
        </View>
        <View style={styles.addContent}>
          <Text style={[styles.addName, { color: C.text, fontFamily: 'Rubik_600SemiBold' }]}>{item.name}</Text>
          <Text style={[styles.addNumber, { color: item.color, fontFamily: 'Rubik_700Bold' }]}>{item.number}</Text>
        </View>
        <Ionicons name="call-outline" size={20} color={C.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

export default function ContactsScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { language } = useEmergency();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.background }]}>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: 'Rubik_900Black' }]}>
          {t('emergencyNumbers', language)}
        </Text>
        <Text style={[styles.headerSub, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
          Ghana Security Services — 24/7
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.emergencyBanner, { backgroundColor: C.emergency + '15', borderColor: C.emergency + '40' }]}>
          <MaterialCommunityIcons name="phone-alert" size={18} color={C.emergency} />
          <Text style={[styles.bannerText, { color: C.emergency, fontFamily: 'Rubik_600SemiBold' }]}>
            Tap any number to call immediately
          </Text>
        </View>

        {CONTACTS.map(contact => (
          <EmergencyCard key={contact.number} contact={contact} language={language} />
        ))}

        <View style={styles.sectionDivider}>
          <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
          <Text style={[styles.dividerText, { color: C.textTertiary, fontFamily: 'Rubik_500Medium' }]}>
            Additional Contacts
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
        </View>

        {ADDITIONAL.map(item => (
          <AdditionalContact key={item.number} item={item} />
        ))}

        <View style={[styles.infoBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <MaterialCommunityIcons name="information" size={16} color={C.textSecondary} />
          <Text style={[styles.infoText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
            All calls are routed through Ghana&apos;s National Emergency Communication Centre (NECC). Calls are recorded for quality and security purposes.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, letterSpacing: -0.5 },
  headerSub: { fontSize: 14, marginTop: 4 },
  content: { padding: 20, gap: 14 },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: { fontSize: 13, flex: 1 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: { flex: 1 },
  cardNumber: { fontSize: 28, letterSpacing: 1 },
  cardName: { fontSize: 14, marginTop: 2 },
  cardDesc: { fontSize: 12, marginTop: 2 },
  callBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  callText: { fontSize: 12 },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContent: { flex: 1 },
  addName: { fontSize: 13 },
  addNumber: { fontSize: 14, marginTop: 2 },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },
});
