import React from 'react';
import { View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ChatBubbleProps } from './types';
import SendingSpinner from './SendingSpinner';
import { AnimatedContainer, StaggeredListItem } from '~/lib/animations';
import { ChatType } from '~/store/useChatUIStore';
import { getChatStyles } from '~/lib/chatStyles';
// Removed useIsRTL - UI layout always stays LTR

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
  chatType = 'coach',
  animated = true,
}: ChatBubbleProps & { chatType?: ChatType }) {
  // Consistent positioning: user messages right, AI messages left
  const justifyContent = isUser ? 'justify-end' : 'justify-start';
  const styles = getChatStyles(chatType);

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    animated ? (
      <StaggeredListItem
        index={index}
        staggerDelay="quick"
        springPreset="gentle"
        className={cn('flex-row mb-5', justifyContent)}
      >
        {children}
      </StaggeredListItem>
    ) : (
      <View className={cn('flex-row mb-5', justifyContent)}>{children}</View>
    );

  return (
    <Wrapper>
      <AnimatedContainer
        pressable
        pressScale="subtle"
        className={cn('max-w-[85%]', isUser ? 'self-end' : 'self-start')}
      >
        <View
          className={cn(
            'px-4 py-3 rounded-2xl',
            // For AI responses we keep a transparent background but ensure the
            // container itself anchors to the left in RTL as well
            isUser ? styles.bubbleUserClass : 'bg-transparent items-start'
          )}
          style={{
            ...(isUser
              ? {
                  shadowColor: styles.primaryColor,
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
              // Force assistant text to be left-aligned even in Arabic.
              // We disable auto alignment (which mirrors to RTL for ar)
              // and explicitly set text-left for consistent layout.
              autoAlign={isUser}
              className={cn(
                isUser ? 'text-primary-foreground' : 'text-foreground text-left'
              )}
            >
              {message}
            </Text>

            {timestamp && !isUser && (
              <Text
                variant="footnote"
                autoAlign={false}
                className={cn(
                  'mt-2 text-left',
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
            className="absolute -bottom-1 -end-1"
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
    </Wrapper>
  );
});

// ChatInput component removed - unified input lives with the tab bar.
// See: `src/components/navigation/FloatingTabBar.tsx` (canonical source)
