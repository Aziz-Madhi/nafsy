import { QueryCtx, MutationCtx } from './_generated/server';
import {
  createAuthError,
  createNotFoundError,
  createAuthzError,
  withErrorHandling,
  checkRateLimit,
} from './errorUtils';

/**
 * Gets the authenticated user from the context and returns their database record.
 * Throws an error if the user is not authenticated or not found in the database.
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
 * Validates that the authenticated user matches the provided userId parameter.
 * Throws an error if authentication fails or user doesn't match.
 */
export const validateUserAccess = withErrorHandling(
  async (ctx: QueryCtx | MutationCtx, userId: string) => {
    const authenticatedUser = await getAuthenticatedUser(ctx);

    if (authenticatedUser._id !== userId) {
      throw createAuthzError(
        "Access denied: Cannot access another user's data"
      );
    }

    return authenticatedUser;
  }
);

/**
 * Gets the current authenticated user's Clerk ID.
 * Throws an error if not authenticated.
 */
export const getAuthenticatedClerkId = withErrorHandling(
  async (ctx: QueryCtx | MutationCtx): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw createAuthError('Authentication required');
    }

    return identity.subject;
  }
);

/**
 * Simplified function to require authentication and return user ID
 * Used for simpler auth checks without full user object
 */
export const requireAuth = withErrorHandling(
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

    return user._id;
  }
);

/**
 * Rate-limited authentication check
 */
export const getAuthenticatedUserWithRateLimit = withErrorHandling(
  async (ctx: QueryCtx | MutationCtx, operation: string = 'default') => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw createAuthError('Authentication required');
    }

    // Apply rate limiting
    checkRateLimit(`${operation}:${identity.subject}`, 100, 60000); // 100 requests per minute

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
