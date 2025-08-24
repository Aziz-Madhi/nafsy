import React, { useMemo, useCallback, useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { DashboardLayout } from '~/components/ui/ScreenLayout';
import { Text } from '~/components/ui/text';
import { WeekView } from '~/components/mood/WeekView';
import { PixelCalendar } from '~/components/mood/PixelCalendar';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import {
  useMoodData,
  useTodayMood,
  useCurrentUser,
} from '~/hooks/useSharedData';
import { Frown, Zap, Minus, Smile, Flame } from 'lucide-react-native';
import { cn } from '~/lib/cn';
import { MotiView } from 'moti';
import { useColors, useShadowStyle } from '~/hooks/useColors';
import { withOpacity } from '~/lib/colors';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MoodBasedExerciseSuggestion } from '~/components/mood/MoodBasedExerciseSuggestion';
import { getExerciseCategoriesForMood } from '~/lib/mood-exercise-mapping';
import { useTranslation } from '~/hooks/useTranslation';

// Moods array will be localized in the component

// Encouraging messages configuration
// Tag categories keys for translation
const tagCategoryKeys = {
  anxious: [
    'mood.tags.work',
    'mood.tags.family',
    'mood.tags.health',
    'mood.tags.finances',
    'mood.tags.relationship',
    'mood.tags.future',
    'mood.tags.social',
    'mood.tags.school',
  ],
  sad: [
    'mood.tags.loss',
    'mood.tags.loneliness',
    'mood.tags.disappointment',
    'mood.tags.rejection',
    'mood.tags.change',
    'mood.tags.memory',
    'mood.tags.illness',
    'mood.tags.failure',
  ],
  happy: [
    'mood.tags.achievement',
    'mood.tags.love',
    'mood.tags.friends',
    'mood.tags.progress',
    'mood.tags.gratitude',
    'mood.tags.fun',
    'mood.tags.peace',
    'mood.tags.success',
  ],
  angry: [
    'mood.tags.frustration',
    'mood.tags.injustice',
    'mood.tags.disrespect',
    'mood.tags.disappointment',
    'mood.tags.stress',
    'mood.tags.conflict',
    'mood.tags.betrayal',
    'mood.tags.pressure',
  ],
  neutral: [
    'mood.tags.routine',
    'mood.tags.rest',
    'mood.tags.calm',
    'mood.tags.stable',
    'mood.tags.observing',
    'mood.tags.reflecting',
    'mood.tags.waiting',
    'mood.tags.balanced',
  ],
} as const;

const encouragingMessageKeys = [
  {
    id: 1,
    prefix: 'mood.encouragement.building.prefix',
    highlight: 'mood.encouragement.building.highlight',
    suffix: 'mood.encouragement.building.suffix',
  },
  {
    id: 2,
    prefix: 'mood.encouragement.discovering.prefix',
    highlight: 'mood.encouragement.discovering.highlight',
    suffix: 'mood.encouragement.discovering.suffix',
  },
  {
    id: 3,
    prefix: 'mood.encouragement.finding.prefix',
    highlight: 'mood.encouragement.finding.highlight',
    suffix: 'mood.encouragement.finding.suffix',
  },
  {
    id: 4,
    prefix: 'mood.encouragement.tracking.prefix',
    highlight: 'mood.encouragement.tracking.highlight',
    suffix: 'mood.encouragement.tracking.suffix',
  },
  {
    id: 5,
    prefix: 'mood.encouragement.habits.prefix',
    highlight: 'mood.encouragement.habits.highlight',
    suffix: 'mood.encouragement.habits.suffix',
  },
  {
    id: 6,
    prefix: 'mood.encouragement.experiencing.prefix',
    highlight: 'mood.encouragement.experiencing.highlight',
    suffix: 'mood.encouragement.experiencing.suffix',
  },
  {
    id: 7,
    prefix: '',
    highlight: 'mood.encouragement.keepGoing.highlight',
    suffix: 'mood.encouragement.keepGoing.suffix',
  },
] as const;

const renderMoodIcon = (
  moodId: string,
  size: number = 24,
  color?: string,
  colors?: ReturnType<typeof useColors>
) => {
  const iconProps = {
    size,
    color: color || colors?.foreground || '#5A4A3A',
    fill: 'none',
  };

  switch (moodId) {
    case 'sad':
      return <Frown {...iconProps} />;
    case 'anxious':
      return <Zap {...iconProps} />;
    case 'neutral':
      return <Minus {...iconProps} />;
    case 'happy':
      return <Smile {...iconProps} />;
    case 'angry':
      return <Flame {...iconProps} />;
    default:
      return <Minus {...iconProps} />;
  }
};

// Animated Mood Button Component
const AnimatedMoodButton = React.memo(function AnimatedMoodButton({
  mood,
  isSelected,
  onPress,
  t,
}: {
  mood: { id: string; label: string; value: string };
  isSelected: boolean;
  onPress: () => void;
  t: (key: string) => string;
}) {
  const colors = useColors();
  const isDarkModeLocal = colors.background === '#0A1514';

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isSelected ? 1.1 : 1) }],
    };
  }, [isSelected]);

  const backgroundColor = useMemo(() => {
    return isSelected
      ? colors[
          `mood${mood.id.charAt(0).toUpperCase() + mood.id.slice(1)}` as keyof typeof colors
        ]
      : colors.background === '#0A1514'
        ? 'rgba(255, 255, 255, 0.04)'
        : withOpacity(colors.shadow, 0.05);
  }, [isSelected, mood.id, colors]);

  const textColor = useMemo(() => {
    // Keep label color consistent across states
    return isDarkModeLocal ? 'rgba(255, 255, 255, 0.9)' : colors.foreground;
  }, [colors, isDarkModeLocal]);

  return (
    <Pressable
      onPress={onPress}
      className="items-center"
      style={{ marginHorizontal: 1 }}
    >
      <Animated.View
        style={[
          animatedStyle,
          {
            width: 64,
            height: 64,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor,
            overflow: 'hidden',
          },
        ]}
      >
        {renderMoodIcon(mood.id, 28, colors.foreground, colors)}
      </Animated.View>
      <Text
        variant="caption1"
        className="mt-2 text-center font-medium"
        style={{ color: textColor }}
      >
        {t(`mood.moods.${mood.value}`)}
      </Text>
    </Pressable>
  );
});

// Individual Tag Component - EXACT same pattern as AnimatedMoodButton
const TagButton = React.memo(function TagButton({
  tagKey,
  isSelected,
  moodType,
  onPress,
}: {
  tagKey: string;
  isSelected: boolean;
  moodType: string;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isSelected ? 1.05 : 1) }],
    };
  }, [isSelected]);

  // Get mood-specific color
  const moodColor = useMemo(() => {
    const moodColorKey =
      `mood${moodType.charAt(0).toUpperCase() + moodType.slice(1)}` as keyof typeof colors;
    return colors[moodColorKey] || colors.primary;
  }, [moodType, colors]);

  const backgroundColor = useMemo(() => {
    return isSelected
      ? moodColor + '33' // 20% opacity
      : withOpacity(colors.shadow, 0.05);
  }, [isSelected, moodColor, colors]);

  const textColor = useMemo(() => {
    return isSelected
      ? 'rgba(255, 255, 255, 0.95)'
      : colors.background === '#0A1514'
        ? 'rgba(255, 255, 255, 0.9)'
        : colors.foreground;
  }, [isSelected, colors]);

  return (
    <Pressable onPress={onPress} className="w-full">
      <Animated.View
        style={[
          animatedStyle,
          {
            width: '100%',
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor,
            // Ensure pill visibility on dark mode when not selected
            borderWidth: isSelected
              ? 0
              : colors.background === '#0A1514'
                ? 1
                : 0,
            borderColor: isSelected
              ? 'transparent'
              : colors.background === '#0A1514'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'transparent',
            // subtle dark background for unselected in dark mode
            ...(colors.background === '#0A1514' && !isSelected
              ? { backgroundColor: 'rgba(255, 255, 255, 0.04)' }
              : {}),
            overflow: 'hidden',
            minWidth: 0,
          },
        ]}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: textColor,
            textAlign: 'center',
            maxWidth: '100%',
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {t(tagKey)}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

// Memoized Tags Component to prevent unnecessary re-renders
const TagsSection = React.memo(function TagsSection({
  selectedMood,
  selectedTags,
  onTagToggle,
}: {
  selectedMood: string;
  selectedTags: string[];
  onTagToggle: (tagKey: string) => void;
}) {
  const { t } = useTranslation();

  if (
    !selectedMood ||
    !tagCategoryKeys[selectedMood as keyof typeof tagCategoryKeys]
  ) {
    return null;
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 200 }}
      className="mb-4"
    >
      <Text
        variant="body"
        className="text-center mb-4 text-foreground text-base font-medium"
      >
        {t('mood.contributing')}
      </Text>
      <View>
        {/* Row 1: First 4 tags */}
        <View className="w-full flex-row justify-between mb-2 px-2">
          {tagCategoryKeys[selectedMood as keyof typeof tagCategoryKeys]
            .slice(0, 4)
            .map((tagKey) => (
              <View key={tagKey} className="w-1/4 items-center">
                <TagButton
                  tagKey={tagKey}
                  isSelected={selectedTags.includes(tagKey)}
                  moodType={selectedMood}
                  onPress={() => onTagToggle(tagKey)}
                />
              </View>
            ))}
        </View>

        {/* Row 2: Next 4 tags */}
        <View className="w-full flex-row justify-between px-2">
          {tagCategoryKeys[selectedMood as keyof typeof tagCategoryKeys]
            .slice(4, 8)
            .map((tagKey) => (
              <View key={tagKey} className="w-1/4 items-center">
                <TagButton
                  tagKey={tagKey}
                  isSelected={selectedTags.includes(tagKey)}
                  moodType={selectedMood}
                  onPress={() => onTagToggle(tagKey)}
                />
              </View>
            ))}
        </View>
      </View>
    </MotiView>
  );
});

export default function MoodIndex() {
  const { t } = useTranslation();
  const moodData = useMoodData();
  const todayMood = useTodayMood();
  const currentUser = useCurrentUser();
  const createMood = useMutation(api.moods.createMood);
  const colors = useColors();
  const shadowMedium = useShadowStyle('medium');
  const isDarkMode = colors.background === '#0A1514';

  // Localized moods array
  const moods = useMemo(
    () => [
      { id: 'sad', label: t('mood.moods.sad'), value: 'sad' },
      { id: 'anxious', label: t('mood.moods.anxious'), value: 'anxious' },
      { id: 'neutral', label: t('mood.moods.neutral'), value: 'neutral' },
      { id: 'happy', label: t('mood.moods.happy'), value: 'happy' },
      { id: 'angry', label: t('mood.moods.angry'), value: 'angry' },
    ],
    [t]
  );

  // Get exercise suggestion based on today's mood
  const exerciseCategories = useMemo(() => {
    if (!todayMood) return [];
    return getExerciseCategoriesForMood(todayMood.mood as any);
  }, [todayMood]);

  const suggestedExercise = useQuery(
    api.exercises.getRandomExerciseByCategories,
    todayMood ? { categories: exerciseCategories } : 'skip'
  );

  // Helper function to get mood color
  /* const getMoodColorValue = (mood: string) => {
    const moodColorMap: Record<string, keyof typeof colors> = {
      happy: 'moodHappy',
      sad: 'moodSad',
      anxious: 'moodAnxious',
      neutral: 'moodNeutral',
      angry: 'moodAngry',
    };
    return colors[moodColorMap[mood]] || colors.success;
  }; */

  const [selectedMood, setSelectedMood] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [moodNote, setMoodNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Memoized tag toggle handler
  const handleTagToggle = useCallback((tagKey: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagKey)
        ? prev.filter((t) => t !== tagKey)
        : [...prev, tagKey]
    );
  }, []);

  const hasLoggedToday = !!todayMood;

  // Select encouraging message based on day of week
  const selectedEncouragingMessage = useMemo(() => {
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    // Use day of week to select message (ensures same message throughout the day)
    const messageIndex = today % encouragingMessageKeys.length;
    const messageKeys = encouragingMessageKeys[messageIndex];
    return {
      prefix: messageKeys.prefix ? t(messageKeys.prefix) : '',
      highlight: t(messageKeys.highlight),
      suffix: t(messageKeys.suffix),
    };
  }, [t]);

  // Save mood handler
  const handleSaveMood = useCallback(async () => {
    if (!selectedMood || !currentUser || isSaving) return;

    try {
      setIsSaving(true);
      impactAsync(ImpactFeedbackStyle.Medium);

      const selectedMoodObj = moods.find((m) => m.id === selectedMood);
      const moodValue = selectedMoodObj?.value || selectedMood;

      await createMood({
        mood: moodValue as 'happy' | 'neutral' | 'sad' | 'anxious' | 'angry',
        note: moodNote.trim(),
        tags:
          selectedTags.length > 0
            ? selectedTags.map((tagKey) => t(tagKey))
            : undefined,
        createdAt: new Date().getTime(),
      });

      // Reset form
      setSelectedMood('');
      setSelectedTags([]);
      setMoodNote('');
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  }, [selectedMood, moodNote, selectedTags, currentUser, createMood, isSaving]);

  const screenTitle = t('tabs.mood');

  return (
    <DashboardLayout title={screenTitle}>
      <View>
        {/* Week View Section */}
        <View className="mb-1" style={{ marginHorizontal: 6 }}>
          <WeekView moodData={moodData} />
        </View>

        {/* Mood Logging Card */}
        <View className="mb-6" style={{ marginHorizontal: 6 }}>
          <View
            className={cn(
              'rounded-3xl p-6 border border-border/20',
              !hasLoggedToday || !todayMood
                ? 'bg-black/[0.03] dark:bg-white/[0.03]'
                : ''
            )}
            style={{
              ...shadowMedium,
              // Force solid, identical background across themes once mood is logged
              ...(hasLoggedToday && todayMood
                ? {
                    backgroundColor: {
                      happy: colors.moodHappyBg,
                      sad: colors.moodSadBg,
                      anxious: colors.moodAnxiousBg,
                      neutral: colors.moodNeutralBg,
                      angry: colors.moodAngryBg,
                    }[
                      todayMood.mood as
                        | 'happy'
                        | 'sad'
                        | 'anxious'
                        | 'neutral'
                        | 'angry'
                    ],
                  }
                : {}),
            }}
          >
            {hasLoggedToday ? (
              // Encouraging message after mood logged - use fixed dark text on warm background
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'timing', duration: 300 }}
              >
                <View className="items-center justify-center">
                  {/* Prefix text */}
                  {selectedEncouragingMessage.prefix && (
                    <Text
                      className="text-center mb-1"
                      style={{
                        fontFamily: 'CrimsonPro-Regular',
                        fontSize: 18,
                        lineHeight: 24,
                        color: '#1F2937',
                        letterSpacing: 0.5,
                      }}
                    >
                      {selectedEncouragingMessage.prefix}
                    </Text>
                  )}

                  {/* Highlighted key phrase */}
                  <Text
                    className="text-center mb-4"
                    style={{
                      fontFamily: 'CrimsonPro-Bold',
                      fontSize: 32,
                      lineHeight: 38,
                      color: '#1F2937',
                      letterSpacing: 1.5,
                    }}
                  >
                    {selectedEncouragingMessage.highlight}
                  </Text>

                  {/* Visual separator */}
                  <View
                    className="mb-4"
                    style={{
                      width: 40,
                      height: 2,
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 1,
                    }}
                  />

                  {/* Supporting text */}
                  <Text
                    className="text-center px-6"
                    style={{
                      fontFamily: 'CrimsonPro-Italic-VariableFont',
                      fontSize: 16,
                      lineHeight: 24,
                      color: '#1F2937',
                      letterSpacing: 0,
                    }}
                  >
                    {selectedEncouragingMessage.suffix}
                  </Text>
                </View>
              </MotiView>
            ) : (
              // Mood selection view
              <View>
                <Text
                  className="text-center mb-6"
                  style={{
                    fontFamily: 'CrimsonPro-Bold',
                    fontSize: 28,
                    lineHeight: 34,
                    color: isDarkMode
                      ? 'rgba(255, 255, 255, 0.92)'
                      : colors.foreground,
                  }}
                >
                  {t('mood.subtitle')}
                </Text>

                {/* Mood Selection */}
                <View
                  className="flex-row justify-center mb-6"
                  style={{ columnGap: 6 }}
                >
                  {moods.map((mood) => (
                    <AnimatedMoodButton
                      key={mood.id}
                      mood={mood}
                      isSelected={selectedMood === mood.id}
                      onPress={() => {
                        impactAsync(ImpactFeedbackStyle.Light);
                        setSelectedMood(mood.id);
                        setSelectedTags([]); // Reset tags when mood changes
                      }}
                      t={t}
                    />
                  ))}
                </View>

                {/* Tags Section */}
                <TagsSection
                  selectedMood={selectedMood}
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                />

                {/* Note Input */}
                {selectedMood && (
                  <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', duration: 200 }}
                  >
                    <View className="mb-4">
                      <Text
                        variant="caption1"
                        className="text-muted-foreground mb-2"
                      >
                        {t('mood.addNote')}
                      </Text>
                      <View
                        className="p-4"
                        style={{
                          backgroundColor: isDarkMode
                            ? 'rgba(255, 255, 255, 0.04)'
                            : withOpacity(colors.shadow, 0.05),
                          borderWidth: isDarkMode ? 1 : 0,
                          borderColor: isDarkMode
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'transparent',
                          borderRadius: 20,
                          overflow: 'hidden',
                        }}
                      >
                        <TextInput
                          value={moodNote}
                          onChangeText={setMoodNote}
                          placeholder={t('mood.notePlaceholder')}
                          placeholderTextColor={withOpacity(
                            colors.foreground,
                            0.55
                          )}
                          multiline
                          numberOfLines={3}
                          maxLength={200}
                          className="text-base"
                          style={{
                            textAlignVertical: 'top',
                            minHeight: 60,
                            fontSize: 16,
                            lineHeight: 22,
                            color: colors.foreground,
                          }}
                        />
                        <Text
                          variant="caption2"
                          style={{
                            textAlign: 'right',
                            marginTop: 4,
                            color: colors.foreground,
                          }}
                        >
                          {moodNote.length}/200
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={handleSaveMood}
                      disabled={isSaving || !selectedMood}
                      className={`py-4 rounded-2xl items-center bg-brand-dark-blue ${
                        isSaving || !selectedMood ? 'opacity-60' : ''
                      }`}
                      style={{
                        shadowColor: colors.brandDarkBlue,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text variant="callout" className="text-white font-bold">
                        {isSaving ? t('common.loading') : t('mood.saveMood')}
                      </Text>
                    </Pressable>
                  </MotiView>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Mood-based Exercise Suggestion */}
        {hasLoggedToday && todayMood && (
          <MoodBasedExerciseSuggestion
            mood={todayMood.mood as any}
            exercise={suggestedExercise || null}
            isLoading={suggestedExercise === undefined}
          />
        )}

        {/* Pixel Calendar - Mood Visualization */}
        <View className="mb-6" style={{ marginHorizontal: 6 }}>
          <View
            className="rounded-3xl p-4 bg-black/[0.03] dark:bg-white/[0.03]"
            style={{
              ...shadowMedium,
            }}
          >
            <PixelCalendar
              moodData={moodData as any}
              onPress={() => {
                if (!isNavigating) {
                  setIsNavigating(true);
                  impactAsync(ImpactFeedbackStyle.Light);
                  router.push('/tabs/mood/year-view');
                  // Reset navigation flag after a delay
                  setTimeout(() => setIsNavigating(false), 1000);
                }
              }}
            />
          </View>
        </View>
      </View>
    </DashboardLayout>
  );
}
