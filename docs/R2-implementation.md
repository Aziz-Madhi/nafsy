# Nafsy Audio + Cloudflare R2 — End‑to‑End Implementation Report

This report documents everything implemented to deliver reliable in‑app audio playback with files hosted on Cloudflare R2 and integrated through Convex. It covers setup, architecture, code locations, navigation changes, and operational notes so we can maintain and extend the feature confidently.

---

## 0) High‑level Outcomes

- Playback uses Expo Audio (expo-audio) with a global provider and full‑screen modal UI.
- Audio files live in Cloudflare R2. Clients stream via short‑lived signed GET URLs returned by Convex (no Convex bandwidth).
- Exercises navigation was refactored to avoid stacked modals (the root cause of intermittent freezes). Category and detail are pushed screens; the audio player is the only modal on top.
- Developer‑only upload flow added (signed PUT URL + metadata sync) with a stable linking field `exercises.audioKey`.

---

## 1) Dependencies & Versions (as of implementation)

- Expo SDK 53 / React Native 0.79.5
- `expo-audio` ~0.4.x
- `expo-blur` for backdrop blur
- `lucide-react-native` icons
- `@convex-dev/r2` component for Cloudflare R2
- `expo-router` v5

---

## 2) Backend (Convex) — Cloudflare R2 Integration

### 2.1 Component install

`convex/convex.config.ts`
```ts
import { defineApp } from 'convex/server';
import r2 from '@convex-dev/r2/convex.config';

const app = defineApp();
app.use(r2);
export default app;
```

Environment (Convex): `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`.

### 2.2 Server functions

`convex/r2.ts`
- `r2 = new R2(components.r2)`
- Upload (developer‑only):
  - `generateUploadUrl` (clientApi)
  - `generateUploadUrlWithCustomKey(key)` → `{ key, url }` (signed PUT)
  - `syncMetadata({ key })` (optional bookkeeping)
- Serving:
  - `getFileUrl(key, expiresIn?)` → signed GET URL
  - `getExerciseAudioUrl(exerciseId, expiresIn?)` → lookup `audioKey` then return a signed GET URL
- Linking:
  - `linkExerciseAudio({ exerciseId, key })` → writes `audioKey` to `exercises`
- Utilities:
  - `removeExerciseAudioStorageId`, `deleteExerciseById`

### 2.3 Schema & validators

`convex/schema.ts`
- `exercises` table includes `audioKey?: string`.

`convex/exercises.ts`
- All query return validators include optional `audioKey` to avoid `ReturnsValidationError` when linked.

### 2.4 Developer upload + link flow

We do NOT allow end‑user upload. A developer attaches audio to an exercise:

1) Generate PUT URL (via MCP/Convex):
```ts
await api.r2.generateUploadUrlWithCustomKey({
  key: 'audio/exercises/<exerciseId>.mp3',
});
```
2) Upload locally:
```bash
curl -X PUT -H 'Content-Type: audio/mpeg' \
  --data-binary @/absolute/path/to/file.mp3 "<signed_put_url>"
```
3) Sync metadata (optional):
```ts
await api.r2.syncMetadata({ key: 'audio/exercises/<exerciseId>.mp3' });
```
4) Link to exercise:
```ts
await api.r2.linkExerciseAudio({
  exerciseId: '<id>',
  key: 'audio/exercises/<exerciseId>.mp3',
});
```
5) Playback (client): request a signed GET URL when starting playback:
```ts
const url = await convex.query(api.r2.getExerciseAudioUrl, {
  exerciseId: '<id>',
  expiresIn: 60 * 60 * 6, // 6h
});
```

> Tip: Use deterministic keys like `audio/exercises/<exerciseId>.<ext>`.

---

## 3) Frontend — Audio Infrastructure

### 3.1 Global provider

`src/providers/AudioPlayerProvider.tsx`

Responsibilities:
- Create and manage a single `expo-audio` player.
- Configure audio session on start and fully release it on close.
- Track `isPlaying`, `positionMillis`, `durationMillis` from `playbackStatusUpdate`.
- Present a full‑screen modal with blurred category background, seek bar, play/pause, ±10s, and speed toggle.

Public API:
```ts
interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string; // category label for backdrop
  icon?: string;     // emoji for header circle
  color?: string;    // accent for play/progress
  durationSeconds?: number;
  sourceUri?: string; // signed R2 url
  onClose?: () => void; // optional callback after close
}

interface AudioPlayerContextValue {
  isVisible: boolean;
  isPlaying: boolean;
  track: AudioTrack | null;
  positionMillis: number;
  durationMillis: number;
  open(track: AudioTrack): Promise<void>;
  close(): Promise<void>;
  togglePlay(): Promise<void>;
}
```

Lifecycle:
- Start
  - `setAudioModeAsync({ playsInSilentMode: true, … })`
  - `setIsAudioActiveAsync(true)`
  - `player = createAudioPlayer(null, 250)`
  - `player.replace({ uri })`; `player.play()`
- Close
  - `player.pause()` → `player.replace(null)` → `player.remove()`
  - `setIsAudioActiveAsync(false)` → clear state → call `track.onClose?.()`

UI highlights:
- Full‑screen modal (fade), blurred category image (expo-blur), Lucide icons (Play, Pause, RotateCcw, RotateCw, X), tap‑to‑seek, speed cycle (x1 → x1.25 → x1.5 → x2).

### 3.2 Why expo‑audio (not expo‑av)
- Simpler player lifecycle for SDK 53.
- The issue “setAudioModeAsync of undefined” occurred when using expo‑av imports. Switching to expo‑audio fixed it.

---

## 4) Frontend — Navigation & Screens

To eliminate modal stacking (root cause of freezes), we use pushed screens for browsing; the audio player is the only modal.

`src/app/(app)/tabs/exercises/_layout.tsx`
- All screens: `presentation: 'card'`, `animation: 'slide_from_right'`.
- Routes:
  - `index` — exercises landing
  - `category/[id]` — category list
  - `exercise/[id]` — exercise detail

`src/app/(app)/tabs/exercises/category/[id].tsx`
- Lists exercises and pushes to detail: `router.push('/tabs/exercises/exercise/<id>')`.
- Safe‑area top padding added for back chevron.

`src/app/(app)/tabs/exercises/exercise/[id].tsx`
- Fetches exercise via `api.exercises.getExercise`.
- Shows description, steps, meta, and Start button.
- On Start: requests signed URL via `api.r2.getExerciseAudioUrl`, then `useAudioPlayer().open({...})`; records completion via `api.userProgress.recordCompletion`.

Result: Only one modal (audio player) at a time. No invisible modal intercepting touches.

---

## 5) Troubleshooting & Pitfalls

- UI froze while audio played: caused by stacked modals. Fixed by pushing category/detail as screens and keeping a single audio modal.
- `ReturnsValidationError: extra field audioKey`: include `audioKey?: string` in every exercise query return validator.
- Expo AV vs Expo Audio: ensure imports come from `expo-audio`; do not use `Audio.Sound.createAsync` API from expo‑av.
- Audio not stopping on close: call `pause()`, `replace(null)`, `remove()`, then `setIsAudioActiveAsync(false)`.

---

## 6) Quick Reference — Admin upload/link

1. `r2.generateUploadUrlWithCustomKey({ key })`
2. PUT upload with proper `Content-Type`
3. `r2.syncMetadata({ key })` (optional)
4. `r2.linkExerciseAudio({ exerciseId, key })`
5. Client Start → `r2.getExerciseAudioUrl({ exerciseId, expiresIn })` → `useAudioPlayer().open({ sourceUri })`

---

## 7) Future Enhancements

- Drag scrubbing (PanResponder) with haptics
- Fade in/out on play/pause
- Optional dim of the detail page when the audio modal opens
- Offline download (local cache) for selected exercises
- Restore strict auth in `convex/r2.ts` before production

---

## 8) File Map

Backend:
- `convex/convex.config.ts` — R2 component
- `convex/r2.ts` — upload/link/serve functions
- `convex/schema.ts` — `exercises.audioKey`
- `convex/exercises.ts` — validators include `audioKey`

Frontend:
- `src/providers/AudioPlayerProvider.tsx` — player + UI
- `src/app/(app)/tabs/exercises/_layout.tsx` — stack as card screens
- `src/app/(app)/tabs/exercises/index.tsx` — landing
- `src/app/(app)/tabs/exercises/category/[id].tsx` — category
- `src/app/(app)/tabs/exercises/exercise/[id].tsx` — detail

