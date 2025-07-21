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
import { ChatBubbleProps, ChatInputProps } from './types';
import { useTranslation } from '~/hooks/useTranslation';

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
  // User messages always right-aligned, AI messages always left-aligned
  const shouldJustifyEnd = isUser;

  // Worklet-optimized entrance animation
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    opacity.value = withDelay(index * 100, withSpring(1, { damping: 15 }));
    translateY.value = withDelay(
      index * 100,
      withSpring(0, { damping: 15, stiffness: 200 })
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className={cn(
        'flex-row mb-4',
        shouldJustifyEnd ? 'justify-end' : 'justify-start'
      )}
    >
      <View
        className={cn(
          'max-w-[80%] px-2 py-1',
          isUser ? 'bg-[#2D7D6E] rounded-md' : 'bg-transparent'
        )}
      >
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
              'text-xs mt-1',
              isUser ? 'text-white/70' : 'text-[#2E3A59]/70'
            )}
            enableRTL={isUser}
          >
            {timestamp}
          </Text>
        )}

        {/* Status indicator for user messages */}
        {isUser && status && (
          <View className="absolute -bottom-1 -right-1 bg-white/90 rounded-full p-1">
            <Text className="text-xs" enableRTL={false}>
              {status === 'sending' && '⏳'}
              {status === 'sent' && '✓'}
              {status === 'delivered' && '✓✓'}
            </Text>
          </View>
        )}
      </View>
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

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1
    );

    dot2.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1
      )
    );

    dot3.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: 0.3 + dot1.value * 0.7,
      transform: [{ scale: 0.8 + dot1.value * 0.2 }],
    };
  });

  const dot2Style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: 0.3 + dot2.value * 0.7,
      transform: [{ scale: 0.8 + dot2.value * 0.2 }],
    };
  });

  const dot3Style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: 0.3 + dot3.value * 0.7,
      transform: [{ scale: 0.8 + dot3.value * 0.2 }],
    };
  });

  return (
    <View className="flex-row items-center space-x-1 bg-secondary/20 dark:bg-secondary/10 rounded-full px-4 py-3 ml-10 self-start mb-4">
      <Animated.View
        style={dot1Style}
        className="w-2 h-2 bg-muted-foreground rounded-full"
      />
      <Animated.View
        style={dot2Style}
        className="w-2 h-2 bg-muted-foreground rounded-full mx-1"
      />
      <Animated.View
        style={dot3Style}
        className="w-2 h-2 bg-muted-foreground rounded-full"
      />
    </View>
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
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className={cn(
            'flex-row items-center bg-primary/10 dark:bg-primary/20',
            'border border-primary/30 rounded-full px-4 py-2.5 mr-2 mb-2'
          )}
        >
          {icon && <Text className="mr-2 text-base">{icon}</Text>}
          <Text variant="body" className="text-primary font-medium">
            {text}
          </Text>
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
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const sendScale = useSharedValue(1);

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = () => {
    if (message.trim() && !disabled) {
      sendScale.value = withSpring(0.8, {}, () => {
        sendScale.value = withSpring(1);
      });
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View className="flex-row items-center px-4 py-4 bg-white/40 rounded-t-[25px]">
        <Pressable className="w-8 h-8 mr-2 rounded-full items-center justify-center bg-[#3A3A3A]">
          <SymbolView name="plus" size={16} tintColor="white" />
        </Pressable>

        <View className="flex-1 flex-row items-end bg-transparent rounded-3xl px-4 py-2 min-h-[44px]">
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            editable={!disabled}
            className="flex-1 text-base text-foreground py-2 max-h-[120px]"
            style={{ fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }}
          />
        </View>

        {message.trim() ? (
          <Animated.View style={sendButtonStyle}>
            <Pressable
              onPress={handleSend}
              className="ml-2 p-2"
              disabled={disabled}
            >
              <SymbolView
                name="paperplane.fill"
                size={24}
                tintColor="#6F9460"
              />
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable className="w-8 h-8 ml-2 rounded-full items-center justify-center bg-[#3A3A3A]">
            <SymbolView name="mic.fill" size={16} tintColor="white" />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
