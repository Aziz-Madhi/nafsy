import { lazy } from 'react';

// Consolidated chat components
export {
  ChatBubble,
  ChatInput,
  TypingIndicator,
  QuickReplyButton,
} from './ChatComponents';

// Lazy-loaded heavy components
export const FloatingChat = lazy(() =>
  import('./FloatingChat').then((module) => ({ default: module.FloatingChat }))
);

// Types
export type {
  ChatMessage,
  ChatUser,
  QuickReply,
  ChatInputProps,
  ChatBubbleProps,
} from './types';
