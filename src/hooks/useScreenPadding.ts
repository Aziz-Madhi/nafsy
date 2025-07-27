import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ScreenType = 'chat' | 'list' | 'modal';

export interface ScreenPaddingConfig {
  /** Top padding including status bar */
  top: number;
  /** Bottom padding for content */
  bottom: number;
  /** Horizontal padding */
  horizontal: number;
}

/**
 * Unified hook for consistent screen padding across the app
 * Replaces hardcoded navigation bar heights with dynamic calculations
 */
export function useScreenPadding(
  screenType: ScreenType = 'list'
): ScreenPaddingConfig {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const baseTopPadding = insets.top;
    const baseBottomPadding = insets.bottom;

    switch (screenType) {
      case 'chat':
        return {
          // Status bar + minimal header space (no excessive padding)
          top: baseTopPadding + 16,
          // Space for tab bar + input area
          bottom: baseBottomPadding + 100,
          horizontal: 20,
        };

      case 'list':
        return {
          // Status bar + small header margin (reduced)
          top: baseTopPadding + 4,
          // Space for tab bar
          bottom: baseBottomPadding + 80,
          horizontal: 8,
        };

      case 'modal':
        return {
          // Minimal top space for modals
          top: baseTopPadding + 8,
          bottom: baseBottomPadding + 40,
          horizontal: 16,
        };

      default:
        return {
          top: baseTopPadding + 12,
          bottom: baseBottomPadding + 80,
          horizontal: 16,
        };
    }
  }, [insets, screenType]);
}
