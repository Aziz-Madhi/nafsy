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
- **Styling**: Nativewind v4 (Tailwind CSS for React Native) with unified color system
- **Color System**: CSS variables + `useColors` hook for React Native-specific components
- **Animations**: React Native Reanimated 4 + Moti with comprehensive preset library
- **State Management**: Zustand with MMKV persistence via store factory pattern
- **Backend**: Convex (real-time database and functions)
- **Authentication**: Clerk with custom provider setup
- **Localization**: react-native-i18n with RTL support
- **Performance**: Bundle analysis, haptic optimization, MMKV health monitoring
- **Package Manager**: Bun

### Performance Architecture

- **Bundle Analysis**: Critical path analysis and bundle size monitoring
- **Performance Monitoring**: Comprehensive metrics tracking (startup, navigation, memory)
- **MMKV Optimization**: Health checks, encryption, and automatic cleanup
- **Animation Optimization**: Reanimated 4 with worklet optimization and preset library
- **Haptic Optimization**: Efficient haptic feedback patterns
- **Color System Optimization**: CSS variables for hot reload, minimal hex color usage

### Project Structure

```
src/
├── app/                    # Expo Router pages
│   ├── _layout.tsx        # Root layout with providers
│   ├── index.tsx          # Landing/auth check page
│   ├── tabs/              # Tab navigation
│   │   ├── chat.tsx       # Main chat screen
│   │   ├── mood/          # Mood tracking screens
│   │   │   ├── index.tsx  # Main mood dashboard
│   │   │   ├── calendar/[month].tsx # Monthly mood calendar
│   │   │   ├── mood-entry/[date].tsx # Mood entry form
│   │   │   ├── analytics.tsx # Mood analytics
│   │   │   └── year-view.tsx # Full year mood view
│   │   ├── exercises/     # Wellness exercises screens
│   │   │   ├── index.tsx  # Exercise dashboard
│   │   │   └── category/[id].tsx # Category exercises
│   │   └── profile/       # User profile screens
│   │       ├── index.tsx  # Profile dashboard
│   │       ├── account-settings.tsx
│   │       ├── edit-profile.tsx
│   │       ├── privacy-settings.tsx
│   │       └── support.tsx
│   ├── auth/              # Authentication screens
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── chat-history.tsx   # Chat history modal
│   ├── crisis-resources.tsx # Crisis resources screen
│   ├── feedback.tsx       # Feedback screen
│   └── help-center.tsx    # Help center screen
├── components/            # Reusable UI components
│   ├── chat/              # Chat-related components
│   │   ├── ChatScreen.tsx, FloatingChatMinimal.tsx, StreamingText.tsx
│   │   ├── ChatHistorySidebar.tsx, SessionStatusDisplay.tsx
│   │   └── AnimatedWelcomeText.tsx, QuickRepliesSection.tsx
│   ├── exercises/         # Exercise components
│   │   ├── DailyExerciseCard.tsx, ExerciseCard.tsx, ExerciseDetail.tsx
│   │   └── ModernCategoryCard.tsx, PremiumStatsSection.tsx
│   ├── mood/              # Mood tracking components
│   │   ├── PixelCalendar.tsx, FullYearPixelCalendar.tsx
│   │   ├── WeekView.tsx, WeekDayDot.tsx
│   │   └── StatCard.tsx
│   ├── navigation/        # Navigation components
│   │   └── MorphingTabBar.tsx # Animated tab bar with chat input
│   ├── ui/                # Base UI components
│   │   ├── ScreenLayout.tsx, InteractiveCard.tsx, GenericList.tsx
│   │   ├── button.tsx, card.tsx, text.tsx, avatar.tsx
│   │   └── FormField.tsx, RTLView.tsx, IconRenderer.tsx
│   ├── auth/              # Authentication components
│   │   └── AuthLayout.tsx
│   └── SafeErrorBoundary.tsx, StoreErrorBoundary.tsx
├── providers/             # React context providers
│   ├── AppProviders.tsx   # Main provider wrapper
│   ├── StoreProvider.tsx  # Zustand store hydration
│   ├── ClerkProvider.tsx  # Authentication provider
│   ├── ConvexProvider.tsx # Database provider
│   └── LanguageProvider.tsx # i18n provider
├── store/                 # Zustand stores with MMKV persistence
│   ├── useAppStore.ts     # Global app state, themes, settings
│   ├── useChatUIStore.ts  # Chat UI state, session management
│   ├── app-store.ts       # Store implementations
│   └── types.ts           # Store type definitions
├── lib/                   # Utilities and core functionality
│   ├── animations/        # Animation system
│   │   ├── presets.ts     # Reanimated spring presets
│   │   ├── hooks.ts       # Animation hooks
│   │   └── utils.ts       # Animation utilities
│   ├── color-helpers.ts   # Tailwind class generators and color utilities
│   ├── colors.ts          # Color type definitions and withOpacity helper
│   ├── store-factory.ts   # MMKV-persisted store factory pattern
│   ├── mmkv-storage.ts    # MMKV storage with encryption and health checks
│   ├── daily-exercise-utils.ts # Time-based greetings and exercise selection
│   ├── i18n.ts            # Internationalization setup
│   ├── haptic-optimizer.ts # Haptic feedback optimization
│   ├── bundle-analyzer.ts  # Bundle size analysis
│   ├── logger.ts          # Logging utilities
│   └── useUserSafe.ts     # Safe user data access
├── hooks/                 # Custom React hooks
│   ├── useColors.ts       # Color system hooks (useColors, useMoodColor, etc.)
│   ├── useSharedData.ts   # Shared data access patterns
│   ├── useTranslation.ts  # i18n hooks
│   ├── useAuthForm.ts     # Authentication form utilities
│   └── useScreenPadding.ts # Screen padding calculations
├── config/                # Configuration
│   └── env.ts             # Environment variables and configuration
├── types/                 # TypeScript type definitions
│   └── index.ts           # Shared type definitions
├── locales/               # i18n translation files
│   ├── en.json           # English translations
│   ├── ar.json           # Arabic translations
│   └── index.ts          # i18n exports
└── __tests__/            # Test files
    ├── lib/              # Library tests
    └── stores/           # Store tests
```

### State Management Architecture

**Modern Zustand + MMKV Implementation:**

- **Store Factory Pattern**: `createPersistedStore()` factory in `~/lib/store-factory` for consistent MMKV persistence
- **Primary Stores**:
  - `useAppStore`: Global app state, themes, settings, language with smart theme resolution and system theme support
  - `useChatUIStore`: Chat UI state, session management, floating chat, typing indicators, history sidebar
- **MMKV Integration**:
  - Custom `mmkv-storage.ts` with encryption and error handling
  - Synchronous persistence with fallback mechanisms
  - Health checks and storage optimization
- **Store Provider**: Simplified hydration with error boundaries and system theme listeners
- **Optimized Selectors**: Shallow comparison selectors and action grouping for performance
- **Session Management**: Async session switching with error handling for both main and vent chats

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
3. **Wellness Exercises**: Categorized exercises with progress tracking and daily recommendations
4. **Multilingual**: Full Arabic/English support with RTL layout
5. **Real-time**: Live chat updates via Convex subscriptions
6. **Offline Support**: MMKV caching for offline functionality
7. **Daily Exercise System**: Personalized daily exercise selection with time-based greetings

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

## Color System Architecture

**Unified Color System - Single Source of Truth**

The app uses a modern, unified color system with CSS variables as the single source of truth, powering both Tailwind classes and React Native components.

### Color System Structure

- **Primary System**: CSS variables in `global.css` (RGB format for opacity support)
- **Secondary System**: `useColors()` hook for React Native-specific components requiring hex values
- **Integration**: Tailwind config maps all CSS variables to utility classes

### Usage Guidelines

#### 🎨 **Use Tailwind Classes for 90% of Components**
```tsx
// ✅ Preferred - Use Tailwind classes
<View className="bg-primary text-primary-foreground">
<Text className="text-mood-happy">Happy mood</Text>
<View className="bg-card-elevated border-border">
```

#### 🔧 **Use useColors Hook for React Native Specific Components**
```tsx
// ✅ Only for React Native components requiring hex values
import { useColors, useMoodColor, useShadowStyle } from '~/hooks/useColors';

const colors = useColors();
<SymbolView tintColor={colors.primary} />
<View style={{ shadowColor: colors.shadow }} />
<View style={useShadowStyle('medium')} />
```

### Available Color Categories

- **Core Colors**: `primary`, `secondary`, `background`, `foreground`, `card`, `input`
- **State Colors**: `success`, `warning`, `error`, `info`
- **Mood Colors**: `mood-happy`, `mood-sad`, `mood-anxious`, `mood-neutral`, `mood-angry`
- **Wellness Colors**: `wellness-mindfulness`, `wellness-breathing`, `wellness-movement`
- **Navigation Colors**: `tab-active`, `tab-inactive`
- **Chat Colors**: `chat-bubble-user`, `chat-bubble-ai`
- **Brand Colors**: `brand-oxford`, `brand-primary`, `brand-brownish`

### Specialized Color Hooks

```tsx
// Mood-specific colors
const happyColor = useMoodColor('happy');

// Navigation colors
const navColors = useNavigationColors();
const iconColor = focused ? navColors.active : navColors.inactive;

// Chat colors
const chatColors = useChatColors();

// Shadow styling
const shadowStyle = useShadowStyle('medium'); // 'light' | 'medium' | 'heavy'
```

### Color Helper Functions

- `getMoodButtonClass(isSelected, moodType)` - Dynamic mood button styling
- `getCardBackgroundClass(variant)` - Dynamic card backgrounds
- `getChatBubbleClass(isUser)` - Dynamic chat bubble styling
- `getNavigationIconClass(isActive)` - Navigation icon colors
- `withOpacity(color, opacity)` - Safe opacity calculations for React Native

### Dark Mode Support

- Automatic theme switching via CSS variables
- Both system preference (`@media (prefers-color-scheme: dark)`) and manual (`.dark` class) support
- All color utilities automatically adapt to current theme

## Animation and UI Guidelines

- Use React Native Reanimated 4 for complex animations
- Moti for simpler, declarative animations
- Nativewind v4 for styling with Tailwind classes
- Follow iOS design patterns for consistency
- Use haptic feedback for user interactions

## Performance and Optimization Guidelines

- **Bundle Optimization**: Monitor critical path size using built-in bundle analyzer
- **Performance Monitoring**: Leverage built-in performance monitoring for optimization insights
- **MMKV Best Practices**: Use `mmkv-storage.ts` with encryption, health checks, and `store-factory.ts` pattern
- **Animation Performance**: Use Reanimated 4 worklets with animation presets from `~/lib/animations/`
- **Memory Management**: Regular cleanup, monitor memory usage patterns
- **Haptic Optimization**: Use `haptic-optimizer.ts` for efficient haptic feedback

## Component Architecture

- **Screen Layout System**: `ScreenLayout` component with presets (dashboard, chat, profile, list)
- **UI Components**: Consistent design system in `src/components/ui/`
  - `InteractiveCard`, `GenericList`, `FormField`, `RTLView`
  - `button.tsx`, `card.tsx`, `text.tsx`, `avatar.tsx`
- **Animation Library**: Comprehensive animation system in `src/lib/animations/`
  - Spring presets, animation hooks, and utilities
- **Color System**: Unified color system with `useColors` hook and Tailwind integration
- **Error Boundaries**: `SafeErrorBoundary` and `StoreErrorBoundary` for robust error handling

## Development Workflow

- **Performance First**: Monitor bundle size and animation performance during development
- **State Management**: Use `store-factory.ts` pattern for new features requiring MMKV persistence
- **Error Boundaries**: Implement proper error handling with provided error boundary components
- **Testing**: Focus on store hydration, MMKV persistence, and color system integration
- **RTL Support**: Test Arabic layouts using `RTLView` component for direction-aware layouts
- **Color System**: Use Tailwind classes for 90% of styling, `useColors` hook for React Native-specific components

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
