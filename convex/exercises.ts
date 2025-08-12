import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthenticatedUser } from './authUtils';

// Get all exercises
export const getAllExercises = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query('exercises').collect();
    return exercises;
  },
});

// Get exercises by category
export const getExercisesByCategory = query({
  args: {
    category: v.union(
      v.literal('breathing'),
      v.literal('mindfulness'),
      v.literal('journaling'),
      v.literal('movement'),
      v.literal('relaxation')
    ),
  },
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query('exercises')
      .withIndex('by_category', (q) => q.eq('category', args.category))
      .collect();
    return exercises;
  },
});

// Get single exercise by ID
export const getExercise = query({
  args: {
    exerciseId: v.id('exercises'),
  },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);
    return exercise;
  },
});

// Get random exercise from specified categories
export const getRandomExerciseByCategories = query({
  args: {
    categories: v.array(
      v.union(
        v.literal('breathing'),
        v.literal('mindfulness'),
        v.literal('journaling'),
        v.literal('movement'),
        v.literal('relaxation')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Get all exercises from the specified categories
    const exercisePromises = args.categories.map((category) =>
      ctx.db
        .query('exercises')
        .withIndex('by_category', (q) => q.eq('category', category))
        .collect()
    );
    
    const exercisesByCategory = await Promise.all(exercisePromises);
    const allExercises = exercisesByCategory.flat();
    
    if (allExercises.length === 0) {
      return null;
    }
    
    // Return a random exercise
    const randomIndex = Math.floor(Math.random() * allExercises.length);
    return allExercises[randomIndex];
  },
});

// Create a new exercise (admin function)
export const createExercise = mutation({
  args: {
    title: v.string(),
    titleAr: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    category: v.union(
      v.literal('breathing'),
      v.literal('mindfulness'),
      v.literal('journaling'),
      v.literal('movement'),
      v.literal('relaxation')
    ),
    duration: v.number(),
    difficulty: v.union(
      v.literal('beginner'),
      v.literal('intermediate'),
      v.literal('advanced')
    ),
    imageUrl: v.optional(v.string()),
    instructions: v.array(v.string()),
    instructionsAr: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const exerciseId = await ctx.db.insert('exercises', args);
    return exerciseId;
  },
});

// Update an exercise (admin function)
export const updateExercise = mutation({
  args: {
    exerciseId: v.id('exercises'),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal('breathing'),
        v.literal('mindfulness'),
        v.literal('journaling'),
        v.literal('movement'),
        v.literal('relaxation')
      )
    ),
    duration: v.optional(v.number()),
    difficulty: v.optional(
      v.union(
        v.literal('beginner'),
        v.literal('intermediate'),
        v.literal('advanced')
      )
    ),
    imageUrl: v.optional(v.string()),
    instructions: v.optional(v.array(v.string())),
    instructionsAr: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { exerciseId, ...updates } = args;
    await ctx.db.patch(exerciseId, updates);
    return exerciseId;
  },
});

// Get exercises with user progress
export const getExercisesWithProgress = query({
  args: {
    limit: v.optional(v.number()),
    category: v.optional(
      v.union(
        v.literal('breathing'),
        v.literal('mindfulness'),
        v.literal('journaling'),
        v.literal('movement'),
        v.literal('relaxation')
      )
    ),
  },
  handler: async (ctx, args) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    // Get exercises with optional category filter and pagination
    const exercises = args.category
      ? await ctx.db
          .query('exercises')
          .withIndex('by_category', (q) => q.eq('category', args.category!))
          .take(args.limit || 50)
      : await ctx.db.query('exercises').take(args.limit || 50);

    // Get user's progress for these exercises only
    const exerciseIds = exercises.map((e) => e._id);
    const progress = await ctx.db
      .query('userProgress')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => {
        // Filter progress to only include the exercises we're showing
        return q.or(
          ...exerciseIds.map((id) => q.eq(q.field('exerciseId'), id))
        );
      })
      .collect();

    // Create a map of exercise completions
    const progressMap = new Map<
      string,
      { count: number; lastCompleted?: number }
    >();
    progress.forEach((p) => {
      const existing = progressMap.get(p.exerciseId) || { count: 0 };
      progressMap.set(p.exerciseId, {
        count: existing.count + 1,
        lastCompleted: Math.max(existing.lastCompleted || 0, p.completedAt),
      });
    });

    // Combine exercises with their completion count
    const exercisesWithProgress = exercises.map((exercise) => {
      const userProgress = progressMap.get(exercise._id);
      return {
        ...exercise,
        completionCount: userProgress?.count || 0,
        lastCompleted: userProgress?.lastCompleted,
      };
    });

    return exercisesWithProgress;
  },
});

// Get daily exercise for the authenticated user
export const getDailyExercise = query({
  args: {},
  handler: async (ctx) => {
    // Authenticate user and get their ID
    const user = await getAuthenticatedUser(ctx);

    // Get all exercises
    const exercises = await ctx.db.query('exercises').collect();

    if (exercises.length === 0) {
      return null;
    }

    // Get user's progress to prioritize uncompleted exercises
    const progress = await ctx.db
      .query('userProgress')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    // Create a set of completed exercise IDs for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const completedTodayIds = new Set(
      progress
        .filter((p) => p.completedAt >= todayTimestamp)
        .map((p) => p.exerciseId)
    );

    // Filter out exercises completed today
    const availableExercises = exercises.filter(
      (e) => !completedTodayIds.has(e._id)
    );

    // If all exercises are completed today, use all exercises
    const exercisePool =
      availableExercises.length > 0 ? availableExercises : exercises;

    // Use a deterministic daily selection based on date and user ID
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Simple hash of user ID for personalization
    let hash = 0;
    for (let i = 0; i < user._id.length; i++) {
      hash = (hash << 5) - hash + user._id.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Combine day and user hash for personalized daily selection
    const seed = dayOfYear + Math.abs(hash);
    const selectedIndex = seed % exercisePool.length;

    // Get completion count for the selected exercise
    const selectedExercise = exercisePool[selectedIndex];
    const exerciseProgress = progress.filter(
      (p) => p.exerciseId === selectedExercise._id
    );

    return {
      ...selectedExercise,
      completionCount: exerciseProgress.length,
      lastCompleted:
        exerciseProgress.length > 0
          ? Math.max(...exerciseProgress.map((p) => p.completedAt))
          : undefined,
    };
  },
});
