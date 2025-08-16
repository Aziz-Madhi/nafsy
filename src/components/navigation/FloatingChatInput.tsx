import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MessageCircle, Send } from 'lucide-react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';

interface FloatingChatInputProps {
  /** Whether to show the input expanded or as a floating button */
  expanded?: boolean;
  /** Callback when expand state changes */
  onExpandChange?: (expanded: boolean) => void;
}

export function FloatingChatInput({
  expanded = false,
  onExpandChange,
}: FloatingChatInputProps) {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(expanded);
  const colors = useColors();
  const router = useRouter();
  const { t } = useTranslation();

  const handleToggleExpand = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Light);
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onExpandChange?.(newExpanded);
  }, [isExpanded, onExpandChange]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return;

    await impactAsync(ImpactFeedbackStyle.Medium);

    // Navigate to chat with the message
    router.push('/tabs/chat');

    // TODO: Send the message to chat store
    console.log('Sending message:', inputText);

    // Clear input and collapse
    setInputText('');
    setIsExpanded(false);
    onExpandChange?.(false);
  }, [inputText, router, onExpandChange]);

  if (!isExpanded) {
    // Floating button state
    return (
      <View className="absolute bottom-24 right-4">
        <Pressable
          onPress={handleToggleExpand}
          className="w-14 h-14 rounded-full bg-primary items-center justify-center"
          style={{
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          android_ripple={{
            color: 'rgba(255, 255, 255, 0.3)',
            borderless: true,
          }}
        >
          <MessageCircle size={24} className="text-primary-foreground" />
        </Pressable>
      </View>
    );
  }

  // Expanded input state
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="absolute bottom-24 left-4 right-4"
    >
      <View
        className="flex-row items-center bg-card-elevated rounded-full px-4 py-2 border border-border"
        style={{
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
        }}
      >
        {/* Collapse button */}
        <Pressable
          onPress={handleToggleExpand}
          className="w-8 h-8 rounded-full items-center justify-center mr-2"
          android_ripple={{
            color: 'rgba(0, 0, 0, 0.1)',
            borderless: true,
          }}
        >
          <MessageCircle size={18} className="text-muted-foreground" />
        </Pressable>

        {/* Text input */}
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder={
            t('chat.floatingChat.placeholder') || 'Type a message...'
          }
          placeholderTextColor={colors.mutedForeground}
          className="flex-1 text-foreground"
          style={{
            fontSize: 16,
            lineHeight: 20,
          }}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        {/* Send button */}
        <Pressable
          onPress={handleSend}
          disabled={!inputText.trim()}
          className={`w-8 h-8 rounded-full items-center justify-center ml-2 ${
            inputText.trim() ? 'bg-primary' : 'bg-muted'
          }`}
          android_ripple={{
            color: 'rgba(255, 255, 255, 0.3)',
            borderless: true,
          }}
        >
          <Send
            size={16}
            className={
              inputText.trim()
                ? 'text-primary-foreground'
                : 'text-muted-foreground'
            }
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
