Short answer: The simplest, lowest‑cost way to stream is to expose a Convex **HTTP action** that proxies the LLM’s streamed response to the app via HTTP/SSE, and only persist checkpoints or the final message to Convex, rather than writing every token to the database [1][2][3]. Using the Vercel AI SDK can work on React Native, but it adds RN/Expo stream compatibility caveats; a direct HTTP/SSE stream from Convex is both straightforward and production‑ready today, especially with Convex’s component for streaming + periodic persistence [4][5][6].

## What to build
- Create a Convex HTTP endpoint that calls the LLM with streaming enabled and returns a streaming Response to the client; this avoids writing each token to the database and keeps keys server‑side [2][3].  
- Optionally add Convex’s **Persistent Text Streaming** component to stream token‑by‑token to the requesting client while batching writes (e.g., on sentence boundaries) so other viewers still get real‑time updates via reactive queries without the write‑per‑token cost [6][1].  

## Why not stream via DB writes
- Convex’s reactive queries will push updates when data changes, but writing every token to trigger UI updates is costly and inefficient; HTTP streaming to the author plus batched DB persistence balances UX and cost [1][6].  
- Convex has a template and guidance specifically for “HTTP Response Streaming” to the author while batching updates for others, which directly fits this need and reduces database bandwidth [1][7].  

## Server setup (Convex)
- Use an HTTP action (in convex/http.ts via httpRouter + httpAction) that calls the LLM with stream enabled and returns a streaming Response; Convex HTTP actions follow the standard Fetch API for Request/Response and are served on the .convex.site domain [3].  
- Convex’s “Streaming HTTP Responses using fetch” shows exactly how to read and forward chunked streams from OpenAI (or compatible APIs) using ReadableStream and async iterators, no extra SDK required [2].  
- If persistence is needed during streaming, install Convex’s Persistent Text Streaming component to emit chunks to the client and write batched updates to the database with a built‑in React hook to read the full stream body later [6].  

## Client setup (Expo React Native)
- Easiest: consume the Convex HTTP stream via SSE using an EventSource polyfill like react-native-sse; this is a common approach in RN/Expo for streaming LLM output and avoids ReadableStream polyfill complexity [4].  
- If using fetch stream directly, React Native may need polyfills for ReadableStream/TextEncoder/TextDecoder; community guidance highlights required polyfills and Expo entry setup to make streaming work reliably [4][8].  
- Using the Vercel AI SDK on RN/Expo is possible, but ensure compatibility: their UI hooks consume either plain text streams or their SSE “data stream” protocol; the backend must emit correct stream responses and headers (e.g., x-vercel-ai-ui-message-stream: v1 for data streams), and RN may still need stream polyfills or specific headers per community notes [5][4][8].  

## Vercel AI SDK vs Convex HTTP action
- Vercel AI SDK: Great developer ergonomics and UI hooks; to work with RN/Expo, ensure streaming compatibility (polyfills or SSE transport) and return a proper streaming HTTP response (text stream or UI message stream) from the server [5][9].  
- Convex HTTP action: Minimal moving parts and no extra SDK required on the server; the official Convex examples/templates document exactly this pattern for OpenAI‑style SSE, plus an optional component to persist stream state efficiently [2][1][6].  

## Recommended architecture
- Primary path: Convex **HTTP action (SSE/streaming HTTP)** → Expo RN SSE client (EventSource polyfill) for the author’s live tokens; write to Convex only at checkpoints/final message so other sessions see batched real‑time updates via Convex subscriptions [1][6].  
- This keeps API keys on the backend, minimizes DB writes, and yields immediate token streaming in the app without maintaining custom WebSocket infra [3][1].  

## When to consider WebSockets
- SSE/streaming HTTP is ideal for one‑way, server‑to‑client token streams; choose WebSockets only if bidirectional streaming is truly required (e.g., mid‑generation client interruptions coordinated at the protocol level) [10][11].  
- If a WebSocket transport is mandatory, Convex community experiments exist (SSE→WebSocket proxy), but SSE remains simpler and broadly sufficient for LLM token delivery to clients [12][13].  

## Practical tips
- Use Convex’s HTTP actions with proper CORS headers when calling from an app/web origin; endpoints are hosted on .convex.site and follow Fetch semantics, simplifying deployment and security [3].  
- Start with Convex’s “ChatGPT with HTTP Response Streaming” template or the “AI Chat with HTTP Streaming” guide to copy the streaming pattern end‑to‑end; then layer the Persistent Text Streaming component if persistence during streaming is needed [1][7][6].  

## Bottom line
- Choose Convex **HTTP actions (SSE)** for streaming to the app and add Convex’s persistence component if batched writes are needed; this is the simplest and most cost‑effective architecture with Expo RN today [1][6].  
- Use the Vercel AI SDK only if its client hooks are desired, and be ready to align the server’s stream protocol and RN polyfills; otherwise, a thin SSE client is the fastest path to production streaming [5][4].




To add an HTTP response streaming endpoint for your React Native Expo app using Convex, you need to set up a streaming HTTP endpoint in your Convex backend and then consume that stream on your client. Here’s how you can do it based on the provided knowledge sources:

---

### 1. **Backend: Set Up a Streaming HTTP Endpoint**

Use the Persistent Text Streaming component from Convex to define an HTTP POST endpoint (e.g., `/chat-stream`) that streams responses chunk by chunk.

**Example Convex backend handler:**

```ts
import { PersistentTextStreaming } from "@convex-dev/persistent-text-streaming";
import { components } from "./_generated/api";
import { httpAction } from "./_generated/server";

const persistentTextStreaming = new PersistentTextStreaming(
  components.persistentTextStreaming
);

export const streamChat = httpAction(async (ctx, request) => {
  const body = (await request.json()) as {
    streamId: string;
    conversationId: string;
    userMessage: string;
  };

  const generateChat = async (ctx, request, streamId, chunkAppender) => {
    const message = "Hello! How can I help you today?";
    for (let i = 0; i < message.length; i++) {
      await chunkAppender(message[i]);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };

  const response = await persistentTextStreaming.stream(
    ctx,
    request,
    body.streamId,
    generateChat
  );

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Vary", "Origin");
  return response;
});
```

Register the HTTP route:

```ts
http.route({
  path: "/chat-stream",
  method: "POST",
  handler: streamChat,
});
```
[See: Basic Streaming Pattern](https://stack.convex.dev/build-streaming-chat-app-with-persistent-text-streaming-component#basic-streaming-pattern)

---

### 2. **Frontend: Consume the Streaming Response**

On the client, use the `fetch` API to POST to the streaming endpoint and read the response as a stream. The standard approach is:

```js
const response = await fetch(`${convexSiteUrl}/chat-stream`, {
  method: "POST",
  body: JSON.stringify({ streamId, conversationId, userMessage }),
  headers: { "Content-Type": "application/json" },
});
const reader = response.body.getReader();
let result = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  result += new TextDecoder().decode(value);
  // Update your UI with the new chunk here
}
```
[See: Streaming HTTP Responses using fetch](https://stack.convex.dev/streaming-http-using-fetch#reading-the-stream)

---

### 3. **React Native Caveats**

The knowledge sources do not provide React Native–specific code or mention any required polyfills. In React Native, the Streams API (`response.body.getReader()`) may not be available out of the box. You may need to use a library or polyfill to handle streaming responses in React Native. The sources do not cover this, so you should verify Streams API support in your Expo environment.

---

**Summary:**  
- Set up a Convex HTTP streaming endpoint using Persistent Text Streaming.
- On the client, POST to the endpoint and read the response stream chunk by chunk.
- In React Native, ensure you have support for the Streams API or use a compatible library.

If you need React Native–specific implementation details or polyfill recommendations, the knowledge sources do not provide that information. The general approach, however, is well covered above.