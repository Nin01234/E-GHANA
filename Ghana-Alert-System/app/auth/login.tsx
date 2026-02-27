import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  useColorScheme, Platform, ScrollView, Alert, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useEmergency } from '@/contexts/EmergencyContext';

export default function LoginScreen() {
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { login, loginAsGuest } = useAuth();
  const { loadIncidents } = useEmergency();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    btnScale.value = withSpring(0.96);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await login(email.trim(), password);
      await loadIncidents();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login Failed', e.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
      btnScale.value = withSpring(1);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.logoBox} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <MaterialCommunityIcons name="shield-alert" size={44} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.appName, { color: C.emergency, fontFamily: 'Rubik_900Black' }]}>E-GHANA</Text>
          <Text style={[styles.tagline, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
            Emergency Response System
          </Text>

          <View style={styles.flagRow}>
            <View style={[styles.flagStripe, { backgroundColor: '#006B3F' }]} />
            <View style={[styles.flagStripe, { backgroundColor: '#FFD100' }]} />
            <View style={[styles.flagStripe, { backgroundColor: '#E8001C' }]} />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={[styles.welcomeTitle, { color: C.text, fontFamily: 'Rubik_700Bold' }]}>Welcome Back</Text>
          <Text style={[styles.welcomeSub, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
            Sign in with your registered email address
          </Text>

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
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotRow}
            accessibilityLabel="Forgot password"
            accessibilityRole="button"
          >
            <Text style={[styles.forgotText, { color: C.emergency, fontFamily: 'Rubik_500Medium' }]}>
              Forgot password?
            </Text>
          </Pressable>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: C.textSecondary, fontFamily: 'Rubik_600SemiBold' }]}>PASSWORD</Text>
            <View style={[styles.inputWrapper, { backgroundColor: C.surface, borderColor: password ? C.tint : C.border }]}>
              <MaterialCommunityIcons name="lock" size={20} color={password ? C.tint : C.textTertiary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={C.textTertiary}
                secureTextEntry={!showPassword}
                style={[styles.input, { color: C.text, fontFamily: 'Rubik_400Regular', flex: 1 }]}
                accessibilityLabel="Password"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} accessibilityLabel="Toggle password" accessibilityRole="button">
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={C.textTertiary} />
              </Pressable>
            </View>
          </View>

          <Animated.View style={btnStyle}>
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={[styles.loginBtn, { opacity: isLoading ? 0.75 : 1 }]}
              accessibilityLabel="Sign in"
              accessibilityRole="button"
            >
              <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.loginGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isLoading ? (
                  <Text style={[styles.loginText, { fontFamily: 'Rubik_700Bold' }]}>Signing In...</Text>
                ) : (
                  <>
                    <MaterialCommunityIcons name="shield-check" size={22} color="#FFFFFF" />
                    <Text style={[styles.loginText, { fontFamily: 'Rubik_700Bold' }]}>Sign In</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: C.border }]} />
            <Text style={[styles.dividerText, { color: C.textTertiary, fontFamily: 'Rubik_400Regular' }]}>OR</Text>
            <View style={[styles.divider, { backgroundColor: C.border }]} />
          </View>

          <Pressable
            onPress={() => router.push('/auth/register')}
            style={[styles.registerBtn, { borderColor: C.border, backgroundColor: C.surface }]}
            accessibilityLabel="Create account"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="account-plus" size={20} color={C.text} />
            <Text style={[styles.registerText, { color: C.text, fontFamily: 'Rubik_600SemiBold' }]}>
              Create New Account
            </Text>
          </Pressable>

          <Pressable
            onPress={async () => {
              await loginAsGuest();
            }}
            style={[styles.guestBtn, { borderColor: C.border }]}
            accessibilityLabel="Continue as guest"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="eye-off-outline" size={18} color={C.textSecondary} />
            <Text style={[styles.guestText, { color: C.textSecondary, fontFamily: 'Rubik_500Medium' }]}>
              Continue without signing in
            </Text>
          </Pressable>
        </View>

        <View style={[styles.legalBox, { borderColor: C.border, backgroundColor: C.surface }]}>
          <MaterialCommunityIcons name="shield-lock" size={14} color={C.success} />
          <Text style={[styles.legalText, { color: C.textSecondary, fontFamily: 'Rubik_400Regular' }]}>
            Protected under Ghana Data Protection Act (Act 843). Your data is encrypted and secure.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 0,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 36,
    gap: 8,
  },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#E8001C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 16,
  },
  appName: {
    fontSize: 36,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
  },
  flagRow: {
    flexDirection: 'row',
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  flagStripe: { flex: 1 },
  formSection: { gap: 16 },
  welcomeTitle: { fontSize: 26 },
  welcomeSub: { fontSize: 14, marginBottom: 4 },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 11,
    letterSpacing: 1,
  },
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
  loginBtn: { borderRadius: 16, overflow: 'hidden' },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loginText: { color: '#FFFFFF', fontSize: 17 },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 13,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  registerText: { fontSize: 16 },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  guestText: {
    fontSize: 13,
  },
  legalBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 24,
  },
  legalText: { fontSize: 11, flex: 1, lineHeight: 16 },
});
