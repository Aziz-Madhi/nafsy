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
  // First-week users: skip creating weekly summaries (use onboarding context instead)
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const isFirstWeekUser = Date.now() - (user.createdAt || Date.now()) < ONE_WEEK_MS;
  if (isNewSession && !isFirstWeekUser) {
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

// Summarize session title after >=3 messages using Responses API
http.route({
  path: '/chat/summarize-title',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const origin = request.headers.get('origin');
    const cors = buildCorsHeaders(origin);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return jsonError(401, 'AUTH', 'Unauthorized', cors);
    }

    const user = await ctx.runQuery(api.auth.getUserByClerkId, {
      clerkId: identity.subject,
    });
    if (!user) {
      return jsonError(404, 'USER_NOT_FOUND', 'User not found', cors);
    }

    let parsed: any;
    try {
      parsed = await request.json();
    } catch {
      return jsonError(400, 'BAD_REQUEST', 'Invalid JSON body', cors);
    }

    const { sessionId, chatType, messages } = (parsed || {}) as {
      sessionId: string;
      chatType: 'main' | 'companion' | 'vent';
      messages?: { role: 'user' | 'assistant'; content: string }[];
    };
    if (!sessionId || !chatType) {
      return jsonError(400, 'VALIDATION', 'Missing sessionId or chatType', cors);
    }

    // Basic per-session rate limit to avoid concurrent updates
    try {
      await ctx.runMutation(internal.chatStreaming.applyRateLimit, {
        key: `title:summarize:${user._id}:${sessionId}`,
        limit: 1,
        windowMs: 10_000,
      });
    } catch {
      return jsonError(429, 'RATE_LIMIT', 'Title summarization in progress', cors);
    }

    // Fetch active title summarization config
    const config = await ctx.runQuery(
      api.titleSummarizationConfig.getActiveTitleSummarizationConfig,
      {}
    );
    if (!config) {
      return jsonError(500, 'CONFIG', 'No active title summarization config', cors);
    }

    // Ensure we have 3 messages (use provided or gather from server)
    let firstThree: { role: 'user' | 'assistant'; content: string }[] = [];
    if (Array.isArray(messages) && messages.length >= 3) {
      firstThree = messages.slice(0, 3);
    } else {
      // Pull up to 50, then take earliest 3
      const unified = chatType;
      const serverMessages = await ctx.runQuery(api.chat.getChatMessages, {
        type: unified as any,
        sessionId,
        limit: 50,
      });
      const asc = [...serverMessages].sort((a, b) => a.createdAt - b.createdAt);
      firstThree = asc.slice(0, 3).map((m) => ({
        role: m.role,
        content: m.content || '',
      }));
    }

    if (firstThree.length < 3) {
      return jsonError(412, 'PRECONDITION', 'Not enough messages', cors);
    }

    // Build Responses payload
    const inputText = firstThree
      .map((m, i) => `${i + 1}. ${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');
    const payload: any = {
      model: config.model,
      stream: false,
      input: [{ role: 'user', content: inputText }],
      prompt: { id: config.openaiPromptId },
    };
    if (config.source === 'openai_prompt_pinned' && config.openaiPromptVersion) {
      payload.prompt.version = String(config.openaiPromptVersion);
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return jsonError(500, 'CONFIG', 'OpenAI API key not configured', cors);
    }

    let title = '';
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.text();
        return jsonError(502, 'AI_ERROR', `OpenAI error ${response.status}: ${err}`, cors);
      }
      const result = await response.json();
      if (Array.isArray(result.output)) {
        const msg = result.output.find((o: any) => o.type === 'message');
        if (msg?.content?.[0]?.text) title = msg.content[0].text;
      }
      if (!title) {
        if (typeof result.output_text === 'string') title = result.output_text;
        else if (typeof result.response?.output_text === 'string')
          title = result.response.output_text;
        else if (result.choices?.[0]?.message?.content)
          title = result.choices[0].message.content;
        else if (typeof result.content === 'string') title = result.content;
      }
      title = (title || '').trim();
      if (!title) return jsonError(500, 'AI_EMPTY', 'Empty title from OpenAI', cors);
      if (title.length > 80) title = title.slice(0, 80).trim();
    } catch (e) {
      return jsonError(500, 'AI_ERROR', 'Failed to generate title', cors);
    }

    // Apply title (best-effort)
    try {
      await ctx.runMutation(internal.titleSummarization._applySessionTitle, {
        userId: user._id,
        sessionId,
        chatType,
        title,
      });
    } catch (e) {
      // If concurrent mutation conflict occurs, respond success anyway —
      // another attempt likely applied the title.
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Title patch conflict (ignored):', e);
      }
    }

    return new Response(JSON.stringify({ title }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }),
});

// CORS preflight for summarize-title
http.route({
  path: '/chat/summarize-title',
  method: 'OPTIONS',
  handler: httpAction(async (_ctx, request) => {
    const cors = buildCorsHeaders(request.headers.get('origin'));
    return new Response(null, { status: 204, headers: cors });
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
