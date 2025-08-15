/**
 * Chat Welcome Header Component
 * Displays the welcome message and icon at the top of the chat
 */

import React, { memo } from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { useTranslation } from '~/hooks/useTranslation';

interface ChatWelcomeHeaderProps {
  subtitle?: string;
}

export const ChatWelcomeHeader = memo(function ChatWelcomeHeader({
  subtitle,
}: ChatWelcomeHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className="items-center mb-8 mt-4">
      <Text variant="body" className="text-gray-600 text-center px-8">
        {subtitle || t('chat.welcomeSubtitle')}
      </Text>
    </View>
  );
});
