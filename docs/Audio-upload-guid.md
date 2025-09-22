+# Nafsy Audio Upload & Language Configuration Guide

- +This guide explains how we host exercise audio in Cloudflare R2, upload new files using short‑lived signed URLs from Convex, and serve the correct language (English/Arabic) in the app.
- +The implementation uses a single `exercises` table. Each exercise can have:
  +- `audioKey` (English) — existing field kept for back‑compat
  +- `audioKeyAr` (Arabic)
- +At playback time the client asks Convex for a signed GET URL for the user’s current language. If that language is missing, Convex falls back to the other language automatically.
- +---
- +## Prerequisites
- +- Cloudflare R2 credentials configured on Convex (component already installed):
- - `R2_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET`
    +- Convex functions present:
- - `r2.generateUploadUrlWithCustomKey`
- - `r2.linkExerciseAudio` (English)
- - `r2.linkExerciseAudioLang` (English/Arabic)
- - `r2.getExerciseAudioUrl` (accepts optional `lang: '"'"'en'"'"' | '"'"'ar'"'"'`)
    +- Expo app uses `useTranslation()` to get the current language; playback requests a URL for that language.
- +> Deploy Convex after schema/function changes: `bun convex:dev`
- +---
- +## Key Design
- +- Single source of truth: one exercise document per exercise.
  +- Per‑language audio keys on the same doc (`audioKey`, `audioKeyAr`).
  +- Deterministic object keys in R2 for consistency:
- - `audio/exercises/<slug>-v<version>-<lang>.mp3`
- - Examples:
- - `audio/exercises/what-would-make-today-great-morning-intention-setting-v1-en.mp3`
- - `audio/exercises/what-would-make-today-great-morning-intention-setting-v1-ar.mp3`
    +- Avoid spaces/quotes in keys. Use lowercase kebab‑case.
- +---
- +## End‑to‑End Workflow
- +### 1) Pick or create the Exercise
- +- List existing exercises (via MCP/Convex or in the dashboard) to find the target exercise `_id`.
  +- If needed, create a new exercise first (title/description exist in both EN/AR fields).
- +### 2) Generate a signed PUT URL (per file)
- +Use Convex to generate a short‑lived signed upload URL for your chosen object key.
- +Example (English key):
  +```ts
  +await api.r2.generateUploadUrlWithCustomKey({
- key: '"'"'audio/exercises/affirmation-writing-positive-self-statement-v1-en.mp3'"'"',
  +});
  +```
- +Example (Arabic key):
  +```ts
  +await api.r2.generateUploadUrlWithCustomKey({
- key: '"'"'audio/exercises/affirmation-writing-positive-self-statement-v1-ar.mp3'"'"',
  +});
  +```
- +> Signed PUT URLs expire (default ~15 minutes). If they expire before you upload, just generate a new one.
- +### 3) Upload the file to R2
- +Use `curl` with the signed URL from step 2.
- +```bash
  +curl -X PUT -H '"'"'Content-Type: audio/mpeg'"'"' \
- --data-binary @/absolute/path/to/file.mp3 \
- "<SIGNED_PUT_URL>"
  +```
- +Repeat for each file/language.
- +### 4) Link the uploaded key to the exercise
- +- English audio:
  +```ts
  +await api.r2.linkExerciseAudio({
- exerciseId: '"'"'<exerciseId>'"'"',
- key: '"'"'audio/exercises/<slug>-v1-en.mp3'"'"',
  +});
  +```
- +- Arabic audio:
  +```ts
  +await api.r2.linkExerciseAudioLang({
- exerciseId: '"'"'<exerciseId>'"'"',
- lang: '"'"'ar'"'"',
- key: '"'"'audio/exercises/<slug>-v1-ar.mp3'"'"',
  +});
  +```
- +You can relink at any time to replace audio; the app will use the latest linked key.
- +### 5) Verify playback (signed GET)
- +Request a signed GET URL for the desired language (the client does this automatically at playback).
- +```ts
  +const url = await api.r2.getExerciseAudioUrl({
- exerciseId: '"'"'<exerciseId>'"'"',
- lang: '"'"'ar'"'"', // or '"'"'en'"'"'
- expiresIn: 60 _ 60 _ 6, // 6h
  +});
  +```
- +Open the URL in a browser or stream in the app.
- +---
- +## Client Behavior (Language Switching)
- +- The app derives language from `useTranslation()` (`currentLanguage`).
  +- On exercise tap, it calls `r2.getExerciseAudioUrl({ exerciseId, lang })` where:
- - `lang = '"'"'ar'"'"'` if the current language starts with `ar`, else `'"'"'en'"'"'`.
    +- Server fallback:
- - If the requested language key is missing, Convex returns the other language if available; otherwise `null`.
    +- No duplicate exercises: one list entry per exercise; audio language changes with the app language.
- +---
- +## Naming & Conventions
- +- Keys: `audio/exercises/<kebab-slug>-v<version>-<lang>.mp3`
  +- Language codes: `en`, `ar` only.
  +- Versions: bump `v1 → v2` if you replace a recording; relink after upload.
  +- Content‑Type: `audio/mpeg` for `.mp3`.
- +---
- +## Troubleshooting
- +- 403 on upload: Signed PUT likely expired — regenerate and retry.
  +- 403 on playback: Signed GET expired — the app always requests fresh URLs; if testing manually, request a new one.
  +- No audio plays in Arabic: Ensure `audioKeyAr` is linked for that exercise. Use `getExerciseAudioUrl({ lang: '"'"'ar'"'"' })` to verify it returns a URL.
  +- Wrong language heard: Confirm the app language and that the request passes `lang` correctly.
- +---
- +## Common Tasks
- +- Replace English audio only:
- 1.  Generate signed PUT for `...-en.mp3`
- 2.  Upload
- 3.  `linkExerciseAudio({ exerciseId, key })`
- +- Add Arabic to an existing English‑only exercise:
- 1.  Generate signed PUT for `...-ar.mp3`
- 2.  Upload
- 3.  `linkExerciseAudioLang({ exerciseId, lang: '"'"'ar'"'"', key })`
- +- Move an exercise to “Reminders” category:
- - Update `exercises.updateExercise({ exerciseId, category: '"'"'reminders'"'"' })`
- +---
- +## Admin Notes
- +- Only developers should upload/link audio — end users never upload.
  +- Keep deterministic keys; avoid spaces/quotes in filenames when choosing the R2 key.
  +- Backups: store masters in the repo or a separate bucket; R2 holds the serving copies.
- +---
- +## Appendix — Example Mapping
- +Example keys used in production for English/Arabic pairs:
- +- What Would Make Today Great?
- - EN: `audio/exercises/what-would-make-today-great-morning-intention-setting-v3-en.mp3`
- - AR: `audio/exercises/what-would-make-today-great-morning-intention-setting-v1-ar.mp3`
    +- Affirmation Writing
- - EN: `audio/exercises/affirmation-writing-positive-self-statement-v1-en.mp3`
- - AR: `audio/exercises/affirmation-writing-positive-self-statement-v1-ar.mp3`
    +- Body Scan Meditation
- - EN: `audio/exercises/body-scan-meditation-v1-en.mp3`
- - AR: `audio/exercises/body-scan-meditation-v2-ar.mp3`
    +- Evening Reflection
- - EN: `audio/exercises/evening-reflection-daily-highlights-journal-v1-en.mp3`
- - AR: `audio/exercises/evening-reflection-daily-highlights-journal-v1-ar.mp3`
    +- Guided Visualization
- - EN: `audio/exercises/guided-visualization-v2-en.mp3`
- - AR: `audio/exercises/guided-visualization-v1-ar.mp3`
    +- Loving‑Kindness Meditation
- - EN: `audio/exercises/loving-kindness-meditation-v2-en.mp3`
- - AR: `audio/exercises/loving-kindness-meditation-v1-ar.mp3`
    +- Five Senses Grounding
- - EN: `audio/exercises/mindfulness-exercises-five-senses-grounding-v2-en.mp3`
- - AR: `audio/exercises/mindfulness-exercises-five-senses-grounding-v2-ar.mp3`
    +- Progressive Muscle Relaxation
- - EN: `audio/exercises/progressive-muscle-relaxation-v2-en.mp3`
- - AR: `audio/exercises/progressive-muscle-relaxation-v1-ar.mp3`
- +This mapping demonstrates the deterministic naming pattern and how versions can differ by language.
