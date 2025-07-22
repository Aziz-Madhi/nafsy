import { v } from 'convex/values';
import type { MutationCtx, QueryCtx } from './_generated/server';
import type { Id } from './_generated/dataModel';

// Shared utility function for updating chat session metadata
export async function updateChatSession(
  ctx: MutationCtx,
  userId: Id<'users'>,
  sessionId: string
) {
  const existing = await ctx.db
    .query('chatSessions')
    .filter((q: any) => q.eq(q.field('sessionId'), sessionId))
    .first();

  if (existing) {
    // Update existing session
    await ctx.db.patch(existing._id, {
      lastMessageAt: Date.now(),
      messageCount: existing.messageCount + 1,
    });
  } else {
    // Create new session
    const title = `Chat Session ${new Date().toLocaleDateString()}`;

    await ctx.db.insert('chatSessions', {
      userId,
      sessionId,
      title,
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 1,
    });
  }
}

// Generate session titles based on content
export function generateSessionTitle(firstMessage?: string): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  // Generate main chat titles
  if (firstMessage) {
    const message = firstMessage.toLowerCase();
    if (message.includes('morning') || message.includes('day')) {
      return `🌅 ${dateStr} Morning Check-in`;
    }
    if (message.includes('evening') || message.includes('night')) {
      return `🌙 ${dateStr} Evening Session`;
    }
    if (message.includes('therapy') || message.includes('session')) {
      return `🗣️ ${dateStr} Therapy Session`;
    }
  }
  return `💬 ${dateStr} Chat Session`;
}
