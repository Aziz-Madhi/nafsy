/**
 * UnifiedChatInput Component
 * Chat input styled to appear unified with the navigation bar
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Mic, Send } from 'lucide-react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';
import { ChatType } from '~/store/useChatUIStore';
import { getChatStyles, getChatPlaceholder } from '~/lib/chatStyles';

interface UnifiedChatInputProps {
  onSendMessage: (message: string) => void;
  onVoicePress?: () => void;
  placeholder?: string;
  disabled?: boolean;
  chatType?: ChatType;
}

export function UnifiedChatInput({
  onSendMessage,
  onVoicePress,
  placeholder,
  disabled = false,
  chatType = 'coach',
}: UnifiedChatInputProps) {
  const [message, setMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, i18n } = useTranslation();
  const hasText = !!message.trim();
  const styles = getChatStyles(chatType);
  const defaultPlaceholder = getChatPlaceholder(
    chatType,
    i18n.language === 'ar'
  );

  // Animation shared values
  const iconTransition = useSharedValue(hasText ? 1 : 0);

  // Update animation when hasText changes
  React.useEffect(() => {
    iconTransition.value = withSpring(hasText ? 1 : 0, {
      damping: 15,
      stiffness: 300,
    });
  }, [hasText, iconTransition]);

  // Voice handler
  const handleVoicePress = useCallback(async () => {
    if (!disabled) {
      // Haptic feedback
      impactAsync(ImpactFeedbackStyle.Medium);
      
      // Call voice handler if provided, otherwise placeholder
      if (onVoicePress) {
        onVoicePress();
      } else {
        // Placeholder for voice recording functionality
        console.log('Voice recording would start here');
      }
    }
  }, [disabled, onVoicePress]);

  const handleSend = useCallback(async () => {
    if (message.trim() && !disabled) {
      const messageText = message.trim();

      // Clear input immediately for better UX
      setMessage('');

      // Haptic feedback
      impactAsync(ImpactFeedbackStyle.Medium);

      // Send message (non-blocking)
      onSendMessage(messageText);
    }
  }, [message, disabled, onSendMessage]);

  // Animated styles for crossfade effect
  const micIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconTransition.value, [0, 1], [1, 0]),
    position: 'absolute',
  }));

  const sendIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconTransition.value, [0, 1], [0, 1]),
    position: 'absolute',
  }));

  // When the chat screen loses focus (e.g., switching tabs), blur and dismiss
  useFocusEffect(
    useCallback(() => {
      return () => {
        inputRef.current?.blur();
        Keyboard.dismiss();
      };
    }, [])
  );

  return (
    <View className="absolute bottom-0 left-0 right-0">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Extended card background to include input */}
        <View
          className="rounded-t-3xl"
          style={{
            backgroundColor: colors.card,
            paddingBottom: 65, // Fixed padding for nav bar space
          }}
        >
          {/* Input section */}
          <View className="px-4 py-2">
            <View className="flex-row items-center">
              <TextInput
                ref={inputRef}
                value={message}
                onChangeText={setMessage}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder={placeholder || defaultPlaceholder}
                placeholderTextColor={withOpacity(colors.foreground, 0.55)}
                className="flex-1 text-foreground text-base px-4 py-3"
                style={{
                  // Add subtle personality background when focused
                  backgroundColor: isInputFocused
                    ? styles.primaryColor + '08'
                    : 'transparent',
                  borderRadius: 12,
                }}
                multiline
                maxLength={1000}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!disabled}
              />

              {/* Dual-function Voice/Send button */}
              <Pressable
                onPress={hasText ? handleSend : handleVoicePress}
                disabled={disabled}
                className={cn('mr-2 rounded-full p-3')}
                style={({ pressed }) => ({
                  backgroundColor:
                    hasText && !disabled
                      ? styles.primaryColor + '60'
                      : !disabled
                        ? styles.primaryColor + '25'
                        : colors.background === '#0A1514'
                          ? 'rgba(255,255,255,0.05)'
                          : 'rgba(0,0,0,0.05)',
                  opacity: pressed ? 0.8 : 1,
                  minWidth: 44,
                  minHeight: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                })}
              >
                <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                  <Animated.View style={micIconStyle}>
                    <Mic
                      size={28}
                      color={
                        !disabled
                          ? styles.primaryColor
                          : withOpacity(colors.foreground, 0.3)
                      }
                      strokeWidth={2}
                    />
                  </Animated.View>
                  <Animated.View style={sendIconStyle}>
                    <Send
                      size={28}
                      color={
                        hasText && !disabled
                          ? styles.primaryColor
                          : withOpacity(colors.foreground, 0.3)
                      }
                      strokeWidth={2}
                    />
                  </Animated.View>
                </View>
              </Pressable>
            </View>

            {/* Subtle divider */}
            <View
              className="h-[0.5px] mt-1"
              style={{ backgroundColor: colors.border + '20' }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
