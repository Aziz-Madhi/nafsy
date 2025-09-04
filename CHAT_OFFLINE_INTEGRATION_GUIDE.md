# Chat Offline Integration Guide

## Overview

This guide shows how to integrate the new offline chat hooks into your chat UI components.

## Key Changes Required

### 1. Import the New Hooks

Replace direct Convex queries with offline hooks in your chat components:

```typescript
// OLD - Direct Convex queries
import { useQuery, useMutation } from 'convex/react';
const messages = useQuery(api.mainChat.getMainChatMessages, { sessionId });

// NEW - Offline-aware hooks
import {
  useOfflineChatMessages,
  useOfflineChatSessions,
  useOfflineSendMessage,
  useNetworkStatus,
} from '~/hooks/useOfflineData';
```

### 2. Update Chat Screen Component

Here's an example of updating the main chat screen:

```typescript
// src/components/chat/ChatScreen.tsx

export function ChatScreen({ chatType, sessionId }) {
  const { isOnline } = useNetworkStatus();

  // Use offline-aware hooks
  const messages = useOfflineChatMessages(sessionId, chatType);
  const sessions = useOfflineChatSessions(chatType);
  const sendMessage = useOfflineSendMessage(chatType);

  // Handle sending messages
  const handleSend = async (content: string) => {
    if (!isOnline) {
      // Show offline message
      Alert.alert(
        'Offline',
        'You need to be online to chat with the AI',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await sendMessage(content, sessionId);
    } catch (error) {
      // Handle error
      console.error('Failed to send message:', error);
    }
  };

  return (
    <View>
      {/* Show offline indicator */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text>You're offline - Chat history only</Text>
        </View>
      )}

      {/* Message list */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <MessageBubble message={item} />
        )}
      />

      {/* Input area - disabled when offline */}
      <ChatInput
        onSend={handleSend}
        disabled={!isOnline}
        placeholder={!isOnline ? "You need to be online to chat" : "Type a message..."}
      />
    </View>
  );
}
```

### 3. Update Tab Screen (src/app/(app)/tabs/chat.tsx)

```typescript
import {
  useOfflineChatMessages,
  useOfflineChatSessions,
  useOfflineSendMessage,
  useNetworkStatus,
} from '~/hooks/useOfflineData';

export default function ChatTab() {
  const { isOnline } = useNetworkStatus();
  const activeChatType = useActiveChatType();
  const activeSessionId = getActiveSessionId();

  // Replace useQuery with offline hooks
  const messages = useOfflineChatMessages(activeSessionId, activeChatType);
  const sessions = useOfflineChatSessions(activeChatType);
  const sendMessage = useOfflineSendMessage(activeChatType);

  // ... rest of your component
}
```

### 4. Handle Different Chat Types

Each chat personality (coach, event, companion) should use the same hooks with the appropriate `chatType`:

```typescript
// Coach Chat
const coachMessages = useOfflineChatMessages(sessionId, 'coach');
const coachSessions = useOfflineChatSessions('coach');
const sendCoachMessage = useOfflineSendMessage('coach');

// Event Chat
const eventMessages = useOfflineChatMessages(sessionId, 'event');
const eventSessions = useOfflineChatSessions('event');
const sendEventMessage = useOfflineSendMessage('event');

// Companion Chat
const companionMessages = useOfflineChatMessages(sessionId, 'companion');
const companionSessions = useOfflineChatSessions('companion');
const sendCompanionMessage = useOfflineSendMessage('companion');
```

## Offline Behavior

### What Works Offline:

✅ View all chat history
✅ Browse chat sessions
✅ Switch between conversations
✅ View mood and exercise data

### What Requires Online:

❌ Sending new messages
❌ Getting AI responses
❌ Creating new sessions
❌ Real-time updates

## Testing Offline Functionality

1. **Test Offline Mode:**
   - Open the app with internet connection
   - Have a chat conversation
   - Turn on airplane mode
   - Verify chat history is still visible
   - Try to send a message (should show error)
   - Turn off airplane mode
   - Verify sync occurs automatically

2. **Test Data Persistence:**
   - View chat while online
   - Force close the app
   - Open in airplane mode
   - Verify chat history loads from SQLite

3. **Test Sync:**
   - Check the sync indicator in the UI
   - Monitor pending operations count
   - Verify data syncs when coming back online

## Implementation Checklist

- [ ] Update ChatScreen component to use offline hooks
- [ ] Update chat.tsx tab to use offline hooks
- [ ] Add offline banner/indicator to chat UI
- [ ] Disable input when offline with clear message
- [ ] Test offline chat viewing
- [ ] Test online/offline transitions
- [ ] Verify sync works correctly
- [ ] Add error handling for offline send attempts

## Notes

- The chat data is stored in SQLite, not MMKV
- Each user has their own SQLite database
- Chat sync happens automatically when online
- No template responses - clear offline messaging only
- Messages are read-only when offline
