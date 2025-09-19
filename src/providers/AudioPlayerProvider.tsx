import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  View,
  ImageBackground,
  LayoutChangeEvent,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Play, Pause, X, RotateCcw, RotateCw } from 'lucide-react-native';
import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
} from 'expo-audio';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { useColors, useShadowStyle } from '~/hooks/useColors';
import {
  CATEGORY_BACKGROUNDS,
  CATEGORY_BACKGROUNDS_DARK,
} from '~/components/exercises/ModernCategoryCard';
import type { WellnessCategory } from '~/lib/colors';
import { useAppStore } from '~/store/useAppStore';

interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string; // Accent color for UI
  durationSeconds?: number;
  sourceUri?: string; // Optional for now; linking will populate later
  onClose?: () => void; // optional callback when player fully closes
}

interface AudioPlayerContextValue {
  isVisible: boolean;
  isPlaying: boolean;
  track: AudioTrack | null;
  positionMillis: number;
  durationMillis: number;
  open: (track: AudioTrack) => Promise<void>;
  close: () => Promise<void>;
  togglePlay: () => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(
  undefined
);

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const AudioPlayerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const colors = useColors();
  const shadow = useShadowStyle('medium');
  const insets = useSafeAreaInsets();
  const currentTheme = useAppStore((s) => s.currentTheme);

  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [positionMillis, setPositionMillis] = useState(0);
  const [durationMillis, setDurationMillis] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [pendingClose, setPendingClose] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // expo-audio player instance and subscription
  const playerRef = useRef<any | null>(null);
  const statusSubRef = useRef<{ remove: () => void } | null>(null);

  const unloadAsync = useCallback(async () => {
    try {
      try {
        statusSubRef.current?.remove?.();
      } catch {}
      if (playerRef.current) {
        try {
          // Ensure playback is fully stopped and the source is released
          try {
            playerRef.current.pause?.();
          } catch {}
          try {
            playerRef.current.replace?.(null);
          } catch {}
          playerRef.current.remove?.();
        } catch {}
      }
    } catch {
      // no-op
    } finally {
      playerRef.current = null;
      try {
        // Explicitly mark audio as inactive so the session releases
        await setIsAudioActiveAsync(false);
      } catch {}
      setIsPlaying(false);
      setPositionMillis(0);
      setDurationMillis(0);
    }
  }, []);

  const loadAndPlayAsync = useCallback(
    async (uri: string) => {
      await unloadAsync();
      // Configure audio session
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
        interruptionModeAndroid: 'duckOthers',
        allowsRecording: false,
        shouldRouteThroughEarpiece: false,
      });
      try {
        await setIsAudioActiveAsync(true);
      } catch {}

      // Create or reuse player
      const player = createAudioPlayer(null, 250);
      // Listen for status updates to drive UI
      const sub = player.addListener?.(
        'playbackStatusUpdate',
        (status: any) => {
          try {
            setIsPlaying(!!status?.playing);
            const pos = Math.max(
              0,
              Math.floor((status?.currentTime ?? 0) * 1000)
            );
            const dur = Math.max(0, Math.floor((status?.duration ?? 0) * 1000));
            setPositionMillis(pos);
            setDurationMillis(dur);
          } catch {}
        }
      );
      statusSubRef.current = sub || null;
      playerRef.current = player;

      // Load and start playback
      player.replace({ uri });
      try {
        player.setPlaybackRate?.(playbackRate as any);
      } catch {}
      player.play();
      setIsPlaying(true);
    },
    [unloadAsync, playbackRate]
  );

  const open = useCallback(
    async (nextTrack: AudioTrack) => {
      try {
        console.log('[AudioPlayer] open()', nextTrack);
        setTrack(nextTrack);
        setIsVisible(true);

        if (nextTrack.sourceUri) {
          try {
            await loadAndPlayAsync(nextTrack.sourceUri);
          } catch (err) {
            console.warn('[AudioPlayer] loadAndPlayAsync failed', err);
            // Keep UI visible but paused
            setIsPlaying(false);
          }
        } else {
          // No source yet; show UI in paused state so linking can be added later
          setIsPlaying(false);
          setPositionMillis(0);
          setDurationMillis(
            nextTrack.durationSeconds ? nextTrack.durationSeconds * 1000 : 0
          );
        }
      } catch (err) {
        console.warn('[AudioPlayer] open() error', err);
        // Ensure at least the UI pops so users see feedback
        setIsVisible(true);
      }
    },
    [loadAndPlayAsync]
  );

  const finalizeClose = useCallback(async () => {
    const t = track; // capture before clearing state
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    await unloadAsync();
    setTrack(null);
    setPendingClose(false);
    try {
      t?.onClose?.();
    } catch {}
  }, [track, unloadAsync]);

  const close = useCallback(async () => {
    if (!isVisible) return;
    try {
      // Stop audio quickly but keep UI until modal fade finishes
      playerRef.current?.pause?.();
    } catch {}
    setPendingClose(true);
    setIsVisible(false); // triggers native fade-out animation
    // Fallback in case onDismiss doesn't fire on some platforms
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(finalizeClose, 350);
  }, [finalizeClose, isVisible]);

  const togglePlay = useCallback(async () => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.pause();
    else player.play();
  }, [isPlaying]);

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      isVisible,
      isPlaying,
      track,
      positionMillis,
      durationMillis,
      open,
      close,
      togglePlay,
    }),
    [
      close,
      durationMillis,
      isPlaying,
      isVisible,
      open,
      positionMillis,
      track,
      togglePlay,
    ]
  );

  // Mini player UI - kept here to avoid extra files
  const progress =
    durationMillis > 0 ? Math.min(1, positionMillis / durationMillis) : 0;

  // Map exercise category to the same background used on category cards
  const bgSource = useMemo(() => {
    // subtitle is localized (e.g., "Journaling"/"كتابة اليوميات").
    // Map using internal keys when possible; otherwise try best-effort to match.
    const raw = (track?.subtitle || '').toLowerCase();
    const map: Record<string, WellnessCategory> = {
      breathing: 'breathing',
      mindfulness: 'mindfulness',
      movement: 'movement',
      journaling: 'journaling',
      relaxation: 'relaxation',
      التنفس: 'breathing',
      'اليقظة الذهنية': 'mindfulness',
      الحركة: 'movement',
      'كتابة اليوميات': 'journaling',
      الاسترخاء: 'relaxation',
    } as any;
    const key = (map[raw] || raw) as WellnessCategory;
    const backgrounds =
      currentTheme === 'dark'
        ? (CATEGORY_BACKGROUNDS_DARK as Record<string, any>)
        : (CATEGORY_BACKGROUNDS as Record<string, any>);
    return backgrounds[key] || null;
  }, [track?.subtitle, currentTheme]);

  // For progress seek interactions
  const [barWidth, setBarWidth] = useState(0);
  const onBarLayout = (e: LayoutChangeEvent) =>
    setBarWidth(e.nativeEvent.layout.width);
  const onSeek = useCallback(
    (e: any) => {
      if (!playerRef.current || !barWidth) return;
      const x = e.nativeEvent.locationX;
      const ratio = Math.max(0, Math.min(1, x / barWidth));
      const durSec =
        (durationMillis || (track?.durationSeconds ?? 0) * 1000) / 1000;
      if (durSec > 0) playerRef.current.seekTo(durSec * ratio);
    },
    [barWidth, durationMillis, track?.durationSeconds]
  );

  // Skip controls (10s back/forward)
  const skip = useCallback(
    (deltaSeconds: number) => {
      const player = playerRef.current;
      if (!player) return;
      const curSec = positionMillis / 1000;
      const totalSec =
        (durationMillis || (track?.durationSeconds ?? 0) * 1000) / 1000;
      const next = Math.max(0, Math.min(totalSec || 0, curSec + deltaSeconds));
      player.seekTo(next);
    },
    [positionMillis, durationMillis, track?.durationSeconds]
  );

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}

      {/* Fallback overlay chip above everything */}
      {!!track && !isVisible && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: Math.max(insets.bottom, 24),
            zIndex: 999,
            elevation: 999,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Pressable
              onPress={() => setIsVisible(true)}
              className="px-4 py-2 rounded-full bg-card"
              style={{ ...shadow }}
            >
              <Text variant="caption1" className="text-foreground">
                ▶ Now Playing: {track?.title || 'Audio'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* True modal with full-screen presentation and animation */}
      <Modal
        visible={isVisible}
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onDismiss={() => {
          if (pendingClose) finalizeClose();
        }}
        onRequestClose={close}
      >
        <View className="flex-1">
          {bgSource && (
            <ImageBackground
              source={bgSource}
              resizeMode="cover"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            >
              <BlurView
                intensity={40}
                tint={colors.background === '#0A1514' ? 'dark' : 'light'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            </ImageBackground>
          )}
          <SafeAreaView
            className="flex-1 px-6"
            style={{
              paddingTop: insets.top + 8,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            {/* Header (only close button) */}
            <View className="flex-row items-center justify-end mb-8">
              <Pressable
                onPress={close}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{
                  backgroundColor:
                    colors.background === '#0A1514'
                      ? 'rgba(255,255,255,0.12)'
                      : 'rgba(0,0,0,0.12)',
                }}
              >
                <X size={22} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Center content */}
            <View className="flex-1 items-stretch justify-center">
              {/* Title + Category (more space above progress) */}
              <View className="items-center mb-8">
                <Text
                  variant="title2"
                  className="text-center text-foreground"
                  numberOfLines={2}
                >
                  {track?.title || 'Exercise'}
                </Text>
                {!!track?.subtitle && (
                  <Text
                    variant="subhead"
                    className="text-center text-muted-foreground mt-2"
                    style={{ textTransform: 'capitalize' }}
                  >
                    {track.subtitle}
                  </Text>
                )}
              </View>

              {/* Progress (glass look) */}
              <View style={{ width: '86%', alignSelf: 'center' }}>
                <Pressable
                  onPressIn={onSeek}
                  onPressOut={onSeek}
                  onLayout={onBarLayout}
                  className="w-full h-6 justify-center mb-2"
                >
                  <View style={{ position: 'relative', width: '100%' }}>
                    <View
                      className="w-full rounded-full overflow-hidden"
                      style={{
                        height: 6,
                        backgroundColor:
                          colors.background === '#0A1514'
                            ? 'rgba(255,255,255,0.18)'
                            : 'rgba(0,0,0,0.12)',
                        borderColor:
                          colors.background === '#0A1514'
                            ? 'rgba(255,255,255,0.35)'
                            : 'rgba(0,0,0,0.15)',
                        borderWidth: 1,
                      }}
                    >
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${progress * 100}%`,
                          backgroundColor:
                            colors.background === '#0A1514'
                              ? 'rgba(255,255,255,0.55)'
                              : 'rgba(0,0,0,0.28)',
                        }}
                      />
                    </View>
                    {/* Thumb */}
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        left: `${Math.max(0, Math.min(100, progress * 100))}%`,
                        transform: [{ translateX: -8 }],
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor:
                          colors.background === '#0A1514'
                            ? '#FFFFFF'
                            : '#111827',
                        borderWidth: 2,
                        borderColor:
                          colors.background === '#0A1514'
                            ? 'rgba(255,255,255,0.65)'
                            : 'rgba(0,0,0,0.4)',
                      }}
                    />
                  </View>
                </Pressable>
                <View className="flex-row justify-between">
                  <Text variant="caption2" className="text-foreground">
                    {formatTime(positionMillis)}
                  </Text>
                  <Text variant="caption2" className="text-foreground">
                    {formatTime(
                      durationMillis || (track?.durationSeconds ?? 0) * 1000
                    )}
                  </Text>
                </View>
              </View>

              {/* Transport with skip buttons */}
              <View className="flex-row items-center justify-center mt-6">
                <Pressable onPress={() => skip(-10)} className="p-4 mr-8">
                  <RotateCcw
                    size={28}
                    color={
                      colors.background === '#0A1514' ? '#FFFFFF' : '#111827'
                    }
                  />
                </Pressable>
                <Pressable
                  onPress={track?.sourceUri ? togglePlay : undefined}
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{
                    ...shadow,
                    backgroundColor:
                      colors.background === '#0A1514'
                        ? 'rgba(255,255,255,0.18)'
                        : 'rgba(0,0,0,0.12)',
                    borderColor:
                      colors.background === '#0A1514'
                        ? 'rgba(255,255,255,0.35)'
                        : 'rgba(0,0,0,0.15)',
                    borderWidth: 1,
                    opacity: track?.sourceUri ? 1 : 0.6,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause
                      size={28}
                      color={
                        colors.background === '#0A1514' ? '#FFFFFF' : '#111827'
                      }
                    />
                  ) : (
                    <Play
                      size={28}
                      color={
                        colors.background === '#0A1514' ? '#FFFFFF' : '#111827'
                      }
                    />
                  )}
                </Pressable>
                <Pressable onPress={() => skip(10)} className="p-4 ml-8">
                  <RotateCw
                    size={28}
                    color={
                      colors.background === '#0A1514' ? '#FFFFFF' : '#111827'
                    }
                  />
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </AudioPlayerContext.Provider>
  );
};

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx)
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}
