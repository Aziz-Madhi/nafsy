/**
 * Simple Text Alignment Utilities
 * UI layout is always LTR, only text alignment changes based on language
 */

import { useCurrentLanguage } from '~/store/useAppStore';

/**
 * Hook-based text alignment utility
 * Arabic = right, English = left
 */
export function useAutoTextAlignment(): 'left' | 'right' {
  const currentLanguage = useCurrentLanguage();
  return currentLanguage === 'ar' ? 'right' : 'left';
}

/**
 * Get text alignment for a specific language (for components that can't use hooks)
 */
export function getTextAlignmentForLanguage(
  language: 'en' | 'ar'
): 'left' | 'right' {
  return language === 'ar' ? 'right' : 'left';
}

/**
 * Hook to check if current language is RTL (for text alignment only)
 */
export function useIsCurrentLanguageRTL(): boolean {
  const currentLanguage = useCurrentLanguage();
  return currentLanguage === 'ar';
}

/**
 * Hook-based text alignment utility (alias)
 */
export function useTextAlignment(): 'left' | 'right' {
  return useAutoTextAlignment();
}

/**
 * Hook to get conditional classes based on language
 */
export function useLanguageClass(ltrClass: string, rtlClass: string): string {
  const currentLanguage = useCurrentLanguage();
  return currentLanguage === 'ar' ? rtlClass : ltrClass;
}

// Simple export for backward compatibility
export default {
  useAutoTextAlignment,
  getTextAlignmentForLanguage,
  useIsCurrentLanguageRTL,
  useTextAlignment,
  useLanguageClass,
};
