# Three Chat Personalities Implementation Guide

## Overview

Transform the current chat system into three distinct chat personalities with unique visual styles, backend infrastructure, and user interfaces.

### Chat Personalities

1. **Coach Chat** (existing main chat) - Professional therapy sessions
2. **Event Chat** (existing vent chat) - Quick emotional releases
3. **Companion Chat** (new) - Friendly daily check-ins

## Phase 1: Backend Infrastructure

### 1.1 Database Schema Extension

Create new Convex tables for Companion Chat in `convex/schema.ts`:

```typescript
// Add to schema.ts
companionChatMessages: defineTable({
  userId: v.id('users'),
  content: v.string(),
  role: v.union(v.literal('user'), v.literal('assistant')),
  sessionId: v.string(),
  createdAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_session', ['sessionId'])
  .index('by_user_session', ['userId', 'sessionId']),

companionChatSessions: defineTable({
  userId: v.id('users'),
  sessionId: v.string(),
  title: v.string(),
  startedAt: v.number(),
  lastMessageAt: v.number(),
  messageCount: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_session_id', ['sessionId']),
```

### 1.2 Backend Functions

Create `convex/companionChat.ts` following the pattern of `mainChat.ts` and `ventChat.ts`:

```typescript
// Core functions needed:
// - sendCompanionMessage
// - getCompanionChatMessages
// - getCompanionChatSessions
// - createCompanionChatSession
// - deleteCompanionChatSession
```

## Phase 2: State Management Enhancement

### 2.1 Extend Chat UI Store

Update `src/store/useChatUIStore.ts` to support three chat types:

```typescript
interface ChatUIStoreState {
  // Chat Type Selection
  activeChatType: 'coach' | 'event' | 'companion';

  // Coach Chat (existing mainChat)
  coachChatInput: string;
  currentCoachSessionId: string | null;

  // Event Chat (existing ventChat)
  eventChatInput: string;
  currentEventSessionId: string | null;
  isEventChatVisible: boolean;

  // Companion Chat (new)
  companionChatInput: string;
  currentCompanionSessionId: string | null;

  // Actions
  setActiveChatType: (type: 'coach' | 'event' | 'companion') => void;
  switchChatType: (type: 'coach' | 'event' | 'companion') => Promise<void>;
}
```

## Phase 3: Color System Extension

### 3.1 Add Chat-Specific Colors

Extend the color system in `tailwind.config.js` and `global.css`:

```css
/* Add to global.css */
:root {
  /* Coach Chat Colors */
  --color-chat-coach-primary: 47 106 141; /* Professional blue */
  --color-chat-coach-bubble: 47 106 141;
  --color-chat-coach-accent: 35 82 110;

  /* Event Chat Colors */
  --color-chat-event-primary: 180 95 116; /* Warm pink */
  --color-chat-event-bubble: 180 95 116;
  --color-chat-event-accent: 150 79 97;

  /* Companion Chat Colors */
  --color-chat-companion-primary: 123 160 91; /* Friendly green */
  --color-chat-companion-bubble: 123 160 91;
  --color-chat-companion-accent: 98 128 73;
}
```

### 3.2 Tailwind Classes

Add corresponding Tailwind classes:

- `bg-chat-coach-primary`, `text-chat-coach-primary`
- `bg-chat-event-primary`, `text-chat-event-primary`
- `bg-chat-companion-primary`, `text-chat-companion-primary`

## Phase 4: UI Components (NativeWind/Tailwind Implementation)

### 4.1 Chat Type Toggle Component

Create `src/components/chat/ChatTypeToggle.tsx` using NativeWind classes:

```typescript
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import Animated from 'react-native-reanimated';
import { cn } from '~/lib/cn';

interface ChatTypeToggleProps {
  activeType: 'coach' | 'event' | 'companion';
  onTypeChange: (type: 'coach' | 'event' | 'companion') => void;
}

// NativeWind Implementation Example:
export function ChatTypeToggle({ activeType, onTypeChange }: ChatTypeToggleProps) {
  return (
    <View className="mx-4 mb-3">
      <View className="flex-row bg-card/50 rounded-2xl p-1 border border-border/10">
        {['coach', 'event', 'companion'].map((type) => (
          <Pressable
            key={type}
            onPress={() => onTypeChange(type as any)}
            className={cn(
              "flex-1 py-3 px-2 rounded-xl items-center justify-center",
              activeType === type && [
                type === 'coach' && "bg-chat-coach-primary/10",
                type === 'event' && "bg-chat-event-primary/10",
                type === 'companion' && "bg-chat-companion-primary/10",
              ]
            )}
          >
            <SymbolView
              name={getIconForType(type)}
              size={20}
              tintColor={getColorForType(type)}
            />
            <Text className={cn(
              "text-xs mt-1",
              activeType === type ? "font-semibold" : "opacity-60"
            )}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
```

Visual Design:

- **Position**: Top of chat screen, below header
- **Style**: iOS-style segmented control with NativeWind glass morphism (`bg-card/50`)
- **Icons**:
  - Coach: `person.crop.circle` (SF Symbol)
  - Event: `bolt.heart` (SF Symbol)
  - Companion: `heart.circle` (SF Symbol)

### 4.2 Enhanced Chat History Sidebar

Update `src/components/chat/ChatHistorySidebar.tsx` with NativeWind styling:

```typescript
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { cn } from '~/lib/cn';

interface SessionItemProps {
  session: any;
  chatType: 'coach' | 'event' | 'companion';
  isActive: boolean;
  onPress: () => void;
}

// NativeWind Implementation for Session Items:
const SessionItem = ({ session, chatType, isActive, onPress }: SessionItemProps) => {
  const borderColorClass = {
    coach: 'border-l-chat-coach-primary',
    event: 'border-l-chat-event-primary',
    companion: 'border-l-chat-companion-primary'
  }[chatType];

  const bgColorClass = {
    coach: isActive ? 'bg-chat-coach-primary/10' : 'bg-card',
    event: isActive ? 'bg-chat-event-primary/10' : 'bg-card',
    companion: isActive ? 'bg-chat-companion-primary/10' : 'bg-card'
  }[chatType];

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "mx-4 mb-2 rounded-xl p-3 border-l-4",
        borderColorClass,
        bgColorClass,
        "android:active:opacity-80 ios:active:scale-98"
      )}
    >
      <View className="flex-row items-center">
        <SymbolView
          name={getIconForType(chatType)}
          size={16}
          className="mr-2 opacity-60"
        />
        <Text className="flex-1 font-medium">{session.title}</Text>
      </View>
      <Text className="text-xs text-muted-foreground mt-1">
        {formatDate(session.lastMessageAt)}
      </Text>
    </Pressable>
  );
};

// Section Headers with NativeWind:
const SectionHeader = ({ title, type }: { title: string; type: string }) => (
  <View className="px-4 py-2 mb-2">
    <Text className={cn(
      "text-sm font-semibold uppercase tracking-wider",
      type === 'coach' && "text-chat-coach-primary",
      type === 'event' && "text-chat-event-primary",
      type === 'companion' && "text-chat-companion-primary"
    )}>
      {title}
    </Text>
  </View>
);
```

Visual Hierarchy:

```
[Coach Sessions]
  ├─ [Blue border] Session 1
  ├─ [Blue border] Session 2

[Event Sessions]
  ├─ [Pink border] Quick vent
  ├─ [Pink border] Evening release

[Companion Sessions]
  ├─ [Green border] Morning check-in
  ├─ [Green border] Daily reflection
```

### 4.3 Chat Screen Variants

Create personality-specific styling in `src/components/chat/ChatScreen.tsx` with NativeWind:

```typescript
import { View } from 'react-native';
import { cn } from '~/lib/cn';

// Dynamic NativeWind styling based on active chat type
const getChatStyles = (type: 'coach' | 'event' | 'companion') => {
  switch(type) {
    case 'coach':
      return {
        bubbleUserClass: 'bg-chat-coach-primary text-white',
        bubbleAIClass: 'bg-chat-coach-primary/10 text-foreground',
        headerClass: 'bg-gradient-to-b from-chat-coach-primary/5 to-transparent',
        inputContainerClass: 'border-chat-coach-primary/20 bg-chat-coach-primary/5',
        sendButtonClass: 'bg-chat-coach-primary'
      };
    case 'event':
      return {
        bubbleUserClass: 'bg-chat-event-primary text-white',
        bubbleAIClass: 'bg-chat-event-primary/10 text-foreground',
        headerClass: 'bg-gradient-to-b from-chat-event-primary/5 to-transparent',
        inputContainerClass: 'border-chat-event-primary/20 bg-chat-event-primary/5',
        sendButtonClass: 'bg-chat-event-primary'
      };
    case 'companion':
      return {
        bubbleUserClass: 'bg-chat-companion-primary text-white',
        bubbleAIClass: 'bg-chat-companion-primary/10 text-foreground',
        headerClass: 'bg-gradient-to-b from-chat-companion-primary/5 to-transparent',
        inputContainerClass: 'border-chat-companion-primary/20 bg-chat-companion-primary/5',
        sendButtonClass: 'bg-chat-companion-primary'
      };
  }
};

// Example usage in ChatBubble component:
export const ChatBubble = ({ message, chatType }: { message: Message; chatType: ChatType }) => {
  const styles = getChatStyles(chatType);
  const isUser = message.role === 'user';

  return (
    <View className={cn(
      "max-w-[80%] px-4 py-3 rounded-2xl mb-2",
      isUser ? [
        "self-end rounded-br-sm",
        styles.bubbleUserClass
      ] : [
        "self-start rounded-bl-sm",
        styles.bubbleAIClass
      ]
    )}>
      <Text className={cn(
        "text-sm",
        isUser ? "text-white" : "text-foreground"
      )}>
        {message.content}
      </Text>
    </View>
  );
};

// Example usage in ChatInput component:
export const ChatInput = ({ chatType }: { chatType: ChatType }) => {
  const styles = getChatStyles(chatType);

  return (
    <View className={cn(
      "mx-4 mb-4 p-3 rounded-2xl border",
      styles.inputContainerClass
    )}>
      <TextInput
        className="flex-1 text-foreground"
        placeholderClassName="text-muted-foreground"
        placeholder={getPlaceholderForType(chatType)}
      />
      <Pressable className={cn(
        "ml-2 p-2 rounded-xl",
        styles.sendButtonClass
      )}>
        <SymbolView name="arrow.up" size={20} tintColor="white" />
      </Pressable>
    </View>
  );
};
```

## Phase 5: Navigation & Routing

### 5.1 Update Tab Navigation

Modify `src/app/(app)/tabs/chat.tsx` to handle chat type switching:

```typescript
// URL params for direct linking:
// /chat?type=coach
// /chat?type=event
// /chat?type=companion

// Preserve chat type in navigation state
// Handle deep linking to specific chat types
```

### 5.2 Session Management

Each chat type maintains its own:

- Current session ID
- Message history
- Input state
- Loading states

## Phase 6: Visual Differentiation

### 6.1 Coach Chat (Professional Therapy)

- **Color Palette**: Deep blues, professional tones
- **Typography**: Clean, structured
- **Animations**: Smooth, deliberate
- **Input Style**: Formal text area with session indicators
- **Message Bubbles**: Rounded rectangles with subtle shadows

### 6.2 Event Chat (Quick Emotional Release)

- **Color Palette**: Warm pinks/purples, energetic
- **Typography**: Slightly bolder, expressive
- **Animations**: Quick, responsive
- **Input Style**: Single-line with pulse animation
- **Message Bubbles**: More rounded, playful shadows

### 6.3 Companion Chat (Daily Check-ins)

- **Color Palette**: Soft greens, calming
- **Typography**: Friendly, approachable
- **Animations**: Gentle, welcoming
- **Input Style**: Casual with emoji support
- **Message Bubbles**: Organic shapes, soft edges

## Phase 7: Implementation Steps

### Step 1: Backend Setup (Day 1)

1. Extend Convex schema with companion chat tables
2. Create companion chat backend functions
3. Test all three chat backends independently

### Step 2: State Management (Day 1)

1. Refactor chat UI store for three chat types
2. Create selectors for each chat type
3. Implement chat type switching logic

### Step 3: Color System (Day 1)

1. Add chat-specific color variables
2. Update Tailwind configuration
3. Create color utility functions

### Step 4: Core UI Components (Day 2)

1. Build ChatTypeToggle component
2. Update ChatHistorySidebar with type indicators
3. Modify ChatScreen for dynamic styling

### Step 5: Integration (Day 2)

1. Connect all components
2. Implement smooth transitions
3. Add loading states and error handling

### Step 6: Polish (Day 3)

1. Add animations and haptic feedback
2. Implement accessibility features
3. Test RTL support for Arabic
4. Performance optimization

## Technical Considerations

### Performance

- Lazy load chat messages per type
- Implement virtualization for long conversations
- Cache recent sessions in MMKV
- Optimize re-renders with React.memo

### Accessibility

- ARIA labels for chat type toggle
- Keyboard navigation support
- Screen reader announcements for type changes
- High contrast mode support

### State Persistence

- Save active chat type in MMKV
- Preserve input state across type switches
- Remember last active session per type
- Sync state across app restarts

### Error Handling

- Graceful fallbacks for network issues
- Clear error messages per chat type
- Retry mechanisms for failed messages
- Session recovery on app crash

## Testing Checklist

### Functional Tests

- [ ] All three chat types send/receive messages
- [ ] Session switching works within each type
- [ ] History sidebar shows correct type indicators
- [ ] Toggle smoothly transitions between types
- [ ] Input state preserved when switching

### Visual Tests

- [ ] Colors match design specifications
- [ ] Animations run at 60fps
- [ ] RTL layout works correctly
- [ ] Dark mode properly supported
- [ ] Responsive on all screen sizes

### Integration Tests

- [ ] Backend correctly routes messages
- [ ] State management handles all transitions
- [ ] Navigation preserves chat context
- [ ] Deep linking works for all types
- [ ] Offline mode handles gracefully

## Code Quality Guidelines

1. **Component Structure**: Keep components focused and single-purpose
2. **Type Safety**: Use TypeScript interfaces for all props
3. **Performance**: Memoize expensive computations
4. **Accessibility**: Include proper ARIA attributes
5. **Testing**: Write unit tests for critical functions
6. **Documentation**: Comment complex logic
7. **Consistency**: Follow existing code patterns

## Migration Strategy

1. **Phase 1**: Implement companion chat alongside existing
2. **Phase 2**: Refactor main chat to coach chat naming
3. **Phase 3**: Unify vent chat as event chat
4. **Phase 4**: Deploy with feature flag
5. **Phase 5**: Gradual rollout to users

## Success Metrics

- User can easily identify which chat type is active
- Switching between types takes < 200ms
- Each type maintains distinct visual identity
- History clearly shows chat type origins
- No regression in existing functionality
