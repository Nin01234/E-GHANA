import React, { useState } from "react";
import { reloadAppAsync } from "expo";
import {
  StyleSheet,
  View,
  Pressable,
  ScrollView,
  Text,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

export type ErrorFallbackProps = {
  error: Error;
  resetError: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const { isDark, colors: C } = useTheme();
  const insets = useSafeAreaInsets();

  const theme = {
    background: C.background,
    backgroundSecondary: C.surfaceSecondary,
    surface: C.surface,
    text: C.text,
    textSecondary: C.textSecondary,
    border: C.border,
    link: C.tint,
    buttonText: "#FFFFFF",
    shadow: C.shadow ?? (isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.12)"),
  };

  const [isModalVisible, setIsModalVisible] = useState(false);
  const devBtnScale = useSharedValue(1);
  const mainBtnScale = useSharedValue(1);
  const closeBtnScale = useSharedValue(1);

  const devBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: devBtnScale.value }],
  }));

  const mainBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mainBtnScale.value }],
  }));

  const closeBtnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeBtnScale.value }],
  }));

  const handleRestart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await reloadAppAsync();
    } catch (restartError) {
      console.error("Failed to restart app:", restartError);
      resetError();
    }
  };

  const openDevModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsModalVisible(true);
  };

  const closeDevModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsModalVisible(false);
  };

  const formatErrorDetails = (): string => {
    let details = `Error: ${error.message}\n\n`;
    if (error.stack) {
      details += `Stack Trace:\n${error.stack}`;
    }
    return details;
  };

  const monoFont = Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {__DEV__ ? (
        <AnimatedPressable
          onPressIn={() => {
            devBtnScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            devBtnScale.value = withSpring(1);
          }}
          onPress={openDevModal}
          accessibilityLabel="View error details"
          accessibilityRole="button"
          style={[
            styles.topButton,
            devBtnAnimatedStyle,
            {
              top: insets.top + 16,
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
              borderWidth: 1,
              shadowColor: theme.text,
              shadowOpacity: isDark ? 0.2 : 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            },
          ]}
        >
          <Feather name="alert-circle" size={20} color={theme.text} />
          <Text
            style={[
              styles.devButtonLabel,
              { color: theme.textSecondary },
            ]}
            numberOfLines={1}
          >
            Dev
          </Text>
        </AnimatedPressable>
      ) : null}

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>
          Something went wrong
        </Text>

        <Text style={[styles.message, { color: theme.textSecondary }]}>
          Please reload the app to continue.
        </Text>

        <Animated.View style={mainBtnAnimatedStyle}>
          <Pressable
            onPressIn={() => {
              mainBtnScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              mainBtnScale.value = withSpring(1);
            }}
            onPress={handleRestart}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.link,
                opacity: pressed ? 0.9 : 1,
                borderColor: theme.link,
                shadowColor: theme.link,
                shadowOpacity: 0.35,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>
              Try Again
            </Text>
          </Pressable>
        </Animated.View>
      </View>

      {__DEV__ ? (
        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeDevModal}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.shadow }]}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: theme.background },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: theme.border },
                ]}
              >
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Error Details
                </Text>
                <AnimatedPressable
                  onPressIn={() => {
                    closeBtnScale.value = withSpring(0.9);
                  }}
                  onPressOut={() => {
                    closeBtnScale.value = withSpring(1);
                  }}
                  onPress={closeDevModal}
                  accessibilityLabel="Close error details"
                  accessibilityRole="button"
                  style={[styles.closeButton, closeBtnAnimatedStyle]}
                >
                  <Feather name="x" size={24} color={theme.text} />
                </AnimatedPressable>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={[
                  styles.modalScrollContent,
                  { paddingBottom: insets.bottom + 16 },
                ]}
                showsVerticalScrollIndicator
              >
                <View
                  style={[
                    styles.errorContainer,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.errorText,
                      {
                        color: theme.text,
                        fontFamily: monoFont,
                      },
                    ]}
                    selectable
                  >
                    {formatErrorDetails()}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    width: "100%",
    maxWidth: 600,
  },
  title: {
    fontSize: 28,
    fontFamily: "Rubik_700Bold",
    textAlign: "center",
    lineHeight: 40,
  },
  message: {
    fontSize: 16,
    fontFamily: "Rubik_400Regular",
    textAlign: "center",
    lineHeight: 24,
  },
  topButton: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    zIndex: 10,
  },
  devButtonLabel: {
    fontSize: 13,
    fontFamily: "Rubik_600SemiBold",
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    paddingHorizontal: 28,
    minWidth: 200,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonText: {
    fontFamily: "Rubik_700Bold",
    textAlign: "center",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
    height: "90%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Rubik_700Bold",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
  },
  errorContainer: {
    width: "100%",
    borderRadius: 8,
    overflow: "hidden",
    padding: 16,
  },
  errorText: {
    fontSize: 12,
    lineHeight: 18,
    width: "100%",
  },
});
