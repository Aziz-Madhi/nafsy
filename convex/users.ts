import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { api } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { getAuthenticatedUser } from './auth';

/**
 * @deprecated Use `api.auth.upsertUser` directly from clients.
 */
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  returns: v.id('users'),
  handler: async (ctx, args): Promise<Id<'users'>> => {
    // Delegate to canonical upsertUser to avoid duplication
    const id: Id<'users'> = await ctx.runMutation(api.auth.upsertUser, {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
    });
    return id;
  },
});

/**
 * @deprecated Use `api.auth.upsertUser` directly from clients.
 */
export const updateUser = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  returns: v.id('users'),
  handler: async (ctx, args): Promise<Id<'users'>> => {
    // Delegate to canonical upsertUser to avoid duplication
    const id: Id<'users'> = await ctx.runMutation(api.auth.upsertUser, {
      name: args.name,
      avatarUrl: args.avatarUrl,
      language: args.language,
    });
    return id;
  },
});

/**
 * @deprecated Use `api.auth.getCurrentUser`.
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
