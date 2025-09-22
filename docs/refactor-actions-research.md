Use **internal actions** for LLM calls and summarization, triggering them from a public mutation (or action) so the heavy/side‑effecting work runs server‑only; reserve **regular actions** for cases where the client must call the work directly or receive an immediate/interactive result like a streamed response. [1][2][3][4]

## What each type means

- Regular actions are callable from the client and are designed for side effects such as calling external APIs; they are not transactional and can call queries/mutations via ctx.runQuery/runMutation. [2]
- Internal actions are the same primitive but cannot be called from clients; they reduce attack surface and prevent malicious or costly direct invocation. [1]
- HTTP actions are HTTP endpoints for webhooks or custom APIs and are typically used when an external service needs to reach Convex or when returning a streaming HTTP Response. [4]

## Recommended pattern

- Have the client write the user message via a public mutation, then immediately schedule an internal action to perform the LLM call and any summarization. [3][1]
- This keeps database writes transactional (mutation), offloads non‑transactional, external work to an action, and prevents direct client‑side access to costly LLM invocations. [5][1]

## Why internal over regular

- Internal actions cannot be invoked directly by untrusted clients, which protects provider keys, mitigates abuse, and limits unexpected cost. [1]
- Actions have at‑most‑once semantics; scheduling them from a successful mutation with runAfter(0) ensures the write commits before the external call starts. [5][3]

## Streaming choices

- If token‑level streaming to the client over HTTP is needed, keep or add a minimal HTTP action that streams and simultaneously persists chunks to the database (e.g., using the persistent text streaming component). [4][6]
- If pure app reactivity suffices, stream via the database: the internal action writes chunks or updates, and clients stay live‑updated via reactive queries. [7][8]

## When to keep HTTP actions

- Keep HTTP actions for third‑party webhooks or when an HTTP Response stream must be returned directly to a non‑Convex client. [4][9]
- Otherwise prefer Convex client calls to queries/mutations/actions and hide sensitive or long‑running workflows behind internal functions. [1][10]

## Minimal blueprint

- Mutation: insert the message and schedule the LLM internal action with runAfter(0). [3][5]
- Internal action: call the LLM via fetch, write deltas/final result back with internal mutations, and optionally update a summary thread. [2][1]

```ts
// convex/messages.ts
import { mutation, internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

// 1) Public mutation: write and trigger async work
export const send = mutation({
  args: { threadId: v.id('threads'), content: v.string() },
  handler: async (ctx, { threadId, content }) => {
    const messageId = await ctx.db.insert('messages', {
      threadId,
      role: 'user',
      content,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.messages.generateAndSummarize, {
      threadId,
      repliedTo: messageId,
    });
    return messageId;
  },
});

// 2) Internal action: call LLM and persist results
export const generateAndSummarize = internalAction({
  args: { threadId: v.id('threads'), repliedTo: v.id('messages') },
  handler: async (ctx, args) => {
    // fetch() to LLM, stream or batch, then:
    // await ctx.runMutation(internal.messages.appendAssistantChunk, {...})
    // await ctx.runMutation(internal.threads.updateSummary, {...})
  },
});
```

The mutation→scheduler→internalAction flow provides safe, durable orchestration for chat + summarization without exposing the costly parts to clients. [3][5]

## Decision rule

- Choose internal actions by default for LLM/summarization, scheduled from a mutation; switch to a regular action only if the client must call it directly or receive an immediate action result. [1][2]
- Use an HTTP action only for webhooks or when returning an HTTP stream is a hard requirement; pair it with DB writes for real‑time UI updates. [4][6]

Yes—an Expo iOS app can use internal actions, but they must be invoked indirectly; the mobile app calls a public query/mutation/action, which then schedules an internal action on the Convex backend to call external APIs like LLMs. [1][2][3][4]

## What “internal” means

- Internal actions are server‑only functions that cannot be called directly by any Convex client (web, mobile, or server), which reduces the public attack surface and keeps provider keys off devices. [3]
- Regular (public) actions, queries, and mutations are callable by the app via the Convex client libraries, whereas internal ones are callable only from other Convex functions or the scheduler. [5][6][3]

## How it works in Expo iOS

- The React Native app uses the Convex React client to call public functions (e.g., a mutation to post a message), exactly as in web React; Convex provides an RN quickstart and guidance for Expo. [1][2][5]
- That public mutation writes the message to the database, then immediately schedules an internal action via the scheduler (runAfter) and passes the message/thread IDs so the backend knows what to process. [7][3]
- The internal action runs on the Convex backend, calls the LLM over fetch, and writes assistant chunks or the final reply back via internal mutations/actions, which the app renders via reactive queries. [4][3][8]

## Why this pattern

- It keeps the expensive or sensitive work (LLM calls, provider keys) off the mobile device, preventing direct invocation by untrusted clients and limiting abuse/cost. [3][9]
- Scheduling from the mutation ensures the user’s write commits before the background work runs, avoiding race conditions while keeping the UI responsive. [7][9]

## Streaming and UX options

- Reactive streaming: the internal action writes incremental chunks to the DB and the RN app receives live updates via useQuery, producing a streamed UI without any HTTP streaming in the app. [8][5]
- HTTP streaming: if an actual HTTP Response stream is required, expose a minimal HTTP action that streams and also persists chunks, but still keep LLM calls and keys on the server. [10][11]

## Security notes

- API keys and provider secrets belong in the Convex backend (actions/internal actions), not in the Expo app bundle, which aligns with Convex’s best‑practice guidance for public vs. internal functions. [3][9]
- Convex explicitly supports mobile apps with React Native and Expo, so the same client patterns apply, with the backend running internal actions securely. [12][13]
