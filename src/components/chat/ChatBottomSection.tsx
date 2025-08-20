/**
 * ChatBottomSection Component
 * Unifies the chat input and navigation bar into one visual block
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
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageCircle, Heart, Activity } from 'lucide-react-native';
import { useColors } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

interface ChatBottomSectionProps extends BottomTabBarProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const getIconForRoute = (routeName: string) => {
  switch (routeName) {
    case 'chat':
      return MessageCircle;
    case 'mood':
      return Heart;
    case 'exercises':
      return Activity;
    default:
      return MessageCircle;
  }
};

export function ChatBottomSection({
  state,
  descriptors,
  navigation,
  onSendMessage,
  placeholder,
  disabled = false,
}: ChatBottomSectionProps) {
  const [message, setMessage] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t } = useTranslation();
  const hasText = !!message.trim();

  const handleSend = useCallback(async () => {
    if (message.trim() && !disabled) {
      await impactAsync(ImpactFeedbackStyle.Medium);
      onSendMessage(message.trim());
      setMessage('');
    }
  }, [message, disabled, onSendMessage]);

  const handleTabPress = useCallback(
    async (route: any, isFocused: boolean) => {
      // Add haptic feedback
      await impactAsync(ImpactFeedbackStyle.Light);

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [navigation]
  );

  // When the chat screen loses focus (e.g., switching tabs), blur and dismiss
  useFocusEffect(
    useCallback(() => {
      return () => {
        inputRef.current?.blur();
        Keyboard.dismiss();
      };
    }, [])
  );

  // Only show input on chat tab
  const isChatTab = state.routes[state.index].name === 'chat';

  return (
    <View className="absolute bottom-0 left-0 right-0">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Unified container with card background */}
        <View
          className="rounded-t-3xl"
          style={{
            backgroundColor: colors.card,
            paddingBottom: insets.bottom,
          }}
        >
          {/* Chat input section - only visible on chat tab */}
          {isChatTab && (
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row items-center">
                <TextInput
                  ref={inputRef}
                  value={message}
                  onChangeText={setMessage}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={
                    placeholder ||
                    t('chat.typingPlaceholder') ||
                    'Type a message...'
                  }
                  placeholderTextColor={withOpacity(colors.foreground, 0.55)}
                  className="flex-1 text-foreground text-base px-4 py-3"
                  multiline
                  maxLength={1000}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                  editable={!disabled}
                />

                {/* Send button */}
                <Pressable
                  onPress={handleSend}
                  disabled={!hasText || disabled}
                  className={cn('mr-2 rounded-full p-2.5')}
                  style={({ pressed }) => ({
                    backgroundColor:
                      hasText && !disabled
                        ? withOpacity(colors.primary, 0.28)
                        : colors.background === '#0A1514'
                          ? 'rgba(255,255,255,0.10)'
                          : 'rgba(0,0,0,0.08)',
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <SymbolView
                    name="arrow.up.circle.fill"
                    size={20}
                    tintColor={
                      hasText && !disabled
                        ? colors.primary
                        : withOpacity(colors.foreground, 0.45)
                    }
                  />
                </Pressable>
              </View>

              {/* Subtle divider */}
              <View
                className="h-[0.5px] mt-2"
                style={{ backgroundColor: colors.border + '20' }}
              />
            </View>
          )}

          {/* Navigation tabs */}
          <View className="h-16 flex-row items-center justify-evenly">
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const Icon = getIconForRoute(route.name);

              return (
                <Pressable
                  key={route.key}
                  onPress={() => handleTabPress(route, isFocused)}
                  className="flex-1 items-center justify-center py-4"
                  android_ripple={{
                    color: 'rgba(0, 0, 0, 0.1)',
                    borderless: true,
                    radius: 32,
                  }}
                >
                  <View className="items-center justify-center">
                    <Icon
                      size={24}
                      color={isFocused ? colors.tabActive : colors.tabInactive}
                      fill="none"
                      strokeWidth={isFocused ? 2.5 : 2}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
