import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { components } from './_generated/api';
import { R2 } from '@convex-dev/r2';
import { getAuthenticatedUserWithRateLimit } from './auth';

// Instantiate R2 component client using generated component bindings
export const r2 = new R2(components.r2);

// Expose client-side helpers for upload flows (signed URL + metadata sync)
// TEMPORARY: Relax auth for developer upload session
export const { generateUploadUrl, syncMetadata } = r2.clientApi({
  checkUpload: async (_ctx) => {
    // intentionally left open temporarily
  },
  onUpload: async (_ctx, _bucket, _key) => {
    // no-op
  },
});

// Optional: Generate a signed upload URL for a specific object key
// Useful to store audio files at semantic paths, e.g. "audio/exercises/<id>.m4a"
// TEMPORARY: Relax auth for developer upload session
export const generateUploadUrlWithCustomKey = mutation({
  args: {
    key: v.string(),
  },
  returns: v.object({ url: v.string(), key: v.string() }),
  handler: async (ctx, args) => {
    return r2.generateUploadUrl(args.key);
  },
});

// Generate a signed URL for a given object key
export const getFileUrl = query({
  args: {
    key: v.string(),
    // Expiration in seconds; default inside component is 15 minutes
    expiresIn: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (_ctx, args) => {
    return r2.getUrl(
      args.key,
      args.expiresIn ? { expiresIn: args.expiresIn } : undefined
    );
  },
});

// Resolve an exercise's audioKey into a signed URL for streaming
export const getExerciseAudioUrl = query({
  args: {
    exerciseId: v.id('exercises'),
    lang: v.optional(v.union(v.literal('en'), v.literal('ar'))),
    expiresIn: v.optional(v.number()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) return null;
    const lang = args.lang || 'en';
    const key =
      lang === 'ar'
        ? ((exercise as any).audioKeyAr as string | undefined) ||
          ((exercise as any).audioKey as string | undefined)
        : ((exercise as any).audioKey as string | undefined) ||
          ((exercise as any).audioKeyAr as string | undefined);
    if (!key) return null;
    return r2.getUrl(
      key,
      args.expiresIn ? { expiresIn: args.expiresIn } : undefined
    );
  },
});

// Link an uploaded R2 object to an exercise
// TEMPORARY: Relax auth for developer upload session
export const linkExerciseAudio = mutation({
  args: {
    exerciseId: v.id('exercises'),
    key: v.string(),
  },
  returns: v.id('exercises'),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.exerciseId, { audioKey: args.key });
    return args.exerciseId;
  },
});

// Link an uploaded R2 object for a specific language
export const linkExerciseAudioLang = mutation({
  args: {
    exerciseId: v.id('exercises'),
    lang: v.union(v.literal('en'), v.literal('ar')),
    key: v.string(),
  },
  returns: v.id('exercises'),
  handler: async (ctx, args) => {
    if (args.lang === 'ar') {
      await ctx.db.patch(args.exerciseId, { audioKeyAr: args.key });
    } else {
      await ctx.db.patch(args.exerciseId, { audioKey: args.key });
    }
    return args.exerciseId;
  },
});

// Temporary fix: remove wrongly added `audioStorageId` field from an exercise
export const removeExerciseAudioStorageId = mutation({
  args: {
    exerciseId: v.id('exercises'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.exerciseId);
    if (!doc) return false;

    // Reconstruct the document with only schema-approved fields.
    const sanitized = {
      title: doc.title,
      titleAr: doc.titleAr,
      description: doc.description,
      descriptionAr: doc.descriptionAr,
      category: doc.category,
      duration: doc.duration,
      difficulty: doc.difficulty,
      imageUrl: doc.imageUrl,
      audioKey: (doc as any).audioKey,
      instructions: doc.instructions,
      instructionsAr: doc.instructionsAr,
    } as const;

    await ctx.db.replace(args.exerciseId, sanitized as any);
    return true;
  },
});

// Delete an exercise document entirely
export const deleteExerciseById = mutation({
  args: {
    exerciseId: v.id('exercises'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.exerciseId);
    return true;
  },
});
