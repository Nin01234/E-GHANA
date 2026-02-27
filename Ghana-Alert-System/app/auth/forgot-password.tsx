import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useColorScheme,
  Platform,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email.trim());
      Alert.alert(
        'Email Sent',
        'If this email is registered, a password reset link has been sent. Please check your inbox.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: C.background, borderBottomColor: C.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Forgot Password</Text>
          <Text style={[styles.headerSubtitle, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
            Enter your email to receive a reset link
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrapper}>
          <View style={[styles.iconCircle, { backgroundColor: C.emergency + '18' }]}>
            <MaterialCommunityIcons name="lock-reset" size={36} color={C.emergency} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>EMAIL</Text>
          <View style={[styles.inputWrapper, { backgroundColor: C.surface, borderColor: email ? C.tint : C.border }]}>
            <MaterialCommunityIcons name="email" size={20} color={email ? C.tint : C.textTertiary} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={C.textTertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={[styles.input, { color: C.text, fontFamily: 'Rubik_400Regular' }]}
              accessibilityLabel="Email address"
            />
          </View>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          style={[styles.submitBtn, { opacity: isLoading ? 0.75 : 1 }]}
          accessibilityLabel="Send reset email"
          accessibilityRole="button"
        >
          <LinearGradient
            colors={['#CC0000', '#E8001C']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="email-send-outline" size={20} color="#FFFFFF" />
            <Text style={[styles.submitText, { fontFamily: 'Rubik_700Bold' }]}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Text>
          </LinearGradient>
        </Pressable>
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
  headerTitle: { fontSize: 18 },
  headerSubtitle: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 18,
  },
  iconWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: { gap: 6, marginTop: 8 },
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
  submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 16 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  submitText: { color: '#FFFFFF', fontSize: 16 },
});

