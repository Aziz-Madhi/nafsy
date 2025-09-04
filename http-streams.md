Certainly! Here’s a step-by-step guide to setting up HTTP streaming to the active user with periodic database writes for an LLM chat in a React Native app with Expo, based strictly on the provided knowledge sources.

---

## 1. **Backend: Convex HTTP Streaming Action**

You’ll create a Convex HTTP action that:

- Streams the LLM (e.g., OpenAI) response to the requesting client.
- Periodically writes the accumulated content to the database for other clients.

**Example (TypeScript, in `convex/http.ts`):**

```ts
import { httpAction } from './_generated/server';
import { httpRouter } from 'convex/server';
import { internal } from './_generated/api';

const http = httpRouter();

http.route({
  path: '/chat',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    let { readable, writable } = new TransformStream();
    let writer = writable.getWriter();
    const textEncoder = new TextEncoder();

    const streamData = async () => {
      let content = '';
      const openai = new OpenAI();
      const stream = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          /* ... */
        ],
        stream: true,
      });

      for await (const part of stream) {
        const text = part.choices[0]?.delta?.content || '';
        content += text;
        await writer.write(textEncoder.encode(text));
        // Periodically update the DB (e.g., at sentence boundaries)
        if (hasDelimeter(text)) {
          await ctx.runMutation(internal.messages.update, {
            messageId,
            body: content,
            isComplete: false,
          });
        }
      }
      // Final DB update
      await ctx.runMutation(internal.messages.update, {
        messageId,
        body: content,
        isComplete: true,
      });
      await writer.close();
    };

    void streamData();
    // Set CORS headers for Expo/React Native
    const response = new Response(readable);
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Vary', 'Origin');
    return response;
  }),
});

export default http;
```

**Key points:**

- The HTTP action streams data to the client and periodically updates the DB.
- CORS headers are set for cross-origin requests from Expo/React Native.
- The client receives a character-by-character stream, while other users see batched updates via DB reactivity.

[See full example and explanation](https://stack.convex.dev/ai-chat-with-http-streaming)

---

## 2. **Frontend: React Native/Expo Streaming Fetch**

On the client, use the Streams API with `fetch` to POST to the `/chat` endpoint and read the streaming response.

**Example (adapted for React Native/Expo):**

```js
async function handleGptResponse(onUpdate, requestBody) {
  const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_URL.replace(
    /\.cloud$/,
    '.site'
  );
  const response = await fetch(`${convexSiteUrl}/chat`, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: { 'Content-Type': 'application/json' },
  });
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      onUpdate(new TextDecoder().decode(value));
      return;
    }
    onUpdate(new TextDecoder().decode(value));
  }
}
```

- `onUpdate` is a callback to update your UI as new text arrives.
- After the stream completes, rely on your Convex `useQuery` to show the final message from the DB.

[Client streaming fetch example](https://stack.convex.dev/ai-chat-with-http-streaming)

---

## 3. **Convex + Expo Integration**

- Set up Convex in your Expo app as per the [React Native Quickstart](https://docs.convex.dev/quickstart/react-native).
- Use `useQuery` to subscribe to message updates for all users.
- Use `useMutation` to send new messages.

---

## **Summary**

- Use a Convex HTTP action to stream LLM responses to the active user and periodically update the DB.
- On the client, use fetch with Streams API to display the streaming response in real time.
- Other users see updates via Convex’s reactivity as the DB is updated.
- Set CORS headers in your HTTP action for Expo compatibility.

If you need more Expo-specific fetch streaming code or run into platform-specific issues, let me know! The above pattern is directly supported by Convex and is the recommended approach for your use case.

---

**References:**  
[AI Chat with HTTP Streaming](https://stack.convex.dev/ai-chat-with-http-streaming)  
[Streaming HTTP Responses using fetch](https://stack.convex.dev/streaming-http-using-fetch)  
[React Native Quickstart](https://docs.convex.dev/quickstart/react-native)
