// 🎯 Unified Type Definitions for Nafsy App
// This file consolidates all type definitions to eliminate duplication

// ===== USER & AUTHENTICATION =====
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

export interface ChatUser {
  id: string;
  name?: string;
  avatar?: string;
}

// ===== CHAT TYPES =====
export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  status?: 'sending' | 'sent' | 'delivered';
  role: 'user' | 'assistant';
}

export interface QuickReply {
  text: string;
  icon?: string;
}

// ===== MOOD TYPES =====
export interface MoodEntry {
  id: string;
  mood: 'sad' | 'anxious' | 'neutral' | 'happy' | 'angry';
  date: Date;
  note?: string;
}

export type MoodType = 'sad' | 'anxious' | 'neutral' | 'happy' | 'angry';

// ===== EXERCISE TYPES =====
export interface Exercise {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category:
    | 'breathing'
    | 'mindfulness'
    | 'movement'
    | 'cbt'
    | 'journaling'
    | 'relaxation';
  imageUrl?: string;
  icon: string;
  color: string;
  steps?: string[];
  stepsAr?: string[];
  benefits?: string[];
  benefitsAr?: string[];
}

export type ExerciseCategory =
  | 'breathing'
  | 'mindfulness'
  | 'movement'
  | 'cbt'
  | 'journaling'
  | 'relaxation';
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ExerciseCategory_Config {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

// ===== APP SETTINGS =====
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ar' | 'system';
  notificationsEnabled: boolean;
  moodRemindersEnabled: boolean;
  moodReminderTime: string; // "09:00"
}

export type Theme = 'light' | 'dark' | 'system';

// ===== COMPONENT PROP TYPES =====
export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

export interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  avatar?: string;
  index?: number;
  status?: 'sending' | 'sent' | 'delivered';
}

export interface ExerciseCardProps {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
  index: number;
}

export interface ExerciseDetailProps {
  exercise: Exercise | null;
  visible: boolean;
  onClose: () => void;
  onStart?: (exercise: Exercise) => void;
}

export interface CategoryCardProps {
  category: ExerciseCategory_Config;
  onPress: () => void;
  index: number;
}

// ===== UTILITY TYPES =====
export type Status = 'sending' | 'sent' | 'delivered';
export type ViewMode = 'input' | 'calendar' | 'stats';

// ===== API RESPONSE TYPES =====
export interface APIResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

// ===== ANIMATION TYPES =====
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  damping?: number;
  stiffness?: number;
}
