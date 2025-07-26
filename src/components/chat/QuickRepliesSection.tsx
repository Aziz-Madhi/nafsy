/**
 * Quick Replies Section Component
 * Displays quick reply buttons for common responses
 */

import React, { memo } from 'react';
import { View } from 'react-native';
import { QuickReplyButton, TypingIndicator } from './ChatComponents';

interface QuickReply {
  text: string;
  icon: string;
}

interface QuickRepliesSectionProps {
  isTyping: boolean;
  showQuickReplies: boolean;
  messagesLength: number;
  quickReplies: QuickReply[];
  onQuickReply: (text: string) => void;
}

export const QuickRepliesSection = memo(function QuickRepliesSection({
  isTyping,
  showQuickReplies,
  messagesLength,
  quickReplies,
  onQuickReply,
}: QuickRepliesSectionProps) {
  return (
    <View className="pb-6">
      {isTyping && <TypingIndicator />}

      {/* Quick Replies */}
      {showQuickReplies && messagesLength === 1 && (
        <View className="flex-row flex-wrap mt-4">
          {quickReplies.map((reply) => (
            <QuickReplyButton
              key={reply.text}
              text={reply.text}
              icon={reply.icon}
              onPress={() => onQuickReply(reply.text)}
            />
          ))}
        </View>
      )}
    </View>
  );
});
