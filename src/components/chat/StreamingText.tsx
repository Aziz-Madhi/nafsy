import React, { useEffect, useState, useCallback, memo } from 'react';
import { View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '~/components/ui/text';

interface StreamingTextProps {
  text: string;
  onComplete?: () => void;
  style?: any;
  cursorStyle?: any;
  baseSpeed?: number; // milliseconds per character
  punctuationPause?: number; // extra pause for punctuation
}

// Blinking cursor component
const BlinkingCursor = memo(function BlinkingCursor({
  style,
}: {
  style?: any;
}) {
  const opacity = useSharedValue(1);
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    if (isMountedRef.current) {
      opacity.value = withRepeat(withTiming(0, { duration: 500 }), -1, true);
    }

    return () => {
      isMountedRef.current = false;
      // Don't cancel animation here as it may cause crashes
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Text style={[style, { marginLeft: 1 }]}>|</Text>
    </Animated.View>
  );
});

export const StreamingText = memo(function StreamingText({
  text,
  onComplete,
  style,
  cursorStyle,
  baseSpeed = 30,
  punctuationPause = 150,
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMountedRef = React.useRef(true);

  const getCharDelay = useCallback(
    (char: string, nextChar?: string) => {
      // Faster for spaces
      if (char === ' ') return baseSpeed * 0.5;

      // Pause after punctuation
      if (['.', '!', '?'].includes(char))
        return baseSpeed + punctuationPause * 2;
      if ([',', ';', ':'].includes(char)) return baseSpeed + punctuationPause;

      // Slightly faster for common words
      if (nextChar === ' ') return baseSpeed * 0.8;

      return baseSpeed;
    },
    [baseSpeed, punctuationPause]
  );

  useEffect(() => {
    if (currentIndex < text.length) {
      const currentChar = text[currentIndex];
      const nextChar = text[currentIndex + 1];
      const delay = getCharDelay(currentChar, nextChar);

      const timer = setTimeout(() => {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setDisplayedText((prev) => prev + currentChar);
          setCurrentIndex((prev) => prev + 1);
        }
      }, delay);

      return () => clearTimeout(timer);
    } else if (
      currentIndex === text.length &&
      currentIndex > 0 &&
      isMountedRef.current
    ) {
      // Text complete
      setShowCursor(false);
      onComplete?.();
    }
  }, [currentIndex, text, getCharDelay, onComplete]);

  // Reset when text changes
  useEffect(() => {
    if (isMountedRef.current) {
      setDisplayedText('');
      setCurrentIndex(0);
      setShowCursor(true);
    }
  }, [text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={style}>{displayedText}</Text>
      {showCursor && currentIndex < text.length && (
        <BlinkingCursor style={cursorStyle || style} />
      )}
    </View>
  );
});

export default StreamingText;
