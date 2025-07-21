# Zustand Integration Guide

## Overview

Zustand has been successfully integrated into your Nafsy mental health app with a clean, modular architecture that complements your existing Convex backend and React Context providers.

## Store Architecture

### Core Stores

1. **`useAppStore`** - Global app state (theme, navigation, settings)
2. **`useChatStore`** - Chat messages and conversation state
3. **`useMoodStore`** - Mood tracking and selection state
4. **`useExerciseStore`** - Wellness exercises and progress

### Key Features

- **TypeScript-first**: Full type safety with interfaces
- **Modular selectors**: Optimized subscriptions to prevent unnecessary re-renders
- **Subscription middleware**: Advanced state observation
- **Centralized exports**: Clean imports from `/store`

## Usage Examples

### Basic Store Usage

```tsx
import { useAppStore, useFloatingChatVisible } from '~/store';

function MyComponent() {
  // Get state and actions
  const { isFloatingChatVisible, setFloatingChatVisible } = useAppStore();

  // Or use optimized selector
  const isVisible = useFloatingChatVisible();

  return (
    <Button onPress={() => setFloatingChatVisible(!isVisible)}>
      Toggle Chat
    </Button>
  );
}
```

### Chat Integration

```tsx
import { useChatStore, useMessages, useCurrentMessage } from '~/store';

function ChatComponent() {
  const messages = useMessages();
  const currentMessage = useCurrentMessage();
  const { sendMessage, setCurrentMessage } = useChatStore();

  const handleSend = () => {
    if (currentMessage.trim()) {
      sendMessage(currentMessage);
    }
  };

  return (
    <View>
      {messages.map((msg) => (
        <Message key={msg.id} {...msg} />
      ))}
      <TextInput
        value={currentMessage}
        onChangeText={setCurrentMessage}
        onSubmitEditing={handleSend}
      />
    </View>
  );
}
```

### Mood Tracking

```tsx
import { useMoodStore, useSelectedMood, useViewMode } from '~/store';

function MoodScreen() {
  const selectedMood = useSelectedMood();
  const viewMode = useViewMode();
  const { setSelectedMood, setViewMode } = useMoodStore();

  return (
    <View>
      <MoodSelector selectedMood={selectedMood} onSelect={setSelectedMood} />
      <ViewToggle mode={viewMode} onChange={setViewMode} />
    </View>
  );
}
```

## Integration with Existing Code

### Convex Backend (Keep As-Is)

Your Convex mutations and queries remain unchanged. Zustand handles local UI state while Convex manages server state:

```tsx
// Server state with Convex
const todayMood = useQuery(api.moods.getTodayMood, { userId });
const createMood = useMutation(api.moods.createMood);

// Local UI state with Zustand
const { selectedMood, setSelectedMood } = useMoodStore();

const handleSave = async () => {
  if (selectedMood) {
    await createMood({ mood: selectedMood }); // Server
    setSelectedMood(''); // Local UI reset
  }
};
```

### Provider Architecture (Unchanged)

Your existing provider hierarchy remains the same:

```tsx
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <ClerkProvider>
        <ConvexProvider>{children}</ConvexProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
```

## Best Practices

### 1. State Separation

- **Local UI State**: Zustand (form inputs, modals, view modes)
- **Server State**: Convex (user data, mood entries, exercises)
- **Auth State**: Clerk (authentication, user sessions)

### 2. Optimized Selectors

```tsx
// ✅ Good - Uses specific selector
const theme = useTheme();

// ❌ Avoid - Subscribes to entire store
const { settings } = useAppStore();
const theme = settings.theme;
```

### 3. Type Safety

```tsx
// ✅ All stores have full TypeScript support
interface MoodState {
  selectedMood: string;
  setSelectedMood: (mood: string) => void;
}
```

## Migration Strategy

### Phase 1: Core Features (Completed)

- ✅ Store architecture setup
- ✅ FloatingChat converted to Zustand
- ✅ Type definitions and selectors

### Phase 2: Gradual Migration (Optional)

- Replace useState in mood tracking components
- Convert exercise progress to Zustand
- Migrate theme/settings management

### Phase 3: Advanced Features (Future)

- Add persistence with AsyncStorage
- Implement store middleware for analytics
- Add dev tools integration

## Key Benefits

1. **Performance**: Selective subscriptions prevent unnecessary re-renders
2. **Developer Experience**: Clean imports, TypeScript support, minimal boilerplate
3. **Maintainability**: Centralized state logic, clear separation of concerns
4. **Scalability**: Easy to add new stores and features

## Files Created

- `/src/store/types.ts` - TypeScript definitions
- `/src/store/useAppStore.ts` - Global app state
- `/src/store/useChatStore.ts` - Chat functionality
- `/src/store/useMoodStore.ts` - Mood tracking
- `/src/store/useExerciseStore.ts` - Exercise management
- `/src/store/index.ts` - Centralized exports

Your Zustand integration is now ready for use! The FloatingChat component has been updated as an example of the new pattern.
