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
// import { useTranslation } from '~/hooks/useTranslation';
import SendingSpinner from './SendingSpinner';
import { AnimatedContainer, StaggeredListItem } from '~/lib/animations';

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

  return (
    <StaggeredListItem
      index={index}
      staggerDelay="quick"
      springPreset="gentle"
      className={cn(
        'flex-row mb-5',
        shouldJustifyEnd ? 'justify-end' : 'justify-start'
      )}
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
              enableRTL={isUser}
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
  return (
    <AnimatedContainer
      entrance="slideInUp"
      entranceDelay={delay}
      pressable
      onPress={onPress}
      pressScale="normal"
      springPreset="quick"
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
          <Text variant="heading" className="mr-2.5">
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

// =====================
// CHAT INPUT COMPONENT
// =====================
export const ChatInput = React.memo(function ChatInput({
  onSendMessage,
  placeholder = 'Type a message...',
  disabled = false,
  hideBorder = false,
  hideButton = false,
  value,
  onChangeText,
}: ChatInputProps & { hideBorder?: boolean; hideButton?: boolean }) {
  const [internalMessage, setInternalMessage] = useState('');
  const sendScale = useSharedValue(1);
  const containerScale = useSharedValue(1);

  // Use controlled value if provided, otherwise use internal state
  const message = value !== undefined ? value : internalMessage;
  const setMessage =
    value !== undefined ? onChangeText || (() => {}) : setInternalMessage;
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
      // Only clear if using internal state
      if (value === undefined) {
        setMessage('');
      }
    }
  };

  const handleFocus = () => {
    containerScale.value = withSpring(1.01, { damping: 18, stiffness: 250 }); // More subtle scale
  };

  const handleBlur = () => {
    containerScale.value = withSpring(1, { damping: 18, stiffness: 250 });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View
        className={cn(hideBorder ? 'px-0 py-0' : 'px-4 py-3', 'bg-transparent')}
      >
        <View style={{ position: 'relative', minHeight: 48 }}>
          {/* Text input - full width with button positioned absolutely inside */}
          <Animated.View style={containerStyle}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor="#94a3b8" // More refined slate color
              multiline
              maxLength={1000}
              editable={!disabled}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="text-base"
              style={{
                fontFamily: 'CrimsonPro-Regular',
                textAlignVertical: 'center',
                minHeight: 48,
                maxHeight: 80,
                fontSize: 16,
                lineHeight: 20,
                color: '#1e293b', // Rich, sophisticated text color
                fontWeight: '400',
                paddingLeft: 16,
                paddingRight: !hideButton ? 52 : 16, // Make space for the button
                paddingTop: 12,
                paddingBottom: 12,
                backgroundColor: 'transparent',
                borderRadius: 24,
                borderWidth: 1,
                borderColor: hideBorder
                  ? 'rgba(226, 232, 240, 0.3)'
                  : 'rgba(226, 232, 240, 0.6)',
              }}
            />
          </Animated.View>

          {/* Button positioned absolutely inside the input */}
          {!hideButton && (
            <View
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: [{ translateY: -16 }], // Center vertically (32px height / 2)
              }}
              className="w-8 h-8"
            >
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
                    className="w-8 h-8 rounded-full items-center justify-center bg-chat-bubble-user"
                  >
                    <SymbolView name="arrow.up" size={18} tintColor="white" />
                  </Pressable>
                </Animated.View>
              </MotiView>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
});
