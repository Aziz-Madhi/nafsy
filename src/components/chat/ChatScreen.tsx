/**
 * Main Chat Screen Component
 * Orchestrates all chat-related components
 */

import React, { useRef, useCallback, useEffect, memo } from 'react';
import { View, TouchableWithoutFeedback, Keyboard, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

import { ChatHeader } from './ChatHeader';
import { SessionStatusDisplay } from './SessionStatusDisplay';
import { ChatMessageList, Message } from './ChatMessageList';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ChatBubble } from './ChatComponents';
import { VentChatOverlay } from './VentChatOverlay';
import { ChatType, useChatUIStore } from '~/store/useChatUIStore';
import Animated from 'react-native-reanimated';
import { ChatPersonalityHeader } from './ChatPersonalityHeader';
import { Text } from '~/components/ui/text';
import { WifiOff } from 'lucide-react-native';
import { useColors } from '~/hooks/useColors';

interface ChatScreenProps {
  // State
  messages: Message[];
  showHistorySidebar: boolean;
  sessionSwitchLoading: boolean;
  sessionError: string | null;
  showVentChat?: boolean;
  ventCurrentMessage?: string | null;
  ventLoading?: boolean;

  // Data
  navigationBarPadding: number;
  isOnline?: boolean;

  // Streaming
  streamingContent?: string;
  isStreaming?: boolean;

  // Actions
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  onSessionSelect: (sessionId: string) => void;
  onDismissError: () => void;
  onSendMessage: (message: string) => void;
  onOpenVentChat?: () => void;
  onCloseVentChat?: () => void;
  onSendVentMessage?: (message: string) => Promise<void>;

  // Chat type management
  activeChatType?: ChatType;
  onChatTypeChange?: (type: ChatType) => void;
}

export const ChatScreen = memo(function ChatScreen({
  messages,
  showHistorySidebar,
  sessionSwitchLoading,
  sessionError,
  showVentChat = false,
  ventCurrentMessage = null,
  ventLoading = false,
  navigationBarPadding,
  isOnline = true,
  streamingContent = '',
  isStreaming = false,
  onOpenSidebar,
  onCloseSidebar,
  onSessionSelect,
  onDismissError,
  onSendMessage,
  onOpenVentChat,
  onCloseVentChat,
  onSendVentMessage,
  activeChatType = 'coach',
  onChatTypeChange,
}: ChatScreenProps) {
  const flashListRef = useRef<FlashList<Message>>(null as any);
  const colors = useColors();

  // Read typing state from shared store to hide intro while composing
  const coachInput = useChatUIStore((s) => s.coachChatInput || s.mainChatInput);
  const companionInput = useChatUIStore((s) => s.companionChatInput);
  const chatInputFocused = useChatUIStore((s) => s.chatInputFocused);
  const currentDraft =
    activeChatType === 'companion' ? companionInput : coachInput;
  const isTyping = !!currentDraft?.trim() || chatInputFocused;

  // Double tap gesture to open Vent Chat
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .runOnJS(true)
    .onStart(() => {
      if (onOpenVentChat) {
        impactAsync(ImpactFeedbackStyle.Medium);
        onOpenVentChat();
      }
    });

  // Auto-scroll only when already near the bottom to avoid jumpiness
  const isNearBottomRef = useRef(true);
  const SCROLL_BOTTOM_THRESHOLD = 120; // px

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      isNearBottomRef.current = distanceFromBottom < SCROLL_BOTTOM_THRESHOLD;
    },
    []
  );

  const scrollToBottom = useCallback(() => {
    if (!flashListRef.current || messages.length === 0) return;
    if (!isNearBottomRef.current) return; // respect user scroll
    setTimeout(() => {
      flashListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }, [messages.length]);

  // Force scroll used when the user submits a message, regardless of position
  const forceScrollToBottom = useCallback(() => {
    if (!flashListRef.current || messages.length === 0) return;
    requestAnimationFrame(() => {
      flashListRef.current?.scrollToEnd({ animated: true });
      // Second pass after layout settles (prevents mid-list anchoring)
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: true });
      }, 90);
    });
  }, [messages.length]);

  // Do not force-scroll on each streaming tick; allow user to scroll freely

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
        chatType={activeChatType}
      />
    ),
    [activeChatType]
  );

  const keyExtractor = useCallback((item: Message) => item._id, []);
  const getItemType = useCallback((item: Message) => item.role, []);

  // While streaming, prefer showing the footer and hide the newly inserted
  // finalized assistant message to avoid sudden switch and duplication.
  // Keep the footer visible until the persisted assistant message appears
  const lastMessage = messages[messages.length - 1];
  function normalize(s?: string) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }
  const hasFinalAssistant =
    !!lastMessage &&
    lastMessage.role === 'assistant' &&
    typeof lastMessage.content === 'string' &&
    lastMessage.content.length > 0;
  const nLast = normalize(lastMessage?.content);
  const nStream = normalize(streamingContent);
  const finalMatchesStream = hasFinalAssistant
    ? nLast === nStream ||
      nLast.endsWith(nStream) ||
      nStream.endsWith(nLast) ||
      nLast.startsWith(nStream) ||
      nStream.startsWith(nLast)
    : false;
  const showStreamingFooter = Boolean(streamingContent) && (isStreaming || !finalMatchesStream);

  // Scroll on new rows only if near bottom. Avoid reacting to text updates.
  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, showStreamingFooter]);

  // Detect user-sent message appended at the end and force-scroll to bottom
  const lastIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (lastIdRef.current !== last._id) {
      // New tail message detected
      if (last.role === 'user') {
        forceScrollToBottom();
      }
      lastIdRef.current = last._id;
    }
  }, [messages, forceScrollToBottom]);
  const displayMessages = (() => {
    if (!isStreaming || messages.length === 0) return messages;
    const last = messages[messages.length - 1];
    if (last.role === 'assistant') {
      return messages.slice(0, -1);
    }
    return messages;
  })();

  return (
    <View className="flex-1 bg-background">
      <GestureDetector gesture={doubleTapGesture}>
        <View className="flex-1">
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
            <View
              className="flex-1"
              style={{ paddingBottom: navigationBarPadding }}
            >
              <ChatHeader
                onOpenSidebar={onOpenSidebar}
                activeChatType={activeChatType}
                onChatTypeChange={onChatTypeChange}
              />

              <SessionStatusDisplay
                isLoading={sessionSwitchLoading}
                error={sessionError}
                onDismissError={onDismissError}
              />

              {/* Offline Banner */}
              {!isOnline && (
                <View
                  className="mx-4 mb-2 p-3 rounded-xl flex-row items-center gap-3 border border-border/20"
                  style={{
                    backgroundColor: colors.card,
                  }}
                >
                  <WifiOff size={20} color={colors.error} />
                  <Text
                    className="flex-1 text-sm"
                    style={{ color: colors.mutedForeground }}
                  >
                    You&apos;re offline - Chat history only
                  </Text>
                </View>
              )}

              {messages.length === 0 && !isTyping ? (
                <View className="flex-1 items-center justify-center px-8">
                  <View style={{ marginBottom: 185 }}>
                    <ChatPersonalityHeader chatType={activeChatType} />
                  </View>
                </View>
              ) : (
                <View className="flex-1">
                  <ChatMessageList
                    flashListRef={flashListRef}
                    messages={displayMessages}
                    renderMessage={renderMessage}
                    keyExtractor={keyExtractor}
                    getItemType={getItemType}
                    horizontalPadding={20}
                    onScroll={handleScroll}
                    footer={
                      showStreamingFooter ? (
                        <View className="w-full pb-2">
                          <ChatBubble
                            message={streamingContent}
                            isUser={false}
                            timestamp={new Date().toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            chatType={activeChatType}
                            animated={false}
                          />
                        </View>
                      ) : undefined
                    }
                  />
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </GestureDetector>

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        visible={showHistorySidebar}
        onClose={onCloseSidebar}
        onSessionSelect={onSessionSelect}
      />

      {/* Vent Chat Overlay */}
      {onCloseVentChat && onSendVentMessage && (
        <VentChatOverlay
          visible={showVentChat}
          onClose={onCloseVentChat}
          onSendMessage={onSendVentMessage}
          currentMessage={ventCurrentMessage}
          isLoading={ventLoading}
        />
      )}
    </View>
  );
});
