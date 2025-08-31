/**
 * Offline-aware data hooks
 * These hooks provide seamless offline/online data access
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useAuth } from '@clerk/clerk-expo';
import { api } from '../../convex/_generated/api';
// Local-first SQLite foundation (moods)
import {
  initLocalFirstDB,
  getLastNMoods as dbGetLastNMoods,
  getTodayMood as dbGetTodayMood,
  getMoodStats,
  importMoodsFromServer,
  recordMoodLocal,
  ackMoodSynced,
  subscribeLocalFirst,
} from '~/lib/local-first/sqlite';
// Exercises + progress via SQLite
import {
  importExercisesFromServer,
  getExercisesWithProgress as dbGetExercisesWithProgress,
  searchExercisesLocal,
  getUserProgressStats as dbGetUserProgressStats,
  recordProgressLocal,
  ackProgressSynced,
  // Chat functions
  getChatMessages as dbGetChatMessages,
  getChatSessions as dbGetChatSessions,
  getCurrentChatSession as dbGetCurrentChatSession,
  importChatMessagesFromServer,
  importChatSessionsFromServer,
  recordChatMessageLocal,
  ackChatMessageSynced,
  type ChatType,
  type ChatMessageRow,
  type ChatSessionRow,
} from '~/lib/local-first/sqlite';
import { syncManager } from '~/lib/offline/sync-manager';
import type {
  OfflineMood,
  OfflineExercise,
  OfflineUserProgress,
} from '~/lib/offline/types';
import NetInfo from '@react-native-community/netinfo';
import { logger } from '~/lib/logger';
import { useCurrentUser } from '~/hooks/useSharedData';
import { setActiveLocalUser } from '~/lib/local-first/sqlite';

/**
 * Hook to track online/offline status
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<
    boolean | null
  >(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected === true);
      setIsInternetReachable(state.isInternetReachable);
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(state.isConnected === true);
      setIsInternetReachable(state.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  return { isOnline, isInternetReachable };
}

/**
 * Hook to get sync status
 */
export function useSyncStatus() {
  const [syncStatus, setSyncStatus] = useState(syncManager.getSyncStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(syncManager.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const triggerSync = useCallback(async () => {
    const result = await syncManager.syncAll();
    setSyncStatus(syncManager.getSyncStatus());
    return result;
  }, []);

  // Merge failed op counts into pending to surface issues in UI badges
  const mergedPending = {
    moods:
      (syncStatus.pendingCounts?.moods || 0) +
      ((syncStatus as any).failedCounts?.moods || 0),
    exercises:
      (syncStatus.pendingCounts?.exercises || 0) +
      ((syncStatus as any).failedCounts?.exercises || 0),
    userProgress:
      (syncStatus.pendingCounts?.userProgress || 0) +
      ((syncStatus as any).failedCounts?.userProgress || 0),
    chatCoach:
      ((syncStatus.pendingCounts as any)?.chatCoach || 0) +
      ((syncStatus as any).failedCounts?.chatCoach || 0),
    chatEvent:
      ((syncStatus.pendingCounts as any)?.chatEvent || 0) +
      ((syncStatus as any).failedCounts?.chatEvent || 0),
    chatCompanion:
      ((syncStatus.pendingCounts as any)?.chatCompanion || 0) +
      ((syncStatus as any).failedCounts?.chatCompanion || 0),
  };

  return { ...syncStatus, pendingCounts: mergedPending, triggerSync };
}

/**
 * Offline-aware mood data hook
 */
export function useOfflineMoodData(limit: number = 365) {
  const { isSignedIn } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [localMoods, setLocalMoods] = useState<OfflineMood[]>([]);
  const currentUser = useCurrentUser();

  // Get data from Convex when online
  const serverMoods = useQuery(
    api.moods.getMoods,
    isSignedIn && isOnline ? { limit } : 'skip'
  );

  // Load local data (SQLite) and subscribe to changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initLocalFirstDB();
        if (!currentUser?._id) return;
        const rows = await dbGetLastNMoods(currentUser._id as any, limit);
        if (!mounted) return;
        setLocalMoods(
          rows.map((m) => ({
            _id: (m as any).serverId as any,
            localId: m.id,
            mood: m.mood,
            rating: m.rating ?? undefined,
            moodCategory: m.moodCategory ?? undefined,
            note: m.note ?? undefined,
            tags: m.tags,
            timeOfDay: m.timeOfDay,
            createdAt: m.createdAt,
            metadata: {
              lastSynced: 0,
              lastModified: m.updatedAt,
              syncStatus: 'synced',
              version: 1,
            },
          }))
        );
      } catch (e) {
        logger.warn(
          'Failed to read moods from SQLite, fallback to memory',
          'OfflineData',
          e
        );
      }
    })();

    const unsub = subscribeLocalFirst(async () => {
      try {
        if (!currentUser?._id) return;
        const rows = await dbGetLastNMoods(currentUser._id as any, limit);
        setLocalMoods(
          rows.map((m) => ({
            _id: (m as any).serverId as any,
            localId: m.id,
            mood: m.mood,
            rating: m.rating ?? undefined,
            moodCategory: m.moodCategory ?? undefined,
            note: m.note ?? undefined,
            tags: m.tags,
            timeOfDay: m.timeOfDay,
            createdAt: m.createdAt,
            metadata: {
              lastSynced: 0,
              lastModified: m.updatedAt,
              syncStatus: 'synced',
              version: 1,
            },
          }))
        );
      } catch {}
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [limit, currentUser?._id]);

  // Sync server data to local store when available
  useEffect(() => {
    if (serverMoods && serverMoods.length > 0) {
      // Debounce the import to avoid rapid successive calls
      const timeoutId = setTimeout(async () => {
        try {
          await importMoodsFromServer(serverMoods);
        } catch (e) {
          // Log the error but don't let it bubble up
          logger.warn(
            'Failed importing server moods to SQLite',
            'OfflineData',
            e
          );
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [serverMoods]);

  // Return local data (which includes synced server data)
  return useMemo(() => {
    return localMoods.map((mood) => ({
      _id: mood._id,
      mood: mood.mood,
      rating: mood.rating,
      moodCategory: mood.moodCategory,
      note: mood.note,
      tags: mood.tags,
      timeOfDay: mood.timeOfDay,
      createdAt: mood.createdAt,
      _creationTime: mood.createdAt,
    }));
  }, [localMoods]);
}

/**
 * Offline-aware today's mood hook
 */
export function useOfflineTodayMood() {
  const { isSignedIn } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [todayMood, setTodayMood] = useState<OfflineMood | undefined>();
  const currentUser = useCurrentUser();

  // Get data from Convex when online
  const serverMood = useQuery(
    api.moods.getTodayMood,
    isSignedIn && isOnline ? {} : 'skip'
  );

  // Load local data (SQLite) + subscribe
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initLocalFirstDB();
        if (!currentUser?._id) return;
        const m = await dbGetTodayMood(currentUser._id as any);
        if (!mounted) return;
        setTodayMood(
          m
            ? {
                _id: (m as any).serverId as any,
                localId: m.id,
                mood: m.mood,
                rating: m.rating ?? undefined,
                moodCategory: m.moodCategory ?? undefined,
                note: m.note ?? undefined,
                tags: m.tags,
                timeOfDay: m.timeOfDay,
                createdAt: m.createdAt,
                metadata: {
                  lastSynced: 0,
                  lastModified: m.updatedAt,
                  syncStatus: 'synced',
                  version: 1,
                },
              }
            : undefined
        );
      } catch {}
    })();

    const unsub = subscribeLocalFirst(async () => {
      try {
        if (!currentUser?._id) return;
        const m = await dbGetTodayMood(currentUser._id as any);
        setTodayMood(
          m
            ? {
                _id: (m as any).serverId as any,
                localId: m.id,
                mood: m.mood,
                rating: m.rating ?? undefined,
                moodCategory: m.moodCategory ?? undefined,
                note: m.note ?? undefined,
                tags: m.tags,
                timeOfDay: m.timeOfDay,
                createdAt: m.createdAt,
                metadata: {
                  lastSynced: 0,
                  lastModified: m.updatedAt,
                  syncStatus: 'synced',
                  version: 1,
                },
              }
            : undefined
        );
      } catch {}
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [currentUser?._id]);

  // Sync server data to local store when available
  useEffect(() => {
    if (serverMood) {
      // Debounce the import to avoid rapid successive calls
      const timeoutId = setTimeout(async () => {
        try {
          await importMoodsFromServer([serverMood]);
        } catch (e) {
          // Log the error but don't let it bubble up
          logger.warn(
            'Failed importing today mood to SQLite',
            'OfflineData',
            e
          );
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [serverMood]);

  return todayMood
    ? {
        _id: todayMood._id,
        mood: todayMood.mood,
        rating: todayMood.rating,
        moodCategory: todayMood.moodCategory,
        note: todayMood.note,
        tags: todayMood.tags,
        timeOfDay: todayMood.timeOfDay,
        createdAt: todayMood.createdAt,
        _creationTime: todayMood.createdAt,
      }
    : undefined;
}

/**
 * Offline-aware mood stats hook
 */
export function useOfflineMoodStats(days: number = 30) {
  const { isSignedIn } = useAuth();
  const { isOnline } = useNetworkStatus();
  const currentUser = useCurrentUser();
  const [stats, setStats] = useState({
    totalEntries: 0,
    averageRating: 0,
    moodCounts: {} as Record<string, number>,
    streak: 0,
  });

  // Get data from Convex when online
  const serverStats = useQuery(
    api.moods.getMoodStats,
    isSignedIn && isOnline ? { days } : 'skip'
  );

  // Load stats from SQLite
  useEffect(() => {
    const loadStats = async () => {
      try {
        if (!currentUser?._id) return;
        const dbStats = await getMoodStats(currentUser._id as any, days);
        setStats(dbStats);
      } catch (error) {
        logger.error(
          'Failed to load mood stats from SQLite',
          'useOfflineMoodStats',
          error
        );
      }
    };

    loadStats();

    // Subscribe to SQLite changes
    const unsubscribe = subscribeLocalFirst(() => {
      loadStats();
    });

    return unsubscribe;
  }, [days, currentUser?._id]);

  // Merge server stats with local if available
  return serverStats || stats;
}

/**
 * Offline-aware create mood mutation
 */
export function useOfflineCreateMood() {
  const { isOnline } = useNetworkStatus();
  const serverMutation = useMutation(api.moods.createMood);
  const currentUser = useCurrentUser();

  return useCallback(
    async (moodData: {
      mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry';
      rating?: number;
      moodCategory?: string;
      note?: string;
      tags?: string[];
      timeOfDay?: 'morning' | 'evening';
    }) => {
      // Create mood locally in SQLite and queue outbox
      if (!currentUser?._id) throw new Error('No current user');
      const localId = await recordMoodLocal({
        userId: currentUser._id as any,
        mood: moodData.mood,
        rating: moodData.rating,
        moodCategory: moodData.moodCategory,
        note: moodData.note,
        tags: moodData.tags,
        timeOfDay: moodData.timeOfDay,
      });

      // Try to sync with server if online
      if (isOnline) {
        try {
          const serverId = await serverMutation(moodData);
          await ackMoodSynced({ localId, serverId: String(serverId) });

          logger.info('Mood created and synced', 'OfflineData');
        } catch (error) {
          logger.error('Failed to sync mood to server', 'OfflineData', error);
          // Keep the mood in pending state for later sync
        }
      }

      return {
        _id: undefined,
        localId,
        createdAt: Date.now(),
        metadata: {
          lastSynced: 0,
          lastModified: Date.now(),
          syncStatus: isOnline ? 'syncing' : 'pending',
          version: 1,
        },
      } as unknown as OfflineMood;
    },
    [isOnline, serverMutation, currentUser?._id]
  );
}

/**
 * Offline-aware exercises with progress hook
 */
export function useOfflineExercisesWithProgress(
  category?: string,
  limit?: number
) {
  const { isSignedIn } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [exercises, setExercises] = useState<any[]>([]);
  const currentUser = useCurrentUser();

  // Get data from Convex when online
  const serverExercises = useQuery(
    api.exercises.getExercisesWithProgress,
    isSignedIn && isOnline ? { category, limit } : 'skip'
  );

  // Load local data (SQLite)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const rows = await dbGetExercisesWithProgress({
          userId: (currentUser?._id as any) || undefined,
          category,
          limit,
        });
        if (!mounted) return;
        setExercises(rows);
      } catch (e) {
        logger.warn('Failed to load exercises from SQLite', 'OfflineData', e);
      }
    })();

    // Subscribe to local database changes for event-driven updates
    const unsub = subscribeLocalFirst(async () => {
      if (!mounted) return;
      try {
        const rows = await dbGetExercisesWithProgress({
          userId: (currentUser?._id as any) || undefined,
          category,
          limit,
        });
        setExercises(rows);
      } catch (e) {
        logger.warn(
          'Failed to refresh exercises on DB change',
          'OfflineData',
          e
        );
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [category, limit, currentUser?._id]);

  // Sync server data to local DB when available
  useEffect(() => {
    if (serverExercises && serverExercises.length > 0) {
      // Import exercises; progress will be imported via dedicated pull in sync
      const exercisesOnly = serverExercises.map(
        ({ isCompleted, completionCount, lastCompleted, ...exercise }) =>
          exercise
      );
      importExercisesFromServer(exercisesOnly).catch(() => {});
    }
  }, [serverExercises]);

  return exercises;
}

/**
 * Offline-aware user stats hook
 */
export function useOfflineUserStats(days?: number) {
  const { isSignedIn } = useAuth();
  const { isOnline } = useNetworkStatus();
  const currentUser = useCurrentUser();
  const [stats, setStats] = useState<any>({
    totalSessions: 0,
    totalMinutes: 0,
    uniqueExercises: 0,
    averageDuration: 0,
    streak: 0,
    categoryCounts: {},
  });

  // Get data from Convex when online
  const serverStats = useQuery(
    api.userProgress.getUserStats,
    isSignedIn && isOnline ? { days } : 'skip'
  );

  // Update local stats (SQLite) with event-driven updates
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentUser?._id) return;
      const s = await dbGetUserProgressStats(currentUser._id as any, days);
      if (!mounted) return;
      setStats(s);
    })();

    // Subscribe to local database changes
    const unsub = subscribeLocalFirst(async () => {
      if (!mounted) return;
      try {
        if (!currentUser?._id) return;
        const s = await dbGetUserProgressStats(currentUser._id as any, days);
        setStats(s);
      } catch (e) {
        logger.warn(
          'Failed to refresh user stats on DB change',
          'OfflineData',
          e
        );
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [days, currentUser?._id]);

  // Return server stats if available, otherwise local
  return serverStats || stats;
}

/**
 * Offline-aware record progress mutation
 */
export function useOfflineRecordProgress() {
  const { isOnline } = useNetworkStatus();
  const serverMutation = useMutation(api.userProgress.recordCompletion);
  const currentUser = useCurrentUser();

  return useCallback(
    async (progressData: {
      exerciseId: string;
      duration: number;
      feedback?: string;
    }) => {
      // Create progress locally (SQLite + outbox)
      if (!currentUser?._id) throw new Error('No current user');
      const localId = await recordProgressLocal({
        userId: currentUser._id as any,
        exerciseId: progressData.exerciseId,
        duration: progressData.duration,
        feedback: progressData.feedback,
      });

      // Try to sync with server if online
      if (isOnline) {
        try {
          const serverId = await serverMutation(progressData);
          await ackProgressSynced({ localId, serverId: String(serverId) });

          logger.info('Progress recorded and synced', 'OfflineData');
        } catch (error) {
          logger.error(
            'Failed to sync progress to server',
            'OfflineData',
            error
          );
          // Keep the progress in pending state for later sync
        }
      }

      return { localId } as any;
    },
    [isOnline, serverMutation, currentUser?._id]
  );
}

/**
 * Offline-aware chat messages hook
 */
export function useOfflineChatMessages(
  sessionId: string | null,
  chatType: ChatType
) {
  const { isSignedIn } = useAuth();
  const { isOnline } = useNetworkStatus();
  const currentUser = useCurrentUser();
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);

  // Get the right API based on chat type
  const getConvexQuery = () => {
    switch (chatType) {
      case 'coach':
        return api.mainChat.getMainChatMessages;
      case 'event':
        return api.ventChat.getVentMessages;
      case 'companion':
        return api.companionChat.getCompanionChatMessages;
    }
  };

  // Get data from Convex when online
  const serverMessages = useQuery(
    getConvexQuery(),
    isSignedIn && isOnline && sessionId ? { sessionId, limit: 50 } : 'skip'
  );

  // Load local data (SQLite) and subscribe to changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentUser?._id || !sessionId) return;
      try {
        await initLocalFirstDB();
        const rows = await dbGetChatMessages(
          currentUser._id as any,
          sessionId,
          chatType,
          50
        );
        if (!mounted) return;
        setMessages(rows);
      } catch (e) {
        logger.warn(
          'Failed to load chat messages from SQLite',
          'OfflineData',
          e
        );
      }
    })();

    const unsub = subscribeLocalFirst(async () => {
      if (!mounted || !currentUser?._id || !sessionId) return;
      try {
        const rows = await dbGetChatMessages(
          currentUser._id as any,
          sessionId,
          chatType,
          50
        );
        setMessages(rows);
      } catch (e) {
        logger.warn('Failed to refresh chat messages', 'OfflineData', e);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [sessionId, chatType, currentUser?._id]);

  // Sync server data to local store when available
  useEffect(() => {
    if (serverMessages && serverMessages.length > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          await importChatMessagesFromServer(serverMessages as any, chatType);
        } catch (e) {
          logger.warn(
            'Failed importing chat messages to SQLite',
            'OfflineData',
            e
          );
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [serverMessages, chatType]);

  return messages.map((msg) => ({
    _id: msg.server_id || msg.id,
    content: msg.content,
    role: msg.role,
    sessionId: msg.session_id,
    createdAt: msg.created_at,
    _creationTime: msg.created_at,
  }));
}

/**
 * Offline-aware chat sessions hook
 */
export function useOfflineChatSessions(chatType: ChatType) {
  const { isSignedIn } = useAuth();
  const { isOnline } = useNetworkStatus();
  const currentUser = useCurrentUser();
  const [sessions, setSessions] = useState<ChatSessionRow[]>([]);

  // Get the right API based on chat type
  const getConvexQuery = () => {
    switch (chatType) {
      case 'coach':
        return api.mainChat.getMainSessions;
      case 'event':
        return api.ventChat.getVentSessions;
      case 'companion':
        return api.companionChat.getCompanionChatSessions;
    }
  };

  // Get data from Convex when online
  const serverSessions = useQuery(
    getConvexQuery(),
    isSignedIn && isOnline ? {} : 'skip'
  );

  // Load local data (SQLite) and subscribe to changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!currentUser?._id) return;
      try {
        await initLocalFirstDB();
        const rows = await dbGetChatSessions(currentUser._id as any, chatType);
        if (!mounted) return;
        setSessions(rows);
      } catch (e) {
        logger.warn(
          'Failed to load chat sessions from SQLite',
          'OfflineData',
          e
        );
      }
    })();

    const unsub = subscribeLocalFirst(async () => {
      if (!mounted || !currentUser?._id) return;
      try {
        const rows = await dbGetChatSessions(currentUser._id as any, chatType);
        setSessions(rows);
      } catch (e) {
        logger.warn('Failed to refresh chat sessions', 'OfflineData', e);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [chatType, currentUser?._id]);

  // Sync server data to local store when available
  useEffect(() => {
    if (serverSessions && serverSessions.length > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          await importChatSessionsFromServer(serverSessions as any, chatType);
        } catch (e) {
          logger.warn(
            'Failed importing chat sessions to SQLite',
            'OfflineData',
            e
          );
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [serverSessions, chatType]);

  return sessions.map((session) => ({
    _id: session.server_id || session.id,
    sessionId: session.session_id,
    title: session.title || 'Untitled Session',
    startedAt: session.started_at,
    lastMessageAt: session.last_message_at || session.started_at,
    messageCount: session.message_count || 0,
  }));
}

/**
 * Offline-aware send message hook (returns error when offline)
 */
export function useOfflineSendMessage(chatType: ChatType) {
  const { isOnline } = useNetworkStatus();
  const currentUser = useCurrentUser();

  // Get the right API based on chat type
  const getConvexMutation = () => {
    switch (chatType) {
      case 'coach':
        return api.mainChat.sendMainMessage;
      case 'event':
        return api.ventChat.sendVentMessage;
      case 'companion':
        return api.companionChat.sendCompanionMessage;
    }
  };

  const serverMutation = useMutation(getConvexMutation());

  return useCallback(
    async (content: string, sessionId?: string) => {
      // Check if offline
      if (!isOnline) {
        throw new Error('You need to be online to chat with the AI');
      }

      // Send message to server
      try {
        const result = await serverMutation({
          content,
          role: 'user' as const,
          sessionId,
        });

        return result;
      } catch (error) {
        logger.error('Failed to send message', 'OfflineData', error);
        throw error;
      }
    },
    [isOnline, serverMutation]
  );
}

/**
 * Initialize offline data system
 */
export async function initializeOfflineData(userId: string | null) {
  if (userId) {
    try {
      setActiveLocalUser(userId);
      await initLocalFirstDB();
    } catch (e) {
      logger.warn('Failed to init local-first DB', 'OfflineData', e);
    }
    await syncManager.initialize(userId as any);
    logger.info('Offline data system initialized', 'OfflineData');
  }
}

/**
 * Cleanup offline data system
 */
export function cleanupOfflineData() {
  syncManager.cleanup();
  setActiveLocalUser(null);
  logger.info('Offline data system cleaned up', 'OfflineData');
}
