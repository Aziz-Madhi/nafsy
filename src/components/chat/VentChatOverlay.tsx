/**
 * Vent Chat Overlay Component
 * Private mode overlay that mirrors the main chat layout
 * with a dark theme, header text only (no icons), and the
 * same bottom text input experience.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Modal,
  ScrollView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, {
  Easing,
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';
// Reuse the main chat input design from the floating tab bar
import { FloatingChatInputStandalone } from '~/components/navigation/FloatingTabBar';
import { getChatStyles } from '~/lib/chatStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VentChatOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => Promise<void>;
  currentMessage: string | null;
  isLoading?: boolean;
}

// Simple message cross-fade centered on screen
const MessageDisplay = ({
  message,
  isUser,
  itemKey,
}: {
  message: string;
  isUser: boolean;
  itemKey?: string;
}) => (
  <Animated.View key={itemKey}>
    <View className="items-center justify-center px-8">
      <Text
        className={cn(
          'text-lg text-center font-medium',
          isUser ? 'text-white' : 'text-gray-200'
        )}
      >
        {message}
      </Text>
    </View>
  </Animated.View>
);

const SCREEN_HEIGHT = Dimensions.get('window').height;
const ENTER_DURATION = 360;
const EXIT_DURATION = 260;
const ENTER_TIMING = {
  duration: ENTER_DURATION,
  easing: Easing.out(Easing.cubic),
};
const ENTER_OPACITY_TIMING = {
  duration: 240,
  easing: Easing.out(Easing.cubic),
};
const EXIT_TIMING = {
  duration: EXIT_DURATION,
  easing: Easing.out(Easing.cubic),
};

export function VentChatOverlay({
  visible,
  onClose,
  onSendMessage,
  currentMessage,
  isLoading = false,
}: VentChatOverlayProps) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Use Event personality styling (for accent color only)
  const eventStyles = getChatStyles('event');

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const overlayTranslateY = useSharedValue(SCREEN_HEIGHT);

  // Manage modal visibility to allow exit animations
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      overlayTranslateY.value = SCREEN_HEIGHT;
      overlayOpacity.value = 0;
      overlayTranslateY.value = withTiming(0, ENTER_TIMING);
      overlayOpacity.value = withTiming(1, ENTER_OPACITY_TIMING);
    } else if (modalVisible) {
      overlayTranslateY.value = withTiming(
        SCREEN_HEIGHT,
        EXIT_TIMING,
        (finished) => {
          if (finished) {
            runOnJS(setModalVisible)(false);
          }
        }
      );
      overlayOpacity.value = withTiming(0, EXIT_TIMING);
    }
  }, [visible, modalVisible]);

  const handleClose = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    requestAnimationFrame(() => onClose());
  }, [onClose]);

  // Double tap anywhere to close
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onStart(() => {
      overlayTranslateY.value = withTiming(SCREEN_HEIGHT, EXIT_TIMING);
      overlayOpacity.value = withTiming(0, EXIT_TIMING);
      runOnJS(handleClose)();
    });

  // Swipe down to close for discoverability
  const swipeDownGesture = Gesture.Pan()
    .activeOffsetY([20, 999])
    .onUpdate((event) => {
      if (event.translationY > 0) {
        overlayTranslateY.value = Math.min(event.translationY, SCREEN_HEIGHT);
      }
    })
    .onEnd((event) => {
      const shouldClose =
        event.translationY > SCREEN_HEIGHT * 0.25 || event.velocityY > 900;

      if (shouldClose) {
        overlayTranslateY.value = withTiming(SCREEN_HEIGHT, EXIT_TIMING);
        overlayOpacity.value = withTiming(0, EXIT_TIMING);
        runOnJS(handleClose)();
      } else {
        overlayTranslateY.value = withTiming(0, ENTER_TIMING);
      }
    });

  const combinedGesture = Gesture.Simultaneous(
    doubleTapGesture,
    swipeDownGesture
  );

  // Animated styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
    transform: [{ translateY: overlayTranslateY.value }],
  }));

  // Track keyboard visibility to adjust reserved space precisely
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = () => setKeyboardVisible(true);
    const onHide = () => setKeyboardVisible(false);
    const s = Keyboard.addListener(showEvent, onShow);
    const h = Keyboard.addListener(hideEvent, onHide);
    return () => {
      s.remove();
      h.remove();
    };
  }, []);

  // Always show the latest user message on top and the latest AI response below
  const [lastUserText, setLastUserText] = useState<string | null>(null);
  const [lastAIText, setLastAIText] = useState<string | null>(null);
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    if (!currentMessage || currentMessage === lastHandled.current) return;
    lastHandled.current = currentMessage;
    const isUser = currentMessage.startsWith('user:');
    const text = currentMessage.replace(/^(user:|ai:)/, '').trim();
    if (isUser) {
      // New user input: show it on top and clear previous AI until response arrives
      setLastUserText(text);
      setLastAIText(null);
    } else {
      // AI response updates (may stream); keep latest
      setLastAIText(text);
    }
  }, [currentMessage]);

  // Reserve space for the input only when keyboard is hidden; keep small when visible
  const BASE_RESERVED_BOTTOM = 152; // when keyboard hidden
  const safeAreaBottom = Math.max(insets.bottom, 16);
  const reservedBottom = keyboardVisible ? Math.max(safeAreaBottom, 8) : BASE_RESERVED_BOTTOM + safeAreaBottom;

  // Match the top spacing created by ChatHeader (pt-16 + pb-4 ≈ 80px)
  // while ensuring content stays clear of translucent status bars.
  const BASE_HEADER_TOP_SPACE = 80;
  const headerTopSpace = BASE_HEADER_TOP_SPACE + Math.max(insets.top, 0);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <GestureDetector gesture={combinedGesture}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'height' : 'height'}
          keyboardVerticalOffset={0}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={[
              overlayAnimatedStyle,
              {
                borderRadius: 28,
                overflow: 'hidden',
              },
            ]}
            className="flex-1 bg-black"
          >
          {/* Center content: show intro text until user starts chatting */}
          <View style={{ flex: 1 }}>
            {!lastUserText && !lastAIText && !isLoading ? (
              <View style={{ flex: 1, paddingBottom: reservedBottom }}>
                <View
                  className="flex-1 items-center justify-center px-8"
                  style={{ paddingTop: headerTopSpace }}
                >
                  <Text
                    variant="title3"
                    className="font-bold text-center text-white"
                  >
                    {t('chat.vent.overlayTitle')}
                  </Text>
                  <Text
                    variant="subhead"
                    className="text-center text-gray-300 mt-2"
                    style={{ textAlign: 'center' }}
                  >
                    {t('chat.vent.overlaySubtitle')}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ paddingBottom: reservedBottom, flex: 1 }}>
                {/* Top half: user message pinned to the bottom of the top half */}
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                  }}
                >
                  {lastUserText && (
                    <Animated.View
                      key={`user-${lastUserText}`}
                      style={{ paddingHorizontal: 32 }}
                    >
                      <Text className="text-center text-white text-xl font-semibold">
                        {lastUserText}
                      </Text>
                    </Animated.View>
                  )}
                </View>

                {/* Divider centered in the available space */}
                <View className="items-center" style={{ paddingVertical: 12 }}>
                  {(lastUserText || lastAIText) && (
                    <Animated.View>
                      <View
                        style={{
                          backgroundColor: eventStyles.primaryColor + '55',
                        }}
                        className="h-[2px] w-16 rounded-full"
                      />
                    </Animated.View>
                  )}
                </View>

                {/* Bottom half: AI response area with independent vertical scroll */}
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingHorizontal: 32,
                    paddingBottom: 24,
                  }}
                  showsVerticalScrollIndicator
                  indicatorStyle="white"
                  keyboardShouldPersistTaps="handled"
                >
                  {lastAIText && (
                    <Animated.View key={`ai-${lastAIText}`}>
                      <Text className="text-center text-gray-200 text-lg">
                        {lastAIText}
                      </Text>
                    </Animated.View>
                  )}

                  {/* Loading indicator while waiting for AI; stays in the same slot */}
                  {isLoading && lastUserText && !lastAIText && (
                    <Animated.View
                      className="flex-row gap-2"
                      style={{ marginTop: 12 }}
                    >
                      <View
                        style={{
                          backgroundColor: eventStyles.primaryColor + '60',
                        }}
                        className="w-2 h-2 rounded-full"
                      />
                      <View
                        style={{
                          backgroundColor: eventStyles.primaryColor + '90',
                        }}
                        className="w-2 h-2 rounded-full"
                      />
                      <View
                        style={{
                          backgroundColor: eventStyles.primaryColor + '60',
                        }}
                        className="w-2 h-2 rounded-full"
                      />
                    </Animated.View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* (Legacy centered loaders removed in favor of structured layout above) */}

          {/* Bottom text input — reuse main chat's floating input (dark variant) */}
          <FloatingChatInputStandalone
            onSendMessage={onSendMessage}
            chatType="event"
            dark
          />
        </Animated.View>
        </KeyboardAvoidingView>
      </GestureDetector>
    </Modal>
  );
}
