/**
 * Main Chat Screen Component
 * Orchestrates all chat-related components
 */

import React, { useRef, useCallback, useEffect, memo } from 'react';
import { View, TouchableWithoutFeedback, Keyboard } from 'react-native';
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

  // Auto-scroll to bottom when messages change or new messages arrive
  const scrollToBottom = useCallback(() => {
    if (flashListRef.current && messages.length > 0) {
      // Reduced timeout for faster response
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 50); // Much shorter timeout for better UX
    }
  }, [messages.length]);

  // Scroll to bottom when messages change (session switch or new messages)
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Simplified scroll trigger - no additional delay
  useEffect(() => {
    if (messages.length > 0) {
      // Immediate scroll for new messages
      scrollToBottom();
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
        chatType={activeChatType}
      />
    ),
    [activeChatType]
  );

  const keyExtractor = useCallback((item: Message) => item._id, []);
  const getItemType = useCallback((item: Message) => item.role, []);

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
                <ChatMessageList
                  flashListRef={flashListRef}
                  messages={messages}
                  renderMessage={renderMessage}
                  keyExtractor={keyExtractor}
                  getItemType={getItemType}
                  horizontalPadding={20}
                />
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
