/**
 * Main Chat Screen Component
 * Orchestrates all chat-related components
 */

import React, { useRef, useCallback, useEffect, memo } from 'react';
import { View, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { FlashList } from '@shopify/flash-list';

import { ChatHeader } from './ChatHeader';
import { SessionStatusDisplay } from './SessionStatusDisplay';
import { ChatMessageList, Message } from './ChatMessageList';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ChatBubble } from './ChatComponents';
import { ChatInputWithNavConnection } from './ChatInputWithNavConnection';

interface ChatScreenProps {
  // State
  messages: Message[];
  showHistorySidebar: boolean;
  sessionSwitchLoading: boolean;
  sessionError: string | null;

  // Data
  welcomeSubtitle: string;
  navigationBarPadding: number;

  // Actions
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDismissError: () => void;
  onSendMessage: (message: string) => void;
}

export const ChatScreen = memo(function ChatScreen({
  messages,
  showHistorySidebar,
  sessionSwitchLoading,
  sessionError,
  welcomeSubtitle,
  navigationBarPadding,
  onOpenSidebar,
  onCloseSidebar,
  onSessionSelect,
  onDismissError,
  onSendMessage,
}: ChatScreenProps) {
  const flashListRef = useRef<FlashList<Message>>(null as any);

  // Auto-scroll to bottom when messages change or new messages arrive
  const scrollToBottom = useCallback(() => {
    if (flashListRef.current && messages.length > 0) {
      // Use setTimeout to ensure FlashList has rendered the new data
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({
          animated: true,
          // Ensure scroll goes to the actual bottom considering content insets
        });
      }, 150); // Slightly longer timeout for better reliability
    }
  }, [messages.length]);

  // Scroll to bottom when messages change (session switch or new messages)
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Additional scroll trigger for new messages with a slight delay
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

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
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
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
            horizontalPadding={20}
          />
        </View>
      </TouchableWithoutFeedback>

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
