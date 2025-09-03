import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { updateChatSession } from './chatUtils';
import { getAuthenticatedUser } from './authUtils';
import { paginationOptsValidator } from 'convex/server';

// Chat type enum for unified functions
const ChatType = v.union(
  v.literal('main'),
  v.literal('vent'),
  v.literal('companion')
);

/**
 * Unified chat message sending for both main and vent chats
 * Replaces: sendMainMessage + sendVentMessage
 */
export const sendChatMessage = mutation({
  args: {
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    type: ChatType,
    sessionId: v.optional(v.string()),
  },
  returns: v.union(
    v.id('mainChatMessages'),
    v.id('ventChatMessages'),
    v.id('companionChatMessages')
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    // Create session ID if not provided
    const sessionId =
      args.sessionId || `${args.type}_${Date.now()}_${user._id}`;

    let messageId: any;

    if (args.type === 'main') {
      // Insert to main chat messages table
      messageId = await ctx.db.insert('mainChatMessages', {
        userId: user._id,
        content: args.content,
        role: args.role,
        sessionId,
        createdAt: Date.now(),
      });

      // Update main session metadata using existing utility
      await updateChatSession(ctx, user._id, sessionId);
    } else if (args.type === 'vent') {
      // Insert to vent chat messages table
      messageId = await ctx.db.insert('ventChatMessages', {
        userId: user._id,
        content: args.content,
        role: args.role,
        sessionId,
        createdAt: Date.now(),
      });

      // Create/update vent session metadata
      let session = await ctx.db
        .query('ventChatSessions')
        .withIndex('by_session_id', (q) => q.eq('sessionId', sessionId))
        .first();

      if (!session) {
        // Create new vent session
        await ctx.db.insert('ventChatSessions', {
          userId: user._id,
          sessionId,
          title: 'Quick Vent Session',
          startedAt: Date.now(),
          lastMessageAt: Date.now(),
          messageCount: 1,
        });
      } else {
        // Update existing vent session
        await ctx.db.patch(session._id, {
          lastMessageAt: Date.now(),
          messageCount: session.messageCount + 1,
        });
      }
    } else {
      // Insert to companion chat messages table
      messageId = await ctx.db.insert('companionChatMessages', {
        userId: user._id,
        content: args.content,
        role: args.role,
        sessionId,
        createdAt: Date.now(),
      });

      // Create/update companion session metadata
      let session = await ctx.db
        .query('companionChatSessions')
        .withIndex('by_session_id', (q) => q.eq('sessionId', sessionId))
        .first();

      if (!session) {
        // Create new companion session
        await ctx.db.insert('companionChatSessions', {
          userId: user._id,
          sessionId,
          title: `Check-in ${new Date().toLocaleDateString()}`,
          startedAt: Date.now(),
          lastMessageAt: Date.now(),
          messageCount: 1,
        });
      } else {
        // Update existing companion session
        await ctx.db.patch(session._id, {
          lastMessageAt: Date.now(),
          messageCount: session.messageCount + 1,
        });
      }
    }

    return messageId;
  },
});

/**
 * Unified chat message retrieval for both main and vent chats
 * Replaces: getMainChatMessages + getVentMessages
 */
export const getChatMessages = query({
  args: {
    type: ChatType,
    sessionId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.union(
        v.id('mainChatMessages'),
        v.id('ventChatMessages'),
        v.id('companionChatMessages')
      ),
      _creationTime: v.number(),
      userId: v.id('users'),
      content: v.string(),
      role: v.union(v.literal('user'), v.literal('assistant')),
      sessionId: v.optional(v.string()), // Made optional to accommodate ventChatMessages
      createdAt: v.number(),
      requestId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const limit = args.limit || 50;

    if (args.type === 'main') {
      const base = ctx.db.query('mainChatMessages');
      const indexed = args.sessionId
        ? base.withIndex('by_user_session', (qi) =>
            qi.eq('userId', user._id).eq('sessionId', args.sessionId!)
          )
        : base.withIndex('by_user', (qi) => qi.eq('userId', user._id));
      const messages = await indexed.order('desc').take(limit);
      return messages;
    } else if (args.type === 'vent') {
      const base = ctx.db.query('ventChatMessages');
      const indexed = args.sessionId
        ? base.withIndex('by_user_session', (qi) =>
            qi.eq('userId', user._id).eq('sessionId', args.sessionId!)
          )
        : base.withIndex('by_user', (qi) => qi.eq('userId', user._id));
      const messages = await indexed.order('desc').take(limit);

      // For vent messages without sessionId, get latest session if no specific session requested
      if (!args.sessionId && messages.length === 0) {
        const latestSession = await ctx.db
          .query('ventChatSessions')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .order('desc')
          .first();

        if (latestSession) {
          const sessionMessages = await ctx.db
            .query('ventChatMessages')
            .withIndex('by_user_session', (q) =>
              q.eq('userId', user._id).eq('sessionId', latestSession.sessionId)
            )
            .order('asc')
            .take(limit);

          return sessionMessages;
        }
      }
      return messages;
    } else {
      const base = ctx.db.query('companionChatMessages');
      const indexed = args.sessionId
        ? base.withIndex('by_user_session', (qi) =>
            qi.eq('userId', user._id).eq('sessionId', args.sessionId!)
          )
        : base.withIndex('by_user', (qi) => qi.eq('userId', user._id));
      const messages = await indexed.order('desc').take(limit);

      if (!args.sessionId && messages.length === 0) {
        const latestSession = await ctx.db
          .query('companionChatSessions')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .order('desc')
          .first();

        if (latestSession) {
          const sessionMessages = await ctx.db
            .query('companionChatMessages')
            .withIndex('by_user_session', (q) =>
              q.eq('userId', user._id).eq('sessionId', latestSession.sessionId)
            )
            .order('asc')
            .take(limit);

          return sessionMessages;
        }
      }
      return messages;
    }
  },
});

// Paginated variant for chat messages
export const getChatMessagesPaginated = query({
  args: {
    type: ChatType,
    sessionId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.union(
          v.id('mainChatMessages'),
          v.id('ventChatMessages'),
          v.id('companionChatMessages')
        ),
        _creationTime: v.number(),
        userId: v.id('users'),
        content: v.string(),
        role: v.union(v.literal('user'), v.literal('assistant')),
        sessionId: v.optional(v.string()),
        createdAt: v.number(),
        requestId: v.optional(v.string()),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (args.type === 'main') {
      const base = ctx.db.query('mainChatMessages');
      const indexed = args.sessionId
        ? base.withIndex('by_user_session', (qi) =>
            qi.eq('userId', user._id).eq('sessionId', args.sessionId!)
          )
        : base.withIndex('by_user', (qi) => qi.eq('userId', user._id));
      return await indexed.order('desc').paginate(args.paginationOpts);
    } else if (args.type === 'vent') {
      const base = ctx.db.query('ventChatMessages');
      const indexed = args.sessionId
        ? base.withIndex('by_user_session', (qi) =>
            qi.eq('userId', user._id).eq('sessionId', args.sessionId!)
          )
        : base.withIndex('by_user', (qi) => qi.eq('userId', user._id));
      return await indexed.order('desc').paginate(args.paginationOpts);
    } else {
      const base = ctx.db.query('companionChatMessages');
      const indexed = args.sessionId
        ? base.withIndex('by_user_session', (qi) =>
            qi.eq('userId', user._id).eq('sessionId', args.sessionId!)
          )
        : base.withIndex('by_user', (qi) => qi.eq('userId', user._id));
      return await indexed.order('desc').paginate(args.paginationOpts);
    }
  },
});

/**
 * Unified session retrieval for both main and vent chats
 * Replaces: getMainSessions + getVentSessions
 */
export const getChatSessions = query({
  args: {
    type: ChatType,
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.union(
        v.id('chatSessions'),
        v.id('ventChatSessions'),
        v.id('companionChatSessions')
      ),
      _creationTime: v.number(),
      userId: v.id('users'),
      sessionId: v.string(),
      title: v.string(),
      startedAt: v.number(),
      lastMessageAt: v.number(),
      messageCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const limit = args.limit || 20;

    if (args.type === 'main') {
      const sessions = await ctx.db
        .query('chatSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .take(limit);

      // Filter to only return main chat sessions
      return sessions
        .filter(
          (session) =>
            !session.type ||
            session.type === 'main' ||
            session.sessionId.startsWith('main_')
        )
        .map(({ type, ...session }) => session);
    } else if (args.type === 'vent') {
      // Vent sessions
      return await ctx.db
        .query('ventChatSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .take(limit);
    } else {
      // Companion sessions
      return await ctx.db
        .query('companionChatSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .take(limit);
    }
  },
});

// Paginated variant for chat sessions
export const getChatSessionsPaginated = query({
  args: {
    type: ChatType,
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.union(
          v.id('chatSessions'),
          v.id('ventChatSessions'),
          v.id('companionChatSessions')
        ),
        _creationTime: v.number(),
        userId: v.id('users'),
        sessionId: v.string(),
        title: v.string(),
        startedAt: v.number(),
        lastMessageAt: v.number(),
        messageCount: v.number(),
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (args.type === 'main') {
      const res = await ctx.db
        .query('chatSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .paginate(args.paginationOpts);
      // Filter main-only sessions in page to preserve index usage
      const page = res.page
        .filter(
          (session) =>
            !session.type ||
            session.type === 'main' ||
            session.sessionId.startsWith('main_')
        )
        .map(({ type, ...session }) => session);
      return { ...res, page };
    } else if (args.type === 'vent') {
      return await ctx.db
        .query('ventChatSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .paginate(args.paginationOpts);
    } else {
      return await ctx.db
        .query('companionChatSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .paginate(args.paginationOpts);
    }
  },
});

/**
 * Unified current session ID retrieval
 * Replaces: getCurrentMainSessionId + getCurrentVentSessionId
 */
export const getCurrentSessionId = query({
  args: {
    type: ChatType,
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (args.type === 'main') {
      const latestSession = await ctx.db
        .query('chatSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .first();

      // Only return main session IDs
      if (
        latestSession &&
        (!latestSession.type ||
          latestSession.type === 'main' ||
          latestSession.sessionId.startsWith('main_'))
      ) {
        return latestSession.sessionId;
      }
    } else if (args.type === 'vent') {
      // Vent sessions
      const latestSession = await ctx.db
        .query('ventChatSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .first();

      return latestSession?.sessionId || null;
    } else {
      const latestSession = await ctx.db
        .query('companionChatSessions')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .order('desc')
        .first();
      return latestSession?.sessionId || null;
    }

    return null;
  },
});

/**
 * Unified session creation
 * Replaces: startNewMainSession + createVentSession
 */
export const createChatSession = mutation({
  args: {
    type: ChatType,
    title: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const sessionId = `${args.type}_${Date.now()}_${user._id}`;

    if (args.type === 'main') {
      await ctx.db.insert('chatSessions', {
        userId: user._id,
        sessionId,
        title: args.title || 'New Chat Session',
        startedAt: Date.now(),
        lastMessageAt: Date.now(),
        messageCount: 0,
      });
    } else if (args.type === 'vent') {
      const title =
        args.title || `Vent Session ${new Date().toLocaleDateString()}`;
      await ctx.db.insert('ventChatSessions', {
        userId: user._id,
        sessionId,
        title,
        startedAt: Date.now(),
        lastMessageAt: Date.now(),
        messageCount: 0,
      });
    } else {
      const title =
        args.title ||
        `Check-in ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        )}`;
      await ctx.db.insert('companionChatSessions', {
        userId: user._id,
        sessionId,
        title,
        startedAt: Date.now(),
        lastMessageAt: Date.now(),
        messageCount: 0,
      });
    }

    return sessionId;
  },
});

/**
 * Unified session deletion
 * Replaces: deleteMainSession + deleteVentSession
 */
export const deleteChatSession = mutation({
  args: {
    type: ChatType,
    sessionId: v.string(),
  },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const messagesTableName =
      args.type === 'main'
        ? 'mainChatMessages'
        : args.type === 'vent'
          ? 'ventChatMessages'
          : 'companionChatMessages';
    const sessionsTableName =
      args.type === 'main'
        ? 'chatSessions'
        : args.type === 'vent'
          ? 'ventChatSessions'
          : 'companionChatSessions';

    // Delete all messages in the session
    const messages = await ctx.db
      .query(messagesTableName)
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), user._id),
          q.eq(q.field('sessionId'), args.sessionId)
        )
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete session metadata
    let session;
    if (args.type === 'main') {
      session = await ctx.db
        .query(sessionsTableName)
        .filter((q) =>
          q.and(
            q.eq(q.field('sessionId'), args.sessionId),
            q.eq(q.field('userId'), user._id)
          )
        )
        .first();
    } else {
      session = await ctx.db
        .query(sessionsTableName)
        .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
        .first();
    }

    if (session && session.userId === user._id) {
      await ctx.db.delete(session._id);
    }

    return { deleted: messages.length };
  },
});

/**
 * Unified session title update
 * Replaces: updateSessionTitle + updateVentSessionTitle
 */
export const updateChatSessionTitle = mutation({
  args: {
    type: ChatType,
    sessionId: v.string(),
    title: v.string(),
  },
  returns: v.union(
    v.id('chatSessions'),
    v.id('ventChatSessions'),
    v.id('companionChatSessions'),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const sessionsTableName =
      args.type === 'main'
        ? 'chatSessions'
        : args.type === 'vent'
          ? 'ventChatSessions'
          : 'companionChatSessions';

    let session;
    if (args.type === 'main') {
      session = await ctx.db
        .query(sessionsTableName)
        .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
        .first();
    } else {
      session = await ctx.db
        .query(sessionsTableName)
        .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
        .first();
    }

    if (session && session.userId === user._id) {
      await ctx.db.patch(session._id, {
        title: args.title,
      });
      return session._id;
    }

    return null;
  },
});
