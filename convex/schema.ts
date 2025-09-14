import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    language: v.string(), // 'en' or 'ar'
    age: v.optional(v.number()),
    gender: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    moodLastMonth: v.optional(v.string()),
    goals: v.optional(v.array(v.string())),
    selfImage: v.optional(v.array(v.string())),
    helpAreas: v.optional(v.array(v.string())),
    fears: v.optional(v.array(v.string())),
    struggles: v.optional(v.array(v.string())),
    additionalNotes: v.optional(v.string()),
    createdAt: v.number(),
    lastActive: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email'])
    .index('by_last_active', ['lastActive']),

  // Legacy messages table (can be removed after migration)
  messages: defineTable({
    userId: v.id('users'),
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    createdAt: v.number(),
  }).index('by_user', ['userId', 'createdAt']),

  // Main chat conversations (structured therapy sessions)
  mainChatMessages: defineTable({
    userId: v.id('users'),
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    sessionId: v.string(),
    createdAt: v.number(),
    requestId: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_session', ['sessionId'])
    .index('by_user_session', ['userId', 'sessionId']),

  // Vent chat messages (quick emotional releases)
  ventChatMessages: defineTable({
    userId: v.id('users'),
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    sessionId: v.optional(v.string()), // Optional for backwards compatibility
    ventSessionId: v.optional(v.string()), // Legacy field
    createdAt: v.number(),
    // Align with other chat tables for idempotency/deduplication
    requestId: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_session', ['sessionId'])
    .index('by_user_session', ['userId', 'sessionId']),

  // Chat sessions metadata (for main chat only)
  chatSessions: defineTable({
    userId: v.id('users'),
    sessionId: v.string(), // Unique identifier for the session
    title: v.string(), // Human-readable title
    type: v.optional(v.string()), // Optional field for existing data
    startedAt: v.number(),
    lastMessageAt: v.number(),
    messageCount: v.number(),
    // OpenAI Conversations API conversation id for this session
    openaiConversationId: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_session_id', ['sessionId']),

  // Vent chat sessions metadata
  ventChatSessions: defineTable({
    userId: v.id('users'),
    sessionId: v.string(), // Unique identifier for the vent session
    title: v.string(), // Human-readable title
    startedAt: v.number(),
    lastMessageAt: v.number(),
    messageCount: v.number(),
    // OpenAI Conversations API conversation id for this session
    openaiConversationId: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_session_id', ['sessionId']),

  moods: defineTable({
    userId: v.id('users'),
    // Keep old field for backward compatibility; new entries should still populate it
    mood: v.optional(
      v.union(
        v.literal('happy'),
        v.literal('neutral'),
        v.literal('sad'),
        v.literal('anxious'),
        v.literal('angry')
      )
    ),
    // New fields for 1-10 rating system
    rating: v.optional(v.number()), // 1-10 scale
    moodCategory: v.optional(v.string()), // derived from rating (e.g., happy/sad/...)
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // Contributing factors/sub-emotions
    // Time of day for dual mood tracking (morning/evening)
    timeOfDay: v.optional(v.union(v.literal('morning'), v.literal('evening'))),
    createdAt: v.number(),
  })
    .index('by_user_date', ['userId', 'createdAt'])
    .index('by_mood', ['mood']),

  // AI System Prompts (editable in cloud, supports OpenAI Prompt IDs)
  aiPrompts: defineTable({
    personality: v.union(
      v.literal('coach'),
      v.literal('companion'),
      v.literal('vent')
    ),

    // Source of the prompt
    source: v.union(
      v.literal('openai_prompt_latest'), // Use latest published version
      v.literal('openai_prompt_pinned'), // Use specific pinned version
      v.literal('inline') // Use inline content
    ),

    // OpenAI Prompt ID (e.g., "pmpt_...")
    openaiPromptId: v.optional(v.string()),

    // Version number for pinned prompts
    openaiPromptVersion: v.optional(v.number()),

    // Inline prompt content (fallback or when source is 'inline')
    prompt: v.optional(v.string()),

    // Model configuration
    model: v.optional(v.string()), // e.g., "gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"
    temperature: v.optional(v.number()), // 0.0 to 2.0
    maxTokens: v.optional(v.number()), // Optional token limit
    topP: v.optional(v.number()), // Optional top-p parameter (0.0 to 1.0)

    // Metadata
    active: v.boolean(),
    version: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index('by_personality', ['personality', 'active']),

  // Summarization Configuration (configurable model settings for weekly summaries)
  summarizationConfig: defineTable({
    // Source of the prompt (same as aiPrompts)
    source: v.union(
      v.literal('openai_prompt_latest'), // Use latest published version
      v.literal('openai_prompt_pinned'), // Use specific pinned version
      v.literal('inline') // Use inline content
    ),

    // OpenAI Prompt ID (e.g., "pmpt_...")
    openaiPromptId: v.optional(v.string()),

    // Version number for pinned prompts
    openaiPromptVersion: v.optional(v.number()),

    // Inline prompt content (fallback or when source is 'inline')
    prompt: v.optional(v.string()),

    // Model configuration
    model: v.string(), // e.g., "gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"
    temperature: v.number(), // 0.0 to 2.0
    maxTokens: v.number(), // Token limit
    topP: v.optional(v.number()), // Optional top-p parameter (0.0 to 1.0)

    // Response format settings
    responseFormat: v.optional(
      v.object({
        type: v.union(v.literal('text'), v.literal('json_object')),
      })
    ),

    // Metadata
    active: v.boolean(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  })
    .index('by_active', ['active'])
    .index('by_version', ['version']),

  // Chat Title Summarization Configuration (model + OpenAI Prompt only)
  titleSummarizationConfig: defineTable({
    // Only support OpenAI Prompt sources; no inline fallback by design
    source: v.union(
      v.literal('openai_prompt_latest'),
      v.literal('openai_prompt_pinned')
    ),
    // Required OpenAI Prompt ID (pmpt_...)
    openaiPromptId: v.string(),
    // Optional pinned version
    openaiPromptVersion: v.optional(v.number()),
    // Required model (e.g., gpt-4o-mini)
    model: v.string(),

    // Metadata
    active: v.boolean(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index('by_active', ['active']),

  // Voice Realtime Configuration (separate from chat personalities)
  voiceRealtimeConfig: defineTable({
    // Prompt source (OpenAI Prompt IDs only; no inline content)
    source: v.union(
      v.literal('openai_prompt_latest'),
      v.literal('openai_prompt_pinned')
    ),
    // OpenAI Prompt ID (pmpt_...)
    openaiPromptId: v.optional(v.string()),
    // Optional pinned version
    openaiPromptVersion: v.optional(v.number()),
    // Realtime model for voice (e.g., 'gpt-realtime')
    model: v.string(),
    // Optional generation knobs
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    topP: v.optional(v.number()),
    // Optional default voice name (e.g., 'marin', 'verse'); env can override
    defaultVoice: v.optional(v.string()),

    // Metadata
    active: v.boolean(),
    version: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index('by_active', ['active']),

  exercises: defineTable({
    title: v.string(),
    titleAr: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    category: v.union(
      v.literal('breathing'),
      v.literal('mindfulness'),
      v.literal('journaling'),
      v.literal('movement'),
      v.literal('relaxation'),
      v.literal('reminders')
    ),
    duration: v.number(), // in minutes
    difficulty: v.union(
      v.literal('beginner'),
      v.literal('intermediate'),
      v.literal('advanced')
    ),
    imageUrl: v.optional(v.string()),
    // Keys of the audio objects stored in Cloudflare R2
    audioKey: v.optional(v.string()), // English (back-compat)
    audioKeyAr: v.optional(v.string()), // Arabic
    instructions: v.array(v.string()),
    instructionsAr: v.array(v.string()),
  }).index('by_category', ['category']),

  userProgress: defineTable({
    userId: v.id('users'),
    exerciseId: v.id('exercises'),
    completedAt: v.number(),
    duration: v.number(), // actual time spent in minutes
    feedback: v.optional(v.string()),
  })
    .index('by_user', ['userId', 'completedAt'])
    .index('by_exercise', ['exerciseId', 'completedAt']),

  // Companion chat messages (friendly daily check-ins)
  companionChatMessages: defineTable({
    userId: v.id('users'),
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    sessionId: v.string(),
    createdAt: v.number(),
    requestId: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_session', ['sessionId'])
    .index('by_user_session', ['userId', 'sessionId']),

  // Companion chat sessions metadata
  companionChatSessions: defineTable({
    userId: v.id('users'),
    sessionId: v.string(),
    title: v.string(),
    startedAt: v.number(),
    lastMessageAt: v.number(),
    messageCount: v.number(),
    // OpenAI Conversations API conversation id for this session
    openaiConversationId: v.optional(v.string()),
  })
    .index('by_user', ['userId'])
    .index('by_session_id', ['sessionId']),

  // Rate limiting store (DB-backed windowed counters)
  rateLimits: defineTable({
    key: v.string(), // e.g., "auth:login:<clerkId>" or "users:create:<clerkId>"
    windowStart: v.number(), // epoch ms rounded to the start of the window
    count: v.number(),
  }).index('by_key_window', ['key', 'windowStart']),

  // Basic AI telemetry for responses
  aiTelemetry: defineTable({
    userId: v.id('users'),
    sessionId: v.string(),
    chatType: v.union(
      v.literal('main'),
      v.literal('companion'),
      v.literal('vent')
    ),
    provider: v.string(), // e.g., 'openai'
    model: v.string(),
    requestId: v.optional(v.string()),
    startedAt: v.number(),
    finishedAt: v.number(),
    durationMs: v.number(),
    contentLength: v.number(),
    success: v.boolean(),
    createdAt: v.number(),
  })
    .index('by_user_time', ['userId', 'startedAt'])
    .index('by_session', ['sessionId']),

  // User weekly summaries for personalization
  userSummaries: defineTable({
    userId: v.id('users'),
    weekStartDate: v.number(), // Sunday 00:00 UTC epoch timestamp
    conversationSummary: v.string(), // AI-generated summary of conversations
    moodSummary: v.string(), // Summary of mood patterns
    exerciseSummary: v.string(), // Summary of exercise habits
    summaryText: v.optional(v.string()), // Combined weekly summary paragraph
    createdAt: v.number(),
  })
    .index('by_user_week', ['userId', 'weekStartDate'])
    .index('by_user_created', ['userId', 'createdAt']),

  // Global top-ups for chat messages (applies to all users within the window)
  globalTopups: defineTable({
    windowStart: v.number(), // epoch ms for start of current window (weekly)
    remaining: v.number(),
  }).index('by_window', ['windowStart']),
});
