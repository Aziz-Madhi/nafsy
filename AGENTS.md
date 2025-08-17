## Project Overview

**Nafsy** is a mental health React Native app built with Expo, featuring AI-powered chat, mood tracking, wellness exercises, and multilingual support (English/Arabic). The app uses Clerk for authentication, Convex for real-time backend, and follows iOS design patterns.

You are an expert in TypeScript, React Native, Expo, Tailwind CSS, Nativewind v4, and React Native Reanimated 4 development.

## Development Commands

### Core Development
- `bun start` - Start the Expo development server
- `bun start:clear` - Start with cleared cache
- `bun android` - Run on Android device/emulator
- `bun ios` - Run on iOS device/simulator (ASK FOR CONFIRMATION first)
- `bun web` - Run on web browser

### Code Quality & Testing
- `bun lint` - Run ESLint checks
- `bun lint:fix` - Run ESLint with auto-fix
- `bun format` - Format code with Prettier
- `bun test` - Run Jest tests
- `bun test:watch` - Run tests in watch mode

### Backend & Cache
- `bun convex:dev` - Start Convex development server
- `bun convex:deploy` - Deploy Convex functions to production
- `bun clean` - Remove .expo, node_modules cache, and metro cache
- `bun clean-full` - Full clean including node_modules and bun.lock, then reinstall

## Architecture Overview

### Tech Stack
- **Frontend**: React Native 0.79.5 with Expo SDK 53 (New Architecture enabled) 
- **React**: React 19.0.0 and React DOM 19.0.0
- **Routing**: Expo Router v5 with typed routes
- **Styling**: Nativewind v4 (Tailwind CSS for React Native) with unified color system
- **State Management**: Zustand with MMKV persistence via store factory pattern
- **Backend**: Convex (real-time database and functions)
- **Authentication**: Clerk with custom provider setup
- **Localization**: i18next and react-i18next with RTL support
- **Package Manager**: Bun

### Project Structure
```
src/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout with providers
│   ├── tabs/              # Tab navigation
│   │   ├── chat.tsx       # Main chat screen
│   │   ├── mood/          # Mood tracking screens
│   │   └── exercises/     # Wellness exercises screens
│   ├── auth/              # Authentication screens
│   └── settings.tsx       # App settings screen
├── components/            # Reusable UI components
│   ├── chat/              # Chat-related components
│   ├── exercises/         # Exercise components
│   ├── mood/              # Mood tracking components
│   ├── navigation/        # Navigation components
│   └── ui/                # Base UI components
├── store/                 # Zustand stores with MMKV persistence
├── lib/                   # Utilities and core functionality
├── hooks/                 # Custom React hooks
├── providers/             # React context providers
└── locales/               # i18n translation files
```

### State Management
- **Store Factory Pattern**: `createPersistedStore()` factory in `~/lib/store-factory` for consistent MMKV persistence
- **Primary Stores**:
  - `useAppStore`: Global app state, themes, settings, language
  - `useChatUIStore`: Chat UI state, session management, floating chat
- **MMKV Integration**: Custom `mmkv-storage.ts` with encryption and error handling

### Database Schema (Convex)
- **Dual Chat System**: `mainChatMessages` (therapy sessions) and `ventChatMessages` (quick vents)
- **Session Management**: `chatSessions` and `ventChatSessions` for conversation metadata
- **User Data**: `users` (Clerk integration), `moods` (5 types), `exercises` (5 categories), `userProgress`
- **Multilingual**: Full Arabic/English support in exercise content and UI

### Key Features
1. **AI Chat**: Two types - structured therapy sessions and quick emotional vents
2. **Mood Tracking**: Daily mood logging with 5 mood types (happy, sad, anxious, neutral, angry)
3. **Wellness Exercises**: 5 categories (breathing, mindfulness, journaling, movement, relaxation)
4. **Multilingual**: Full Arabic/English support with RTL layout
5. **Real-time**: Live chat updates via Convex subscriptions
6. **Offline Support**: MMKV caching for offline functionality

## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples
- Use functional and declarative programming patterns; avoid classes
- Prefer iteration and modularization over code duplication
- Use TypeScript for all code; prefer interfaces over types
- Avoid enums; use maps instead
- Use the "function" keyword for pure functions
- Use declarative JSX and Prettier for consistent formatting

## Color System Architecture

The app uses a unified color system with CSS variables as the single source of truth.

### Usage Guidelines
- **Use Tailwind Classes for 90% of Components**: `bg-primary`, `text-mood-happy`, `bg-card-elevated`
- **Use useColors Hook for React Native Specific Components**: Only for SymbolView tintColor, shadowColor, etc.

### Available Color Categories
- **Core Colors**: `primary`, `secondary`, `background`, `foreground`, `card`
- **State Colors**: `success`, `warning`, `error`, `info`
- **Mood Colors**: `mood-happy`, `mood-sad`, `mood-anxious`, `mood-neutral`, `mood-angry`
- **Wellness Colors**: `wellness-mindfulness`, `wellness-breathing`, `wellness-movement`
- **Navigation Colors**: `tab-active`, `tab-inactive`
- **Chat Colors**: `chat-bubble-user`, `chat-bubble-ai`

## Key Principles and Workflow Guidance

- If you are given a task, don't overcomplicate it. Do a simple approach first
- When given an error or problem to fix, try a simple fix first
- Do not run an iOS build. Always ask for confirmation before proceeding with iOS builds
- Use `bun` as the package manager, not npm or yarn
- MMKV provides synchronous storage - prefer it over AsyncStorage
- Use `expo-router` for navigation - all routes are file-based
- **Important Development Tip**: Do not start a dev server. Tell the user to do it

## Convex Development Notes

- Convex functions are located in the `convex/` directory
- Schema is defined in `convex/schema.ts` with indexed tables
- Available Convex modules: auth, chat, exercises, moods, users, mainChat, ventChat, userProgress
- Use MCP tools for Convex operations: `mcp__convex__*` functions for database queries and management

## Testing Framework

- Jest configuration in `jest.config.js` with jsdom test environment
- Module aliases: `@/` and `~/` point to `src/` directory
- Coverage collection from `src/**/*.{ts,tsx}` excluding index and type files
- Store testing: Focus on MMKV persistence, hydration, and error scenarios

# Important Instructions

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

When tasked with changing the coloring of specific components, make sure to follow the unified color system that is being implemented.

## Project Structure & Module Organization

- Source: `src/` (routes in `src/app`, UI in `src/components`, state in `src/store`, utilities in `src/lib`, providers in `src/providers`, config in `src/config`).
- Backend (Convex): `convex/` (functions, schema, generated API types).
- Tests: `src/__tests__/` (use `*.test.ts` / `*.test.tsx`).
- Assets: `assets/` (images, fonts); platform projects: `android/`, `ios/`.

## Build, Test, and Development Commands

- `npm install` or `bun install`: install dependencies.
- `npm run start`: start Expo dev server; `npm run web` for web.
- `npm run android` / `npm run ios`: run on device/simulator (Expo dev client required).
- `npm run convex:dev`: start Convex local dev; `npm run convex:deploy` to deploy.
- `npm test` / `npm run test:watch` / `npm run test:coverage`: run Jest tests.
- `npm run lint` / `npm run lint:fix`: lint code; `npm run format` to Prettier-format.

## Coding Style & Naming Conventions

- Language: TypeScript, React Native + Expo Router.
- Formatting: Prettier (2 spaces, single quotes, semicolons, 80 char width).
- Linting: ESLint (`eslint-config-expo`, Prettier plugin). Fix before PRs.
- Naming: PascalCase for React components/files (e.g., `ChatScreen.tsx`), camelCase for functions/vars, SCREAMING_SNAKE_CASE for constants. Keep folders lowercase.

## Testing Guidelines

- Frameworks: Jest + `@testing-library/react-native` and `jest-native` matchers.
- Place tests in `src/__tests__/` or alongside modules using `*.test.ts(x)`.
- Prefer behavior-focused tests; mock platform/Convex calls where needed.
- Run `npm test` locally; maintain meaningful coverage for changed code.

## Commit & Pull Request Guidelines

- Commits: imperative mood, concise summary (<= 72 chars), optional scope (e.g., "chat:"), descriptive body when needed.
- PRs: include clear description, linked issues (`Fixes #123`), screenshots/GIFs for UI changes, test plan (devices/platforms), and notes on Convex or env changes.
- Ensure: builds locally, lints clean, tests pass, and no unused files.

## Security & Configuration Tips

- Secrets/keys: never commit; use `.env` and reference through `src/config/env.ts` or platform configs.
- Verify Convex auth settings in `convex/auth.config.js`; app config in `app.config.ts`.
- For RTL/i18n changes, validate Arabic/English flows and layout direction.
