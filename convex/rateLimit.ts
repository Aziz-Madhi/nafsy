import { RateLimiter } from '@convex-dev/rate-limiter';
import { components } from './_generated/api';
import { v } from 'convex/values';
import {
  internalMutation,
  internalQuery,
  MutationCtx,
  QueryCtx,
} from './_generated/server';
import { Doc, Id } from './_generated/dataModel';

// 24 hours, week, and approx month (30d) in milliseconds
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const MONTH_30D = 30 * DAY;
const CHAT_WEEKLY_LIMIT = Number(process.env.CHAT_WEEKLY_LIMIT || 250);
const voiceTokensLimitEnv = process.env.VOICE_MONTHLY_TOKENS_LIMIT;
if (!voiceTokensLimitEnv) {
  throw new Error(
    'VOICE_MONTHLY_TOKENS_LIMIT environment variable is required'
  );
}
const VOICE_MONTHLY_TOKENS_LIMIT = Number(voiceTokensLimitEnv);
if (
  !Number.isFinite(VOICE_MONTHLY_TOKENS_LIMIT) ||
  VOICE_MONTHLY_TOKENS_LIMIT <= 0
) {
  throw new Error('VOICE_MONTHLY_TOKENS_LIMIT must be a positive number');
}
export const VOICE_MONTHLY_LIMIT = VOICE_MONTHLY_TOKENS_LIMIT;

// Centralized rate limiter instance for the app
// Keys are type-safe across usages in the codebase
// Cast to any until components bindings are regenerated (
// `components.rateLimiter` is provided by the installed component).
const rateLimiterComponent: any = (components as any).rateLimiter;

const appRateLimiter = new RateLimiter(rateLimiterComponent, {
  // Per-user total chat messages across all personalities per week
  chatWeekly: { kind: 'fixed window', rate: CHAT_WEEKLY_LIMIT, period: WEEK },
  // Per-user combined voice tokens (input + output) per ~month (30 days)
  voiceMonthlyTokens: {
    kind: 'fixed window',
    rate: VOICE_MONTHLY_TOKENS_LIMIT,
    period: MONTH_30D,
  },
  // Per-user exercise playbacks/completions per day
  exercisePlaybackDaily: { kind: 'fixed window', rate: 50, period: DAY },
  // Removed burst protection; simplified to daily message limit only
  // Title summarization attempt limiter per user-session
  titleSummarize: { kind: 'fixed window', rate: 1, period: 10_000 },
  // Auth-related
  authUpsert: { kind: 'fixed window', rate: 30, period: 60_000 },
  authOpDefault: { kind: 'fixed window', rate: 100, period: 60_000 },
  // Mood creation limiter
  moodCreate: { kind: 'fixed window', rate: 100, period: 60_000 },
});
export default appRateLimiter;
export const resetChatWeekly = internalMutation({
  args: { userId: v.id('users') },
  returns: v.null(),
  handler: async (ctx, args) => {
    await appRateLimiter.reset(ctx, 'chatWeekly' as any, {
      key: args.userId,
    });
    return null;
  },
});

// Helper to compute current weekly window start
function getWeekWindowStart(now: number): number {
  // Align to UTC week start (Sunday 00:00 UTC)
  const d = new Date(now);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day; // go back to Sunday
  const sunday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0)
  );
  return sunday.getTime();
}

// Reads global top-ups for current window
export const getGlobalTopup = internalQuery({
  args: {},
  returns: v.object({ windowStart: v.number(), remaining: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const windowStart = getWeekWindowStart(now);
    const rec = await ctx.db
      .query('globalTopups')
      .withIndex('by_window', (q) => q.eq('windowStart', windowStart))
      .first();
    return { windowStart, remaining: rec?.remaining || 0 };
  },
});

// Grant a global top-up amount for the current week (adds to remaining for all users)
export const grantGlobalTopup = internalMutation({
  args: { amount: v.number() },
  returns: v.object({ windowStart: v.number(), remaining: v.number() }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = getWeekWindowStart(now);
    const rec = await ctx.db
      .query('globalTopups')
      .withIndex('by_window', (q) => q.eq('windowStart', windowStart))
      .first();
    if (!rec) {
      const id = await ctx.db.insert('globalTopups', {
        windowStart,
        remaining: Math.max(0, Math.floor(args.amount)),
      });
      const created = await ctx.db.get(id);
      return { windowStart, remaining: created?.remaining || 0 };
    }
    const next = Math.max(0, (rec.remaining || 0) + Math.floor(args.amount));
    await ctx.db.patch(rec._id, { remaining: next });
    return { windowStart, remaining: next };
  },
});

// Consume one unit from global top-up if available; returns true if consumed
export async function tryConsumeGlobalTopup(
  ctx: MutationCtx
): Promise<boolean> {
  const now = Date.now();
  const windowStart = getWeekWindowStart(now);
  const rec = await ctx.db
    .query('globalTopups')
    .withIndex('by_window', (q) => q.eq('windowStart', windowStart))
    .first();
  if (!rec || !rec.remaining || rec.remaining <= 0) return false;
  await ctx.db.patch(rec._id, { remaining: rec.remaining - 1 });
  return true;
}

// Reset all per-user voice monthly token counters by clearing stored shards
const VOICE_LIMITER_STATE_KEY = 'voiceLimiterVersion';

type AnyCtx = MutationCtx | QueryCtx;
type VoiceLimiterStateDoc = Doc<'voiceLimiterState'>;

async function fetchVoiceLimiterState(
  ctx: AnyCtx
): Promise<VoiceLimiterStateDoc | null> {
  return (await ctx.db
    .query('voiceLimiterState')
    .withIndex('by_key', (q) => q.eq('key', VOICE_LIMITER_STATE_KEY))
    .first()) as VoiceLimiterStateDoc | null;
}

export async function readVoiceLimiterVersion(ctx: AnyCtx): Promise<number> {
  const doc = await fetchVoiceLimiterState(ctx);
  return doc?.version ?? 1;
}

export async function ensureVoiceLimiterVersion(
  ctx: MutationCtx
): Promise<{ version: number; id: Id<'voiceLimiterState'> }> {
  const existing = await fetchVoiceLimiterState(ctx);
  if (existing) {
    return { version: existing.version, id: existing._id };
  }
  const id = await ctx.db.insert('voiceLimiterState', {
    key: VOICE_LIMITER_STATE_KEY,
    version: 1,
    updatedAt: Date.now(),
  });
  return { version: 1, id };
}

export function voiceLimiterKey(version: number, userId: Id<'users'>): string {
  return `${version}:${userId}`;
}

export const resetVoiceMonthlyGlobal = internalMutation({
  args: {},
  returns: v.object({ version: v.number() }),
  handler: async (ctx) => {
    const { version, id } = await ensureVoiceLimiterVersion(ctx);
    const next = version + 1;
    await ctx.db.patch(id, { version: next, updatedAt: Date.now() });
    return { version: next };
  },
});
