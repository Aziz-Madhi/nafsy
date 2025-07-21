import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { updateChatSession } from './chatUtils';
import { getAuthenticatedUser } from './authUtils';

// Get vent chat messages for floating chat (recent messages)
export const getCurrentVentMessages = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('ventChatMessages'),
      _creationTime: v.number(),
      userId: v.id('users'),
      content: v.string(),
      role: v.union(v.literal('user'), v.literal('assistant')),
      ventSessionId: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    return await ctx.db
      .query('ventChatMessages')
      .filter((q) => q.eq(q.field('userId'), user._id))
      .order('desc')
      .take(args.limit || 3); // Default to last 3 for floating chat
  },
});

// Get vent chat messages for a specific session
export const getVentChatMessages = query({
  args: {
    ventSessionId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('ventChatMessages'),
      _creationTime: v.number(),
      userId: v.id('users'),
      content: v.string(),
      role: v.union(v.literal('user'), v.literal('assistant')),
      ventSessionId: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    let queryBuilder = ctx.db
      .query('ventChatMessages')
      .filter((q) => q.eq(q.field('userId'), user._id));

    if (args.ventSessionId) {
      queryBuilder = queryBuilder.filter((q) =>
        q.eq(q.field('ventSessionId'), args.ventSessionId)
      );
    }

    return await queryBuilder.order('desc').take(args.limit || 50);
  },
});

// Send a vent chat message
export const sendVentMessage = mutation({
  args: {
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    ventSessionId: v.optional(v.string()),
  },
  returns: v.id('ventChatMessages'),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    // Create or use existing vent session
    const ventSessionId =
      args.ventSessionId || `vent_${Date.now()}_${user._id}`;

    // Insert message
    const messageId = await ctx.db.insert('ventChatMessages', {
      userId: user._id,
      content: args.content,
      role: args.role,
      ventSessionId,
      createdAt: Date.now(),
    });

    // Update session metadata
    await updateChatSession(ctx, user._id, 'vent', ventSessionId);

    return messageId;
  },
});

// Get all vent sessions for history view
export const getVentSessions = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('chatSessions'),
      _creationTime: v.number(),
      userId: v.id('users'),
      type: v.union(v.literal('main'), v.literal('vent')),
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

    return await ctx.db
      .query('chatSessions')
      .filter((q) =>
        q.and(q.eq(q.field('userId'), user._id), q.eq(q.field('type'), 'vent'))
      )
      .order('desc')
      .take(args.limit || 20);
  },
});

// Get current active vent session ID
export const getCurrentVentSessionId = query({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    const latestSession = await ctx.db
      .query('chatSessions')
      .filter((q) =>
        q.and(q.eq(q.field('userId'), user._id), q.eq(q.field('type'), 'vent'))
      )
      .order('desc')
      .first();

    return latestSession?.sessionId || null;
  },
});

// Delete a vent session and all its messages
export const deleteVentSession = mutation({
  args: {
    ventSessionId: v.string(),
  },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    // Delete all messages in the session (ensure they belong to authenticated user)
    const messages = await ctx.db
      .query('ventChatMessages')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), user._id),
          q.eq(q.field('ventSessionId'), args.ventSessionId)
        )
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete session metadata (ensure it belongs to authenticated user)
    const session = await ctx.db
      .query('chatSessions')
      .filter((q) =>
        q.and(
          q.eq(q.field('sessionId'), args.ventSessionId),
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
