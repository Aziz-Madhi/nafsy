import { api, internal } from './_generated/api';

// Simple in-memory prompt cache (best-effort on warm instances)
const promptCache = new Map<string, { data: any; expires: number }>();
const PROMPT_CACHE_TTL_MS = Number(process.env.PROMPT_CACHE_TTL_MS || 30_000);
const isDevEnv = process.env.NODE_ENV !== 'production';

/**
 * OpenAI Responses API Integration
 * Supports Prompt IDs with optional versioning
 */

interface OpenAIResponsesRequest {
  model: string;
  prompt?: {
    id: string;
    version?: string;
  };
  instructions?: string;
  input: { role: 'user' | 'assistant' | 'system'; content: string }[];
  // OpenAI Conversations API conversation id (conv_...)
  conversation?: string;
  stream?: boolean;
}

/**
 * Build OpenAI Responses API request payload
 */
export async function buildResponsesPayload(
  ctx: any,
  personality: 'coach' | 'companion' | 'vent',
  messages: { role: 'user' | 'assistant'; content?: string; parts?: any[] }[],
  user: { _id: string; name?: string; language: string },
  options?: { injectContext?: boolean; conversationId?: string }
): Promise<{
  payload: OpenAIResponsesRequest;
  modelConfig?: { temperature?: number; maxTokens?: number; topP?: number };
}> {
  // Fetch prompt configuration from cache/DB
  let promptConfig: any | null = null;
  const cacheKey = `prompt:${personality}`;
  const now = Date.now();
  const cached = promptCache.get(cacheKey);
  if (cached && cached.expires > now) {
    promptConfig = cached.data;
  } else {
    promptConfig = await ctx.runQuery(api.aiPrompts.getPrompt, { personality });
    promptCache.set(cacheKey, {
      data: promptConfig,
      expires: now + PROMPT_CACHE_TTL_MS,
    });
  }
  if (isDevEnv) {
    console.debug('Loaded prompt config for', personality);
  }

  // Only build user context if we may inject it
  const defaultIsNew = !messages.some((m) => m.role === 'assistant');
  const willInjectContext =
    options?.injectContext !== undefined ? options.injectContext : defaultIsNew;

  let userContext: { text: string; level: string } | null = null;
  if (willInjectContext) {
    try {
      userContext = await ctx.runQuery(
        internal.personalization.buildUserContext,
        {
          user,
          personality,
          messages,
        }
      );
      if (isDevEnv && userContext) {
        console.debug(
          `Built user context (${userContext.level}):`,
          userContext.text.length,
          'chars'
        );
        // Log first 200 chars to verify content
        console.debug(
          'User context preview:',
          userContext.text.substring(0, 200)
        );
      }
    } catch (error) {
      console.error('Failed to build user context:', error);
    }
  }

  // Convert messages to required format, handling parts if present
  const formattedMessages = messages.map((msg) => ({
    role: msg.role,
    content:
      msg.content ||
      (msg.parts ? msg.parts.map((p: any) => p.text || '').join('') : ''),
  }));

  // Do NOT inject user context into the user's message.
  // We keep it system-level on the first turn only (or as instructed)
  // so the model treats it as background memory, not conversational content.

  // Require model from database config (no fallback)
  if (!promptConfig) {
    throw new Error(`Prompt config not found for personality: ${personality}`);
  }
  if (!promptConfig.model) {
    throw new Error(`Prompt model missing for personality: ${personality}`);
  }
  const model = String(promptConfig.model);

  const payload: OpenAIResponsesRequest = {
    model: model,
    input: formattedMessages,
    stream: true,
  };

  // Attach conversation id if provided (OpenAI Conversations API)
  if (options?.conversationId) {
    payload.conversation = options.conversationId;
  }

  // Use OpenAI Prompt ID if configured
  if (
    promptConfig.source.startsWith('openai_prompt') &&
    promptConfig.openaiPromptId
  ) {
    if (isDevEnv) console.debug('Using OpenAI Prompt ID');
    payload.prompt = { id: promptConfig.openaiPromptId };

    // Add version for pinned prompts
    if (
      promptConfig.source === 'openai_prompt_pinned' &&
      promptConfig.openaiPromptVersion
    ) {
      payload.prompt.version = String(promptConfig.openaiPromptVersion);
      if (isDevEnv)
        console.debug('Pinned prompt version:', payload.prompt.version);
    }
    // For Prompt IDs, prefer a system message carrying context on first turn
    const shouldInject = willInjectContext;
    if (shouldInject && userContext?.text) {
      payload.input = [
        { role: 'system', content: userContext.text },
        ...payload.input,
      ];
    }
  } else if (promptConfig.source === 'inline' && promptConfig.prompt) {
    if (isDevEnv) console.debug('Using inline prompt');
    // Use inline prompt content with user context
    payload.instructions = promptConfig.prompt;
    // Also include user context as a system message on first turn for clarity
    const shouldInject = willInjectContext;
    if (shouldInject && userContext?.text) {
      payload.input = [
        { role: 'system', content: userContext.text },
        ...payload.input,
      ];
    }
  } else {
    throw new Error('Invalid or incomplete prompt configuration');
  }

  // Extract model configuration
  const modelConfig = {
    temperature: promptConfig?.temperature,
    maxTokens: promptConfig?.maxTokens,
    topP: promptConfig?.topP,
  };

  return { payload, modelConfig };
}

/**
 * Stream response from OpenAI Responses API
 */
export async function streamFromResponsesAPI(
  apiKey: string,
  payload: OpenAIResponsesRequest,
  modelConfig?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): Promise<Response> {
  if (isDevEnv) {
    console.debug('Calling OpenAI Responses API');
  }

  // Use the /v1/responses endpoint with proper payload structure
  const responsesPayload: any = {
    model: payload.model,
    stream: payload.stream,
  };

  // Add model configuration parameters
  if (modelConfig?.temperature !== undefined) {
    responsesPayload.temperature = modelConfig.temperature;
  }
  if (modelConfig?.maxTokens !== undefined) {
    responsesPayload.max_output_tokens = modelConfig.maxTokens;
  }
  if (modelConfig?.topP !== undefined) {
    responsesPayload.top_p = modelConfig.topP;
  }

  // Add prompt configuration if available
  if (payload.prompt) {
    responsesPayload.prompt = payload.prompt;
  } else if (payload.instructions) {
    // Fallback to instructions if no prompt ID
    responsesPayload.instructions = payload.instructions;
  }

  // Attach conversation id if provided
  if (payload.conversation) {
    responsesPayload.conversation = payload.conversation;
  }

  // Format input messages properly for responses API
  responsesPayload.input = payload.input;

  if (isDevEnv) {
    console.debug('Dispatching to /v1/responses');
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(responsesPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI Responses API error:', response.status);
    throw new Error(
      `OpenAI Responses API error: ${response.status} - ${error}`
    );
  }

  if (isDevEnv) console.debug('OpenAI Responses API call successful');
  return response;
}

/**
 * Transform OpenAI Responses stream to UI Message stream format
 * This maintains compatibility with existing client code
 */
export async function* transformResponsesStream(
  stream: ReadableStream<Uint8Array>
): AsyncGenerator<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            yield `data: [DONE]\n\n`;
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            // OpenAI Responses API returns in this format:
            // { "id": "...", "object": "chat.completion.chunk", "choices": [...] }
            // OR for responses API specifically:
            // { "response": { "content": "..." } }

            let content = '';

            // Check for various possible formats
            // The Responses API sends content in the delta field directly
            if (parsed.type === 'response.output_text.delta' && parsed.delta) {
              // This is the actual content streaming format from Responses API
              content = parsed.delta;
            } else if (
              parsed.type === 'response.output_text.done' &&
              parsed.text
            ) {
              // Final complete text (we can skip this as we already have the deltas)
              // content = parsed.text;
            } else if (parsed.response?.content) {
              // Alternative Responses API format
              content = parsed.response.content;
            } else if (parsed.choices?.[0]?.delta?.content) {
              // Standard chat completions streaming format
              content = parsed.choices[0].delta.content;
            } else if (parsed.choices?.[0]?.message?.content) {
              // Non-streaming format
              content = parsed.choices[0].message.content;
            } else if (parsed.delta?.content) {
              // Alternative delta format
              content = parsed.delta.content;
            } else if (parsed.content) {
              // Direct content
              content = parsed.content;
            }

            if (content) {
              const uiChunk = {
                type: 'text-delta',
                textDelta: content,
              };
              yield `data: ${JSON.stringify(uiChunk)}\n\n`;
            }
          } catch (e) {
            if (isDevEnv) console.warn('Failed to parse chunk');
          }
        }
      }
    }

    // Ensure we send a final DONE message
    yield `data: [DONE]\n\n`;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Get default prompt as fallback
 */
function getDefaultPrompt(personality: 'coach' | 'companion' | 'vent'): string {
  const prompts = {
    coach: `You are a compassionate and professional therapist specializing in Cognitive Behavioral Therapy (CBT). You provide structured, evidence-based therapeutic support. You listen actively, validate emotions, and guide users through their challenges with empathy and expertise. Keep responses concise but meaningful. Detect the user's language from their messages and respond in the same language naturally.`,
    companion: `You are a friendly and supportive daily companion. You check in on the user's wellbeing, celebrate their victories, and provide encouragement during difficult times. You're warm, approachable, and genuinely caring. Keep responses conversational and supportive. Detect the user's language from their messages and respond in the same language naturally.`,
    vent: `You are a safe, non-judgmental listener for emotional release. Acknowledge feelings without trying to fix them. Provide validation and gentle support, allowing the user to express themselves freely. Keep responses brief and empathetic. Detect the user's language from their messages and respond in the same language naturally.`,
  };

  return prompts[personality];
}

/**
 * Check if OpenAI Responses API is enabled
 * Can be used for gradual rollout
 */
export function isResponsesAPIEnabled(): boolean {
  // Enforce Responses API only
  return true;
}
