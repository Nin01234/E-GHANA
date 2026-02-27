import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

type Phase = 'guide' | 'capturing' | 'processing' | 'success' | 'failed';

export default function FaceVerifyScreen() {
  const isDark = true;
  const C = Colors.dark;
  const insets = useSafeAreaInsets();
  const { verifyFace, user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>('guide');
  const [confidence, setConfidence] = useState(0);
  const [message, setMessage] = useState('');

  const scanLine = useSharedValue(0);
  const faceGlow = useSharedValue(0.4);

  useEffect(() => {
    if (phase === 'capturing') {
      scanLine.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1, true
      );
      faceGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.4, { duration: 800 }),
        ),
        -1, true
      );
    }
  }, [phase]);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLine.value * 200 }],
    opacity: 0.8,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: faceGlow.value,
  }));

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setPhase('capturing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await new Promise(r => setTimeout(r, 2500));
    setPhase('processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
      const result = await verifyFace(photo.uri);
      setConfidence(result.confidence);
      setMessage(result.message);

      if (result.verified) {
        setPhase('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setPhase('failed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e: any) {
      setMessage(e.message || 'Verification failed. Please try again.');
      setPhase('failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: '#000000' }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back" accessibilityRole="button">
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.headerTitle, { fontFamily: 'Rubik_700Bold' }]}>Face Verification</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.permissionContent}>
          <MaterialCommunityIcons name="camera-off" size={64} color="rgba(255,255,255,0.4)" />
          <Text style={[styles.permTitle, { fontFamily: 'Rubik_700Bold' }]}>Camera Access Required</Text>
          <Text style={[styles.permSub, { fontFamily: 'Rubik_400Regular' }]}>
            Camera access is needed to verify your identity via face recognition.
          </Text>
          <Pressable onPress={requestPermission} style={styles.permBtn} accessibilityLabel="Grant camera permission" accessibilityRole="button">
            <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.permGradient}>
              <Text style={[styles.permBtnText, { fontFamily: 'Rubik_700Bold' }]}>Grant Permission</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      {(phase === 'guide' || phase === 'capturing' || phase === 'processing') && (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="front"
        />
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.75)', 'transparent', 'transparent', 'rgba(0,0,0,0.85)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back" accessibilityRole="button">
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: 'Rubik_700Bold' }]}>Face Verification</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.centerArea}>
        {(phase === 'success' || phase === 'failed') ? (
          <View style={styles.resultArea}>
            <View style={[styles.resultIcon, { backgroundColor: phase === 'success' ? '#30D15820' : '#E8001C20' }]}>
              <MaterialCommunityIcons
                name={phase === 'success' ? 'face-recognition' : 'face-man-shimmer-outline'}
                size={72}
                color={phase === 'success' ? '#30D158' : '#E8001C'}
              />
            </View>
            <Text style={[styles.resultTitle, { fontFamily: 'Rubik_900Black', color: phase === 'success' ? '#30D158' : '#E8001C' }]}>
              {phase === 'success' ? 'Verified!' : 'Not Recognized'}
            </Text>
            {confidence > 0 && (
              <View style={[styles.confidenceBadge, { backgroundColor: phase === 'success' ? '#30D15825' : '#E8001C25' }]}>
                <Text style={[styles.confidenceText, { color: phase === 'success' ? '#30D158' : '#E8001C', fontFamily: 'Rubik_700Bold' }]}>
                  {confidence}% Match
                </Text>
              </View>
            )}
            <Text style={[styles.resultMessage, { fontFamily: 'Rubik_400Regular' }]}>{message}</Text>
          </View>
        ) : (
          <View style={styles.faceOvalArea}>
            <Animated.View style={[styles.faceOvalGlow, glowStyle]}>
              <View style={[styles.faceOval, {
                borderColor: phase === 'capturing' ? '#30D158' : phase === 'processing' ? '#FF9F0A' : 'rgba(255,255,255,0.7)',
              }]} />
            </Animated.View>
            {phase === 'capturing' && (
              <Animated.View style={[styles.scanLine, scanStyle]} />
            )}
            {phase === 'processing' && (
              <Text style={[styles.processingText, { fontFamily: 'Rubik_600SemiBold' }]}>Analyzing...</Text>
            )}
          </View>
        )}
      </View>

      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 24 }]}>
        {phase === 'guide' && (
          <>
            <Text style={[styles.guideText, { fontFamily: 'Rubik_500Medium' }]}>
              Position your face within the oval. Ensure good lighting.
            </Text>
            <Pressable onPress={handleCapture} style={styles.captureBtn} accessibilityLabel="Start face verification" accessibilityRole="button">
              <LinearGradient colors={['#7B2FBE', '#A855F7']} style={styles.captureGradient}>
                <MaterialCommunityIcons name="face-recognition" size={24} color="#FFFFFF" />
                <Text style={[styles.captureText, { fontFamily: 'Rubik_700Bold' }]}>Verify Face</Text>
              </LinearGradient>
            </Pressable>
          </>
        )}
        {phase === 'capturing' && (
          <Text style={[styles.statusText, { fontFamily: 'Rubik_500Medium', color: '#30D158' }]}>
            Hold still — scanning your face...
          </Text>
        )}
        {phase === 'processing' && (
          <Text style={[styles.statusText, { fontFamily: 'Rubik_500Medium', color: '#FF9F0A' }]}>
            Processing face data...
          </Text>
        )}
        {phase === 'success' && (
          <Pressable onPress={() => router.back()} style={styles.captureBtn} accessibilityLabel="Done" accessibilityRole="button">
            <LinearGradient colors={['#006B3F', '#30D158']} style={styles.captureGradient}>
              <MaterialCommunityIcons name="check" size={24} color="#FFFFFF" />
              <Text style={[styles.captureText, { fontFamily: 'Rubik_700Bold' }]}>Done</Text>
            </LinearGradient>
          </Pressable>
        )}
        {phase === 'failed' && (
          <View style={styles.failedActions}>
            <Pressable onPress={() => setPhase('guide')} style={styles.retryBtn} accessibilityLabel="Try again" accessibilityRole="button">
              <LinearGradient colors={['#CC0000', '#E8001C']} style={styles.captureGradient}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={[styles.captureText, { fontFamily: 'Rubik_700Bold' }]}>Try Again</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.cancelVerify} accessibilityLabel="Cancel" accessibilityRole="button">
              <Text style={[styles.cancelVerifyText, { fontFamily: 'Rubik_500Medium' }]}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 16, letterSpacing: 0.5 },
  permissionContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permTitle: { color: '#FFFFFF', fontSize: 22, textAlign: 'center' },
  permSub: { color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  permBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8 },
  permGradient: { paddingHorizontal: 32, paddingVertical: 16 },
  permBtnText: { color: '#FFFFFF', fontSize: 16 },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  faceOvalArea: {
    width: 220,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  faceOvalGlow: {
    position: 'absolute',
    width: 220,
    height: 280,
  },
  faceOval: {
    width: 220,
    height: 280,
    borderRadius: 110,
    borderWidth: 3,
    position: 'absolute',
  },
  scanLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#30D158',
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  processingText: {
    color: '#FF9F0A',
    fontSize: 16,
  },
  resultArea: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 32,
  },
  resultIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: { fontSize: 32 },
  confidenceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  confidenceText: { fontSize: 16 },
  resultMessage: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomArea: {
    paddingHorizontal: 24,
    gap: 14,
    zIndex: 10,
    alignItems: 'center',
  },
  guideText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  captureBtn: { alignSelf: 'stretch', borderRadius: 16, overflow: 'hidden' },
  retryBtn: { borderRadius: 16, overflow: 'hidden' },
  captureGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  captureText: { color: '#FFFFFF', fontSize: 17 },
  statusText: { fontSize: 15, textAlign: 'center' },
  failedActions: { alignSelf: 'stretch', gap: 12 },
  cancelVerify: { alignItems: 'center', paddingVertical: 12 },
  cancelVerifyText: { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
});
