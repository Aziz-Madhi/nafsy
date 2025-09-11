import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
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
