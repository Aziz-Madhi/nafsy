# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nafsy** is a mental health React Native app built with Expo, featuring AI-powered chat, mood tracking, wellness exercises, and multilingual support (English/Arabic). The app uses Clerk for authentication, Convex for real-time backend, and follows iOS design patterns.

You are an expert in TypeScript, React Native, Expo, Nativewind v4, and React Native Reanimated 4 development.

## Code Style and Structure

- Write concise, technical TypeScript code with accurate examples.
- Use functional and declarative programming patterns; avoid classes.
- Prefer iteration and modularization over code duplication.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Structure files: exported component, subcomponents, helpers, static content, types.
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

## UI and Styling

**Current Architecture: Shadcn/ui + NativeWind v4 + React Native Reanimated 4.0**

- **Shadcn/ui Pattern**: Use React Native Reusables approach with shadcn/ui design system
- **NativeWind v4**: Primary styling system with Tailwind CSS classes (`nativewind@^4.1.23`)
- **CSS Variables**: Single source of truth in `global.css` with `hsl(var(--primary))` format
- **Typography**: Centralized Text component with variants (title1, title2, heading, body, muted, etc.)
- **Icons**: `lucide-react-native@^0.525.0` for React Native compatible icons
- **Animations**: React Native Reanimated 4.0.0-beta.5 for high-performance animations
- **Class Merging**: `cn()` utility from `lib/cn.ts` (clsx + tailwind-merge with error handling)
- **Component Architecture**: All UI components in root `/lib/` and `/components/` with consistent patterns

### Styling Best Practices:
- **Prefer className** over StyleSheet for all styling
- **Use CSS variables** for theming: `bg-primary`, `text-foreground`, `border-input`
- **Text variants** instead of hardcoded styling: `<Text variant="title1">`
- **Component composition** over complex styling logic
- **Static className values** to avoid NativeWind v4 context issues

## Safe Area Management

- Use SafeAreaProvider from react-native-safe-area-context to manage safe areas globally
- Wrap top-level components with SafeAreaView to handle notches, status bars, and screen insets
- Use SafeAreaScrollView for scrollable content to ensure it respects safe area boundaries
- Avoid hardcoding padding or margins for safe areas; rely on SafeAreaView and context hooks

## Performance Optimization

- Minimize the use of useState and useEffect; prefer context and reducers for state management
- Use Expo's AppLoading and SplashScreen for optimized app startup experience
- Optimize images: use WebP format where supported, include size data, implement lazy loading with expo-image
- Implement code splitting and lazy loading for non-critical components with React's Suspense and dynamic imports
- Profile and monitor performance using React Native's built-in tools and Expo's debugging features
- Avoid unnecessary re-renders by memoizing components and using useMemo and useCallback hooks appropriately

## Navigation

- Use Expo Router for routing and navigation; follow its best practices for stack, tab, and drawer navigators
- Leverage deep linking and universal links for better user engagement and navigation flow
- Use dynamic routes with expo-router for better navigation handling

## State Management

- Use React Context and useReducer for managing global state
- Leverage react-query for data fetching and caching; avoid excessive API calls
- For complex state management, consider using Zustand or Redux Toolkit
- Handle URL search parameters using libraries like expo-linking

## Error Handling and Validation

- Use Zod for runtime validation and error handling
- Implement proper error logging using Sentry or a similar service
- Prioritize error handling and edge cases:
  - Handle errors at the beginning of functions
  - Use early returns for error conditions to avoid deeply nested if statements
  - Avoid unnecessary else statements; use if-return pattern instead
  - Implement global error boundaries to catch and handle unexpected errors
- Use expo-error-reporter for logging and reporting errors in production

## Testing

- Write unit tests using Jest and React Native Testing Library
- Implement integration tests for critical user flows using Detox
- Use Expo's testing tools for running tests in different environments
- Consider snapshot testing for components to ensure UI consistency

## Security

- Sanitize user inputs to prevent XSS attacks
- Use react-native-encrypted-storage for secure storage of sensitive data
- Ensure secure communication with APIs using HTTPS and proper authentication
- Use Expo's Security guidelines to protect your app: https://docs.expo.dev/guides/security/

## Internationalization (i18n)

- Use react-native-i18n or expo-localization for internationalization and localization
- Support multiple languages and RTL layouts
- Ensure text scaling and font adjustments for accessibility

## Key Conventions

1. Rely on Expo's managed workflow for streamlined development and deployment
2. Prioritize Mobile Web Vitals (Load Time, Jank, and Responsiveness)
3. Use expo-constants for managing environment variables and configuration
4. Use expo-permissions to handle device permissions gracefully
5. Implement expo-updates for over-the-air (OTA) updates
6. Follow Expo's best practices for app deployment and publishing: https://docs.expo.dev/distribution/introduction/
7. Ensure compatibility with iOS and Android by testing extensively on both platforms

## Development Commands

**ALWAYS USE BUN COMMANDS (Bun 1.2.18+ for faster package management)**

### Development

- `bun start` - Start Expo development server  
- `bun start:clear` - Start with cache cleared
- `bun start --tunnel` - Start with tunnel for testing on physical devices
- `bun expo prebuild` - Generate native iOS/Android projects
- `bun expo run:ios` - Run on iOS simulator
- `bun expo run:android` - Run on Android emulator

### Maintenance & Troubleshooting

- `bun run clean` - Clear Metro cache and build folders
- `bun run clean-full` - Complete clean: remove node_modules and reinstall
- `bun update` - Update dependencies to latest versions
- `bun outdated` - Check for outdated dependencies

### Convex Backend

- `bun convex:dev` - Start Convex development server
- `bun convex:deploy` - Deploy backend to production
- `bun convex dashboard` - Open Convex dashboard in browser
- `bun convex logs` - View real-time backend logs
- `bun convex env` - Manage environment variables

### Code Quality

- `yarn expo install --fix` - Fix package version mismatches
- `yarn lint` - Run ESLint with React Compiler integration
- `yarn lint:fix` - Run ESLint with auto-fix
- `yarn lint:check` - Run ESLint for CI/CD (no warnings allowed)
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check code formatting without fixing
- TypeScript checking via IDE integration (no separate command available)

### Build & Deploy

- `bun eas build --platform ios` - Build for iOS using EAS
- `bun eas build --platform android` - Build for Android using EAS
- `bun eas build --platform all` - Build for both platforms
- `bun eas submit` - Submit to app stores
- `bun eas update` - Push OTA updates

## Architecture

This is a React Native Expo application optimized for iOS with TypeScript and NativeWindUI:

- **Entry point**: `index.ts` - registers the root component using `expo/registerRootComponent`
- **Main component**: Root layout in `src/app/_layout.tsx` with AppProviders composition
- **Provider architecture**: 
  - `AppProviders.tsx`: Composed provider hierarchy (SafeArea → Clerk → Convex)
  - `ClerkProvider.tsx`: Authentication with error handling and fallbacks
  - `ConvexProvider.tsx`: Real-time backend integration
- **Configuration**: 
  - `app.config.ts`: Expo configuration with platform-specific settings and automatic dark mode support
  - `tsconfig.json`: TypeScript configuration extending Expo's base config with strict mode
  - `babel.config.js`: Babel configuration with Nativewind + react-native-reanimated/plugin
  - `tailwind.config.js`: NativeWindUI color system with CSS variables
  - `metro.config.js`: Metro configuration with Nativewind integration and warning suppression
  - `global.css`: NativeWindUI CSS variables and Tailwind directives
- **Package manager**: Uses Bun 1.2.18+ (bun.lock present, faster than yarn/npm)
- **Framework**: Expo SDK ~53.0.17 with React Native 0.79.5 and React 19.0.0

## UI Framework

**Current Tech Stack: Shadcn/ui + NativeWind v4 + React Native Reanimated 4.0**

### Core Dependencies:
- **NativeWind**: `nativewind@^4.1.23` with `tailwindcss@^3.4.17`
- **UI Primitives**: `@rn-primitives/*` for shadcn/ui components (avatar, progress, tooltip)
- **Styling Utilities**: `class-variance-authority@^0.7.1`, `clsx@^2.1.1`, `tailwind-merge@^3.3.1`
- **Icons**: `lucide-react-native@^0.525.0` for React Native compatibility
- **Animations**: `react-native-reanimated@4.0.0-beta.5` + `moti@^0.30.0` (available but prefer Reanimated)
- **Performance**: `@shopify/flash-list@1.7.6` for lists

### Architecture Patterns:
- **Shadcn/ui Design System**: Component patterns inspired by shadcn/ui but adapted for React Native
- **CSS Variables**: Single source in `global.css` with light/dark mode support
- **Component Location**: Mix of `/components/ui/` (shadcn-style) and `/lib/` (utilities)
- **Styling Approach**: className-first with NativeWind, StyleSheet fallback for complex cases
- **Typography**: Centralized Text component with CVA (class-variance-authority) variants

### Animation Architecture:
- **Primary**: React Native Reanimated 4.0 for complex animations (UI thread, 120fps)
- **Layout Animations**: `LinearTransition`, `FadeIn`, `SlideInUp`, etc.
- **Interactive Animations**: `useAnimatedStyle`, `useSharedValue`, `withSpring`
- **Performance**: Entrance/exit animations with cascade timing and spring physics
- **Best Practices**: Fixed hook order, avoid worklet recursion, use `withRepeat` for loops

### Component Structure:
```
/components/ui/           # Shadcn-style UI components
  ├── text.tsx           # Typography with variants
  ├── button.tsx         # Interactive elements
  ├── card.tsx           # Layout components
  └── ...
/lib/                    # Utility functions
  ├── cn.ts              # Class merging with error handling
  ├── constants.ts       # App constants
  └── haptics.ts         # Haptic feedback
```

### Theme System:
- **CSS Variables**: Defined in `global.css` with HSL values
- **Tailwind Integration**: Colors mapped to CSS variables in `tailwind.config.js`
- **Dark Mode**: Automatic with `@media (prefers-color-scheme: dark)`
- **Type Safety**: Consistent color tokens across components

## Animation Patterns & Best Practices

**Preferred Animation Library: React Native Reanimated 4.0**

### Animation Principles:
1. **Appear in Place**: Messages should `FadeIn` directly at their position, not slide from screen edges
2. **Layout Transitions**: Use `LinearTransition` for smooth repositioning when content changes
3. **Cascade Timing**: Stagger animations with delays (`index * 150ms`) for natural flow
4. **Spring Physics**: Use `springify()` with proper damping (20-25) and stiffness (300-400)
5. **Performance**: All animations run on UI thread for 60+ FPS

### Common Animation Patterns:
```tsx
// Message entrance with cascade
entering={FadeIn.springify().damping(25).stiffness(400).delay(index * 150)}

// Layout repositioning
layout={LinearTransition.springify().damping(20).stiffness(300).duration(600)}

// Interactive feedback
sendButtonScale.value = withSpring(0.8, { damping: 5 }, () => {
  sendButtonScale.value = withSpring(1.1, { damping: 8 });
});

// Continuous animations
shimmerPosition.value = withRepeat(
  withTiming(1, { duration: 1500, easing: Easing.linear }),
  -1, true
);
```

### Animation Anti-Patterns:
- ❌ **Avoid**: Sliding from screen edges (`SlideInDown` from top)
- ❌ **Avoid**: Worklet recursion (use `withRepeat` instead)
- ❌ **Avoid**: Dynamic `useAnimatedStyle` calls (maintain hook order)
- ❌ **Avoid**: Too many simultaneous animations (performance impact)
- ✅ **Prefer**: In-place appearance with layout transitions
- ✅ **Prefer**: Fixed hook order with stable animated styles
- ✅ **Prefer**: Entrance/exit + layout animations for smooth UX

## Convex Tools Guidance

- **Convex MCP Server Tool**: Can be used for all Convex-related tasks and operations

## Convex Development Notes

- When you try to run convex, use `bun convex:dev` (or `bun convex dev`).

## Development Gotchas

- If you want to start the expo simulator use `bun start:clear` (or `bun start --clear`)

## Development Safeguards

### Critical Dependencies (Locked Versions)
- **react-native-reanimated**: Version 4.0.0-beta.5 (CSS-style animations)
- **@clerk/clerk-expo**: Exact version 2.14.2 (auth stability)
- **react-native-gesture-handler**: Exact version 2.24.0 (animation stability)

### Development Build Workflow
1. **When changing UI with animations**: Use `bun run clean` if Metro errors occur
2. **When adding new dependencies**: Lock critical versions to exact numbers
3. **When seeing version mismatches**: Run `bun run clean-full` before rebuilding
4. **Development builds**: Always use IP address for bundler URL (e.g., 192.168.1.x:8081)

### Troubleshooting Common Issues

#### Styling & UI Issues:
- **NativeWind styles not applying**: Clear Metro cache with `bun start:clear`
- **CSS variable issues**: Ensure using `hsl(var(--variable))` format, not direct CSS values
- **Dynamic className crashes**: Use static classes with dark: variants, avoid `cn()` with dynamic values
- **Text styling inconsistent**: Use Text component variants instead of hardcoded className
- **Icon not displaying**: Import from `lucide-react-native` for React Native compatibility

#### Animation Issues:
- **React Hooks order violation**: Move all `useAnimatedStyle` calls to top level, avoid dynamic hook creation
- **Worklet recursion errors**: Use `withRepeat` instead of recursive functions in worklets
- **Animation stuttering**: Check for multiple simultaneous layout transitions, reduce complexity
- **Messages sliding from wrong direction**: Use `FadeIn` for in-place appearance, `LinearTransition` for repositioning
- **Performance drops**: Limit concurrent animations, use UI thread animations (Reanimated 4.0)

#### Development Issues:
- **Reanimated errors**: Check version alignment (`4.0.0-beta.5`), use `bun run clean`
- **Metro cache issues**: Use `bun start --clear` before debugging
- **Route export warnings**: All files in `src/app/` must have `export default`
- **Clerk auth errors**: Ensure useAuth is called within ClerkProvider context
- **Package conflicts**: Run `bun run clean-full` for complete dependency reset

## Claude AI Instructions

### Development Workflow:
- **Ask before running app**: Don't start `bun expo run:ios` automatically (takes 10+ minutes, often times out)
- **Build process**: Let user manually start builds, focus on code implementation
- **Dependencies**: Never downgrade, always align JavaScript UP to match development build versions
- **Cache clearing**: Suggest `bun start:clear` for styling issues, `bun run clean-full` for major problems

### UI Development Approach:
- **Design System**: Use Shadcn/ui + NativeWind v4 + React Native Reanimated 4.0 approach
- **Component Pattern**: Prefer existing components from `/components/ui/` and `/lib/`
- **Styling Priority**: 
  1. Text component variants (`variant="title1"`) 
  2. NativeWind className (`bg-primary`, `text-foreground`)
  3. CSS variables (`hsl(var(--primary))`)
  4. StyleSheet fallback only when necessary
- **Icons**: Always use `lucide-react-native` for React Native compatibility
- **Class Merging**: Use `cn()` utility with error handling for combining classes

### Animation Development:
- **Library Priority**: React Native Reanimated 4.0 > Moti (keep Moti installed but prefer Reanimated)
- **Animation Patterns**: 
  - Messages appear in place with `FadeIn` (not slide from edges)
  - Use `LinearTransition` for repositioning existing content
  - Implement cascade timing with staggered delays
  - Apply spring physics for natural movement
- **Performance**: Maintain hook order, avoid worklet recursion, use `withRepeat` for loops
- **Debugging**: Fix React Hooks violations by moving `useAnimatedStyle` to component top level

### Code Quality:
- **TypeScript**: Strict mode, interfaces over types, functional components
- **Error Handling**: Prioritize edge cases, early returns, proper error boundaries  
- **Performance**: Minimize useState/useEffect, use context for state, memoize appropriately

## Nativewind v4 Navigation Context Issue

**CRITICAL**: Nativewind v4 has a known issue with navigation context that causes crashes with the error "Couldn't find a navigation context". This affects:

### What Causes Crashes:
1. **Dynamic className values**: `className={`flex-1 ${isDark ? 'dark' : ''}`}` 
2. **cn() utility with dynamic values**: `className={cn('base', isActive && 'active')}`
3. **Any hook that uses className before navigation context is established**

### Safe Patterns to Use:
1. **Static className with dark: variants**: 
   ```tsx
   <View className="bg-white dark:bg-gray-900">
   ```

2. **Conditional rendering instead of dynamic classes**:
   ```tsx
   {isSelected ? <SelectedView /> : <UnselectedView />}
   ```

3. **StyleSheet for truly dynamic styles**:
   ```tsx
   <View style={[styles.base, isDark && styles.dark]}>
   ```

### Components Affected:
- Original MoodSelector (used cn() utility)
- ThemeToggle (used custom useColorScheme hook)
- Any component using dynamic className values

### Solution Implemented:
- Created SafeMoodSelector using StyleSheet
- Created SimpleThemeToggle without cn()
- Applied dark class in ThemedApp after navigation context is ready
- Use nativewind's useColorScheme directly, not custom wrappers

## Development Best Practices

- Always use bunx instead of npx