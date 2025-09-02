import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal, api } from './_generated/api';
import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { Id } from './_generated/dataModel';
import {
  buildResponsesPayload,
  streamFromResponsesAPI,
  transformResponsesStream,
  isResponsesAPIEnabled,
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

  // Check if we should use the new OpenAI Responses API
  if (isResponsesAPIEnabled()) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('Using OpenAI Responses API for personality:', personality);
    }
    // New approach: OpenAI Responses API with Prompt IDs
    try {
      const { payload, modelConfig } = await buildResponsesPayload(
        ctx,
        personality,
        messages
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
      const openaiResponse = await streamFromResponsesAPI(apiKey, payload, modelConfig);
      
      // Transform to UI Message stream format
      const transformedStream = new ReadableStream({
        async start(controller) {
          let accumulatedContent = '';
          let chunkCount = 0;
          
          try {
            if (process.env.NODE_ENV !== 'production') {
              console.debug('Starting stream transformation');
            }

            for await (const chunk of transformResponsesStream(openaiResponse.body!)) {
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
              await ctx.runMutation(internal.chatStreaming.insertAssistantMessage, {
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
              });
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
              personality === 'coach' ? 'main' : personality === 'companion' ? 'companion' : 'vent';
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
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      console.error('OpenAI Responses API error:', error);
      return jsonError(500, 'AI_ERROR', 'Failed to generate response', cors);
    }
  } else {
    // Legacy approach: Vercel AI SDK with inline prompts
    const promptConfig = await ctx.runQuery(api.aiPrompts.getPrompt, {
      personality,
    });

    // Get prompt content (inline or fallback)
    const systemPrompt =
      promptConfig?.prompt ||
      (personality === 'coach'
        ? process.env.COACH_SYSTEM_PROMPT
        : personality === 'companion'
          ? process.env.COMPANION_SYSTEM_PROMPT
          : process.env.VENT_SYSTEM_PROMPT) ||
      (personality === 'coach'
        ? `You are a compassionate and professional therapist specializing in Cognitive Behavioral Therapy (CBT). You provide structured, evidence-based therapeutic support. You listen actively, validate emotions, and guide users through their challenges with empathy and expertise. Keep responses concise but meaningful. Detect the user's language from their messages and respond in the same language naturally.`
        : personality === 'companion'
          ? `You are a friendly and supportive daily companion. You check in on the user's wellbeing, celebrate their victories, and provide encouragement during difficult times. You're warm, approachable, and genuinely caring. Keep responses conversational and supportive. Detect the user's language from their messages and respond in the same language naturally.`
          : `You are a safe, non-judgmental listener for emotional release. Acknowledge feelings without trying to fix them. Provide validation and gentle support, allowing the user to express themselves freely. Keep responses brief and empathetic. Detect the user's language from their messages and respond in the same language naturally.`);

    const uiMessages: UIMessage[] = toUiMessages(messages);

    // Use model configuration from database with fallbacks
    const modelName = promptConfig?.model || 'gpt-4o-mini';
    modelUsed = modelName;
    const temperature = promptConfig?.temperature || (personality === 'coach' ? 0.7 : 0.8);
    const maxTokens = promptConfig?.maxTokens;
    const topP = promptConfig?.topP;

    const streamTextConfig: any = {
      model: openai(modelName),
      messages: [
        { role: 'system', content: systemPrompt },
        ...convertToModelMessages(uiMessages),
      ],
      temperature: temperature,
    };

    // Add optional parameters if configured
    if (maxTokens !== undefined) {
      streamTextConfig.maxTokens = maxTokens;
    }
    if (topP !== undefined) {
      streamTextConfig.topP = topP;
    }

    // Add onFinish callback for persistence
    streamTextConfig.onFinish = async ({ text }: { text: string }) => {
      try {
        const finalText = (text ?? '').trim();
        if (!finalText) return;
        await ctx.runMutation(internal.chatStreaming.insertAssistantMessage, {
          sessionId,
          userId: user._id as Id<'users'>,
          chatType:
            personality === 'coach'
              ? 'main'
              : personality === 'companion'
                ? 'companion'
                : 'vent',
          content: finalText,
          requestId,
        });
        // telemetry
        const finishedAt = Date.now();
        const chatType =
          personality === 'coach' ? 'main' : personality === 'companion' ? 'companion' : 'vent';
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
            contentLength: finalText.length,
            success: true,
          });
        } catch {}
      } catch (err) {
        console.error('Failed to insert assistant message:', err);
      }
    };

    const result = streamText(streamTextConfig);

    return result.toUIMessageStreamResponse({
      headers: cors,
    });
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
