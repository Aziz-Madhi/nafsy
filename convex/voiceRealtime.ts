import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import appRateLimiter, {
  VOICE_MONTHLY_LIMIT,
  ensureVoiceLimiterVersion,
  readVoiceLimiterVersion,
  voiceLimiterKey,
} from './rateLimit';
import { getAuthenticatedUser } from './auth';

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

export const checkAllowance = query({
  args: {
    userId: v.id('users'),
    requiredTokens: v.optional(v.number()),
  },
  returns: v.object({
    ok: v.boolean(),
    remaining: v.number(),
    required: v.number(),
    retryAfter: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const required = Math.min(
      VOICE_MONTHLY_LIMIT,
      Math.max(1, Math.ceil(args.requiredTokens ?? 1))
    );
    const version = await readVoiceLimiterVersion(ctx);
    const limiterKey = voiceLimiterKey(version, args.userId);
    const status = await appRateLimiter.check(
      ctx as any,
      'voiceMonthlyTokens' as any,
      {
        key: limiterKey,
        count: required,
        throws: false,
      }
    );
    const state = await appRateLimiter.getValue(
      ctx,
      'voiceMonthlyTokens' as any,
      {
        key: limiterKey,
      }
    );
    const remaining = Math.max(0, Math.floor(state?.value ?? 0));
    return {
      ok: status.ok,
      remaining,
      required,
      retryAfter: status.retryAfter || undefined,
    } as const;
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
    if (current) {
      await ctx.db.patch(current._id, {
        active: false,
        updatedAt: Date.now(),
      });
    }

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

// Consume combined voice tokens (input + output) against the monthly quota.
// Client should call this after a voice session/turn with actual usage.
export const consumeVoiceTokens = mutation({
  args: {
    // Option 1: pass total tokens directly
    totalTokens: v.optional(v.number()),
    // Option 2: pass individual counts and they will be summed
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    responseId: v.optional(v.string()),
    usage: v.optional(
      v.object({
        total_tokens: v.optional(v.number()),
        input_tokens: v.optional(v.number()),
        output_tokens: v.optional(v.number()),
        input_token_details: v.optional(
          v.object({
            text_tokens: v.optional(v.number()),
            audio_tokens: v.optional(v.number()),
            cached_tokens: v.optional(v.number()),
          })
        ),
        output_token_details: v.optional(
          v.object({
            text_tokens: v.optional(v.number()),
            audio_tokens: v.optional(v.number()),
          })
        ),
      })
    ),
    billable: v.optional(
      v.object({
        textIn: v.optional(v.number()),
        textOut: v.optional(v.number()),
        audioIn: v.optional(v.number()),
        audioOut: v.optional(v.number()),
        total: v.optional(v.number()),
      })
    ),
  },
  returns: v.object({
    ok: v.boolean(),
    retryAfter: v.optional(v.number()),
    totalTokens: v.optional(v.number()),
    details: v.optional(
      v.object({
        textIn: v.optional(v.number()),
        textOut: v.optional(v.number()),
        audioIn: v.optional(v.number()),
        audioOut: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const usage = args.usage;
    const { version } = await ensureVoiceLimiterVersion(ctx);
    const limiterKey = voiceLimiterKey(version, user._id);

    const inputDetails = usage?.input_token_details;
    const outputDetails = usage?.output_token_details;

    const billableTextIn =
      args.billable?.textIn ??
      Math.max(
        (inputDetails?.text_tokens ?? 0) - (inputDetails?.cached_tokens ?? 0),
        0
      );
    const billableTextOut =
      args.billable?.textOut ?? outputDetails?.text_tokens ?? 0;
    const billableAudioIn =
      args.billable?.audioIn ?? inputDetails?.audio_tokens ?? 0;
    const billableAudioOut =
      args.billable?.audioOut ?? outputDetails?.audio_tokens ?? 0;

    const sumBillable =
      billableTextIn + billableTextOut + billableAudioIn + billableAudioOut;

    const summedInputOutput =
      (args.inputTokens ?? 0) + (args.outputTokens ?? 0);
    const fallbackTotal =
      args.totalTokens ?? usage?.total_tokens ?? summedInputOutput;

    const totalTokens = Math.max(
      0,
      Math.floor(sumBillable || fallbackTotal || 0)
    );

    const details = {
      textIn: billableTextIn,
      textOut: billableTextOut,
      audioIn: billableAudioIn,
      audioOut: billableAudioOut,
    } as const;

    if (!totalTokens || totalTokens <= 0) {
      return {
        ok: true,
        totalTokens: 0,
        details,
      } as const;
    }

    let remaining = totalTokens;
    let retryAfter: number | undefined;

    while (remaining > 0) {
      const chunk = Math.min(remaining, VOICE_MONTHLY_LIMIT);
      if (chunk <= 0) break;

      const status = await appRateLimiter.limit(
        ctx,
        'voiceMonthlyTokens' as any,
        {
          key: limiterKey,
          count: chunk,
          throws: false,
        }
      );

      if (!status.ok) {
        return {
          ok: false,
          retryAfter: status.retryAfter,
          totalTokens,
          details,
        } as const;
      }

      if (status.retryAfter) {
        retryAfter = status.retryAfter;
      }

      remaining -= chunk;
    }

    return {
      ok: true,
      retryAfter,
      totalTokens,
      details,
    } as const;
  },
});
