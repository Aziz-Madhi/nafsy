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
import {
  Frown,
  Zap,
  Minus,
  Smile,
  Flame,
  Briefcase,
  Users,
  Heart,
  DollarSign,
  Calendar,
  Users2,
  GraduationCap,
  User,
  ThumbsDown,
  X,
  ArrowRightLeft,
  Brain,
  Thermometer,
  XCircle,
  Trophy,
  TrendingUp,
  ThumbsUp,
  Leaf,
  CheckCircle,
  Scale,
  Swords,
  UserX,
  Clock,
  RotateCcw,
  Bed,
  Mountain,
  Eye,
  Search,
} from 'lucide-react-native';
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
import RatingSelector from '~/components/mood/RatingSelector';
import { MoodLogReminder } from '~/components/mood/MoodLogReminder';
import {
  getExerciseCategoriesForMood,
  getMoodCategoryFromRating,
  mapMoodToRating,
} from '~/lib/mood-exercise-mapping';
import { useTranslation } from '~/hooks/useTranslation';

// Moods array will be localized in the component

// Encouraging messages configuration
// Rating-based tag categories keys for translation
const ratingTagKeys = {
  1: [
    'mood.tags.crisis',
    'mood.tags.helpless',
    'mood.tags.despair',
    'mood.tags.exhausted',
    'mood.tags.overwhelmed',
    'mood.tags.trapped',
    'mood.tags.empty',
    'mood.tags.isolated',
  ],
  2: [
    'mood.tags.grief',
    'mood.tags.hopeless',
    'mood.tags.drained',
    'mood.tags.withdrawn',
    'mood.tags.numb',
    'mood.tags.defeated',
    'mood.tags.lost',
    'mood.tags.heavy',
  ],
  3: [
    'mood.tags.struggling',
    'mood.tags.tired',
    'mood.tags.upset',
    'mood.tags.disappointed',
    'mood.tags.hurt',
    'mood.tags.vulnerable',
    'mood.tags.down',
    'mood.tags.worried',
  ],
  4: [
    'mood.tags.uneasy',
    'mood.tags.tense',
    'mood.tags.uncertain',
    'mood.tags.restless',
    'mood.tags.concerned',
    'mood.tags.stressed',
    'mood.tags.doubtful',
    'mood.tags.fragile',
  ],
  5: [
    'mood.tags.indifferent',
    'mood.tags.bored',
    'mood.tags.distracted',
    'mood.tags.unmotivated',
    'mood.tags.routine',
    'mood.tags.waiting',
    'mood.tags.processing',
    'mood.tags.adjusting',
  ],
  6: [
    'mood.tags.okay',
    'mood.tags.stable',
    'mood.tags.calm',
    'mood.tags.present',
    'mood.tags.observing',
    'mood.tags.reflecting',
    'mood.tags.resting',
    'mood.tags.balanced',
  ],
  7: [
    'mood.tags.content',
    'mood.tags.relaxed',
    'mood.tags.comfortable',
    'mood.tags.pleased',
    'mood.tags.hopeful',
    'mood.tags.engaged',
    'mood.tags.positive',
    'mood.tags.refreshed',
  ],
  8: [
    'mood.tags.happy',
    'mood.tags.excited',
    'mood.tags.energized',
    'mood.tags.confident',
    'mood.tags.grateful',
    'mood.tags.accomplished',
    'mood.tags.connected',
    'mood.tags.inspired',
  ],
  9: [
    'mood.tags.joyful',
    'mood.tags.thriving',
    'mood.tags.passionate',
    'mood.tags.proud',
    'mood.tags.fulfilled',
    'mood.tags.creative',
    'mood.tags.optimistic',
    'mood.tags.strong',
  ],
  10: [
    'mood.tags.euphoric',
    'mood.tags.unstoppable',
    'mood.tags.blessed',
    'mood.tags.triumphant',
    'mood.tags.ecstatic',
    'mood.tags.radiant',
    'mood.tags.invincible',
    'mood.tags.transcendent',
  ],
} as const;

// Icon mapping for mood tags (rating-based system)
const getTagIcon = (
  tagKey: string,
  size: number = 16,
  color: string = '#666'
) => {
  const iconProps = { size, color };

  switch (tagKey) {
    // Rating 1 (Severely Distressed)
    case 'mood.tags.crisis':
      return <XCircle {...iconProps} />;
    case 'mood.tags.helpless':
      return <UserX {...iconProps} />;
    case 'mood.tags.despair':
      return <Frown {...iconProps} />;
    case 'mood.tags.exhausted':
      return <Thermometer {...iconProps} />;
    case 'mood.tags.overwhelmed':
      return <Zap {...iconProps} />;
    case 'mood.tags.trapped':
      return <X {...iconProps} />;
    case 'mood.tags.empty':
      return <Minus {...iconProps} />;
    case 'mood.tags.isolated':
      return <User {...iconProps} />;

    // Rating 2 (Very Low)
    case 'mood.tags.grief':
      return <Heart {...iconProps} />;
    case 'mood.tags.hopeless':
      return <ThumbsDown {...iconProps} />;
    case 'mood.tags.drained':
      return <Thermometer {...iconProps} />;
    case 'mood.tags.withdrawn':
      return <UserX {...iconProps} />;
    case 'mood.tags.numb':
      return <Minus {...iconProps} />;
    case 'mood.tags.defeated':
      return <XCircle {...iconProps} />;
    case 'mood.tags.lost':
      return <Search {...iconProps} />;
    case 'mood.tags.heavy':
      return <Mountain {...iconProps} />;

    // Rating 3 (Low)
    case 'mood.tags.struggling':
      return <Swords {...iconProps} />;
    case 'mood.tags.tired':
      return <Bed {...iconProps} />;
    case 'mood.tags.upset':
      return <Frown {...iconProps} />;
    case 'mood.tags.disappointed':
      return <ThumbsDown {...iconProps} />;
    case 'mood.tags.hurt':
      return <Heart {...iconProps} />;
    case 'mood.tags.vulnerable':
      return <User {...iconProps} />;
    case 'mood.tags.down':
      return <Frown {...iconProps} />;
    case 'mood.tags.worried':
      return <Brain {...iconProps} />;

    // Rating 4 (Somewhat Low)
    case 'mood.tags.uneasy':
      return <Zap {...iconProps} />;
    case 'mood.tags.tense':
      return <Flame {...iconProps} />;
    case 'mood.tags.uncertain':
      return <ArrowRightLeft {...iconProps} />;
    case 'mood.tags.restless':
      return <RotateCcw {...iconProps} />;
    case 'mood.tags.concerned':
      return <Eye {...iconProps} />;
    case 'mood.tags.stressed':
      return <Zap {...iconProps} />;
    case 'mood.tags.doubtful':
      return <Search {...iconProps} />;
    case 'mood.tags.fragile':
      return <Heart {...iconProps} />;

    // Rating 5 (Neutral-Low)
    case 'mood.tags.indifferent':
      return <Minus {...iconProps} />;
    case 'mood.tags.bored':
      return <Clock {...iconProps} />;
    case 'mood.tags.distracted':
      return <Brain {...iconProps} />;
    case 'mood.tags.unmotivated':
      return <Bed {...iconProps} />;
    case 'mood.tags.routine':
      return <RotateCcw {...iconProps} />;
    case 'mood.tags.waiting':
      return <Clock {...iconProps} />;
    case 'mood.tags.processing':
      return <Brain {...iconProps} />;
    case 'mood.tags.adjusting':
      return <ArrowRightLeft {...iconProps} />;

    // Rating 6 (Neutral-High)
    case 'mood.tags.okay':
      return <CheckCircle {...iconProps} />;
    case 'mood.tags.stable':
      return <Mountain {...iconProps} />;
    case 'mood.tags.calm':
      return <Leaf {...iconProps} />;
    case 'mood.tags.present':
      return <Eye {...iconProps} />;
    case 'mood.tags.observing':
      return <Eye {...iconProps} />;
    case 'mood.tags.reflecting':
      return <Search {...iconProps} />;
    case 'mood.tags.resting':
      return <Bed {...iconProps} />;
    case 'mood.tags.balanced':
      return <Scale {...iconProps} />;

    // Rating 7 (Good)
    case 'mood.tags.content':
      return <Smile {...iconProps} />;
    case 'mood.tags.relaxed':
      return <Leaf {...iconProps} />;
    case 'mood.tags.comfortable':
      return <Heart {...iconProps} />;
    case 'mood.tags.pleased':
      return <ThumbsUp {...iconProps} />;
    case 'mood.tags.hopeful':
      return <TrendingUp {...iconProps} />;
    case 'mood.tags.engaged':
      return <Users {...iconProps} />;
    case 'mood.tags.positive':
      return <CheckCircle {...iconProps} />;
    case 'mood.tags.refreshed':
      return <Leaf {...iconProps} />;

    // Rating 8 (Very Good)
    case 'mood.tags.happy':
      return <Smile {...iconProps} />;
    case 'mood.tags.excited':
      return <Zap {...iconProps} />;
    case 'mood.tags.energized':
      return <Flame {...iconProps} />;
    case 'mood.tags.confident':
      return <Trophy {...iconProps} />;
    case 'mood.tags.grateful':
      return <Heart {...iconProps} />;
    case 'mood.tags.accomplished':
      return <CheckCircle {...iconProps} />;
    case 'mood.tags.connected':
      return <Users {...iconProps} />;
    case 'mood.tags.inspired':
      return <Brain {...iconProps} />;

    // Rating 9 (Excellent)
    case 'mood.tags.joyful':
      return <Smile {...iconProps} />;
    case 'mood.tags.thriving':
      return <TrendingUp {...iconProps} />;
    case 'mood.tags.passionate':
      return <Flame {...iconProps} />;
    case 'mood.tags.proud':
      return <Trophy {...iconProps} />;
    case 'mood.tags.fulfilled':
      return <CheckCircle {...iconProps} />;
    case 'mood.tags.creative':
      return <Brain {...iconProps} />;
    case 'mood.tags.optimistic':
      return <TrendingUp {...iconProps} />;
    case 'mood.tags.strong':
      return <Mountain {...iconProps} />;

    // Rating 10 (Peak)
    case 'mood.tags.euphoric':
      return <Flame {...iconProps} />;
    case 'mood.tags.unstoppable':
      return <TrendingUp {...iconProps} />;
    case 'mood.tags.blessed':
      return <Heart {...iconProps} />;
    case 'mood.tags.triumphant':
      return <Trophy {...iconProps} />;
    case 'mood.tags.ecstatic':
      return <Smile {...iconProps} />;
    case 'mood.tags.radiant':
      return <Flame {...iconProps} />;
    case 'mood.tags.invincible':
      return <Mountain {...iconProps} />;
    case 'mood.tags.transcendent':
      return <TrendingUp {...iconProps} />;

    // Legacy tags (for backward compatibility)
    case 'mood.tags.work':
      return <Briefcase {...iconProps} />;
    case 'mood.tags.family':
      return <Users {...iconProps} />;
    case 'mood.tags.health':
      return <Heart {...iconProps} />;
    case 'mood.tags.finances':
      return <DollarSign {...iconProps} />;
    case 'mood.tags.relationship':
      return <Heart {...iconProps} />;
    case 'mood.tags.future':
      return <Calendar {...iconProps} />;
    case 'mood.tags.social':
      return <Users2 {...iconProps} />;
    case 'mood.tags.school':
      return <GraduationCap {...iconProps} />;
    case 'mood.tags.loss':
      return <Heart {...iconProps} />;
    case 'mood.tags.loneliness':
      return <User {...iconProps} />;
    case 'mood.tags.rejection':
      return <X {...iconProps} />;
    case 'mood.tags.change':
      return <ArrowRightLeft {...iconProps} />;
    case 'mood.tags.memory':
      return <Brain {...iconProps} />;
    case 'mood.tags.illness':
      return <Thermometer {...iconProps} />;
    case 'mood.tags.failure':
      return <XCircle {...iconProps} />;
    case 'mood.tags.achievement':
      return <Trophy {...iconProps} />;
    case 'mood.tags.love':
      return <Heart {...iconProps} />;
    case 'mood.tags.friends':
      return <Users {...iconProps} />;
    case 'mood.tags.progress':
      return <TrendingUp {...iconProps} />;
    case 'mood.tags.gratitude':
      return <ThumbsUp {...iconProps} />;
    case 'mood.tags.fun':
      return <Smile {...iconProps} />;
    case 'mood.tags.peace':
      return <Leaf {...iconProps} />;
    case 'mood.tags.success':
      return <CheckCircle {...iconProps} />;
    case 'mood.tags.frustration':
      return <Zap {...iconProps} />;
    case 'mood.tags.injustice':
      return <Scale {...iconProps} />;
    case 'mood.tags.disrespect':
      return <Frown {...iconProps} />;
    case 'mood.tags.stress':
      return <Zap {...iconProps} />;
    case 'mood.tags.conflict':
      return <Swords {...iconProps} />;
    case 'mood.tags.betrayal':
      return <UserX {...iconProps} />;
    case 'mood.tags.pressure':
      return <Clock {...iconProps} />;

    default:
      return <Minus {...iconProps} />;
  }
};

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

// Individual Tag Component - now rating-based
const TagButton = React.memo(function TagButton({
  tagKey,
  isSelected,
  rating,
  onPress,
}: {
  tagKey: string;
  isSelected: boolean;
  rating: number;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const colors = useColors();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(isSelected ? 1.05 : 1) }],
    };
  }, [isSelected]);

  // Get rating-specific color based on rating scale
  const ratingColor = useMemo(() => {
    const clamped = Math.max(1, Math.min(10, Math.round(rating)));
    const key = `ratingScale${clamped}` as keyof typeof colors;
    return colors[key] || colors.primary;
  }, [rating, colors]);

  const backgroundColor = useMemo(() => {
    return isSelected
      ? ratingColor + '33' // 20% opacity
      : withOpacity(colors.shadow, 0.05);
  }, [isSelected, ratingColor, colors]);

  const textColor = useMemo(() => {
    return colors.background === '#0A1514'
      ? 'rgba(255, 255, 255, 0.9)'
      : colors.foreground;
  }, [colors]);

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          animatedStyle,
          {
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor,
            flex: 1,
            maxWidth:
              tagKey === 'mood.tags.accomplished'
                ? 130
                : tagKey === 'mood.tags.unmotivated'
                  ? 120
                  : 110,
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
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {getTagIcon(tagKey, 16, textColor)}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: textColor,
              textAlign: 'center',
              lineHeight: 18,
            }}
            numberOfLines={1}
          >
            {t(tagKey)}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
});

// Memoized Tags Component to prevent unnecessary re-renders (now rating-based)
const TagsSection = React.memo(function TagsSection({
  rating,
  selectedTags,
  onTagToggle,
}: {
  rating: number;
  selectedTags: string[];
  onTagToggle: (tagKey: string) => void;
}) {
  const { t } = useTranslation();

  if (!rating || rating < 1 || rating > 10) {
    return null;
  }

  const tags = ratingTagKeys[rating as keyof typeof ratingTagKeys];

  if (!tags) {
    return null;
  }

  return (
    <View className="mb-4">
      <Text
        variant="body"
        className="text-center mb-4 text-foreground text-base font-medium"
      >
        {t('mood.contributing')}
      </Text>

      <View className="px-4">
        {/* Row 1: First 3 tags */}
        <View className="flex-row justify-center gap-2 mb-3">
          {tags.slice(0, 3).map((tagKey) => (
            <TagButton
              key={tagKey}
              tagKey={tagKey}
              isSelected={selectedTags.includes(tagKey)}
              rating={rating}
              onPress={() => onTagToggle(tagKey)}
            />
          ))}
        </View>

        {/* Row 2: Next 3 tags */}
        <View className="flex-row justify-center gap-2">
          {tags.slice(3, 6).map((tagKey) => (
            <TagButton
              key={tagKey}
              tagKey={tagKey}
              isSelected={selectedTags.includes(tagKey)}
              rating={rating}
              onPress={() => onTagToggle(tagKey)}
            />
          ))}
        </View>
      </View>
    </View>
  );
});

export default function MoodIndex() {
  const { t } = useTranslation();
  const moodData = useMoodData();
  const todayMood = useTodayMood();
  const currentUser = useCurrentUser();
  const createMood = useMutation(api.moods.createMood);
  const getTodayMoods = useQuery(api.moods.getTodayMoods);
  const colors = useColors();
  const shadowMedium = useShadowStyle('medium');
  const isDarkMode = colors.background === '#0A1514';

  // Determine current time of day
  const currentHour = new Date().getHours();
  const isMorning = currentHour < 12;
  const timeOfDay = isMorning ? 'morning' : 'evening';

  // Check what moods have been logged today
  const hasMorningMood =
    getTodayMoods?.morning !== null && getTodayMoods?.morning !== undefined;
  const hasEveningMood =
    getTodayMoods?.evening !== null && getTodayMoods?.evening !== undefined;
  const hasLoggedCurrentPeriod = isMorning ? hasMorningMood : hasEveningMood;

  // Rating state (1-10). Start at neutral 5
  const [rating, setRating] = useState<number>(5);
  const [hasSelectedRating, setHasSelectedRating] = useState<boolean>(false);

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

  // Legacy variable for backward compatibility
  const hasLoggedToday = hasLoggedCurrentPeriod;

  // Derived mood category from rating (for tags & suggestions)
  const selectedMoodCategory = useMemo(
    () => getMoodCategoryFromRating(rating),
    [rating]
  );

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
    if (!currentUser || isSaving) return;

    try {
      setIsSaving(true);
      impactAsync(ImpactFeedbackStyle.Medium);

      // Call with rating (keep legacy mood populated server-side)
      const create = createMood as unknown as (args: any) => Promise<string>;
      await create({
        rating,
        // Also include mood for backwards compatibility with generated types
        mood: selectedMoodCategory,
        note: moodNote.trim(),
        tags:
          selectedTags.length > 0
            ? selectedTags.map((tagKey) => t(tagKey))
            : undefined,
        timeOfDay: timeOfDay as 'morning' | 'evening',
        createdAt: new Date().getTime(),
      });

      // Reset form
      setHasSelectedRating(false);
      setRating(5);
      setSelectedTags([]);
      setMoodNote('');
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  }, [
    rating,
    selectedMoodCategory,
    moodNote,
    selectedTags,
    currentUser,
    createMood,
    isSaving,
    t,
    timeOfDay,
  ]);

  const screenTitle = t('tabs.mood');

  return (
    <DashboardLayout title={screenTitle}>
      <View>
        {/* Week View Section */}
        <View style={{ marginHorizontal: 6 }}>
          <WeekView moodData={moodData} />
        </View>

        {/* Mood Log Reminder */}
        <MoodLogReminder
          hasMorningMood={hasMorningMood}
          hasEveningMood={hasEveningMood}
          isMorning={isMorning}
          onPress={() => {
            // Scroll to mood logging card if needed
            // This can be enhanced with refs and scrolling if necessary
          }}
        />

        {/* Mood Logging Card */}
        <View className="mb-4" style={{ marginHorizontal: 6 }}>
          <View
            className={cn(
              'rounded-3xl p-6 border border-border/20',
              !hasLoggedToday || !todayMood
                ? 'bg-black/[0.03] dark:bg-white/[0.03]'
                : ''
            )}
            style={{
              ...shadowMedium,
              // Use rating-based color for background once mood is logged
              ...(hasLoggedToday
                ? {
                    backgroundColor: (() => {
                      // Get the most recent mood for the current period
                      const currentPeriodMood = isMorning
                        ? getTodayMoods?.morning
                        : getTodayMoods?.evening;

                      // Use rating if available, otherwise fallback
                      const moodRating =
                        currentPeriodMood?.rating ??
                        (currentPeriodMood?.mood
                          ? mapMoodToRating(currentPeriodMood.mood)
                          : null) ??
                        todayMood?.rating ??
                        (todayMood?.mood ? mapMoodToRating(todayMood.mood) : 5);

                      const clamped = Math.max(
                        1,
                        Math.min(10, Math.round(moodRating))
                      );
                      const key =
                        `ratingScale${clamped}` as keyof typeof colors;
                      return colors[key] as string;
                    })(),
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
                      variant="title3"
                      className="text-center mb-1"
                      style={{
                        color: '#1F2937',
                        letterSpacing: 0.5,
                      }}
                    >
                      {selectedEncouragingMessage.prefix}
                    </Text>
                  )}

                  {/* Highlighted key phrase */}
                  <Text
                    variant="largeTitle"
                    className="text-center mb-4"
                    style={{
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
                    variant="body"
                    className="text-center px-6"
                    style={{
                      fontStyle: 'italic',
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
                {/* Rating Selection */}
                <View className="mb-6">
                  <RatingSelector
                    value={rating}
                    activated={hasSelectedRating}
                    isMorning={isMorning}
                    onActivate={() => {
                      setHasSelectedRating(true);
                    }}
                    onChange={(v) => {
                      setRating(v);
                      // Activation handled on thumb press; keep tags reset on first change too
                      if (!hasSelectedRating) setHasSelectedRating(true);
                      setSelectedTags([]);
                    }}
                  />
                </View>

                {/* Tags Section */}
                {hasSelectedRating && (
                  <TagsSection
                    key={rating}
                    rating={rating}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                  />
                )}

                {/* Note Input */}
                {hasSelectedRating && (
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
                      disabled={isSaving || !hasSelectedRating}
                      className={`py-4 rounded-2xl items-center bg-brand-dark-blue ${
                        isSaving || !hasSelectedRating ? 'opacity-60' : ''
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
        <View className="mb-4" style={{ marginHorizontal: 6 }}>
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
