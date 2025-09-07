## Implementation Report: Convex Internal Actions Refactor (Chat, Titles, Weekly Summary)

### Summary

- Primary UX uses HTTP streaming from Convex to the client for token-by-token updates, while still persisting the final assistant message to the DB.
- Internal actions orchestrated by mutations remain the canonical server-only path and are used as a non‑streaming fallback.
- Centralized OpenAI access behind server-only code using environment variables; no keys in the client or public functions.
- Preserved reactive UX by writing results to Convex tables; the app updates via queries.

### What Changed

- Chat send → assistant reply (server)
  - `convex/chat.ts`
    - `sendChatMessage` (mutation): writes user message, then schedules assistant generation via `ctx.scheduler.runAfter(0, internal.chat.generateAssistantReply, ...)`.
    - `generateAssistantReply` (internalAction):
      - Reads recent messages (internal query), builds OpenAI Responses payload (Prompt ID/inline per DB config), calls `/v1/responses` with `process.env.OPENAI_API_KEY`.
      - Persists the final assistant message with `internal.chatStreaming.insertAssistantMessage` and records telemetry.
      - Schedules title summarization (rate limited) via `internal.titleSummarization.generateAndApplyTitle`.
    - `_getMessagesForSession` (internalQuery): server-only message read by `userId`/`sessionId` that does not depend on `ctx.auth`.

- Title summarization (server)
  - `convex/titleSummarization.ts`
    - `_applySessionTitle` (internalMutation): updates a session title if it still looks “default”.
    - `generateAndApplyTitle` (internalAction): reads first 3 messages (internal query), calls OpenAI Responses (Prompt ID only; no inline for titles), and applies the title.
  - `convex/titleSummarizationConfig.ts`: source constrained to `openai_prompt_latest` or `openai_prompt_pinned`; no `inline` branch for titles.

- Weekly context (server)
  - `convex/personalization.ts`
    - `buildUserContext` converted to `internalQuery` and now queries DB directly for today’s moods and exercises; avoids calling public queries that require `ctx.auth`.
    - Callers updated to use `internal.personalization.buildUserContext`.

- OpenAI payload builder
  - `convex/openaiResponses.ts`: uses `internal.personalization.buildUserContext` and DB-configured prompt/model to build an OpenAI Responses payload (Prompt ID with optional pinned version or inline for non-title use cases).

### HTTP Streaming Retained

We kept an HTTP endpoint that streams assistant tokens to the client while also persisting the final reply:

- `convex/http.ts`: `POST /chat-stream`
  - Authenticates the caller, applies a lightweight per-session rate limit.
  - Writes the user message via `internal.chatStreaming.insertUserMessage`.
  - Builds the OpenAI Responses payload via shared helpers and streams chunks to the client.
  - On completion, persists the final assistant message and schedules title summarization.
  - CORS is restricted to allowed origins and echoes the request origin when validated; mobile (no Origin) falls back to `*`.

Client uses streaming directly in `src/app/(app)/tabs/chat.tsx` (XHR + SSE handling). We no longer keep separate streaming util/hook files.

### Security & Reliability

- Keys: OpenAI API key is read only on the server from environment variables configured in Convex; never sent to the client.
- Access: Costly and sensitive functions are `internalAction`s not callable by untrusted clients.
- Orchestration: `sendChatMessage` is a single transactional write; background work runs via `scheduler.runAfter(0)` for at‑most‑once semantics.
- Rate limiting & idempotency:
  - Uses `internal.chatStreaming.applyRateLimit`/`tryRateLimit` for per-session/request rate limiting.
  - `insertAssistantMessage` applies idempotency by checking last assistant message content/requestId.
  - CORS restricted to approved origins for `/chat-stream`; unknown web origins receive 403. Mobile requests (no Origin) are allowed with `*`.

### Behavior

- Token-by-token HTTP streaming for assistant replies is used on supported clients; the final assistant message is persisted to DB.
- As a fallback or when streaming is disabled, `sendChatMessage` schedules `generateAssistantReply` and the UI updates when the DB write lands.
- Session titles are summarized server-side (best-effort) after an assistant message when there are ≥ 3 messages.

### Configuration

- OpenAI model/prompt:
  - Chat prompts: `convex/aiPrompts.ts` (DB table `aiPrompts`) supports `openai_prompt_latest`, `openai_prompt_pinned`, or `inline`.
  - Title summarization: `titleSummarizationConfig` supports only Prompt IDs (`openai_prompt_latest` / `openai_prompt_pinned`).

- Environment variables (Convex dashboard):
  - `OPENAI_API_KEY` – required.
  - Optional tuning: `PROMPT_CACHE_TTL_MS`, `USER_CONTEXT_MAX_CHARS`, `WEEKLY_SUMMARY_MAX_CHARS`.
  - Optional CORS allow list for `/chat-stream`: `ALLOWED_ORIGINS` (comma‑separated). Defaults to allowing `https://*.convex.site` and localhost in dev.

- Client feature flag:
  - `EXPO_PUBLIC_CHAT_STREAMING` – `'on'` (default) or `'off'`. When `'off'`, the app uses the non‑streaming mutation (`sendChatMessage`) and reactive DB updates only.

### How to Verify

- Install and lint
  - `bun install`
  - `bun lint` and `bun format`

- Run Convex locally
  - `bun convex:dev`

- Run the app (you start it)
  - `bun start`
  - With `EXPO_PUBLIC_CHAT_STREAMING=on` (default): send a message and watch streamed tokens in the chat bubble; final text persists to history when stream completes.
  - With `EXPO_PUBLIC_CHAT_STREAMING=off`: send a message and wait for the assistant’s persisted reply to appear via Convex subscription.
  - After ≥ 3 messages in a session, the title is applied automatically.

### Known Limitations / Next Options

- Dual path complexity: We support both HTTP streaming and non‑streaming internal actions. The feature flag allows controlled rollout.
- DB‑level streaming: If desired, we can stream via DB writes from the internal action (chunked updates) to unify the UX without HTTP.

### File Map (Key Changes)

- Added/Updated (server):
  - `convex/chat.ts`: `sendChatMessage` (schedule), `generateAssistantReply` (internalAction), `_getMessagesForSession` (internalQuery).
  - `convex/titleSummarization.ts`: `_applySessionTitle` (internalMutation), `generateAndApplyTitle` (internalAction).
  - `convex/personalization.ts`: `buildUserContext` → internalQuery; internal DB reads.
  - `convex/openaiResponses.ts`: uses `internal.personalization.buildUserContext`.

- Server HTTP streaming:
  - `convex/http.ts`: `POST /chat-stream` endpoint that streams model tokens and persists the final message.

- Removed:
  - `src/lib/ai/streaming.ts` and `src/hooks/useStreamingChat.ts` (replaced by inline XHR logic in chat screen).

- Updated (client):
  - `src/app/(app)/tabs/chat.tsx`: retains HTTP streaming as primary path; supports non‑streaming fallback via `sendChatMessage` when `EXPO_PUBLIC_CHAT_STREAMING=off`.

### Migration Notes (If You Had Local Changes)

- Client code that called `/chat/*` endpoints or used `useStreamingChat` must be removed (done in `chat.tsx`).
- If you had custom HTTP consumers for other platforms, they will need to be re-implemented to use Convex mutations/queries instead.

### QA Checklist

- Send message in each chat type (coach/vent/companion):
  - With streaming ON → tokens stream, final reply persists.
  - With streaming OFF → final reply appears via DB only.
- Session titles auto-update after ≥ 3 messages.
- Convex logs show no `Authentication required` errors for internal actions/queries.
