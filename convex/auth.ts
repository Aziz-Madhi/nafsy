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
    age?: number;
    gender?: string;
    onboardingCompleted?: boolean;
    moodLastMonth?: string;
    goals?: string[];
    selfImage?: string[];
    helpAreas?: string[];
    fears?: string[];
    struggles?: string[];
    additionalNotes?: string;
  }
) {
  // Always require authenticated identity and bind operations to that identity.
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw createAuthError('Authentication required');
  }
  const clerkId = identity.subject;
  const identityEmail: string | undefined = (identity as any)?.email ?? undefined;

  // Prevent mismatched clerkId impersonation if provided by client
  if (args.clerkId && args.clerkId !== clerkId) {
    throw createAuthError('Invalid clerkId for this session');
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
    if (args.age !== undefined) updateData.age = args.age;
    if (args.gender !== undefined) updateData.gender = args.gender;
    if (args.onboardingCompleted !== undefined)
      updateData.onboardingCompleted = args.onboardingCompleted;
    if (args.moodLastMonth !== undefined) updateData.moodLastMonth = args.moodLastMonth;
    if (args.goals !== undefined) updateData.goals = args.goals;
    if (args.selfImage !== undefined) updateData.selfImage = args.selfImage;
    if (args.helpAreas !== undefined) updateData.helpAreas = args.helpAreas;
    if (args.fears !== undefined) updateData.fears = args.fears;
    if (args.struggles !== undefined) updateData.struggles = args.struggles;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.additionalNotes !== undefined) updateData.additionalNotes = args.additionalNotes;

    await ctx.db.patch(existingUser._id, updateData);
    return existingUser._id;
  } else {
    // Create new user (be tolerant of missing email for some OAuth providers)
    const email = args.email ?? identityEmail ?? '';

    return await ctx.db.insert('users', {
      clerkId,
      email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      language: args.language || 'en',
      age: args.age,
      gender: args.gender,
      onboardingCompleted: args.onboardingCompleted,
      moodLastMonth: args.moodLastMonth,
      goals: args.goals,
      selfImage: args.selfImage,
      helpAreas: args.helpAreas,
      fears: args.fears,
      struggles: args.struggles,
      additionalNotes: args.additionalNotes,
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
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    moodLastMonth: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    selfImage: v.optional(v.array(v.string())),
    helpAreas: v.optional(v.array(v.string())),
    fears: v.optional(v.array(v.string())),
    struggles: v.optional(v.array(v.string())),
    additionalNotes: v.optional(v.string()),
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
      age: v.optional(v.number()),
      gender: v.optional(v.string()),
      onboardingCompleted: v.optional(v.boolean()),
      moodLastMonth: v.optional(v.string()),
      goals: v.optional(v.array(v.string())),
      selfImage: v.optional(v.array(v.string())),
      helpAreas: v.optional(v.array(v.string())),
      fears: v.optional(v.array(v.string())),
      struggles: v.optional(v.array(v.string())),
      additionalNotes: v.optional(v.string()),
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
 * Get user by Clerk ID
 * Used by HTTP actions for authentication
 */
export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id('users'),
      _creationTime: v.number(),
      clerkId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      language: v.string(),
      age: v.optional(v.number()),
      gender: v.optional(v.string()),
      onboardingCompleted: v.optional(v.boolean()),
      moodLastMonth: v.optional(v.string()),
      goals: v.optional(v.array(v.string())),
      selfImage: v.optional(v.array(v.string())),
      helpAreas: v.optional(v.array(v.string())),
      fears: v.optional(v.array(v.string())),
      struggles: v.optional(v.array(v.string())),
      additionalNotes: v.optional(v.string()),
      createdAt: v.number(),
      lastActive: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Only allow a user to fetch their own record by clerkId
    const identity = await ctx.auth.getUserIdentity();
    if (!identity || identity.subject !== args.clerkId) {
      return null;
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first();

    return user;
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
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    moodLastMonth: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    selfImage: v.optional(v.array(v.string())),
    helpAreas: v.optional(v.array(v.string())),
    fears: v.optional(v.array(v.string())),
    struggles: v.optional(v.array(v.string())),
    additionalNotes: v.optional(v.string()),
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

/**
 * Rate-limited authentication helper (mutation-only)
 * Applies a DB-backed rate limit keyed by clerkId and operation.
 */
export const getAuthenticatedUserWithRateLimit = withErrorHandling(
  async (ctx: MutationCtx, operation: string = 'default') => {
    const user = await getAuthenticatedUser(ctx);
    await checkRateLimitDb(ctx, `${operation}:${user.clerkId}`, 100, 60000);
    return user;
  }
);
