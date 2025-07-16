import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Shared utility function for updating chat session metadata
export async function updateChatSession(
  ctx: MutationCtx,
  userId: Id<"users">,
  type: "main" | "vent",
  sessionId: string
) {
  const existing = await ctx.db
    .query("chatSessions")
    .filter((q: any) => q.eq(q.field("sessionId"), sessionId))
    .first();

  if (existing) {
    // Update existing session
    await ctx.db.patch(existing._id, {
      lastMessageAt: Date.now(),
      messageCount: existing.messageCount + 1,
    });
  } else {
    // Create new session
    const title = type === "main" 
      ? `Chat Session ${new Date().toLocaleDateString()}`
      : `Quick Vent ${new Date().toLocaleTimeString()}`;
      
    await ctx.db.insert("chatSessions", {
      userId,
      type,
      sessionId,
      title,
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 1,
    });
  }
}

// Generate session titles based on content
export function generateSessionTitle(
  type: "main" | "vent",
  firstMessage?: string
): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const dateStr = now.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });

  if (type === "vent") {
    // Generate vent titles based on common emotions/themes
    if (firstMessage) {
      const message = firstMessage.toLowerCase();
      if (message.includes('stress') || message.includes('overwhelm')) {
        return `😤 Stress Relief - ${timeStr}`;
      }
      if (message.includes('anxious') || message.includes('anxiety')) {
        return `😟 Anxiety Vent - ${timeStr}`;
      }
      if (message.includes('sad') || message.includes('down')) {
        return `😔 Feeling Down - ${timeStr}`;
      }
      if (message.includes('angry') || message.includes('frustrated')) {
        return `😠 Frustration - ${timeStr}`;
      }
      if (message.includes('work') || message.includes('job')) {
        return `💼 Work Stress - ${timeStr}`;
      }
    }
    return `💭 Quick Vent - ${timeStr}`;
  } else {
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
}