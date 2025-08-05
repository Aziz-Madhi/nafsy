/**
 * Main Chat Screen Component
 * Orchestrates all chat-related components
 */

import React, { useRef, useCallback, useEffect, memo, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import Animated, {
  runOnJS,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

import { ChatHeader } from './ChatHeader';
import { SessionStatusDisplay } from './SessionStatusDisplay';
import { ChatMessageList, Message } from './ChatMessageList';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { FloatingChatMinimal } from './FloatingChatMinimal';
import { ChatBubble } from './ChatComponents';
import { useChatUIStore } from '~/store';

interface QuickReply {
  text: string;
  icon: string;
}

interface ChatScreenProps {
  // State
  messages: Message[];
  isTyping: boolean;
  showQuickReplies: boolean;
  showHistorySidebar: boolean;
  sessionSwitchLoading: boolean;
  sessionError: string | null;

  // Data
  quickReplies: QuickReply[];
  welcomeSubtitle: string;
  navigationBarPadding: number;

  // Actions
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  onSessionSelect: (sessionId: string) => void;
  onQuickReply: (text: string) => void;
  onDismissError: () => void;
}

export const ChatScreen = memo(function ChatScreen({
  messages,
  isTyping,
  showQuickReplies,
  showHistorySidebar,
  sessionSwitchLoading,
  sessionError,
  quickReplies,
  welcomeSubtitle,
  navigationBarPadding,
  onOpenSidebar,
  onCloseSidebar,
  onSessionSelect,
  onQuickReply,
  onDismissError,
}: ChatScreenProps) {
  const flashListRef = useRef<FlashList<Message>>(null);

  // Auto-scroll to bottom when messages change or new messages arrive
  const scrollToBottom = useCallback(() => {
    if (flashListRef.current && messages.length > 0) {
      // Use setTimeout to ensure FlashList has rendered the new data
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Scroll to bottom when messages change (session switch or new messages)
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Gesture handling
  const chatOffset = useSharedValue(0);
  const { width: screenWidth } = Dimensions.get('window');
  const { setFloatingChatVisible } = useChatUIStore();

  // Memoize gesture to prevent recreation on every render
  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
          runOnJS(impactAsync)(ImpactFeedbackStyle.Light);
        })
        .onEnd(() => {
          runOnJS(setFloatingChatVisible)(true);
        }),
    [setFloatingChatVisible]
  );

  const chatAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateX: chatOffset.value }],
      paddingBottom: navigationBarPadding,
    }),
    [navigationBarPadding]
  );

  // Update chat offset when sidebar visibility changes - push chat RIGHT to make room for sidebar
  useEffect(() => {
    chatOffset.value = withTiming(showHistorySidebar ? screenWidth * 0.6 : 0, {
      duration: 300,
    });
  }, [showHistorySidebar, screenWidth, chatOffset]);

  // FlashList render functions
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <ChatBubble
        message={item.content}
        isUser={item.role === 'user'}
        timestamp={new Date(item._creationTime).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: Message) => item._id, []);
  const getItemType = useCallback((item: Message) => item.role, []);

  return (
    <View className="flex-1 bg-[#F8F9FA]">
      <Animated.View style={[chatAnimatedStyle, { flex: 1 }]}>
        <GestureDetector gesture={doubleTapGesture}>
          <View className="flex-1">
            <ChatHeader onOpenSidebar={onOpenSidebar} />

            <SessionStatusDisplay
              isLoading={sessionSwitchLoading}
              error={sessionError}
              onDismissError={onDismissError}
            />

            <ChatMessageList
              flashListRef={flashListRef}
              messages={messages}
              renderMessage={renderMessage}
              keyExtractor={keyExtractor}
              getItemType={getItemType}
              welcomeSubtitle={welcomeSubtitle}
              isTyping={isTyping}
              showQuickReplies={showQuickReplies}
              quickReplies={quickReplies}
              horizontalPadding={20}
              onQuickReply={onQuickReply}
            />
          </View>
        </GestureDetector>
      </Animated.View>

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        visible={showHistorySidebar}
        onClose={onCloseSidebar}
        onSessionSelect={onSessionSelect}
      />

      {/* Floating Chat */}
      <FloatingChatMinimal />
    </View>
  );
});
