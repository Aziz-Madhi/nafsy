import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Doc } from './_generated/dataModel';
import { getAuthenticatedUser } from './authUtils';
import { checkRateLimitDb, createValidationError } from './errorUtils';

// Create a new mood entry
export const createMood = mutation({
  args: {
    // Backward compatible: either provide legacy mood OR new rating
    mood: v.optional(
      v.union(
        v.literal('happy'),
        v.literal('neutral'),
        v.literal('sad'),
        v.literal('anxious'),
        v.literal('angry')
      )
    ),
    rating: v.optional(v.number()), // 1-10
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // Contributing factors/sub-emotions
    timeOfDay: v.optional(v.union(v.literal('morning'), v.literal('evening'))),
    createdAt: v.optional(v.number()),
  },
  returns: v.id('moods'),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);
    
    // Apply rate limiting (100 mood entries per minute per user)
    await checkRateLimitDb(ctx, `moods:create:${user._id}`, 100, 60000);
    
    // Validate rating bounds
    if (args.rating !== undefined && (args.rating < 1 || args.rating > 10)) {
      throw createValidationError('Rating must be between 1 and 10', { rating: args.rating });
    }
    
    // Validate timeOfDay values
    if (args.timeOfDay && !['morning', 'evening'].includes(args.timeOfDay)) {
      throw createValidationError('Time of day must be either "morning" or "evening"', { timeOfDay: args.timeOfDay });
    }
    
    // Validate tags length
    if (args.tags && args.tags.length > 20) {
      throw createValidationError('Maximum 20 tags allowed', { tagsCount: args.tags.length });
    }

    // Derive mood category from rating when provided
    function getMoodCategoryFromRating(
      rating: number | undefined
    ): 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry' | undefined {
      if (rating == null) return undefined;
      if (rating <= 2) return 'sad';
      if (rating <= 4) return 'anxious';
      if (rating <= 6) return 'neutral';
      if (rating <= 10) return 'happy';
      return 'neutral';
    }

    const derivedCategory = getMoodCategoryFromRating(args.rating);

    // Determine time of day if not provided
    let timeOfDay = args.timeOfDay;
    if (!timeOfDay) {
      const hour = new Date(args.createdAt || Date.now()).getHours();
      timeOfDay = hour < 12 ? 'morning' : 'evening';
    }

    const moodId = await ctx.db.insert('moods', {
      userId: user._id,
      // Populate both legacy mood and new fields when rating is provided
      mood: args.mood ?? derivedCategory,
      rating: args.rating,
      moodCategory: derivedCategory,
      note: args.note,
      tags: args.tags,
      timeOfDay,
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
  returns: v.array(
    v.object({
      _id: v.id('moods'),
      _creationTime: v.number(),
      userId: v.id('users'),
      mood: v.optional(
        v.union(
          v.literal('happy'),
          v.literal('neutral'),
          v.literal('sad'),
          v.literal('anxious'),
          v.literal('angry')
        )
      ),
      rating: v.optional(v.number()),
      moodCategory: v.optional(v.string()),
      note: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      timeOfDay: v.optional(
        v.union(v.literal('morning'), v.literal('evening'))
      ),
      createdAt: v.number(),
    })
  ),
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
  returns: v.object({
    totalEntries: v.number(),
    totalSessions: v.number(),
    moodCounts: v.object({
      happy: v.number(),
      neutral: v.number(),
      sad: v.number(),
      anxious: v.number(),
      angry: v.number(),
    }),
    currentStreak: v.number(),
    mostCommonMood: v.string(),
    dailyMoods: v.array(
      v.object({
        _id: v.id('moods'),
        _creationTime: v.number(),
        userId: v.id('users'),
        mood: v.optional(
          v.union(
            v.literal('happy'),
            v.literal('neutral'),
            v.literal('sad'),
            v.literal('anxious'),
            v.literal('angry')
          )
        ),
        rating: v.optional(v.number()),
        moodCategory: v.optional(v.string()),
        note: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        timeOfDay: v.optional(
          v.union(v.literal('morning'), v.literal('evening'))
        ),
        createdAt: v.number(),
      })
    ),
  }),
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
    type MoodKey = 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry';
    const moodCounts: Record<MoodKey, number> = {
      happy: 0,
      neutral: 0,
      sad: 0,
      anxious: 0,
      angry: 0,
    };

    const dailyMoods: Record<string, Doc<'moods'>> = {};

    moods.forEach((mood) => {
      // Count using explicit category fallback, guarding undefined
      const category: MoodKey | undefined =
        (mood.mood as MoodKey | undefined) ??
        (mood.moodCategory as MoodKey | undefined);

      if (category) {
        moodCounts[category]++;
      }

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

// Get today's mood for a user (backward compatible - returns latest)
export const getTodayMood = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id('moods'),
      _creationTime: v.number(),
      userId: v.id('users'),
      mood: v.optional(
        v.union(
          v.literal('happy'),
          v.literal('neutral'),
          v.literal('sad'),
          v.literal('anxious'),
          v.literal('angry')
        )
      ),
      rating: v.optional(v.number()),
      moodCategory: v.optional(v.string()),
      note: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      timeOfDay: v.optional(
        v.union(v.literal('morning'), v.literal('evening'))
      ),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
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

// Get all of today's moods (morning and evening)
export const getTodayMoods = query({
  args: {},
  returns: v.object({
    morning: v.union(
      v.object({
        _id: v.id('moods'),
        _creationTime: v.number(),
        userId: v.id('users'),
        mood: v.optional(
          v.union(
            v.literal('happy'),
            v.literal('neutral'),
            v.literal('sad'),
            v.literal('anxious'),
            v.literal('angry')
          )
        ),
        rating: v.optional(v.number()),
        moodCategory: v.optional(v.string()),
        note: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        timeOfDay: v.optional(
          v.union(v.literal('morning'), v.literal('evening'))
        ),
        createdAt: v.number(),
      }),
      v.null()
    ),
    evening: v.union(
      v.object({
        _id: v.id('moods'),
        _creationTime: v.number(),
        userId: v.id('users'),
        mood: v.optional(
          v.union(
            v.literal('happy'),
            v.literal('neutral'),
            v.literal('sad'),
            v.literal('anxious'),
            v.literal('angry')
          )
        ),
        rating: v.optional(v.number()),
        moodCategory: v.optional(v.string()),
        note: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        timeOfDay: v.optional(
          v.union(v.literal('morning'), v.literal('evening'))
        ),
        createdAt: v.number(),
      }),
      v.null()
    ),
    all: v.array(
      v.object({
        _id: v.id('moods'),
        _creationTime: v.number(),
        userId: v.id('users'),
        mood: v.optional(
          v.union(
            v.literal('happy'),
            v.literal('neutral'),
            v.literal('sad'),
            v.literal('anxious'),
            v.literal('angry')
          )
        ),
        rating: v.optional(v.number()),
        moodCategory: v.optional(v.string()),
        note: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        timeOfDay: v.optional(
          v.union(v.literal('morning'), v.literal('evening'))
        ),
        createdAt: v.number(),
      })
    ),
  }),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startTimestamp = todayStart.getTime();

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const endTimestamp = todayEnd.getTime();

    const moods = await ctx.db
      .query('moods')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field('createdAt'), startTimestamp),
          q.lte(q.field('createdAt'), endTimestamp)
        )
      )
      .order('asc')
      .collect();

    // Organize by time of day
    const morningMood =
      moods.find((m) => m.timeOfDay === 'morning') ||
      moods.find((m) => new Date(m.createdAt).getHours() < 12);
    const eveningMood =
      moods.find((m) => m.timeOfDay === 'evening') ||
      moods.find(
        (m) => new Date(m.createdAt).getHours() >= 12 && m !== morningMood
      );

    return {
      morning: morningMood || null,
      evening: eveningMood || null,
      all: moods,
    };
  },
});

// Get morning mood for today
export const getTodayMorningMood = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id('moods'),
      _creationTime: v.number(),
      userId: v.id('users'),
      mood: v.optional(
        v.union(
          v.literal('happy'),
          v.literal('neutral'),
          v.literal('sad'),
          v.literal('anxious'),
          v.literal('angry')
        )
      ),
      rating: v.optional(v.number()),
      moodCategory: v.optional(v.string()),
      note: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      timeOfDay: v.optional(
        v.union(v.literal('morning'), v.literal('evening'))
      ),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startTimestamp = todayStart.getTime();

    const todayNoon = new Date();
    todayNoon.setHours(12, 0, 0, 0);
    const noonTimestamp = todayNoon.getTime();

    const morningMood = await ctx.db
      .query('moods')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field('createdAt'), startTimestamp),
          q.or(
            q.eq(q.field('timeOfDay'), 'morning'),
            q.lt(q.field('createdAt'), noonTimestamp)
          )
        )
      )
      .order('desc')
      .first();

    return morningMood;
  },
});

// Delete a mood entry
export const deleteMood = mutation({
  args: {
    id: v.id('moods'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    // Verify the mood belongs to the user
    const mood = await ctx.db.get(args.id);
    if (!mood) {
      throw new Error('Mood not found');
    }
    if (mood.userId !== user._id) {
      throw new Error('Unauthorized');
    }

    // Delete the mood
    await ctx.db.delete(args.id);
    return null;
  },
});

// Get evening mood for today
export const getTodayEveningMood = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id('moods'),
      _creationTime: v.number(),
      userId: v.id('users'),
      mood: v.optional(
        v.union(
          v.literal('happy'),
          v.literal('neutral'),
          v.literal('sad'),
          v.literal('anxious'),
          v.literal('angry')
        )
      ),
      rating: v.optional(v.number()),
      moodCategory: v.optional(v.string()),
      note: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      timeOfDay: v.optional(
        v.union(v.literal('morning'), v.literal('evening'))
      ),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const todayNoon = new Date();
    todayNoon.setHours(12, 0, 0, 0);
    const noonTimestamp = todayNoon.getTime();

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const endTimestamp = todayEnd.getTime();

    const eveningMood = await ctx.db
      .query('moods')
      .withIndex('by_user_date', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.and(
          q.lte(q.field('createdAt'), endTimestamp),
          q.or(
            q.eq(q.field('timeOfDay'), 'evening'),
            q.gte(q.field('createdAt'), noonTimestamp)
          )
        )
      )
      .order('desc')
      .first();

    return eveningMood;
  },
});
