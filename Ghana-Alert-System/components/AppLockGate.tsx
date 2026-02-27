import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, useColorScheme, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppLock } from '@/contexts/AppLockContext';
import { Colors } from '@/constants/colors';

export function AppLockGate({ children }: { children: React.ReactNode }) {
  const { isLocked, unlockWithPin } = useAppLock();
  const isDark = useColorScheme() === 'dark';
  const C = isDark ? Colors.dark : Colors.light;
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!pin || pin.length < 4) return;
    setSubmitting(true);
    setError(null);
    const ok = await unlockWithPin(pin);
    setSubmitting(false);
    if (!ok) {
      setError('Incorrect PIN. Try again.');
      setPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (!isLocked) return <>{children}</>;

  const behavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: C.background }]} behavior={behavior}>
      <View style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: C.surface }]}>
          <MaterialCommunityIcons name="shield-lock" size={32} color={C.emergency} />
        </View>
        <Text style={[styles.title, { color: C.text }]}>App locked</Text>
        <Text style={[styles.sub, { color: C.textSecondary }]}>
          Enter your 4-digit PIN to continue.
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
          style={[
            styles.input,
            {
              borderColor: error ? '#E8001C' : C.border,
              color: C.text,
              backgroundColor: C.surface,
            },
          ]}
          placeholder="••••"
          placeholderTextColor={C.textTertiary}
        />

        {error ? <Text style={[styles.error, { color: '#E8001C' }]}>{error}</Text> : null}

        <Pressable
          onPress={onSubmit}
          disabled={pin.length < 4 || submitting}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: C.emergency,
              opacity: pin.length < 4 || submitting ? 0.6 : pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Unlock app"
        >
          <Text style={[styles.buttonText, { fontFamily: 'Rubik_700Bold' }]}>{submitting ? 'Unlocking…' : 'Unlock'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    marginBottom: 4,
    fontFamily: 'Rubik_700Bold',
  },
  sub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    fontFamily: 'Rubik_400Regular',
  },
  input: {
    width: '60%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
    fontFamily: 'Rubik_700Bold',
    marginBottom: 8,
  },
  error: {
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Rubik_400Regular',
  },
  button: {
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});

