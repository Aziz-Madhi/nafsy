/**
 * Simple Text Alignment Utilities
 * UI layout is always LTR, only text alignment changes based on language
 */

import { useCurrentLanguage } from '~/store/useAppStore';

/**
 * Get text alignment based on current language
 * Arabic = right, English = left
 */
export function getAutoTextAlignment(): 'left' | 'right' {
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
 * Check if current language is RTL (for text alignment only)
 */
export function isCurrentLanguageRTL(): boolean {
  const currentLanguage = useCurrentLanguage();
  return currentLanguage === 'ar';
}

/**
 * Hook-based text alignment utility
 */
export function useTextAlignment(): 'left' | 'right' {
  return getAutoTextAlignment();
}

/**
 * Get conditional classes based on language
 */
export function getLanguageClass(ltrClass: string, rtlClass: string): string {
  const currentLanguage = useCurrentLanguage();
  return currentLanguage === 'ar' ? rtlClass : ltrClass;
}

// Simple export for backward compatibility
export default {
  getAutoTextAlignment,
  getTextAlignmentForLanguage,
  isCurrentLanguageRTL,
  useTextAlignment,
  getLanguageClass,
};
