import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Create a new mood entry
export const createMood = mutation({
  args: {
    userId: v.id("users"),
    mood: v.union(
      v.literal("happy"),
      v.literal("neutral"),
      v.literal("sad"),
      v.literal("anxious"),
      v.literal("angry")
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const moodId = await ctx.db.insert("moods", {
      userId: args.userId,
      mood: args.mood,
      note: args.note,
      createdAt: Date.now(),
    });
    return moodId;
  },
});

// Get moods for a user with optional date range
export const getMoods = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("moods")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc");

    const allMoods = await query.collect();

    // Filter by date range if provided
    let filteredMoods = allMoods;
    if (args.startDate || args.endDate) {
      filteredMoods = allMoods.filter((mood) => {
        if (args.startDate && mood.createdAt < args.startDate) return false;
        if (args.endDate && mood.createdAt > args.endDate) return false;
        return true;
      });
    }

    // Apply limit if provided
    if (args.limit) {
      filteredMoods = filteredMoods.slice(0, args.limit);
    }

    return filteredMoods;
  },
});

// Get mood statistics for a user
export const getMoodStats = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()), // Number of days to look back (default 30)
  },
  handler: async (ctx, args) => {
    const daysToLookBack = args.days || 30;
    const startDate = Date.now() - daysToLookBack * 24 * 60 * 60 * 1000;

    const moods = await ctx.db
      .query("moods")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), startDate))
      .collect();

    // Calculate statistics
    const moodCounts: Record<string, number> = {
      happy: 0,
      neutral: 0,
      sad: 0,
      anxious: 0,
      angry: 0,
    };

    const dailyMoods: Record<string, Doc<"moods">> = {};
    
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

    return {
      totalEntries: moods.length,
      moodCounts,
      currentStreak,
      mostCommonMood,
      dailyMoods: Object.values(dailyMoods).sort((a, b) => a.createdAt - b.createdAt),
    };
  },
});

// Get today's mood for a user
export const getTodayMood = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startTimestamp = todayStart.getTime();

    const todayMoods = await ctx.db
      .query("moods")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("createdAt"), startTimestamp))
      .order("desc")
      .first();

    return todayMoods;
  },
});