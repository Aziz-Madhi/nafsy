import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal, api } from './_generated/api';
import { openai } from '@ai-sdk/openai';
import {
  streamText,
  convertToModelMessages,
  UIMessage,
  smoothStream,
} from 'ai';
import { Id } from './_generated/dataModel';

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
  return new Response(
    JSON.stringify({ error: { type, message }, status }),
    {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    }
  );
}

function sanitizeText(input: unknown, maxLen = 16000): string {
  let text = typeof input === 'string' ? input : '';
  if (text.length > maxLen) text = text.slice(0, maxLen);
  // Strip NULL and other non-printable control chars except common whitespace
  return text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function toUiMessages(raw: any[]): UIMessage[] {
  return (raw || []).map((m, idx) => {
    const role = m?.role === 'assistant' ? 'assistant' : 'user';
    const content = sanitizeText(m?.content ?? '');
    if (Array.isArray(m?.parts)) {
      // Only keep text parts, sanitized
      const parts = (m.parts as any[])
        .filter((p) => p && typeof p === 'object' && (p as any).type === 'text')
        .map((p) => ({ type: 'text', text: sanitizeText((p as any).text) }));
      return {
        id: `${Date.now()}-${idx}`,
        role,
        parts,
      } as UIMessage;
    }
    return {
      id: `${Date.now()}-${idx}`,
      role,
      parts: [{ type: 'text', text: content }],
    } as UIMessage;
  });
}

async function handleChatStreaming(
  ctx: Parameters<Parameters<typeof httpAction>[0]>[0],
  request: Request,
  personality: 'coach' | 'companion'
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
    return jsonError(429, 'RATE_LIMIT', 'Another response is in progress', cors);
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

  // System prompt per personality with language hint
  const langHint = user.language === 'ar' ? 'Respond in Arabic when appropriate.' : '';
  const systemPrompt =
    (personality === 'coach'
      ? process.env.COACH_SYSTEM_PROMPT
      : process.env.COMPANION_SYSTEM_PROMPT) ||
    (personality === 'coach'
      ? `You are a compassionate and professional therapist specializing in Cognitive Behavioral Therapy (CBT). You provide structured, evidence-based therapeutic support. You listen actively, validate emotions, and guide users through their challenges with empathy and expertise. Keep responses concise but meaningful. ${langHint}`
      : `You are a friendly and supportive daily companion. You check in on the user's wellbeing, celebrate their victories, and provide encouragement during difficult times. You're warm, approachable, and genuinely caring. Keep responses conversational and supportive. ${langHint}`);

  const uiMessages: UIMessage[] = toUiMessages(messages);

  // Single-write persistence: we'll only insert once on finish

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: [
      { role: 'system', content: systemPrompt },
      ...convertToModelMessages(uiMessages),
    ],
    temperature: personality === 'coach' ? 0.7 : 0.8,
    experimental_transform: smoothStream({ delayInMs: 40, chunking: 'word' }),
    onFinish: async ({ text }) => {
      try {
        const finalText = (text ?? '').trim();
        if (!finalText) return; // Avoid empty inserts
        await ctx.runMutation(internal.chatStreaming.insertAssistantMessage, {
          sessionId,
          userId: user._id as Id<'users'>,
          chatType: personality === 'coach' ? 'main' : 'companion',
          content: finalText,
          requestId,
        });
      } catch (err) {
        console.error('Failed to insert assistant message:', err);
      }
    },
  });

  // Note: We no longer perform per-chunk DB writes. UI streaming remains intact
  // via SSE response below; the DB is written exactly once in onFinish above.

  return result.toUIMessageStreamResponse({
    headers: cors,
  });
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

export default http;
