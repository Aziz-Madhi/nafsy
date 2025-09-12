import { v } from 'convex/values';
import { internalAction, internalMutation } from './_generated/server';
import { internal, api } from './_generated/api';
import { buildResponsesPayload } from './openaiResponses';
// Internal API not needed in this module; remove unused imports
// Legacy DB-backed rate limiting removed in favor of component
import appRateLimiter, { tryConsumeGlobalTopup } from './rateLimit';

// Insert user message (no scheduling side effects). Intended for HTTP streaming path.
export const insertUserMessage = internalMutation({
  args: {
    sessionId: v.string(),
    userId: v.id('users'),
    chatType: v.union(
      v.literal('main'),
      v.literal('companion'),
      v.literal('vent')
    ),
    content: v.string(),
    requestId: v.optional(v.string()),
  },
  returns: v.union(
    v.id('mainChatMessages'),
    v.id('companionChatMessages'),
    v.id('ventChatMessages')
  ),
  handler: async (ctx, args) => {
    // Per-user weekly chat limit for user messages (streaming path)
    const status = await appRateLimiter.limit(ctx, 'chatWeekly', {
      key: args.userId,
    });
    if (!status.ok) {
      const consumed = await tryConsumeGlobalTopup(ctx as any);
      if (!consumed) {
        await appRateLimiter.limit(ctx, 'chatWeekly', {
          key: args.userId,
          throws: true,
        });
      }
    }

    const now = Date.now();
    const table =
      args.chatType === 'companion'
        ? 'companionChatMessages'
        : args.chatType === 'vent'
          ? 'ventChatMessages'
          : 'mainChatMessages';

    const sessionType =
      args.chatType === 'companion'
        ? 'companionChatSessions'
        : args.chatType === 'vent'
          ? 'ventChatSessions'
          : 'chatSessions';

    const session = await ctx.db
      .query(sessionType as any)
      .withIndex('by_session_id', (q: any) => q.eq('sessionId', args.sessionId))
      .first();
    if (!session || session.userId !== args.userId) {
      throw new Error('Invalid or unauthorized sessionId');
    }

    const doc: any = {
      userId: args.userId,
      content: args.content,
      role: 'user' as const,
      sessionId: args.sessionId,
      createdAt: now,
    };
    if (args.requestId) doc.requestId = args.requestId;

    const messageId = await ctx.db.insert(table as any, doc);

    await ctx.db.patch(session._id, {
      lastMessageAt: now,
      messageCount: (session.messageCount || 0) + 1,
    });

    return messageId as any;
  },
});

// Insert assistant message once streaming completes (single write)
export const insertAssistantMessage = internalMutation({
  args: {
    sessionId: v.string(),
    userId: v.id('users'),
    chatType: v.union(
      v.literal('main'),
      v.literal('companion'),
      v.literal('vent')
    ),
    content: v.string(),
    requestId: v.optional(v.string()),
  },
  returns: v.union(
    v.id('mainChatMessages'),
    v.id('companionChatMessages'),
    v.id('ventChatMessages')
  ),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Determine which table to use based on chat type
    const table =
      args.chatType === 'companion'
        ? 'companionChatMessages'
        : args.chatType === 'vent'
          ? 'ventChatMessages'
          : 'mainChatMessages';

    // Enforce session ownership prior to insert and metadata updates
    const sessionType =
      args.chatType === 'companion'
        ? 'companionChatSessions'
        : args.chatType === 'vent'
          ? 'ventChatSessions'
          : 'chatSessions';
    const session = await ctx.db
      .query(sessionType as any)
      .withIndex('by_session_id', (q: any) => q.eq('sessionId', args.sessionId))
      .first();
    if (!session || session.userId !== args.userId) {
      throw new Error('Invalid or unauthorized sessionId');
    }

    // Idempotency guard: if the most recent assistant message has identical
    // content or matching requestId for this session, don't insert a duplicate.
    const latest = await ctx.db
      .query(table as any)
      .withIndex('by_user_session', (q: any) =>
        q.eq('userId', args.userId).eq('sessionId', args.sessionId)
      )
      .order('desc')
      .first();

    if (
      latest &&
      latest.role === 'assistant' &&
      typeof latest.content === 'string' &&
      (latest.content.trim() === args.content.trim() ||
        (args.requestId && latest.requestId === args.requestId))
    ) {
      return latest._id as any;
    }

    // Insert final assistant message with full content
    const finalDoc: any = {
      userId: args.userId,
      content: args.content,
      role: 'assistant' as const,
      sessionId: args.sessionId,
      createdAt: now,
    };
    if (args.requestId) finalDoc.requestId = args.requestId;
    const messageId = await ctx.db.insert(table as any, finalDoc);

    // Update session metadata (safe: session verified above)
    await ctx.db.patch(session._id, {
      lastMessageAt: now,
      messageCount: (session.messageCount || 0) + 1,
    });

    // Title summarization is handled client-side via HTTP endpoint

    // Deduplicate any identical assistant messages created very close together
    try {
      const recent = await ctx.db
        .query(table as any)
        .withIndex('by_user_session', (q: any) =>
          q.eq('userId', args.userId).eq('sessionId', args.sessionId)
        )
        .order('desc')
        .take(12);
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      const dupes = recent.filter(
        (m: any) =>
          m.role === 'assistant' &&
          normalize(m.content) === normalize(args.content) &&
          Math.abs(now - m.createdAt) < 15000
      );
      if (dupes.length > 1) {
        // Keep the oldest; delete others
        const toDelete = dupes
          .sort((a: any, b: any) => a._creationTime - b._creationTime)
          .slice(1);
        for (const d of toDelete) {
          await ctx.db.delete(d._id);
        }
      }
    } catch (e) {
      console.warn('Deduplication scan failed:', e);
    }

    return messageId as any;
  },
});

// Lightweight, reusable DB-backed rate limit for HTTP actions
// Removed legacy internal rate limit helpers in favor of component usage

// Basic telemetry recorder (internal-only)
export const recordAITelemetry = internalMutation({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    chatType: v.union(
      v.literal('main'),
      v.literal('companion'),
      v.literal('vent')
    ),
    provider: v.string(),
    model: v.string(),
    requestId: v.optional(v.string()),
    startedAt: v.number(),
    finishedAt: v.number(),
    durationMs: v.number(),
    contentLength: v.number(),
    success: v.boolean(),
  },
  returns: v.id('aiTelemetry'),
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('aiTelemetry', {
      userId: args.userId,
      sessionId: args.sessionId,
      chatType: args.chatType,
      provider: args.provider,
      model: args.model,
      requestId: args.requestId,
      startedAt: args.startedAt,
      finishedAt: args.finishedAt,
      durationMs: args.durationMs,
      contentLength: args.contentLength,
      success: args.success,
      createdAt: Date.now(),
    });
    return id;
  },
});

// Prepare a streaming turn: centralize session, user message insert, prompt/model prep
export const prepareStreamingTurn = internalAction({
  args: {
    userId: v.id('users'),
    chatType: v.union(v.literal('main'), v.literal('companion'), v.literal('vent')),
    message: v.string(),
    sessionId: v.optional(v.string()),
    title: v.optional(v.string()),
    requestId: v.optional(v.string()),
  },
  returns: v.object({
    sessionId: v.string(),
    persistPolicy: v.union(v.literal('store'), v.literal('ephemeral')),
    requestId: v.optional(v.string()),
    payload: v.any(),
    modelConfig: v.optional(
      v.object({
        temperature: v.optional(v.number()),
        maxTokens: v.optional(v.number()),
        topP: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const { userId, chatType } = args;

    // Resolve sessionId and persistence policy
    let sessionId = args.sessionId || '';
    const persistPolicy = chatType === 'vent' ? 'ephemeral' : 'store';

    if (chatType === 'vent') {
      // Ephemeral session id; no DB session or messages
      if (!sessionId) sessionId = `vent_ephemeral_${Date.now()}_${String(userId)}`;
    } else {
      // Ensure session exists; create lazily if missing
      if (!sessionId) sessionId = `${chatType}_${Date.now()}_${String(userId)}`;
      await ctx.runMutation(internal.chatStreaming.ensureSessionExists, {
        userId,
        sessionId,
        chatType: chatType as any,
        title: args.title,
      });

      // Insert user message atomically via internal mutation (rate limits apply inside)
      await ctx.runMutation(internal.chatStreaming.insertUserMessage as any, {
        sessionId,
        userId,
        chatType: chatType as any,
        content: args.message,
        requestId: args.requestId,
      });
    }

    // Determine if we should inject context on this turn (first assistant reply)
    let isNewSession = false;
    if (persistPolicy === 'store') {
      try {
        const recent = await ctx.runQuery(internal.chat._getMessagesForSession as any, {
          userId,
          type: chatType as any,
          sessionId,
          limit: 10,
        });
        isNewSession = !recent.some((m: any) => m.role === 'assistant');
      } catch {}
    }

    // Ensure or read OpenAI conversation id for stored chats; skip for vent
    let conversationId: string | undefined;
    let createdConversation = false;
    if (persistPolicy === 'store') {
      try {
        const meta = await ctx.runMutation(internal.chatStreaming.getSessionMeta as any, {
          userId,
          sessionId,
          chatType: chatType as any,
        });
        conversationId = (meta as any)?.openaiConversationId;
        if (!conversationId) {
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) throw new Error('OpenAI API key not configured');
          const res = await fetch('https://api.openai.com/v1/conversations', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              metadata: {
                app: 'nafsy',
                chatType,
                sessionId,
                userId: String(userId),
              },
            }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json?.id) {
              conversationId = json.id as string;
              createdConversation = true;
              await ctx.runMutation(internal.chatStreaming.setSessionConversationId as any, {
                userId,
                sessionId,
                chatType: chatType as any,
                openaiConversationId: conversationId,
              });
            }
          } else {
            console.warn('Failed to create OpenAI conversation:', await res.text());
          }
        }
      } catch (e) {
        console.warn('OpenAI conversation setup failed:', e);
      }
    }

    // Build Responses API payload using server-side prompt configuration
    const personality = chatType === 'main' ? 'coach' : chatType;
    // Minimal turn: just this user message
    const messages = [{ role: 'user' as const, content: args.message }];

    // Load minimal user info via API for personalization
    const user = await ctx.runQuery(api.personalization._getUserById as any, {
      userId,
    });
    if (!user) {
      throw new Error('User not found');
    }

    const { payload, modelConfig } = await buildResponsesPayload(
      ctx as any,
      personality as any,
      messages,
      { _id: String(user._id), name: user.name, language: user.language },
      {
        conversationId,
        injectContext: createdConversation || isNewSession,
      }
    );

    // The http handler will set payload.stream = true
    return {
      sessionId,
      persistPolicy,
      requestId: args.requestId,
      payload,
      modelConfig: modelConfig as any,
    } as any;
  },
});

// Finalize a streaming turn: persist assistant message and telemetry when applicable
export const finalizeStreamingTurn = internalMutation({
  args: {
    userId: v.id('users'),
    chatType: v.union(v.literal('main'), v.literal('companion'), v.literal('vent')),
    sessionId: v.string(),
    content: v.string(),
    model: v.string(),
    requestId: v.optional(v.string()),
    startedAt: v.number(),
    success: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { chatType, content } = args;
    const now = Date.now();

    // Vent is private: do not persist messages or record content-bearing telemetry
    if (chatType !== 'vent') {
      try {
        await ctx.runMutation(internal.chatStreaming.insertAssistantMessage as any, {
          sessionId: args.sessionId,
          userId: args.userId,
          chatType: chatType as any,
          content: (content || '').trim(),
          requestId: args.requestId,
        });
      } catch (e) {
        console.error('finalizeStreamingTurn: insertAssistantMessage failed', e);
      }

      // Schedule title summarization with a lightweight rate limit
      try {
        const status = await appRateLimiter.limit(ctx as any, 'titleSummarize', {
          key: `${args.userId}:${args.sessionId}` as any,
        });
        if (status.ok) {
          await ctx.scheduler.runAfter(0, internal.titleSummarization.generateAndApplyTitle, {
            userId: args.userId as any,
            sessionId: args.sessionId,
            chatType: chatType as any,
          });
        }
      } catch {}

      // Record telemetry (non-sensitive aggregates)
      try {
        const finishedAt = Date.now();
        await ctx.runMutation(internal.chatStreaming.recordAITelemetry, {
          userId: args.userId,
          sessionId: args.sessionId,
          chatType: chatType as any,
          provider: 'openai',
          model: args.model,
          requestId: args.requestId,
          startedAt: args.startedAt,
          finishedAt,
          durationMs: finishedAt - args.startedAt,
          contentLength: (content || '').length,
          success: args.success,
        });
      } catch {}
    }

    return null;
  },
});

// Ensure a session exists for the given chat type and sessionId
export const ensureSessionExists = internalMutation({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    chatType: v.union(
      v.literal('main'),
      v.literal('companion'),
      v.literal('vent')
    ),
    title: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.chatType === 'main') {
      const existing = await ctx.db
        .query('chatSessions')
        .withIndex('by_session_id', (q: any) =>
          q.eq('sessionId', args.sessionId)
        )
        .first();
      if (!existing) {
        await ctx.db.insert('chatSessions', {
          userId: args.userId,
          sessionId: args.sessionId,
          title: args.title || 'Chat Session',
          startedAt: now,
          lastMessageAt: now,
          messageCount: 0,
        });
      }
      return null;
    }

    if (args.chatType === 'companion') {
      const existing = await ctx.db
        .query('companionChatSessions')
        .withIndex('by_session_id', (q: any) =>
          q.eq('sessionId', args.sessionId)
        )
        .first();
      if (!existing) {
        await ctx.db.insert('companionChatSessions', {
          userId: args.userId,
          sessionId: args.sessionId,
          title: args.title || 'Check-in',
          startedAt: now,
          lastMessageAt: now,
          messageCount: 0,
        });
      }
      return null;
    }

    // vent
    const existing = await ctx.db
      .query('ventChatSessions')
      .withIndex('by_session_id', (q: any) => q.eq('sessionId', args.sessionId))
      .first();
    if (!existing) {
      await ctx.db.insert('ventChatSessions', {
        userId: args.userId,
        sessionId: args.sessionId,
        title: args.title || 'Quick Vent Session',
        startedAt: now,
        lastMessageAt: now,
        messageCount: 0,
      });
    }
    return null;
  },
});

// Fetch minimal session metadata (openaiConversationId) by sessionId + type
export const getSessionMeta = internalMutation({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    chatType: v.union(
      v.literal('main'),
      v.literal('companion'),
      v.literal('vent')
    ),
  },
  returns: v.union(
    v.object({
      _id: v.union(
        v.id('chatSessions'),
        v.id('companionChatSessions'),
        v.id('ventChatSessions')
      ),
      openaiConversationId: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const table =
      args.chatType === 'main'
        ? 'chatSessions'
        : args.chatType === 'companion'
          ? 'companionChatSessions'
          : 'ventChatSessions';
    const session = await ctx.db
      .query(table as any)
      .withIndex('by_session_id', (q: any) => q.eq('sessionId', args.sessionId))
      .first();
    if (!session || session.userId !== args.userId) return null as any;
    return {
      _id: session._id as any,
      openaiConversationId: (session as any).openaiConversationId,
    } as any;
  },
});

// Set OpenAI conversation id on session (ownership enforced)
export const setSessionConversationId = internalMutation({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    chatType: v.union(
      v.literal('main'),
      v.literal('companion'),
      v.literal('vent')
    ),
    openaiConversationId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const table =
      args.chatType === 'main'
        ? 'chatSessions'
        : args.chatType === 'companion'
          ? 'companionChatSessions'
          : 'ventChatSessions';
    const session = await ctx.db
      .query(table as any)
      .withIndex('by_session_id', (q: any) => q.eq('sessionId', args.sessionId))
      .first();
    if (!session || session.userId !== args.userId) return false;
    await ctx.db.patch(session._id, {
      openaiConversationId: args.openaiConversationId,
    } as any);
    return true;
  },
});
