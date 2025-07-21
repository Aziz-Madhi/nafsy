import * as Haptics from 'expo-haptics';

// Haptic feedback optimization utility
class HapticOptimizer {
  private lastHapticTime: number = 0;
  private readonly minInterval: number = 100; // Minimum 100ms between haptics
  private readonly maxFrequency: number = 5; // Max 5 haptics per second
  private recentHaptics: number[] = [];

  // Throttled haptic feedback
  public optimizedImpact(
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
  ): void {
    const now = Date.now();

    // Check minimum interval
    if (now - this.lastHapticTime < this.minInterval) {
      return;
    }

    // Clean old haptics (older than 1 second)
    this.recentHaptics = this.recentHaptics.filter((time) => now - time < 1000);

    // Check frequency limit
    if (this.recentHaptics.length >= this.maxFrequency) {
      return;
    }

    // Execute haptic feedback
    Haptics.impactAsync(style);
    this.lastHapticTime = now;
    this.recentHaptics.push(now);
  }

  // Smart haptic based on interaction type
  public smartHaptic(
    type: 'tap' | 'press' | 'success' | 'warning' | 'error'
  ): void {
    switch (type) {
      case 'tap':
        this.optimizedImpact(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'press':
        this.optimizedImpact(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  }

  // Reset haptic state (useful for new screens)
  public reset(): void {
    this.lastHapticTime = 0;
    this.recentHaptics = [];
  }
}

// Singleton instance for global use
export const hapticOptimizer = new HapticOptimizer();

// Convenience functions
export const optimizedHaptic = {
  light: () =>
    hapticOptimizer.optimizedImpact(Haptics.ImpactFeedbackStyle.Light),
  medium: () =>
    hapticOptimizer.optimizedImpact(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () =>
    hapticOptimizer.optimizedImpact(Haptics.ImpactFeedbackStyle.Heavy),
  tap: () => hapticOptimizer.smartHaptic('tap'),
  press: () => hapticOptimizer.smartHaptic('press'),
  success: () => hapticOptimizer.smartHaptic('success'),
  warning: () => hapticOptimizer.smartHaptic('warning'),
  error: () => hapticOptimizer.smartHaptic('error'),
  reset: () => hapticOptimizer.reset(),
};
