// Shared types for chat functionality

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered';
  role: 'user' | 'assistant';
}

export interface ChatUser {
  id: string;
  name?: string;
  avatar?: string;
}

export interface QuickReply {
  text: string;
  icon?: string;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  avatar?: string;
  index?: number;
  status?: 'sending' | 'sent' | 'delivered';
}