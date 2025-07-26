/**
 * Session Status Display Component
 * Shows loading and error states for session operations
 */

import React, { memo } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';

interface SessionStatusDisplayProps {
  isLoading: boolean;
  error: string | null;
  onDismissError: () => void;
}

export const SessionStatusDisplay = memo(function SessionStatusDisplay({
  isLoading,
  error,
  onDismissError,
}: SessionStatusDisplayProps) {
  if (!isLoading && !error) {
    return null;
  }

  return (
    <>
      {/* Session Loading Display */}
      {isLoading && (
        <View className="mx-4 mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Text className="text-blue-700 text-sm text-center">
            Switching session...
          </Text>
        </View>
      )}

      {/* Session Error Display */}
      {error && (
        <View className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-red-700 text-sm text-center">{error}</Text>
          <Pressable
            onPress={onDismissError}
            className="mt-2 self-center px-3 py-1 bg-red-100 rounded-md"
          >
            <Text className="text-red-700 text-xs">Dismiss</Text>
          </Pressable>
        </View>
      )}
    </>
  );
});
