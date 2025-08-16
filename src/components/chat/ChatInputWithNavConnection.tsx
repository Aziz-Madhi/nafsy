import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useSegments } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';

interface ChatInputWithNavConnectionProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInputWithNavConnection({
  onSendMessage,
  placeholder,
  disabled = false,
}: ChatInputWithNavConnectionProps) {
  const [message, setMessage] = useState('');
  const colors = useColors();
  const { t } = useTranslation();
  const segments = useSegments();

  // Check if we're on the chat tab
  const isOnChatTab = segments[1] === 'chat';

  const sendScale = useSharedValue(1);

  const hasText = !!message.trim();

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const handleSend = useCallback(async () => {
    if (message.trim() && !disabled) {
      await impactAsync(ImpactFeedbackStyle.Medium);

      sendScale.value = withSequence(
        withSpring(0.8, { damping: 12, stiffness: 400 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );

      onSendMessage(message.trim());
      setMessage('');
    }
  }, [message, disabled, onSendMessage, sendScale]);

  return (
    <MotiView
      from={{
        height: 0,
        scaleY: 0,
        opacity: 0,
      }}
      animate={{
        height: isOnChatTab ? 'auto' : 0,
        scaleY: isOnChatTab ? 1 : 0,
        opacity: isOnChatTab ? 1 : 0,
      }}
      transition={{
        type: 'timing',
        duration: 300,
      }}
      style={{
        transformOrigin: 'bottom',
      }}
      className="absolute bottom-0 left-0 right-0"
    >
      {/* Main input container with rounded top corners */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View
          className="bg-card-elevated"
          style={{
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          }}
        >
          {/* Input area */}
          <View
            className="flex-row items-center px-4 py-3"
            style={{ minHeight: 48 }}
          >
            {/* Text input - no container styling */}
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={
                placeholder ||
                t('chat.typingPlaceholder') ||
                'Type a message...'
              }
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 text-foreground font-sans"
              style={{
                fontSize: 16,
                lineHeight: 20,
                paddingVertical: 8,
              }}
              multiline
              maxLength={1000}
              editable={!disabled}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />

            {/* Send button - floating style */}
            <MotiView
              animate={{
                opacity: hasText ? 1 : 0.6,
                scale: hasText ? 1 : 0.8,
              }}
              transition={{
                type: 'spring',
                damping: 15,
                stiffness: 150,
              }}
            >
              <Animated.View style={sendButtonStyle}>
                <Pressable
                  onPress={handleSend}
                  disabled={!hasText || disabled}
                  className={cn(
                    'w-10 h-10 rounded-full items-center justify-center ml-2',
                    hasText && !disabled ? 'bg-primary' : 'bg-muted'
                  )}
                  style={
                    hasText && !disabled
                      ? {
                          shadowColor: colors.primary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 6,
                          elevation: 4,
                        }
                      : undefined
                  }
                  android_ripple={{
                    color: 'rgba(255, 255, 255, 0.3)',
                    borderless: true,
                  }}
                >
                  <Send
                    size={18}
                    className={
                      hasText && !disabled
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
                    }
                  />
                </Pressable>
              </Animated.View>
            </MotiView>
          </View>

          {/* Navigation bar spacing */}
          <View className="h-20" />
        </View>
      </KeyboardAvoidingView>
    </MotiView>
  );
}
