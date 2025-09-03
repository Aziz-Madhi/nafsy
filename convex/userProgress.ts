import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { validateUserAccess, getAuthenticatedUser } from './authUtils';
import { checkRateLimitDb, createValidationError } from './errorUtils';

// Record exercise completion
export const recordCompletion = mutation({
  args: {
    exerciseId: v.id('exercises'),
    duration: v.number(), // in minutes
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    // Apply rate limiting (50 exercise completions per minute per user)
    await checkRateLimitDb(ctx, `progress:record:${user._id}`, 50, 60000);

    // Validate duration (must be positive, max 600 minutes / 10 hours)
    if (args.duration <= 0 || args.duration > 600) {
      throw createValidationError(
        'Duration must be between 1 and 600 minutes',
        { duration: args.duration }
      );
    }

    // Validate feedback length
    if (args.feedback && args.feedback.length > 1000) {
      throw createValidationError(
        'Feedback must be less than 1000 characters',
        { feedbackLength: args.feedback.length }
      );
    }

    // Verify exercise exists
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      throw createValidationError('Exercise not found', {
        exerciseId: args.exerciseId,
      });
    }

    const progressId = await ctx.db.insert('userProgress', {
      userId: user._id,
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
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    let queryBuilder = ctx.db
      .query('userProgress')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc');

    // Apply date filtering at database level for better performance
    if (args.startDate && args.endDate) {
      queryBuilder = queryBuilder.filter((q) =>
        q.and(
          q.gte(q.field('completedAt'), args.startDate!),
          q.lte(q.field('completedAt'), args.endDate!)
        )
      );
    } else if (args.startDate) {
      queryBuilder = queryBuilder.filter((q) =>
        q.gte(q.field('completedAt'), args.startDate!)
      );
    } else if (args.endDate) {
      queryBuilder = queryBuilder.filter((q) =>
        q.lte(q.field('completedAt'), args.endDate!)
      );
    }

    // Apply limit and collect
    const progress = await queryBuilder.take(args.limit || 50);

    // Optimize: Batch fetch exercises instead of N+1 queries
    const exerciseIds = [...new Set(progress.map((p) => p.exerciseId))];
    const exercises = await Promise.all(
      exerciseIds.map((id) => ctx.db.get(id))
    );
    const exerciseMap = new Map(
      exercises
        .filter((e): e is NonNullable<typeof e> => e !== null)
        .map((e) => [e._id, e] as const)
    );

    const progressWithExercises = progress.map((p) => ({
      ...p,
      exercise: exerciseMap.get(p.exerciseId) || null,
    }));

    return progressWithExercises;
  },
});

// Get user statistics
export const getUserStats = query({
  args: {
    days: v.optional(v.number()), // Number of days to look back (default 30)
  },
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    const daysToLookBack = args.days || 30;
    const startDate = Date.now() - daysToLookBack * 24 * 60 * 60 * 1000;

    const progress = await ctx.db
      .query('userProgress')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.gte(q.field('completedAt'), startDate))
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

    // Optimize: Batch fetch exercises instead of N+1 queries
    const exerciseIds = [...new Set(progress.map((p) => p.exerciseId))];
    const exercises = await Promise.all(
      exerciseIds.map((id) => ctx.db.get(id))
    );
    const exerciseMap = new Map(
      exercises
        .filter((e): e is NonNullable<typeof e> => e !== null)
        .map((e) => [e._id, e] as const)
    );

    // Count by category
    const categoryCounts: Record<string, number> = {};
    progress.forEach((p) => {
      const exercise = exerciseMap.get(p.exerciseId);
      if (exercise) {
        categoryCounts[exercise.category] =
          (categoryCounts[exercise.category] || 0) + 1;
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
      ? exerciseMap.get(favoriteExerciseId as any)
      : null;

    return {
      totalSessions,
      totalMinutes,
      currentStreak,
      categoryCounts,
      favoriteExercise,
      averageSessionDuration:
        totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
      completionsThisWeek: progress.filter(
        (p) => p.completedAt > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length,
    };
  },
});

// Get progress for a specific exercise
export const getExerciseProgress = query({
  args: {
    exerciseId: v.id('exercises'),
  },
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    const progress = await ctx.db
      .query('userProgress')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('exerciseId'), args.exerciseId))
      .order('desc')
      .collect();

    return {
      completionCount: progress.length,
      lastCompleted: progress[0]?.completedAt,
      totalDuration: progress.reduce((sum, p) => sum + p.duration, 0),
      averageDuration:
        progress.length > 0
          ? Math.round(
              progress.reduce((sum, p) => sum + p.duration, 0) / progress.length
            )
          : 0,
      history: progress,
    };
  },
});
