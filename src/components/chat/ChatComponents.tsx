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
  withDelay,
} from 'react-native-reanimated';
import { AnimatePresence, MotiView } from 'moti';
import { ChatBubbleProps, ChatInputProps } from './types';
import { useTranslation } from '~/hooks/useTranslation';
import SendingSpinner from './SendingSpinner';

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
  const shouldJustifyEnd = isUser;

  // Enhanced entrance animations
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  const scale = useSharedValue(0.8);
  const rotate = useSharedValue(isUser ? 2 : -2);

  React.useEffect(() => {
    // Staggered elastic entrance
    opacity.value = withDelay(
      index * 50,
      withSpring(1, { damping: 12, stiffness: 180 })
    );
    translateY.value = withDelay(
      index * 50,
      withSpring(0, { damping: 10, stiffness: 150, mass: 0.8 })
    );
    scale.value = withDelay(
      index * 50,
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    rotate.value = withDelay(
      index * 50,
      withSpring(0, { damping: 10, stiffness: 100 })
    );
  }, [index, isUser]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotate.value}deg` },
      ],
    };
  });

  // Press animation
  const messageScale = useSharedValue(1);
  const handlePressIn = () => {
    messageScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };
  const handlePressOut = () => {
    messageScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const messageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: messageScale.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        'flex-row mb-5',
        shouldJustifyEnd ? 'justify-end' : 'justify-start'
      )}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="max-w-[85%]"
      >
        <Animated.View style={messageAnimatedStyle}>
          <View
            className={cn(
              'px-4 py-3 rounded-2xl',
              isUser ? 'bg-[#2D7D6E]' : 'bg-transparent'
            )}
            style={{
              ...(isUser
                ? {
                    shadowColor: '#2D7D6E',
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
                variant="body"
                className={cn(isUser ? 'text-white' : 'text-[#2E3A59]')}
                enableRTL={isUser}
              >
                {message}
              </Text>

              {timestamp && (
                <Text
                  variant="muted"
                  className={cn(
                    'text-xs mt-2',
                    isUser ? 'text-white/70' : 'text-[#2E3A59]/70'
                  )}
                  enableRTL={isUser}
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
              className="absolute -bottom-1 -right-1"
            >
              <View className="bg-white rounded-full p-1.5 shadow-md">
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
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// =====================
// TYPING INDICATOR
// =====================
export function TypingIndicator() {
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

    dot2.value = withDelay(
      150,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withSpring(0, { damping: 8, stiffness: 300 })
        ),
        -1
      )
    );

    dot3.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withSpring(0, { damping: 8, stiffness: 300 })
        ),
        -1
      )
    );
  }, []);

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
        className="flex-row items-center justify-center bg-white rounded-full px-5 py-3.5 ml-4 self-start shadow-md"
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Animated.View
          style={[dot1Style, { backgroundColor: '#2D7D6E' }]}
          className="w-3 h-3 rounded-full"
        />
        <Animated.View
          style={[dot2Style, { backgroundColor: '#2D7D6E' }]}
          className="w-3 h-3 rounded-full mx-1.5"
        />
        <Animated.View
          style={[dot3Style, { backgroundColor: '#2D7D6E' }]}
          className="w-3 h-3 rounded-full"
        />
      </View>
    </Animated.View>
  );
}

// =====================
// QUICK REPLY BUTTON
// =====================
interface QuickReplyButtonProps {
  text: string;
  onPress: () => void;
  icon?: string;
  delay?: number;
}

export function QuickReplyButton({
  text,
  onPress,
  icon,
  delay = 0,
}: QuickReplyButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 12, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).springify().damping(10).stiffness(150)}
    >
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="mr-3 mb-3"
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
              <Text className="mr-2.5 text-lg" style={{ fontSize: 18 }}>
                {icon}
              </Text>
            )}
            <Text variant="body" className="text-gray-700 font-medium">
              {text}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// =====================
// CHAT INPUT COMPONENT
// =====================
export function ChatInput({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
  hideBorder = false,
}: ChatInputProps & { hideBorder?: boolean }) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const sendScale = useSharedValue(1);
  const containerScale = useSharedValue(1);
  const hasText = !!message.trim();

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  const handleSend = () => {
    if (message.trim() && !disabled) {
      sendScale.value = withSequence(
        withSpring(0.8, { damping: 12, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    containerScale.value = withSpring(1.02, { damping: 15, stiffness: 200 });
  };

  const handleBlur = () => {
    setIsFocused(false);
    containerScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className={cn('px-4 py-4', !hideBorder && 'bg-white/40')}>
        <Animated.View
          style={[
            containerStyle,
            {
              backgroundColor: 'white',
              borderRadius: 35,
              paddingHorizontal: 24,
              paddingVertical: 16,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 8,
              minHeight: 70,
            },
          ]}
        >
          <View className="flex-row items-center">
            {/* Text input - now takes full width */}
            <View className="flex-1 mr-4 justify-center">
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={1000}
                editable={!disabled}
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="text-base text-gray-800"
                style={{
                  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  textAlignVertical: 'center',
                  minHeight: 38,
                  maxHeight: 100,
                }}
              />
            </View>

            {/* Right side - Send/Microphone button */}
            <View className="w-8 h-8 relative">
              {/* Always render both, control visibility with Moti */}
              <MotiView
                animate={{
                  opacity: hasText ? 0 : 1,
                  scale: hasText ? 0.9 : 1,
                }}
                transition={{
                  type: 'timing',
                  duration: 150,
                }}
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <Pressable className="w-8 h-8 rounded-full items-center justify-center">
                  <SymbolView name="mic.fill" size={20} tintColor="#6B7280" />
                </Pressable>
              </MotiView>

              <MotiView
                animate={{
                  opacity: hasText ? 1 : 0,
                  scale: hasText ? 1 : 0.9,
                }}
                transition={{
                  type: 'timing',
                  duration: 150,
                }}
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <Animated.View style={sendButtonStyle}>
                  <Pressable
                    onPress={handleSend}
                    disabled={disabled}
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: '#2D7D6E',
                    }}
                  >
                    <SymbolView name="arrow.up" size={18} tintColor="white" />
                  </Pressable>
                </Animated.View>
              </MotiView>
            </View>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
