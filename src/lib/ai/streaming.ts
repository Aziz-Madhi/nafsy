/**
 * Client-side streaming utilities for React Native/Expo
 */
import { Platform } from 'react-native';
import { fetch as expoFetch } from 'expo/fetch';
import { readUIMessageStream, UIMessage } from 'ai';
import { EventSourceParserStream } from 'eventsource-parser/stream';

/**
 * Generate the Convex HTTP endpoint URL
 * Uses EXPO_PUBLIC_CONVEX_SITE_URL for proper device compatibility
 */
export function generateConvexUrl(path: string): string {
  const baseUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;

  if (!baseUrl) {
    // Fallback to deriving from CONVEX_URL if SITE_URL not available
    const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error(
        'EXPO_PUBLIC_CONVEX_SITE_URL or EXPO_PUBLIC_CONVEX_URL not configured'
      );
    }
    // Convert .cloud to .site for HTTP endpoints
    const siteUrl = convexUrl.replace(/\.cloud$/, '.site');
    return `${siteUrl}${path}`;
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Create a streaming fetch request with proper headers
 */
export async function createStreamingFetch(
  url: string,
  body: any,
  signal?: AbortSignal,
  authToken?: string
): Promise<Response> {
  const fetchImpl: typeof fetch =
    Platform.OS === 'ios' || Platform.OS === 'android'
      ? (expoFetch as unknown as typeof fetch)
      : fetch;

  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Request SSE stream for UIMessage chunks
      Accept: 'text/event-stream',
      // Add auth token if available (from Clerk)
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    // Try to include server-provided error details
    let detail = '';
    try {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        detail = json?.error?.message || text;
      } catch {
        detail = text;
      }
    } catch {}
    const err = new Error(
      `HTTP ${response.status}${detail ? `: ${detail}` : ''}`
    );
    (err as any).status = response.status;
    throw err;
  }

  return response;
}

/**
 * Process UI Message stream and emit text deltas
 */
export async function processUIMessageStream(
  response: Response,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const body = (response as unknown as { body?: ReadableStream<any> }).body;
  if (!body) {
    try {
      // Fallback: no body stream available
      const text = await response.text();
      if (text) onChunk(text);
      onComplete();
    } catch (e) {
      onError(new Error(`No readable body: ${(e as Error).message}`));
    }
    return;
  }

  // Strategy:
  // - Probe the stream quickly to detect "plain text-delta" SSE (our OpenAI Responses adapter)
  // - If detected, stream deltas directly for immediate UI updates
  // - Otherwise, fall back to AI SDK's readUIMessageStream aggregation
  try {
    const [probeStream, mainStream] = body.tee();

    // Small helper to parse SSE into JSON objects
    function toEventObjectStream(rs: ReadableStream<any>) {
      const eventStream = rs
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream());
      return eventStream.pipeThrough(
        new TransformStream<{ event: string; data: string }, any>({
          transform({ data }, controller) {
            if (data === '[DONE]') return; // end-of-stream marker
            try {
              controller.enqueue(JSON.parse(data));
            } catch {
              // ignore malformed
            }
          },
        })
      );
    }

    // 1) Probe branch: check the first meaningful event
    const probeObjects = toEventObjectStream(probeStream);
    const probeReader = (probeObjects as ReadableStream<any>).getReader();
    let firstObj: any | null = null;
    while (true) {
      const { value, done } = await probeReader.read();
      if (done) break;
      if (value && typeof value === 'object') {
        firstObj = value;
        break;
      }
    }

    // If we detected our simple delta format, continue reading directly from the probe branch
    const isDirectDelta =
      !!firstObj &&
      (typeof firstObj.textDelta === 'string' ||
        firstObj.type === 'text-delta');

    if (isDirectDelta) {
      // Stream direct deltas for smooth updates
      if (typeof firstObj.textDelta === 'string' && firstObj.textDelta) {
        onChunk(firstObj.textDelta);
      }

      // Continue consuming remaining events from the same probe branch
      while (true) {
        const { value, done } = await probeReader.read();
        if (done) break;
        const obj = value as any;
        const delta: string | undefined =
          typeof obj?.textDelta === 'string'
            ? obj.textDelta
            : typeof obj?.delta === 'string'
              ? obj.delta
              : undefined;
        if (delta) onChunk(delta);
      }
      onComplete();
      return;
    }

    // 2) Fallback: use AI SDK UI message stream on the main branch
    try {
      await probeReader.cancel();
    } catch {}
    const chunkObjectStream = toEventObjectStream(mainStream);
    const uiStream = readUIMessageStream({ stream: chunkObjectStream as any });

    let lastText = '';
    for await (const message of uiStream as AsyncIterable<UIMessage>) {
      // Accumulate all text parts in order
      const currentText = (message.parts || [])
        .filter((p) => (p as any).type === 'text')
        .map((p) => (p as any).text as string)
        .join('');
      if (currentText && currentText.length > lastText.length) {
        const delta = currentText.slice(lastText.length);
        if (delta) onChunk(delta);
        lastText = currentText;
      }
    }
    onComplete();
  } catch (e) {
    onError(e as Error);
  }
}

/**
 * Detect sentence boundaries for batching updates
 */
export function detectSentenceBoundary(text: string): boolean {
  // Check for sentence-ending punctuation followed by space or end of string
  return /[.!?]\s/.test(text) || /[.!?]$/.test(text);
}

/**
 * Stream chat completion from Convex HTTP endpoint
 */
export interface StreamChatOptions {
  personality: 'coach' | 'companion' | 'vent';
  messages: { role: 'user' | 'assistant'; content: string }[];
  sessionId: string;
  requestId?: string;
  onChunk?: (text: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
  authToken?: string;
}

export async function streamChat({
  personality,
  messages,
  sessionId,
  onChunk = () => {},
  onComplete = () => {},
  onError = () => {},
  signal,
  authToken,
  requestId,
}: StreamChatOptions): Promise<void> {
  try {
    const url = generateConvexUrl(`/chat/${personality}`);
    const rid =
      requestId || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const body = { messages, sessionId, requestId: rid };

    const response = await createStreamingFetch(url, body, signal, authToken);
    await processUIMessageStream(response, onChunk, onComplete, onError);
  } catch (error) {
    onError(error as Error);
  }
}
