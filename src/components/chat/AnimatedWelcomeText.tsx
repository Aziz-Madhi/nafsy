import React, { useEffect, useState, memo } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Text } from '~/components/ui/text';

interface AnimatedWelcomeTextProps {
  text: string;
  style?: any;
  wordDelay?: number;
}

export const AnimatedWelcomeText = memo(function AnimatedWelcomeText({
  text,
  style,
  wordDelay = 150,
}: AnimatedWelcomeTextProps) {
  const words = text.split(' ');
  const [visibleWords, setVisibleWords] = useState<number>(0);
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (visibleWords < words.length && isMountedRef.current) {
        setVisibleWords((prev) => prev + 1);
      }
    }, wordDelay);

    return () => clearTimeout(timer);
  }, [visibleWords, words.length, wordDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      {words.map((word, index) => (
        <Animated.View
          key={index}
          entering={index < visibleWords ? FadeIn.duration(400) : undefined}
          style={{ marginRight: 5 }}
        >
          <Text style={[style, { opacity: index < visibleWords ? 1 : 0 }]}>
            {word}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
});
