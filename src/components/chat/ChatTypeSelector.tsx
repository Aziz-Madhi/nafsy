import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  useSharedValue,
} from 'react-native-reanimated';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { ChatType } from '~/store/useChatUIStore';
import { useColors } from '~/hooks/useColors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChatTypeSelectorProps {
  activeType: ChatType;
  onTypeChange: (type: ChatType) => void;
}

interface ChatTypeConfig {
  type: ChatType;
  icon: string;
  color: string;
  label: string;
}

const chatConfigs: { [key: string]: ChatTypeConfig } = {
  coach: {
    type: 'coach',
    icon: 'person.circle.fill',
    color: '#2F6A8D',
    label: 'Coach',
  },
  companion: {
    type: 'companion',
    icon: 'heart.circle.fill',
    color: '#7BA05B',
    label: 'Companion',
  },
};

export function ChatTypeSelector({
  activeType,
  onTypeChange,
}: ChatTypeSelectorProps) {
  const colors = useColors();
  const isDarkMode = colors.background === '#0A1514';
  const pressAnimation = useSharedValue(0);

  // Only handle coach and companion types
  const filteredActiveType = activeType === 'event' ? 'coach' : activeType;
  const activeTypeConfig = chatConfigs[filteredActiveType] || chatConfigs.coach;

  const handleToggle = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Medium);

    // Toggle between coach and companion
    const newType = filteredActiveType === 'coach' ? 'companion' : 'coach';
    onTypeChange(newType);

    // Animate press feedback
    pressAnimation.value = withSpring(
      1,
      { damping: 15, stiffness: 300 },
      () => {
        pressAnimation.value = withSpring(0, { damping: 15, stiffness: 300 });
      }
    );
  }, [filteredActiveType, onTypeChange, pressAnimation]);

  // Press animation style
  const buttonStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressAnimation.value, [0, 1], [1, 0.95]);

    return {
      transform: [{ scale }],
    };
  });

  // Get the other personality config for display
  const otherType = filteredActiveType === 'coach' ? 'companion' : 'coach';
  const otherTypeConfig = chatConfigs[otherType];

  return (
    <View style={styles.container}>
      {/* Simple Toggle Button */}
      <AnimatedPressable
        onPress={handleToggle}
        style={[styles.mainButton, buttonStyle]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View
          style={[
            styles.mainButtonInner,
            {
              backgroundColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.10)'
                : 'rgba(255, 255, 255, 0.80)',
            },
          ]}
        >
          <SymbolView
            name={activeTypeConfig.icon}
            size={20}
            tintColor={activeTypeConfig.color}
            weight="semibold"
          />
        </View>
      </AnimatedPressable>

      {/* Small indicator for the other type */}
      <View style={styles.indicatorContainer}>
        <View
          style={[styles.indicator, { backgroundColor: otherTypeConfig.color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 64, // Same as sidebar button (top-16 = 64px)
    right: 16, // Same margin as sidebar (4 * 4px = 16px)
    zIndex: 10,
    alignItems: 'flex-end',
  },
  mainButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  mainButtonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
