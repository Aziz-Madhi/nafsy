/**
 * React Native hook for streaming chat responses
 */

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { streamChat } from '~/lib/ai/streaming';
import { useNetworkStatus } from '~/hooks/useOfflineData';
import { Alert } from 'react-native';

export type ChatPersonality = 'coach' | 'companion';

interface UseStreamingChatReturn {
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
  sendStreamingMessage: (
    text: string,
    sessionId: string,
    messages: { role: 'user' | 'assistant'; content: string }[]
  ) => Promise<void>;
  cancelStreaming: () => void;
}

/**
 * Hook for managing streaming chat responses
 * Integrates with existing offline-aware system
 */
export function useStreamingChat(
  personality: ChatPersonality
): UseStreamingChatReturn {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const isStreamingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Character pacing via RAF for smooth per-frame updates
  const queueRef = useRef('');
  const rafIdRef = useRef<number | null>(null);
  const stepRef = useRef(2); // 2 characters per frame by default
  // Queue for one pending request if user sends while streaming
  const pendingRef = useRef<
    | null
    | {
        text: string;
        sessionId: string;
        messages: { role: 'user' | 'assistant'; content: string }[];
      }
  >(null);
  const isOnline = useNetworkStatus();
  const { getToken } = useAuth();

  // Simple, direct chunk appending (no pacing)

  // Cancel ongoing streaming (user-initiated)
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    isStreamingRef.current = false;
    setStreamingContent('');
    queueRef.current = '';
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const startStream = useCallback(
    async (
      text: string,
      sessionId: string,
      messages: { role: 'user' | 'assistant'; content: string }[]
    ) => {
      // Check if offline
      if (!isOnline) {
        Alert.alert('Offline', 'You need to be online to chat with the AI', [
          { text: 'OK' },
        ]);
        return;
      }

      // Reset state
      setError(null);
      setIsStreaming(true);
      isStreamingRef.current = true;
      setStreamingContent('');
      queueRef.current = '';
      // start RAF loop on demand
      const ensureRaf = () => {
        if (rafIdRef.current != null) return;
        const tick = () => {
          rafIdRef.current = null;
          const q = queueRef.current;
          if (q.length > 0) {
            const n = stepRef.current;
            const chunk = q.slice(0, n);
            queueRef.current = q.slice(n);
            setStreamingContent((prev) => prev + chunk);
          }
          if (queueRef.current.length > 0 || isStreamingRef.current) {
            rafIdRef.current = requestAnimationFrame(tick);
          }
        };
        rafIdRef.current = requestAnimationFrame(tick);
      };


      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Ensure we have a valid Clerk JWT for Convex HTTP routes
        const token = await getToken({ template: 'convex' });
        if (!token) {
          setIsStreaming(false);
          setError('Not authenticated');
          Alert.alert(
            'Authentication Required',
            'Please sign in again to chat with the AI.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Add user message to messages array for context
        const updatedMessages = [
          ...messages,
          { role: 'user' as const, content: text },
        ];

        await streamChat({
          personality,
          messages: updatedMessages,
          sessionId,
          signal: abortController.signal,
          authToken: token,
          onChunk: (chunk) => {
            if (!chunk) return;
            queueRef.current += chunk;
            ensureRaf();
          },
          onComplete: () => {
            setIsStreaming(false);
            isStreamingRef.current = false;
            // Ensure the remaining queue flushes with RAF; delay next stream slightly
            // Start any queued request after a brief delay to let DB finalize
            const next = pendingRef.current;
            pendingRef.current = null;
            if (next) {
              setTimeout(() => {
                startStream(next.text, next.sessionId, next.messages);
              }, 300);
            }
          },
          onError: (err) => {
            // Handle 429 (session lock) gracefully with a short queued retry
            const msg = (err?.message || '').toLowerCase();
            const isConcurrencyLimit =
              msg.includes('429') || msg.includes('another response is in progress');

            if (isConcurrencyLimit && !abortController.signal.aborted) {
              // Queue this attempt and retry when lock likely clears
              pendingRef.current = { text, sessionId, messages };
              setIsStreaming(false);
              isStreamingRef.current = false;
              // Try a delayed retry in case no onComplete will fire locally
              setTimeout(() => {
                if (!pendingRef.current) return;
                if (!abortControllerRef.current && !isStreaming) {
                  const p = pendingRef.current;
                  pendingRef.current = null;
                  startStream(p.text, p.sessionId, p.messages);
                }
              }, 1000);
              return; // Do not alert user; queued for retry
            }

            // Non-429 errors
            setError(err.message);
            setIsStreaming(false);
            isStreamingRef.current = false;
            if (!abortController.signal.aborted) {
              Alert.alert(
                'Chat Error',
                'Failed to get AI response. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        });
      } catch (err) {
        console.error('Failed to stream message:', err);
        setError((err as Error).message);
        setIsStreaming(false);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [personality, isOnline, getToken]
  );

  // Send message entrypoint: if a stream is in progress, queue the new one
  const sendStreamingMessage = useCallback(
    async (
      text: string,
      sessionId: string,
      messages: { role: 'user' | 'assistant'; content: string }[]
    ) => {
      if (isStreaming) {
        // queue and let current onComplete start it
        pendingRef.current = { text, sessionId, messages };
        return;
      }
      await startStream(text, sessionId, messages);
    },
    [isStreaming, startStream]
  );

  return {
    streamingContent,
    isStreaming,
    error,
    sendStreamingMessage,
    cancelStreaming,
  };
}
