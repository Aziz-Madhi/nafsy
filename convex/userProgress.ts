import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Record exercise completion
export const recordCompletion = mutation({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
    duration: v.number(), // in minutes
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const progressId = await ctx.db.insert("userProgress", {
      userId: args.userId,
      exerciseId: args.exerciseId,
      completedAt: Date.now(),
      duration: args.duration,
      feedback: args.feedback,
    });
    return progressId;
  },
});

// Get user's exercise history
export const getUserProgress = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    let progress = await query.collect();

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      progress = progress.filter((p) => {
        if (args.startDate && p.completedAt < args.startDate) return false;
        if (args.endDate && p.completedAt > args.endDate) return false;
        return true;
      });
    }

    // Apply limit if provided
    if (args.limit) {
      progress = progress.slice(0, args.limit);
    }

    // Fetch exercise details for each progress entry
    const progressWithExercises = await Promise.all(
      progress.map(async (p) => {
        const exercise = await ctx.db.get(p.exerciseId);
        return {
          ...p,
          exercise,
        };
      })
    );

    return progressWithExercises;
  },
});

// Get user statistics
export const getUserStats = query({
  args: {
    userId: v.id("users"),
    days: v.optional(v.number()), // Number of days to look back (default 30)
  },
  handler: async (ctx, args) => {
    const daysToLookBack = args.days || 30;
    const startDate = Date.now() - daysToLookBack * 24 * 60 * 60 * 1000;

    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("completedAt"), startDate))
      .collect();

    // Calculate statistics
    const totalSessions = progress.length;
    const totalMinutes = progress.reduce((sum, p) => sum + p.duration, 0);
    
    // Calculate streak
    const completionDates = new Set(
      progress.map((p) => new Date(p.completedAt).toDateString())
    );
    
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < daysToLookBack; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      if (completionDates.has(dateStr)) {
        currentStreak++;
      } else if (i > 0) {
        // Don't break streak if today is missing
        break;
      }
    }

    // Count by category
    const categoryCounts: Record<string, number> = {};
    const exercises = await Promise.all(
      progress.map((p) => ctx.db.get(p.exerciseId))
    );

    exercises.forEach((exercise) => {
      if (exercise) {
        categoryCounts[exercise.category] = (categoryCounts[exercise.category] || 0) + 1;
      }
    });

    // Find favorite exercise (most completed)
    const exerciseCounts: Record<string, number> = {};
    progress.forEach((p) => {
      exerciseCounts[p.exerciseId] = (exerciseCounts[p.exerciseId] || 0) + 1;
    });
    
    const favoriteExerciseId = Object.entries(exerciseCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];
    
    const favoriteExercise = favoriteExerciseId
      ? await ctx.db.get(favoriteExerciseId as any)
      : null;

    return {
      totalSessions,
      totalMinutes,
      currentStreak,
      categoryCounts,
      favoriteExercise,
      averageSessionDuration: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
      completionsThisWeek: progress.filter(
        (p) => p.completedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length,
    };
  },
});

// Get progress for a specific exercise
export const getExerciseProgress = query({
  args: {
    userId: v.id("users"),
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("exerciseId"), args.exerciseId))
      .order("desc")
      .collect();

    return {
      completionCount: progress.length,
      lastCompleted: progress[0]?.completedAt,
      totalDuration: progress.reduce((sum, p) => sum + p.duration, 0),
      averageDuration: progress.length > 0
        ? Math.round(progress.reduce((sum, p) => sum + p.duration, 0) / progress.length)
        : 0,
      history: progress,
    };
  },
});