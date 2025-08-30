/**
 * Offline data types and interfaces
 */

import type { Id } from '../../../convex/_generated/dataModel';

// Sync status for tracking data state
export type SyncStatus = 'synced' | 'pending' | 'error' | 'syncing';

// Base metadata for all offline data
export interface OfflineMetadata {
  lastSynced: number;
  lastModified: number;
  syncStatus: SyncStatus;
  version: number;
}

// Mood data with offline metadata
export interface OfflineMood {
  _id?: Id<'moods'>;
  localId: string; // Client-generated ID for offline entries
  userId?: Id<'users'>;
  mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry';
  rating?: number;
  moodCategory?: string;
  note?: string;
  tags?: string[];
  timeOfDay?: 'morning' | 'evening';
  createdAt: number;
  metadata: OfflineMetadata;
}

// Exercise data with offline metadata
export interface OfflineExercise {
  _id?: Id<'exercises'>;
  localId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category:
    | 'breathing'
    | 'mindfulness'
    | 'journaling'
    | 'movement'
    | 'relaxation';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  instructions: string[];
  instructionsAr: string[];
  metadata: OfflineMetadata;
}

// User progress with offline metadata
export interface OfflineUserProgress {
  _id?: Id<'userProgress'>;
  localId: string;
  userId?: Id<'users'>;
  exerciseId?: Id<'exercises'>;
  exerciseLocalId?: string; // Reference to offline exercise
  completedAt: number;
  duration: number;
  feedback?: string;
  metadata: OfflineMetadata;
}

// User data with offline metadata
export interface OfflineUser {
  _id?: Id<'users'>;
  clerkId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  language: string;
  createdAt: number;
  lastActive: number;
  metadata: OfflineMetadata;
}

// Chat session with offline metadata
export interface OfflineChatSession {
  _id?:
    | Id<'chatSessions'>
    | Id<'ventChatSessions'>
    | Id<'companionChatSessions'>;
  localId: string;
  userId?: Id<'users'>;
  sessionId: string;
  title: string;
  type?: string;
  startedAt: number;
  lastMessageAt: number;
  messageCount: number;
  metadata: OfflineMetadata;
}

// Chat message with offline metadata
export interface OfflineChatMessage {
  _id?:
    | Id<'mainChatMessages'>
    | Id<'ventChatMessages'>
    | Id<'companionChatMessages'>;
  localId: string;
  userId?: Id<'users'>;
  content: string;
  role: 'user' | 'assistant';
  sessionId: string;
  createdAt: number;
  metadata: OfflineMetadata;
}

// Sync queue item for pending changes
export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection:
    | 'moods'
    | 'exercises'
    | 'userProgress'
    | 'users'
    | 'chatSessions'
    | 'chatMessages';
  data: any;
  timestamp: number;
  retryCount: number;
  error?: string;
}

// Offline store state
export interface OfflineStoreState<T> {
  data: Map<string, T>;
  syncQueue: SyncQueueItem[];
  lastSyncTime: number;
  isOnline: boolean;
  isSyncing: boolean;
  syncError: string | null;
}

// Sync result
export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}
