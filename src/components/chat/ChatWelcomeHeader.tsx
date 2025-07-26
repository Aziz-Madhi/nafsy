/**
 * Chat Welcome Header Component
 * Displays the welcome message and icon at the top of the chat
 */

import React, { memo } from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

interface ChatWelcomeHeaderProps {
  subtitle: string;
}

export const ChatWelcomeHeader = memo(function ChatWelcomeHeader({
  subtitle,
}: ChatWelcomeHeaderProps) {
  return (
    <View className="items-center mb-8 mt-4">
      <View
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
        style={{
          backgroundColor: 'rgba(45, 125, 110, 0.1)',
          shadowColor: '#2D7D6E',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Text variant="title1">🌱</Text>
      </View>
      <Text
        variant="body"
        className="text-gray-600 text-center px-8"
        enableRTL={false}
      >
        {subtitle}
      </Text>
    </View>
  );
});
