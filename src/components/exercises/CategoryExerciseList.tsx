import React, { memo, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  ImageBackground,
  Dimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VerticalList } from '~/components/ui/GenericList';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { MotiView } from 'moti';
import { useTranslation } from '~/hooks/useTranslation';
import { useColors } from '~/hooks/useColors';
import {
  CATEGORY_BACKGROUNDS,
  CATEGORY_BACKGROUNDS_DARK,
} from '~/components/exercises/ModernCategoryCard';
import type { WellnessCategory } from '~/lib/colors';
import { useAppStore } from '~/store/useAppStore';

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category:
    | 'breathing'
    | 'mindfulness'
    | 'movement'
    | 'journaling'
    | 'relaxation'
    | 'habits';
  icon: string;
  color: string;
  steps?: string[];
  benefits?: string[];
}

interface CategoryExerciseListProps {
  categoryId: string;
  exercises: Exercise[];
  loading?: boolean;
  onExercisePress: (exercise: Exercise) => void;
  onBackPress: () => void;
}

// Precompute background image aspect ratios once to avoid any
// first-render fallback that can cause a layout jump.
const buildMeta = (map: Record<string, any>) => {
  const meta: Record<string, { aspect: number }> = {};
  try {
    Object.entries(map).forEach(([key, source]) => {
      try {
        const asset = Image.resolveAssetSource(source);
        if (asset?.width && asset?.height) {
          meta[key] = { aspect: asset.height / asset.width };
        }
      } catch {}
    });
  } catch {}
  return meta;
};

const CATEGORY_BG_META = buildMeta(
  CATEGORY_BACKGROUNDS as unknown as Record<string, any>
);
const CATEGORY_BG_META_DARK = buildMeta(
  CATEGORY_BACKGROUNDS_DARK as unknown as Record<string, any>
);

const getCategoryName = (
  categoryId: string,
  t: (key: string) => string
): string => {
  const categoryKeys: Record<string, string> = {
    mindfulness: 'exercises.categories.mindfulness',
    breathing: 'exercises.categories.breathing',
    movement: 'exercises.categories.movement',
    journaling: 'exercises.categories.journaling',
    relaxation: 'exercises.categories.relaxation',
    habits: 'exercises.categories.habits',
  };
  const key = categoryKeys[categoryId];
  return key
    ? t(key)
    : categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
};

function CategoryExerciseListComponent({
  categoryId,
  exercises,
  loading = false,
  onExercisePress,
  onBackPress,
}: CategoryExerciseListProps) {
  const { t, currentLanguage } = useTranslation();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const currentTheme = useAppStore((s) => s.currentTheme);

  // Memoize category name computation
  const categoryName = useMemo(
    () => getCategoryName(categoryId, t),
    [categoryId, t]
  );

  const handleBackPress = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    onBackPress();
  }, [onBackPress]);

  // Memoize filtered exercises to prevent re-computation
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // No special-case fallback now that migration is complete
      return exercise.category === categoryId;
    });
  }, [exercises, categoryId]);

  // Header hero with category image + bottom-left title
  const Header = useMemo(() => {
    const map =
      currentTheme === 'dark'
        ? CATEGORY_BACKGROUNDS_DARK
        : CATEGORY_BACKGROUNDS;
    const meta =
      currentTheme === 'dark' ? CATEGORY_BG_META_DARK : CATEGORY_BG_META;
    const source = (map as Record<string, any>)[
      (categoryId as WellnessCategory) || 'mindfulness'
    ];
    const aspect =
      meta[(categoryId as WellnessCategory) || 'mindfulness']?.aspect ?? 0.65;
    return function HeaderComponent() {
      const { width } = Dimensions.get('window');
      // Use the original image's native aspect ratio so we show the
      // full photo (no cropping). Height is derived from a pre-resolved
      // aspect ratio to prevent any layout shift on first paint.
      const fullHeight = Math.ceil(width * aspect);
      // Reduce the vertical space the photo takes by 40% total (10% more)
      const heroHeight = Math.max(180, Math.floor(fullHeight * 0.6));

      return (
        <View
          style={{
            paddingTop: 0,
            marginTop: 0,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <ImageBackground
            source={source}
            // Fill left-to-right; center-crop vertically inside the reduced
            // header height while keeping titles/list unaffected.
            resizeMode="cover"
            style={{ width, height: heroHeight, justifyContent: 'flex-end' }}
          >
            {/* Bottom-left title plate */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                backgroundColor: 'rgba(0,0,0,0.28)',
              }}
            >
              <Text variant="heading" className="text-primary-foreground">
                {categoryName}
              </Text>
            </View>
          </ImageBackground>
        </View>
      );
    };
  }, [categoryId, categoryName, currentTheme]);

  // Animated skeleton placeholders while exercises load
  const LoadingStrip = () => {
    const dividerColor =
      colors.background === '#0A1514'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.08)';
    const skeletonColor =
      colors.background === '#0A1514'
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)';

    return (
      <View style={{ paddingHorizontal: 16 }}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            className="px-4 py-5"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: dividerColor,
            }}
          >
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{
                loop: true,
                type: 'timing',
                duration: 650,
                delay: index * 90,
              }}
              style={{
                height: 22,
                borderRadius: 6,
                backgroundColor: skeletonColor,
                marginBottom: 12,
                width: '80%',
              }}
            />
            <MotiView
              from={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{
                loop: true,
                type: 'timing',
                duration: 750,
                delay: 40 + index * 90,
              }}
              style={{
                height: 14,
                borderRadius: 6,
                backgroundColor: skeletonColor,
                width: '40%',
              }}
            />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: 0 }}>
      {/* Global back button overlay (fixed to safe area, independent of hero layout) */}
      <Pressable
        onPress={handleBackPress}
        style={{
          position: 'absolute',
          top: Math.max(insets.top, 8) + 6,
          left: 12,
          zIndex: 50,
        }}
        className="w-10 h-10 rounded-full items-center justify-center"
      >
        <SymbolView name="chevron.left" size={28} tintColor="#FFFFFF" />
      </Pressable>

      {/* Hero header rendered outside the list to guarantee edge-to-edge */}
      <Header />

      {/* Exercise List */}
      {loading && <LoadingStrip />}
      {/* Keep container non-animated by default; use Moti for a light entrance once data arrives. */}
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{
          opacity: loading ? 0 : 1,
          translateY: loading ? 8 : 0,
        }}
        transition={{ type: 'timing', duration: 220 }}
        style={{ flex: 1 }}
        pointerEvents={loading ? 'none' : 'auto'}
      >
        <VerticalList
          data={filteredExercises}
          renderItem={(exercise) => {
            // Localize title if available
            const titleAr = (exercise as any).titleAr;
            const displayTitle =
              currentLanguage === 'ar' && titleAr ? titleAr : exercise.title;
            return (
              <Pressable
                onPress={() => onExercisePress(exercise)}
                className="px-4 py-5"
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor:
                    colors.background === '#0A1514'
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(0,0,0,0.08)',
                }}
              >
                <Text variant="title3" className="text-foreground mb-1">
                  {displayTitle}
                </Text>
                <Text variant="caption1" className="text-muted-foreground">
                  {exercise.duration}
                </Text>
              </Pressable>
            );
          }}
          keyExtractor={(item) => item.id}
          getItemType={(item) => item.difficulty}
          emptyMessage={t('exercises.noExercisesInCategory')}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </MotiView>
    </View>
  );
}

// Memoize component to prevent re-renders when props haven't changed
export const CategoryExerciseList = memo(CategoryExerciseListComponent);
