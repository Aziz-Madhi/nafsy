import React from 'react';
import { View } from 'react-native';
import Animated, { 
  FadeOutUp, 
  SlideInDown,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/cn';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface StackedChatBubblesProps {
  messages: Message[];
  maxVisible?: number;
}

interface StackedMessageProps {
  message: Message;
  stackPosition: number; // 0 = newest (bottom), 1 = second, 2 = third, etc.
}

function StackedMessage({ message, stackPosition }: StackedMessageProps) {
  // Calculate scale, opacity, and blur based on position
  const scale = stackPosition === 0 ? 1 : 0.85 - (stackPosition * 0.1);
  const opacity = stackPosition === 0 ? 1 : 0.6 - (stackPosition * 0.2);
  const translateY = stackPosition * -60; // Stack vertically with offset

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(scale) },
        { translateY: withSpring(translateY) },
      ],
      opacity: withTiming(opacity, { duration: 300 }),
    };
  });

  // Determine bubble colors based on role and position
  const getBubbleStyle = () => {
    if (message.isUser) {
      return stackPosition === 0 
        ? 'bg-blue-500' 
        : 'bg-blue-400';
    } else {
      return stackPosition === 0 
        ? 'bg-green-500' 
        : 'bg-green-400';
    }
  };

  return (
    <Animated.View
      style={[animatedStyle, { position: 'absolute', width: '100%' }]}
      entering={SlideInDown.springify()}
      exiting={FadeOutUp.duration(300)}
    >
      <View className="items-center px-4">
        <View
          className={cn(
            'rounded-3xl px-6 py-4 shadow-lg',
            'max-w-[85%] min-w-[60%]',
            getBubbleStyle()
          )}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Text
            variant="body"
            className="text-white text-center leading-6"
            style={{
              fontSize: stackPosition === 0 ? 16 : 14,
              fontWeight: stackPosition === 0 ? '500' : '400',
            }}
          >
            {message.text}
          </Text>
          
          {stackPosition === 0 && message.timestamp && (
            <Text
              variant="muted"
              className="text-white/70 text-xs text-center mt-2"
            >
              {message.timestamp}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export function StackedChatBubbles({ messages, maxVisible = 3 }: StackedChatBubblesProps) {
  // Show only the last N messages for stacking effect
  const visibleMessages = messages.slice(-maxVisible).reverse();
  
  // Calculate total height needed for stacking
  const stackHeight = Math.max(200, visibleMessages.length * 60 + 100);

  return (
    <View 
      className="items-center justify-end mb-8"
      style={{ height: stackHeight }}
    >
      {visibleMessages.map((message, index) => (
        <StackedMessage
          key={message.id}
          message={message}
          stackPosition={index}
        />
      ))}
    </View>
  );
}