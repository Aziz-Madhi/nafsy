import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get the active summarization configuration
 */
export const getActiveSummarizationConfig = query({
  args: {},
  returns: v.union(
    v.object({
      source: v.union(
        v.literal('openai_prompt_latest'),
        v.literal('openai_prompt_pinned'),
        v.literal('inline')
      ),
      openaiPromptId: v.optional(v.string()),
      openaiPromptVersion: v.optional(v.number()),
      prompt: v.optional(v.string()),
      model: v.string(),
      temperature: v.number(),
      maxTokens: v.number(),
      topP: v.optional(v.number()),
      responseFormat: v.optional(
        v.object({
          type: v.union(v.literal('text'), v.literal('json_object')),
        })
      ),
      version: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const config = await ctx.db
      .query('summarizationConfig')
      .withIndex('by_active', (q) => q.eq('active', true))
      .first();

    if (!config) return null;

    return {
      source: config.source,
      openaiPromptId: config.openaiPromptId,
      openaiPromptVersion: config.openaiPromptVersion,
      prompt: config.prompt,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      responseFormat: config.responseFormat,
      version: config.version,
    };
  },
});

/**
 * List all summarization configurations
 */
export const listSummarizationConfigs = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('summarizationConfig'),
      _creationTime: v.number(),
      source: v.union(
        v.literal('openai_prompt_latest'),
        v.literal('openai_prompt_pinned'),
        v.literal('inline')
      ),
      openaiPromptId: v.optional(v.string()),
      openaiPromptVersion: v.optional(v.number()),
      prompt: v.optional(v.string()),
      model: v.string(),
      temperature: v.number(),
      maxTokens: v.number(),
      topP: v.optional(v.number()),
      responseFormat: v.optional(
        v.object({
          type: v.union(v.literal('text'), v.literal('json_object')),
        })
      ),
      active: v.boolean(),
      version: v.number(),
      createdAt: v.number(),
      updatedAt: v.number(),
      updatedBy: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const configs = await ctx.db.query('summarizationConfig').collect();
    return configs;
  },
});

/**
 * Update or create a summarization configuration
 */
export const updateSummarizationConfig = mutation({
  args: {
    source: v.union(
      v.literal('openai_prompt_latest'),
      v.literal('openai_prompt_pinned'),
      v.literal('inline')
    ),
    openaiPromptId: v.optional(v.string()),
    openaiPromptVersion: v.optional(v.number()),
    prompt: v.optional(v.string()),
    model: v.string(),
    temperature: v.number(),
    maxTokens: v.number(),
    topP: v.optional(v.number()),
    responseFormat: v.optional(
      v.object({
        type: v.union(v.literal('text'), v.literal('json_object')),
      })
    ),
    updatedBy: v.optional(v.string()),
  },
  returns: v.id('summarizationConfig'),
  handler: async (ctx, args) => {
    // Validate args based on source (same as aiPrompts)
    if (args.source.startsWith('openai_prompt') && !args.openaiPromptId) {
      throw new Error('OpenAI Prompt ID required when using OpenAI source');
    }
    if (args.source === 'openai_prompt_pinned' && !args.openaiPromptVersion) {
      throw new Error('Version required when using pinned OpenAI prompt');
    }
    if (args.source === 'inline' && !args.prompt) {
      throw new Error('Prompt content required when using inline source');
    }

    // Validate model parameters
    if (args.temperature < 0 || args.temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    if (args.maxTokens <= 0) {
      throw new Error('Max tokens must be positive');
    }
    if (args.topP !== undefined && (args.topP < 0 || args.topP > 1)) {
      throw new Error('Top P must be between 0 and 1');
    }
    // Align model validation with aiPrompts (allow gpt-* and o# families)
    const model = args.model.trim();
    const isValidModel = /^(gpt-|o\d)/i.test(model);
    if (!isValidModel) {
      throw new Error(
        `Invalid model specified: ${args.model}. Must start with 'gpt-' or 'o#'.`
      );
    }
    // (model format already validated above)

    // Deactivate existing active configuration
    const existingActive = await ctx.db
      .query('summarizationConfig')
      .withIndex('by_active', (q) => q.eq('active', true))
      .first();

    if (existingActive) {
      await ctx.db.patch(existingActive._id, { active: false });
    }

    // Get the latest version number
    const allConfigs = await ctx.db.query('summarizationConfig').collect();

    const latestVersion = Math.max(0, ...allConfigs.map((c) => c.version || 0));

    // Create new active configuration
    const configId = await ctx.db.insert('summarizationConfig', {
      source: args.source,
      openaiPromptId: args.openaiPromptId,
      openaiPromptVersion: args.openaiPromptVersion,
      prompt: args.prompt,
      model: args.model,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      topP: args.topP,
      responseFormat: args.responseFormat,
      active: true,
      version: latestVersion + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      updatedBy: args.updatedBy || 'system',
    });

    return configId;
  },
});

/**
 * Initialize default summarization configuration if none exists
 */
export const initializeDefaultSummarizationConfig = mutation({
  args: {},
  returns: v.union(v.id('summarizationConfig'), v.null()),
  handler: async (ctx) => {
    // Check if any configuration already exists
    const existingConfig = await ctx.db.query('summarizationConfig').first();

    if (existingConfig) {
      return null; // Configuration already exists
    }

    // Create default configuration matching the current summarization flow (plain text, one-paragraph)
    const configId = await ctx.db.insert('summarizationConfig', {
      source: 'inline',
      prompt:
        "Analyze the provided user's weekly data (conversations, mood entries, and wellness exercises) and write a single cohesive paragraph (roughly 400–500 characters) that summarizes their week. Focus on emotional patterns, key themes, mood shifts, and wellness activity highlights. Write warmly and personably. Return plain text only.",
      model: 'gpt-4o-mini',
      temperature: 0.3,
      maxTokens: 700,
      responseFormat: { type: 'text' },
      active: true,
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      updatedBy: 'system',
    });

    return configId;
  },
});

/**
 * Toggle configuration active status
 */
export const toggleConfigStatus = mutation({
  args: {
    configId: v.id('summarizationConfig'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error('Configuration not found');
    }

    // If activating, deactivate other configurations
    if (!config.active) {
      const othersActive = await ctx.db
        .query('summarizationConfig')
        .withIndex('by_active', (q) => q.eq('active', true))
        .collect();

      for (const other of othersActive) {
        await ctx.db.patch(other._id, { active: false });
      }
    }

    // Toggle the status
    await ctx.db.patch(args.configId, {
      active: !config.active,
      updatedAt: Date.now(),
    });

    return !config.active;
  },
});

/**
 * Delete a configuration (only if not active)
 */
export const deleteSummarizationConfig = mutation({
  args: {
    configId: v.id('summarizationConfig'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error('Configuration not found');
    }

    if (config.active) {
      throw new Error('Cannot delete active configuration');
    }

    await ctx.db.delete(args.configId);
    return true;
  },
});
