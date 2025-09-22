Short answer: Use a Convex HTTP action to return a streaming Response built from Vercel AI SDK’s streamText result, then consume the stream in the Expo client using a fetch ReadableStream polyfill (or SSE) to incrementally render tokens in the UI. The endpoint should call streamText without awaiting it and return result.toDataStreamResponse(), which emits a data-stream protocol the client can parse as chunks arrive. [1][2][3]

## What you’ll build

- A Convex HTTP route at <deployment>.convex.site/chat/stream that streams model output using the AI SDK, so clients see text appear token-by-token without writing every chunk to the DB. [1][4]
- An Expo client that reads the HTTP stream incrementally; in React Native, enable streaming with a fetch/ReadableStream polyfill or use an SSE client. [5][6][7]

## Convex backend setup

- Convex HTTP actions expose Fetch-style Request→Response handlers on <deployment>.convex.site, making them ideal for streaming over plain HTTP. [1]
- HTTP actions return a standard Response, so returning a ReadableStream works with the Fetch API contract and supports chunked delivery. [1][4]

Install server deps:

- ai (Vercel AI SDK v5)
- @ai-sdk/openai (or the provider used)

[2][3]

Example convex/http.ts:

```ts
// convex/http.ts
import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// Configure your provider
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const http = httpRouter();

http.route({
  path: '/chat/stream',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    // Optional: authenticate request (JWT Bearer) with ctx.auth.getUserIdentity()
    // and/or read conversation context from Convex via ctx.runQuery.
    // See Convex HTTP actions + auth notes in docs.
    const { messages, system } = await req.json();

    // AI SDK v4: streamText returns immediately (do not await)
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system,
      messages, // [{role:'user'|'assistant'|'system', content: string}, ...]
    });

    // Return a streamed Response using the AI SDK v4 data-stream helpers
    // You can set headers (e.g., CORS) directly in the options object.
    return result.toDataStreamResponse({
      headers: {
        // For web origins; not needed for native apps calling directly
        'Access-Control-Allow-Origin': '*',
        Vary: 'origin',
      },
    });
  }),
});

// (Optional) Add an OPTIONS route if targeting web browsers and CORS preflight.
http.route({
  path: '/chat/stream',
  method: 'OPTIONS',
  handler: httpAction(async () => {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }),
});

export default http;
```

This follows Convex’s HTTP actions model and returns a Fetch Response that streams, while using AI SDK v4’s result.toDataStreamResponse() rather than the deprecated toAIStreamResponse methods. [1][2][3]

## Client: Expo/React Native streaming

- Historically, React Native’s default fetch did not expose response.body streams, so use a polyfill that enables ReadableStream or use an SSE client. [5][8]
- Option A (recommended): polyfill fetch + ReadableStream and read response.body via getReader to append tokens progressively. [6]
- Option B: use an SSE client (react-native-sse) if serving an SSE stream; the AI SDK data-stream works with line-delimited parts and can also be parsed on the client. [7][3]

Option A: enable streaming fetch in Expo (e.g., react-native-fetch-api + web-streams-polyfill)

```ts
// index.js (entry)
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
import { ReadableStream } from 'web-streams-polyfill';
import { fetch, Headers, Request, Response } from 'react-native-fetch-api';

polyfillGlobal('ReadableStream', () => ReadableStream);
polyfillGlobal('TextDecoder', () => TextDecoder);
polyfillGlobal(
  'fetch',
  () =>
    (...args) =>
      fetch(args, { ...args[1], reactNative: { textStreaming: true } }) // crucial
);
polyfillGlobal('Headers', () => Headers);
polyfillGlobal('Request', () => Request);
polyfillGlobal('Response', () => Response);

// then launch your app entry (expo-router or AppRegistry)
```

This pattern enables response.body streaming in RN so chunks can be consumed as they arrive. [6][5]

Then, in a screen/hook, consume the stream and parse parts from the AI SDK “data stream”:

```ts
import { useRef, useState } from 'react';
import { parseDataStreamPart } from 'ai'; // AI SDK v4 client-side parser

export function useStreamingChat() {
  const [text, setText] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  async function startStream(messages) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await fetch('https://<deployment>.convex.site/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) throw new Error('Stream failed');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const part = parseDataStreamPart(line);
          if (part.type === 'text') {
            setText((prev) => prev + part.text);
          }
          // handle other part types if needed: 'reasoning', 'tool-call', 'finish', etc.
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  function stopStream() {
    abortRef.current?.abort();
  }

  return { text, startStream, stopStream };
}
```

This uses a ReadableStream + line-by-line parsing with parseDataStreamPart, matching the AI SDK’s data-stream protocol in v4. [2][3]

Option B: use SSE client

- If the server emits SSE (text/event-stream), react-native-sse provides an EventSource-like client; add listeners for message events and append data to state. [7][8]
- AI SDK v4 standardizes on “data streams” and provides data-stream helpers; if serving SSE, ensure the server uses an SSE adapter and parse “” lines on the client. [3][2]

## Persisting and reconciling messages

- To avoid writing every token to the DB, stream straight to the client and write only the final text (plus minimal progress metadata) in Convex mutations. This reduces DB churn while maintaining a smooth UI. [4][9]
- Convex also ships examples/components for persistent streaming patterns if progressive storage is desired alongside streaming to clients. [10][11]

## CORS and auth

- For native apps, CORS is usually not required; for web, add Access-Control-Allow-Origin and optionally an OPTIONS handler for preflight per Convex’s HTTP action docs. [1]
- To authenticate, include a Bearer token and read the identity via ctx.auth.getUserIdentity() in the handler before calling the model. [1]

## Troubleshooting

- If nothing streams in Expo, confirm response.body is accessible; RN’s built-in fetch historically lacked stream support, so ensure a ReadableStream-capable fetch polyfill or switch to SSE client. [5][6][8]
- If parsing fails, ensure the server uses result.toDataStreamResponse() (AI SDK v4) and the client parses with parseDataStreamPart, not older toAIStreamResponse helpers. [3][2]
- For Convex routing, verify http.ts is exported correctly and hit the .convex.site domain (not .convex.cloud) when testing endpoints. [1]
