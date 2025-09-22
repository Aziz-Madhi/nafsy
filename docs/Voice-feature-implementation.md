# Voice Feature – Realtime Implementation Report

## Overview

- Goal: Add low‑latency, speech‑to‑speech AI to Nafsy using OpenAI Realtime.
- Approach: Keep all model/prompt configuration on the server (Convex), mint ephemeral client secrets from a Convex action, and connect directly from the client to OpenAI via WebRTC.
- Scope covered here: server schema + functions, client integration (WebRTC), permissions/build, UI overlay, configuration and operations.

## High‑Level Architecture

- Server (Convex):
  - Dedicated voice configuration table decoupled from chat personalities (`voiceRealtimeConfig`).
  - Public query/mutation to manage voice config (`voiceRealtime.getConfig`, `voiceRealtime.updateConfig`).
  - Action to mint an ephemeral Realtime client secret (`chat.mintRealtimeClientSecret`) using that config.
  - Rate limit on secret minting via `authOpDefault` bucket.
- Client (React Native):
  - WebRTC call to OpenAI using ephemeral secret; audio‑only (`react-native-webrtc`).
  - Hook `useRealtimeVoice` to manage session lifecycle.
  - UI `VoiceOverlay` with animated equalizer + Stop control.

## Server‑Side Changes (Convex)

### Schema: `voiceRealtimeConfig`

- File: `convex/schema.ts`
- Purpose: Single active, global config for the voice feature (not tied to personalities).
- Fields:
  - `source`: `openai_prompt_latest | openai_prompt_pinned`
  - `openaiPromptId`: `pmpt_...` (required)
  - `openaiPromptVersion`: number (required when `source` is pinned)
  - `model`: Realtime‑capable model (ex: `gpt-realtime`)
  - `defaultVoice?`: default OpenAI voice (ex: `verse`, `marin`)
  - Optional generation knobs: `temperature?`, `maxTokens?`, `topP?`
  - Metadata: `active`, `version`, `createdAt`, `updatedAt`, `updatedBy?`

### Voice config API

- File: `convex/voiceRealtime.ts`
- `voiceRealtime.getConfig` (query): returns the single active config.
- `voiceRealtime.updateConfig` (mutation): validates inputs, deactivates prior active config, inserts a new version.
  - Enforces presence of `openaiPromptId` (and `openaiPromptVersion` for pinned).

### Ephemeral secret action

- File: `convex/chat.ts`
- Export: `mintRealtimeClientSecret` (action)
- Function: Authenticates the user, checks rate limit, reads `voiceRealtimeConfig`, and calls OpenAI to mint a client secret:
  - POST `https://api.openai.com/v1/realtime/client_secrets` with `{ session: { type: 'realtime', model, audio.output.voice } }`.
  - Returns `{ client_secret, expires_at, session, prompt?, promptSource }`.
  - If the voice config uses an OpenAI Prompt, a `prompt` reference (`{ id, version? }`) is returned for the client to send via `session.update` once connected.
- Env required: `OPENAI_API_KEY`. Optional: `OPENAI_REALTIME_VOICE` (used when config has no `defaultVoice`).

### Removed (early iteration)

- We initially added an HTTP route `/realtime/client-secret` to mint secrets; this has been removed. We now exclusively use the Convex action above.

## Client‑Side Changes (React Native)

### Dependencies & permissions

- Added: `react-native-webrtc@^124.0.6` (native module, requires dev build; Expo Go won’t work).
- iOS: `app.config.ts` → `ios.infoPlist.NSMicrophoneUsageDescription` (and recommend `NSCameraUsageDescription` for safety).
- Android: `RECORD_AUDIO` (and optionally `MODIFY_AUDIO_SETTINGS`).

### WebRTC session hook

- File: `src/hooks/useRealtimeVoice.ts`
- Responsibilities:
  - Calls `api.chat.mintRealtimeClientSecret` to obtain `{ client_secret, session, prompt? }`.
  - Creates `RTCPeerConnection`, opens a data channel `oai-events`.
  - Captures mic via `mediaDevices.getUserMedia({ audio: true })` and adds tracks.
  - Creates an SDP offer and posts it to `POST /v1/realtime/calls?model=<session.model>` with `Authorization: Bearer <client_secret>` and `Content-Type: application/sdp`.
  - Sets remote SDP answer; remote audio begins playing ontrack.
  - If a `prompt` ref exists, sends `{ "type":"session.update", "session": { "type":"realtime", "prompt": { id, version? } } }` over the data channel.
  - Exposes `{ isActive, error, start, stop }`.

### UI overlay

- File: `src/components/chat/VoiceOverlay.tsx`
- Animated 5‑bar equalizer, title/subtitle, and a Stop button.
- Appears while a voice session is active; Stop tears down the session.

### Chat screen integration

- File: `src/app/(app)/tabs/chat.tsx`
- The mic button triggers `useRealtimeVoice().start(...)` and shows `VoiceOverlay` when connected.
- Overlay Stop calls `useRealtimeVoice().stop()`.
- The screen cleans up the voice session on unmount.

## Configuration: Prompt ID & Model

### How to set Prompt ID (recommended path)

- Use the Convex Dashboard (dev/prod) → Functions → `voiceRealtime.updateConfig`.
- Provide one of the bodies below.

Use latest published prompt:

```json
{
  "source": "openai_prompt_latest",
  "openaiPromptId": "pmpt_XXXX",
  "model": "gpt-realtime",
  "defaultVoice": "verse"
}
```

Pin a specific version:

```json
{
  "source": "openai_prompt_pinned",
  "openaiPromptId": "pmpt_XXXX",
  "openaiPromptVersion": 3,
  "model": "gpt-realtime",
  "defaultVoice": "marin"
}
```

Notes:

- The mutation validates inputs, writes metadata, and deactivates any previous record.
- Verify via `voiceRealtime.getConfig` (Functions tab): it should return `source`, `openaiPromptId`, optional `openaiPromptVersion`, `model`, and `defaultVoice?`.

## Build & Run Notes

- Use a development build (dev client), not Expo Go, because WebRTC is a native module.
- iOS Simulator build after adding Info.plist keys:
  - Run a clean prebuild if permissions were added: `npx expo prebuild --clean --platform ios`.
  - `bun ios` to build and run on Simulator (ask to proceed for device builds).
- Android dev client:
  - `bun android` to build and install.
- Start the dev server separately: `bun start` (you run this).

### iOS TCC crash (fixed)

- Symptom: app crashes with “attempted to access privacy‑sensitive data… NSMicrophoneUsageDescription”.
- Cause: running a binary without the Info.plist mic usage string.
- Fix: add `NSMicrophoneUsageDescription` to `app.config.ts`, clean prebuild, and rebuild the dev client.

## Usage Flow in App

1. User taps mic button (no text in composer).
2. Client calls `api.chat.mintRealtimeClientSecret`.
3. `useRealtimeVoice` creates a WebRTC connection to OpenAI, applies the prompt ref via `session.update`.
4. The `VoiceOverlay` opens and animates while connected.
5. User taps Stop → session is torn down and overlay closes.

## Security & Limits

- Ephemeral secrets are minted server‑side with `OPENAI_API_KEY` and returned directly to the device; the secret is short‑lived and used immediately.
- Rate limit applied via `authOpDefault` limiting secret issuance per user.
- No realtime media relaying or long‑lived sockets on Convex; the audio stream is client ↔ OpenAI directly.

## Files Touched

- Convex (server)
  - `convex/schema.ts`: added `voiceRealtimeConfig`.
  - `convex/voiceRealtime.ts`: `getConfig`, `updateConfig`.
  - `convex/chat.ts`: `mintRealtimeClientSecret` action updated to read voice config; removed personality coupling.
  - `convex/http.ts`: removed the temporary `/realtime/client-secret` HTTP endpoint.
- Client (app)
  - `package.json`: `react-native-webrtc@^124.0.6`.
  - `app.config.ts`: iOS/Android microphone permissions.
  - `src/hooks/useRealtimeVoice.ts`: WebRTC session manager.
  - `src/components/chat/VoiceOverlay.tsx`: overlay UI.
  - `src/app/(app)/tabs/_layout.tsx`: added `startVoiceRef` to route mic presses.
  - `src/app/(app)/tabs/chat.tsx`: integrated voice start/stop + overlay.

## Known Limitations / Next Steps

- No voice activity detection (VAD) yet; press‑to‑talk or auto‑end could be added.
- No explicit audio routing (earpiece vs speaker) controls; can integrate with your `expo-audio` provider.
- Add a visible mic level waveform using the local stream for better feedback.
- Optional telemetry for voice sessions (duration, success) similar to `aiTelemetry` for text.
- Optional: separate rate‑limit bucket (e.g., `realtimeSecrets`).

## Quick FAQ

- Why a Convex action instead of HTTP? Actions safely access secrets and are ideal for short minting calls; we don’t need public endpoints.
- Why not store inline prompts? We removed them for voice; only Prompt IDs are supported to keep config centralized and editable without code changes.
- Why a dev build? WebRTC is a native module and requires a compiled client; Expo Go can’t load it.
