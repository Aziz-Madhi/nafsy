# Proper State Management Architecture

## 🎯 **Core Principle**

**Zustand** = Local UI Logic  
**Convex** = Server-Side Logic & Real-time Data

## 🏗️ **Architecture Pattern**

```
┌─────────────────────────────────────┐
│             ZUSTAND                 │
│          (UI State)                 │
├─────────────────────────────────────┤
│ • Input values                      │
│ • Modal visibility                  │
│ • Loading indicators                │
│ • View modes                        │
│ • Form validation states            │
│ • Animation triggers                │
└─────────────────────────────────────┘
              ↕️ **UI Events**
┌─────────────────────────────────────┐
│             CONVEX                  │
│         (Server State)              │
├─────────────────────────────────────┤
│ • Messages                          │
│ • User data                         │
│ • Mood entries                      │
│ • Real-time updates                 │
│ • Persistent storage                │
│ • Authentication state              │
└─────────────────────────────────────┘
```

## 💻 **Implementation Examples**

### **Chat Implementation (Hybrid Approach)**

```tsx
function FloatingChat({ visible, onClose }) {
  // ===== ZUSTAND: UI State =====
  const currentMessage = useFloatingChatInput();
  const isTyping = useFloatingChatTyping();
  const {
    setFloatingChatInput,
    setFloatingChatTyping,
    clearFloatingChatInput,
  } = useChatUIStore();

  // ===== CONVEX: Server Data =====
  const messages = useQuery(api.messages.getMessages, { userId });
  const sendMessage = useMutation(api.messages.sendMessage);

  const handleSend = async () => {
    // 1. Update UI immediately (Zustand)
    const messageText = currentMessage.trim();
    clearFloatingChatInput();
    setFloatingChatTyping(true);

    try {
      // 2. Send to server (Convex)
      await sendMessage({
        userId: currentUser._id,
        content: messageText,
        role: 'user',
      });

      // 3. UI updates automatically via Convex subscription
      setFloatingChatTyping(false);
    } catch (error) {
      // 4. Restore UI state on error (Zustand)
      setFloatingChatInput(messageText);
      setFloatingChatTyping(false);
    }
  };
}
```

### **Form State Pattern**

```tsx
function MoodSelector() {
  // ===== ZUSTAND: Form UI State =====
  const selectedMood = useSelectedMood();
  const { setSelectedMood, clearSelectedMood } = useMoodStore();

  // ===== CONVEX: Save to Server =====
  const saveMood = useMutation(api.moods.createMood);

  const handleSave = async () => {
    if (selectedMood) {
      await saveMood({ mood: selectedMood }); // Convex
      clearSelectedMood(); // Zustand UI reset
    }
  };
}
```

## 📊 **State Ownership Table**

| State Type             | Zustand | Convex | Example                                     |
| ---------------------- | ------- | ------ | ------------------------------------------- |
| **Input Values**       | ✅      | ❌     | `currentMessage`, `selectedMood`            |
| **Modal Visibility**   | ✅      | ❌     | `isFloatingChatVisible`, `showQuickReplies` |
| **Loading States**     | ✅      | ❌     | `isTyping`, `isLoading`                     |
| **Form Validation**    | ✅      | ❌     | `hasErrors`, `validationMessages`           |
| **View Modes**         | ✅      | ❌     | `viewMode: 'graph' \| 'calendar'`           |
| **Animation States**   | ✅      | ❌     | `isAnimating`, `pulseActive`                |
| **Messages/Data**      | ❌      | ✅     | `messages[]`, `moodEntries[]`               |
| **User Profile**       | ❌      | ✅     | `user`, `preferences`                       |
| **Real-time Updates**  | ❌      | ✅     | Live chat, notifications                    |
| **Persistent Storage** | ❌      | ✅     | Database records                            |

## 🔄 **Data Flow Patterns**

### **1. User Interaction → UI Update → Server Sync**

```tsx
// User types in input
setFloatingChatInput(text); // Zustand: Immediate UI update

// User hits send
await sendMessage(text); // Convex: Send to server
clearFloatingChatInput(); // Zustand: Clear UI
```

### **2. Server Update → UI Reflection**

```tsx
// Convex subscription automatically updates UI
const messages = useQuery(api.messages.getMessages); // Real-time data
// Component re-renders automatically when messages change
```

### **3. Error Handling**

```tsx
try {
  await sendMessage(text); // Convex operation
  clearInput(); // Success: clear UI (Zustand)
} catch (error) {
  setError(error.message); // Error: show in UI (Zustand)
  restoreInput(text); // Restore previous state (Zustand)
}
```

## ✅ **Benefits of This Architecture**

### **Performance**

- **Immediate UI Updates**: Zustand provides instant feedback
- **Optimistic Updates**: UI responds before server confirms
- **Selective Re-renders**: Zustand selectors prevent unnecessary updates

### **Reliability**

- **Error Recovery**: UI state can be restored on server errors
- **Offline Resilience**: UI remains responsive during network issues
- **Data Consistency**: Convex ensures server state is always in sync

### **Developer Experience**

- **Clear Separation**: UI logic vs business logic
- **Type Safety**: Both Zustand and Convex are fully typed
- **Debugging**: Easy to track whether issues are UI or server-related

## 🚫 **Anti-Patterns to Avoid**

```tsx
// ❌ DON'T: Store server data in Zustand
const messages = useZustandMessages(); // Bad: Data should come from Convex

// ❌ DON'T: Store UI state in Convex
const isTyping = useQuery(api.ui.getTypingState); // Bad: UI state belongs in Zustand

// ❌ DON'T: Mix concerns
const { messages, isTyping } = useQuery(api.chat.getEverything); // Bad: Mixed responsibilities

// ✅ DO: Separate concerns
const messages = useQuery(api.messages.getMessages); // Convex: Server data
const isTyping = useTypingState(); // Zustand: UI state
```

## 🎯 **Summary**

**Perfect Architecture:**

- **Zustand**: Manages what the user sees and interacts with
- **Convex**: Manages what gets saved and synchronized
- **Clear Boundaries**: UI state vs Server state
- **Optimal Performance**: Immediate UI + Real-time sync

This gives you the best of both worlds: **responsive UI** and **reliable data**! 🚀
