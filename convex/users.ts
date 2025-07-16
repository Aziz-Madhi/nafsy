import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert("users", {
      ...args,
      language: "en",
      createdAt: Date.now(),
      lastActive: Date.now(),
    });
  },
});

export const updateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const { clerkId, ...updates } = args;
    await ctx.db.patch(user._id, {
      ...updates,
      lastActive: Date.now(),
    });

    return user._id;
  },
});

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  returns: v.union(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    language: v.string(),
    createdAt: v.number(),
    lastActive: v.number(),
  }), v.null()),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});