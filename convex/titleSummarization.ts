import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

/**
 * Internal action: Call OpenAI Responses API to generate a concise title
 * Uses only model + OpenAI Prompt ID configured in DB; no inline fallback.
 */
// Pruned unused internal actions/mutations. Only keep the write helper used by HTTP route.

// Internal mutation to apply session title
export const _applySessionTitle = internalMutation({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    chatType: v.union(
      v.literal('main'),
      v.literal('companion'),
      v.literal('vent')
    ),
    title: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sessionsTable =
      args.chatType === 'main'
        ? 'chatSessions'
        : args.chatType === 'companion'
          ? 'companionChatSessions'
          : 'ventChatSessions';
    const s: any = await ctx.db
      .query(sessionsTable as any)
      .withIndex('by_session_id', (q: any) => q.eq('sessionId', args.sessionId))
      .first();
    if (!s || s.userId !== args.userId) return null;
    // Avoid overwriting customized titles
    const currentTitle: string = String(s.title || '');
    const tl = currentTitle.toLowerCase();
    const looksDefault =
      tl === '' ||
      tl.includes('new chat session') ||
      tl.includes('chat session') ||
      tl.includes('therapy session') ||
      tl.includes('quick vent session') ||
      tl.startsWith('check-in');
    if (!looksDefault) return null;
    try {
      await ctx.db.patch(s._id, { title: args.title });
    } catch (e) {
      // Best-effort: ignore conflicts
    }
    return null;
  },
});
