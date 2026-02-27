import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  useColorScheme, Platform, ScrollView, Alert, KeyboardAvoidingView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuth, NationalIdType } from '@/contexts/AuthContext';
import { useEmergency } from '@/contexts/EmergencyContext';

const ID_TYPES: { value: NationalIdType; label: string; icon: string; placeholder: string }[] = [
  { value: 'ghana_card', label: 'Ghana Card (NIA)', icon: 'card-account-details', placeholder: 'GHA-XXXXXXXXX-X' },
  { value: 'nhis', label: 'NHIS Card', icon: 'hospital-box', placeholder: 'NHIS-XXXXXXXXX' },
  { value: 'driving_license', label: "Driving Licence", icon: 'car', placeholder: 'DRV-XXXXXXXXX' },
  { value: 'voter_id', label: "Voter's ID", icon: 'ballot', placeholder: 'VOT-XXXXXXXXX' },
  { value: 'passport', label: 'Passport', icon: 'passport', placeholder: 'GXXXXXXXXX' },
];

export default function RegisterScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const { loadIncidents } = useEmergency();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nationalIdType, setNationalIdType] = useState<NationalIdType>('ghana_card');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [nationalIdImageUri, setNationalIdImageUri] = useState<string | null>(null);
  const [faceImageUri, setFaceImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const goNext = () => {
    if (step === 1) {
      if (!fullName.trim()) return Alert.alert('Required', 'Please enter your full name.');
      if (!phone.trim() || phone.length < 10) return Alert.alert('Required', 'Please enter a valid phone number (min 10 digits).');
      if (!email.trim()) return Alert.alert('Required', 'Please enter your email address.');
      if (!password || password.length < 6) return Alert.alert('Required', 'Password must be at least 6 characters.');
      if (password !== confirmPassword) return Alert.alert('Mismatch', 'Passwords do not match.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(2);
    } else if (step === 2) {
      if (!nationalIdNumber.trim()) return Alert.alert('Required', 'Please enter your National ID number.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(3);
    }
  };

  const pickIdImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed to upload your ID.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (!result.canceled) setNationalIdImageUri(result.assets[0].uri);
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take your selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) setFaceImageUri(result.assets[0].uri);
  };

  const handleRegister = async () => {
    if (!faceImageUri) {
      Alert.alert('Face Required', 'Please take a selfie for identity verification. This is required for security.');
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      await register(
        { fullName, phone, email, password, nationalIdType, nationalIdNumber },
        nationalIdImageUri || undefined,
        faceImageUri,
      );
      await loadIncidents();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Registration Failed', e.message || 'Could not create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedIdType = ID_TYPES.find(t => t.value === nationalIdType)!;
  const progress = step / 3;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.background, borderBottomColor: C.border }]}>
        <Pressable onPress={() => step > 1 ? setStep((step - 1) as 1 | 2 | 3) : router.back()} style={styles.backBtn} accessibilityLabel="Back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Create Account</Text>
          <Text style={[styles.headerStep, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>Step {step} of 3</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.progressBar, { backgroundColor: C.border }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: C.emergency }]} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={[styles.stepIcon, { backgroundColor: C.emergency + '18' }]}>
              <MaterialCommunityIcons name="account" size={32} color={C.emergency} />
            </View>
            <Text style={[styles.stepTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Personal Details</Text>
            <Text style={[styles.stepSub, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
              Enter your name, contact info, and set a secure password.
            </Text>

            {[
              { label: 'FULL NAME', value: fullName, setter: setFullName, icon: 'account', placeholder: 'e.g. Kwame Asante', type: 'default' as const },
              { label: 'PHONE NUMBER', value: phone, setter: setPhone, icon: 'phone', placeholder: '0XX XXX XXXX', type: 'phone-pad' as const },
              { label: 'EMAIL', value: email, setter: setEmail, icon: 'email', placeholder: 'you@example.com', type: 'email-address' as const },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>{field.label}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: C.surface, borderColor: field.value ? C.tint : C.border }]}>
                  <MaterialCommunityIcons name={field.icon as any} size={18} color={field.value ? C.tint : C.textTertiary} />
                  <TextInput
                    value={field.value}
                    onChangeText={field.setter}
                    placeholder={field.placeholder}
                    placeholderTextColor={C.textTertiary}
                    keyboardType={field.type}
                    style={[styles.input, { color: C.text, fontFamily: 'Rubik_400Regular' }]}
                  />
                </View>
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>PASSWORD</Text>
              <View style={[styles.inputWrapper, { backgroundColor: C.surface, borderColor: password ? C.tint : C.border }]}>
                <MaterialCommunityIcons name="lock" size={18} color={password ? C.tint : C.textTertiary} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor={C.textTertiary}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { color: C.text, fontFamily: 'Rubik_400Regular', flex: 1 }]}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} accessibilityLabel="Toggle password" accessibilityRole="button">
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={C.textTertiary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>CONFIRM PASSWORD</Text>
              <View style={[styles.inputWrapper, {
                backgroundColor: C.surface,
                borderColor: confirmPassword ? (confirmPassword === password ? C.success : C.danger) : C.border
              }]}>
                <MaterialCommunityIcons name="lock-check" size={18} color={confirmPassword ? (confirmPassword === password ? C.success : C.danger) : C.textTertiary} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={C.textTertiary}
                  secureTextEntry={!showPassword}
                  style={[styles.input, { color: C.text, fontFamily: 'Rubik_400Regular' }]}
                />
              </View>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <View style={[styles.stepIcon, { backgroundColor: C.gold + '30' }]}>
              <MaterialCommunityIcons name="card-account-details" size={32} color={C.gold} />
            </View>
            <Text style={[styles.stepTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>National ID Verification</Text>
            <Text style={[styles.stepSub, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
              Select your ID type and enter your ID number. This is required by Ghana law for emergency reporting.
            </Text>

            <Text style={[styles.inputLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold', marginBottom: 8 }]}>ID TYPE</Text>
            {ID_TYPES.map((idType) => (
              <Pressable
                key={idType.value}
                onPress={() => { setNationalIdType(idType.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  styles.idTypeCard,
                  {
                    backgroundColor: nationalIdType === idType.value ? C.emergency + '15' : C.surface,
                    borderColor: nationalIdType === idType.value ? C.emergency : C.border
                  }
                ]}
                accessibilityLabel={`Select ${idType.label}`}
                accessibilityRole="radio"
              >
                <MaterialCommunityIcons name={idType.icon as any} size={22} color={nationalIdType === idType.value ? C.emergency : C.textSecondary} />
                <Text style={[styles.idTypeLabel, { color: nationalIdType === idType.value ? C.emergency : C.text, fontFamily: nationalIdType === idType.value ? 'Rubik_600SemiBold' : 'Rubik_400Regular' }]}>
                  {idType.label}
                </Text>
                {nationalIdType === idType.value && <MaterialCommunityIcons name="check-circle" size={18} color={C.emergency} />}
              </Pressable>
            ))}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>ID NUMBER</Text>
              <View style={[styles.inputWrapper, { backgroundColor: C.surface, borderColor: nationalIdNumber ? C.tint : C.border }]}>
                <MaterialCommunityIcons name="identifier" size={18} color={nationalIdNumber ? C.tint : C.textTertiary} />
                <TextInput
                  value={nationalIdNumber}
                  onChangeText={setNationalIdNumber}
                  placeholder={selectedIdType.placeholder}
                  placeholderTextColor={C.textTertiary}
                  autoCapitalize="characters"
                  style={[styles.input, { color: C.text, fontFamily: 'Rubik_400Regular' }]}
                  accessibilityLabel="ID number"
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold', marginBottom: 8, marginTop: 8 }]}>UPLOAD ID PHOTO (OPTIONAL)</Text>
            <Pressable
              onPress={pickIdImage}
              style={[styles.uploadCard, { backgroundColor: C.surface, borderColor: nationalIdImageUri ? C.success : C.border }]}
              accessibilityLabel="Upload ID photo"
              accessibilityRole="button"
            >
              {nationalIdImageUri ? (
                <Image source={{ uri: nationalIdImageUri }} style={styles.idPhoto} />
              ) : (
                <>
                  <MaterialCommunityIcons name="image-plus" size={32} color={C.textTertiary} />
                  <Text style={[styles.uploadText, { color: C.textSecondary, fontFamily: 'Rubik_500Medium' }]}>Tap to upload ID photo</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={[styles.stepIcon, { backgroundColor: '#7B2FBE20' }]}>
              <MaterialCommunityIcons name="face-recognition" size={32} color="#7B2FBE" />
            </View>
            <Text style={[styles.stepTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Face Verification</Text>
            <Text style={[styles.stepSub, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
              Take a clear selfie to verify your identity. This prevents prank alerts and helps responders verify reports.
              Your face data is encrypted and stored securely.
            </Text>

            <View style={styles.selfieArea}>
              {faceImageUri ? (
                <View style={styles.selfiePreview}>
                  <Image source={{ uri: faceImageUri }} style={styles.selfieImage} />
                  <View style={[styles.selfieCheck, { backgroundColor: C.success }]}>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </View>
                </View>
              ) : (
                <View style={[styles.selfiePlaceholder, { backgroundColor: C.surfaceSecondary, borderColor: C.border }]}>
                  <MaterialCommunityIcons name="face-man" size={72} color={C.textTertiary} />
                  <Text style={[styles.selfieHint, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
                    No photo taken yet
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.selfieActions}>
              <Pressable
                onPress={takeSelfie}
                style={[styles.selfieBtn, { backgroundColor: '#7B2FBE20', borderColor: '#7B2FBE40' }]}
                accessibilityLabel="Take selfie"
                accessibilityRole="button"
              >
                <MaterialCommunityIcons name="camera-account" size={22} color="#7B2FBE" />
                <Text style={[styles.selfieBtnText, { color: '#7B2FBE', fontFamily: 'Rubik_600SemiBold' }]}>
                  {faceImageUri ? 'Retake Selfie' : 'Take Selfie'}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.faceInfoBox, { backgroundColor: C.surface, borderColor: C.border }]}>
              <MaterialCommunityIcons name="shield-lock" size={16} color={C.success} />
              <Text style={[styles.faceInfoText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
                Your biometric data is protected under Ghana&apos;s Data Protection Act (Act 843). It is used solely for identity verification and anti-prank detection.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actions}>
          {step < 3 ? (
            <Pressable
              onPress={goNext}
              style={styles.nextBtn}
              accessibilityLabel="Continue"
              accessibilityRole="button"
            >
              <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.nextGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[styles.nextText, { fontFamily: 'Rubik_700Bold' }]}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleRegister}
              disabled={isLoading}
              style={[styles.nextBtn, { opacity: isLoading ? 0.75 : 1 }]}
              accessibilityLabel="Create account"
              accessibilityRole="button"
            >
              <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.nextGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
                <Text style={[styles.nextText, { fontFamily: 'Rubik_700Bold' }]}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          <Pressable onPress={() => router.back()} style={styles.loginLink} accessibilityLabel="Go to login" accessibilityRole="button">
            <Text style={[styles.loginLinkText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
              Already have an account?{' '}
              <Text style={{ color: C.emergency, fontFamily: 'Rubik_600SemiBold' }}>Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17 },
  headerStep: { fontSize: 12, marginTop: 2 },
  progressBar: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: 3,
    borderRadius: 1.5,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 0,
  },
  stepContent: { gap: 14, marginBottom: 24 },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepTitle: { fontSize: 24 },
  stepSub: { fontSize: 14, lineHeight: 20 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 11, letterSpacing: 1 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  idTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  idTypeLabel: { flex: 1, fontSize: 14 },
  uploadCard: {
    height: 120,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8,
  },
  idPhoto: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadText: { fontSize: 14 },
  selfieArea: { alignItems: 'center', marginVertical: 8 },
  selfiePreview: {
    position: 'relative',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'visible',
  },
  selfieImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  selfieCheck: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfiePlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  selfieHint: { fontSize: 12 },
  selfieActions: { gap: 10 },
  selfieBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  selfieBtnText: { fontSize: 15 },
  faceInfoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  faceInfoText: { fontSize: 12, flex: 1, lineHeight: 18 },
  actions: { gap: 16, marginTop: 8 },
  nextBtn: { borderRadius: 16, overflow: 'hidden' },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  nextText: { color: '#FFFFFF', fontSize: 17 },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontSize: 14 },
});
