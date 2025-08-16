import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { type SupportedLanguage } from '~/lib/language-utils';
import { useIsRTL } from '~/store/useAppStore';

/**
 * Custom hook that extends react-i18next's useTranslation with app-specific functionality
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nextTranslation();

  /**
   * Get current language
   */
  const currentLanguage = i18n.language as SupportedLanguage;

  /**
   * Check if current language is RTL using store state (not computed from language)
   * This ensures consistency even when React Native's internal RTL state is stale
   */
  const isRTL = useIsRTL();

  /**
   * Get available languages
   */
  const availableLanguages: SupportedLanguage[] = ['en', 'ar'];

  return {
    t,
    currentLanguage,
    isRTL,
    availableLanguages,
    // Re-export i18n instance for advanced usage
    i18n,
  };
};

// Export default for compatibility with existing patterns
export default useTranslation;
