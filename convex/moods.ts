import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Doc } from './_generated/dataModel';
import { getAuthenticatedUser } from './authUtils';

// Create a new mood entry
export const createMood = mutation({
  args: {
    mood: v.union(
      v.literal('happy'),
      v.literal('neutral'),
      v.literal('sad'),
      v.literal('anxious'),
      v.literal('angry')
    ),
    note: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    const moodId = await ctx.db.insert('moods', {
      userId: user._id,
      mood: args.mood,
      note: args.note,
      createdAt: args.createdAt || Date.now(),
    });
    return moodId;
  },
});

// Get moods for a user with optional date range
export const getMoods = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    let queryBuilder = ctx.db
      .query('moods')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id))
      .order('desc');

    // Apply date filtering at database level for better performance
    if (args.startDate && args.endDate) {
      queryBuilder = queryBuilder.filter((q) =>
        q.and(
          q.gte(q.field('createdAt'), args.startDate!),
          q.lte(q.field('createdAt'), args.endDate!)
        )
      );
    } else if (args.startDate) {
      queryBuilder = queryBuilder.filter((q) =>
        q.gte(q.field('createdAt'), args.startDate!)
      );
    } else if (args.endDate) {
      queryBuilder = queryBuilder.filter((q) =>
        q.lte(q.field('createdAt'), args.endDate!)
      );
    }

    // Apply limit and get results
    return await queryBuilder.take(args.limit || 50);
  },
});

// Get mood statistics for a user
export const getMoodStats = query({
  args: {
    days: v.optional(v.number()), // Number of days to look back (default 30)
  },
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    const daysToLookBack = args.days || 30;
    const startDate = Date.now() - daysToLookBack * 24 * 60 * 60 * 1000;

    const moods = await ctx.db
      .query('moods')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id))
      .filter((q) => q.gte(q.field('createdAt'), startDate))
      .collect();

    // Calculate statistics
    const moodCounts: Record<string, number> = {
      happy: 0,
      neutral: 0,
      sad: 0,
      anxious: 0,
      angry: 0,
    };

    const dailyMoods: Record<string, Doc<'moods'>> = {};

    moods.forEach((mood) => {
      moodCounts[mood.mood]++;

      // Track daily moods (last mood of each day)
      const date = new Date(mood.createdAt).toDateString();
      if (!dailyMoods[date] || mood.createdAt > dailyMoods[date].createdAt) {
        dailyMoods[date] = mood;
      }
    });

    // Calculate streak
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < daysToLookBack; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();

      if (dailyMoods[dateStr]) {
        currentStreak++;
      } else if (i > 0) {
        // Don't break streak if today is missing
        break;
      }
    }

    // Find most common mood
    const mostCommonMood = Object.entries(moodCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    // Calculate total sessions (unique days)
    const totalSessions = Object.keys(dailyMoods).length;

    return {
      totalEntries: moods.length,
      totalSessions,
      moodCounts,
      currentStreak,
      mostCommonMood,
      dailyMoods: Object.values(dailyMoods).sort(
        (a, b) => a.createdAt - b.createdAt
      ),
    };
  },
});

// Get today's mood for a user
export const getTodayMood = query({
  args: {},
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startTimestamp = todayStart.getTime();

    const todayMoods = await ctx.db
      .query('moods')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id))
      .filter((q) => q.gte(q.field('createdAt'), startTimestamp))
      .order('desc')
      .first();

    return todayMoods;
  },
});
