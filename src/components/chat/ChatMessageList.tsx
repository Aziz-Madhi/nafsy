/**
 * Chat Message List Component
 * Handles the main message list with FlashList
 */

import React, { RefObject, memo, useCallback } from 'react';
import { FlashList } from '@shopify/flash-list';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

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
  header?: React.ReactNode;
  footer?: React.ReactNode;
  topPadding?: number;
  onScroll?: (e: any) => void;
  onScrollBeginDrag?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollBegin?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const ChatMessageList = memo(function ChatMessageList({
  flashListRef,
  messages,
  renderMessage,
  keyExtractor,
  getItemType,
  horizontalPadding,
  header,
  footer,
  topPadding = 0,
  onScroll,
  onScrollBeginDrag,
  onScrollEndDrag,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
}: ChatMessageListProps) {
  // Content container style with proper bottom padding for floating tab bar with input
  const contentContainerStyle = {
    paddingHorizontal: horizontalPadding,
    paddingTop: topPadding,
    paddingBottom: 160, // Account for floating tab bar with integrated input
  };

  // Fallback handler: if scrollToIndex runs before measurement is ready,
  // approximate with offset and retry shortly after.
  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      const approxOffset = Math.max(
        0,
        info.index * (info.averageItemLength || 84)
      );
      try {
        flashListRef.current?.scrollToOffset({
          offset: approxOffset,
          animated: false,
        } as any);
      } catch {}
      setTimeout(() => {
        try {
          flashListRef.current?.scrollToIndex({
            index: info.index,
            animated: false,
            viewPosition: 0,
          } as any);
        } catch {}
      }, 32);
    },
    [flashListRef]
  );

  return (
    <FlashList
      ref={flashListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      estimatedItemSize={84}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      onScrollToIndexFailed={onScrollToIndexFailed as any}
      onScroll={onScroll}
      onScrollBeginDrag={onScrollBeginDrag as any}
      onScrollEndDrag={onScrollEndDrag as any}
      onMomentumScrollBegin={onMomentumScrollBegin as any}
      onMomentumScrollEnd={onMomentumScrollEnd as any}
      // Ensure onScroll fires consistently for near-bottom detection
      scrollEventThrottle={16}
      // Ensure scroll indicator doesn't overlap with floating tab bar
      scrollIndicatorInsets={{ bottom: 160 }}
    />
  );
});
