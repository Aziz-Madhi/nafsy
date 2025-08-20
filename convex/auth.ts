import { v } from 'convex/values';
import { mutation, query, QueryCtx, MutationCtx } from './_generated/server';
import {
  createAuthError,
  createNotFoundError,
  withErrorHandling,
  checkRateLimitDb,
} from './errorUtils';

// Helper function for user upsert logic
async function upsertUserHelper(
  ctx: MutationCtx,
  args: {
    clerkId?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    language?: string;
  }
) {
  let clerkId = args.clerkId;

  // If no clerkId provided, this is an update operation - get from auth
  if (!clerkId) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw createAuthError('Authentication required');
    }
    clerkId = identity.subject;
  }

  // Apply per-user rate limit for upsert operations
  await checkRateLimitDb(ctx, `auth:upsert:${clerkId}`, 30, 60000);

  const existingUser = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
    .first();

  if (existingUser) {
    // Update existing user
    const updateData: any = {
      lastActive: Date.now(),
    };

    // Only update fields that are provided
    if (args.name !== undefined) updateData.name = args.name;
    if (args.avatarUrl !== undefined) updateData.avatarUrl = args.avatarUrl;
    if (args.language !== undefined) updateData.language = args.language;
    if (args.email !== undefined) updateData.email = args.email;

    await ctx.db.patch(existingUser._id, updateData);
    return existingUser._id;
  } else {
    // Create new user
    if (!args.email) {
      throw new Error('Email is required for new user creation');
    }

    return await ctx.db.insert('users', {
      clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      language: args.language || 'en',
      createdAt: Date.now(),
      lastActive: Date.now(),
    });
  }
}

/**
 * Consolidated authentication function
 * Replaces: getAuthenticatedUser, requireAuth, getAuthenticatedClerkId,
 * validateUserAccess, getAuthenticatedUserWithRateLimit
 *
 * Returns the authenticated user's full database record
 */
export const getAuthenticatedUser = withErrorHandling(
  async (ctx: QueryCtx | MutationCtx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw createAuthError('Authentication required');
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .first();

    if (!user) {
      throw createNotFoundError('User', identity.subject);
    }

    return user;
  }
);

/**
 * Unified user operations (upsert pattern)
 * Replaces: createUser + updateUser
 *
 * Creates user if doesn't exist, updates if exists
 */
export const upsertUser = mutation({
  args: {
    clerkId: v.optional(v.string()), // Optional for updates
    email: v.optional(v.string()), // Optional for updates
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    return await upsertUserHelper(ctx, args);
  },
});

/**
 * Get current authenticated user
 * Enhanced version of getCurrentUser that handles auth gracefully
 */
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
  handler: async (ctx) => {
    try {
      return await getAuthenticatedUser(ctx);
    } catch {
      // Return null if not authenticated instead of throwing
      return null;
    }
  },
});

/**
 * Legacy compatibility functions for gradual migration
 * These can be removed once all frontend code is updated
 */

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    // Use the shared helper function
    return await upsertUserHelper(ctx, args);
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
    // Use the shared helper function
    return await upsertUserHelper(ctx, args);
  },
});

// Simplified auth helper for functions that only need user ID
export const requireAuth = async (ctx: QueryCtx | MutationCtx) => {
  const user = await getAuthenticatedUser(ctx);
  return user._id;
};

// Helper for getting just the Clerk ID
export const getAuthenticatedClerkId = async (
  ctx: QueryCtx | MutationCtx
): Promise<string> => {
  const user = await getAuthenticatedUser(ctx);
  return user.clerkId;
};

// Helper for validating user access
export const validateUserAccess = async (
  ctx: QueryCtx | MutationCtx,
  userId: string
) => {
  const authenticatedUser = await getAuthenticatedUser(ctx);

  if (authenticatedUser._id !== userId) {
    throw createAuthError("Access denied: Cannot access another user's data");
  }

  return authenticatedUser;
};
