import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { ChatBubbleProps } from './types';
import SendingSpinner from './SendingSpinner';
import { AnimatedContainer, StaggeredListItem } from '~/lib/animations';
import { ChatType } from '~/store/useChatUIStore';
import { getChatStyles } from '~/lib/chatStyles';
import * as Clipboard from 'expo-clipboard';
import { Copy } from 'lucide-react-native';
import { useColors } from '~/hooks/useColors';
// Removed useIsRTL - UI layout always stays LTR

// =====================
// CHAT BUBBLE COMPONENT
// =====================
export const ChatBubble = React.memo(function ChatBubble({
  message,
  isUser,
  avatar,
  index = 0,
  status,
  chatType = 'coach',
  animated = true,
  showCopy = true,
}: ChatBubbleProps & { chatType?: ChatType }) {
  // Consistent positioning: user messages right, AI messages left
  const justifyContent = isUser ? 'justify-end' : 'justify-start';
  const styles = getChatStyles(chatType);
  const colors = useColors();
  const containerWidthClass = isUser ? 'max-w-[85%] self-end' : 'w-full self-start';

  const handleCopy = useCallback(async () => {
    if (isUser) return;
    try {
      await Clipboard.setStringAsync(message);
      // animate icon feedback
      copyScale.value = withSequence(
        withTiming(0.9, { duration: 80 }),
        withTiming(1, { duration: 120 })
      );
      setCopied(true);
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // Fall back to a quiet alert only on failure
      try {
        Alert.alert('Copy failed', 'Unable to copy message');
      } catch {}
    }
  }, [isUser, message]);

  // Small scale animation for copy icon
  const copyScale = useSharedValue(1);
  const copyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copyScale.value }],
  }));

  // Copied feedback state
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

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
        pressable={!isUser && showCopy}
        pressScale="subtle"
        className={cn(containerWidthClass)}
        onPress={handleCopy}
      >
        <View
          className={cn(
            'px-4 py-3 rounded-2xl',
            // For AI responses we keep a transparent background but ensure the
            // container itself anchors to the left in RTL as well
            isUser ? styles.bubbleUserClass : 'bg-transparent items-start w-full'
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

            {!isUser && showCopy && (
              <View className="mt-2 self-start flex-row items-center">
                <Pressable
                  onPress={handleCopy}
                  accessibilityLabel="Copy message"
                  className="p-1.5 rounded-full"
                  hitSlop={8}
                >
                  <Animated.View style={copyStyle}>
                    <Copy size={16} color={colors.mutedForeground} />
                  </Animated.View>
                </Pressable>
                {copied && (
                  <Text
                    variant="footnote"
                    autoAlign={false}
                    className="ml-2 text-muted-foreground"
                  >
                    Copied
                  </Text>
                )}
              </View>
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
