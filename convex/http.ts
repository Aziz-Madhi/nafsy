import { httpAction } from './_generated/server';
import { httpRouter } from 'convex/server';
import { api, internal } from './_generated/api';
import { transformResponsesStream } from './openaiResponses';
import appRateLimiter from './rateLimit';

// SSE helpers
const encoder = new TextEncoder();

function sseLine(data: string) {
  return `data: ${data}\n\n`;
}

// CORS helpers
function getOrigin(req: Request): string | null {
  return (
    (req.headers.get('origin') || req.headers.get('Origin') || '').trim() ||
    null
  );
}

function parseAllowedOrigins(): string[] | null {
  const raw = (process.env.ALLOWED_ORIGINS || '').trim();
  if (!raw) return null;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isAllowedOrigin(origin: string): boolean {
  const allowList = parseAllowedOrigins();
  if (allowList && allowList.length > 0) {
    return allowList.includes(origin);
  }
  // Default safe patterns: convex.site + localhost for dev
  if (/^https:\/\/[a-z0-9-]+\.convex\.site$/i.test(origin)) return true;
  if (/^https?:\/\/localhost(?::\d+)?$/i.test(origin)) return true;
  if (/^https?:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin)) return true;
  return false;
}

function makeCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (!origin) {
    // Mobile clients (no Origin) → permissive wildcard
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    // Not allowed: do not set ACAO to avoid reflecting untrusted origins
    headers['Access-Control-Allow-Origin'] = 'null';
  }
  return headers;
}

function personalityFromChatType(
  type: 'main' | 'vent' | 'companion'
): 'coach' | 'vent' | 'companion' {
  return type === 'main' ? 'coach' : type;
}

// POST /chat-stream
export const streamChat = httpAction(async (ctx, request) => {
  try {
    const origin = getOrigin(request);
    // If a web Origin is present and not allowed, reject early
    if (origin && !isAllowedOrigin(origin)) {
      return new Response('Forbidden origin', {
        status: 403,
        headers: makeCorsHeaders(origin),
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: makeCorsHeaders(origin),
      });
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return new Response('Unauthorized', {
        status: 401,
        headers: makeCorsHeaders(origin),
      });
    }

    const body = (await request.json()) as {
      chatType: 'main' | 'vent' | 'companion';
      sessionId?: string;
      message: string;
      requestId?: string;
      // Optional: custom session title when creating new sessions
      title?: string;
    };

    if (!body?.message || !body?.chatType) {
      return new Response('Invalid request body', {
        status: 400,
        headers: makeCorsHeaders(origin),
      });
    }

    // Load the user and ensure auth matches
    const user = await ctx.runQuery(api.auth.getUserByClerkId, {
      clerkId: identity.subject,
    });
    if (!user) {
      return new Response('Unauthorized', {
        status: 401,
        headers: makeCorsHeaders(origin),
      });
    }

    // Pre-check weekly chat limit (non-consuming). Consumption happens inside internals.
    const chatDailyStatus = await appRateLimiter.check(ctx, 'chatWeekly', {
      key: user._id,
    });
    if (!chatDailyStatus.ok) {
      return new Response('Weekly chat limit reached', {
        status: 429,
        headers: makeCorsHeaders(origin),
      });
    }

    // Centralized prep in internal action
    const prepared = await ctx.runAction(
      internal.chatStreaming.prepareStreamingTurn,
      {
        userId: user._id,
        chatType: body.chatType,
        message: body.message,
        sessionId: body.sessionId,
        title: body.title,
        requestId: body.requestId,
      }
    );

    const ensuredSessionId = prepared.sessionId;
    const persistPolicy = prepared.persistPolicy;
    const payload = prepared.payload as any;
    const modelConfig = prepared.modelConfig as any;
    (payload as any).stream = true;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response('Server misconfigured: missing OPENAI_API_KEY', {
        status: 500,
        headers: makeCorsHeaders(origin),
      });
    }

    // Call OpenAI Responses API with streaming enabled
    const requestBody: any = {
      model: (payload as any).model,
      stream: true,
      input: (payload as any).input,
    };
    if ((payload as any).prompt) {
      requestBody.prompt = (payload as any).prompt;
    }
    if ((payload as any).instructions) {
      requestBody.instructions = (payload as any).instructions;
    }
    if ((payload as any).conversation) {
      requestBody.conversation = (payload as any).conversation;
    }
    if (modelConfig?.temperature !== undefined) {
      requestBody.temperature = modelConfig.temperature;
    }
    if (modelConfig?.maxTokens !== undefined) {
      requestBody.max_output_tokens = modelConfig.maxTokens;
    }
    if (modelConfig?.topP !== undefined) {
      requestBody.top_p = modelConfig.topP;
    }

    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!upstream.ok || !upstream.body) {
      const errTxt = await upstream.text().catch(() => '');
      return new Response(
        `Upstream error ${upstream.status}: ${errTxt || 'no body'}`,
        { status: 502, headers: makeCorsHeaders(origin) }
      );
    }

    // Use shared transformer to normalize OpenAI Responses SSE into UI events
    const upstreamStream = upstream.body!;
    const iterator = transformResponsesStream(upstreamStream);
    let fullText = '';
    const startedAt = Date.now();
    const requestId = prepared.requestId || body.requestId;
    const modelUsed = (payload as any).model || 'unknown';

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Emit an initial event to wake up RN XHR onprogress immediately
        const init = JSON.stringify({ type: 'stream-start' });
        controller.enqueue(encoder.encode(sseLine(init)));
      },
      async pull(controller) {
        const { done, value } = await iterator.next();
        if (done) {
          // Signal completion
          controller.enqueue(encoder.encode(sseLine('[DONE]')));
          // Persist final assistant message and telemetry before closing
          // Centralized finalize step (handles persistence for non-vent only)
          try {
            await ctx.runMutation(
              internal.chatStreaming.finalizeStreamingTurn,
              {
                userId: user._id,
                chatType: body.chatType,
                sessionId: ensuredSessionId,
                content: fullText.trim(),
                model: modelUsed,
                requestId,
                startedAt,
                success: true,
              }
            );
          } catch (e) {
            console.error('finalizeStreamingTurn failed:', e);
          }
          controller.close();
          return;
        }
        if (typeof value === 'string') {
          // Forward directly to client
          controller.enqueue(encoder.encode(value));
          // Accumulate for persistence
          if (value.startsWith('data: ')) {
            const json = value.slice(6).trim();
            if (json && json !== '[DONE]') {
              try {
                const evt = JSON.parse(json);
                if (
                  evt?.type === 'text-delta' &&
                  typeof evt.textDelta === 'string'
                ) {
                  fullText += evt.textDelta;
                }
              } catch {}
            }
          }
        }
      },
      async cancel() {
        try {
          // iterator will end on next pull naturally
        } catch {}
        try {
          if (fullText.trim().length > 0) {
            await ctx.runMutation(
              internal.chatStreaming.finalizeStreamingTurn,
              {
                userId: user._id,
                chatType: body.chatType,
                sessionId: ensuredSessionId,
                content: fullText.trim(),
                model: modelUsed,
                requestId,
                startedAt,
                success: true,
              }
            );
          }
        } catch (e) {
          console.warn('Persist on cancel failed', e);
        }
      },
    });

    // Note: we persist within the stream 'done' branch above

    const response = new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        ...makeCorsHeaders(origin),
      },
    });
    return response;
  } catch (e) {
    console.error('streamChat failed', e);
    return new Response('Internal Server Error', {
      status: 500,
      headers: makeCorsHeaders(getOrigin(request)),
    });
  }
});

// CORS preflight
export const preflight = httpAction(async (ctx, request) => {
  const origin = getOrigin(request);
  if (origin && !isAllowedOrigin(origin)) {
    return new Response(null, {
      status: 403,
      headers: makeCorsHeaders(origin),
    });
  }
  return new Response(null, {
    status: 204,
    headers: makeCorsHeaders(origin),
  });
});

const http = httpRouter();

http.route({ path: '/chat-stream', method: 'POST', handler: streamChat });
http.route({ path: '/chat-stream', method: 'OPTIONS', handler: preflight });

export default http;
