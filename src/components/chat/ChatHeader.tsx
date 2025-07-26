/**
 * Chat Header Component
 * Contains the sidebar toggle button
 */

import React, { memo } from 'react';
import { Pressable } from 'react-native';
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
      className="absolute top-16 left-4 p-2 z-10"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <SymbolView name="line.horizontal.3" size={24} tintColor="#2D7D6E" />
    </Pressable>
  );
});
