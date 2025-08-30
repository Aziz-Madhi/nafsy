/**
 * Offline/Online status indicator component
 */

import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './text';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { useNetworkStatus, useSyncStatus } from '~/hooks/useOfflineData';
import { useColors } from '~/hooks/useColors';
import { MotiView, AnimatePresence } from 'moti';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';

export function OfflineIndicator() {
  const { t } = useTranslation();
  const { isOnline, isInternetReachable } = useNetworkStatus();
  const syncStatus = useSyncStatus();
  const colors = useColors();
  const [showStatus, setShowStatus] = useState(false);
  const [lastSyncText, setLastSyncText] = useState('');

  // Update last sync text
  useEffect(() => {
    if (syncStatus.lastSyncTime) {
      const timeDiff = Date.now() - syncStatus.lastSyncTime;
      const minutes = Math.floor(timeDiff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) {
        setLastSyncText(t('sync.lastSync.days', { count: days }));
      } else if (hours > 0) {
        setLastSyncText(t('sync.lastSync.hours', { count: hours }));
      } else if (minutes > 0) {
        setLastSyncText(t('sync.lastSync.minutes', { count: minutes }));
      } else {
        setLastSyncText(t('sync.lastSync.justNow'));
      }
    }
  }, [syncStatus.lastSyncTime, t]);

  // Show status when offline or syncing
  useEffect(() => {
    setShowStatus(
      !isOnline ||
        syncStatus.isSyncing ||
        syncStatus.pendingCounts.moods > 0 ||
        syncStatus.pendingCounts.userProgress > 0
    );
  }, [isOnline, syncStatus]);

  const handlePress = async () => {
    if (isOnline && !syncStatus.isSyncing) {
      await impactAsync(ImpactFeedbackStyle.Light);
      syncStatus.triggerSync();
    }
  };

  const totalPending =
    syncStatus.pendingCounts.moods +
    syncStatus.pendingCounts.exercises +
    syncStatus.pendingCounts.userProgress;

  return (
    <AnimatePresence>
      {showStatus && (
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -10 }}
          transition={{ type: 'timing', duration: 200 }}
          style={{
            position: 'absolute',
            top: 50,
            right: 16,
            zIndex: 100,
          }}
        >
          <Pressable onPress={handlePress}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                gap: 8,
              }}
            >
              {/* Icon */}
              {syncStatus.isSyncing ? (
                <MotiView
                  from={{ rotate: '0deg' }}
                  animate={{ rotate: '360deg' }}
                  transition={{
                    type: 'timing',
                    duration: 1000,
                    loop: true,
                  }}
                >
                  <RefreshCw size={16} color={colors.primary} />
                </MotiView>
              ) : !isOnline ? (
                <WifiOff size={16} color={colors.error} />
              ) : totalPending > 0 ? (
                <AlertCircle size={16} color={colors.warning} />
              ) : (
                <Check size={16} color={colors.success} />
              )}

              {/* Status Text */}
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: !isOnline
                    ? colors.error
                    : syncStatus.isSyncing
                      ? colors.primary
                      : totalPending > 0
                        ? colors.warning
                        : colors.success,
                }}
              >
                {!isOnline
                  ? t('sync.offline')
                  : syncStatus.isSyncing
                    ? t('sync.syncing')
                    : totalPending > 0
                      ? t('sync.pendingChanges', { count: totalPending })
                      : t('sync.synced')}
              </Text>

              {/* Last Sync Time */}
              {isOnline &&
                !syncStatus.isSyncing &&
                syncStatus.lastSyncTime > 0 && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: colors.mutedForeground,
                    }}
                  >
                    {lastSyncText}
                  </Text>
                )}
            </View>
          </Pressable>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

/**
 * Minimal sync badge for tab bars
 */
export function SyncBadge() {
  const syncStatus = useSyncStatus();
  const { isOnline } = useNetworkStatus();
  const colors = useColors();

  const totalPending =
    syncStatus.pendingCounts.moods +
    syncStatus.pendingCounts.exercises +
    syncStatus.pendingCounts.userProgress;

  if (isOnline && totalPending === 0 && !syncStatus.isSyncing) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: !isOnline
          ? colors.error
          : syncStatus.isSyncing
            ? colors.primary
            : colors.warning,
        width: 8,
        height: 8,
        borderRadius: 4,
      }}
    />
  );
}
