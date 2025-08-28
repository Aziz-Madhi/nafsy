import { cronJobs } from 'convex/server';
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';

// Internal mutation to prune old rate limit windows
export const pruneRateLimits = internalMutation({
  args: {
    maxAgeMs: v.number(),
  },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.maxAgeMs;
    let deleted = 0;
    // Note: This scans the table. If rateLimits grows, consider adding an index on windowStart.
    const all = await ctx.db.query('rateLimits').collect();
    for (const doc of all) {
      if (doc.windowStart < cutoff) {
        await ctx.db.delete(doc._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

const crons = cronJobs();

// Run pruning hourly; keep last 24h by default
crons.interval(
  'prune old rate limits',
  { hours: 1 },
  internal.crons.pruneRateLimits,
  { maxAgeMs: 24 * 60 * 60 * 1000 }
);

export default crons;
