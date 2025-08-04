import React, { useCallback, useMemo, useEffect } from 'react';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  useMainChatTyping,
  useShowQuickReplies,
  useHistorySidebarVisible,
  useCurrentMainSessionId,
  useSessionError,
  useSessionSwitchLoading,
  useChatUIStore,
} from '~/store';
import { useTranslation } from '~/hooks/useTranslation';
import { ChatScreen } from '~/components/chat';

// Auth is now handled at tab layout level - no need for wrapper

// Chat screen handles its own spacing

interface Message {
  _id: string;
  content: string;
  role: 'user' | 'assistant';
  _creationTime: number;
}

const getWelcomeMessage = (t: any) =>
  t('chat.welcomeMessage') ||
  "Hello! I'm here to support your mental wellness journey.";

const getQuickReplies = (t: any) => [
  { text: t('chat.quickReplies.anxious') || "I'm feeling anxious", icon: '😟' },
  {
    text: t('chat.quickReplies.needTalk') || 'I need someone to talk to',
    icon: '💭',
  },
  {
    text: t('chat.quickReplies.trackMood') || 'I want to track my mood',
    icon: '📊',
  },
  {
    text: t('chat.quickReplies.showExercises') || 'Show me exercises',
    icon: '🧘',
  },
];

// Screen padding is handled by useScreenPadding hook

export default function ChatTab() {
  // ===== ALL HOOKS FIRST (before any early returns) =====
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  const { t } = useTranslation();

  // No specific spacing needed - chat handles its own

  // Zustand hooks
  const isTyping = useMainChatTyping();
  const showQuickReplies = useShowQuickReplies();
  const showHistorySidebar = useHistorySidebarVisible();
  const { setMainChatTyping, setShowQuickReplies, setHistorySidebarVisible } =
    useChatUIStore();

  // Session management
  const currentMainSessionId = useCurrentMainSessionId();
  const sessionError = useSessionError();
  const sessionSwitchLoading = useSessionSwitchLoading();
  const switchToMainSession = useChatUIStore(
    (state) => state.switchToMainSession
  );
  const setSessionError = useChatUIStore((state) => state.setSessionError);

  // Convex hooks - only execute when auth is stable
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn && isLoaded ? {} : 'skip'
  );
  const serverMainSessionId = useQuery(
    api.mainChat.getCurrentMainSessionId,
    isSignedIn ? {} : 'skip'
  );

  // Use the current session ID from store, fallback to server session ID
  const activeSessionId = currentMainSessionId || serverMainSessionId;

  console.log('🔍 Query params:', {
    isSignedIn,
    isLoaded,
    activeSessionId,
    currentMainSessionId,
    serverMainSessionId,
  });

  // Memoize query args to ensure proper reactivity
  const queryArgs = useMemo(() => {
    if (!isSignedIn || !isLoaded || !activeSessionId) {
      return 'skip' as const;
    }
    return {
      limit: 50,
      sessionId: activeSessionId,
    };
  }, [isSignedIn, isLoaded, activeSessionId]);

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

  // Auth is handled at tab layout level - no early returns needed

  // Create user if doesn't exist
  useEffect(() => {
    if (user && isSignedIn && isLoaded && currentUser === null && user.id) {
      createUser({
        clerkId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || '',
        name: user.fullName || user.firstName || undefined,
        avatarUrl: user.imageUrl || undefined,
      });
    }
  }, [user, isSignedIn, isLoaded, currentUser, createUser]);

  // Send welcome message on first load
  useEffect(() => {
    if (
      currentUser &&
      isSignedIn &&
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
    isSignedIn,
    isLoaded,
    mainChatMessages,
    sendMainMessage,
    serverMainSessionId,
    currentMainSessionId,
    t,
  ]);

  // Transform Convex main chat messages to UI format with memoization
  const messages: Message[] = useMemo(
    () =>
      mainChatMessages
        ?.map((msg) => ({
          _id: msg._id,
          content: msg.content || '', // Ensure content is never undefined
          role: msg.role,
          _creationTime: msg._creationTime,
        }))
        .reverse() || [],
    [mainChatMessages]
  );

  // Simple sidebar handlers
  const handleOpenSidebar = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    setHistorySidebarVisible(true);
  }, [setHistorySidebarVisible]);

  const handleCloseSidebar = useCallback(() => {
    setHistorySidebarVisible(false);
  }, [setHistorySidebarVisible]);

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

  // Note: handleSendMessage is now managed by MorphingTabBar

  const handleQuickReply = useCallback(
    async (text: string) => {
      if (!currentUser || !isSignedIn || !isLoaded) return;

      impactAsync(ImpactFeedbackStyle.Light);

      // Hide quick replies after first message
      setShowQuickReplies(false);

      // Send user message to main chat
      await sendMainMessage({
        content: text,
        role: 'user',
        sessionId: currentMainSessionId || serverMainSessionId || undefined,
      });

      // Update UI state with Zustand
      setMainChatTyping(true);

      // Simulate AI response
      setTimeout(async () => {
        setMainChatTyping(false);

        // Generate contextual AI response based on user input
        let aiResponseText =
          "I hear you. Let's work through this together. Can you tell me more about what's on your mind?";

        if (
          text.toLowerCase().includes('anxious') ||
          text.toLowerCase().includes('anxiety')
        ) {
          aiResponseText =
            "I understand you're feeling anxious. That can be really challenging. Would you like to try a breathing exercise together, or would you prefer to talk about what's making you feel this way?";
        } else if (
          text.toLowerCase().includes('sad') ||
          text.toLowerCase().includes('depressed')
        ) {
          aiResponseText =
            "I'm sorry you're feeling sad. It's okay to feel this way, and I'm here to support you. Would you like to share what's been weighing on your mind?";
        } else if (text.toLowerCase().includes('mood')) {
          aiResponseText =
            "Tracking your mood is a great step! You can use the Mood tab to log how you're feeling. Would you like me to guide you through it?";
        } else if (text.toLowerCase().includes('exercise')) {
          aiResponseText =
            "Great choice! We have various exercises including breathing techniques, mindfulness, and movement. Check out the Exercises tab, or I can recommend one based on how you're feeling.";
        }

        await sendMainMessage({
          content: aiResponseText,
          role: 'assistant',
          sessionId: currentMainSessionId || serverMainSessionId || undefined,
        });
      }, 2000);
    },
    [
      currentUser,
      sendMainMessage,
      setShowQuickReplies,
      setMainChatTyping,
      currentMainSessionId,
      serverMainSessionId,
      isSignedIn,
      isLoaded,
    ]
  );

  // Memoize quick replies to prevent recreation on translation changes
  const quickReplies = useMemo(() => getQuickReplies(t), [t]);

  // Memoize welcome subtitle
  const welcomeSubtitle = useMemo(
    () => t('chat.welcomeSubtitle') || 'Your safe space for mental wellness',
    [t]
  );

  // Memoize error dismiss handler
  const handleDismissError = useCallback(
    () => setSessionError(null),
    [setSessionError]
  );

  return (
    <ChatScreen
      messages={messages}
      isTyping={isTyping}
      showQuickReplies={showQuickReplies}
      showHistorySidebar={showHistorySidebar}
      sessionSwitchLoading={sessionSwitchLoading}
      sessionError={sessionError}
      quickReplies={quickReplies}
      welcomeSubtitle={welcomeSubtitle}
      navigationBarPadding={120}
      onOpenSidebar={handleOpenSidebar}
      onCloseSidebar={handleCloseSidebar}
      onSessionSelect={handleSessionSelect}
      onQuickReply={handleQuickReply}
      onDismissError={handleDismissError}
    />
  );
}
