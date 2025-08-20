import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthenticatedUser } from './authUtils';
import {
  createAuthError,
  createValidationError,
  checkRateLimitDb,
} from './errorUtils';

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    // Require authentication and ensure caller can only create their own user record
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw createAuthError('Authentication required');
    }

    // Per-user rate limit to prevent abuse of user creation endpoint
    await checkRateLimitDb(ctx, `users:create:${identity.subject}`, 5, 60000);

    // Validate that provided clerkId matches authenticated subject
    if (args.clerkId !== identity.subject) {
      throw createValidationError('clerkId does not match authenticated user');
    }

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    return await ctx.db.insert('users', {
      ...args,
      language: 'en',
      createdAt: Date.now(),
      lastActive: Date.now(),
    });
  },
});

export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    // Authenticate user and get their record
    const user = await getAuthenticatedUser(ctx);

    // Update the authenticated user's record
    await ctx.db.patch(user._id, {
      ...args,
      lastActive: Date.now(),
    });

    return user._id;
  },
});

export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      language: v.string(),
      createdAt: v.number(),
      lastActive: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Get authenticated user (will throw if not authenticated)
    try {
      return await getAuthenticatedUser(ctx);
    } catch {
      // Return null if not authenticated instead of throwing
      return null;
    }
  },
});
