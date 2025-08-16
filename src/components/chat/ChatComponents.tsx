import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { ChatBubbleProps, ChatInputProps } from './types';
import { useTranslation } from '~/hooks/useTranslation';
import SendingSpinner from './SendingSpinner';
import { AnimatedContainer, StaggeredListItem } from '~/lib/animations';
import { useIsRTL } from '~/store/useAppStore';
import { useColors } from '~/hooks/useColors';
import { rtlStyles } from '~/lib/rtl-utils';

// =====================
// CHAT BUBBLE COMPONENT
// =====================
export const ChatBubble = React.memo(function ChatBubble({
  message,
  isUser,
  timestamp,
  avatar,
  index = 0,
  status,
}: ChatBubbleProps) {
  const isRTL = useIsRTL();

  // RTL-aware positioning: user messages go to opposite side in RTL
  const justifyContent = isUser
    ? isRTL
      ? 'justify-start' // User messages go left in RTL
      : 'justify-end' // User messages go right in LTR
    : isRTL
      ? 'justify-end' // AI messages go right in RTL
      : 'justify-start'; // AI messages go left in LTR

  return (
    <StaggeredListItem
      index={index}
      staggerDelay="quick"
      springPreset="gentle"
      className={cn('flex-row mb-5', justifyContent)}
    >
      <AnimatedContainer pressable pressScale="subtle" className="max-w-[85%]">
        <View
          className={cn(
            'px-4 py-3 rounded-2xl',
            isUser ? 'bg-chat-bubble-user' : 'bg-transparent'
          )}
          style={{
            ...(isUser
              ? {
                  shadowColor: '#2F6A8D',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 5,
                }
              : {}),
          }}
        >
          <View className="relative">
            <Text
              variant="callout"
              className={cn(
                isUser ? 'text-primary-foreground' : 'text-foreground'
              )}
            >
              {message}
            </Text>

            {timestamp && !isUser && (
              <Text
                variant="footnote"
                className={cn(
                  'mt-2',
                  isUser
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
              >
                {timestamp}
              </Text>
            )}
          </View>
        </View>

        {/* Enhanced status indicator */}
        {isUser && status && (
          <Animated.View
            entering={FadeInUp.springify()}
            className={cn('absolute -bottom-1', isRTL ? '-start-1' : '-end-1')}
          >
            <View className="bg-card rounded-full p-1.5 shadow-md">
              {status === 'sending' ? (
                <SendingSpinner />
              ) : status === 'sent' ? (
                <SymbolView name="checkmark" size={14} tintColor="#10B981" />
              ) : (
                <SymbolView
                  name="exclamationmark"
                  size={14}
                  tintColor="#EF4444"
                />
              )}
            </View>
          </Animated.View>
        )}
      </AnimatedContainer>
    </StaggeredListItem>
  );
});

// =====================
// TYPING INDICATOR
// =====================
export const TypingIndicator = React.memo(function TypingIndicator() {
  const isRTL = useIsRTL();
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  const containerScale = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    // Container entrance animation
    containerScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    containerOpacity.value = withTiming(1, { duration: 300 });

    // Enhanced dot animations with bounce effect
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withSpring(0, { damping: 8, stiffness: 300 })
      ),
      -1
    );

    dot2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withSpring(0, { damping: 8, stiffness: 300 })
      ),
      -1
    );

    dot3.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withSpring(0, { damping: 8, stiffness: 300 })
      ),
      -1
    );
  }, [containerOpacity, containerScale, dot1, dot2, dot3]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerOpacity.value,
  }));

  const dot1Style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: 0.7 + dot1.value * 0.5 },
        { translateY: -dot1.value * 8 },
      ],
      opacity: 0.4 + dot1.value * 0.6,
    };
  });

  const dot2Style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: 0.7 + dot2.value * 0.5 },
        { translateY: -dot2.value * 8 },
      ],
      opacity: 0.4 + dot2.value * 0.6,
    };
  });

  const dot3Style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: 0.7 + dot3.value * 0.5 },
        { translateY: -dot3.value * 8 },
      ],
      opacity: 0.4 + dot3.value * 0.6,
    };
  });

  return (
    <Animated.View style={containerStyle} className="mb-5">
      <View
        className={cn(
          'flex-row items-center justify-center bg-white rounded-full px-5 py-3.5 self-start shadow-md',
          isRTL ? 'me-4' : 'ms-4'
        )}
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Animated.View
          style={dot1Style}
          className="w-3 h-3 rounded-full bg-brand-dark-blue"
        />
        <Animated.View
          style={dot2Style}
          className="w-3 h-3 rounded-full mx-1.5 bg-brand-dark-blue"
        />
        <Animated.View
          style={dot3Style}
          className="w-3 h-3 rounded-full bg-brand-dark-blue"
        />
      </View>
    </Animated.View>
  );
});

// =====================
// QUICK REPLY BUTTON
// =====================
interface QuickReplyButtonProps {
  text: string;
  onPress: () => void;
  icon?: string;
  delay?: number;
}

export const QuickReplyButton = React.memo(function QuickReplyButton({
  text,
  onPress,
  icon,
  delay = 0,
}: QuickReplyButtonProps) {
  const isRTL = useIsRTL();
  return (
    <AnimatedContainer
      entrance="slideInUp"
      entranceDelay={delay}
      pressable
      onPress={onPress}
      pressScale="normal"
      springPreset="quick"
      className={cn('mb-3', isRTL ? 'ms-3' : 'me-3')}
    >
      <View
        className="flex-row items-center bg-white rounded-full px-6 py-3"
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#E5E7EB',
        }}
      >
        {icon && (
          <Text variant="heading" className={cn(isRTL ? 'ms-2.5' : 'me-2.5')}>
            {icon}
          </Text>
        )}
        <Text variant="callout" className="text-foreground">
          {text}
        </Text>
      </View>
    </AnimatedContainer>
  );
});

// ChatInput component removed - was unused
// The actual chat input is now in ChatInputWithNavConnection.tsx
