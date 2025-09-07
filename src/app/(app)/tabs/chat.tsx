import React, { useCallback, useEffect, useRef, useState } from 'react';
import { sendMessageRef } from './_layout';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Alert } from 'react-native';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useOfflineChatMessages, useNetworkStatus } from '~/hooks/useOfflineData';
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
import { config } from '~/config/env';
import { fetch as expoFetch } from 'expo/fetch';
// HTTP streaming utilities removed in favor of Convex internal actions
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

  // Streaming state for assistant output
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  // Optimistic user messages pending per-session (Option A)
  const [pendingBySession, setPendingBySession] = useState<Record<string, Message[]>>({});

  // Auth for HTTP streaming call
  const { getToken } = useAuth();
  const ENABLE_STREAMING =
    ((process.env.EXPO_PUBLIC_CHAT_STREAMING as string | undefined) || 'on') !==
    'off';

  // Helper: map UI chat types to backend chat types
  const mapToServerType = useCallback((t: ChatType): 'main' | 'vent' | 'companion' => {
    return t === 'coach' ? 'main' : t === 'event' ? 'vent' : 'companion';
  }, []);

  // Track current stream controller for cleanup (fetch-based streaming)
  const currentAbortRef = useRef<AbortController | null>(null);

  // Streaming via fetch (expo/fetch) with incremental parsing
  const streamAssistant = useCallback(
    async (opts: { text: string; sessionId: string; chatType: ChatType }) => {
      const { text, sessionId, chatType } = opts;
      const baseUrl = (config.convex.url || '').replace(/\/$/, '');
      const siteOverride =
        (process.env.EXPO_PUBLIC_CONVEX_SITE_URL as string | undefined) || '';
      const convexSiteUrl = (siteOverride || baseUrl).replace(
        /\.convex\.cloud(\/|$)/,
        '.convex.site$1'
      );
      const url = `${convexSiteUrl}/chat-stream`;
      const token = (await getToken({ template: 'convex' }).catch(() => null)) ||
        (await getToken().catch(() => null));
      // Abort any previous stream
      try {
        currentAbortRef.current?.abort();
      } catch {}
      const controller = new AbortController();
      currentAbortRef.current = controller;

      setIsStreaming(true);
      setStreamingContent('');

      try {
        const res = await (expoFetch as unknown as typeof globalThis.fetch)(
          url,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'text/event-stream',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              chatType: mapToServerType(chatType),
              sessionId,
              message: text,
              requestId: `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`,
            }),
            signal: controller.signal,
          }
        );

        if (!res.ok || !res.body) {
          throw new Error(`Stream failed: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let sepIndex: number;
          while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
            const eventBlock = buffer.slice(0, sepIndex);
            buffer = buffer.slice(sepIndex + 2);

            const dataLines = eventBlock
              .split('\n')
              .filter((l) => l.startsWith('data: '))
              .map((l) => l.slice(6).trim());
            if (dataLines.length === 0) continue;
            const data = dataLines.join('\n');
            if (data === '[DONE]') {
              // End-of-stream marker: let the outer finally handler clear streaming state once.
              continue;
            }
            try {
              const evt = JSON.parse(data);
              if (
                evt?.type === 'text-delta' &&
                typeof evt.textDelta === 'string'
              ) {
                setStreamingContent((prev) => prev + (evt.textDelta as string));
              }
            } catch {}
          }
        }
      } catch (e) {
        console.error('Streaming failed', e);
      } finally {
        setIsStreaming(false);
        if (currentAbortRef.current === controller) {
          currentAbortRef.current = null;
        }
      }
    },
    [getToken, mapToServerType]
  );

  // Cleanup streaming connection on unmount
  useEffect(() => {
    return () => {
      try {
        currentAbortRef.current?.abort();
      } catch {}
      currentAbortRef.current = null;
    };
  }, []);

  // Keep mutations for session creation and user upsert
  const upsertUser = useMutation(api.auth.upsertUser);
  const createChatSession = useMutation(api.chat.createChatSession);
  const sendChatMessage = useMutation(api.chat.sendChatMessage);

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

  // Merge optimistic pending user messages for the active session
  const mergedMessages: Message[] = React.useMemo(() => {
    const pendings = activeSessionId ? pendingBySession[activeSessionId] || [] : [];
    if (!pendings.length) return messages;
    return [...messages, ...pendings];
  }, [messages, pendingBySession, activeSessionId]);

  // Title summarization is scheduled server-side after assistant replies

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

  // Optimized message sending with streaming
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

      // Send message with HTTP streaming; avoid non-streaming scheduler
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

          // Add optimistic user bubble once we know the sessionId
          const tempId = `_local:${Date.now()}-${Math.random().toString(36).slice(2)}`;
          const optimistic: Message = {
            _id: tempId,
            content: text,
            role: 'user',
            _creationTime: Date.now(),
          };
          if (sessionId) {
            setPendingBySession((s) => ({
              ...s,
              [sessionId!]: [...(s[sessionId!] || []), optimistic],
            }));
          }

          if (ENABLE_STREAMING) {
            // Start streaming from Convex HTTP endpoint (also persists the user message)
            await streamAssistant({
              text,
              sessionId: sessionId!,
              chatType: activeChatType,
            });
          } else {
            // Non-streaming path: write user msg and let backend action persist assistant
            await sendChatMessage({
              content: text,
              role: 'user',
              type: mapToServerType(activeChatType),
              sessionId: sessionId!,
            });
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
      streamAssistant,
      activeSessionId,
      activeChatType,
      createChatSession,
      setCurrentVentSessionId,
      switchToMainSession,
      switchToCompanionSession,
      ENABLE_STREAMING,
      sendChatMessage,
      mapToServerType,
      setPendingBySession,
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
        if (ENABLE_STREAMING) {
          // Stream assistant reply (server persists messages)
          await streamAssistant({ text, sessionId, chatType: 'event' });
        } else {
          await sendChatMessage({
            content: text,
            role: 'user',
            type: 'vent',
            sessionId,
          });
        }
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
      streamAssistant,
      ENABLE_STREAMING,
      sendChatMessage,
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

  // Vent overlay now updates when assistant message appears in DB

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

  // streamingContent and isStreaming are stateful above

  // Reconcile: when a real user message arrives at the tail, drop matching pending
  useEffect(() => {
    if (!activeSessionId) return;
    const pendings = pendingBySession[activeSessionId];
    if (!pendings || pendings.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'user') return;
    const idx = pendings.findIndex(
      (p) => p.role === 'user' && p.content.trim() === (last.content || '').trim()
    );
    if (idx !== -1) {
      setPendingBySession((s) => {
        const arr = [...(s[activeSessionId] || [])];
        arr.splice(idx, 1);
        return { ...s, [activeSessionId]: arr };
      });
    }
  }, [messages, activeSessionId, pendingBySession]);

  return (
    <ChatScreen
      messages={mergedMessages}
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
