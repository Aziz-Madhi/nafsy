import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { ExerciseCard, CategoryFilter, ExerciseDetail } from '~/components/exercises';
import { Search } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'breathing' | 'mindfulness' | 'movement' | 'cbt';
  icon: string;
  color: string;
  steps?: string[];
  benefits?: string[];
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    breathing: '🫁',
    mindfulness: '🧘',
    movement: '🚶',
    journaling: '📝',
    relaxation: '💆',
  };
  return icons[category] || '✨';
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    breathing: '#06B6D4',
    mindfulness: '#8B5CF6',
    movement: '#10B981',
    journaling: '#F59E0B',
    relaxation: '#EC4899',
  };
  return colors[category] || '#3B82F6';
}

function getBenefitsForCategory(category: string): string[] {
  const benefits: Record<string, string[]> = {
    breathing: [
      'Reduces stress and anxiety',
      'Improves focus and concentration',
      'Lowers blood pressure',
      'Promotes relaxation'
    ],
    mindfulness: [
      'Increases self-awareness',
      'Reduces negative emotions',
      'Improves emotional regulation',
      'Enhances well-being'
    ],
    movement: [
      'Boosts mood and energy',
      'Reduces physical tension',
      'Improves body awareness',
      'Enhances overall health'
    ],
    journaling: [
      'Clarifies thoughts and feelings',
      'Reduces stress',
      'Improves self-reflection',
      'Tracks personal growth'
    ],
    relaxation: [
      'Reduces muscle tension',
      'Improves sleep quality',
      'Lowers stress hormones',
      'Promotes calmness'
    ],
  };
  return benefits[category] || [];
}

function ExercisesScreen() {
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Show loading state if Clerk hasn't loaded yet
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">Please sign in to continue</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Convex hooks
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : 'skip'
  );
  const exercisesWithProgress = useQuery(
    api.exercises.getExercisesWithProgress,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  const userStats = useQuery(
    api.userProgress.getUserStats,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  const recordCompletion = useMutation(api.userProgress.recordCompletion);
  const seedExercises = useMutation(api.seed.seedExercises);

  // Transform Convex exercises to UI format
  const exercises: Exercise[] = exercisesWithProgress?.map(ex => ({
    id: ex._id,
    title: ex.title,
    description: ex.description,
    duration: `${ex.duration} min`,
    difficulty: ex.difficulty,
    category: ex.category,
    icon: getCategoryIcon(ex.category),
    color: getCategoryColor(ex.category),
    steps: ex.instructions,
    benefits: getBenefitsForCategory(ex.category),
  })) || [];

  // Seed exercises if none exist
  useEffect(() => {
    if (exercisesWithProgress && exercisesWithProgress.length === 0) {
      seedExercises();
    }
  }, [exercisesWithProgress, seedExercises]);

  const filteredExercises = useMemo(() => {
    if (selectedCategory === 'all') return exercises;
    return exercises.filter(exercise => exercise.category === selectedCategory);
  }, [selectedCategory, exercises]);

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowDetail(true);
  };

  const handleStartExercise = async (exercise: Exercise) => {
    setShowDetail(false);
    
    // Record exercise completion (in real app, this would happen after actual completion)
    if (currentUser) {
      await recordCompletion({
        userId: currentUser._id,
        exerciseId: exercise.id as any,
        duration: parseInt(exercise.duration),
        feedback: "Completed successfully",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text variant="title1" className="mb-2">
          Wellness Exercises
        </Text>
        <Text variant="muted">
          Evidence-based practices for mental wellness
        </Text>
      </View>

      {/* Stats Banner */}
      <Animated.View
        entering={FadeInDown.springify()}
        className="mx-6 mt-4 bg-primary/10 dark:bg-primary/20 rounded-2xl p-4 flex-row justify-around"
      >
        <View className="items-center">
          <Text variant="title2" className="text-primary">
            {userStats?.totalSessions || 0}
          </Text>
          <Text variant="muted" className="text-xs">
            Completed
          </Text>
        </View>
        <View className="w-px bg-border" />
        <View className="items-center">
          <Text variant="title2" className="text-primary">
            {userStats?.completionsThisWeek || 0}
          </Text>
          <Text variant="muted" className="text-xs">
            This Week
          </Text>
        </View>
        <View className="w-px bg-border" />
        <View className="items-center">
          <Text variant="title2" className="text-primary">
            {userStats?.totalMinutes || 0}m
          </Text>
          <Text variant="muted" className="text-xs">
            Total Time
          </Text>
        </View>
      </Animated.View>

      {/* Category Filter */}
      <View className="mt-6">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      </View>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ExerciseCard
            exercise={item}
            onPress={handleExercisePress}
            index={index}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Exercise Detail Modal */}
      <ExerciseDetail
        exercise={selectedExercise}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        onStart={handleStartExercise}
      />
    </SafeAreaView>
  );
}

export default ExercisesScreen;