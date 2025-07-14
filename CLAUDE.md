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

- Use **NativeWindUI** architecture with **Nativewind v4** for all styling
- Import icons from **lucide-react-native** (React Native compatible icon library)
- Use **Text component variants** for typography: `variant="title1"`, `variant="body"`, `variant="muted"`
- Implement responsive design with Tailwind's responsive breakpoints and Nativewind's media queries
- Use **CSS variables** from global.css for theming: `hsl(var(--primary))`, `hsl(var(--background))`
- Ensure high accessibility (a11y) standards using ARIA roles and native accessibility props
- Leverage **React Native Reanimated 4** with CSS-style animations for performant animations
- Use className prop for styling instead of StyleSheet objects
- Use `cn()` utility for class merging (clsx + tailwind-merge)

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

This project uses **NativeWindUI** architecture with **Nativewind v4**:
- **Core packages**: `nativewind@^4.1.23`, `tailwindcss@^3.4.17`, `lucide-react-native`, `@shopify/flash-list`
- **Icon system**: `lucide-react-native` for React Native compatible icons
- **Theme system**: CSS variables in `global.css` as single source of truth for theming
- **Component architecture**: All UI components in `~/components/ui/` with consistent NativeWind styling
- **Typography system**: Unified Text component with variants (title1, title2, heading, body, muted, etc.)
- **Build optimization**: Nativewind's CSS-in-JS compilation for optimal performance and tree-shaking
- **Best practices**: 
  - Use className prop with Tailwind utilities instead of StyleSheet
  - All components use `cn()` utility for class merging (clsx + tailwind-merge)
  - Leverage CSS variables for consistent theming: `hsl(var(--primary))`, `hsl(var(--background))`
  - Import icons from `lucide-react-native` for proper React Native compatibility
  - Use Text component variants instead of hardcoded text styling

The root layout uses AppProviders composition with SafeAreaProvider, ClerkProvider, and ConvexProvider.

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
- **Reanimated errors**: Check version alignment, use `bun run clean`
- **Nativewind styles not applying**: Clear Metro cache with `bun start:clear`
- **Tailwind classes not working**: Verify global.css import in root layout
- **Route export warnings**: All files in `src/app/` must have `export default`
- **Clerk auth errors**: Ensure useAuth is called within ClerkProvider context
- **Metro cache issues**: Use `bun start --clear` before debugging
- **CSS variable issues**: Ensure using `hsl(var(--variable))` format, not direct CSS values
- **Icon not displaying**: Import from `lucide-react-native` for React Native compatibility

## Claude AI Instructions

- When you try to rerun the app, Ask me first. Don't go by yourself.
- Do not start "bun expo run:ios" automatically. It takes up to 10 minutes and often times out. Let the user start the build manually.
- **CRITICAL**: Never downgrade dependencies. Always align JavaScript side UP to match development build versions.
- **UI Development**: Always use NativeWindUI architecture with:
  - Text component variants instead of hardcoded styling
  - `lucide-react-native` for all icons (React Native compatible)
  - CSS variables from global.css: `hsl(var(--primary))`, `hsl(var(--background))`
  - Components from `~/components/ui/` directory
  - `cn()` utility for class merging

## Development Best Practices

- Always use bunx instead of npx