/**
 * Chat Message List Component
 * Handles the main message list with FlashList
 */

import React, { RefObject, memo } from 'react';
import { FlashList } from '@shopify/flash-list';

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
  horizontalPadding: number;
  footer?: React.ReactNode;
  onScroll?: (e: any) => void;
}

export const ChatMessageList = memo(function ChatMessageList({
  flashListRef,
  messages,
  renderMessage,
  keyExtractor,
  getItemType,
  horizontalPadding,
  footer,
  onScroll,
}: ChatMessageListProps) {
  // Content container style with proper bottom padding for floating tab bar with input
  const contentContainerStyle = {
    paddingHorizontal: horizontalPadding,
    paddingTop: 0,
    paddingBottom: 160, // Account for floating tab bar with integrated input
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
      ListHeaderComponent={undefined}
      ListFooterComponent={footer}
      contentInsetAdjustmentBehavior="automatic"
      onScroll={onScroll}
      // Ensure scroll indicator doesn't overlap with floating tab bar
      scrollIndicatorInsets={{ bottom: 160 }}
    />
  );
});
