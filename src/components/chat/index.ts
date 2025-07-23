// Consolidated chat components
export {
  ChatBubble,
  ChatInput,
  TypingIndicator,
  QuickReplyButton,
} from './ChatComponents';
export { default as SendingSpinner } from './SendingSpinner';

export { ChatHistorySidebar } from './ChatHistorySidebar';
export { FloatingChat } from './FloatingChat';

// Types
export type {
  ChatMessage,
  ChatUser,
  QuickReply,
  ChatInputProps,
  ChatBubbleProps,
} from './types';
