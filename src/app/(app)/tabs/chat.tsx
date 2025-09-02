import React, { useCallback, useEffect } from 'react';
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
  } = useChatUIStore();

  // Session management - only for coach and companion (event has no sessions)
  const currentMainSessionId = useCurrentMainSessionId();
  const currentCoachSessionId = useCurrentCoachSessionId();
  const currentCompanionSessionId = useCurrentCompanionSessionId();
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
    api.mainChat.getCurrentMainSessionId,
    isLoaded && user ? {} : 'skip'
  );

  // Determine active session based on chat type - no auto-loading
  // Event chat has no sessions (overlay-only)
  const getActiveSessionId = () => {
    switch (activeChatType) {
      case 'coach':
        return currentCoachSessionId || currentMainSessionId;
      case 'event':
        return null; // Event chat has no persistent sessions
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

  // Select messages based on active chat type
  // Event messages are not shown in main chat - only in overlay
  const getChatMessages = () => {
    switch (activeChatType) {
      case 'coach':
        return coachMessages;
      case 'event':
        return []; // Event messages are overlay-only, never shown in main chat
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

  // Add streaming hooks for AI responses
  const coachStreaming = useStreamingChat('coach');
  const companionStreaming = useStreamingChat('companion');

  // Keep mutations for session creation and user upsert
  const upsertUser = useMutation(api.auth.upsertUser);
  const createCompanionSession = useMutation(
    api.companionChat.createCompanionChatSession
  );
  const createMainSession = useMutation(api.mainChat.createMainChatSession);

  // Initialize with empty chat on app start (no auto-loading of previous sessions)
  useEffect(() => {
    if (isLoaded && user) {
      // Always start with empty chat to avoid personality conflicts
      initializeEmptyChat();
    }
  }, [isLoaded, user, initializeEmptyChat]);

  // Auth is handled by root gate - no early returns needed

  // Create user if doesn't exist
  useEffect(() => {
    if (user && isLoaded && currentUser === null && user.id) {
      upsertUser({
        clerkId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || '',
        name: user.fullName || user.firstName || undefined,
        avatarUrl: user.imageUrl || undefined,
      });
    }
  }, [user, isLoaded, currentUser, upsertUser]);

  // Don't auto-send welcome messages - let users start conversations naturally

  // Transform Convex main chat messages to UI format
  const messages: Message[] =
    mainChatMessages?.map((msg) => ({
      _id: msg._id,
      content: msg.content || '',
      role: msg.role,
      _creationTime: msg._creationTime,
    })) || [];

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
                sessionId = await createMainSession({
                  title: `Therapy Session`,
                });
                await switchToMainSession(sessionId);
                break;
              case 'event':
                // Event chat has no sessions - this should not happen
                console.warn('Event chat should not create sessions');
                return;
              case 'companion':
                sessionId = await createCompanionSession({
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
              // Event messages are handled privately in overlay, not here
              console.warn(
                'Event messages should be handled in overlay, not main chat'
              );
              return;

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
      activeSessionId,
      activeChatType,
      createMainSession,
      createCompanionSession,
      switchToMainSession,
      switchToCompanionSession,
    ]
  );

  // Error dismiss handler
  const handleDismissError = () => setSessionError(null);

  // Vent Chat handlers - now private/local only
  const handleOpenVentChat = useCallback(async () => {
    console.log('🌀 Opening Vent Chat (Private Overlay)');

    // Event chat is now overlay-only, no backend session needed
    // Just open the overlay - no persistence
    setVentChatVisible(true);
  }, [setVentChatVisible]);

  const handleCloseVentChat = useCallback(() => {
    console.log('🌀 Closing Vent Chat');
    setVentChatVisible(false);
    clearVentChat();
  }, [setVentChatVisible, clearVentChat]);

  const handleSendVentMessage = useCallback(
    async (text: string) => {
      if (!user || !isLoaded) return;

      setVentChatLoading(true);
      setCurrentVentMessage(`user:${text}`);

      // Simulate AI response after a delay - no backend storage
      setTimeout(() => {
        const aiResponse =
          'I hear you. Your feelings are valid. Take a deep breath and let it all out.';
        setCurrentVentMessage(`ai:${aiResponse}`);
        setVentChatLoading(false);
      }, 2000);
    },
    [user, isLoaded, setCurrentVentMessage, setVentChatLoading]
  );

  // Handle chat type change with session creation
  // Event type is overlay-only and not part of regular chat switching
  const handleChatTypeChange = useCallback(
    async (type: ChatType) => {
      console.log(`🔄 Switching from ${activeChatType} to ${type}`);

      // Only allow switching between coach and companion for regular chat
      if (type === 'event') {
        // Event chat is overlay-only, don't switch to it in main chat
        return;
      }

      await switchChatType(type);
    },
    [switchChatType, activeChatType]
  );

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
      : coachStreaming.streamingContent;
  const isStreaming =
    activeChatType === 'companion'
      ? companionStreaming.isStreaming
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
