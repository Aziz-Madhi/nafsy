// Store types for Zustand state management
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered';
}

export interface MoodEntry {
  id: string;
  mood: 'sad' | 'anxious' | 'neutral' | 'happy' | 'angry';
  date: Date;
  note?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ar';
  notificationsEnabled: boolean;
  moodRemindersEnabled: boolean;
  moodReminderTime: string; // "09:00"
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: 'breathing' | 'mindfulness' | 'physical' | 'cognitive';
  duration: number; // in minutes
  completed: boolean;
  completedAt?: Date;
}