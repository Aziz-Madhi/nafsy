import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';

const SendingSpinner = () => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1);
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[{ width: 14, height: 14 }, animatedStyle]}>
      <SymbolView name="arrow.clockwise" size={14} tintColor="#2D7D6E" />
    </Animated.View>
  );
};

export default SendingSpinner;
