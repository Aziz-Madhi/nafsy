import React from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { ExerciseCard } from './ExerciseCard';
import { SymbolView } from 'expo-symbols';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'breathing' | 'mindfulness' | 'movement' | 'cbt' | 'journaling' | 'relaxation';
  icon: string;
  color: string;
  steps?: string[];
  benefits?: string[];
}

interface CategoryExerciseListProps {
  categoryId: string;
  exercises: Exercise[];
  onExercisePress: (exercise: Exercise) => void;
  onBackPress: () => void;
}

const getCategoryName = (categoryId: string, t: any): string => {
  const categoryNames: Record<string, string> = {
    mindfulness: t('exercises.categories.mindfulness'),
    breathing: t('exercises.categories.breathing'),
    movement: t('exercises.categories.movement'),
    journaling: t('exercises.categories.journaling'),
    relaxation: t('exercises.categories.relaxation'),
    reminders: t('exercises.categories.reminders') || 'Thoughtful Reminders',
  };
  return categoryNames[categoryId] || categoryId;
};

export function CategoryExerciseList({ 
  categoryId, 
  exercises, 
  onExercisePress, 
  onBackPress 
}: CategoryExerciseListProps) {
  const { t } = useTranslation();
  const categoryName = getCategoryName(categoryId, t);
  
  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBackPress();
  };

  // Filter exercises by category (handle reminders -> relaxation mapping if needed)
  const filteredExercises = exercises.filter(exercise => {
    if (categoryId === 'reminders') {
      // Map "reminders" to existing category or handle separately
      return exercise.category === 'relaxation' || exercise.category === 'mindfulness';
    }
    return exercise.category === categoryId;
  });

  return (
    <Animated.View entering={FadeInLeft.springify()} className="flex-1 bg-[#F2FAF9]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 mb-4">
        <Pressable
          onPress={handleBackPress}
          className="flex-row items-center"
        >
          <SymbolView 
            name="chevron.left" 
            size={32} 
            tintColor="#5A4A3A"
          />
          <Text className="text-[#5A4A3A] font-medium text-lg ml-2">
            {t('common.back') || 'Back'}
          </Text>
        </Pressable>
        
        <Text className="text-[#5A4A3A] text-xl font-bold">
          {categoryName}
        </Text>
        
        <View className="w-10" />
      </View>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ExerciseCard
            exercise={item}
            onPress={onExercisePress}
            index={index}
          />
        )}
        contentContainerStyle={{ 
          paddingHorizontal: 24, 
          paddingBottom: 24 
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-12">
            <Text variant="muted" className="text-center">
              {t('exercises.noExercisesInCategory') || 'No exercises available in this category yet.'}
            </Text>
          </View>
        }
      />
    </Animated.View>
  );
}