import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all exercises
export const getAllExercises = query({
  args: {},
  handler: async (ctx) => {
    const exercises = await ctx.db.query("exercises").collect();
    return exercises;
  },
});

// Get exercises by category
export const getExercisesByCategory = query({
  args: {
    category: v.union(
      v.literal("breathing"),
      v.literal("mindfulness"),
      v.literal("journaling"),
      v.literal("movement"),
      v.literal("relaxation")
    ),
  },
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
    return exercises;
  },
});

// Get single exercise by ID
export const getExercise = query({
  args: {
    exerciseId: v.id("exercises"),
  },
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);
    return exercise;
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
      v.literal("breathing"),
      v.literal("mindfulness"),
      v.literal("journaling"),
      v.literal("movement"),
      v.literal("relaxation")
    ),
    duration: v.number(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    imageUrl: v.optional(v.string()),
    instructions: v.array(v.string()),
    instructionsAr: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const exerciseId = await ctx.db.insert("exercises", args);
    return exerciseId;
  },
});

// Update an exercise (admin function)
export const updateExercise = mutation({
  args: {
    exerciseId: v.id("exercises"),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    category: v.optional(v.union(
      v.literal("breathing"),
      v.literal("mindfulness"),
      v.literal("journaling"),
      v.literal("movement"),
      v.literal("relaxation")
    )),
    duration: v.optional(v.number()),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
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
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const exercises = await ctx.db.query("exercises").collect();
    
    // Get user's progress for all exercises
    const progress = await ctx.db
      .query("userProgress")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Create a map of exercise completions
    const progressMap = new Map<string, number>();
    progress.forEach((p) => {
      const key = p.exerciseId;
      progressMap.set(key, (progressMap.get(key) || 0) + 1);
    });

    // Combine exercises with their completion count
    const exercisesWithProgress = exercises.map((exercise) => ({
      ...exercise,
      completionCount: progressMap.get(exercise._id) || 0,
      lastCompleted: progress
        .filter((p) => p.exerciseId === exercise._id)
        .sort((a, b) => b.completedAt - a.completedAt)[0]?.completedAt,
    }));

    return exercisesWithProgress;
  },
});