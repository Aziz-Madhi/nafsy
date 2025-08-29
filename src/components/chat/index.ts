// Consolidated chat components
export { ChatBubble } from './ChatComponents';
export { default as SendingSpinner } from './SendingSpinner';

export { ChatHistorySidebar } from './ChatHistorySidebar';

// New modular components
export { ChatScreen } from './ChatScreen';
export { ChatHeader } from './ChatHeader';
export { SessionStatusDisplay } from './SessionStatusDisplay';
export { ChatWelcomeHeader } from './ChatWelcomeHeader';
export { ChatMessageList } from './ChatMessageList';
export { ChatTypeSelector } from './ChatTypeSelector';
export { ChatTypeToggle } from './ChatTypeToggle';
export { ChatPersonalityHeader } from './ChatPersonalityHeader';

// Types
export type {
  ChatMessage,
  ChatUser,
  QuickReply,
  ChatInputProps,
  ChatBubbleProps,
} from './types';
