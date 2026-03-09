import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, ScrollView,
  Platform, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useEmergency, Language } from '@/contexts/EmergencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { t } from '@/constants/translations';
import { useAppLock } from '@/contexts/AppLockContext';
import { useTheme, ThemeMode } from '@/contexts/ThemeContext';

function AppLockModal({
  visible,
  onClose,
  lockEnabled,
  onConfigurePin,
}: {
  visible: boolean;
  onClose: () => void;
  lockEnabled: boolean;
  onConfigurePin: (pin: string | null) => Promise<void>;
}) {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!pin || pin.length < 4) {
      setError('PIN must be 4 digits.');
      return;
    }
    if (pin !== confirm) {
      setError('PINs do not match.');
      return;
    }
    setSaving(true);
    try {
      await onConfigurePin(pin);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      await onConfigurePin(null);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: C.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: C.border, paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} style={styles.modalClose} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={26} color={C.text} />
          </Pressable>
          <Text style={[styles.modalTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>App Lock</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 30 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.identityCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={[styles.identityAvatar, { backgroundColor: '#E8001C15' }]}>
              <MaterialCommunityIcons name="shield-lock" size={32} color="#E8001C" />
            </View>
            <Text style={[styles.identityName, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>
              Protect your reports
            </Text>
            <Text style={[styles.identitySub, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
              Set a 4-digit PIN. You&apos;ll need it when reopening the app.
            </Text>
          </View>

          <View style={[styles.identityField, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={[styles.identityFieldIcon, { backgroundColor: C.surfaceSecondary }]}>
              <MaterialCommunityIcons name="lock" size={18} color={C.textSecondary} />
            </View>
            <View style={styles.identityFieldContent}>
              <Text style={[styles.identityFieldLabel, { color: C.textTertiary, fontFamily: 'Rubik_500Medium' }]}>
                New PIN
              </Text>
              <TextInput
                value={pin}
                onChangeText={(v) => {
                  setError(null);
                  setPin(v.replace(/[^0-9]/g, '').slice(0, 4));
                }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                style={[styles.lockInput, { color: C.text }]}
                placeholder="••••"
                placeholderTextColor={C.textTertiary}
              />
            </View>
          </View>

          <View style={[styles.identityField, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={[styles.identityFieldIcon, { backgroundColor: C.surfaceSecondary }]}>
              <MaterialCommunityIcons name="lock-check" size={18} color={C.textSecondary} />
            </View>
            <View style={styles.identityFieldContent}>
              <Text style={[styles.identityFieldLabel, { color: C.textTertiary, fontFamily: 'Rubik_500Medium' }]}>
                Confirm PIN
              </Text>
              <TextInput
                value={confirm}
                onChangeText={(v) => {
                  setError(null);
                  setConfirm(v.replace(/[^0-9]/g, '').slice(0, 4));
                }}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                style={[styles.lockInput, { color: C.text }]}
                placeholder="••••"
                placeholderTextColor={C.textTertiary}
              />
            </View>
          </View>

          {error ? (
            <Text style={[styles.lockError, { color: '#E8001C', fontFamily: 'Rubik_400Regular' }]}>{error}</Text>
          ) : null}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.updateFaceBtn,
              {
                borderColor: '#E8001C40',
                backgroundColor: '#E8001C',
                opacity: saving ? 0.8 : pressed ? 0.9 : 1,
              },
            ]}
            accessibilityLabel="Save app lock PIN"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="shield-lock" size={20} color="#FFFFFF" />
            <Text style={[styles.updateFaceText, { fontFamily: 'Rubik_700Bold', color: '#FFFFFF' }]}>
              {saving ? 'Saving…' : 'Save PIN'}
            </Text>
          </Pressable>

          {lockEnabled && (
            <Pressable
              onPress={handleDisable}
              disabled={saving}
              style={({ pressed }) => [
                styles.updateFaceBtn,
                {
                  borderColor: '#66666640',
                  backgroundColor: 'transparent',
                  opacity: saving ? 0.8 : pressed ? 0.9 : 1,
                },
              ]}
              accessibilityLabel="Disable app lock"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="lock-open-variant" size={20} color={C.textSecondary} />
              <Text style={[styles.updateFaceText, { fontFamily: 'Rubik_600SemiBold', color: C.textSecondary }]}>
                Disable app lock
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tw', name: 'Twi', nativeName: 'Twi / Akan' },
  { code: 'ga', name: 'Ga', nativeName: 'Ga' },
  { code: 'ewe', name: 'Ewe', nativeName: 'Eʋegbe' },
];

const ID_TYPE_LABELS: Record<string, string> = {
  ghana_card: 'Ghana Card (NIA)',
  nhis: 'NHIS Card',
  driving_license: 'Driving Licence',
  voter_id: "Voter's ID",
  passport: 'Passport',
};

function SettingRow({
  icon, iconColor, title, subtitle, right, onPress, danger,
}: {
  icon: string; iconColor: string; title: string; subtitle?: string;
  right?: React.ReactNode; onPress?: () => void; danger?: boolean;
}) {
  const { colors: C } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { if (onPress) { scale.value = withSpring(0.98); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={[styles.row, { borderBottomColor: C.border }]}
        disabled={!onPress}
        accessibilityLabel={title}
        accessibilityRole={onPress ? 'button' : 'none'}
      >
        <View style={[styles.rowIcon, { backgroundColor: iconColor + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.rowContent}>
          <Text style={[styles.rowTitle, { color: danger ? '#E8001C' : C.text, fontFamily: 'Rubik_600SemiBold' }]}>{title}</Text>
          {subtitle && <Text style={[styles.rowSub, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>{subtitle}</Text>}
        </View>
        {right || (onPress ? <Ionicons name="chevron-forward" size={18} color={C.textTertiary} /> : null)}
      </Pressable>
    </Animated.View>
  );
}

function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: C.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: C.border, paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} style={styles.modalClose} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={26} color={C.text} />
          </Pressable>
          <Text style={[styles.modalTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Privacy & Data Protection</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.privacyBadge, { backgroundColor: C.success + '20' }]}>
            <MaterialCommunityIcons name="shield-lock" size={24} color={C.success} />
            <Text style={[styles.privacyBadgeText, { color: C.success, fontFamily: 'Rubik_700Bold' }]}>Ghana Data Protection Act (Act 843)</Text>
          </View>

          {[
            {
              title: '1. Data We Collect',
              text: 'E-GHANA collects the following personal data:\n• Full name, phone number, and email\n• National ID type and number\n• Face biometric image\n• GPS coordinates during emergency reports\n• Photos/videos attached to incident reports\n• Device information for fraud prevention',
            },
            {
              title: '2. Lawful Basis for Processing',
              text: 'Data is processed under the following lawful bases:\n• Consent: Biometric and location data\n• Vital Interest: Emergency response situations\n• Legal Obligation: Cooperation with security agencies under authorized investigations',
            },
            {
              title: '3. How We Use Your Data',
              text: 'Your data is used exclusively for:\n• Emergency incident reporting and routing\n• Identity verification to prevent prank calls\n• Connecting you with the correct Ghana security services\n• Improving emergency response times',
            },
            {
              title: '4. Data Security',
              text: 'We implement the following security measures:\n• End-to-end TLS encryption for all transmissions\n• At-rest encryption for stored data\n• Role-based access control for agency personnel\n• Audit logs for all data access events\n• Regular security assessments',
            },
            {
              title: '5. Data Retention',
              text: 'Data is retained for the following periods:\n• Incident records: 1 year unless flagged\n• Media files: 90 days\n• Biometric data: Until account deletion\n• Audit logs: 2 years',
            },
            {
              title: '6. Your Rights',
              text: 'Under Ghana\'s Data Protection Act (Act 843), you have the right to:\n• Access your personal data\n• Correct inaccurate data\n• Request erasure of your data\n• Object to processing\n• Data portability',
            },
            {
              title: '7. Contact',
              text: 'Data Protection Officer:\nemail: privacy@eghana.gov.gh\nData Protection Commission Ghana\nphone: 0302 927 569',
            },
          ].map((section) => (
            <View key={section.title} style={[styles.privacySection, { borderBottomColor: C.border }]}>
              <Text style={[styles.privacySectionTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>{section.title}</Text>
              <Text style={[styles.privacySectionText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>{section.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: C.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: C.border, paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} style={styles.modalClose} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={26} color={C.text} />
          </Pressable>
          <Text style={[styles.modalTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>About E-GHANA</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 30 }]}>
          <View style={styles.aboutLogoSection}>
            <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.aboutLogo}>
              <MaterialCommunityIcons name="shield-alert" size={44} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.aboutAppName, { color: C.emergency, fontFamily: 'Rubik_900Black' }]}>E-GHANA</Text>
            <Text style={[styles.aboutVersion, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>Version 1.0.0 · Emergency Response System</Text>
            <View style={styles.flagRow}>
              <View style={[styles.flagBand, { backgroundColor: '#006B3F' }]} />
              <View style={[styles.flagBand, { backgroundColor: '#FFD100' }]} />
              <View style={[styles.flagBand, { backgroundColor: '#E8001C' }]} />
            </View>
          </View>

          <View style={[styles.aboutCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.aboutCardTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Mission</Text>
            <Text style={[styles.aboutCardText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
              E-GHANA is Ghana&apos;s most advanced citizen emergency reporting and panic alert system. Built to reduce emergency response time, eliminate prank calls, and enable real-time evidence-based emergency response for all Ghanaian citizens.
            </Text>
          </View>

          <View style={[styles.aboutCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.aboutCardTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Supported Agencies</Text>
            {[
              { name: 'Ghana Police Service', number: '191', icon: 'police-badge', color: '#003580' },
              { name: 'Ghana National Fire Service', number: '192', icon: 'fire', color: '#FF4500' },
              { name: 'National Ambulance Service', number: '193', icon: 'ambulance', color: '#00897B' },
              { name: 'National Emergency (NECC)', number: '112', icon: 'shield-alert', color: '#E8001C' },
            ].map((agency) => (
              <View key={agency.number} style={[styles.agencyRow, { borderBottomColor: C.border }]}>
                <MaterialCommunityIcons name={agency.icon as any} size={20} color={agency.color} />
                <Text style={[styles.agencyName, { color: C.text, fontFamily: 'Rubik_500Medium' }]}>{agency.name}</Text>
                <Text style={[styles.agencyNumber, { color: agency.color, fontFamily: 'Rubik_700Bold' }]}>{agency.number}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.aboutCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.aboutCardTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Compliance</Text>
            {['Ghana Data Protection Act (Act 843)', 'National Identification Authority (NIA)', 'National Emergency Communication Centre (NECC)', 'Data Protection Commission (DPC) Ghana'].map(item => (
              <View key={item} style={styles.complianceRow}>
                <MaterialCommunityIcons name="check-circle" size={16} color={C.success} />
                <Text style={[styles.complianceText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function IdentityModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: C.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: C.border, paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} style={styles.modalClose} accessibilityLabel="Close" accessibilityRole="button">
            <Ionicons name="close" size={26} color={C.text} />
          </Pressable>
          <Text style={[styles.modalTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Identity & Verification</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 30 }]}>
          <View style={[styles.identityCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.identityAvatar}>
              <MaterialCommunityIcons name={user.faceImageUrl ? 'face-recognition' : 'account'} size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.identityName, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>{user.fullName}</Text>
            <View style={[styles.verificationBadge, { backgroundColor: user.isVerified ? C.success + '20' : C.warning + '20' }]}>
              <MaterialCommunityIcons
                name={user.isVerified ? 'shield-check' : 'shield-alert'}
                size={14}
                color={user.isVerified ? C.success : C.warning}
              />
              <Text style={[styles.verificationBadgeText, {
                color: user.isVerified ? C.success : C.warning,
                fontFamily: 'Rubik_600SemiBold'
              }]}>
                {user.isVerified ? 'Verified Identity' : 'Pending Verification'}
              </Text>
            </View>
          </View>

          {[
            { label: 'Full Name', value: user.fullName, icon: 'account' },
            { label: 'Phone Number', value: user.phone, icon: 'phone' },
            { label: 'Email', value: user.email || 'Not provided', icon: 'email' },
            { label: 'ID Type', value: ID_TYPE_LABELS[user.nationalIdType] || user.nationalIdType, icon: 'card-account-details' },
            { label: 'ID Number', value: user.nationalIdNumber, icon: 'identifier' },
            { label: 'Face Biometric', value: user.faceImageUrl ? 'Registered' : 'Not registered', icon: 'face-recognition' },
            { label: 'Member Since', value: new Date(user.createdAt).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' }), icon: 'calendar' },
          ].map((field) => (
            <View key={field.label} style={[styles.identityField, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={[styles.identityFieldIcon, { backgroundColor: C.surfaceSecondary }]}>
                <MaterialCommunityIcons name={field.icon as any} size={18} color={C.textSecondary} />
              </View>
              <View style={styles.identityFieldContent}>
                <Text style={[styles.identityFieldLabel, { color: C.textTertiary, fontFamily: 'Rubik_500Medium' }]}>{field.label}</Text>
                <Text style={[styles.identityFieldValue, { color: C.text, fontFamily: 'Rubik_600SemiBold' }]}>{field.value}</Text>
              </View>
            </View>
          ))}

          <Pressable
            onPress={() => { onClose(); setTimeout(() => router.push('/auth/face-verify'), 300); }}
            style={[styles.updateFaceBtn, { borderColor: '#7B2FBE40', backgroundColor: '#7B2FBE15' }]}
            accessibilityLabel="Update face biometric"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="face-recognition" size={20} color="#7B2FBE" />
            <Text style={[styles.updateFaceText, { fontFamily: 'Rubik_600SemiBold' }]}>
              {user.faceImageUrl ? 'Update Face Biometric' : 'Register Face Biometric'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#7B2FBE" />
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { colors: C, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { language, setLanguage, deleteAllIncidents, incidents } = useEmergency();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [showAppLock, setShowAppLock] = useState(false);
  const { lockEnabled, configurePin } = useAppLock();

  const themeOptions: { id: ThemeMode; title: string; subtitle: string; icon: string }[] = [
    { id: 'system', title: 'System default', subtitle: 'Match your device theme', icon: 'theme-light-dark' },
    { id: 'light', title: 'Light', subtitle: 'Bright background, day use', icon: 'white-balance-sunny' },
    { id: 'dark', title: 'Dark', subtitle: 'Dim background, night use', icon: 'weather-night' },
  ];

  const handleClearHistory = () => {
    Alert.alert(
      'Clear All Reports',
      'Are you sure you want to delete all your incident reports? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllIncidents();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert('Error', 'Failed to delete reports.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of E-GHANA?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              Alert.alert('Error', 'Failed to sign out.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <PrivacyModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <AboutModal visible={showAbout} onClose={() => setShowAbout(false)} />
      <IdentityModal visible={showIdentity} onClose={() => setShowIdentity(false)} />
      <AppLockModal
        visible={showAppLock}
        onClose={() => setShowAppLock(false)}
        lockEnabled={lockEnabled}
        onConfigurePin={configurePin}
      />

      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.background }]}>
        <Text style={[styles.headerTitle, { color: C.text, fontFamily: 'Rubik_900Black' }]}>{t('settings', language)}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {user && (
          <Pressable
            onPress={() => setShowIdentity(true)}
            style={[styles.profileCard, { backgroundColor: C.card, borderColor: C.border }]}
            accessibilityLabel="View identity details"
            accessibilityRole="button"
          >
            <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.profileAvatar}>
              <MaterialCommunityIcons name={user.faceImageUrl ? 'face-recognition' : 'account'} size={34} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>{user.fullName}</Text>
              <Text style={[styles.profilePhone, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>{user.phone}</Text>
              <View style={[styles.profileBadge, { backgroundColor: user.isVerified ? C.success + '20' : C.warning + '20' }]}>
                <MaterialCommunityIcons name={user.isVerified ? 'shield-check' : 'shield-alert'} size={12} color={user.isVerified ? C.success : C.warning} />
                <Text style={[styles.profileBadgeText, { color: user.isVerified ? C.success : C.warning, fontFamily: 'Rubik_500Medium' }]}>
                  {user.isVerified ? 'Verified' : 'Unverified'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.textTertiary} />
          </Pressable>
        )}

        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>IDENTITY</Text>
          <SettingRow
            icon="card-account-details"
            iconColor="#E8001C"
            title="Identity & Verification"
            subtitle={user ? `${ID_TYPE_LABELS[user.nationalIdType] || user.nationalIdType} — ${user.isVerified ? 'Verified' : 'Pending'}` : 'Tap to view'}
            onPress={() => setShowIdentity(true)}
          />
          <SettingRow
            icon="face-recognition"
            iconColor="#7B2FBE"
            title="Face Biometric"
            subtitle={user?.faceImageUrl ? 'Registered — tap to update' : 'Not registered — tap to add'}
            onPress={() => router.push('/auth/face-verify')}
          />
        </View>

        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>LANGUAGE</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map(lang => (
              <Pressable
                key={lang.code}
                onPress={() => { setLanguage(lang.code); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[styles.langOption, {
                  backgroundColor: language === lang.code ? C.tint + '18' : C.surfaceSecondary,
                  borderColor: language === lang.code ? C.tint : C.border
                }]}
                accessibilityLabel={`Select ${lang.name}`}
                accessibilityRole="radio"
              >
                <Text style={[styles.langName, { color: C.text, fontFamily: language === lang.code ? 'Rubik_700Bold' : 'Rubik_400Regular' }]}>
                  {lang.nativeName}
                </Text>
                <Text style={[styles.langCode, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>{lang.name}</Text>
                {language === lang.code && <MaterialCommunityIcons name="check-circle" size={16} color={C.tint} />}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>APPEARANCE</Text>
          {themeOptions.map((opt) => {
            const active = mode === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => {
                  setMode(opt.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.row,
                  {
                    borderBottomColor: C.border,
                    backgroundColor: active ? C.surfaceSecondary : C.surface,
                  },
                ]}
                accessibilityLabel={opt.title}
                accessibilityRole="button"
              >
                <View style={[styles.rowIcon, { backgroundColor: active ? C.tint + '20' : C.surfaceSecondary }]}>
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={20}
                    color={active ? C.tint : C.textSecondary}
                  />
                </View>
                <View style={styles.rowContent}>
                  <Text
                    style={[
                      styles.rowTitle,
                      {
                        color: C.text,
                        fontFamily: active ? 'Rubik_600SemiBold' : 'Rubik_400Regular',
                      },
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text
                    style={[
                      styles.rowSub,
                      { color: C.textSecondary, fontFamily: 'Rubik_400Regular' },
                    ]}
                  >
                    {opt.subtitle}
                  </Text>
                </View>
                {active && <MaterialCommunityIcons name="check-circle" size={18} color={C.tint} />}
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>DATA & PRIVACY</Text>
          <SettingRow
            icon="shield-lock"
            iconColor="#30D158"
            title="Privacy & Data Protection"
            subtitle="Ghana Data Protection Act (Act 843)"
            onPress={() => setShowPrivacy(true)}
          />
          <SettingRow
            icon="shield-lock"
            iconColor="#E8001C"
            title={lockEnabled ? 'App Lock (enabled)' : 'App Lock'}
            subtitle={lockEnabled ? 'Require PIN when reopening the app' : 'Set a 4-digit PIN to protect reports'}
            onPress={() => setShowAppLock(true)}
          />
          <SettingRow
            icon="database-remove"
            iconColor="#FF4500"
            title="Clear Incident History"
            subtitle={`${incidents.length} ${incidents.length === 1 ? 'report' : 'reports'} stored`}
            onPress={handleClearHistory}
          />
        </View>

        <View style={[styles.section, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>ABOUT</Text>
          <SettingRow
            icon="information"
            iconColor="#007AFF"
            title="About E-GHANA"
            subtitle="Ghana's Emergency Response System"
            onPress={() => setShowAbout(true)}
          />
          <SettingRow
            icon="shield-star"
            iconColor="#FFD100"
            title="Compliance"
            subtitle="GDPA Act 843 · NIA · NECC Certified"
          />
        </View>

        <SettingRow
          icon="logout"
          iconColor="#E8001C"
          title="Sign Out"
          subtitle="Sign out of your account"
          onPress={handleLogout}
          danger
        />

        <View style={[styles.versionCard, { borderColor: C.border }]}>
          <View style={styles.versionRow}>
            <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.versionLogo}>
              <MaterialCommunityIcons name="shield-alert" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <Text style={[styles.versionApp, { color: C.text, fontFamily: 'Rubik_900Black' }]}>E-GHANA</Text>
              <Text style={[styles.versionNum, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>v1.0.0 · Emergency Response System</Text>
            </View>
          </View>
          <View style={styles.ghanaStripe}>
            <View style={[styles.stripe, { backgroundColor: '#006B3F' }]} />
            <View style={[styles.stripe, { backgroundColor: '#FFD100' }]} />
            <View style={[styles.stripe, { backgroundColor: '#E8001C' }]} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 28, letterSpacing: -0.5 },
  content: { padding: 20, gap: 16 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 62,
    height: 62,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17 },
  profilePhone: { fontSize: 13, marginTop: 2 },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  profileBadgeText: { fontSize: 11 },
  section: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, letterSpacing: 1, paddingHorizontal: 16, paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15 },
  rowSub: { fontSize: 12, marginTop: 2 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 12 },
  langOption: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  langName: { fontSize: 14, flex: 1 },
  langCode: { fontSize: 11 },
  versionCard: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  versionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  versionLogo: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  versionApp: { fontSize: 18 },
  versionNum: { fontSize: 12, marginTop: 2 },
  ghanaStripe: { flexDirection: 'row', height: 4 },
  stripe: { flex: 1 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalClose: { padding: 4 },
  modalTitle: { fontSize: 17 },
  modalContent: { padding: 24, gap: 16 },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
  },
  privacyBadgeText: { fontSize: 14, flex: 1 },
  privacySection: { paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  privacySectionTitle: { fontSize: 16 },
  privacySectionText: { fontSize: 13, lineHeight: 20 },
  aboutLogoSection: { alignItems: 'center', gap: 8, marginBottom: 8 },
  aboutLogo: { width: 84, height: 84, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  aboutAppName: { fontSize: 32, letterSpacing: -0.5 },
  aboutVersion: { fontSize: 13 },
  flagRow: { flexDirection: 'row', width: 60, height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
  flagBand: { flex: 1 },
  aboutCard: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  aboutCardTitle: { fontSize: 16 },
  aboutCardText: { fontSize: 13, lineHeight: 20 },
  agencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  agencyName: { flex: 1, fontSize: 14 },
  agencyNumber: { fontSize: 18 },
  complianceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  complianceText: { fontSize: 13, flex: 1 },
  identityCard: {
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  identityAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityName: { fontSize: 22 },
  identitySub: { fontSize: 13, textAlign: 'center' as const },
  lockInput: { fontSize: 16, paddingVertical: 8, minWidth: 80 },
  lockError: { fontSize: 13, marginTop: 4 },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verificationBadgeText: { fontSize: 12 },
  identityField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  identityFieldIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  identityFieldContent: { flex: 1 },
  identityFieldLabel: { fontSize: 11 },
  identityFieldValue: { fontSize: 14, marginTop: 2 },
  updateFaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  updateFaceText: { flex: 1, fontSize: 15, color: '#7B2FBE' },
});
