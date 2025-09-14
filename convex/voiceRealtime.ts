import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getConfig = query({
  args: {},
  returns: v.union(
    v.object({
      source: v.union(
        v.literal('openai_prompt_latest'),
        v.literal('openai_prompt_pinned')
      ),
      openaiPromptId: v.optional(v.string()),
      openaiPromptVersion: v.optional(v.number()),
      model: v.string(),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      topP: v.optional(v.number()),
      defaultVoice: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const rec = await ctx.db
      .query('voiceRealtimeConfig')
      .withIndex('by_active', (q) => q.eq('active', true))
      .first();
    if (!rec) return null;
    return {
      source: rec.source,
      openaiPromptId: rec.openaiPromptId,
      openaiPromptVersion: rec.openaiPromptVersion,
      model: rec.model,
      temperature: rec.temperature,
      maxTokens: rec.maxTokens,
      topP: rec.topP,
      defaultVoice: rec.defaultVoice,
    };
  },
});

export const updateConfig = mutation({
  args: {
    source: v.union(
      v.literal('openai_prompt_latest'),
      v.literal('openai_prompt_pinned')
    ),
    openaiPromptId: v.optional(v.string()),
    openaiPromptVersion: v.optional(v.number()),
    model: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    topP: v.optional(v.number()),
    defaultVoice: v.optional(v.string()),
    updatedBy: v.optional(v.string()),
  },
  returns: v.id('voiceRealtimeConfig'),
  handler: async (ctx, args) => {
    // Validate source and associated fields
    if (!args.openaiPromptId) {
      throw new Error('OpenAI Prompt ID is required');
    }
    if (args.source === 'openai_prompt_pinned' && !args.openaiPromptVersion) {
      throw new Error('Pinned prompt requires openaiPromptVersion');
    }

    // Deactivate existing active record
    const current = await ctx.db
      .query('voiceRealtimeConfig')
      .withIndex('by_active', (q) => q.eq('active', true))
      .first();
    if (current) await ctx.db.patch(current._id, { active: false, updatedAt: Date.now() });

    // Find latest version
    const all = await ctx.db.query('voiceRealtimeConfig').collect();
    const latest = Math.max(0, ...all.map((r: any) => r.version || 0));

    // Insert new active config
    const id = await ctx.db.insert('voiceRealtimeConfig', {
      source: args.source,
      openaiPromptId: args.openaiPromptId,
      openaiPromptVersion: args.openaiPromptVersion,
      model: args.model.trim(),
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      topP: args.topP,
      defaultVoice: args.defaultVoice?.trim(),
      active: true,
      version: latest + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      updatedBy: args.updatedBy || 'system',
    });
    return id;
  },
});
