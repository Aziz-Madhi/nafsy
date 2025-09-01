import { v } from 'convex/values';
import { internalMutation } from './_generated/server';
import { Id } from './_generated/dataModel';
import { checkRateLimitDb } from './errorUtils';

// Create a new assistant message placeholder
export const createAssistantMessage = internalMutation({
  args: {
    sessionId: v.string(),
    userId: v.id('users'),
    chatType: v.union(v.literal('main'), v.literal('companion')),
    requestId: v.optional(v.string()),
  },
  returns: v.id('mainChatMessages'),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Determine which table to use based on chat type
    const table = args.chatType === 'companion' ? 'companionChatMessages' : 'mainChatMessages';

    // Validate session ownership before creating a placeholder
    const sessionTable =
      args.chatType === 'companion' ? 'companionChatSessions' : 'chatSessions';
    const session = await ctx.db
      .query(sessionTable as any)
      .withIndex('by_session_id', (q: any) => q.eq('sessionId', args.sessionId))
      .first();
    if (!session || session.userId !== args.userId) {
      throw new Error('Invalid or unauthorized sessionId');
    }
    
    // If a placeholder with the same requestId exists, return it (scan recent)
    if (args.requestId) {
      const recent = await ctx.db
        .query(table as any)
        .withIndex('by_user_session', (q: any) =>
          q.eq('userId', args.userId).eq('sessionId', args.sessionId)
        )
        .order('desc')
        .take(12);
      const dup = recent.find((m: any) => m.requestId === args.requestId);
      if (dup) {
        return dup._id as Id<'mainChatMessages'>;
      }
    }

    // Create message with empty content
    const baseDoc: any = {
      userId: args.userId,
      content: '',
      role: 'assistant' as const,
      sessionId: args.sessionId,
      createdAt: now,
    };
    if (args.requestId) baseDoc.requestId = args.requestId;
    const messageId = await ctx.db.insert(table as any, baseDoc);
    
    // Update session metadata
    await ctx.db.patch(session._id, {
      lastMessageAt: now,
      messageCount: (session.messageCount || 0) + 1,
    });
    
    return messageId as Id<'mainChatMessages'>;
  },
});

// Update message content during streaming
export const updateStreamingMessage = internalMutation({
  args: {
    id: v.id('mainChatMessages'),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Try to update in mainChatMessages first
    const mainMessage = await ctx.db.get(args.id);
    if (mainMessage) {
      await ctx.db.patch(args.id, {
        content: args.content,
      });
      return null;
    }
    
    // If not found, try companionChatMessages
    // Note: This is a workaround since we're using a union ID type
    try {
      const companionId = args.id as unknown as Id<'companionChatMessages'>;
      const companionMessage = await ctx.db.get(companionId);
      if (companionMessage) {
        await ctx.db.patch(companionId, {
          content: args.content,
        });
      }
    } catch (error) {
      console.error('Message not found in either table:', args.id);
    }
    
    return null;
  },
});

// Finalize message content when streaming completes
export const finalizeStreamingMessage = internalMutation({
  args: {
    id: v.id('mainChatMessages'),
    content: v.string(),
    requestId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Try to update in mainChatMessages first
    const mainMessage = await ctx.db.get(args.id);
    if (mainMessage) {
      await ctx.db.patch(args.id, {
        content: args.content,
        ...(args.requestId ? { requestId: args.requestId } : {}),
      });

      // Deduplicate recent assistant messages in this session (keep the longest)
      try {
        const recent = await ctx.db
          .query('mainChatMessages')
          .withIndex('by_user_session', (q) =>
            q.eq('userId', mainMessage.userId).eq('sessionId', mainMessage.sessionId)
          )
          .order('desc')
          .take(12);
        const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
        const cand = recent.filter((m: any) => m.role === 'assistant');
        let keep: any | null = null;
        for (const m of cand) {
          if (!keep || (m.content || '').length > (keep.content || '').length) keep = m;
        }
        if (keep) {
          for (const m of cand) {
            if (m._id === keep._id) continue;
            const a = norm(keep.content || '');
            const b = norm(m.content || '');
            if (!a || !b) continue;
            if (a === b || a.endsWith(b) || b.endsWith(a)) {
              await ctx.db.delete(m._id);
            }
          }
        }
      } catch (e) {
        console.warn('Finalize dedupe (main) failed:', e);
      }
      return null;
    }
    
    // If not found, try companionChatMessages
    try {
      const companionId = args.id as unknown as Id<'companionChatMessages'>;
      const companionMessage = await ctx.db.get(companionId);
      if (companionMessage) {
        await ctx.db.patch(companionId, {
          content: args.content,
          ...(args.requestId ? { requestId: args.requestId } : {}),
        });

        // Deduplicate in companion table (keep the longest)
        try {
          const recent = await ctx.db
            .query('companionChatMessages')
            .withIndex('by_user_session', (q) =>
              q.eq('userId', companionMessage.userId).eq('sessionId', companionMessage.sessionId)
            )
            .order('desc')
            .take(12);
          const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
          const cand = recent.filter((m: any) => m.role === 'assistant');
          let keep: any | null = null;
          for (const m of cand) {
            if (!keep || (m.content || '').length > (keep.content || '').length) keep = m;
          }
          if (keep) {
            for (const m of cand) {
              if (m._id === keep._id) continue;
              const a = norm(keep.content || '');
              const b = norm(m.content || '');
              if (!a || !b) continue;
              if (a === b || a.endsWith(b) || b.endsWith(a)) {
                await ctx.db.delete(m._id);
              }
            }
          }
        } catch (e) {
          console.warn('Finalize dedupe (companion) failed:', e);
        }
      }
    } catch (error) {
      console.error('Message not found in either table:', args.id);
    }
    
    return null;
  },
});

// Insert assistant message once streaming completes (single write)
export const insertAssistantMessage = internalMutation({
  args: {
    sessionId: v.string(),
    userId: v.id('users'),
    chatType: v.union(v.literal('main'), v.literal('companion')),
    content: v.string(),
    requestId: v.optional(v.string()),
  },
  returns: v.id('mainChatMessages'),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Determine which table to use based on chat type
    const table =
      args.chatType === 'companion' ? 'companionChatMessages' : 'mainChatMessages';

    // Enforce session ownership prior to insert and metadata updates
    const sessionType =
      args.chatType === 'companion' ? 'companionChatSessions' : 'chatSessions';
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
      return latest._id as Id<'mainChatMessages'>;
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

    return messageId as Id<'mainChatMessages'>;
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
