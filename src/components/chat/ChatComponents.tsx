import React, { useState, useEffect } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, Mic, Paperclip } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { Avatar } from '~/components/ui/avatar';
import { cn } from '~/lib/cn';
import Animated, { 
  FadeInDown, 
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

// =====================
// CHAT BUBBLE COMPONENT
// =====================
export function ChatBubble({ message, isUser, timestamp, avatar, index = 0, status }: ChatBubbleProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      className={cn(
        'flex-row mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar
          alt="AI Assistant"
          className="mr-2 h-8 w-8"
        >
          <Avatar.Image
            source={{ uri: avatar || 'https://api.dicebear.com/7.x/bottts/png?seed=nafsy' }}
          />
          <Avatar.Fallback>
            <Text className="text-primary">AI</Text>
          </Avatar.Fallback>
        </Avatar>
      )}
      
      <View
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser 
            ? 'bg-primary' 
            : 'bg-secondary/20 dark:bg-secondary/10'
        )}
      >
        <Text
          variant="body"
          className={cn(
            isUser 
              ? 'text-primary-foreground' 
              : 'text-foreground'
          )}
        >
          {message}
        </Text>
        
        {timestamp && (
          <Text
            variant="muted"
            className={cn(
              'text-xs mt-1',
              isUser 
                ? 'text-primary-foreground/70' 
                : 'text-muted-foreground'
            )}
          >
            {timestamp}
          </Text>
        )}

        {/* Status indicator for user messages */}
        {isUser && status && (
          <View className="absolute -bottom-1 -right-1 bg-white/90 rounded-full p-1">
            <Text className="text-xs">
              {status === 'sending' && '⏳'}
              {status === 'sent' && '✓'}
              {status === 'delivered' && '✓✓'}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

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

  const dot1Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot1.value * 0.7,
    transform: [{ scale: 0.8 + dot1.value * 0.2 }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot2.value * 0.7,
    transform: [{ scale: 0.8 + dot2.value * 0.2 }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: 0.3 + dot3.value * 0.7,
    transform: [{ scale: 0.8 + dot3.value * 0.2 }],
  }));

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

export function QuickReplyButton({ text, onPress, icon, delay = 0 }: QuickReplyButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
          {icon && (
            <Text className="mr-2 text-base">
              {icon}
            </Text>
          )}
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