import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal, api } from './_generated/api';
// Removed legacy AI SDK imports; Responses API only
import { Id } from './_generated/dataModel';
import {
  buildResponsesPayload,
  streamFromResponsesAPI,
  transformResponsesStream,
} from './openaiResponses';

const http = httpRouter();

// Utility: CORS allowlist and helpers
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function buildCorsHeaders(origin: string | null): Record<string, string> {
  if (!isProd) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, authorization',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      Vary: 'Origin',
    };
  }
  const o = origin || '';
  const allowed = allowedOrigins.includes(o);
  return {
    ...(allowed ? { 'Access-Control-Allow-Origin': o } : {}),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
    Vary: 'Origin',
  };
}

function jsonError(
  status: number,
  type: string,
  message: string,
  headers: Record<string, string>
): Response {
  return new Response(JSON.stringify({ error: { type, message }, status }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

// No sanitation helper needed for Responses-only path

// No legacy message conversion; Responses API path only

async function handleChatStreaming(
  ctx: Parameters<Parameters<typeof httpAction>[0]>[0],
  request: Request,
  personality: 'coach' | 'companion' | 'vent'
) {
  const origin = request.headers.get('origin');
  const cors = buildCorsHeaders(origin);

  if (isProd && origin && !cors['Access-Control-Allow-Origin']) {
    return jsonError(403, 'CORS', 'Origin not allowed', cors);
  }

  // Auth
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return jsonError(401, 'AUTH', 'Unauthorized', cors);
  }

  // User lookup
  const user = await ctx.runQuery(api.auth.getUserByClerkId, {
    clerkId: identity.subject,
  });
  if (!user) {
    return jsonError(404, 'USER_NOT_FOUND', 'User not found', cors);
  }

  // Rate limit (per-user general)
  try {
    await ctx.runMutation(internal.chatStreaming.applyRateLimit, {
      key: `ai:stream:${personality}:${user._id}`,
      limit: 20,
      windowMs: 60_000,
    });
  } catch {
    return jsonError(429, 'RATE_LIMIT', 'Too Many Requests', cors);
  }

  // Parse body
  let parsed: any;
  try {
    parsed = await request.json();
  } catch {
    return jsonError(400, 'BAD_REQUEST', 'Invalid JSON body', cors);
  }
  const { messages, sessionId, requestId } = (parsed || {}) as {
    messages: { role: 'user' | 'assistant'; content?: string; parts?: any[] }[];
    sessionId: string;
    requestId?: string;
  };

  const startedAt = Date.now();
  let modelUsed = '';

  if (!messages || !sessionId) {
    return jsonError(400, 'VALIDATION', 'Missing messages or sessionId', cors);
  }

  // Request-level idempotency lock (if requestId provided)
  if (requestId) {
    try {
      await ctx.runMutation(internal.chatStreaming.applyRateLimit, {
        key: `ai:stream:req:${user._id}:${sessionId}:${requestId}`,
        limit: 1,
        windowMs: 120_000,
      });
    } catch {
      return jsonError(429, 'RATE_LIMIT', 'Duplicate request', cors);
    }
  }

  // Session-level lock to avoid duplicate concurrent streams for same session
  try {
    await ctx.runMutation(internal.chatStreaming.applyRateLimit, {
      key: `ai:stream:lock:${personality}:${user._id}:${sessionId}`,
      limit: 1,
      windowMs: 8000, // allow one stream per session every 8s
    });
  } catch {
    return jsonError(
      429,
      'RATE_LIMIT',
      'Another response is in progress',
      cors
    );
  }
  if (!Array.isArray(messages) || messages.length > 50) {
    return jsonError(400, 'VALIDATION', 'Invalid messages payload', cors);
  }
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) {
      return jsonError(400, 'VALIDATION', 'Invalid message role', cors);
    }
    const content = (m as any).content ?? '';
    if (typeof content !== 'string' || content.length > 16_000) {
      return jsonError(413, 'PAYLOAD_TOO_LARGE', 'Message too large', cors);
    }
  }

  // For new sessions, ensure a current summary exists before building prompts
  const isNewSession = !messages.some((m) => m.role === 'assistant');
  if (isNewSession) {
    try {
      await ctx.runAction(internal.personalization.ensureCurrentSummaryAction, {
        userId: user._id as Id<'users'>,
      });
    } catch (e) {
      // Best-effort only; do not block chat if summarization fails
      if (process.env.NODE_ENV !== 'production') {
        console.warn('ensureCurrentSummary failed:', e);
      }
    }
  }

  // Ensure session exists for this chat type (prevents vent overlay failures)
  try {
    const chatType =
      personality === 'coach'
        ? 'main'
        : personality === 'companion'
          ? 'companion'
          : 'vent';
    await ctx.runMutation(internal.chatStreaming.ensureSessionExists, {
      userId: user._id as Id<'users'>,
      sessionId,
      chatType: chatType as any,
    });
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('ensureSessionExists failed (non-fatal):', e);
    }
  }

  // Responses API only
  if (process.env.NODE_ENV !== 'production') {
    console.debug('Using OpenAI Responses API for personality:', personality);
  }
  // New approach: OpenAI Responses API with Prompt IDs
  try {
    const { payload, modelConfig } = await buildResponsesPayload(
      ctx,
      personality,
      messages,
      { _id: user._id, name: user.name, language: user.language }
    );
    modelUsed = payload.model || 'unknown';
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Built OpenAI Responses payload (redacted).');
    }
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return jsonError(500, 'CONFIG', 'OpenAI API key not configured', cors);
    }

    // Get streaming response from OpenAI
    const openaiResponse = await streamFromResponsesAPI(
      apiKey,
      payload,
      modelConfig
    );

    // Transform to UI Message stream format
    const transformedStream = new ReadableStream({
      async start(controller) {
        let accumulatedContent = '';
        let chunkCount = 0;

        try {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('Starting stream transformation');
          }

          for await (const chunk of transformResponsesStream(
            openaiResponse.body!
          )) {
            chunkCount++;
            controller.enqueue(new TextEncoder().encode(chunk));

            // Extract content for DB persistence
            try {
              const data = chunk.match(/data: (.+)\n/)?.[1];
              if (data && data !== '[DONE]') {
                const parsed = JSON.parse(data);
                if (parsed.textDelta) {
                  accumulatedContent += parsed.textDelta;
                }
              }
            } catch (e) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('Failed to extract content from chunk:', e);
              }
            }
          }

          if (process.env.NODE_ENV !== 'production') {
            console.debug(
              `Stream complete. chunks=${chunkCount} length=${accumulatedContent.length}`
            );
          }

          // Persist to database
          if (accumulatedContent.trim()) {
            await ctx.runMutation(
              internal.chatStreaming.insertAssistantMessage,
              {
                sessionId,
                userId: user._id as Id<'users'>,
                chatType:
                  personality === 'coach'
                    ? 'main'
                    : personality === 'companion'
                      ? 'companion'
                      : 'vent',
                content: accumulatedContent.trim(),
                requestId,
              }
            );
            if (process.env.NODE_ENV !== 'production') {
              console.debug('Message persisted to database');
            }
          } else {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('No content to persist');
            }
          }
          // Record telemetry
          const finishedAt = Date.now();
          const chatType =
            personality === 'coach'
              ? 'main'
              : personality === 'companion'
                ? 'companion'
                : 'vent';
          try {
            await ctx.runMutation(internal.chatStreaming.recordAITelemetry, {
              userId: user._id as Id<'users'>,
              sessionId,
              chatType: chatType as any,
              provider: 'openai',
              model: modelUsed || 'unknown',
              requestId,
              startedAt,
              finishedAt,
              durationMs: finishedAt - startedAt,
              contentLength: accumulatedContent.length,
              success: true,
            });
          } catch (e) {
            // best-effort only
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      headers: {
        ...cors,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('OpenAI Responses API error:', error);
    return jsonError(500, 'AI_ERROR', 'Failed to generate response', cors);
  }
}

// Coach personality streaming endpoint
http.route({
  path: '/chat/coach',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    return handleChatStreaming(ctx, request, 'coach');
  }),
});

// Companion personality streaming endpoint
http.route({
  path: '/chat/companion',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    return handleChatStreaming(ctx, request, 'companion');
  }),
});

// Vent personality streaming endpoint
http.route({
  path: '/chat/vent',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    return handleChatStreaming(ctx, request, 'vent');
  }),
});

// CORS preflight handler
http.route({
  path: '/chat/coach',
  method: 'OPTIONS',
  handler: httpAction(async (_ctx, request) => {
    const cors = buildCorsHeaders(request.headers.get('origin'));
    return new Response(null, { status: 204, headers: cors });
  }),
});

http.route({
  path: '/chat/companion',
  method: 'OPTIONS',
  handler: httpAction(async (_ctx, request) => {
    const cors = buildCorsHeaders(request.headers.get('origin'));
    return new Response(null, { status: 204, headers: cors });
  }),
});

http.route({
  path: '/chat/vent',
  method: 'OPTIONS',
  handler: httpAction(async (_ctx, request) => {
    const cors = buildCorsHeaders(request.headers.get('origin'));
    return new Response(null, { status: 204, headers: cors });
  }),
});

export default http;
