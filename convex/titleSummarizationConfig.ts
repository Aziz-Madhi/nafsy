import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get the active title summarization configuration (no fallback, required)
 */
export const getActiveTitleSummarizationConfig = query({
  args: {},
  returns: v.union(
    v.object({
      source: v.union(
        v.literal('openai_prompt_latest'),
        v.literal('openai_prompt_pinned')
      ),
      openaiPromptId: v.string(),
      openaiPromptVersion: v.optional(v.number()),
      model: v.string(),
      version: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const config = await ctx.db
      .query('titleSummarizationConfig')
      .withIndex('by_active', (q) => q.eq('active', true))
      .first();
    if (!config) return null;
    return {
      source: config.source,
      openaiPromptId: config.openaiPromptId,
      openaiPromptVersion: config.openaiPromptVersion,
      model: config.model,
      version: config.version,
    };
  },
});

/**
 * List all title summarization configs
 */
export const listTitleSummarizationConfigs = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('titleSummarizationConfig'),
      _creationTime: v.number(),
      source: v.union(
        v.literal('openai_prompt_latest'),
        v.literal('openai_prompt_pinned')
      ),
      openaiPromptId: v.string(),
      openaiPromptVersion: v.optional(v.number()),
      model: v.string(),
      active: v.boolean(),
      version: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      updatedBy: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    return await ctx.db.query('titleSummarizationConfig').collect();
  },
});

/**
 * Create a new version and set active title summarization config
 * Only model + OpenAI Prompt ID are supported. No inline fallback.
 */
export const updateTitleSummarizationConfig = mutation({
  args: {
    source: v.union(
      v.literal('openai_prompt_latest'),
      v.literal('openai_prompt_pinned')
    ),
    openaiPromptId: v.string(),
    openaiPromptVersion: v.optional(v.number()),
    model: v.string(),
    updatedBy: v.optional(v.string()),
  },
  returns: v.id('titleSummarizationConfig'),
  handler: async (ctx, args) => {
    if (args.source === 'openai_prompt_pinned' && !args.openaiPromptVersion) {
      throw new Error(
        'Pinned prompt version required when using pinned source'
      );
    }

    // Deactivate current active config if exists
    const existingActive = await ctx.db
      .query('titleSummarizationConfig')
      .withIndex('by_active', (q) => q.eq('active', true))
      .first();
    if (existingActive) {
      await ctx.db.patch(existingActive._id, { active: false });
    }

    const all = await ctx.db.query('titleSummarizationConfig').collect();
    const latestVersion = Math.max(0, ...all.map((c) => c.version || 0));

    const id = await ctx.db.insert('titleSummarizationConfig', {
      source: args.source,
      openaiPromptId: args.openaiPromptId,
      openaiPromptVersion: args.openaiPromptVersion,
      model: args.model,
      active: true,
      version: latestVersion + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      updatedBy: args.updatedBy || 'system',
    });
    return id;
  },
});
