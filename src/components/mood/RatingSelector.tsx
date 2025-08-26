import React, { useMemo, useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from '~/components/ui/text';
import { useColors } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '~/hooks/useTranslation';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
// Using product-specified 1–10 rating scale colors

interface RatingSelectorProps {
  value: number;
  onChange: (value: number) => void;
  activated?: boolean; // when false, show minimal slider (no labels/colors)
  onActivate?: () => void; // called on first thumb interaction
  isMorning?: boolean; // whether it's morning or evening
}

const TRACK_WIDTH = 320;
const TRACK_HEIGHT = 8;
const STEP_COUNT = 10;
const THUMB_SIZE = 30;
const HEADER_HEIGHT = 88; // reserve space to avoid vertical jump on activation
// To keep the thumb fully within bounds and perfectly centered on the track,
// inset the track by half the thumb size and compute spacing from inner width.
const TRACK_INSET = THUMB_SIZE / 2;
const INNER_WIDTH = TRACK_WIDTH - THUMB_SIZE; // usable width for centers
const STEP_WIDTH = INNER_WIDTH / (STEP_COUNT - 1); // distance between centers

function clamp(n: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(max, n));
}

export function RatingSelector({
  value,
  onChange,
  activated = true,
  onActivate,
  isMorning,
}: RatingSelectorProps) {
  const colors = useColors();
  const { t } = useTranslation();
  const isActive = activated;

  // Compute color directly from the 1–10 rating scale map
  const ratingColor = useMemo(() => {
    const v = Math.max(1, Math.min(10, Math.round(value)));
    const key = `ratingScale${v}` as keyof typeof colors;
    return colors[key];
  }, [value, colors]);

  // Animated thumb position (in pixels along track)
  const index = Math.min(STEP_COUNT - 1, Math.max(0, Math.round(value - 1)));
  const thumbX = useSharedValue(index * STEP_WIDTH); // relative to inner left
  const startX = useSharedValue(thumbX.value);

  useEffect(() => {
    // Keep thumb centered before activation; don't snap after activation
    if (!activated) {
      thumbX.value = withSpring(INNER_WIDTH / 2, {
        damping: 14,
        stiffness: 160,
        mass: 0.4,
      });
    }
  }, [activated, thumbX]);

  const animatedThumbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          // Center the thumb over the inner track position
          translateX: TRACK_INSET + thumbX.value - THUMB_SIZE / 2,
        },
      ],
    };
  });

  // Animated width for the active (filled) track portion
  const activeTrackStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  const callOnChange = useCallback(
    (v: number) => {
      impactAsync(ImpactFeedbackStyle.Light);
      onChange(v);
    },
    [onChange]
  );

  // Track previous emitted step to avoid spamming onChange during drag
  const emittedIndex = useSharedValue(index);

  const pan = Gesture.Pan()
    .onBegin(() => {
      if (!isActive && onActivate) {
        runOnJS(impactAsync)(ImpactFeedbackStyle.Light);
        runOnJS(onActivate)();
      }
      startX.value = thumbX.value;
      emittedIndex.value = Math.round(thumbX.value / STEP_WIDTH);
    })
    .onUpdate((event) => {
      const raw = startX.value + event.translationX;
      thumbX.value = clamp(raw, 0, INNER_WIDTH);
      const newIndex = Math.round(thumbX.value / STEP_WIDTH);
      if (newIndex !== emittedIndex.value) {
        emittedIndex.value = newIndex;
        runOnJS(onChange)(newIndex + 1);
      }
    })
    .onEnd(() => {
      // Do not snap; keep free position but ensure final value is emitted
      const finalIndex = Math.round(thumbX.value / STEP_WIDTH);
      runOnJS(callOnChange)(finalIndex + 1);
    });

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Fixed header area to prevent slider jump */}
      <View
        style={{
          height: HEADER_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
        pointerEvents="none"
      >
        {isActive ? (
          <>
            <Text
              className="text-center"
              style={{
                fontFamily: 'CrimsonPro-Bold',
                fontSize: 44,
                lineHeight: 52,
                color: ratingColor,
              }}
            >
              {value}
            </Text>
            <Text
              variant="body"
              className="text-center"
              style={{ color: colors.foreground, marginTop: 4 }}
            >
              {t(`mood.rating.labels.${value}`)}
            </Text>
          </>
        ) : (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text
              style={{
                fontFamily: 'CrimsonPro-Bold',
                fontSize: 26,
                lineHeight: 32,
                color: colors.foreground,
                textAlign: 'center',
                width: '100%',
              }}
            >
              {isMorning !== undefined 
                ? (isMorning ? t('mood.greetings.morning') : t('mood.greetings.evening'))
                : t('mood.rating.title')}
            </Text>
            <Text
              style={{
                marginTop: 6,
                color: withOpacity(colors.foreground, 0.65),
                textAlign: 'center',
                fontSize: 14,
              }}
            >
              {t('mood.rating.description')}
            </Text>
          </View>
        )}
      </View>

      {/* Track */}
      <View style={{ width: TRACK_WIDTH, paddingVertical: 16 }}>
        {/* Track container */}
        <Pressable
          onPressIn={(e) => {
            if (!isActive) {
              if (onActivate) {
                impactAsync(ImpactFeedbackStyle.Light);
                onActivate();
              }
              return;
            }
            const x = e.nativeEvent.locationX - TRACK_INSET;
            const clamped = Math.max(0, Math.min(INNER_WIDTH, x));
            thumbX.value = withSpring(clamped, {
              damping: 14,
              stiffness: 160,
              mass: 0.4,
            });
            const idx = Math.round(clamped / STEP_WIDTH);
            callOnChange(idx + 1);
          }}
        >
          {/* Base track: gradient when active, bland when inactive */}
          {isActive ? (
            <LinearGradient
              colors={[
                withOpacity(colors.ratingScale1, 0.18),
                withOpacity(colors.ratingScale2, 0.18),
                withOpacity(colors.ratingScale3, 0.18),
                withOpacity(colors.ratingScale4, 0.18),
                withOpacity(colors.ratingScale5, 0.18),
                withOpacity(colors.ratingScale6, 0.18),
                withOpacity(colors.ratingScale7, 0.18),
                withOpacity(colors.ratingScale8, 0.18),
                withOpacity(colors.ratingScale9, 0.18),
                withOpacity(colors.ratingScale10, 0.18),
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: TRACK_HEIGHT,
                borderRadius: TRACK_HEIGHT / 2,
                marginHorizontal: TRACK_INSET,
              }}
            />
          ) : (
            <View
              style={{
                height: TRACK_HEIGHT,
                borderRadius: TRACK_HEIGHT / 2,
                marginHorizontal: TRACK_INSET,
                backgroundColor:
                  colors.background === '#0A1514'
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)',
              }}
            />
          )}
        </Pressable>

        {/* Animated width for active track */}
        {isActive && (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 16,
                left: TRACK_INSET,
                height: TRACK_HEIGHT,
                borderRadius: TRACK_HEIGHT / 2,
                backgroundColor: ratingColor,
              },
              activeTrackStyle,
            ]}
          />
        )}

        {/* Thumb with drag gesture */}
        <GestureDetector gesture={pan}>
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 16 - THUMB_SIZE / 2 + TRACK_HEIGHT / 2,
                left: 0,
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: isActive
                  ? ratingColor
                  : withOpacity(colors.foreground, 0.25),
                borderWidth: 2,
                borderColor: colors.background,
                shadowColor: ratingColor,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 3,
              },
              animatedThumbStyle,
            ]}
          />
        </GestureDetector>
      </View>
    </View>
  );
}

export default RatingSelector;
