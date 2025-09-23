import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useAppStore } from '~/store/useAppStore';

/**
 * Safe wrapper for haptic feedback that handles errors gracefully
 * and checks for device compatibility
 */
export const safeHaptics = {
  impact: async (
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
  ) => {
    try {
      const enabled = useAppStore.getState().settings.hapticFeedbackEnabled !== false;
      if (!enabled) return;
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
      const enabled = useAppStore.getState().settings.hapticFeedbackEnabled !== false;
      if (!enabled) return;
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
      const enabled = useAppStore.getState().settings.hapticFeedbackEnabled !== false;
      if (!enabled) return;
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

// Global monkey-patch so any direct expo-haptics usage respects the toggle
let patched = false;
try {
  if (!patched) {
    const originalImpact = Haptics.impactAsync.bind(Haptics);
    const originalNotification = Haptics.notificationAsync.bind(Haptics);
    const originalSelection = Haptics.selectionAsync.bind(Haptics);

    const patchedImpact: typeof Haptics.impactAsync = async (
      style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
    ) => {
      const enabled =
        useAppStore.getState().settings.hapticFeedbackEnabled !== false;
      if (!enabled) return;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        return originalImpact(style);
      }
    };
    // @ts-expect-error - monkey patching expo-haptics
    Haptics.impactAsync = patchedImpact;

    const patchedNotification: typeof Haptics.notificationAsync = async (
      type: Haptics.NotificationFeedbackType =
        Haptics.NotificationFeedbackType.Success
    ) => {
      const enabled =
        useAppStore.getState().settings.hapticFeedbackEnabled !== false;
      if (!enabled) return;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        return originalNotification(type);
      }
    };
    // @ts-expect-error - monkey patching expo-haptics
    Haptics.notificationAsync = patchedNotification;

    const patchedSelection: typeof Haptics.selectionAsync = async () => {
      const enabled =
        useAppStore.getState().settings.hapticFeedbackEnabled !== false;
      if (!enabled) return;
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        return originalSelection();
      }
    };
    // @ts-expect-error - monkey patching expo-haptics
    Haptics.selectionAsync = patchedSelection;

    patched = true;
  }
} catch (e) {
  // If patching fails, continue without throwing; wrapper still works where used
}
