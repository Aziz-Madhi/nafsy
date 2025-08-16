import React from 'react';
import { View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ChatBubbleProps } from './types';
import SendingSpinner from './SendingSpinner';
import { AnimatedContainer, StaggeredListItem } from '~/lib/animations';
import { useIsRTL } from '~/store/useAppStore';

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

// ChatInput component removed - was unused
// The actual chat input is now in ChatInputWithNavConnection.tsx
