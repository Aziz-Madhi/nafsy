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
    messages: { role: 'user' | 'assistant'; content: string }[],
    requestId?: string
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
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Throttle streaming updates to avoid scroll jank.
  // Buffer incoming chunks and flush at ~30fps.
  const bufferRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOnline = useNetworkStatus();
  const { getToken } = useAuth();

  // Simple, direct chunk appending (no pacing)

  // Cancel ongoing streaming
  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (flushTimerRef.current) {
      clearInterval(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    bufferRef.current = '';
    setIsStreaming(false);
    setStreamingContent('');
  }, []);

  // Send message and stream response
  const sendStreamingMessage = useCallback(
    async (
      text: string,
      sessionId: string,
      messages: { role: 'user' | 'assistant'; content: string }[],
      requestId?: string
    ) => {
      // Check if offline
      if (!isOnline) {
        Alert.alert('Offline', 'You need to be online to chat with the AI', [
          { text: 'OK' },
        ]);
        return;
      }

      // Cancel any existing streaming
      cancelStreaming();

      // Reset state
      setError(null);
      setIsStreaming(true);
      setStreamingContent('');
      bufferRef.current = '';

      // Start periodic flush to batch UI updates
      if (flushTimerRef.current) {
        clearInterval(flushTimerRef.current);
      }
      flushTimerRef.current = setInterval(() => {
        if (!bufferRef.current) return;
        const chunk = bufferRef.current;
        bufferRef.current = '';
        setStreamingContent((prev) => prev + chunk);
      }, 33); // ~30fps

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
          requestId,
          authToken: token,
          onChunk: (chunk) => {
            if (chunk) bufferRef.current += chunk;
          },
          onComplete: () => {
            // One final flush
            if (bufferRef.current) {
              setStreamingContent((prev) => prev + bufferRef.current);
              bufferRef.current = '';
            }
            if (flushTimerRef.current) {
              clearInterval(flushTimerRef.current);
              flushTimerRef.current = null;
            }
            setIsStreaming(false);
          },
          onError: (err) => {
            console.error('Streaming error:', err);
            setError(err.message);
            setIsStreaming(false);
            if (flushTimerRef.current) {
              clearInterval(flushTimerRef.current);
              flushTimerRef.current = null;
            }

            // Show user-friendly error
            const msg = (err?.message || '').toLowerCase();
            const isConcurrencyLimit =
              msg.includes('429') || msg.includes('another response is in progress');
            if (!abortController.signal.aborted && !isConcurrencyLimit) {
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
    [personality, isOnline, cancelStreaming, getToken]
  );

  return {
    streamingContent,
    isStreaming,
    error,
    sendStreamingMessage,
    cancelStreaming,
  };
}
