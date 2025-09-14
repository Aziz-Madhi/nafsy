import React, { useEffect, useState } from 'react';
import { Modal, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Text } from '~/components/ui/text';
import { useColors } from '~/hooks/useColors';
import { SymbolView } from 'expo-symbols';

interface VoiceOverlayProps {
  visible: boolean;
  isActive: boolean;
  onStop: () => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
}

export function VoiceOverlay({
  visible,
  isActive,
  onStop,
  onClose,
  title = 'Voice',
  subtitle = 'Listening and speaking',
}: VoiceOverlayProps) {
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (visible) setModalVisible(true);
    else setModalVisible(false);
  }, [visible]);

  // Simple equalizer animation: 5 bars with staggered pulsation
  const bars = new Array(5).fill(0).map((_, i) => i);
  const anims = bars.map(() => useSharedValue(0.3));

  useEffect(() => {
    anims.forEach((sv, idx) => {
      sv.value = withDelay(
        idx * 100,
        withRepeat(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          -1,
          true
        )
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal visible={modalVisible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
        <View className="items-center px-8">
          <Text variant="title2" className="text-white font-bold text-center">
            {title}
          </Text>
          <Text variant="subhead" className="text-gray-300 mt-2 text-center">
            {subtitle}
          </Text>
        </View>

        {/* Equalizer */}
        <View className="flex-row items-end gap-2 mt-10">
          {anims.map((sv, idx) => {
            const style = useAnimatedStyle(() => ({
              height: 16 + sv.value * 56,
              opacity: isActive ? 0.95 : 0.5,
              transform: [{ scaleY: isActive ? 1 : 0.7 }],
            }));
            return (
              <Animated.View
                key={idx}
                style={[
                  style,
                  {
                    width: 8,
                    borderRadius: 4,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Controls */}
        <View className="flex-row items-center gap-6 mt-16">
          <Pressable
            onPress={onStop}
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: '#EF4444' }}
            accessibilityLabel="Stop voice"
          >
            <SymbolView name="stop.fill" size={22} tintColor="#FFFFFF" />
          </Pressable>
          {onClose && (
            <Pressable
              onPress={onClose}
              className="w-14 h-14 rounded-full items-center justify-center border"
              style={{ borderColor: 'rgba(255,255,255,0.35)' }}
              accessibilityLabel="Close overlay"
            >
              <SymbolView name="xmark" size={22} tintColor="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

