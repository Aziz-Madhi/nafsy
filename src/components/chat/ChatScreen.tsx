/**
 * Main Chat Screen Component
 * Orchestrates all chat-related components
 */

import React, { useRef, useCallback, useEffect, memo } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Keyboard,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
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
  // While streaming, follow the bottom unless the user scrolls away
  const followStreamRef = useRef(false);
  // Track active user interaction to temporarily disable auto-follow
  const userInteractingRef = useRef(false);
  // Global gate: once user interacts during a stream, disable auto-follow until stream ends
  const autoFollowEnabledRef = useRef(true);
  const SCROLL_BOTTOM_THRESHOLD = 120; // px

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const nearBottom = distanceFromBottom < SCROLL_BOTTOM_THRESHOLD;
      isNearBottomRef.current = nearBottom;
      // Update follow flag dynamically but respect user interaction and global gate
      followStreamRef.current =
        nearBottom &&
        !userInteractingRef.current &&
        autoFollowEnabledRef.current
          ? followStreamRef.current || isStreaming || showStreamRow
          : false;
    },
    [isStreaming, showStreamRow]
  );

  // User scroll interaction handlers to pause auto-follow during manual scrolling
  const onScrollBeginDrag = useCallback(() => {
    userInteractingRef.current = true;
    // Immediately pause following to avoid fighting the gesture
    followStreamRef.current = false;
    // Disable auto-follow for the rest of this stream
    autoFollowEnabledRef.current = false;
  }, []);

  const onMomentumScrollBegin = useCallback(() => {
    userInteractingRef.current = true;
    followStreamRef.current = false;
    autoFollowEnabledRef.current = false;
  }, []);

  const onScrollEndDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const nearBottom = distanceFromBottom < SCROLL_BOTTOM_THRESHOLD;
      isNearBottomRef.current = nearBottom;
      // Do not resume auto-follow mid-stream; let user control
      userInteractingRef.current = false;
      followStreamRef.current = false;
    },
    [isStreaming, showStreamRow]
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      const nearBottom = distanceFromBottom < SCROLL_BOTTOM_THRESHOLD;
      isNearBottomRef.current = nearBottom;
      // Keep auto-follow disabled mid-stream
      userInteractingRef.current = false;
      followStreamRef.current = false;
    },
    [isStreaming, showStreamRow]
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
    ({ item }: { item: Message }) => {
      const isStreamRow = item._id === '_streaming';
      const hasText = (item.content || '').trim().length > 0;
      // Stable rule: show copy for any finalized assistant message with text.
      // Never show for the ephemeral streaming row.
      const showCopy = !isStreamRow && item.role === 'assistant' && hasText;

      return (
        <ChatBubble
          message={item.content}
          isUser={item.role === 'user'}
          chatType={activeChatType}
          animated={!isStreamRow}
          showCopy={showCopy}
        />
      );
    },
    [activeChatType]
  );

  // Use stable keys. The ephemeral streaming row has its own id.
  const keyExtractor = useCallback((item: Message) => item._id, []);
  // Give the streaming row a distinct type to avoid measurement collisions
  const getItemType = useCallback(
    (item: Message) => (item._id === '_streaming' ? 'streaming' : item.role),
    []
  );

  // Ephemeral in-list streaming row to avoid footer-induced layout shifts
  const [showStreamRow, setShowStreamRow] = React.useState(false);
  const streamStartTimeRef = React.useRef<number | null>(null);
  // Control visibility of the ephemeral streaming row. We keep it mounted while
  // tokens are still rendering locally, even if SSE has completed and isStreaming
  // has flipped to false. This prevents the final server message from appearing
  // before the streamed text visually finishes.
  useEffect(() => {
    // When streaming starts, ensure the row is visible and follow enabled
    if (isStreaming) {
      if (!showStreamRow) {
        streamStartTimeRef.current = Date.now();
        setShowStreamRow(true);
      }
      // Re-enable auto-follow at the beginning of a new stream
      autoFollowEnabledRef.current = true;
      if (isNearBottomRef.current) followStreamRef.current = true;
      return;
    }

    // If not streaming anymore but the row is still showing, decide when to hide.
    if (showStreamRow) {
      // Determine length of finalized assistant content (if present)
      let lastUserIdx = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserIdx = i;
          break;
        }
      }
      const finalizedAssistant =
        lastUserIdx >= 0 && messages[lastUserIdx + 1]?.role === 'assistant'
          ? messages[lastUserIdx + 1]
          : null;
      const targetLen = finalizedAssistant?.content?.length ?? 0;

      // If we don't know the target length, fall back to a short grace timer
      if (!targetLen) {
        const t = setTimeout(() => {
          setShowStreamRow(false);
          streamStartTimeRef.current = null;
          followStreamRef.current = false;
          // Stream fully ended; reset auto-follow for next time
          autoFollowEnabledRef.current = true;
        }, 800);
        return () => clearTimeout(t);
      }

      // Hold the row until the locally rendered text catches up to the
      // finalized assistant content length (or until timeout for safety)
      let cancelled = false;
      const start = Date.now();
      const check = () => {
        if (cancelled) return;
        const currentLen = (streamingContent || '').length;
        const done = currentLen >= targetLen - 1; // small tolerance
        const timedOut = Date.now() - start > 2500;
        if (done || timedOut) {
          setShowStreamRow(false);
          streamStartTimeRef.current = null;
          followStreamRef.current = false;
          autoFollowEnabledRef.current = true;
        } else {
          setTimeout(check, 60);
        }
      };
      const id = setTimeout(check, 60);
      return () => {
        cancelled = true;
        clearTimeout(id);
      };
    }
  }, [isStreaming, showStreamRow, streamingContent, messages]);

  // Scroll on new rows only if near bottom. Do NOT react to streaming text updates
  // or ephemeral row toggling to avoid layout thrash while streaming.
  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Detect user-sent message appended at the end and force-scroll to bottom
  const lastIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (lastIdRef.current !== last._id) {
      // New tail message detected
      if (last.role === 'user') {
        forceScrollToBottom();
        // When user sends, prepare to follow the upcoming stream
        followStreamRef.current = true;
      }
      lastIdRef.current = last._id;
    }
  }, [messages, forceScrollToBottom]);

  // Keep anchored to bottom while the streaming row grows, without jumpy animations
  useEffect(() => {
    if (!showStreamRow) return;
    if (!flashListRef.current) return;
    if (!streamingContent || streamingContent.length === 0) return;
    // Do not auto-scroll while the user is actively interacting
    if (userInteractingRef.current) return;
    // Respect global auto-follow disabling after user interaction
    if (!autoFollowEnabledRef.current) return;
    // Only follow if user is near bottom or follow flag is set
    if (!isNearBottomRef.current && !followStreamRef.current) return;
    followStreamRef.current = true;
    const raf = requestAnimationFrame(() => {
      try {
        // Avoid passing params to sidestep platform-specific scrollTo bugs
        flashListRef.current?.scrollToEnd();
      } catch {}
      // Second pass after layout settles
      setTimeout(() => {
        try {
          flashListRef.current?.scrollToEnd();
        } catch {}
      }, 50);
    });
    return () => cancelAnimationFrame(raf);
  }, [showStreamRow, streamingContent]);
  const streamingRow: Message | null =
    showStreamRow && streamingContent
      ? {
          _id: '_streaming',
          content: streamingContent,
          role: 'assistant',
          _creationTime: streamStartTimeRef.current ?? Date.now(),
        }
      : null;

  const displayMessages = React.useMemo(() => {
    if (!streamingRow) return messages;
    // Hide any assistant messages that appear after the latest user message
    // while streaming is in progress. This guarantees a single assistant
    // bubble (the ephemeral streaming row) for the current turn.
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx >= 0) {
      return [...messages.slice(0, lastUserIdx + 1), streamingRow];
    }
    return [streamingRow];
  }, [messages, streamingRow]);

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
                    onScrollBeginDrag={onScrollBeginDrag}
                    onScrollEndDrag={onScrollEndDrag}
                    onMomentumScrollBegin={onMomentumScrollBegin}
                    onMomentumScrollEnd={onMomentumScrollEnd}
                    extraData={{ showStreamRow, streamingContent }}
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
