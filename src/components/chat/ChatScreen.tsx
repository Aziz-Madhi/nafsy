/**
 * Main Chat Screen Component
 * Orchestrates all chat-related components
 */

import React, { useRef, useCallback, useEffect, memo } from 'react';
import { View, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

import { ChatHeader } from './ChatHeader';
import { SessionStatusDisplay } from './SessionStatusDisplay';
import { ChatMessageList, Message } from './ChatMessageList';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ChatBubble } from './ChatComponents';
import { VentChatOverlay } from './VentChatOverlay';
import { ChatType } from '~/store/useChatUIStore';
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
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = React.useState(0);
  const [listHeaderHeight, setListHeaderHeight] = React.useState(0);
  // No jump-to-latest UI; user controls scrolling entirely
  // No separate lingering state; we derive visibility from stream state + data

  // Keep intro visible until the first message exists (no typing-based hiding)

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

  // Single tap anywhere to dismiss keyboard (but give double tap priority)
  const singleTapDismiss = Gesture.Tap()
    .maxDuration(250)
    .runOnJS(true)
    .onStart(() => Keyboard.dismiss())
    .requireExternalGestureToFail(doubleTapGesture);

  // No auto-scrolling or follow behavior; user controls scroll.

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isSyntheticAssistant = item._id.startsWith('_assistantFor:');
      const hasText = (item.content || '').trim().length > 0;
      // Show copy for all assistant messages to keep height stable
      const showCopy =
        item.role === 'assistant' && hasText && !isSyntheticAssistant;
      // Never animate assistant bubbles to avoid end-of-stream glitches
      const shouldAnimate = item.role === 'user' && !isSyntheticAssistant;

      return (
        <ChatBubble
          message={item.content}
          isUser={item.role === 'user'}
          chatType={activeChatType}
          animated={shouldAnimate}
          showCopy={showCopy}
        />
      );
    },
    [activeChatType]
  );

  // Use stable keys. The ephemeral streaming row has its own id.
  const keyExtractor = useCallback((item: Message) => item._id, []);
  // Give the synthetic streaming row a distinct type to avoid measurement collisions
  // and recycler swaps when the final assistant message arrives.
  const getItemType = useCallback((item: Message) => {
    if (item._id.startsWith('_assistantFor:')) return 'assistant-stream';
    return item.role;
  }, []);

  // Deduplicate optimistic pending user bubbles against server user messages.
  // If a server user message exists with identical content, prefer it and drop
  // any local `_local:` user duplicates from the displayed list.
  const messagesNoDup = React.useMemo(() => {
    if (!messages || messages.length === 0) return messages;
    const lastServerUser = [...messages]
      .reverse()
      .find((m) => m.role === 'user' && !m._id.startsWith('_local:'));
    if (!lastServerUser) return messages;
    const serverText = (lastServerUser.content || '').trim();
    if (!serverText) return messages;
    // Filter out any pending local user bubbles with same text
    return messages.filter(
      (m) =>
        !(
          m.role === 'user' &&
          m._id.startsWith('_local:') &&
          (m.content || '').trim() === serverText
        )
    );
  }, [messages]);

  // Derived signal for whether to show a synthetic streaming row
  // Keep visible while streaming, and after streaming ends until
  // the final assistant message appears.
  const showStreamRow = React.useMemo(() => {
    const hasStreamText = (streamingContent || '').trim().length > 0;
    if (!hasStreamText) return false;
    if (!messagesNoDup || messagesNoDup.length === 0) return true;
    let lastUserIdx = -1;
    for (let i = messagesNoDup.length - 1; i >= 0; i--) {
      if (messagesNoDup[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return true;
    const hasAssistantAfterUser =
      !!messagesNoDup[lastUserIdx + 1] &&
      messagesNoDup[lastUserIdx + 1].role === 'assistant';
    return !hasAssistantAfterUser;
  }, [messagesNoDup, streamingContent]);

  // Build display list in chronological order (oldest -> newest). If streaming
  // and the last message is from the user, append a synthetic assistant row
  // to stream beneath it.
  const displayMessages = React.useMemo(() => {
    if (!messagesNoDup || messagesNoDup.length === 0) return [] as Message[];
    const chron = [...messagesNoDup];

    // Find the last user message and the assistant that immediately follows it
    let lastUserIdx = -1;
    for (let i = chron.length - 1; i >= 0; i--) {
      if (chron[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }

    if (lastUserIdx === -1) return chron;

    const lastUser = chron[lastUserIdx];
    const next = chron[lastUserIdx + 1];
    const hasAssistantAfterUser = next && next.role === 'assistant';

    // Build UI list so that the assistant following the last user uses a stable
    // synthetic id tied to that user. This prevents key swaps when streaming ends.
    const before = chron.slice(0, lastUserIdx + 1);
    const after = chron.slice(lastUserIdx + 1);

    const syntheticAssistant: Message | null = (() => {
      const id = `_assistantFor:${lastUser._id}`;
      // Show streaming content while streaming, or after streaming if the
      // final message hasn't appeared yet.
      if (showStreamRow) {
        const text = streamingContent || '…';
        return {
          _id: id,
          content: text,
          role: 'assistant',
          _creationTime: Date.now(),
        };
      }
      return null;
    })();

    if (syntheticAssistant) {
      return [...before, syntheticAssistant, ...after];
    }
    return chron;
  }, [messagesNoDup, isStreaming, streamingContent, showStreamRow]);

  // No programmatic scrolling: user controls the viewport.

  // No jump-to-latest pill or auto-scroll

  // No lingering timeouts; display is fully derived above.

  return (
    <View className="flex-1 bg-background">
      <GestureDetector
        gesture={Gesture.Simultaneous(doubleTapGesture, singleTapDismiss)}
      >
        <View className="flex-1">
          {/* Fixed header overlay (icons stay visible while scrolling) */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
            }}
            pointerEvents="box-none"
            onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
          >
            <ChatHeader
              onOpenSidebar={onOpenSidebar}
              activeChatType={activeChatType}
              onChatTypeChange={onChatTypeChange}
              onOpenVentChat={onOpenVentChat}
            />
          </View>

          <View
            className="flex-1"
            style={{ paddingBottom: navigationBarPadding }}
          >
            <ChatMessageList
              flashListRef={flashListRef}
              messages={displayMessages}
              renderMessage={renderMessage}
              keyExtractor={keyExtractor}
              getItemType={getItemType}
              horizontalPadding={20}
              topPadding={headerHeight}
              header={
                <View
                  onLayout={(e) =>
                    setListHeaderHeight(e.nativeEvent.layout.height)
                  }
                >
                  <SessionStatusDisplay
                    isLoading={sessionSwitchLoading}
                    error={sessionError}
                    onDismissError={onDismissError}
                  />
                  {!isOnline && (
                    <View
                      className="mx-4 mb-2 p-3 rounded-xl flex-row items-center gap-3 border border-border/20"
                      style={{ backgroundColor: colors.card }}
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
                  {/* Removed personality header from list header; now centered overlay below */}
                </View>
              }
            />
          </View>
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

      {/* Personality Center Overlay (coach/companion) */}
      {(activeChatType === 'coach' || activeChatType === 'companion') &&
        messages.length === 0 && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: headerHeight,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              // Nudge further upward to center better above composer
              transform: [{ translateY: -80 }],
            }}
          >
            <View className="px-8">
              <ChatPersonalityHeader chatType={activeChatType} />
            </View>
          </View>
        )}
    </View>
  );
});
