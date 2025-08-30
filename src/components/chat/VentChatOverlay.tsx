/**
 * Vent Chat Overlay Component
 * Private mode overlay that mirrors the main chat layout
 * with a dark theme, header text only (no icons), and the
 * same bottom text input experience.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Modal } from 'react-native';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, {
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

export function VentChatOverlay({
  visible,
  onClose,
  onSendMessage,
  currentMessage,
  isLoading = false,
}: VentChatOverlayProps) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);

  // Use Event personality styling (for accent color only)
  const eventStyles = getChatStyles('event');

  // Animation values
  const overlayOpacity = useSharedValue(0);

  // Manage modal visibility to allow exit animations
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      overlayOpacity.value = withTiming(1, { duration: 250 });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      const timer = setTimeout(() => setModalVisible(false), 240);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Double tap anywhere to close
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .runOnJS(true)
    .onStart(() => {
      impactAsync(ImpactFeedbackStyle.Light);
      onClose();
    });

  // Animated styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

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

  // Reserve space for the bottom input so center looks visually centered
  // Matches FloatingChatInputStandalone layout: height 88 + pb-16 (64) = 152
  const RESERVED_BOTTOM = 152;
  // Match the top spacing created by ChatHeader (pt-16 + pb-4 ≈ 80px)
  const HEADER_TOP_SPACE = 80;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <GestureDetector gesture={doubleTapGesture}>
        <Animated.View style={overlayAnimatedStyle} className="flex-1 bg-black">
          {/* Center content: show intro text until user starts chatting */}
          <View style={{ flex: 1 }}>
            {!lastUserText && !lastAIText && !isLoading ? (
              <View style={{ flex: 1, paddingBottom: RESERVED_BOTTOM }}>
                <View
                  className="flex-1 items-center justify-center px-8"
                  style={{ paddingTop: HEADER_TOP_SPACE }}
                >
                  <Text
                    variant="title3"
                    className="font-bold text-center text-white"
                  >
                    Vent
                  </Text>
                  <Text
                    variant="subhead"
                    className="text-center text-gray-300 mt-2"
                    style={{ textAlign: 'center' }}
                  >
                    Your private space.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ paddingBottom: RESERVED_BOTTOM, flex: 1 }}>
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

                {/* Bottom half: AI response pinned to the top of the bottom half */}
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  {lastAIText && (
                    <Animated.View
                      key={`ai-${lastAIText}`}
                      style={{ paddingHorizontal: 32 }}
                    >
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
                </View>
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
      </GestureDetector>
    </Modal>
  );
}
