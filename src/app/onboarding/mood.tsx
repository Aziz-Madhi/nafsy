import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function MoodStep() {
  useEffect(() => {
    // This route is deprecated; the mood content now lives inside the profile screen as step 2.
    router.replace('/onboarding/profile');
  }, []);
  return <View />;
}
