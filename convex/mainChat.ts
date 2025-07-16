import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { updateChatSession } from "./chatUtils";

// Get main chat messages for current session
export const getMainChatMessages = query({
  args: { 
    userId: v.id("users"),
    sessionId: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("mainChatMessages"),
    _creationTime: v.number(),
    userId: v.id("users"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    sessionId: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("mainChatMessages")
      .filter((q) => q.eq(q.field("userId"), args.userId));
    
    if (args.sessionId) {
      query = query.filter((q) => q.eq(q.field("sessionId"), args.sessionId));
    }
    
    return await query
      .order("desc")
      .take(args.limit || 50);
  },
});

// Send a main chat message
export const sendMainMessage = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    sessionId: v.optional(v.string()),
  },
  returns: v.id("mainChatMessages"),
  handler: async (ctx, args) => {
    // Create or use existing main session
    const sessionId = args.sessionId || `main_${Date.now()}_${args.userId}`;
    
    // Insert message
    const messageId = await ctx.db.insert("mainChatMessages", {
      userId: args.userId,
      content: args.content,
      role: args.role,
      sessionId,
      createdAt: Date.now(),
    });
    
    // Update session metadata
    await updateChatSession(ctx, args.userId, "main", sessionId);
    
    return messageId;
  },
});

// Get all main chat sessions for history view
export const getMainSessions = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("chatSessions"),
    _creationTime: v.number(),
    userId: v.id("users"),
    type: v.union(v.literal("main"), v.literal("vent")),
    sessionId: v.string(),
    title: v.string(),
    startedAt: v.number(),
    lastMessageAt: v.number(),
    messageCount: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chatSessions")
      .filter((q) => q.and(
        q.eq(q.field("userId"), args.userId),
        q.eq(q.field("type"), "main")
      ))
      .order("desc")
      .take(args.limit || 20);
  },
});

// Get current active main session ID
export const getCurrentMainSessionId = query({
  args: { userId: v.id("users") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const latestSession = await ctx.db
      .query("chatSessions")
      .filter((q) => q.and(
        q.eq(q.field("userId"), args.userId),
        q.eq(q.field("type"), "main")
      ))
      .order("desc")
      .first();
    
    return latestSession?.sessionId || null;
  },
});

// Start a new main chat session
export const startNewMainSession = mutation({
  args: {
    userId: v.id("users"),
    title: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const sessionId = `main_${Date.now()}_${args.userId}`;
    
    await ctx.db.insert("chatSessions", {
      userId: args.userId,
      type: "main",
      sessionId,
      title: args.title || "New Chat Session",
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
    userId: v.id("users"),
    sessionId: v.string(),
  },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    // Delete all messages in the session
    const messages = await ctx.db
      .query("mainChatMessages")
      .filter((q) => q.and(
        q.eq(q.field("userId"), args.userId),
        q.eq(q.field("sessionId"), args.sessionId)
      ))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Delete session metadata
    const session = await ctx.db
      .query("chatSessions")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
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
  returns: v.union(v.id("chatSessions"), v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    
    if (session) {
      await ctx.db.patch(session._id, {
        title: args.title,
      });
    }
    
    return session?._id;
  },
});