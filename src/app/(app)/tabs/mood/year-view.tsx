import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { FullYearPixelCalendar } from '~/components/mood/FullYearPixelCalendar';
import { useMoodData } from '~/hooks/useSharedData';
import { useColors } from '~/hooks/useColors';

export default function YearViewModal() {
  const moodData = useMoodData();
  const [isLoading, setIsLoading] = useState(true);
  const colors = useColors();

  useEffect(() => {
    // Small delay to prevent double-tap issues
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Transform moodData to match expected format
  // createdAt is already a number (timestamp), convert to ISO string for date-fns
  const transformedMoodData = moodData?.map((entry) => ({
    createdAt: new Date(entry.createdAt).toISOString(),
    mood: entry.mood,
    rating: entry.rating,
  }));

  return (
    <View className="flex-1 bg-background">
      <FullYearPixelCalendar moodData={transformedMoodData} />
    </View>
  );
}
