import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    language: v.string(), // 'en' or 'ar'
    createdAt: v.number(),
    lastActive: v.number(),
  })
    .index('by_clerk_id', ['clerkId'])
    .index('by_email', ['email']),

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
  })
    .index('by_user', ['userId'])
    .index('by_session_id', ['sessionId']),

  moods: defineTable({
    userId: v.id('users'),
    mood: v.union(
      v.literal('happy'),
      v.literal('neutral'),
      v.literal('sad'),
      v.literal('anxious'),
      v.literal('angry')
    ),
    note: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // Contributing factors/sub-emotions
    createdAt: v.number(),
  })
    .index('by_user_date', ['userId', 'createdAt'])
    .index('by_mood', ['mood']),

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
      v.literal('relaxation')
    ),
    duration: v.number(), // in minutes
    difficulty: v.union(
      v.literal('beginner'),
      v.literal('intermediate'),
      v.literal('advanced')
    ),
    imageUrl: v.optional(v.string()),
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

  // Rate limiting store (DB-backed windowed counters)
  rateLimits: defineTable({
    key: v.string(), // e.g., "auth:login:<clerkId>" or "users:create:<clerkId>"
    windowStart: v.number(), // epoch ms rounded to the start of the window
    count: v.number(),
  }).index('by_key_window', ['key', 'windowStart']),
});
