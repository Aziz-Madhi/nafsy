import { v } from 'convex/values';
import {
  query,
  internalMutation,
  internalAction,
  internalQuery,
} from './_generated/server';
import { api, internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
// Responses API usage is enforced; no fallbacks.

// Cache for summarization config (reuse PROMPT_CACHE_TTL_MS for parity)
const CONFIG_CACHE_TTL_MS = Number(process.env.PROMPT_CACHE_TTL_MS || 30_000);
const configCache = new Map<string, { data: any; expires: number }>();

// Tunable limits for context sizes (can be overridden via env)
const USER_CONTEXT_MAX_CHARS = Number(
  process.env.USER_CONTEXT_MAX_CHARS || 8000
);
const WEEKLY_SUMMARY_MAX_CHARS = Number(
  process.env.WEEKLY_SUMMARY_MAX_CHARS || 8000
);

// User context types
export interface UserContextInput {
  user: {
    _id: Id<'users'>;
    name?: string;
    language: string;
  };
  personality: 'coach' | 'companion' | 'vent';
  messages: { role: 'user' | 'assistant'; content?: string; parts?: any[] }[];
}

export interface UserContextResult {
  text: string;
  level: 'full' | 'light' | 'none';
}

// Unified result shape for weekly AI summary
interface AISummaryResult {
  summary: string;
  mood: string;
  conversation: string;
  exercise: string;
}

/**
 * Build personalized context for AI responses
 * Fetches today's mood, exercises, and weekly summary
 */
export const buildUserContext = internalQuery({
  args: {
    user: v.object({
      _id: v.id('users'),
      name: v.optional(v.string()),
      language: v.string(),
    }),
    personality: v.union(
      v.literal('coach'),
      v.literal('companion'),
      v.literal('vent')
    ),
    messages: v.array(
      v.object({
        role: v.union(v.literal('user'), v.literal('assistant')),
        content: v.optional(v.string()),
        parts: v.optional(v.array(v.any())),
      })
    ),
  },
  returns: v.object({
    text: v.string(),
    level: v.union(v.literal('full'), v.literal('light'), v.literal('none')),
  }),
  handler: async (ctx, args): Promise<UserContextResult> => {
    const { user, personality, messages } = args;

    // Determine context level based on session state
    const assistantMessages = messages.filter((m) => m.role === 'assistant');
    const isNewSession = assistantMessages.length === 0;
    const level = isNewSession ? 'full' : 'light';

    try {
      // Load full user for createdAt & onboarding fields
      const fullUser = await ctx.db.get(user._id);
      const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
      const isFirstWeek = fullUser
        ? Date.now() - (fullUser.createdAt || Date.now()) < ONE_WEEK_MS
        : false;

      // Get today's context data in parallel (internal reads; no auth required)
      const [todayMoods, todayExercises, latestSummary] = await Promise.all([
        (async () => {
          const dayStart = new Date();
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date();
          dayEnd.setHours(23, 59, 59, 999);

          const moods = await ctx.db
            .query('moods')
            .withIndex('by_user_date', (q: any) => q.eq('userId', user._id))
            .filter((q: any) =>
              q.and(
                q.gte(q.field('createdAt'), dayStart.getTime()),
                q.lte(q.field('createdAt'), dayEnd.getTime())
              )
            )
            .order('asc')
            .collect();

          const morning =
            moods.find((m: any) => m.timeOfDay === 'morning') ||
            moods.find((m: any) => new Date(m.createdAt).getHours() < 12) ||
            null;
          const evening =
            moods.find((m: any) => m.timeOfDay === 'evening') ||
            moods.find(
              (m: any) =>
                new Date(m.createdAt).getHours() >= 12 && m !== morning
            ) ||
            null;

          return { morning, evening, all: moods };
        })(),
        (async () => {
          const since = Date.now() - 24 * 60 * 60 * 1000;
          const progress = await ctx.db
            .query('userProgress')
            .withIndex('by_user', (q: any) => q.eq('userId', user._id))
            .filter((q: any) => q.gte(q.field('completedAt'), since))
            .order('desc')
            .take(50);

          const exerciseIds = [
            ...new Set(progress.map((p: any) => p.exerciseId)),
          ];
          const exercises = await Promise.all(
            exerciseIds.map((id) => ctx.db.get(id))
          );
          const map = new Map(
            exercises.filter(Boolean).map((e: any) => [e._id, e])
          );
          return progress.map((p: any) => ({
            ...p,
            exercise: map.get(p.exerciseId),
          }));
        })(),
        // For first-week users, skip weekly summary (we'll use onboarding context)
        isFirstWeek
          ? Promise.resolve(null)
          : getLatestWeeklySummary(ctx, user._id),
      ]);

      // Build onboarding profile context for first-week users (no summarization)
      const onboardingText = isFirstWeek
        ? formatOnboardingProfileText(fullUser, user.language)
        : null;

      const contextText = formatUserContext({
        user,
        level,
        todayMoods,
        todayExercises,
        weeklySummary: latestSummary,
        onboardingText,
      });

      return {
        text: contextText,
        level,
      };
    } catch (error) {
      console.error('Error building user context:', error);
      // Return minimal context on error
      return {
        text: `--- BEGIN_USER_CONTEXT ---\nName: ${user.name || 'User'}, Language: ${user.language}\n--- END_USER_CONTEXT ---`,
        level: 'none',
      };
    }
  },
});

/**
 * Generate weekly summaries for all active users
 * Called by cron job every Sunday
 */
export const generateWeeklySummaries = internalMutation({
  args: {},
  returns: v.object({
    processed: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx) => {
    let processed = 0;
    let errors = 0;

    // Get all active users (active within last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const activeUsers = await ctx.db
      .query('users')
      .withIndex('by_last_active' as any)
      .filter((q: any) => q.gte(q.field('lastActive'), thirtyDaysAgo))
      .collect();

    console.log(
      `Processing weekly summaries for ${activeUsers.length} active users`
    );

    // Calculate week boundaries (Sunday to Saturday)
    const now = new Date();
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay()); // Go to last Sunday
    lastSunday.setHours(0, 0, 0, 0); // Start of day
    const weekStartDate = lastSunday.getTime();

    const previousSunday = new Date(lastSunday);
    previousSunday.setDate(lastSunday.getDate() - 7);
    const previousWeekStart = previousSunday.getTime();

    for (const user of activeUsers) {
      try {
        // Check if summary already exists for this week
        const existingSummary = await ctx.db
          .query('userSummaries')
          .withIndex('by_user_week', (q) =>
            q.eq('userId', user._id).eq('weekStartDate', previousWeekStart)
          )
          .first();

        if (existingSummary) {
          console.log(
            `Summary already exists for user ${user._id}, week ${previousWeekStart}`
          );
          continue;
        }

        // Generate summary for the previous week
        const summary = await generateUserWeeklySummary(
          ctx,
          user,
          previousWeekStart,
          weekStartDate
        );

        if (summary) {
          await ctx.db.insert('userSummaries', {
            userId: user._id,
            weekStartDate: previousWeekStart,
            conversationSummary: summary.conversation,
            moodSummary: summary.mood,
            exerciseSummary: summary.exercise,
            summaryText: summary.summary,
            createdAt: Date.now(),
          });
          processed++;
        }
      } catch (error) {
        console.error(`Error processing summary for user ${user._id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  },
});

// Action-based weekly summaries (cron-safe: allowed to use fetch)
export const generateWeeklySummariesAction = internalAction({
  args: {},
  returns: v.object({ processed: v.number(), errors: v.number() }),
  handler: async (ctx) => {
    let processed = 0;
    let errors = 0;

    // Load active users via query helper (actions can't access DB directly)
    const activeUsers = await ctx.runQuery(
      api.personalization._getActiveUsers,
      {} as any
    );

    // Determine previous week window (Sunday 00:00 to following Sunday 00:00)
    const now = new Date();
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay());
    lastSunday.setHours(0, 0, 0, 0);
    const weekStartDate = lastSunday.getTime();
    const previousSunday = new Date(lastSunday);
    previousSunday.setDate(lastSunday.getDate() - 7);
    const previousWeekStart = previousSunday.getTime();

    // Active summarization config
    const config = await ctx.runQuery(
      api.summarizationConfig.getActiveSummarizationConfig,
      {} as any
    );
    if (!config) throw new Error('No active summarization configuration found');

    for (const user of activeUsers) {
      try {
        const exists = await ctx.runQuery(
          api.personalization._getSummaryForWeek,
          {
            userId: user._id,
            weekStartDate: previousWeekStart,
          }
        );
        if (exists) continue;

        // Collect previous week data
        const { conversations, moods, exercises } = await ctx.runQuery(
          api.personalization._collectWeeklyData,
          { userId: user._id, start: previousWeekStart, end: weekStartDate }
        );

        if (
          (!conversations || conversations.length === 0) &&
          (!moods || moods.length === 0) &&
          (!exercises || exercises.length === 0)
        ) {
          continue;
        }

        // Build input text
        const conversationText = conversations
          .map((msg: any) => `${msg.role}: ${msg.content || ''}`)
          .join('\n');
        const moodText = moods
          .map((m: any) => {
            const mood = m.mood || m.moodCategory || 'unspecified';
            const note = m.note ? `: ${m.note}` : '';
            const rating = m.rating ? ` (${m.rating}/10)` : '';
            return `${mood}${rating}${note}`;
          })
          .join(' | ');
        const exerciseText = exercises
          .map((e: any) => {
            const category = e.exercise?.category || 'exercise';
            const duration = e.duration
              ? ` ${Math.round(e.duration / 60)}min`
              : '';
            return `${category}${duration}`;
          })
          .join(', ');
        const inputData = `CONVERSATIONS:\n${conversationText}\n\nMOODS:\n${moodText}\n\nEXERCISES:\n${exerciseText}`;

        const payload: any = {
          model: config.model,
          stream: false,
          input: [{ role: 'user', content: inputData }],
        };
        if (
          config.source.startsWith('openai_prompt') &&
          config.openaiPromptId
        ) {
          payload.prompt = { id: config.openaiPromptId };
          if (
            config.source === 'openai_prompt_pinned' &&
            config.openaiPromptVersion
          ) {
            payload.prompt.version = String(config.openaiPromptVersion);
          }
        } else if (config.source === 'inline' && config.prompt) {
          payload.instructions = config.prompt;
        } else {
          throw new Error('Misconfigured summarization configuration');
        }
        if (config.temperature !== undefined)
          payload.temperature = config.temperature;
        if (config.maxTokens !== undefined)
          payload.max_output_tokens = config.maxTokens;
        if (config.topP !== undefined) payload.top_p = config.topP;

        // Call OpenAI (actions support fetch)
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('OpenAI API key not configured');
        const response = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const err = await response.text();
          throw new Error(
            `OpenAI Responses API error ${response.status}: ${err}`
          );
        }
        const result = await response.json();
        console.log(
          'Weekly summaries API result:',
          JSON.stringify(result, null, 2)
        );
        let summaryText = '';

        // Check for the new Responses API structure
        if (Array.isArray(result.output)) {
          const messageOutput = result.output.find(
            (o: any) => o.type === 'message'
          );
          if (messageOutput?.content?.[0]?.text) {
            summaryText = messageOutput.content[0].text;
          }
        }

        // Fallback to other formats
        if (!summaryText) {
          if (typeof result.output_text === 'string')
            summaryText = result.output_text;
          else if (typeof result.response?.output_text === 'string')
            summaryText = result.response.output_text;
          else if (result.choices?.[0]?.message?.content)
            summaryText = result.choices[0].message.content;
          else if (typeof result.content === 'string')
            summaryText = result.content;
        }
        const finalSummary = (summaryText || '').trim();
        if (!finalSummary) {
          console.error('Weekly summaries failed to extract from:', result);
          throw new Error('Empty summary returned from Responses API');
        }

        await ctx.runMutation(internal.personalization._insertUserSummary, {
          userId: user._id,
          weekStartDate: previousWeekStart,
          conversation: '',
          mood: '',
          exercise: '',
          summary: finalSummary,
        });
        processed++;
      } catch (e) {
        errors++;
      }
    }

    return { processed, errors };
  },
});

/**
 * Test summary generation with sample data
 */
export const testSummaryGeneration = internalMutation({
  args: {},
  returns: v.object({
    summary: v.string(),
    mood: v.string(),
    conversation: v.string(),
    exercise: v.string(),
  }),
  handler: async (ctx): Promise<AISummaryResult> => {
    // Create test data
    const testUser = {
      _id: 'test_user_id' as Id<'users'>,
      name: 'Test User',
      email: 'test@example.com',
      clerkId: 'test_clerk',
      language: 'en',
      createdAt: Date.now(),
      lastActive: Date.now(),
    };

    const testConversations = [
      {
        role: 'user',
        content: 'I am feeling anxious about my presentation tomorrow',
        createdAt: Date.now() - 100000,
      },
      {
        role: 'assistant',
        content:
          'I understand you are anxious. Let us work through this together.',
        createdAt: Date.now() - 90000,
      },
      {
        role: 'user',
        content: 'I tried the breathing exercise and it helped a bit',
        createdAt: Date.now() - 80000,
      },
    ];

    const testMoods = [
      {
        mood: 'anxious',
        rating: 7,
        note: 'Worried about work presentation',
        createdAt: Date.now() - 200000,
      },
      {
        mood: 'neutral',
        rating: 5,
        note: 'Feeling a bit better after exercise',
        createdAt: Date.now() - 100000,
      },
      {
        mood: 'happy',
        rating: 8,
        note: 'Presentation went well!',
        createdAt: Date.now() - 50000,
      },
    ];

    const testExercises = [
      {
        exercise: { category: 'breathing' },
        duration: 300,
        createdAt: Date.now() - 150000,
      },
      {
        exercise: { category: 'mindfulness' },
        duration: 600,
        createdAt: Date.now() - 100000,
      },
    ];

    console.log('Testing summary generation with sample data...');

    try {
      const summary: AISummaryResult = await generateAISummary(ctx, {
        conversations: testConversations as any,
        moods: testMoods as any,
        exercises: testExercises as any,
        user: testUser as any,
      });

      console.log('Test summary generated successfully:', summary);
      return summary;
    } catch (error) {
      console.error('Test summary generation failed:', error);
      throw error;
    }
  },
});

/**
 * Ensure current week's summary exists for a user.
 * If missing, generate a summary for the last 7 days and insert it with the
 * current week's start (last Sunday 00:00) as weekStartDate.
 */
// ensureCurrentSummary handled by ensureCurrentSummaryAction (no mutation wrapper)

// Action: ensure current week's summary exists (allowed to use fetch)
export const ensureCurrentSummaryAction = internalAction({
  args: { userId: v.id('users') },
  returns: v.object({
    status: v.union(
      v.literal('exists'),
      v.literal('created'),
      v.literal('skipped')
    ),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.personalization._getUserById, {
      userId: args.userId,
    });
    if (!user) return { status: 'skipped' as const };

    const now = new Date();
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay());
    lastSunday.setHours(0, 0, 0, 0);
    const currentWeekStart = lastSunday.getTime();

    const exists = await ctx.runQuery(api.personalization._getSummaryForWeek, {
      userId: user._id,
      weekStartDate: currentWeekStart,
    });
    if (exists) return { status: 'exists' as const };

    // Gather last 7 days of data
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyData = await ctx.runQuery(
      api.personalization._collectWeeklyData,
      {
        userId: user._id,
        start: sevenDaysAgo,
        end: Date.now(),
      }
    );
    const { conversations, moods, exercises } = weeklyData;
    if (
      (!conversations || conversations.length === 0) &&
      (!moods || moods.length === 0) &&
      (!exercises || exercises.length === 0)
    ) {
      return { status: 'skipped' as const };
    }

    // Load active summarization config
    const config = await ctx.runQuery(
      api.summarizationConfig.getActiveSummarizationConfig,
      {} as any
    );
    if (!config) throw new Error('No active summarization configuration found');

    // Prepare payload (reuse same formatting as generateAISummary)
    const conversationText = conversations
      .map((msg: any) => `${msg.role}: ${msg.content || ''}`)
      .join('\n');
    const moodText = moods
      .map((m: any) => {
        const mood = m.mood || m.moodCategory || 'unspecified';
        const note = m.note ? `: ${m.note}` : '';
        const rating = m.rating ? ` (${m.rating}/10)` : '';
        return `${mood}${rating}${note}`;
      })
      .join(' | ');
    const exerciseText = exercises
      .map((e: any) => {
        const category = e.exercise?.category || 'exercise';
        const duration = e.duration ? ` ${Math.round(e.duration / 60)}min` : '';
        return `${category}${duration}`;
      })
      .join(', ');
    const inputData = `CONVERSATIONS:\n${conversationText}\n\nMOODS:\n${moodText}\n\nEXERCISES:\n${exerciseText}`;

    const payload: any = {
      model: config.model,
      stream: false,
      input: [{ role: 'user', content: inputData }],
    };
    if (config.source.startsWith('openai_prompt') && config.openaiPromptId) {
      payload.prompt = { id: config.openaiPromptId };
      if (
        config.source === 'openai_prompt_pinned' &&
        config.openaiPromptVersion
      ) {
        payload.prompt.version = String(config.openaiPromptVersion);
      }
    } else if (config.source === 'inline' && config.prompt) {
      payload.instructions = config.prompt;
    } else {
      throw new Error('Misconfigured summarization configuration');
    }
    if (config.temperature !== undefined)
      payload.temperature = config.temperature;
    if (config.maxTokens !== undefined)
      payload.max_output_tokens = config.maxTokens;
    if (config.topP !== undefined) payload.top_p = config.topP;

    // Call OpenAI from within this action
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OpenAI API key not configured');
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Responses API error ${response.status}: ${err}`);
    }
    const result = await response.json();
    console.log(
      'OpenAI Responses API result structure:',
      JSON.stringify(result, null, 2)
    );
    let summaryText = '';

    // Check for the new Responses API structure (output array with message objects)
    if (Array.isArray(result.output)) {
      // Look for a message type in the output array
      const messageOutput = result.output.find(
        (o: any) => o.type === 'message'
      );
      if (messageOutput?.content?.[0]?.text) {
        summaryText = messageOutput.content[0].text;
      } else if (messageOutput?.content?.[0]?.type === 'output_text') {
        summaryText = messageOutput.content[0].text || '';
      }
    }

    // Fallback to other possible formats
    if (!summaryText) {
      if (typeof result.output_text === 'string')
        summaryText = result.output_text;
      else if (typeof result.response?.output_text === 'string')
        summaryText = result.response.output_text;
      else if (result.choices?.[0]?.message?.content)
        summaryText = result.choices[0].message.content;
      else if (typeof result.content === 'string') summaryText = result.content;
      else if (result.response?.content) {
        summaryText =
          typeof result.response.content === 'string'
            ? result.response.content
            : result.response.content?.text || '';
      }
    }
    const finalSummary = (summaryText || '').trim();
    if (!finalSummary) {
      console.error('Failed to extract summary from result:', result);
      throw new Error('Empty summary returned from Responses API');
    }

    await ctx.runMutation(internal.personalization._insertUserSummary, {
      userId: user._id,
      weekStartDate: currentWeekStart,
      conversation: '',
      mood: '',
      exercise: '',
      summary: finalSummary,
    });

    return { status: 'created' as const };
  },
});

// Internal helpers exposed for actions
export const _getUserById = query({
  args: { userId: v.id('users') },
  returns: v.union(
    v.object({
      _id: v.id('users'),
      name: v.optional(v.string()),
      language: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return { _id: user._id, name: user.name, language: user.language };
  },
});

export const _getSummaryForWeek = query({
  args: { userId: v.id('users'), weekStartDate: v.number() },
  returns: v.union(v.object({ _id: v.id('userSummaries') }), v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query('userSummaries')
      .withIndex('by_user_week', (q: any) =>
        q.eq('userId', args.userId).eq('weekStartDate', args.weekStartDate)
      )
      .first();
    return doc ? { _id: doc._id } : null;
  },
});

export const _collectWeeklyData = query({
  args: { userId: v.id('users'), start: v.number(), end: v.number() },
  returns: v.object({
    conversations: v.array(
      v.object({
        role: v.union(v.literal('user'), v.literal('assistant')),
        content: v.string(),
        createdAt: v.number(),
      })
    ),
    moods: v.array(v.any()),
    exercises: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const [mainChats, ventChats, companionChats] = await Promise.all([
      ctx.db
        .query('mainChatMessages')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .filter((q: any) =>
          q.and(
            q.gte(q.field('createdAt'), args.start),
            q.lt(q.field('createdAt'), args.end)
          )
        )
        .order('asc')
        .collect(),
      ctx.db
        .query('ventChatMessages')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .filter((q: any) =>
          q.and(
            q.gte(q.field('createdAt'), args.start),
            q.lt(q.field('createdAt'), args.end)
          )
        )
        .order('asc')
        .collect(),
      ctx.db
        .query('companionChatMessages')
        .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
        .filter((q: any) =>
          q.and(
            q.gte(q.field('createdAt'), args.start),
            q.lt(q.field('createdAt'), args.end)
          )
        )
        .order('asc')
        .collect(),
    ]);
    const conversations = [...mainChats, ...ventChats, ...companionChats]
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m: any) => ({
        role: m.role,
        content: m.content || '',
        createdAt: m.createdAt,
      }));

    const moods = await ctx.db
      .query('moods')
      .withIndex('by_user_date', (q: any) => q.eq('userId', args.userId))
      .filter((q: any) =>
        q.and(
          q.gte(q.field('createdAt'), args.start),
          q.lt(q.field('createdAt'), args.end)
        )
      )
      .collect();

    const exercises = await ctx.db
      .query('userProgress')
      .withIndex('by_user', (q: any) => q.eq('userId', args.userId))
      .filter((q: any) =>
        q.and(
          q.gte(q.field('completedAt'), args.start),
          q.lt(q.field('completedAt'), args.end)
        )
      )
      .collect();

    return { conversations, moods, exercises };
  },
});

export const _getActiveUsers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id('users'),
      name: v.optional(v.string()),
      language: v.string(),
      lastActive: v.number(),
    })
  ),
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const users = await ctx.db
      .query('users')
      .withIndex('by_last_active' as any)
      .filter((q: any) => q.gte(q.field('lastActive'), thirtyDaysAgo))
      .collect();
    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      language: u.language,
      lastActive: u.lastActive,
    }));
  },
});

export const _insertUserSummary = internalMutation({
  args: {
    userId: v.id('users'),
    weekStartDate: v.number(),
    conversation: v.string(),
    mood: v.string(),
    exercise: v.string(),
    summary: v.string(),
  },
  returns: v.id('userSummaries'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('userSummaries', {
      userId: args.userId,
      weekStartDate: args.weekStartDate,
      conversationSummary: args.conversation,
      moodSummary: args.mood,
      exerciseSummary: args.exercise,
      summaryText: args.summary,
      createdAt: Date.now(),
    });
  },
});

// Helper function to get latest weekly summary
async function getLatestWeeklySummary(
  ctx: any,
  userId: Id<'users'>
): Promise<Doc<'userSummaries'> | null> {
  return await ctx.db
    .query('userSummaries')
    .withIndex('by_user_created', (q: any) => q.eq('userId', userId))
    .order('desc')
    .first();
}

// Helper function to format user context
interface FormatContextParams {
  user: UserContextInput['user'];
  level: 'full' | 'light' | 'none';
  todayMoods: any;
  todayExercises: any[];
  weeklySummary: Doc<'userSummaries'> | null;
  onboardingText?: string | null;
}

function formatUserContext(params: FormatContextParams): string {
  const {
    user,
    level,
    todayMoods,
    todayExercises,
    weeklySummary,
    onboardingText,
  } = params;
  const isArabic = user.language === 'ar';

  // Language-aware labels
  const labels = {
    nameLabel: isArabic ? 'الاسم' : 'Name',
    language: isArabic ? 'اللغة' : 'Language',
    today: isArabic ? 'اليوم' : 'Today',
    mood: isArabic ? 'المزاج' : 'Mood',
    exercises: isArabic ? 'التمارين' : 'Exercises',
    lastWeek: isArabic ? 'الأسبوع الماضي' : 'Last 7 days',
    onboarding: isArabic ? 'بيانات التعريف (الانضمام)' : 'Onboarding Profile',
    guidance: isArabic
      ? 'سياق خلفي: آخر ٧ أيام، مزاج اليوم، والتمارين الأخيرة. استخدمه لفهم الشخص بشكل أفضل.'
      : "Background context: past 7 days, today's mood, and recent exercises. Use to better understand the person.",
    noMood: isArabic ? 'لم يتم تسجيل المزاج' : 'No mood logged',
    noExercises: isArabic ? 'لا توجد تمارين' : 'No exercises',
  };

  let contextParts = ['--- BEGIN_USER_CONTEXT ---'];

  // Put guidance first so the model treats subsequent memory properly
  contextParts.push(labels.guidance);

  // Then add the user's name and language line
  contextParts.push(
    `${labels.nameLabel}: ${user.name || (isArabic ? 'المستخدم' : 'User')}, ${labels.language}: ${user.language}`
  );

  // Today's context (both full and light levels)
  const todayMoodText = formatTodayMood(todayMoods, labels);
  const todayExerciseText = formatTodayExercises(todayExercises, labels);
  contextParts.push(`${labels.today}: ${todayMoodText}, ${todayExerciseText}`);

  // Weekly/onboarding memory as background context across the session
  if (onboardingText && onboardingText.trim().length > 0) {
    const full = onboardingText.trim();
    const lines = full.split('\n').filter(Boolean);
    // First line under the "Onboarding Profile" label (age/gender/last month mood)
    const first = lines.shift();
    if (first) {
      const firstTrimmed = truncateToSentenceBoundary(
        first,
        WEEKLY_SUMMARY_MAX_CHARS
      );
      contextParts.push(`${labels.onboarding}: ${firstTrimmed}`);
    }
    // Then add remaining onboarding lines as their own labeled rows (Goals, Help areas, etc.)
    for (const ln of lines) {
      const lineTrimmed = truncateToSentenceBoundary(
        ln,
        WEEKLY_SUMMARY_MAX_CHARS
      );
      contextParts.push(lineTrimmed);
    }
  } else if (weeklySummary) {
    const weeklyText = formatWeeklySummary(weeklySummary, labels);
    if (weeklyText) {
      contextParts.push(`${labels.lastWeek}: ${weeklyText}`);
    }
  }

  contextParts.push('--- END_USER_CONTEXT ---');

  const contextText = contextParts.join('\n');

  // Ensure context doesn't exceed configured size (prefer sentence boundaries)
  if (contextText.length > USER_CONTEXT_MAX_CHARS) {
    const endMarker = '\n--- END_USER_CONTEXT ---';
    const withoutEnd = contextParts.slice(0, -1).join('\n');
    const truncatedBody = truncateToSentenceBoundary(
      withoutEnd,
      USER_CONTEXT_MAX_CHARS - endMarker.length
    );
    return truncatedBody + endMarker;
  }

  return contextText;
}

function formatTodayMood(todayMoods: any, labels: any): string {
  if (!todayMoods?.all?.length) {
    return labels.noMood;
  }

  const latestMood = todayMoods.all[todayMoods.all.length - 1];
  const moodText = latestMood.mood || latestMood.moodCategory || 'unknown';
  const rating = latestMood.rating ? `${latestMood.rating}/10` : '';
  const note = latestMood.note ? `"${latestMood.note.substring(0, 50)}"` : '';

  return `${labels.mood} ${moodText} ${rating} ${note}`.trim();
}

function formatTodayExercises(exercises: any[], labels: any): string {
  if (!exercises?.length) {
    return labels.noExercises;
  }

  const count = exercises.length;
  const categories = exercises
    .map((e) => e.exercise?.category)
    .filter(Boolean)
    .reduce((acc: Record<string, number>, cat: string) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

  const topCategory = Object.entries(categories).sort(
    ([, a], [, b]) => (b as number) - (a as number)
  )[0]?.[0];

  return `${labels.exercises}: ${count}${topCategory ? ` (${topCategory})` : ''}`;
}

// Build a concise onboarding profile paragraph using stored answers
function formatOnboardingProfileText(userDoc: any, language: string): string {
  if (!userDoc) return '';
  const isArabic = language === 'ar';
  const L = {
    age: isArabic ? 'العمر' : 'Age',
    gender: isArabic ? 'الجنس' : 'Gender',
    lastMonthMood: isArabic ? 'مزاج الشهر الماضي' : 'Last month mood',
    goals: isArabic ? 'الأهداف' : 'Goals',
    help: isArabic ? 'نقاط المساعدة' : 'Help areas',
    fears: isArabic ? 'المخاوف' : 'Fears',
    struggles: isArabic ? 'التحديات' : 'Struggles',
    self: isArabic ? 'الصورة الذاتية' : 'Self image',
    notes: isArabic ? 'ملاحظات' : 'Notes',
    none: isArabic ? 'لا شيء' : 'None',
  } as const;

  const parts: string[] = [];

  // Basic demographics and last-month mood
  const demoBits: string[] = [];
  if (userDoc.age) demoBits.push(`${L.age}: ${userDoc.age}`);
  if (userDoc.gender) demoBits.push(`${L.gender}: ${userDoc.gender}`);
  if (userDoc.moodLastMonth)
    demoBits.push(`${L.lastMonthMood}: ${userDoc.moodLastMonth}`);
  if (demoBits.length) parts.push(demoBits.join(' · '));

  // Arrays
  const joinOrNone = (arr?: string[]) =>
    Array.isArray(arr) && arr.length ? arr.join(', ') : L.none;
  if (userDoc.goals) parts.push(`${L.goals}: ${joinOrNone(userDoc.goals)}`);
  if (userDoc.helpAreas)
    parts.push(`${L.help}: ${joinOrNone(userDoc.helpAreas)}`);
  if (userDoc.fears) parts.push(`${L.fears}: ${joinOrNone(userDoc.fears)}`);
  if (userDoc.struggles)
    parts.push(`${L.struggles}: ${joinOrNone(userDoc.struggles)}`);
  if (userDoc.selfImage)
    parts.push(`${L.self}: ${joinOrNone(userDoc.selfImage)}`);

  // Notes
  if (
    typeof userDoc.additionalNotes === 'string' &&
    userDoc.additionalNotes.trim()
  ) {
    const note = userDoc.additionalNotes.trim();
    parts.push(`${L.notes}: ${truncateToSentenceBoundary(note, 600)}`);
  }

  return parts.join('\n');
}

function formatWeeklySummary(
  summary: Doc<'userSummaries'>,
  labels: any
): string {
  // Prefer unified weekly paragraph if available
  if (summary.summaryText && summary.summaryText.trim().length > 0) {
    return truncateToSentenceBoundary(
      summary.summaryText.trim(),
      WEEKLY_SUMMARY_MAX_CHARS
    );
  }

  // Fallback: combine components
  const parts: string[] = [];
  if (summary.moodSummary) parts.push(summary.moodSummary);
  if (summary.conversationSummary) parts.push(summary.conversationSummary);
  if (summary.exerciseSummary) parts.push(summary.exerciseSummary);
  const joined = parts.join('. ');
  return truncateToSentenceBoundary(joined, WEEKLY_SUMMARY_MAX_CHARS);
}

// Truncate a block of text to maxLen preferring nearest sentence or newline boundary
function truncateToSentenceBoundary(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  const hardLimit = Math.max(0, maxLen - 3); // reserve for ellipsis
  const slice = text.slice(0, hardLimit);

  // Prefer sentence-ending punctuation: . ! ? Arabic question mark (\u061F), Urdu full stop (\u06D4), ellipsis (\u2026)
  const boundaryRegex = /[\.!?\u061F\u06D4\u2026]/g;
  let lastBoundary = -1;
  let match: RegExpExecArray | null;
  while ((match = boundaryRegex.exec(slice)) !== null) {
    lastBoundary = match.index;
  }

  if (lastBoundary >= 0 && lastBoundary > hardLimit * 0.5) {
    return slice.slice(0, lastBoundary + 1) + '...';
  }

  // Otherwise prefer last newline
  const lastNewline = slice.lastIndexOf('\n');
  if (lastNewline >= 0 && lastNewline > hardLimit * 0.4) {
    return slice.slice(0, lastNewline) + '\n...';
  }

  return slice + '...';
}

// Generate weekly summary for a user
async function generateUserWeeklySummary(
  ctx: any,
  user: Doc<'users'>,
  weekStart: number,
  weekEnd: number
) {
  try {
    // Gather week's data
    const [conversations, moods, exercises] = await Promise.all([
      // Get conversations from the week
      gatherWeeklyConversations(ctx, user._id, weekStart, weekEnd),
      // Get mood entries
      ctx.db
        .query('moods')
        .withIndex('by_user_date', (q: any) => q.eq('userId', user._id))
        .filter((q: any) =>
          q.and(
            q.gte(q.field('createdAt'), weekStart),
            q.lt(q.field('createdAt'), weekEnd)
          )
        )
        .collect(),
      // Get exercise progress
      ctx.db
        .query('userProgress')
        .withIndex('by_user', (q: any) => q.eq('userId', user._id))
        .filter((q: any) =>
          q.and(
            q.gte(q.field('completedAt'), weekStart),
            q.lt(q.field('completedAt'), weekEnd)
          )
        )
        .collect(),
    ]);

    if (
      conversations.length === 0 &&
      moods.length === 0 &&
      exercises.length === 0
    ) {
      return null; // No data to summarize
    }

    // Generate AI summary using OpenAI
    const summary = await generateAISummary(ctx, {
      conversations,
      moods,
      exercises,
      user,
    });

    return summary;
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return null;
  }
}

// Gather conversations from all chat types for the week
async function gatherWeeklyConversations(
  ctx: any,
  userId: Id<'users'>,
  weekStart: number,
  weekEnd: number
) {
  const [mainChats, ventChats, companionChats] = await Promise.all([
    ctx.db
      .query('mainChatMessages')
      .withIndex('by_user', (q: any) => q.eq('userId', userId))
      .filter((q: any) =>
        q.and(
          q.gte(q.field('createdAt'), weekStart),
          q.lt(q.field('createdAt'), weekEnd)
        )
      )
      .order('asc')
      .collect(),
    ctx.db
      .query('ventChatMessages')
      .withIndex('by_user', (q: any) => q.eq('userId', userId))
      .filter((q: any) =>
        q.and(
          q.gte(q.field('createdAt'), weekStart),
          q.lt(q.field('createdAt'), weekEnd)
        )
      )
      .order('asc')
      .collect(),
    ctx.db
      .query('companionChatMessages')
      .withIndex('by_user', (q: any) => q.eq('userId', userId))
      .filter((q: any) =>
        q.and(
          q.gte(q.field('createdAt'), weekStart),
          q.lt(q.field('createdAt'), weekEnd)
        )
      )
      .order('asc')
      .collect(),
  ]);

  return [...mainChats, ...ventChats, ...companionChats].sort(
    (a, b) => a.createdAt - b.createdAt
  );
}

// Generate AI summary using OpenAI
async function generateAISummary(
  ctx: any,
  data: {
    conversations: any[];
    moods: any[];
    exercises: any[];
    user: Doc<'users'>;
  }
): Promise<AISummaryResult> {
  const { conversations, moods, exercises } = data;

  // Get summarization configuration with caching
  let config: any = null;
  const cacheKey = 'summarization_config';
  const now = Date.now();
  const cached = configCache.get(cacheKey);

  if (cached && cached.expires > now) {
    config = cached.data;
  } else {
    try {
      config = await ctx.runQuery(
        api.summarizationConfig.getActiveSummarizationConfig
      );
      configCache.set(cacheKey, {
        data: config,
        expires: now + CONFIG_CACHE_TTL_MS,
      });
    } catch (error) {
      console.error('Failed to fetch summarization config:', error);
    }
  }

  // Require DB configuration (no fallback)
  if (!config) {
    throw new Error('No active summarization configuration found');
  }
  const activeConfig = config;
  console.log('Using summarization config:', {
    source: activeConfig.source,
    model: activeConfig.model,
    hasPromptId: !!activeConfig.openaiPromptId,
  });

  // Prepare full input data for OpenAI - send more complete context
  const conversationText = conversations
    .map((msg) => `${msg.role}: ${msg.content || ''}`)
    .join('\n');

  const moodText = moods
    .map((m) => {
      const mood = m.mood || m.moodCategory || 'unspecified';
      const note = m.note ? `: ${m.note}` : '';
      const rating = m.rating ? ` (${m.rating}/10)` : '';
      return `${mood}${rating}${note}`;
    })
    .join(' | ');

  const exerciseText = exercises
    .map((e) => {
      const category = e.exercise?.category || 'exercise';
      const duration = e.duration ? ` ${Math.round(e.duration / 60)}min` : '';
      return `${category}${duration}`;
    })
    .join(', ');

  // Build the input data for the OpenAI prompt (configured in OpenAI Playground)
  const inputData = `CONVERSATIONS:
${conversationText}

MOODS:
${moodText}

EXERCISES:
${exerciseText}`;

  try {
    // Use OpenAI Responses API with DB configuration
    const responsesPayload: any = {
      model: activeConfig.model,
      stream: false,
      input: [{ role: 'user', content: inputData }], // Use the prepared input data
    };

    if (
      activeConfig.source.startsWith('openai_prompt') &&
      activeConfig.openaiPromptId
    ) {
      // Use the OpenAI prompt ID (configured in OpenAI Playground)
      responsesPayload.prompt = { id: activeConfig.openaiPromptId };
      if (
        activeConfig.source === 'openai_prompt_pinned' &&
        activeConfig.openaiPromptVersion
      ) {
        responsesPayload.prompt.version = String(
          activeConfig.openaiPromptVersion
        );
      }
      // Don't add any instructions - let the OpenAI prompt handle everything
    } else if (activeConfig.source === 'inline' && activeConfig.prompt) {
      responsesPayload.instructions = activeConfig.prompt;
    } else {
      // Misconfigured config; enforce failure for visibility
      throw new Error('Misconfigured summarization configuration');
    }

    if (activeConfig.temperature !== undefined) {
      responsesPayload.temperature = activeConfig.temperature;
    }
    if (activeConfig.maxTokens !== undefined) {
      responsesPayload.max_output_tokens = activeConfig.maxTokens;
    }
    if (activeConfig.topP !== undefined) {
      responsesPayload.top_p = activeConfig.topP;
    }
    // Don't set response_format - we want plain text, not JSON

    console.log('Calling OpenAI Responses API via action');
    const actionResult: { summary: string } = await ctx.runAction(
      internal.personalization.summarizeWithOpenAI,
      {
        payload: responsesPayload,
      }
    );
    const finalSummary: string = (actionResult?.summary || '').trim();

    if (finalSummary) {
      return {
        summary: finalSummary, // This is the main weekly summary paragraph
        mood: '', // These can be empty since we only care about the main summary
        conversation: '',
        exercise: '',
      };
    } else {
      throw new Error('Empty summary returned from Responses API');
    }
  } catch (error) {
    console.error('Error calling OpenAI for summary:', error);
    throw error;
  }
}

// Note: We no longer use JSON parsing since we want plain text summaries
// Keeping this function in case we need it for backwards compatibility

// Build a single readable paragraph from counts (fallback)
function buildCombinedSummary(
  moods: any[],
  conversations: any[],
  exercises: any[]
): string {
  const moodPart =
    moods.length > 0 ? `${moods.length} mood entries` : 'no mood data';
  const convPart =
    conversations.length > 0
      ? `${conversations.length} chat messages`
      : 'no conversations';
  const exPart =
    exercises.length > 0 ? `${exercises.length} exercises` : 'no exercises';
  const text = `Weekly overview: ${convPart}, ${moodPart}, and ${exPart}.`;
  return text;
}

// Internal action: perform OpenAI Responses API call (allowed to use fetch)
export const summarizeWithOpenAI = internalAction({
  args: {
    payload: v.any(),
  },
  returns: v.object({ summary: v.string() }),
  handler: async (_ctx, args) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args.payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `OpenAI Responses API error ${response.status}: ${errorText}`
      );
    }

    const result = await response.json();
    console.log('Summarize API result:', JSON.stringify(result, null, 2));
    let summaryText = '';

    // Check for the new Responses API structure
    if (Array.isArray(result.output)) {
      const messageOutput = result.output.find(
        (o: any) => o.type === 'message'
      );
      if (messageOutput?.content?.[0]?.text) {
        summaryText = messageOutput.content[0].text;
      }
    }

    // Fallback to other formats
    if (!summaryText) {
      if (typeof result.output_text === 'string') {
        summaryText = result.output_text;
      } else if (typeof result.response?.output_text === 'string') {
        summaryText = result.response.output_text;
      } else if (result.choices?.[0]?.message?.content) {
        summaryText = result.choices[0].message.content;
      } else if (typeof result.content === 'string') {
        summaryText = result.content;
      }
    }

    const finalSummary = (summaryText || '').trim();
    if (!finalSummary) {
      console.error('summarizeWithOpenAI failed to extract from:', result);
      throw new Error('Empty summary returned from Responses API');
    }
    return { summary: finalSummary };
  },
});
