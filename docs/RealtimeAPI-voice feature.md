# Realtime API

Build low-latency, multimodal LLM applications with the Realtime API.

The OpenAI Realtime API enables low-latency communication with [models](/docs/models) that natively support speech-to-speech interactions as well as multimodal inputs (audio, images, and text) and outputs (audio and text). These APIs can also be used for [realtime audio transcription](/docs/guides/realtime-transcription).

## Voice agents

One of the most common use cases for the Realtime API is building voice agents for speech-to-speech model interactions in the browser. Our recommended starting point for these types of applications is the [Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/guides/voice-agents/), which uses a [WebRTC connection](/docs/guides/realtime-webrtc) to the Realtime model in the browser, and [WebSocket](/docs/guides/realtime-websocket) when used on the server.

```js
import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

const agent = new RealtimeAgent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant.',
});

const session = new RealtimeSession(agent);

// Automatically connects your microphone and audio output
await session.connect({
  apiKey: '<client-api-key>',
});
```

[

Voice Agent Quickstart

Follow the voice agent quickstart to build Realtime agents in the browser.

](https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/)

To use the Realtime API directly outside the context of voice agents, check out the other connection options below.

## Connection methods

While building [voice agents with the Agents SDK](https://openai.github.io/openai-agents-js/guides/voice-agents/) is the fastest path to one specific type of application, the Realtime API provides an entire suite of flexible tools for a variety of use cases.

There are three primary supported interfaces for the Realtime API:

[

WebRTC connection

Ideal for browser and client-side interactions with a Realtime model.

](/docs/guides/realtime-webrtc)[

WebSocket connection

Ideal for middle tier server-side applications with consistent low-latency network connections.

](/docs/guides/realtime-websocket)[

SIP connection

Ideal for VoIP telephony connections.

](/docs/guides/realtime-sip)

Depending on how you'd like to connect to a Realtime model, check out one of the connection guides above to get started. You'll learn how to initialize a Realtime session, and how to interact with a Realtime model using client and server events.

## API Usage

Once connected to a realtime model using one of the methods above, learn how to interact with the model in these usage guides.

- **[Prompting guide](/docs/guides/realtime-models-prompting):** learn tips and best practices for prompting and steering Realtime models.
- **[Managing conversations](/docs/guides/realtime-conversations):** Learn about the Realtime session lifecycle and the key events that happen during a conversation.
- **[Webhooks and server-side controls](/docs/guides/realtime-server-controls):** Learn how you can control a Realtime session on the server to call tools and implement guardrails.
- **[Realtime audio transcription](/docs/guides/realtime-transcription):** Transcribe audio streams in real time over a WebSocket connection.

## Beta to GA migration

There are a few key differences between the interfaces in the Realtime beta API and the recently released GA API. Expand the topics below for more information about migrating from the beta interface to GA.

Beta header

For REST API requests, WebSocket connections, and other interfaces with the Realtime API, beta users had to include the following header with each request:

```text
OpenAI-Beta: realtime=v1
```

This header should be removed for requests to the GA interface. To retain the behavior of the beta API, you should continue to include this header.

Generating ephemeral API keys

In the beta interface, there were multiple endpoints for generating ephemeral keys for either Realtime sessions or transcription sessions. In the GA interface, there is only one REST API endpoint used to generate keys - [`POST /v1/realtime/client_secrets`](/docs/api-reference/realtime-sessions/create-realtime-client-secret).

To create a session and receive a client secret you can use to initialize a WebRTC or WebSocket connection on a client, you can request one like this using the appropriate session configuration:

```javascript
const sessionConfig = JSON.stringify({
  session: {
    type: 'realtime',
    model: 'gpt-realtime',
    audio: {
      output: { voice: 'marin' },
    },
  },
});

const response = await fetch(
  'https://api.openai.com/v1/realtime/client_secrets',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: sessionConfig,
  }
);

const data = await response.json();
console.log(data.value); // e.g. ek_68af296e8e408191a1120ab6383263c2
```

These tokens can safely be used in client environments like browsers and mobile applications.

New URL for WebRTC SDP data

When initializing a WebRTC session in the browser, the URL for obtaining remote session information via SDP is now `/v1/realtime/calls`:

```javascript
const baseUrl = 'https://api.openai.com/v1/realtime/calls';
const model = 'gpt-realtime';
const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
  method: 'POST',
  body: offer.sdp,
  headers: {
    Authorization: `Bearer YOUR_EPHEMERAL_KEY_HERE`,
    'Content-Type': 'application/sdp',
  },
});

const sdp = await sdpResponse.text();
const answer = { type: 'answer', sdp };
await pc.setRemoteDescription(answer);
```

New event names and shapes

When creating or [updating](/docs/api-reference/realtime_client_events/session/update) a Realtime session in the GA interface, you must now specify a session type, since now the same client event is used to create both speech-to-speech and transcription sessions. The options for the session type are:

- `realtime` for speech-to-speech
- `transcription` for realtime audio transcription

```javascript
import WebSocket from 'ws';

const url = 'wss://api.openai.com/v1/realtime?model=gpt-realtime';
const ws = new WebSocket(url, {
  headers: {
    Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
  },
});

ws.on('open', function open() {
  console.log('Connected to server.');

  // Send client events over the WebSocket once connected
  ws.send(
    JSON.stringify({
      type: 'session.update',
      session: {
        type: 'realtime',
        instructions: 'Be extra nice today!',
      },
    })
  );
});
```

Configuration for input modalities and other properties have moved as well, notably output audio configuration like model voice. [Check the API reference](/docs/api-reference/realtime_client_events) for the latest event shapes.

```javascript
ws.on('open', function open() {
  ws.send(
    JSON.stringify({
      type: 'session.update',
      session: {
        type: 'realtime',
        model: 'gpt-realtime',
        audio: {
          output: { voice: 'marin' },
        },
      },
    })
  );
});
```

Finally, some event names have changed to reflect their new position in the event data model:

- **`response.text.delta` → `response.output_text.delta`**
- **`response.audio.delta` → `response.output_audio.delta`**
- **`response.audio_transcript.delta` → `response.output_audio_transcript.delta`**

New conversation item events

For `response.output_item`, the API has always had both `.added` and `.done` events, but for conversation level items the API previously only had `.created`, which by convention is emitted at the start when the item added.

We have added a `.added` and `.done` event to allow better ergonomics for developers when receiving events that need some loading time (such as MCP tool listing or input audio transcriptions if these were to be modeled as items in the future).

Current event shape for conversation items added:

```javascript
{
    "event_id": "event_1920",
    "type": "conversation.item.created",
    "previous_item_id": "msg_002",
    "item": Item
}
```

New events to replace the above:

```javascript
{
    "event_id": "event_1920",
    "type": "conversation.item.added",
    "previous_item_id": "msg_002",
    "item": Item
}
```

```javascript
{
    "event_id": "event_1920",
    "type": "conversation.item.done",
    "previous_item_id": "msg_002",
    "item": Item
}
```

Input and output item changes

### All Items

Realtime API sets an `object=realtime.item` param on all items in the GA interface.

### Function Call Output

`status` : Realtime now accepts a no-op `status` field for the function call output item param. This aligns with the Responses API implementation.

### Message

**Assistant Message Content**

The `type` properties of output assistant messages now align with the Responses API:

- `type=text` → `type=output_text` (no change to `text` field name)
- `type=audio` → `type=output_audio` (no change to `audio` field name)

Short answer: The low‑latency, speech‑in/speech‑out voice feature uses the OpenAI Realtime API, which is a separate, session‑based setup (WebRTC or WebSocket) and not the same request/response pattern as the standard chat/Responses API; for non‑realtime TTS/STT, use the Audio API endpoints instead. [1][2][3][4]

## What to use

- For live voice assistant (talk back and forth with minimal lag), use the **Realtime API** with models like gpt‑4o‑realtime/gpt‑realtime over WebRTC or WebSockets for true speech‑in/speech‑out conversations. [1][2][5]
- For one‑shot text‑to‑speech or speech‑to‑text, use the **Audio API** endpoints: audio/speech with gpt‑4o‑mini‑tts or tts‑1/tts‑1‑hd, and audio/transcriptions with gpt‑4o‑transcribe or gpt‑4o‑mini‑transcribe. [6][3][4]

## How it differs from chat

- The chat/Responses API is synchronous request/response over HTTP; the Realtime API is bidirectional streaming built for voice, using persistent sessions with events over WebRTC (preferred for clients) or WebSockets (often for servers). [1][2]
- Client integrations with Realtime require ephemeral session tokens minted by a backend, and the connection is established via SDP to https://api.openai.com/v1/realtime with the selected voice‑capable model, which is a different mechanism than sending a single JSON chat request. [1]
- While chat endpoints have supported “audio preview” in some snapshots, OpenAI recommends Realtime for interactive audio experiences due to latency and interaction model, confirming it’s a separate setup from typical chat flows. [7][8]

## Realtime setup (voice chat)

- Model choice: use a realtime model such as gpt‑4o‑realtime‑preview or the newer gpt‑realtime for speech‑in/speech‑out. [9][5]
- Auth pattern: backend mints an ephemeral token via POST /v1/realtime/sessions using a server API key, then the client uses that ephemeral token to start the WebRTC session; tokens expire quickly and protect the server key. [1]
- WebRTC flow: capture mic audio, create RTCPeerConnection, add local track, open a data channel, POST the offer SDP to /v1/realtime?model=..., then set the returned SDP answer; the remote audio track from the model is played via the peer connection. [1]

## WebSocket alternative (often server‑side)

- A backend can connect to wss://api.openai.com/v1/realtime with headers including OpenAI‑Beta: realtime=v1 and stream audio/text events, which is useful when proxying telephony or non‑browser clients. [2]
- For ASR‑only streaming with VAD/turn detection, connect with intent=transcription and send input_audio_buffer.append events to receive streaming transcripts and speech boundary events. [4]

## Non‑realtime TTS and STT

- Text‑to‑speech: POST to /v1/audio/speech with model gpt‑4o‑mini‑tts (or tts‑1/tts‑1‑hd), passing input text, a built‑in voice (e.g., ash, coral, alloy), and optional “instructions” to shape tone and speaking style. [6]
- Speech‑to‑text: POST to /v1/audio/transcriptions with gpt‑4o‑transcribe or gpt‑4o‑mini‑transcribe for higher‑quality transcriptions than whisper‑1, with optional streaming and prompting support. [4]

## Recommended approach for a mobile voice feature

- For the most natural, low‑latency voice UX, integrate the Realtime API with a client WebRTC session authenticated via ephemeral tokens minted by the backend. [1]
- If client WebRTC is impractical, proxy audio through the backend and connect the backend to the Realtime API via WebSockets, accepting some latency and implementation overhead. [2]

## Model and voice selection

- Realtime sessions can be initialized with a model like gpt‑4o‑realtime‑preview‑2025‑06‑03 and a voice (e.g., “verse”) when minting the session, enabling immediate speech‑in/speech‑out once the peer connection is established. [1]
- For one‑shot speech output, gpt‑4o‑mini‑tts provides controllable, expressive TTS across multiple built‑in voices via the audio/speech endpoint. [6]

Short answer: Use WebRTC from the Expo React Native client to the OpenAI Realtime API, authenticated with short‑lived ephemeral tokens minted by a Convex HTTP Action; reserve WebSockets for a separate server proxy if needed, since Convex isn’t suited to host long‑lived Realtime connections. [1][2][3]

## Why WebRTC here

- OpenAI explicitly recommends WebRTC for client apps because it handles mic capture and remote audio playback natively and supports low‑latency, bidirectional sessions for speech‑in/speech‑out. [1]
- Expo/React Native can use WebRTC via react‑native‑webrtc with an Expo config plugin and development builds; this works on iOS/Android but not inside Expo Go. [4][5]

## When to use WebSockets

- OpenAI also offers a Realtime WebSocket interface that’s commonly used from servers to stream audio/text events, but client environments are guided toward WebRTC for media ergonomics and resilience. [3][1]
- If a server has to mediate audio (telephony, PSTN bridges, or policy reasons), connect that server to OpenAI via WebSockets and proxy to the app, accepting extra latency and complexity. [3][6]

## Convex integration plan

- Implement a Convex HTTP Action that mints an ephemeral Realtime session token using the server API key and returns it to the mobile client; the client then uses this token to establish the WebRTC session directly with OpenAI. [1][2]
- Store the OpenAI server key and allowed client origin in Convex environment variables and add CORS headers in the HTTP Action per Convex’s guidance. [7][2]

## React Native setup notes

- Add react‑native‑webrtc and the Expo config plugin, build a dev client or EAS build, and then create an RTCPeerConnection, add the mic track, and post the SDP offer to the OpenAI Realtime endpoint with the ephemeral token. [4][5][1]
- Avoid relying on the current OpenAI Realtime JS SDK in React Native; React Native support has been reported as not working, so integrate the WebRTC flow directly. [8]

## Why not host the Realtime socket in Convex

- Convex HTTP Actions are standard HTTP request/response endpoints rather than long‑lived socket servers, making them ideal for minting tokens but not for terminating persistent audio sessions. [2]
- Convex does use WebSockets internally for its own sync with clients, but this mechanism is for Convex query subscriptions and is not a general‑purpose, user‑managed realtime proxy. [9][10]

## Bottom line

- For an Expo app with a Convex backend, the recommended path is WebRTC from the app to OpenAI Realtime, authenticated by ephemeral tokens minted by a Convex HTTP Action; only consider a separate server WebSocket proxy if product constraints require it. [1][2][3]
