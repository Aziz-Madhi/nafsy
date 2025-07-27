/**
 * Chat Message List Component
 * Handles the main message list with FlashList
 */

import React, { RefObject, memo, useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';
import { ChatWelcomeHeader } from './ChatWelcomeHeader';
import { QuickRepliesSection } from './QuickRepliesSection';

export interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  _creationTime: number;
}

interface QuickReply {
  text: string;
  icon: string;
}

interface ChatMessageListProps {
  flashListRef: RefObject<FlashList<Message>>;
  messages: Message[];
  renderMessage: ({ item }: { item: Message }) => React.ReactElement;
  keyExtractor: (item: Message) => string;
  getItemType: (item: Message) => string;
  welcomeSubtitle: string;
  isTyping: boolean;
  showQuickReplies: boolean;
  quickReplies: QuickReply[];
  horizontalPadding: number;
  onQuickReply: (text: string) => void;
}

export const ChatMessageList = memo(function ChatMessageList({
  flashListRef,
  messages,
  renderMessage,
  keyExtractor,
  getItemType,
  welcomeSubtitle,
  isTyping,
  showQuickReplies,
  quickReplies,
  horizontalPadding,
  onQuickReply,
}: ChatMessageListProps) {
  // Memoize header component to prevent unnecessary re-renders
  const headerComponent = useMemo(() => {
    const HeaderComponent = () => (
      <ChatWelcomeHeader subtitle={welcomeSubtitle} />
    );
    HeaderComponent.displayName = 'ChatMessageListHeader';
    return HeaderComponent;
  }, [welcomeSubtitle]);

  // Memoize footer component to prevent unnecessary re-renders
  const footerComponent = useMemo(() => {
    const FooterComponent = () => (
      <QuickRepliesSection
        isTyping={isTyping}
        showQuickReplies={showQuickReplies}
        messagesLength={messages.length}
        quickReplies={quickReplies}
        onQuickReply={onQuickReply}
      />
    );
    FooterComponent.displayName = 'ChatMessageListFooter';
    return FooterComponent;
  }, [isTyping, showQuickReplies, messages.length, quickReplies, onQuickReply]);

  // Memoize content container style
  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: horizontalPadding,
      paddingTop: 0,
    }),
    [horizontalPadding]
  );

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
      ListHeaderComponent={headerComponent}
      ListFooterComponent={footerComponent}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
});
