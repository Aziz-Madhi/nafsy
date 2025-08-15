/**
 * Chat Header Component
 * Contains the sidebar toggle button
 */

import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useColors } from '~/hooks/useColors';
import { useIsRTL } from '~/store/useAppStore';
import { cn } from '~/lib/cn';

interface ChatHeaderProps {
  onOpenSidebar: () => void;
}

export const ChatHeader = memo(function ChatHeader({
  onOpenSidebar,
}: ChatHeaderProps) {
  const colors = useColors();
  const isRTL = useIsRTL();
  const isDarkMode = colors.background === '#171717';
  return (
    <Pressable
      onPress={onOpenSidebar}
      className={cn('absolute top-16 z-10', isRTL ? 'end-4' : 'start-4')}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{
          backgroundColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.10)'
            : 'rgba(255, 255, 255, 0.80)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <SymbolView
          name="line.horizontal.3"
          size={24}
          tintColor={isDarkMode ? colors.foreground : '#2F6A8D'}
        />
      </View>
    </Pressable>
  );
});
