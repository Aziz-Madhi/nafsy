/**
 * Simplified Sync Manager for direct SQLite ↔ Convex synchronization
 */

import type { SyncResult } from './types';
import { logger } from '../logger';
import NetInfo from '@react-native-community/netinfo';
import type { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';
import { convexClient } from '~/providers/ConvexProvider';

// SQLite operations
import {
  importMoodsFromServer,
  importExercisesFromServer,
  importUserProgressFromServer,
  getOutboxOps,
  incrementOutboxTries,
  deleteOutbox,
  getOutboxCount,
  ackMoodSynced,
  ackProgressSynced,
  getSyncCursor,
  setSyncCursor,
  moveOutboxToFailed,
  getFailedOpsCount,
  purgeFailedOps,
} from '~/lib/local-first/sqlite';

// Sync configuration
export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // in milliseconds
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

// Default configuration
const defaultConfig: SyncConfig = {
  autoSync: true,
  syncInterval: 60000, // 1 minute
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
};

// Sync manager state
interface SyncManagerState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number;
  syncErrors: string[];
  syncInterval: ReturnType<typeof setInterval> | null;
  networkUnsubscribe: (() => void) | null;
  pendingCounts: {
    moods: number;
    exercises: number;
    userProgress: number;
  };
  failedCounts?: {
    moods: number;
    exercises: number;
    userProgress: number;
  };
}

class SimplifiedSyncManager {
  private state: SyncManagerState = {
    isOnline: true,
    isSyncing: false,
    lastSyncTime: 0,
    syncErrors: [],
    syncInterval: null,
    networkUnsubscribe: null,
    pendingCounts: { moods: 0, exercises: 0, userProgress: 0 },
    failedCounts: { moods: 0, exercises: 0, userProgress: 0 },
  };

  private config: SyncConfig = defaultConfig;
  private userId: Id<'users'> | null = null;

  /**
   * Initialize the sync manager
   */
  async initialize(userId: Id<'users'> | null, config?: Partial<SyncConfig>) {
    this.userId = userId;
    this.config = { ...defaultConfig, ...config };

    // Setup network monitoring
    this.setupNetworkMonitoring();

    // Prime pending counts
    await this.refreshPendingCounts();

    // Opportunistic DLQ purge for hygiene
    await purgeFailedOps();

    // Start auto-sync if enabled
    if (this.config.autoSync) {
      this.startAutoSync();
    }

    logger.info('Simplified sync manager initialized', 'SyncManager');
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring() {
    // Clean up existing subscription
    if (this.state.networkUnsubscribe) {
      this.state.networkUnsubscribe();
    }

    // Subscribe to network state changes
    this.state.networkUnsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !this.state.isOnline;
      this.state.isOnline =
        state.isConnected === true && state.isInternetReachable !== false;

      // Trigger sync when coming online
      if (wasOffline && this.state.isOnline) {
        logger.info(
          'Network connection restored, triggering sync',
          'SyncManager'
        );
        this.syncAll();
      }
    });
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync() {
    // Clear existing interval
    this.stopAutoSync();

    // Set up new interval
    this.state.syncInterval = setInterval(() => {
      if (this.state.isOnline && !this.state.isSyncing) {
        this.syncAll();
      }
    }, this.config.syncInterval);

    logger.info(
      `Auto-sync started with interval: ${this.config.syncInterval}ms`,
      'SyncManager'
    );
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync() {
    if (this.state.syncInterval) {
      clearInterval(this.state.syncInterval);
      this.state.syncInterval = null;
      logger.info('Auto-sync stopped', 'SyncManager');
    }
  }

  /**
   * Refresh pending operation counts
   */
  private async refreshPendingCounts() {
    try {
      this.state.pendingCounts = {
        moods: await getOutboxCount('moods'),
        exercises: 0, // Exercises are read-only from server
        userProgress: await getOutboxCount('userProgress'),
      };
      this.state.failedCounts = {
        moods: await getFailedOpsCount('moods'),
        exercises: 0,
        userProgress: await getFailedOpsCount('userProgress'),
      };
    } catch (error) {
      logger.error('Failed to refresh pending counts', 'SyncManager', error);
    }
  }

  /**
   * Sync all data with backend
   */
  async syncAll(): Promise<{
    success: boolean;
    results: Record<string, SyncResult>;
    errors: string[];
  }> {
    if (!this.state.isOnline) {
      logger.warn('Cannot sync - offline', 'SyncManager');
      return {
        success: false,
        results: {},
        errors: ['Device is offline'],
      };
    }

    if (this.state.isSyncing) {
      logger.warn('Sync already in progress', 'SyncManager');
      return {
        success: false,
        results: {},
        errors: ['Sync already in progress'],
      };
    }

    if (!this.userId) {
      logger.warn('Cannot sync - no user ID', 'SyncManager');
      return {
        success: false,
        results: {},
        errors: ['Not authenticated'],
      };
    }

    if (!convexClient) {
      logger.error(
        'Cannot sync - Convex client not initialized',
        'SyncManager'
      );
      return {
        success: false,
        results: {},
        errors: ['Convex client not initialized'],
      };
    }

    this.state.isSyncing = true;
    this.state.syncErrors = [];

    const results: Record<string, SyncResult> = {};

    try {
      // Sync each entity type
      const [moodsResult, exercisesResult, progressResult] = await Promise.all([
        this.syncMoods(),
        this.syncExercises(),
        this.syncUserProgress(),
      ]);

      results.moods = moodsResult;
      results.exercises = exercisesResult;
      results.userProgress = progressResult;

      // Update last sync time
      this.state.lastSyncTime = Date.now();

      // Refresh pending counts
      await this.refreshPendingCounts();

      // Opportunistically purge stale failed ops after a successful round
      await purgeFailedOps();

      const hasErrors = Object.values(results).some((r) => !r.success);
      return {
        success: !hasErrors,
        results,
        errors: this.state.syncErrors,
      };
    } catch (error) {
      logger.error('Sync failed', 'SyncManager', error);
      this.state.syncErrors.push(error?.toString() || 'Unknown error');
      return {
        success: false,
        results,
        errors: this.state.syncErrors,
      };
    } finally {
      this.state.isSyncing = false;
    }
  }

  /**
   * Sync moods: Push local changes, then pull remote updates
   */
  private async syncMoods(): Promise<SyncResult> {
    try {
      let pushed = 0;
      let pulled = 0;

      // 1. Push pending local operations from outbox
      const pendingOps = await getOutboxOps('moods', 100);

      for (const op of pendingOps) {
        try {
          let payload: any;
          try {
            payload = JSON.parse(op.payload_json);
          } catch (parseError) {
            logger.error('Invalid JSON in outbox operation', 'SyncManager', {
              opId: op.op_id,
              error: parseError,
            });
            await incrementOutboxTries(op.op_id);
            continue;
          }

          if (op.op === 'upsert') {
            // Safety: ensure op belongs to current user if marked
            if (payload?.userId && this.userId && payload.userId !== this.userId) {
              logger.warn('Skipping mood op for different user', 'SyncManager', {
                opId: op.op_id,
              });
              // Skip without consuming; sign-out flow clears outbox
              continue;
            }
            // Map 'at' to 'createdAt' for server compatibility
            const serverPayload = {
              ...payload,
              createdAt: payload.at || Date.now(),
            };
            delete serverPayload.at;
            delete serverPayload.localId; // Remove localId from server payload
            delete (serverPayload as any).userId;

            // Push as create to Convex
            const result = await convexClient.mutation(
              api.moods.createMood,
              serverPayload
            );

            if (result) {
              // Mark as synced in SQLite
              await ackMoodSynced({
                localId: payload.localId,
                serverId: result,
                updatedAt: Date.now(),
              });

              // Remove from outbox
              await deleteOutbox(op.op_id);
              pushed++;
            }
          } else if (op.op === 'delete') {
            // Handle deletion
            if (payload.serverId) {
              await convexClient.mutation(api.moods.deleteMood, {
                id: payload.serverId as Id<'moods'>,
              });

              await deleteOutbox(op.op_id);
              pushed++;
            } else {
              logger.warn(
                'Delete operation missing serverId',
                'SyncManager',
                payload
              );
              await incrementOutboxTries(op.op_id);
            }
          }
        } catch (error) {
          logger.error('Failed to push mood operation', 'SyncManager', error);
          await incrementOutboxTries(op.op_id);

          // If this attempt exhausted retries, move to DLQ
          if (op.tries + 1 >= this.config.maxRetries) {
            await moveOutboxToFailed(op, error?.toString?.() ?? 'Unknown error');
            this.state.syncErrors.push(
              `Mood op failed permanently: ${error?.toString?.() ?? 'Unknown error'}`
            );
          }
        }
      }

      // 2. Pull remote updates (incremental sync)
      if (this.userId) {
        // Get last sync cursor
        const lastMoodsSync = await getSyncCursor('lastMoodsSync');
        const startDate =
          lastMoodsSync || Date.now() - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days

        const serverMoods = await convexClient.query(api.moods.getMoods, {
          startDate,
          limit: 1000,
        });

        if (serverMoods && serverMoods.length > 0) {
          await importMoodsFromServer(serverMoods);
          pulled = serverMoods.length;

          // Update cursor to server watermark (max _creationTime)
          const watermark = Math.max(
            ...serverMoods.map((m: any) => (m?._creationTime as number) || 0)
          );
          if (Number.isFinite(watermark) && watermark > 0) {
            await setSyncCursor('lastMoodsSync', watermark);
          }
        }
      }

      logger.info(
        `Moods sync complete: pushed ${pushed}, pulled ${pulled}`,
        'SyncManager'
      );

      return {
        success: true,
        synced: pushed + pulled,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      logger.error('Failed to sync moods', 'SyncManager', error);
      this.state.syncErrors.push(`Moods: ${error?.toString()}`);
      return {
        success: false,
        synced: 0,
        failed: 1,
        errors: [error?.toString() || 'Unknown error'],
      };
    }
  }

  /**
   * Sync exercises: Pull from server only (read-only)
   */
  private async syncExercises(): Promise<SyncResult> {
    try {
      const exercises = await convexClient.query(
        api.exercises.getAllExercises,
        {}
      );

      if (exercises && exercises.length > 0) {
        await importExercisesFromServer(exercises);

        logger.info(
          `Exercises sync complete: imported ${exercises.length}`,
          'SyncManager'
        );

        return {
          success: true,
          synced: exercises.length,
          failed: 0,
          errors: [],
        };
      }

      return {
        success: true,
        synced: 0,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      logger.error('Failed to sync exercises', 'SyncManager', error);
      this.state.syncErrors.push(`Exercises: ${error?.toString()}`);
      return {
        success: false,
        synced: 0,
        failed: 1,
        errors: [error?.toString() || 'Unknown error'],
      };
    }
  }

  /**
   * Sync user progress: Push local changes, then pull remote updates
   */
  private async syncUserProgress(): Promise<SyncResult> {
    try {
      let pushed = 0;
      let pulled = 0;

      // 1. Push pending local operations
      const pendingOps = await getOutboxOps('userProgress', 100);

      for (const op of pendingOps) {
        try {
          let payload: any;
          try {
            payload = JSON.parse(op.payload_json);
          } catch (parseError) {
            logger.error('Invalid JSON in outbox operation', 'SyncManager', {
              opId: op.op_id,
              error: parseError,
            });
            await incrementOutboxTries(op.op_id);
            continue;
          }

          if (op.op === 'upsert') {
            // Safety: ensure op belongs to current user if marked
            if (payload?.userId && this.userId && payload.userId !== this.userId) {
              logger.warn('Skipping progress op for different user', 'SyncManager', {
                opId: op.op_id,
              });
              continue;
            }
            const { localId: _localId, userId: _userId, ...payloadClean } =
              payload || {};
            const result = await convexClient.mutation(
              api.userProgress.recordCompletion,
              payloadClean
            );

            if (result) {
              await ackProgressSynced({
                localId: payload.localId,
                serverId: result,
                updatedAt: Date.now(),
              });

              await deleteOutbox(op.op_id);
              pushed++;
            }
          }
        } catch (error) {
          logger.error(
            'Failed to push progress operation',
            'SyncManager',
            error
          );
          await incrementOutboxTries(op.op_id);

          if (op.tries + 1 >= this.config.maxRetries) {
            await moveOutboxToFailed(op, error?.toString?.() ?? 'Unknown error');
            this.state.syncErrors.push(
              `Progress op failed permanently: ${error?.toString?.() ?? 'Unknown error'}`
            );
          }
        }
      }

      // 2. Pull remote updates (incremental sync)
      if (this.userId) {
        // Get last sync cursor
        const lastProgressSync = await getSyncCursor('lastProgressSync');
        const startDate =
          lastProgressSync || Date.now() - 30 * 24 * 60 * 60 * 1000; // Default: last 30 days

        const serverProgress = await convexClient.query(
          api.userProgress.getUserProgress,
          { startDate }
        );

        if (serverProgress && serverProgress.length > 0) {
          await importUserProgressFromServer(serverProgress);
          pulled = serverProgress.length;

          // Update cursor to server watermark (max of _creationTime and completedAt)
          const watermark = Math.max(
            ...serverProgress.map(
              (p: any) =>
                Math.max(
                  ((p?._creationTime as number) || 0),
                  ((p?.completedAt as number) || 0)
                )
            )
          );
          if (Number.isFinite(watermark) && watermark > 0) {
            await setSyncCursor('lastProgressSync', watermark);
          }
        }
      }

      logger.info(
        `User progress sync complete: pushed ${pushed}, pulled ${pulled}`,
        'SyncManager'
      );

      return {
        success: true,
        synced: pushed + pulled,
        failed: 0,
        errors: [],
      };
    } catch (error) {
      logger.error('Failed to sync user progress', 'SyncManager', error);
      this.state.syncErrors.push(`Progress: ${error?.toString()}`);
      return {
        success: false,
        synced: 0,
        failed: 1,
        errors: [error?.toString() || 'Unknown error'],
      };
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isOnline: this.state.isOnline,
      isSyncing: this.state.isSyncing,
      lastSyncTime: this.state.lastSyncTime,
      pendingCounts: this.state.pendingCounts,
      failedCounts: this.state.failedCounts,
      hasErrors: this.state.syncErrors.length > 0,
      errors: this.state.syncErrors,
    };
  }

  /**
   * Clear all data
   */
  async clearAllData() {
    // Note: We don't clear SQLite data here as it's the primary source
    // This would be handled at the SQLite level if needed
    logger.info('Clear all data requested', 'SyncManager');
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stopAutoSync();
    if (this.state.networkUnsubscribe) {
      this.state.networkUnsubscribe();
      this.state.networkUnsubscribe = null;
    }
    logger.info('Sync manager cleaned up', 'SyncManager');
  }
}

// Export singleton instance
export const syncManager = new SimplifiedSyncManager();
