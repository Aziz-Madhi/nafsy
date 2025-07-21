# Separate Chat Histories Database Design

## 🎯 **Requirements**

- **Vent History**: Floating chat conversations (quick emotional vents)
- **Main History**: Full chat conversations (structured therapy sessions)
- **Complete Separation**: Different database tables for each chat type
- **History UI**: User can browse both histories separately

## 🗄️ **Database Schema Design**

### **Option 1: Separate Tables (Recommended)**

```ts
// convex/schema.ts

// Main chat conversations
mainChatMessages: defineTable({
  userId: v.id("users"),
  content: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),
  createdAt: v.number(),
  sessionId: v.optional(v.string()), // For grouping conversations
}).index("by_user", ["userId"]).index("by_session", ["sessionId"]),

// Vent chat conversations (floating chat)
ventChatMessages: defineTable({
  userId: v.id("users"),
  content: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),
  createdAt: v.number(),
  ventSessionId: v.optional(v.string()), // For grouping quick vents
}).index("by_user", ["userId"]).index("by_vent_session", ["ventSessionId"]),

// Chat sessions metadata
chatSessions: defineTable({
  userId: v.id("users"),
  type: v.union(v.literal("main"), v.literal("vent")),
  title: v.string(), // "Morning Check-in", "Quick Vent", etc.
  startedAt: v.number(),
  lastMessageAt: v.number(),
  messageCount: v.number(),
}).index("by_user_type", ["userId", "type"]),
```

### **Option 2: Single Table with Type Field**

```ts
// Alternative approach - single table
messages: defineTable({
  userId: v.id("users"),
  content: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),
  chatType: v.union(v.literal("main"), v.literal("vent")),
  sessionId: v.string(),
  createdAt: v.number(),
}).index("by_user_type", ["userId", "chatType"])
  .index("by_session", ["sessionId"]),
```

**Recommendation: Use Option 1 (Separate Tables)** for:

- Clear data separation
- Better query performance
- Easier to manage different features per chat type
- Future scalability

## 🔌 **Required Convex API Endpoints**

### **Main Chat APIs**

```ts
// convex/mainChat.ts
export const getMainChatMessages = query({
  args: {
    userId: v.id('users'),
    sessionId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('mainChatMessages')
      .filter((q) => q.eq(q.field('userId'), args.userId));

    if (args.sessionId) {
      query = query.filter((q) => q.eq(q.field('sessionId'), args.sessionId));
    }

    return await query.order('desc').take(args.limit || 50);
  },
});

export const sendMainChatMessage = mutation({
  args: {
    userId: v.id('users'),
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create or update session
    const sessionId = args.sessionId || `main_${Date.now()}`;

    // Insert message
    const messageId = await ctx.db.insert('mainChatMessages', {
      userId: args.userId,
      content: args.content,
      role: args.role,
      sessionId,
      createdAt: Date.now(),
    });

    // Update session metadata
    await updateChatSession(ctx, args.userId, 'main', sessionId);

    return messageId;
  },
});

export const getMainChatSessions = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('chatSessions')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('type'), 'main')
        )
      )
      .order('desc')
      .take(20);
  },
});
```

### **Vent Chat APIs**

```ts
// convex/ventChat.ts
export const getVentChatMessages = query({
  args: {
    userId: v.id('users'),
    ventSessionId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('ventChatMessages')
      .filter((q) => q.eq(q.field('userId'), args.userId));

    if (args.ventSessionId) {
      query = query.filter((q) =>
        q.eq(q.field('ventSessionId'), args.ventSessionId)
      );
    }

    return await query.order('desc').take(args.limit || 20);
  },
});

export const sendVentChatMessage = mutation({
  args: {
    userId: v.id('users'),
    content: v.string(),
    role: v.union(v.literal('user'), v.literal('assistant')),
    ventSessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create or update vent session
    const ventSessionId = args.ventSessionId || `vent_${Date.now()}`;

    // Insert message
    const messageId = await ctx.db.insert('ventChatMessages', {
      userId: args.userId,
      content: args.content,
      role: args.role,
      ventSessionId,
      createdAt: Date.now(),
    });

    // Update session metadata
    await updateChatSession(ctx, args.userId, 'vent', ventSessionId);

    return messageId;
  },
});

export const getVentChatSessions = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('chatSessions')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.eq(q.field('type'), 'vent')
        )
      )
      .order('desc')
      .take(20);
  },
});

export const getCurrentVentSession = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    // Get most recent vent messages (for floating chat)
    return await ctx.db
      .query('ventChatMessages')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .order('desc')
      .take(3); // Last 3 messages for floating chat
  },
});
```

### **Shared Utilities**

```ts
// convex/chatUtils.ts
export async function updateChatSession(
  ctx: any,
  userId: string,
  type: 'main' | 'vent',
  sessionId: string
) {
  const existing = await ctx.db
    .query('chatSessions')
    .filter((q) => q.eq(q.field('sessionId'), sessionId))
    .first();

  if (existing) {
    await ctx.db.patch(existing._id, {
      lastMessageAt: Date.now(),
      messageCount: existing.messageCount + 1,
    });
  } else {
    await ctx.db.insert('chatSessions', {
      userId,
      type,
      sessionId,
      title: type === 'main' ? 'Chat Session' : 'Quick Vent',
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 1,
    });
  }
}
```

## 🎨 **UI Implementation Plan**

### **Chat History Screen Layout**

```
┌─────────────────────────────┐
│         Chat History        │
├─────────────────────────────┤
│  [Main Chat] [Vent History] │ <- Tabs
├─────────────────────────────┤
│ Main Chat Tab:              │
│ ┌─────────────────────────┐ │
│ │ 📝 Morning Session      │ │
│ │ 💭 Evening Check-in     │ │
│ │ 🗣️ Anxiety Discussion   │ │
│ └─────────────────────────┘ │
│                             │
│ Vent History Tab:           │
│ ┌─────────────────────────┐ │
│ │ 😤 Quick Stress Relief  │ │
│ │ 💔 Feeling Overwhelmed  │ │
│ │ 😟 Work Anxiety         │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

## 🔄 **Migration Strategy**

1. **Create new schema** with separate tables
2. **Migrate existing messages** to appropriate table based on context
3. **Update FloatingChat** to use vent endpoints
4. **Update MainChat** to use main endpoints
5. **Create ChatHistory** screen with tabs
6. **Test both chat flows** separately

## 📊 **Benefits of Separation**

- **Clear Purpose**: Main chat for therapy, vent for quick emotional release
- **Different Features**: Can add vent-specific features (tags, quick responses)
- **Better Analytics**: Track usage patterns separately
- **User Experience**: Clear mental model for different conversation types
- **Performance**: Optimized queries per chat type

This design gives you complete separation while maintaining optimal performance! 🚀
