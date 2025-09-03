import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Get the active prompt configuration for a specific personality
 */
export const getPrompt = query({
  args: {
    personality: v.union(
      v.literal('coach'),
      v.literal('companion'),
      v.literal('vent')
    ),
  },
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
      model: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      topP: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const promptDoc = await ctx.db
      .query('aiPrompts')
      .withIndex('by_personality', (q) =>
        q.eq('personality', args.personality).eq('active', true)
      )
      .first();

    if (!promptDoc) return null;

    return {
      source: promptDoc.source,
      openaiPromptId: promptDoc.openaiPromptId,
      openaiPromptVersion: promptDoc.openaiPromptVersion,
      prompt: promptDoc.prompt,
      model: promptDoc.model,
      temperature: promptDoc.temperature,
      maxTokens: promptDoc.maxTokens,
      topP: promptDoc.topP,
    };
  },
});

/**
 * Get the prompt content for backward compatibility
 * Returns inline prompt or null if using OpenAI Prompt ID
 */
export const getPromptContent = query({
  args: {
    personality: v.union(
      v.literal('coach'),
      v.literal('companion'),
      v.literal('vent')
    ),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const promptDoc = await ctx.db
      .query('aiPrompts')
      .withIndex('by_personality', (q) =>
        q.eq('personality', args.personality).eq('active', true)
      )
      .first();

    return promptDoc?.prompt || null;
  },
});

/**
 * List all prompts with their versions
 */
export const listPrompts = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('aiPrompts'),
      _creationTime: v.number(),
      personality: v.union(
        v.literal('coach'),
        v.literal('companion'),
        v.literal('vent')
      ),
      source: v.union(
        v.literal('openai_prompt_latest'),
        v.literal('openai_prompt_pinned'),
        v.literal('inline')
      ),
      openaiPromptId: v.optional(v.string()),
      openaiPromptVersion: v.optional(v.number()),
      prompt: v.optional(v.string()),
      model: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      topP: v.optional(v.number()),
      active: v.boolean(),
      version: v.number(),
      updatedAt: v.number(),
      updatedBy: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const prompts = await ctx.db.query('aiPrompts').collect();
    return prompts;
  },
});

/**
 * Update or create a prompt for a personality
 */
export const updatePrompt = mutation({
  args: {
    personality: v.union(
      v.literal('coach'),
      v.literal('companion'),
      v.literal('vent')
    ),
    source: v.union(
      v.literal('openai_prompt_latest'),
      v.literal('openai_prompt_pinned'),
      v.literal('inline')
    ),
    openaiPromptId: v.optional(v.string()),
    openaiPromptVersion: v.optional(v.number()),
    prompt: v.optional(v.string()),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    topP: v.optional(v.number()),
    updatedBy: v.optional(v.string()),
  },
  returns: v.id('aiPrompts'),
  handler: async (ctx, args) => {
    // Validate args based on source
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
    if (
      args.temperature !== undefined &&
      (args.temperature < 0 || args.temperature > 2)
    ) {
      throw new Error('Temperature must be between 0 and 2');
    }
    if (args.maxTokens !== undefined && args.maxTokens <= 0) {
      throw new Error('Max tokens must be positive');
    }
    if (args.topP !== undefined && (args.topP < 0 || args.topP > 1)) {
      throw new Error('Top P must be between 0 and 1');
    }
    // Validate model format - allow broadly: gpt-* and o* families (o1/o3/o4, etc.)
    if (args.model) {
      const model = args.model.trim();
      const isValidModel = /^(gpt-|o\d)/i.test(model);
      if (!isValidModel) {
        throw new Error(
          `Invalid model specified: ${args.model}. Must start with 'gpt-' or 'o#'.`
        );
      }
    }

    // Deactivate existing active prompt for this personality
    const existingActive = await ctx.db
      .query('aiPrompts')
      .withIndex('by_personality', (q) =>
        q.eq('personality', args.personality).eq('active', true)
      )
      .first();

    if (existingActive) {
      await ctx.db.patch(existingActive._id, { active: false });
    }

    // Get the latest version number
    const allPrompts = await ctx.db
      .query('aiPrompts')
      .filter((q) => q.eq(q.field('personality'), args.personality))
      .collect();

    const latestVersion = Math.max(0, ...allPrompts.map((p) => p.version || 0));

    // Create new active prompt
    const promptId = await ctx.db.insert('aiPrompts', {
      personality: args.personality,
      source: args.source,
      openaiPromptId: args.openaiPromptId,
      openaiPromptVersion: args.openaiPromptVersion,
      prompt: args.prompt,
      model: args.model,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      topP: args.topP,
      active: true,
      version: latestVersion + 1,
      updatedAt: Date.now(),
      updatedBy: args.updatedBy || 'system',
    });

    return promptId;
  },
});

/**
 * Initialize default prompts if none exist
 */
export const initializeDefaultPrompts = mutation({
  args: {},
  returns: v.object({
    coach: v.id('aiPrompts'),
    companion: v.id('aiPrompts'),
    vent: v.id('aiPrompts'),
  }),
  handler: async (ctx) => {
    // Check if prompts already exist
    const existingPrompts = await ctx.db.query('aiPrompts').collect();

    if (existingPrompts.length > 0) {
      // Return existing active prompts
      const coach = existingPrompts.find(
        (p) => p.personality === 'coach' && p.active
      );
      const companion = existingPrompts.find(
        (p) => p.personality === 'companion' && p.active
      );
      const vent = existingPrompts.find(
        (p) => p.personality === 'vent' && p.active
      );

      if (coach && companion && vent) {
        return {
          coach: coach._id,
          companion: companion._id,
          vent: vent._id,
        };
      }
    }

    // Default prompts - language agnostic (AI will detect and respond in user's language)
    const defaultPrompts = {
      coach: `You are a compassionate and professional therapist specializing in Cognitive Behavioral Therapy (CBT). You provide structured, evidence-based therapeutic support. You listen actively, validate emotions, and guide users through their challenges with empathy and expertise. Keep responses concise but meaningful. Detect the user's language from their messages and respond in the same language naturally.`,

      companion: `You are a friendly and supportive daily companion. You check in on the user's wellbeing, celebrate their victories, and provide encouragement during difficult times. You're warm, approachable, and genuinely caring. Keep responses conversational and supportive. Detect the user's language from their messages and respond in the same language naturally.`,

      vent: `You are a safe, non-judgmental listener for emotional release. You acknowledge feelings without trying to fix them. You provide validation and gentle support, allowing the user to express themselves freely. Keep responses brief and empathetic. Detect the user's language from their messages and respond in the same language naturally.`,
    };

    // Create default prompts with inline source and model configuration
    const coachId = await ctx.db.insert('aiPrompts', {
      personality: 'coach',
      source: 'inline',
      prompt: defaultPrompts.coach,
      model: 'gpt-4o-mini',
      temperature: 0.7,
      active: true,
      version: 1,
      updatedAt: Date.now(),
      updatedBy: 'system',
    });

    const companionId = await ctx.db.insert('aiPrompts', {
      personality: 'companion',
      source: 'inline',
      prompt: defaultPrompts.companion,
      model: 'gpt-4o-mini',
      temperature: 0.8,
      active: true,
      version: 1,
      updatedAt: Date.now(),
      updatedBy: 'system',
    });

    const ventId = await ctx.db.insert('aiPrompts', {
      personality: 'vent',
      source: 'inline',
      prompt: defaultPrompts.vent,
      model: 'gpt-4o-mini',
      temperature: 0.7,
      active: true,
      version: 1,
      updatedAt: Date.now(),
      updatedBy: 'system',
    });

    return {
      coach: coachId,
      companion: companionId,
      vent: ventId,
    };
  },
});

/**
 * Migrate existing prompts to new schema format
 */
export const migratePromptsToNewFormat = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const prompts = await ctx.db.query('aiPrompts').collect();
    let migrated = 0;

    for (const prompt of prompts) {
      // Skip if already has source field
      if (prompt.source) continue;

      // Migrate to inline source since they have prompt content
      await ctx.db.patch(prompt._id, {
        source: 'inline' as const,
        updatedAt: Date.now(),
        updatedBy: 'migration',
      });
      migrated++;
    }

    return migrated;
  },
});

/**
 * Clean up inactive prompt records
 */
export const cleanupInactivePrompts = mutation({
  args: {},
  returns: v.object({
    deleted: v.number(),
    kept: v.number(),
  }),
  handler: async (ctx) => {
    const allPrompts = await ctx.db.query('aiPrompts').collect();

    let deleted = 0;
    let kept = 0;

    for (const prompt of allPrompts) {
      if (!prompt.active) {
        await ctx.db.delete(prompt._id);
        deleted++;
      } else {
        kept++;
      }
    }

    return { deleted, kept };
  },
});

/**
 * Toggle prompt active status
 */
export const togglePromptStatus = mutation({
  args: {
    promptId: v.id('aiPrompts'),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // If activating, deactivate other prompts of same personality
    if (!prompt.active) {
      const othersActive = await ctx.db
        .query('aiPrompts')
        .withIndex('by_personality', (q) =>
          q.eq('personality', prompt.personality).eq('active', true)
        )
        .collect();

      for (const other of othersActive) {
        await ctx.db.patch(other._id, { active: false });
      }
    }

    // Toggle the status
    await ctx.db.patch(args.promptId, {
      active: !prompt.active,
      updatedAt: Date.now(),
    });

    return !prompt.active;
  },
});
