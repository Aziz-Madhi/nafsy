/**
 * Vent Chat Overlay Component
 * A focused black hole interface for emotional venting sessions
 */

import React, { useState, useEffect } from 'react';
import { View, Modal, Dimensions } from 'react-native';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';
import { VentChatInput } from './VentChatInput';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.7, 320);
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;

interface VentChatOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => Promise<void>;
  currentMessage: string | null;
  isLoading?: boolean;
}

interface MessageDisplayProps {
  message: string;
  isUser: boolean;
}

const MessageDisplay = ({ message, isUser }: MessageDisplayProps) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    // Fade in from below
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });

    return () => {
      // Fade out and move up
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-20, { duration: 300 });
    };
  }, [message]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute inset-0 items-center justify-center p-8"
    >
      <Text
        className={cn(
          'text-lg text-center font-medium',
          isUser ? 'text-white' : 'text-gray-200'
        )}
      >
        {message}
      </Text>
    </Animated.View>
  );
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

  // Animation values
  const overlayOpacity = useSharedValue(0);
  const circleScale = useSharedValue(0.5);
  const backgroundRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Manage modal visibility to allow exit animations
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      // Entry animations
      overlayOpacity.value = withTiming(1, { duration: 300 });
      circleScale.value = withSpring(1, { damping: 12, stiffness: 150 });

      // Very slow rotation for background effect only
      backgroundRotation.value = withTiming(360, { duration: 60000 });

      // Subtle pulsing
      pulseScale.value = withSequence(
        withDelay(500, withTiming(1.05, { duration: 2000 })),
        withTiming(1, { duration: 2000 })
      );
    } else {
      // Exit animations - mirror the entry animations
      overlayOpacity.value = withTiming(0, { duration: 300 });
      circleScale.value = withSpring(0.5, { damping: 12, stiffness: 150 });
      backgroundRotation.value = withTiming(0, { duration: 300 });
      pulseScale.value = withTiming(1, { duration: 200 });

      // Delay unmounting the modal to allow exit animations to complete
      const timer = setTimeout(() => {
        setModalVisible(false);
      }, 400); // Slightly longer than the longest animation

      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Double tap gesture to close (when tapping outside the circle)
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .runOnJS(true)
    .onStart((event) => {
      // Check if tap is outside the circle
      const centerX = SCREEN_WIDTH / 2;
      const centerY = SCREEN_HEIGHT / 2;
      const distance = Math.sqrt(
        Math.pow(event.x - centerX, 2) + Math.pow(event.y - centerY, 2)
      );

      if (distance > CIRCLE_RADIUS) {
        // Trigger exit animations before closing
        impactAsync(ImpactFeedbackStyle.Light);
        onClose();
      }
    });

  // Animated styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${backgroundRotation.value}deg` }],
  }));

  // Parse current message to determine if it's user or AI
  const isUserMessage = currentMessage?.startsWith('user:');
  const displayMessage = currentMessage?.replace(/^(user:|ai:)/, '').trim();

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <GestureDetector gesture={doubleTapGesture}>
        <Animated.View
          style={overlayAnimatedStyle}
          className="flex-1 bg-black/95"
        >
          {/* Center black hole container */}
          <View className="flex-1 items-center justify-center">
            {/* Black hole with multiple gradient layers */}
            <Animated.View
              style={[
                circleAnimatedStyle,
                { width: CIRCLE_SIZE, height: CIRCLE_SIZE },
              ]}
              className="relative"
            >
              {/* Base black circle */}
              <View className="absolute inset-0 rounded-full bg-black" />

              {/* Gradient layers for depth */}
              <View className="absolute inset-1 rounded-full bg-gray-950/90" />
              <View className="absolute inset-3 rounded-full bg-gray-900/80" />
              <View className="absolute inset-5 rounded-full bg-gray-800/70" />

              {/* Subtle pulsing glow */}
              <Animated.View
                style={pulseAnimatedStyle}
                className="absolute -inset-8 rounded-full bg-purple-600/5"
              />

              {/* Rotating background effect (separate from message) */}
              <Animated.View
                style={backgroundAnimatedStyle}
                className="absolute inset-0 rounded-full"
              >
                <View className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-900/10 via-transparent to-blue-900/10" />
              </Animated.View>

              {/* Message display area - NOT rotating */}
              {displayMessage && (
                <MessageDisplay
                  message={displayMessage}
                  isUser={isUserMessage || false}
                />
              )}

              {/* Loading state - show subtle pulsing dots instead of circle */}
              {isLoading && !displayMessage && (
                <View className="absolute inset-0 items-center justify-center">
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    exiting={FadeOut.duration(300)}
                    className="flex-row gap-2"
                  >
                    <View className="w-2 h-2 rounded-full bg-white/30" />
                    <View className="w-2 h-2 rounded-full bg-white/50" />
                    <View className="w-2 h-2 rounded-full bg-white/30" />
                  </Animated.View>
                </View>
              )}
            </Animated.View>

          </View>

          {/* Unified vent chat input */}
          <VentChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}
