import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '~/components/ui/text';
import { Avatar } from '~/components/ui/avatar';
import { cn } from '~/lib/utils';

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
  avatar?: string;
  index?: number;
}

export function ChatBubble({ message, isUser, timestamp, avatar, index = 0 }: ChatBubbleProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
      className={cn(
        'flex-row mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar
          alt="AI Assistant"
          className="mr-2 h-8 w-8"
        >
          <Avatar.Image
            source={{ uri: avatar || 'https://api.dicebear.com/7.x/bottts/png?seed=nafsy' }}
          />
          <Avatar.Fallback>
            <Text className="text-primary">AI</Text>
          </Avatar.Fallback>
        </Avatar>
      )}
      
      <View
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser 
            ? 'bg-primary' 
            : 'bg-secondary/20 dark:bg-secondary/10'
        )}
      >
        <Text
          variant="body"
          className={cn(
            isUser 
              ? 'text-primary-foreground' 
              : 'text-foreground'
          )}
        >
          {message}
        </Text>
        
        {timestamp && (
          <Text
            variant="muted"
            className={cn(
              'text-xs mt-1',
              isUser 
                ? 'text-primary-foreground/70' 
                : 'text-muted-foreground'
            )}
          >
            {timestamp}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}