import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const sendMessage = mutation({
  args: {
    userId: v.id('users'),
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
  },
  returns: v.id('messages'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('messages', {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getMessages = query({
  args: {
    userId: v.id('users'),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id('messages'),
      _creationTime: v.number(),
      userId: v.id('users'),
      content: v.string(),
      role: v.union(v.literal('user'), v.literal('assistant')),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query('messages')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
  },
});

export const getRecentMessages = query({
  args: {
    userId: v.id('users'),
    count: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id('messages'),
      _creationTime: v.number(),
      userId: v.id('users'),
      content: v.string(),
      role: v.union(v.literal('user'), v.literal('assistant')),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('messages')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(args.count);
  },
});
