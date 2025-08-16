/**
 * Main Chat Screen Component
 * Orchestrates all chat-related components
 */

import React, { useRef, useCallback, useEffect, memo, useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { runOnJS } from 'react-native-reanimated';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

import { ChatHeader } from './ChatHeader';
import { SessionStatusDisplay } from './SessionStatusDisplay';
import { ChatMessageList, Message } from './ChatMessageList';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ChatBubble } from './ChatComponents';
import { ChatInputWithNavConnection } from './ChatInputWithNavConnection';
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
  onSendMessage: (message: string) => void;
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
  onSendMessage,
}: ChatScreenProps) {
  const flashListRef = useRef<FlashList<Message>>(null as any);

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
  const { setFloatingChatVisible, isFloatingChatVisible } = useChatUIStore();

  // Memoize gesture to prevent recreation on every render
  // Only enable when floating chat is NOT visible to prevent conflicts
  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .enabled(!isFloatingChatVisible) // Disable when floating chat is visible
        .onStart(() => {
          runOnJS(impactAsync)(ImpactFeedbackStyle.Light);
        })
        .onEnd(() => {
          runOnJS(setFloatingChatVisible)(true);
        }),
    [setFloatingChatVisible, isFloatingChatVisible]
  );

  // No complex offset logic needed with the new simplified approach

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
    <View className="flex-1 bg-background">
      <GestureDetector gesture={doubleTapGesture}>
        <View
          className="flex-1"
          style={{ paddingBottom: navigationBarPadding }}
        >
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

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        visible={showHistorySidebar}
        onClose={onCloseSidebar}
        onSessionSelect={onSessionSelect}
      />

      {/* Chat Input with Navigation Connection */}
      <ChatInputWithNavConnection onSendMessage={onSendMessage} />
    </View>
  );
});
