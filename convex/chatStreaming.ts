import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { Id } from './_generated/dataModel';
import { checkRateLimitDb } from './errorUtils';

// Insert assistant message once streaming completes (single write)
export const insertAssistantMessage = internalMutation({
  args: {
    sessionId: v.string(),
    userId: v.id('users'),
    chatType: v.union(v.literal('main'), v.literal('companion'), v.literal('vent')),
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
export const applyRateLimit = internalMutation({
  args: {
    key: v.string(),
    limit: v.optional(v.number()),
    windowMs: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const windowMs = args.windowMs ?? 60_000; // 1 minute
    await checkRateLimitDb(ctx, args.key, limit, windowMs);
    return null;
  },
});

// Basic telemetry recorder (internal-only)
export const recordAITelemetry = internalMutation({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    chatType: v.union(v.literal('main'), v.literal('companion'), v.literal('vent')),
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
