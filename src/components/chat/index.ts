// Consolidated chat components
export {
  ChatBubble,
  TypingIndicator,
  QuickReplyButton,
} from './ChatComponents';
export { default as SendingSpinner } from './SendingSpinner';

export { ChatHistorySidebar } from './ChatHistorySidebar';

// New modular components
export { ChatScreen } from './ChatScreen';
export { ChatHeader } from './ChatHeader';
export { SessionStatusDisplay } from './SessionStatusDisplay';
export { ChatWelcomeHeader } from './ChatWelcomeHeader';
export { QuickRepliesSection } from './QuickRepliesSection';
export { ChatMessageList } from './ChatMessageList';
export { ChatInputWithNavConnection } from './ChatInputWithNavConnection';

// Types
export type {
  ChatMessage,
  ChatUser,
  QuickReply,
  ChatInputProps,
  ChatBubbleProps,
} from './types';
