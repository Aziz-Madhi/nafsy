# Separate Chat Histories Implementation

## ✅ **Architecture Implemented**

The chat system now has **completely separate histories**:

- **Main Chat**: Structured therapy conversations (`mainChatMessages` table)
- **Vent History**: Quick emotional vents from floating chat (`ventChatMessages` table)

## 🗄️ **Database Schema**

### **Separate Tables Created:**

```ts
// Main chat conversations (structured therapy sessions)
mainChatMessages: defineTable({
  userId: v.id('users'),
  content: v.string(),
  role: v.union(v.literal('user'), v.literal('assistant')),
  sessionId: v.string(),
  createdAt: v.number(),
});

// Vent chat conversations (quick emotional vents)
ventChatMessages: defineTable({
  userId: v.id('users'),
  content: v.string(),
  role: v.union(v.literal('user'), v.literal('assistant')),
  ventSessionId: v.string(),
  createdAt: v.number(),
});

// Chat sessions metadata (for both types)
chatSessions: defineTable({
  userId: v.id('users'),
  type: v.union(v.literal('main'), v.literal('vent')),
  sessionId: v.string(),
  title: v.string(),
  startedAt: v.number(),
  lastMessageAt: v.number(),
  messageCount: v.number(),
});
```

## 🔌 **API Endpoints Implemented**

### **Main Chat APIs** (`convex/mainChat.ts`)

- `getMainChatMessages` - Get main conversation messages
- `sendMainMessage` - Send message to main chat
- `getMainSessions` - Get all main chat sessions for history
- `getCurrentMainSessionId` - Get active main session
- `deleteMainSession` - Delete main chat session
- `startNewMainSession` - Create new main chat session

### **Vent Chat APIs** (`convex/ventChat.ts`)

- `getCurrentVentMessages` - Get recent vent messages (for floating chat)
- `getVentChatMessages` - Get vent messages for specific session
- `sendVentMessage` - Send message to vent chat
- `getVentSessions` - Get all vent sessions for history
- `deleteVentSession` - Delete vent session

## 💻 **UI Implementation**

### **FloatingChat (Vent System)**

```tsx
// Uses vent-specific endpoints
const ventMessages = useQuery(api.ventChat.getCurrentVentMessages, {
  userId,
  limit: 3,
});
const sendVentMessage = useMutation(api.ventChat.sendVentMessage);

// Contextual vent responses
const ventResponses = {
  stress: "That sounds really stressful. Take a deep breath. You're safe here.",
  anxiety: 'Anxiety is tough. Remember, this feeling will pass.',
  sadness: "I hear your sadness. It's okay to feel this way.",
  anger:
    'Your frustration is valid. Sometimes we need to let these feelings out.',
  work: 'Work stress is real. Remember to prioritize your mental health.',
};
```

### **Main Chat (Therapy System)**

```tsx
// Uses main-specific endpoints
const mainMessages = useQuery(api.mainChat.getMainChatMessages, { userId });
const sendMainMessage = useMutation(api.mainChat.sendMainMessage);

// Structured therapy responses
const therapyResponses = {
  anxiety:
    "I understand you're feeling anxious. Would you like to try a breathing exercise?",
  mood: 'Tracking your mood is a great step! You can use the Mood tab.',
  exercises:
    'Great choice! Check out the Exercises tab for breathing and mindfulness.',
};
```

### **Chat History Screen** (`/chat-history`)

```
┌─────────────────────────────┐
│         Chat History        │
├─────────────────────────────┤
│  [Main Chat] [Vent History] │
├─────────────────────────────┤
│ Main Chat Tab:              │
│ 💬 Morning Session          │
│ 🗣️ Anxiety Discussion       │
│ 💭 Evening Check-in         │
│                             │
│ Vent History Tab:           │
│ 😤 Stress Relief - 2:30pm   │
│ 😟 Work Anxiety - 11:45am   │
│ 💔 Feeling Down - Yesterday │
└─────────────────────────────┘
```

## 🎯 **Benefits Achieved**

### **Complete Separation**

- **Different purposes**: Main for therapy, vent for emotional release
- **Different storage**: Separate database tables
- **Different responses**: Contextual AI based on conversation type
- **Different UI**: Structured vs quick modal interface

### **Enhanced User Experience**

- **Quick venting**: FloatingChat for immediate emotional release
- **Structured therapy**: Main chat for deeper conversations
- **Clear history**: Separate sections for different conversation types
- **Persistent sessions**: Both types save conversation history

### **Smart AI Responses**

- **Vent responses**: Empathetic, immediate validation
- **Therapy responses**: Structured, solution-oriented guidance
- **Context-aware**: Different tone based on conversation type

## 🔄 **Data Flow**

### **Vent Flow (FloatingChat)**

```
User types in floating chat
     ↓
Zustand: Update UI immediately
     ↓
Convex: Save to ventChatMessages
     ↓
AI: Generate empathetic vent response
     ↓
Convex: Save AI response to ventChatMessages
     ↓
UI: Auto-update with real-time data
```

### **Main Flow (Chat Tab)**

```
User types in main chat
     ↓
Zustand: Update UI state
     ↓
Convex: Save to mainChatMessages
     ↓
AI: Generate therapeutic response
     ↓
Convex: Save AI response to mainChatMessages
     ↓
UI: Auto-update with real-time data
```

## 🎨 **Session Management**

### **Smart Titles**

- **Vent**: `😤 Stress Relief - 2:30pm`, `😟 Work Anxiety - 11:45am`
- **Main**: `🌅 Morning Check-in`, `🌙 Evening Session`

### **Auto-grouping**

- **Sessions**: Conversations grouped by time/topic
- **Persistence**: All conversations saved and accessible
- **Deletion**: Users can delete sessions they don't want

## ✅ **Implementation Complete**

Your app now has:

- **Separate chat histories** ✅
- **Different AI personalities** ✅
- **Zustand for UI state** ✅
- **Convex for server data** ✅
- **Chat history browsing** ✅
- **Session management** ✅

**Perfect separation achieved!** Users can vent quickly in floating chat and have structured conversations in main chat, with completely separate histories. 🎉
