/**
 * Chat Header Component
 * Contains the sidebar toggle button
 */

import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

interface ChatHeaderProps {
  onOpenSidebar: () => void;
}

export const ChatHeader = memo(function ChatHeader({
  onOpenSidebar,
}: ChatHeaderProps) {
  return (
    <Pressable
      onPress={onOpenSidebar}
      className="absolute top-16 left-4 z-10"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <SymbolView name="line.horizontal.3" size={24} tintColor="#2F6A8D" />
      </View>
    </Pressable>
  );
});
