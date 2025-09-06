import React, { useCallback, useEffect, useRef } from 'react';
import { sendMessageRef } from './_layout';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Alert } from 'react-native';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import {
  useOfflineChatMessages,
  useOfflineSendMessage,
  useNetworkStatus,
} from '~/hooks/useOfflineData';
import { useStreamingChat } from '~/hooks/useStreamingChat';
import {
  useHistorySidebarVisible,
  useCurrentMainSessionId,
  useCurrentCoachSessionId,
  useCurrentCompanionSessionId,
  useSessionError,
  useSessionSwitchLoading,
  useChatUIStore,
  useVentChatVisible,
  useCurrentVentMessage,
  useVentChatLoading,
  useActiveChatType,
  ChatType,
} from '~/store';
import { ChatScreen } from '~/components/chat';
import { useAuth } from '@clerk/clerk-expo';
import { generateConvexUrl } from '~/lib/ai/streaming';
// Auth is handled by root _layout.tsx - all screens here are protected

interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  _creationTime: number;
}

// Screen padding is handled by useScreenPadding hook

export default function ChatTab() {
  // ===== ALL HOOKS FIRST (before any early returns) =====
  const { user, isLoaded } = useUserSafe();
  const { isOnline } = useNetworkStatus();

  // No specific spacing needed - chat handles its own

  // Zustand hooks
  const showHistorySidebar = useHistorySidebarVisible();
  const showVentChat = useVentChatVisible();
  const currentVentMessage = useCurrentVentMessage();
  const ventChatLoading = useVentChatLoading();
  const activeChatType = useActiveChatType();
  const {
    setHistorySidebarVisible,
    setVentChatVisible,
    setCurrentVentMessage,
    setVentChatLoading,
    clearVentChat,
    switchChatType,
    initializeEmptyChat,
    setCurrentVentSessionId,
  } = useChatUIStore();

  // Session management
  const currentMainSessionId = useCurrentMainSessionId();
  const currentCoachSessionId = useCurrentCoachSessionId();
  const currentCompanionSessionId = useCurrentCompanionSessionId();
  const currentVentSessionId = useChatUIStore((s) => s.currentVentSessionId);
  const sessionError = useSessionError();
  const sessionSwitchLoading = useSessionSwitchLoading();
  const switchToMainSession = useChatUIStore(
    (state) => state.switchToMainSession
  );
  const switchToCompanionSession = useChatUIStore(
    (state) => state.switchToCompanionSession
  );
  const setSessionError = useChatUIStore((state) => state.setSessionError);

  // Convex hooks - only execute when auth is stable and user exists
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    isLoaded && user ? {} : 'skip'
  );

  // Get server session IDs for coach and companion
  const serverMainSessionId = useQuery(
    api.chat.getCurrentSessionId,
    isLoaded && user && currentUser ? { type: 'main' } : 'skip'
  );

  // Determine active session based on chat type
  const getActiveSessionId = () => {
    switch (activeChatType) {
      case 'coach':
        return currentCoachSessionId || currentMainSessionId;
      case 'event':
        return currentVentSessionId;
      case 'companion':
        return currentCompanionSessionId;
      default:
        return currentMainSessionId;
    }
  };

  const activeSessionId = getActiveSessionId();

  console.log('🔍 Query params:', {
    isLoaded,
    activeSessionId,
    activeChatType,
    currentMainSessionId,
    serverMainSessionId,
  });

  // Use offline-aware hooks for messages
  const coachMessages = useOfflineChatMessages(
    activeChatType === 'coach' ? activeSessionId : null,
    'coach'
  );
  const companionMessages = useOfflineChatMessages(
    activeChatType === 'companion' ? activeSessionId : null,
    'companion'
  );
  const ventMessages = useOfflineChatMessages(
    activeChatType === 'event' ? activeSessionId : null,
    'event'
  );

  // Select messages based on active chat type
  const getChatMessages = () => {
    switch (activeChatType) {
      case 'coach':
        return coachMessages;
      case 'event':
        return ventMessages;
      case 'companion':
        return companionMessages;
      default:
        return coachMessages;
    }
  };

  const mainChatMessages = getChatMessages();

  console.log('📨 Messages count:', mainChatMessages?.length || 0);

  // Use offline-aware send message hooks
  const sendCoachMessage = useOfflineSendMessage('coach');
  const sendCompanionMessage = useOfflineSendMessage('companion');
  const sendVentMessage = useOfflineSendMessage('event');

  // Add streaming hooks for AI responses
  const coachStreaming = useStreamingChat('coach');
  const companionStreaming = useStreamingChat('companion');
  const ventStreaming = useStreamingChat('vent');
  const { getToken } = useAuth();
  const summarizedSessionsRef = useRef(new Set<string>());
  const summarizingInFlightRef = useRef(new Set<string>());

  // Keep mutations for session creation and user upsert
  const upsertUser = useMutation(api.auth.upsertUser);
  const createChatSession = useMutation(api.chat.createChatSession);

  // Initialize with empty chat on app start (no auto-loading of previous sessions)
  useEffect(() => {
    if (isLoaded && user) {
      // Always start with empty chat to avoid personality conflicts
      initializeEmptyChat();
    }
  }, [isLoaded, user, initializeEmptyChat]);

  // Auth is handled by root gate - no early returns needed

  // Removed duplicate upsert here; centralized in (app)/_layout

  // Don't auto-send welcome messages - let users start conversations naturally

  // Transform Convex main chat messages to UI format
  const messages: Message[] =
    mainChatMessages?.map((msg) => ({
      _id: msg._id,
      content: msg.content || '',
      role: msg.role,
      _creationTime: msg._creationTime,
    })) || [];

  // HTTP-driven title summarization after 3 messages
  useEffect(() => {
    const sessionId = activeSessionId;
    if (!sessionId) return;
    if (!isOnline) return;
    if (!messages || messages.length < 3) return;
    if (summarizedSessionsRef.current.has(sessionId)) return;
    if (summarizingInFlightRef.current.has(sessionId)) return;

    const chatTypeKey =
      activeChatType === 'coach'
        ? 'main'
        : activeChatType === 'event'
          ? 'vent'
          : 'companion';

    const firstThree = messages.slice(0, 3).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    (async () => {
      try {
        summarizingInFlightRef.current.add(sessionId);
        const token = await getToken({ template: 'convex' });
        if (!token) return;
        const url = generateConvexUrl('/chat/summarize-title');
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sessionId,
            chatType: chatTypeKey,
            messages: firstThree,
          }),
        });
        if (res.ok) summarizedSessionsRef.current.add(sessionId);
      } catch (e) {
        // best-effort; do not block UI
        console.warn('summarize-title failed', e);
      }
      finally {
        summarizingInFlightRef.current.delete(sessionId);
      }
    })();
  }, [activeSessionId, activeChatType, messages.length, isOnline, getToken]);

  // Simple sidebar handlers
  const handleOpenSidebar = () => {
    impactAsync(ImpactFeedbackStyle.Light);
    setHistorySidebarVisible(true);
  };

  const handleCloseSidebar = () => setHistorySidebarVisible(false);

  const handleSessionSelect = useCallback(
    async (sessionId: string) => {
      console.log('🔄 Switching to session:', sessionId);
      console.log('📱 Current session ID before switch:', currentMainSessionId);

      // Clear any existing errors before starting
      setSessionError(null);

      const success = await switchToMainSession(sessionId);

      console.log('✅ Session switch success:', success);
      console.log(
        '📱 Current session ID after switch:',
        useChatUIStore.getState().currentMainSessionId
      );

      if (success) {
        // Close sidebar on success
        setHistorySidebarVisible(false);
      } else {
        // Error is already set in the store, but we still close the sidebar
        // This allows the user to see the error message in the main UI
        setHistorySidebarVisible(false);
      }
    },
    [
      switchToMainSession,
      setHistorySidebarVisible,
      setSessionError,
      currentMainSessionId,
    ]
  );

  // Optimized message sending with offline check
  const handleSendMessage = useCallback(
    async (text: string) => {
      // Allow sending once auth is ready, even if user doc hasn't hydrated yet
      if (!user || !isLoaded) return;

      // Check if offline
      if (!isOnline) {
        Alert.alert('Offline', 'You need to be online to chat with the AI', [
          { text: 'OK' },
        ]);
        return;
      }

      // Send message immediately without blocking UI
      (async () => {
        try {
          let sessionId = activeSessionId;

          // Create a new session if none exists for this personality
          if (!sessionId) {
            console.log(
              `🆕 Creating new session for ${activeChatType} personality`
            );

            switch (activeChatType) {
              case 'coach':
                sessionId = await createChatSession({
                  type: 'main',
                  title: `Therapy Session`,
                });
                await switchToMainSession(sessionId);
                break;
              case 'event':
                sessionId = await createChatSession({
                  type: 'vent',
                  title: `Quick Vent Session`,
                });
                setCurrentVentSessionId(sessionId);
                break;
              case 'companion':
                sessionId = await createChatSession({
                  type: 'companion',
                  title: `Daily Check-in`,
                });
                await switchToCompanionSession(sessionId);
                break;
            }
          }

          // Send user message based on chat type using offline-aware hooks
          switch (activeChatType) {
            case 'coach':
              const userMsgIdCoach = await sendCoachMessage(text, sessionId);
              // Trigger streaming for AI response
              const coachMessages =
                mainChatMessages?.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })) || [];
              await coachStreaming.sendStreamingMessage(
                text,
                sessionId,
                coachMessages
              );
              break;

            case 'event':
              const userMsgIdVent = await sendVentMessage(text, sessionId);
              const eventMessages =
                mainChatMessages?.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })) || [];
              await ventStreaming.sendStreamingMessage(
                text,
                sessionId,
                eventMessages
              );
              break;

            case 'companion':
              const userMsgIdComp = await sendCompanionMessage(text, sessionId);
              // Trigger streaming for AI response
              const companionMessages =
                mainChatMessages?.map((msg) => ({
                  role: msg.role,
                  content: msg.content,
                })) || [];
              await companionStreaming.sendStreamingMessage(
                text,
                sessionId,
                companionMessages
              );
              break;
          }
        } catch (error) {
          console.error('Failed to send message:', error);
          // If the error is about being offline, show alert
          if ((error as Error).message?.includes('online')) {
            Alert.alert(
              'Offline',
              'You need to be online to chat with the AI',
              [{ text: 'OK' }]
            );
          }
        }
      })();
    },
    [
      user,
      currentUser,
      isLoaded,
      isOnline,
      sendCoachMessage,
      sendCompanionMessage,
      sendVentMessage,
      activeSessionId,
      activeChatType,
      createChatSession,
      setCurrentVentSessionId,
      switchToMainSession,
      switchToCompanionSession,
    ]
  );

  // Error dismiss handler
  const handleDismissError = () => setSessionError(null);

  // Vent Chat overlay handlers now optional; keep no-ops to preserve props
  const handleOpenVentChat = useCallback(async () => {
    setVentChatVisible(true);
  }, [setVentChatVisible]);

  const handleCloseVentChat = useCallback(() => {
    setVentChatVisible(false);
    clearVentChat();
  }, [setVentChatVisible, clearVentChat]);

  const handleSendVentMessage = useCallback(
    async (text: string) => {
      if (!user || !isLoaded) return;
      try {
        setVentChatLoading(true);
        // Ensure a vent session exists
        let sessionId = currentVentSessionId;
        if (!sessionId) {
          sessionId = await createChatSession({
            type: 'vent',
            title: 'Quick Vent Session',
          });
          setCurrentVentSessionId(sessionId);
        }
        // Update overlay with user message instantly
        setCurrentVentMessage(`user:${text}`);
        // Persist user message (unified send)
        await sendVentMessage(text, sessionId);
        // Start streaming AI response (no prior context needed for vent)
        await ventStreaming.sendStreamingMessage(text, sessionId, []);
      } catch (e) {
        console.error('Vent message failed:', e);
      } finally {
        setVentChatLoading(false);
      }
    },
    [
      user,
      isLoaded,
      currentVentSessionId,
      createChatSession,
      setCurrentVentSessionId,
      setCurrentVentMessage,
      setVentChatLoading,
      sendVentMessage,
      ventStreaming,
    ]
  );

  // Handle chat type change
  const handleChatTypeChange = useCallback(
    async (type: ChatType) => {
      console.log(`🔄 Switching from ${activeChatType} to ${type}`);

      await switchChatType(type);
    },
    [switchChatType, activeChatType]
  );

  // Keep overlay UI in sync with vent streaming
  useEffect(() => {
    if (showVentChat && ventStreaming.streamingContent) {
      setCurrentVentMessage(`ai:${ventStreaming.streamingContent}`);
    }
  }, [showVentChat, ventStreaming.streamingContent, setCurrentVentMessage]);

  useEffect(() => {
    if (showVentChat) {
      setVentChatLoading(ventStreaming.isStreaming);
    }
  }, [showVentChat, ventStreaming.isStreaming, setVentChatLoading]);

  // Set the message handler ref for the floating tab bar
  useEffect(() => {
    if (sendMessageRef) {
      sendMessageRef.current = handleSendMessage;
    }
    return () => {
      if (sendMessageRef) {
        sendMessageRef.current = null;
      }
    };
  }, [handleSendMessage]);

  // Get streaming content based on active chat type
  const streamingContent =
    activeChatType === 'companion'
      ? companionStreaming.streamingContent
      : activeChatType === 'event'
        ? ventStreaming.streamingContent
        : coachStreaming.streamingContent;
  const isStreaming =
    activeChatType === 'companion'
      ? companionStreaming.isStreaming
      : activeChatType === 'event'
        ? ventStreaming.isStreaming
        : coachStreaming.isStreaming;

  return (
    <ChatScreen
      messages={messages}
      showHistorySidebar={showHistorySidebar}
      sessionSwitchLoading={sessionSwitchLoading}
      sessionError={sessionError}
      showVentChat={showVentChat}
      ventCurrentMessage={currentVentMessage}
      ventLoading={ventChatLoading}
      navigationBarPadding={0} // No padding needed - using custom navigation
      streamingContent={streamingContent}
      isStreaming={isStreaming}
      onOpenSidebar={handleOpenSidebar}
      onCloseSidebar={handleCloseSidebar}
      onSessionSelect={handleSessionSelect}
      onDismissError={handleDismissError}
      onSendMessage={handleSendMessage}
      onOpenVentChat={handleOpenVentChat}
      onCloseVentChat={handleCloseVentChat}
      onSendVentMessage={handleSendVentMessage}
      activeChatType={activeChatType}
      onChatTypeChange={handleChatTypeChange}
      isOnline={isOnline}
    />
  );
}
