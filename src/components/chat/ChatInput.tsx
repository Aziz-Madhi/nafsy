import React, { useState } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, Mic, Paperclip } from 'lucide-react-native';
import { cn } from '~/lib/cn';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}


export function ChatInput({ 
  onSendMessage, 
  placeholder = "Type a message...",
  disabled = false 
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
      <View className="flex-row items-end px-4 py-3 bg-background border-t border-border/20">
        <Pressable className="p-2 mr-2">
          <Paperclip size={24} className="text-muted-foreground" />
        </Pressable>

        <View className="flex-1 flex-row items-end bg-secondary/10 dark:bg-secondary/20 rounded-3xl px-4 py-2 min-h-[44px]">
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
              <Send size={24} className="text-primary" />
            </Pressable>
          </Animated.View>
        ) : (
          <Pressable className="ml-2 p-2">
            <Mic size={24} className="text-muted-foreground" />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}