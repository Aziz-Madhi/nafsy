import { v } from 'convex/values';
import { internalMutation, internalAction } from './_generated/server';
import { api, internal } from './_generated/api';
import { Id } from './_generated/dataModel';

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

// Internal action: generate title with OpenAI Responses API and apply it
export const generateAndApplyTitle = internalAction({
  args: {
    userId: v.id('users'),
    sessionId: v.string(),
    chatType: v.union(v.literal('main'), v.literal('companion'), v.literal('vent')),
  },
  returns: v.union(v.object({ title: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const cors = {}; // not used here
    // Validate user and session
    const user = await ctx.runQuery(api.personalization._getUserById, {
      userId: args.userId as Id<'users'>,
    });
    if (!user) return null;

    // Fetch active title summarization config
    const config = await ctx.runQuery(
      api.titleSummarizationConfig.getActiveTitleSummarizationConfig,
      {}
    );
    if (!config) return null;

    // Gather first three messages for the session
    const serverMessages = await ctx.runQuery(internal.chat._getMessagesForSession, {
      userId: args.userId as Id<'users'>,
      type: (args.chatType as any),
      sessionId: args.sessionId,
      limit: 50,
    });
    const asc = [...serverMessages].sort((a, b) => a.createdAt - b.createdAt);
    const firstThree = asc.slice(0, 3).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content || '',
    }));
    if (firstThree.length < 3) return null;

    // Build OpenAI Responses payload
    const inputText = firstThree
      .map((m, i) => `${i + 1}. ${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');
    const payload: any = {
      model: config.model,
      stream: false,
      input: [{ role: 'user', content: inputText }],
    };
    if (config.source.startsWith('openai_prompt') && config.openaiPromptId) {
      payload.prompt = { id: config.openaiPromptId };
      if (
        config.source === 'openai_prompt_pinned' &&
        config.openaiPromptVersion
      ) {
        payload.prompt.version = String(config.openaiPromptVersion);
      }
    } else {
      // Title summarization config supports only OpenAI Prompt ID sources
      return null;
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    let title = '';
    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        // fail silently
        return null;
      }
      const result = await response.json();
      if (Array.isArray(result.output)) {
        const msg = result.output.find((o: any) => o.type === 'message');
        if (msg?.content?.[0]?.text) title = msg.content[0].text;
      }
      if (!title) {
        if (typeof result.output_text === 'string') title = result.output_text;
        else if (typeof result.response?.output_text === 'string')
          title = result.response.output_text;
        else if (result.choices?.[0]?.message?.content)
          title = result.choices[0].message.content;
        else if (typeof result.content === 'string') title = result.content;
      }
      title = (title || '').trim();
      if (!title) return null;
      if (title.length > 80) title = title.slice(0, 80).trim();
    } catch (e) {
      return null;
    }

    try {
      await ctx.runMutation(internal.titleSummarization._applySessionTitle, {
        userId: args.userId,
        sessionId: args.sessionId,
        chatType: args.chatType as any,
        title,
      });
    } catch {}

    return { title };
  },
});
