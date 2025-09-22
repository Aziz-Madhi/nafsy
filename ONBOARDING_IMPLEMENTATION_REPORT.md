# Nafsy Onboarding Implementation Report

This document explains the new onboarding flow that precedes sign‑up and the post‑auth user profiling screens we implemented. It covers user experience, routing, state, backend schema, i18n, colors, and the React 19 stability fixes applied during development.

## Overview

- Goal: Introduce the app, then collect just enough structured context to personalize AI chat, mood insights, and exercises — without overwhelming users.
- Constraint: Keep onboarding to exactly four screens (no long forms, no free‑text fields).
- Approach: Multiple‑choice chips and one 1–10 slider; short, focused prompts; progressive disclosure.

## User Flow

1. Welcome (pre‑auth)

- Introduces Nafsy (AI chat, mood tracking, exercises)
- Actions: “Get Started” → Sign Up, “I already have an account” → Sign In

2. Sign In / Sign Up (auth)

- After sign up, users are routed into onboarding (post‑auth) until completed.

3. Onboarding (post‑auth, 3 steps + Summary)

- Profile: Name, Age, Gender, Struggles (chips)
- Mood: Today’s rating (1–10), Past month mood (single choice)
- Preferences: Goals (chips), You often feel (chips), Help areas (chips), Fears (chips)
- Complete: Review + persist selections to Convex; mark onboarding complete; go to main tabs

## Routing & Gating

- Pre‑auth stack adds `welcome` as initial screen when not signed in and `hasSeenIntro` is false.
  - File: `src/app/_layout.tsx`
- Post‑auth app layout redirects users with `onboardingCompleted === false` to `/onboarding/profile`.
  - File: `src/app/(app)/_layout.tsx`
- Onboarding routes:
  - `src/app/onboarding/_layout.tsx` (stack)
  - Steps: `profile.tsx`, `mood.tsx`, `preferences.tsx`, `complete.tsx`

## Screens

- Welcome (`src/app/welcome.tsx`)
  - Product intro with three feature cards
  - Uses color tokens and `useColors` for tints

- Profile (`src/app/onboarding/profile.tsx`)
  - Name (required), Age (optional), Gender (male/female/other)
  - Struggles (chips): sleep issues, stress, anxiety, low motivation, focus problems, loneliness

- Mood (`src/app/onboarding/mood.tsx`)
  - 1–10 mood rating (existing `RatingSelector`)
  - Past month mood (single choice): very low / low / average / good / very good

- Preferences (`src/app/onboarding/preferences.tsx`)
  - Goals (chips): reduce anxiety, improve sleep, build mindfulness, increase focus, emotional regulation, vent feelings
  - You often feel (chips): stressed, overwhelmed, curious, motivated, exhausted, hopeful
  - Help areas (chips): talk to someone, structured therapy guidance, breathing guidance, mindfulness practice, journaling prompts, daily check‑ins
  - Fears (chips): time commitment, privacy, stigma, not improving, feeling overwhelmed

- Complete (`src/app/onboarding/complete.tsx`)
  - Shows a concise summary of all answers
  - Persists to Convex via `auth.updateUser` (fallback to `auth.upsertUser`)
  - Sets `hasCompletedOnboarding` in local store and routes to `/tabs/chat`

## State Management

- `useAppStore` (`src/store/useAppStore.ts`)
  - Added flags: `hasSeenIntro`, `hasCompletedOnboarding`
  - Selectors for both; action setters are persisted via MMKV like other settings

- `useOnboardingStore` (`src/store/useOnboardingStore.ts`)
  - Ephemeral in‑memory store (non‑persisted) to avoid React 19 snapshot loops
  - Fields: `name`, `age`, `gender`, `moodRating`, `moodMonth`, `goals`, `selfImage`, `helpAreas`, `fears`, `struggles`, `step`
  - Actions: `setField`, `toggleArrayValue`, `reset`
  - Select only what you need per component (field‑level selectors)

Rationale: We deliberately kept onboarding answers out of persisted storage to avoid hydration identity churn and make the flow safe under React 19’s stricter `useSyncExternalStore` semantics.

## React 19 Stability Fixes

- Problem: “The result of getSnapshot should be cached” and “Maximum update depth exceeded” were triggered by selectors returning new objects and by persisted onboarding state.
- Fixes:
  - Swap onboarding to a non‑persisted store
  - Use field‑level selectors (no object aggregation in render)
  - Use `shallow` equality for any remaining aggregated selectors
  - Memoize `useColors()` result with `useMemo` (stable reference per theme)

Net effect: Onboarding screens render without snapshot churn or loops.

## Colors & UI Guidelines

- Follow unified color system:
  - Tailwind classes for backgrounds, borders, foregrounds (`bg-background`, `text-foreground`, `text-muted-foreground`)
  - `useColors()` only for React Native‑specific props (tints, shadows)
- Mood scale slider uses product‑specified 1–10 gradient palette
- Chips are implemented with existing `Button` variants to stay consistent

## i18n

- Added English keys for monthly mood (title + options)
- New sections (struggles, help areas, fears) currently use `t(key, fallback)` so they display clean, localized English even if the key is missing
- Arabic keys can be added to `src/locales/ar.json` following the same structure

Recommended follow‑up: add full translations for:

- `onboarding.profile.strugglesTitle` + `onboarding.profile.struggles.*`
- `onboarding.preferences.helpAreasTitle` + `onboarding.preferences.helpAreas.*`
- `onboarding.preferences.fearsTitle` + `onboarding.preferences.fears.*`

## Backend (Convex)

Schema (`convex/schema.ts`)

- `users` table augmented with optional fields:
  - `age`, `gender`, `onboardingCompleted`
  - `moodLastMonth: string`
  - `goals: string[]`, `selfImage: string[]`, `helpAreas: string[]`, `fears: string[]`, `struggles: string[]`

Auth API (`convex/auth.ts`)

- `upsertUserHelper`: updates/inserts new profile and onboarding fields
- `upsertUser` and `updateUser`: accept new optional fields
- `getCurrentUser` and `getUserByClerkId`: return new fields; duplicate keys were removed during TS cleanup

Gating Logic

- When a user is first created in app layout, we mark `onboardingCompleted: false`
- App layout redirects such users into `/onboarding/profile`
- On completion, we set `onboardingCompleted: true` and redirect to `/tabs/chat`

## Files Touched

- Routing/UI
  - `src/app/_layout.tsx`
  - `src/app/(app)/_layout.tsx`
  - `src/app/welcome.tsx`
  - `src/app/onboarding/_layout.tsx`
  - `src/app/onboarding/profile.tsx`
  - `src/app/onboarding/mood.tsx`
  - `src/app/onboarding/preferences.tsx`
  - `src/app/onboarding/complete.tsx`

- State
  - `src/store/useAppStore.ts`
  - `src/store/useOnboardingStore.ts`
  - `src/store/index.ts`
  - `src/hooks/useColors.ts` (memoized return)

- Backend (Convex)
  - `convex/schema.ts`
  - `convex/auth.ts`

- i18n
  - `src/locales/en.json` (monthly mood additions)

## Data Model Snapshot (users)

```
users: {
  clerkId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  language: 'en' | 'ar';
  age?: number;
  gender?: string;
  onboardingCompleted?: boolean;
  moodLastMonth?: string;                      // 'very_low' | 'low' | 'average' | 'good' | 'very_good'
  goals?: string[];                            // see Preferences > goals
  selfImage?: string[];                        // see Preferences > selfImage
  helpAreas?: string[];                        // see Preferences > helpAreas
  fears?: string[];                            // see Preferences > fears
  struggles?: string[];                        // see Profile > struggles
  createdAt: number;
  lastActive: number;
}
```

## How to Run Locally

- Install deps if needed: `bun install`
- Regenerate Convex types and run local dev server: `bun convex:dev`
- Start the app (you run it): `bun start`
- If Metro cache interferes: `bun start:clear`

## Validation Checklist

- Pre‑auth welcome shows before sign‑in when `hasSeenIntro === false`
- Sign‑up routes to onboarding; existing users skip onboarding
- All onboarding chips toggle and persist through the flow until completion
- Completion persists data in Convex (check `users` document)
- App routes to `/tabs/chat` after finishing, and no more onboarding prompts

## Security & Privacy Notes

- Only minimal personal data is stored: name, age, gender (optional)
- Onboarding selections augment profile to tailor experiences; no free‑text capture
- Data lives under the user’s `users` document; access controlled by Clerk identity in Convex endpoints

## Future Enhancements

- Personalization hooks: use onboarding data to seed AI chat prompts and exercise recommendations
- Full EN/AR translations for newly added sections
- Optional: analytics/telemetry on completion rate and choice distributions (respecting privacy)
- Add “Skip for now” path with soft reminders (if product wants even less friction)

---

If you want, I can now add the missing EN/AR translation keys or wire personalization (AI prompt bootstrapping and exercise biasing) using these fields.
