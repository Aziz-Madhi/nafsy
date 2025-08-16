/**
 * Chat Message List Component
 * Handles the main message list with FlashList
 */

import React, { RefObject, memo } from 'react';
import { FlashList } from '@shopify/flash-list';
import { ChatWelcomeHeader } from './ChatWelcomeHeader';

export interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  _creationTime: number;
}

interface ChatMessageListProps {
  flashListRef: RefObject<FlashList<Message>>;
  messages: Message[];
  renderMessage: ({ item }: { item: Message }) => React.ReactElement;
  keyExtractor: (item: Message) => string;
  getItemType: (item: Message) => string;
  welcomeSubtitle: string;
  horizontalPadding: number;
}

export const ChatMessageList = memo(function ChatMessageList({
  flashListRef,
  messages,
  renderMessage,
  keyExtractor,
  getItemType,
  welcomeSubtitle,
  horizontalPadding,
}: ChatMessageListProps) {
  // Header component
  const HeaderComponent = () => (
    <ChatWelcomeHeader subtitle={welcomeSubtitle} />
  );

  // Content container style with proper bottom padding for input + tab bar
  const contentContainerStyle = {
    paddingHorizontal: horizontalPadding,
    paddingTop: 0,
    paddingBottom: 140, // Account for tab bar (80px) + input area (~60px)
  };

  return (
    <FlashList
      ref={flashListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      estimatedItemSize={100}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={HeaderComponent}
      contentInsetAdjustmentBehavior="automatic"
      // Ensure scroll indicator doesn't overlap with input/tab bar
      scrollIndicatorInsets={{ bottom: 140 }}
      // Auto-scroll to end behavior
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 100,
      }}
    />
  );
});
