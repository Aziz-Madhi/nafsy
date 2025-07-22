import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { updateChatSession } from './chatUtils';
import { getAuthenticatedUser } from './authUtils';

// Get main chat messages for current session
export const getMainChatMessages = query({
  args: {
    sessionId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('mainChatMessages'),
      _creationTime: v.number(),
      userId: v.id('users'),
      content: v.string(),
      role: v.union(v.literal('user'), v.literal('assistant')),
      sessionId: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    let query = ctx.db
      .query('mainChatMessages')
      .filter((q) => q.eq(q.field('userId'), user._id));

    if (args.sessionId) {
      query = query.filter((q) => q.eq(q.field('sessionId'), args.sessionId));
    }

    return await query.order('desc').take(args.limit || 50);
  },
});

// Send a main chat message
export const sendMainMessage = mutation({
  args: {
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    sessionId: v.optional(v.string()),
  },
  returns: v.id('mainChatMessages'),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    // Create or use existing main session
    const sessionId = args.sessionId || `main_${Date.now()}_${user._id}`;

    // Insert message
    const messageId = await ctx.db.insert('mainChatMessages', {
      userId: user._id,
      content: args.content,
      role: args.role,
      sessionId,
      createdAt: Date.now(),
    });

    // Update session metadata
    await updateChatSession(ctx, user._id, sessionId);

    return messageId;
  },
});

// Get all main chat sessions for history view
export const getMainSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('chatSessions'),
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
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    const sessions = await ctx.db
      .query('chatSessions')
      .filter((q) => q.eq(q.field('userId'), user._id))
      .order('desc')
      .take(args.limit || 20);
    
    // Filter to only return main chat sessions (not vent sessions)
    // Remove the type field from results to match the validator
    return sessions
      .filter(session => 
        !session.type || session.type === 'main' || session.sessionId.startsWith('main_')
      )
      .map(({ type, ...session }) => session);
  },
});

// Get current active main session ID
export const getCurrentMainSessionId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    const latestSession = await ctx.db
      .query('chatSessions')
      .filter((q) => q.eq(q.field('userId'), user._id))
      .order('desc')
      .first();

    // Only return main session IDs (not vent session IDs)
    if (latestSession && (
      !latestSession.type || 
      latestSession.type === 'main' || 
      latestSession.sessionId.startsWith('main_')
    )) {
      return latestSession.sessionId;
    }
    
    return null;
  },
});

// Start a new main chat session
export const startNewMainSession = mutation({
  args: {
    title: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    const sessionId = `main_${Date.now()}_${user._id}`;

    await ctx.db.insert('chatSessions', {
      userId: user._id,
      sessionId,
      title: args.title || 'New Chat Session',
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 0,
    });

    return sessionId;
  },
});

// Delete a main session and all its messages
export const deleteMainSession = mutation({
  args: {
    sessionId: v.string(),
  },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    // Delete all messages in the session
    const messages = await ctx.db
      .query('mainChatMessages')
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

    // Delete session metadata (ensure it belongs to the authenticated user)
    const session = await ctx.db
      .query('chatSessions')
      .filter((q) =>
        q.and(
          q.eq(q.field('sessionId'), args.sessionId),
          q.eq(q.field('userId'), user._id)
        )
      )
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { deleted: messages.length };
  },
});

// Update session title
export const updateSessionTitle = mutation({
  args: {
    sessionId: v.string(),
    title: v.string(),
  },
  returns: v.union(v.id('chatSessions'), v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('chatSessions')
      .filter((q) => q.eq(q.field('sessionId'), args.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        title: args.title,
      });
    }

    return session?._id;
  },
});
