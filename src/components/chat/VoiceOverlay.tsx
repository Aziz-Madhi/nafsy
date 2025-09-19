import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '~/components/ui/text';
import { useColors } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import { useAppStore } from '~/store/useAppStore';
import { SymbolView } from 'expo-symbols';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';

interface VoiceOverlayProps {
  visible: boolean;
  isActive: boolean;
  muted?: boolean;
  userSpeaking?: boolean;
  aiSpeaking?: boolean;
  onStop: () => void;
  onToggleMute?: () => void;
  title?: string;
  subtitle?: string;
}

const DISC_SIZE = 260;

export function VoiceOverlay({
  visible,
  isActive,
  muted = false,
  userSpeaking = false,
  aiSpeaking = false,
  onStop,
  onToggleMute,
  title = 'Voice',
  subtitle,
}: VoiceOverlayProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const currentTheme = useAppStore((state) => state.currentTheme);
  const isDarkTheme = currentTheme === 'dark';

  const statusSubtitle = useMemo(() => {
    if (typeof subtitle === 'string') return subtitle;
    if (isActive) return 'Connected';
    return 'Connecting';
  }, [isActive, subtitle]);

  const topPadding = Math.max(insets.top + 4, 16);
  const bottomPadding = Math.max(insets.bottom + 28, 72);

  const overlayBackground = withOpacity(
    colors.background,
    isDarkTheme ? 0.96 : 0.94
  );

  const glassColors = isDarkTheme
    ? [
        withOpacity(colors.card, 0),
        withOpacity(colors.cardDarker, 0.25),
        withOpacity(colors.cardElevated, 0.92),
      ]
    : [
        withOpacity(colors.card, 0),
        withOpacity(colors.cardElevated, 0.45),
        withOpacity(colors.cardDarker, 0.9),
      ];

  const glowColors = isDarkTheme
    ? [
        withOpacity(colors.cardDarker, 0.1),
        withOpacity(colors.card, 0.18),
        withOpacity(colors.cardElevated, 0.28),
      ]
    : [
        withOpacity(colors.cardElevated, 0.18),
        withOpacity(colors.cardDarker, 0.26),
        withOpacity(colors.cardDarker, 0.32),
      ];

  const titleColor = isDarkTheme ? 'rgba(255,255,255,0.92)' : colors.foreground;
  const subtitleColor = isDarkTheme
    ? 'rgba(255,255,255,0.7)'
    : withOpacity(colors.foreground, 0.7);
  const muteIconColor = isDarkTheme
    ? 'rgba(255,255,255,0.9)'
    : withOpacity(colors.foreground, 0.85);

  const handleToggleMute = onToggleMute ?? (() => {});
  const muteDisabled = !onToggleMute;

  const cardElevated = colors.cardElevated || colors.card || '#E8DED1';
  const cardDarker = colors.cardDarker || colors.card || '#1F2A2E';

  const floatPhase = useSharedValue(0);
  const breathPhase = useSharedValue(0);
  const haloPhase = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      cancelAnimation(floatPhase);
      cancelAnimation(breathPhase);
      cancelAnimation(haloPhase);
      floatPhase.value = 0;
      breathPhase.value = 0;
      haloPhase.value = 0;
      return;
    }

    floatPhase.value = withRepeat(
      withTiming(1, {
        duration: 5200,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );

    breathPhase.value = withRepeat(
      withTiming(1, {
        duration: 3600,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );

    haloPhase.value = withRepeat(
      withTiming(1, {
        duration: 4200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    return () => {
      cancelAnimation(floatPhase);
      cancelAnimation(breathPhase);
      cancelAnimation(haloPhase);
    };
  }, [visible, floatPhase, breathPhase, haloPhase]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(floatPhase.value, [0, 1], [8, -8]),
      },
      {
        translateY: interpolate(floatPhase.value, [0, 1], [-10, 10]),
      },
    ],
  }));

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(breathPhase.value, [0, 1], [0.96, 1.04]),
      },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(haloPhase.value, [0, 1], [0.18, 0.35]),
    transform: [
      {
        scale: interpolate(haloPhase.value, [0, 1], [0.92, 1.08]),
      },
    ],
  }));

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onStop}>
      <View style={[styles.container, { backgroundColor: overlayBackground }]}>
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <View style={styles.statusBlock}>
            <Text
              variant="title2"
              style={[styles.statusTitle, { color: titleColor }]}
            >
              {statusSubtitle}
            </Text>
            <Text
              variant="subhead"
              style={[styles.statusSubtitle, { color: subtitleColor }]}
            >
              Stay close to the microphone for the best quality.
            </Text>
          </View>
        </View>

        <View style={styles.meterWrapper}>
          <Animated.View style={[styles.floatingDisc, floatingStyle]}>
            <Animated.View style={[styles.breathingStack, breathingStyle]}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.halo,
                  {
                    backgroundColor: isDarkTheme
                      ? withOpacity(colors.cardDarker, 0.35)
                      : withOpacity(colors.cardElevated, 0.35),
                  },
                  haloStyle,
                ]}
              />
              <View style={styles.baseDisc}>
                <LinearGradient
                  colors={
                    isDarkTheme ? ['#0d2421', '#19322f'] : ['#F5EFE8', '#E8DED1']
                  }
                  start={{ x: 0.25, y: 0 }}
                  end={{ x: 0.85, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </Animated.View>
          </Animated.View>
        </View>

        <View style={styles.flexSpacer} />

        <LinearGradient
          colors={glassColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.glassPanel, { paddingBottom: bottomPadding }]}
        >
          <LinearGradient
            colors={glowColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.glowWash}
          />

          <View style={styles.controlsRow}>
            <Pressable
              onPress={handleToggleMute}
              accessibilityLabel={
                muted ? 'Unmute microphone' : 'Mute microphone'
              }
              disabled={muteDisabled}
              style={[
                styles.controlBase,
                styles.controlSize,
                {
                  backgroundColor: isDarkTheme
                    ? withOpacity(colors.cardDarker, 0.88)
                    : withOpacity(colors.cardDarker, 0.72),
                  shadowColor: isDarkTheme
                    ? 'rgba(0,0,0,0.55)'
                    : withOpacity(colors.foreground, 0.22),
                  opacity: muteDisabled ? 0.55 : 1,
                },
              ]}
            >
              <SymbolView
                name={muted ? 'speaker.slash.fill' : 'speaker.wave.2.fill'}
                size={20}
                tintColor={
                  muteDisabled ? withOpacity(muteIconColor, 0.4) : muteIconColor
                }
              />
            </Pressable>
            <Pressable
              onPress={onStop}
              accessibilityLabel="End voice session"
              style={[
                styles.controlBase,
                styles.controlSize,
                styles.endControl,
                {
                  backgroundColor: colors.error || '#EF4444',
                  shadowColor: isDarkTheme
                    ? 'rgba(0,0,0,0.55)'
                    : 'rgba(15,20,30,0.3)',
                },
              ]}
            >
              <SymbolView name="xmark" size={18} tintColor="#FFFFFF" />
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 32,
  },
  statusBlock: {
    marginTop: 20,
    alignItems: 'center',
  },
  statusTitle: {
    textAlign: 'center',
    fontWeight: '600',
  },
  statusSubtitle: {
    textAlign: 'center',
    marginTop: 16,
  },
  meterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 94,
    alignSelf: 'center',
    width: DISC_SIZE,
    height: DISC_SIZE,
  },
  floatingDisc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingStack: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: DISC_SIZE / 2,
  },
  baseDisc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: DISC_SIZE / 2,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.35)',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  flexSpacer: {
    flex: 1,
  },
  glassPanel: {
    marginHorizontal: 0,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 48,
    paddingHorizontal: 32,
    overflow: 'hidden',
  },
  glowWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    opacity: 0.9,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  controlBase: {
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  controlSize: {
    paddingHorizontal: 24,
    height: 54,
    minWidth: 96,
  },
  endControl: {
    shadowOpacity: 0.28,
  },
});
