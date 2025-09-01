import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireAuth } from './authUtils';
import { generateSessionId } from './chatUtils';

/**
 * Companion Chat - Friendly daily check-ins and casual conversations
 */

/**
 * Send a companion chat message
 */
export const sendCompanionMessage = mutation({
  args: {
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    sessionId: v.optional(v.string()),
  },
  returns: v.id('companionChatMessages'),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    let sessionId = args.sessionId;

    // Create a new session if none provided
    if (!sessionId) {
      sessionId = generateSessionId();

      // Create companion session metadata
      await ctx.db.insert('companionChatSessions', {
        userId,
        sessionId,
        title: `Check-in ${new Date().toLocaleDateString()}`,
        startedAt: Date.now(),
        lastMessageAt: Date.now(),
        messageCount: 0,
      });
    }

    // Insert the message
    const messageId = await ctx.db.insert('companionChatMessages', {
      userId,
      content: args.content,
      role: args.role,
      sessionId,
      createdAt: Date.now(),
    });

    // Update session metadata
    const session = await ctx.db
      .query('companionChatSessions')
      .withIndex('by_session_id', (q) => q.eq('sessionId', sessionId!))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        lastMessageAt: Date.now(),
        messageCount: session.messageCount + 1,
      });
    }

    return messageId;
  },
});

/**
 * Get companion chat messages for a specific session
 */
export const getCompanionChatMessages = query({
  args: {
    sessionId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('companionChatMessages'),
      _creationTime: v.number(),
      userId: v.id('users'),
      content: v.string(),
      role: v.union(v.literal('user'), v.literal('assistant')),
      sessionId: v.string(),
      createdAt: v.number(),
      requestId: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const limit = args.limit || 50;

    let sessionId = args.sessionId;

    // If no sessionId provided, get the latest session for this user
    if (!sessionId) {
      const latestSession = await ctx.db
        .query('companionChatSessions')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .order('desc')
        .first();

      if (!latestSession) {
        return []; // No companion sessions found
      }

      sessionId = latestSession.sessionId;
    }

    // Get messages for this session
    const messages = await ctx.db
      .query('companionChatMessages')
      .withIndex('by_user_session', (q) =>
        q.eq('userId', userId).eq('sessionId', sessionId)
      )
      .order('asc')
      .take(limit);

    return messages;
  },
});

/**
 * Get all companion chat sessions for the current user
 */
export const getCompanionChatSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('companionChatSessions'),
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
    const userId = await requireAuth(ctx);
    const limit = args.limit || 20;

    const sessions = await ctx.db
      .query('companionChatSessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(limit);

    return sessions;
  },
});

/**
 * Get the current companion session ID (latest active session)
 */
export const getCurrentCompanionSessionId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const latestSession = await ctx.db
      .query('companionChatSessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    return latestSession?.sessionId || null;
  },
});

/**
 * Create a new companion chat session
 */
export const createCompanionChatSession = mutation({
  args: {
    title: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const sessionId = generateSessionId();
    const now = new Date();
    const title =
      args.title ||
      `Check-in ${now.toLocaleDateString()} ${now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;

    await ctx.db.insert('companionChatSessions', {
      userId,
      sessionId,
      title,
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 0,
    });

    return sessionId;
  },
});

/**
 * Update companion session title
 */
export const updateCompanionSessionTitle = mutation({
  args: {
    sessionId: v.string(),
    title: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const session = await ctx.db
      .query('companionChatSessions')
      .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session || session.userId !== userId) {
      throw new Error('Session not found or unauthorized');
    }

    await ctx.db.patch(session._id, {
      title: args.title,
    });

    return args.sessionId;
  },
});

/**
 * Delete a companion session and all its messages
 */
export const deleteCompanionChatSession = mutation({
  args: {
    sessionId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Verify session ownership
    const session = await ctx.db
      .query('companionChatSessions')
      .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session || session.userId !== userId) {
      throw new Error('Session not found or unauthorized');
    }

    // Delete all messages in this session
    const messages = await ctx.db
      .query('companionChatMessages')
      .withIndex('by_session', (q) => q.eq('sessionId', args.sessionId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the session
    await ctx.db.delete(session._id);

    return args.sessionId;
  },
});
