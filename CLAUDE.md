# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### Code Quality

- `bun lint` - Run ESLint checks
- `bun lint:fix` - Run ESLint with auto-fix
- `bun format` - Format code with Prettier
- `bun format:check` - Check if code is properly formatted

### Testing

- `bun test` - Run Jest tests
- `bun test:watch` - Run tests in watch mode
- `bun test:coverage` - Run tests with coverage report

### Backend (Convex)

- `bun convex:dev` - Start Convex development server
- `bun convex:deploy` - Deploy Convex functions to production

### Cache Management

- `bun clean` - Remove .expo, node_modules cache, and metro cache
- `bun clean-full` - Full clean including node_modules and bun.lock, then reinstall

## Architecture Overview

### Tech Stack

- **Frontend**: React Native with Expo SDK 53 (New Architecture enabled)
- **Routing**: Expo Router v5 with typed routes
- **Styling**: Nativewind v4 (Tailwind CSS for React Native)
- **Animations**: React Native Reanimated 4 + Moti with preset library
- **State Management**: Zustand with MMKV persistence via store factory
- **Backend**: Convex (real-time database and functions)
- **Authentication**: Clerk with custom provider setup
- **Localization**: react-native-i18n with RTL support
- **Performance**: Comprehensive monitoring, lazy loading, bundle optimization
- **Package Manager**: Bun

### Performance Architecture

- **Lazy Loading**: Component-based lazy loading with preload strategies
- **Performance Monitoring**: Comprehensive metrics tracking (startup, navigation, memory)
- **Bundle Optimization**: Critical path analysis and lazy bundle loading
- **Animation Optimization**: Reanimated 4 with worklet optimization
- **Memory Management**: MMKV with health checks and automatic cleanup

### Project Structure

```
src/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout with providers
│   ├── index.tsx          # Landing/auth check page
│   ├── tabs/              # Tab navigation
│   │   ├── chat.tsx       # Main chat screen
│   │   ├── mood.tsx       # Mood tracking
│   │   ├── exercises.tsx  # Wellness exercises
│   │   └── profile.tsx    # User profile
│   ├── auth/              # Authentication screens
│   └── chat-history.tsx   # Chat history modal
├── components/            # Reusable UI components
│   ├── chat/              # Chat-related components
│   ├── exercises/         # Exercise components
│   ├── lazy/              # Lazy-loaded components
│   ├── navigation/        # Navigation components
│   ├── ui/                # Base UI components
│   ├── auth/              # Authentication components
│   └── dev/               # Development tools
├── screens/               # Screen implementations
│   └── tabs/              # Tab screen implementations
├── providers/             # React context providers
├── store/                 # Zustand stores with MMKV
├── lib/                   # Utilities and optimization tools
│   ├── animations/        # Animation presets and utilities
│   └── performance monitoring, MMKV, lazy loading
├── hooks/                 # Custom React hooks
├── config/                # Environment configuration
├── types/                 # TypeScript type definitions
└── locales/               # i18n translation files
```

### State Management Architecture

**Modern Zustand + MMKV Implementation:**

- **Store Factory Pattern**: `createPersistedStore()` factory for consistent MMKV persistence
- **Primary Stores**:
  - `useAppStore`: Global app state, themes, settings, language with smart theme resolution
  - `useChatUIStore`: Chat UI state, session management, floating chat, typing indicators
- **MMKV Integration**:
  - Custom `mmkv-storage.ts` with encryption and error handling
  - Synchronous persistence with fallback mechanisms
  - Health checks and storage optimization
- **Store Provider**: Simplified hydration with error boundaries and system theme listeners
- **Optimized Selectors**: Shallow comparison selectors and action grouping for performance

### Database Schema (Convex)

- **Dual Chat System**:
  - `mainChatMessages`: Structured therapy sessions with sessionId
  - `ventChatMessages`: Quick emotional releases/vents
- **Session Management**:
  - `chatSessions`: Main chat conversation metadata
  - `ventChatSessions`: Vent chat session metadata
- **User Data**:
  - `users`: User profiles with Clerk integration
  - `moods`: Daily mood entries with 5 mood types
  - `exercises`: Wellness exercises with category/difficulty
  - `userProgress`: Exercise completion tracking
- **Multilingual**: Arabic/English support in exercise content and UI

### Key Features

1. **AI Chat**: Two types - structured therapy sessions and quick emotional vents
2. **Mood Tracking**: Daily mood logging with calendar visualization
3. **Wellness Exercises**: Categorized exercises with progress tracking
4. **Multilingual**: Full Arabic/English support
5. **Real-time**: Live chat updates via Convex subscriptions
6. **Offline Support**: MMKV caching for offline functionality

## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Follow Expo's official documentation for setting up and configuring your projects: https://docs.expo.dev/

## Naming Conventions

- Use lowercase with dashes for directories (e.g., components/auth-wizard).
- Favor named exports for components.

## TypeScript Usage

- Use TypeScript for all code; prefer interfaces over types.
- Avoid enums; use maps instead.
- Use functional components with TypeScript interfaces.
- Use strict mode in TypeScript for better type safety.

## Syntax and Formatting

- Use the "function" keyword for pure functions.
- Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements.
- Use declarative JSX.
- Use Prettier for consistent code formatting.

## Key Principles and Workflow Guidance

- If you are given a task, don't overcomplicate it. Do a simple approach. If it didn't function, go into more advanced solutions cleverly.
- When given an error or a problem to fix, do not overcomplicate. Try a simple fix and simple approach. If it didn't work, you will then go more advanced solutions.

## Convex Development Notes

- Convex functions are located in the `convex/` directory
- Schema is defined in `convex/schema.ts` with indexed tables
- Available Convex modules: auth, chat, exercises, moods, users, mainChat, ventChat, userProgress
- Use MCP tools for Convex operations: `mcp__convex__*` functions for database queries and management
- Environment variables: EXPO_PUBLIC_CONVEX_URL for deployment connection

## Build and Development Notes

- Do not run an iOS build. Always ask for confirmation before proceeding with iOS builds.
- Use `bun` as the package manager, not npm or yarn.
- Convex functions are TypeScript and run in the cloud.
- MMKV provides synchronous storage - prefer it over AsyncStorage.
- Use `expo-router` for navigation - all routes are file-based.
- **Important Development Tip**: Do not start a dev server. Tell the user to do it.

## Environment Configuration

- Uses Expo's new architecture (Fabric/TurboModules enabled)
- Clerk authentication with custom provider setup
- Convex URL and Clerk keys configured via environment variables
- Supports iOS 18.0+ and modern Android with edge-to-edge display

## Animation and UI Guidelines

- Use React Native Reanimated 4 for complex animations
- Moti for simpler, declarative animations
- Nativewind v4 for styling with Tailwind classes
- Follow iOS design patterns for consistency
- Use haptic feedback for user interactions

## Performance and Optimization Guidelines

- **Lazy Loading**: Use lazy components from `src/components/lazy/` for heavy screens
- **Performance Monitoring**: Leverage built-in performance monitoring for optimization insights
- **MMKV Best Practices**: Use `mmkvJSON` helpers for object storage, check storage health
- **Animation Performance**: Use Reanimated 4 worklets, avoid bridge communication
- **Bundle Optimization**: Monitor critical path size, use lazy loading for non-essential features
- **Memory Management**: Regular cleanup, monitor memory usage patterns

## Component Architecture

- **Screen Layout System**: `ScreenLayout` component with presets (dashboard, chat, profile, list)
- **Lazy Loading**: Components in `src/components/lazy/` with performance tracking
- **UI Components**: Consistent design system in `src/components/ui/`
- **Animation Library**: Preset animations in `src/lib/animations/`
- **Generic Patterns**: `GenericList`, `LazyModal`, `InteractiveCard` for common use cases

## Development Workflow

- **Performance First**: Monitor bundle size and lazy load times during development
- **State Management**: Use store factory pattern for new features requiring persistence
- **Error Boundaries**: Implement proper error handling for store operations
- **Testing**: Focus on store hydration, lazy loading, and performance metrics
- **RTL Support**: Test Arabic layouts, use `RTLView` component for direction-aware layouts

## Testing Framework

- Jest configuration in `jest.config.js` with React Native preset
- Test files: `src/**/__tests__/**/*.{ts,tsx}` or `src/**/*.(test|spec).{ts,tsx}`
- Module aliases: `@/` and `~/` point to `src/` directory
- Coverage collection from `src/**/*.{ts,tsx}` excluding index and type files
- Transform ignore patterns include React Native, Expo, and animation libraries
- Store testing: Focus on MMKV persistence, hydration, and error scenarios

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
