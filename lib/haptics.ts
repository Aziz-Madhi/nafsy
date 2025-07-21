import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Safe wrapper for haptic feedback that handles errors gracefully
 * and checks for device compatibility
 */
export const safeHaptics = {
  impact: async (
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
  ) => {
    try {
      // Check if platform supports haptics
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.impactAsync(style);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
      // Silently fail - haptics are non-critical
    }
  },

  notification: async (
    type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType
      .Success
  ) => {
    try {
      // Check if platform supports haptics
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.notificationAsync(type);
      }
    } catch (error) {
      console.warn('Haptic notification failed:', error);
      // Silently fail - haptics are non-critical
    }
  },

  selection: async () => {
    try {
      // Check if platform supports haptics
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.warn('Haptic selection failed:', error);
      // Silently fail - haptics are non-critical
    }
  },
};
