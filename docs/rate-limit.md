## Rate Limiting — Design, Implementation, and Operations

This document explains the full rate‑limit setup implemented in the app and Convex backend, the rationale behind design choices, how to operate and tune limits (instantly), and how the client communicates limits to users.

### Summary

- Base limit: Weekly per‑user message cap for chat, enforced at the server.
- Global top‑ups: Additive pool for the current week that any user can draw from after exhausting their personal weekly cap.
- Instant tuning:
  - Change base cap via environment variable `CHAT_WEEKLY_LIMIT` (requires worker reload).
  - Grant additional messages to everyone immediately via an internal mutation (`grantGlobalTopup`) — no reload required.
- Client UX: When a user hits the cap, we insert a localized assistant‑style message (“You’ve reached your weekly message limit…”), not a raw error.

---

## Final Architecture

### Base Weekly Limit (Server)

- Name: `chatWeekly` (fixed single name for clarity and consistency)
- Type: Fixed window
- Window length: 7 days (UTC week starting Sunday 00:00 UTC)
- Default rate: `250` per week per user
- Config: `CHAT_WEEKLY_LIMIT` (Convex env)

Defined in `convex/rateLimit.ts`:

```ts
const WEEK = 7 * 24 * 60 * 60 * 1000;
const CHAT_WEEKLY_LIMIT = Number(process.env.CHAT_WEEKLY_LIMIT || 250);

const appRateLimiter = new RateLimiter(rateLimiterComponent, {
  chatWeekly: { kind: 'fixed window', rate: CHAT_WEEKLY_LIMIT, period: WEEK },
  // other limits (e.g., title summarize, moods, auth) remain
});
```

Enforcement points:

- `convex/chat.ts` (mutation `sendChatMessage`): checks for user messages (role === 'user').
- `convex/chatStreaming.ts` (internal mutation `insertUserMessage` for streaming path): checks before inserting the user message.
- `convex/http.ts` (HTTP stream pre‑check): returns `429 Weekly chat limit reached` early.

### Global Top‑Ups (Server)

Goal: Increase available messages for all users instantly (without resetting their counters or restarting the backend).

Data model in `convex/schema.ts`:

```ts
globalTopups: defineTable({
  windowStart: v.number(), // start of the current UTC week
  remaining: v.number(), // pool remaining for this week (applies to all users)
}).index('by_window', ['windowStart']);
```

Server helpers in `convex/rateLimit.ts`:

- `internal.rateLimit.grantGlobalTopup({ amount })` — Add (or subtract) credits to this week’s global pool. Returns `{ windowStart, remaining }`.
- `internal.rateLimit.getGlobalTopup()` — Inspect the current pool.
- `tryConsumeGlobalTopup(ctx)` — Used by chat mutations; consumes 1 top‑up when a user is out of their weekly cap, allowing the message to pass.

Enforcement flow in chat:

```ts
// 1) Personal weekly cap
const status = await appRateLimiter.limit(ctx, 'chatWeekly', { key: userId });

// 2) If depleted, consume 1 from the global pool
if (!status.ok) {
  const consumed = await tryConsumeGlobalTopup(ctx);
  if (!consumed) {
    // 3) No top-up available → throw 429
    await appRateLimiter.limit(ctx, 'chatWeekly', {
      key: userId,
      throws: true,
    });
  }
}
```

### Client UX (App)

When the server returns `429`, the client injects a localized assistant‑style message in the chat.

- File: `src/app/(app)/tabs/chat.tsx`
- Locale keys:
  - `chat.limit.weeklyReached` — “You’ve reached your weekly message limit. Please check back next week.”

```ts
// On streaming error with status 429:
const systemNotice: Message = {
  _id: `sys-rate-${Date.now()}`,
  content: t(
    'chat.limit.weeklyReached',
    "You've reached your weekly message limit. Please check back next week."
  ),
  role: 'assistant',
  _creationTime: Date.now(),
};
// Append to current session’s pending messages so it appears inline
```

Locales updated:

- `src/locales/en.json`: `chat.limit.weeklyReached`
- `src/locales/ar.json`: `chat.limit.weeklyReached`

---

## Operations

### Change the weekly cap (base limit)

1. Update Convex env var `CHAT_WEEKLY_LIMIT` (e.g., `250 → 300`).
2. Restart Convex workers (dev: restart `convex dev`; prod: `bun convex:deploy`).

Notes:

- The limiter config is loaded at worker start; a restart is required to pick up new env values.

### Grant additional messages instantly to everyone

Run the internal mutation (Convex dashboard / MCP):

```js
internal.rateLimit.grantGlobalTopup({ amount: 100 });
```

Effects:

- Immediately adds `+100` messages to the shared pool for the current week.
- Users who already hit their weekly cap can continue; each additional send consumes one from the pool.
- Negative amounts are allowed (pool won’t go below zero) if you need to reduce remaining top‑ups.

### Reset a single user (optional)

```js
internal.rateLimit.resetChatWeekly({ userId: '<Convex users._id>' });
```

Use cases:

- QA flow for a specific tester, or targeted support intervention.

### Inspect the current top‑up pool

```js
internal.rateLimit.getGlobalTopup();
// → { windowStart: <epoch>, remaining: <number> }
```

### Weekly window semantics

- Window start: Sunday 00:00 UTC.
- At each new week, the `globalTopups` table naturally rolls to a new row/window.
- Per‑user rate limiter counters also move to the new weekly window automatically.

---

## Files Changed

Backend (Convex):

- `convex/convex.config.ts`: mounted the rate limiter component earlier.
- `convex/rateLimit.ts`:
  - Defined `chatWeekly` with `CHAT_WEEKLY_LIMIT` and `WEEK` period.
  - Implemented `grantGlobalTopup`, `getGlobalTopup`, `resetChatWeekly`, `tryConsumeGlobalTopup`.
- `convex/chat.ts` and `convex/chatStreaming.ts`:
  - Enforced `chatWeekly` for user messages only, then fallback to `tryConsumeGlobalTopup`.
- `convex/http.ts`:
  - Pre‑check uses `chatWeekly` and returns `429 Weekly chat limit reached` if exceeded.
- `convex/schema.ts`:
  - Added `globalTopups` table with `by_window` index.

Frontend (App):

- `src/app/(app)/tabs/chat.tsx`:
  - On `429`, shows a localized assistant‑style message instead of a raw error dialog.
- Localization:
  - `src/locales/en.json`, `src/locales/ar.json`: `chat.limit.weeklyReached`.

---

## How To Test

1. Set a small weekly cap:
   - Set `CHAT_WEEKLY_LIMIT=3` and restart Convex.
2. Send 3 messages — 4th should 429.
3. Grant a top‑up:
   - `internal.rateLimit.grantGlobalTopup({ amount: 2 })` → next 2 messages should succeed.
4. Raise the base cap:
   - Set `CHAT_WEEKLY_LIMIT=5`, restart Convex → base limit now 5 + any remaining top‑ups.

---

## Troubleshooting

- “Raised `CHAT_WEEKLY_LIMIT` but still see old limit”
  - Ensure you restarted Convex workers; the limiter’s config is read at startup.
- “Reset doesn’t work when I only set `name` in the component tool”
  - The chat limiter is keyed per user. Use `internal.rateLimit.resetChatWeekly({ userId })`, or pass both `name` and `key` if using the component API directly.
- “Need to increase capacity instantly without restart”
  - Use `grantGlobalTopup({ amount })`. No restart needed; takes effect immediately.

---

## Rationale & Notes

- Weekly vs Daily: Weekly provides flexibility (some days heavier usage) while maintaining a sensible cap.
- Global Top‑Ups: Operations can increase capacity fleet‑wide instantly without affecting per‑user counters or requiring a deploy.
- Client Messaging: Present a calm, localized explanation instead of an error to improve UX.
- Security: Top‑up and resets are `internal` Convex functions and not callable by the client directly.

---

## API Reference (Internal)

```ts
// rateLimit.ts

// Base limiter (loaded at worker start)
chatWeekly: { kind: 'fixed window', rate: CHAT_WEEKLY_LIMIT, period: WEEK }

// Mutations / Queries
grantGlobalTopup({ amount: number }): { windowStart: number, remaining: number }
getGlobalTopup(): { windowStart: number, remaining: number }
resetChatWeekly({ userId: Id<'users'> }): null

// Utility
tryConsumeGlobalTopup(ctx): Promise<boolean>
```

Example (Convex dashboard / MCP):

```js
// Add +100 messages for everyone this week
await internal.rateLimit.grantGlobalTopup({ amount: 100 });

// Inspect remaining top-ups
await internal.rateLimit.getGlobalTopup();

// Reset a single user (Convex users._id)
await internal.rateLimit.resetChatWeekly({ userId: 'xxxx' });
```

---

## Migration Notes (What we removed/changed)

- Removed daily chat limit and any duplicate/legacy DB‑based rate limit checks.
- Consolidated all chat limiting to `chatWeekly` + global top‑ups.
- Localized user‑facing rate‑limit messaging.
