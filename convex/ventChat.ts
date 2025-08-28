import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireAuth } from './authUtils';
import { generateSessionId } from './chatUtils';

/**
 * Send a vent message - for quick emotional releases
 * Creates a session automatically if none provided
 */
export const sendVentMessage = mutation({
  args: {
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    sessionId: v.optional(v.string()),
  },
  returns: v.id('ventChatMessages'),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    let sessionId = args.sessionId;

    // Create a new session if none provided
    if (!sessionId) {
      sessionId = generateSessionId();

      // Create vent session metadata
      await ctx.db.insert('ventChatSessions', {
        userId,
        sessionId,
        title: 'Quick Vent Session',
        startedAt: Date.now(),
        lastMessageAt: Date.now(),
        messageCount: 0,
      });
    }

    // Insert the message
    const messageId = await ctx.db.insert('ventChatMessages', {
      userId,
      content: args.content,
      role: args.role,
      sessionId,
      createdAt: Date.now(),
    });

    // Update session metadata
    const session = await ctx.db
      .query('ventChatSessions')
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
 * Get vent messages for a specific session or user's latest session
 */
export const getVentMessages = query({
  args: {
    sessionId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('ventChatMessages'),
      _creationTime: v.number(),
      userId: v.id('users'),
      content: v.string(),
      role: v.union(v.literal('user'), v.literal('assistant')),
      sessionId: v.optional(v.string()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const limit = args.limit || 50;

    let sessionId = args.sessionId;

    // If no sessionId provided, get the latest session for this user
    if (!sessionId) {
      const latestSession = await ctx.db
        .query('ventChatSessions')
        .withIndex('by_user', (q) => q.eq('userId', userId))
        .order('desc')
        .first();

      if (!latestSession) {
        return []; // No vent sessions found
      }

      sessionId = latestSession.sessionId;
    }

    // Get messages for this session
    const messages = await ctx.db
      .query('ventChatMessages')
      .withIndex('by_user_session', (q) =>
        q.eq('userId', userId).eq('sessionId', sessionId)
      )
      .order('asc')
      .take(limit);

    return messages;
  },
});

/**
 * Get all vent sessions for the current user
 */
export const getVentSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('ventChatSessions'),
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
      .query('ventChatSessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .take(limit);

    return sessions;
  },
});

/**
 * Get the current vent session ID (latest active session)
 */
export const getCurrentVentSessionId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);

    const latestSession = await ctx.db
      .query('ventChatSessions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .first();

    return latestSession?.sessionId || null;
  },
});

/**
 * Create a new vent session
 */
export const createVentSession = mutation({
  args: {
    title: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const sessionId = generateSessionId();
    const title =
      args.title || `Vent Session ${new Date().toLocaleDateString()}`;

    const sessionDocId = await ctx.db.insert('ventChatSessions', {
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
 * Update vent session title
 */
export const updateVentSessionTitle = mutation({
  args: {
    sessionId: v.string(),
    title: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const session = await ctx.db
      .query('ventChatSessions')
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
 * Delete a vent session and all its messages
 */
export const deleteVentSession = mutation({
  args: {
    sessionId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    // Verify session ownership
    const session = await ctx.db
      .query('ventChatSessions')
      .withIndex('by_session_id', (q) => q.eq('sessionId', args.sessionId))
      .first();

    if (!session || session.userId !== userId) {
      throw new Error('Session not found or unauthorized');
    }

    // Delete all messages in this session
    const messages = await ctx.db
      .query('ventChatMessages')
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
