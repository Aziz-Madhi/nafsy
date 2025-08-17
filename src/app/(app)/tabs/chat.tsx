import React, { useCallback, useEffect } from 'react';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useTranslation } from '~/hooks/useTranslation';
import {
  useHistorySidebarVisible,
  useCurrentMainSessionId,
  useSessionError,
  useSessionSwitchLoading,
  useChatUIStore,
} from '~/store';
import { ChatScreen } from '~/components/chat';

// Auth is handled by root _layout.tsx - all screens here are protected

interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  _creationTime: number;
}

const getWelcomeMessage = (t: any) => t('chat.welcomeMessage');

// Screen padding is handled by useScreenPadding hook

export default function ChatTab() {
  // ===== ALL HOOKS FIRST (before any early returns) =====
  const { user, isLoaded } = useUserSafe();
  const { t } = useTranslation();

  // No specific spacing needed - chat handles its own

  // Zustand hooks
  const showHistorySidebar = useHistorySidebarVisible();
  const { setHistorySidebarVisible } = useChatUIStore();

  // Session management
  const currentMainSessionId = useCurrentMainSessionId();
  const sessionError = useSessionError();
  const sessionSwitchLoading = useSessionSwitchLoading();
  const switchToMainSession = useChatUIStore(
    (state) => state.switchToMainSession
  );
  const setSessionError = useChatUIStore((state) => state.setSessionError);

  // Convex hooks - only execute when auth is stable and user exists
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && user ? {} : 'skip'
  );
  const serverMainSessionId = useQuery(
    api.mainChat.getCurrentMainSessionId,
    isLoaded && user ? {} : 'skip'
  );

  // Use the current session ID from store, fallback to server session ID
  const activeSessionId = currentMainSessionId || serverMainSessionId;

  console.log('🔍 Query params:', {
    isLoaded,
    activeSessionId,
    currentMainSessionId,
    serverMainSessionId,
  });

  // Query args for messages
  const queryArgs =
    isLoaded && user && activeSessionId
      ? { limit: 50, sessionId: activeSessionId }
      : ('skip' as const);

  const mainChatMessages = useQuery(
    api.mainChat.getMainChatMessages,
    queryArgs
  );

  console.log('📨 Messages count:', mainChatMessages?.length || 0);
  const sendMainMessage = useMutation(api.mainChat.sendMainMessage);
  const createUser = useMutation(api.users.createUser);

  // Sync server session with local store - only on initial load
  useEffect(() => {
    if (serverMainSessionId && !currentMainSessionId) {
      // Only set server session if no local session is selected
      const { setCurrentMainSessionId } = useChatUIStore.getState();
      setCurrentMainSessionId(serverMainSessionId);
    }
  }, [serverMainSessionId, currentMainSessionId]);

  // Auth is handled by root gate - no early returns needed

  // Create user if doesn't exist
  useEffect(() => {
    if (user && isLoaded && currentUser === null && user.id) {
      createUser({
        clerkId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || '',
        name: user.fullName || user.firstName || undefined,
        avatarUrl: user.imageUrl || undefined,
      });
    }
  }, [user, isLoaded, currentUser, createUser]);

  // Send welcome message on first load
  useEffect(() => {
    if (
      currentUser &&
      isLoaded &&
      mainChatMessages &&
      mainChatMessages.length === 0
    ) {
      sendMainMessage({
        content: getWelcomeMessage(t),
        role: 'assistant',
        sessionId: currentMainSessionId || serverMainSessionId || undefined,
      });
    }
  }, [
    currentUser,
    isLoaded,
    mainChatMessages,
    sendMainMessage,
    serverMainSessionId,
    currentMainSessionId,
  ]);

  // Transform Convex main chat messages to UI format
  const messages: Message[] =
    mainChatMessages
      ?.map((msg) => ({
        _id: msg._id,
        content: msg.content || '',
        role: msg.role,
        _creationTime: msg._creationTime,
      }))
      .reverse() || [];

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

  // Chat message sending
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!currentUser || !isLoaded) return;

      try {
        // Send user message
        await sendMainMessage({
          content: text,
          role: 'user',
          sessionId: currentMainSessionId || serverMainSessionId || undefined,
        });

        // Simulate AI response
        setTimeout(async () => {
          await sendMainMessage({
            content: "I'm here to listen and support you. How can I help?",
            role: 'assistant',
            sessionId: currentMainSessionId || serverMainSessionId || undefined,
          });
        }, 2000);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [
      currentUser,
      isLoaded,
      sendMainMessage,
      currentMainSessionId,
      serverMainSessionId,
    ]
  );

  // Welcome subtitle
  const welcomeSubtitle = t('chat.welcomeSubtitle');

  // Error dismiss handler
  const handleDismissError = () => setSessionError(null);

  return (
    <ChatScreen
      messages={messages}
      showHistorySidebar={showHistorySidebar}
      sessionSwitchLoading={sessionSwitchLoading}
      sessionError={sessionError}
      welcomeSubtitle={welcomeSubtitle}
      navigationBarPadding={0} // No padding needed - using custom navigation
      onOpenSidebar={handleOpenSidebar}
      onCloseSidebar={handleCloseSidebar}
      onSessionSelect={handleSessionSelect}
      onDismissError={handleDismissError}
      onSendMessage={handleSendMessage}
    />
  );
}
