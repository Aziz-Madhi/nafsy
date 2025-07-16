import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { updateChatSession } from "./chatUtils";

// Get vent chat messages for floating chat (recent messages)
export const getCurrentVentMessages = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("ventChatMessages"),
    _creationTime: v.number(),
    userId: v.id("users"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    ventSessionId: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ventChatMessages")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(args.limit || 3); // Default to last 3 for floating chat
  },
});

// Get vent chat messages for a specific session
export const getVentChatMessages = query({
  args: { 
    userId: v.id("users"),
    ventSessionId: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("ventChatMessages"),
    _creationTime: v.number(),
    userId: v.id("users"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    ventSessionId: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("ventChatMessages")
      .filter((q) => q.eq(q.field("userId"), args.userId));
    
    if (args.ventSessionId) {
      query = query.filter((q) => q.eq(q.field("ventSessionId"), args.ventSessionId));
    }
    
    return await query
      .order("desc")
      .take(args.limit || 50);
  },
});

// Send a vent chat message
export const sendVentMessage = mutation({
  args: {
    userId: v.id("users"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    ventSessionId: v.optional(v.string()),
  },
  returns: v.id("ventChatMessages"),
  handler: async (ctx, args) => {
    // Create or use existing vent session
    const ventSessionId = args.ventSessionId || `vent_${Date.now()}_${args.userId}`;
    
    // Insert message
    const messageId = await ctx.db.insert("ventChatMessages", {
      userId: args.userId,
      content: args.content,
      role: args.role,
      ventSessionId,
      createdAt: Date.now(),
    });
    
    // Update session metadata
    await updateChatSession(ctx, args.userId, "vent", ventSessionId);
    
    return messageId;
  },
});

// Get all vent sessions for history view
export const getVentSessions = query({
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
        q.eq(q.field("type"), "vent")
      ))
      .order("desc")
      .take(args.limit || 20);
  },
});

// Get current active vent session ID
export const getCurrentVentSessionId = query({
  args: { userId: v.id("users") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const latestSession = await ctx.db
      .query("chatSessions")
      .filter((q) => q.and(
        q.eq(q.field("userId"), args.userId),
        q.eq(q.field("type"), "vent")
      ))
      .order("desc")
      .first();
    
    return latestSession?.sessionId || null;
  },
});

// Delete a vent session and all its messages
export const deleteVentSession = mutation({
  args: {
    userId: v.id("users"),
    ventSessionId: v.string(),
  },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    // Delete all messages in the session
    const messages = await ctx.db
      .query("ventChatMessages")
      .filter((q) => q.and(
        q.eq(q.field("userId"), args.userId),
        q.eq(q.field("ventSessionId"), args.ventSessionId)
      ))
      .collect();
    
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    
    // Delete session metadata
    const session = await ctx.db
      .query("chatSessions")
      .filter((q) => q.eq(q.field("sessionId"), args.ventSessionId))
      .first();
    
    if (session) {
      await ctx.db.delete(session._id);
    }
    
    return { deleted: messages.length };
  },
});