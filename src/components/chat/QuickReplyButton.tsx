import React from 'react';
import { Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  FadeInUp 
} from 'react-native-reanimated';
import { cn } from '~/lib/cn';

interface QuickReplyButtonProps {
  text: string;
  onPress: () => void;
  icon?: string;
  delay?: number;
}

export function QuickReplyButton({ text, onPress, icon, delay = 0 }: QuickReplyButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify()}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className={cn(
            'flex-row items-center bg-primary/10 dark:bg-primary/20',
            'border border-primary/30 rounded-full px-4 py-2.5 mr-2 mb-2'
          )}
        >
          {icon && (
            <Text className="mr-2 text-base">
              {icon}
            </Text>
          )}
          <Text variant="body" className="text-primary font-medium">
            {text}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}