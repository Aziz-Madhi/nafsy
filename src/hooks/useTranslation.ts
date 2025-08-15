import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { type SupportedLanguage } from '~/lib/i18n';
import { useIsRTL } from '~/store/useAppStore';

/**
 * Custom hook that extends react-i18next's useTranslation with app-specific functionality
 */
export const useTranslation = () => {
  const { t, i18n } = useI18nextTranslation();

  /**
   * @deprecated Use requestLanguageChange from useAppStore instead
   * This function is kept for backward compatibility but should not be used for new code
   * The proper way is to use the deferred language system via settings screen
   */
  const switchLanguage = async (language: SupportedLanguage) => {
    console.warn(
      'useTranslation.switchLanguage is deprecated. Use requestLanguageChange from useAppStore for proper deferred language switching.'
    );

    const currentLanguage = i18n.language as SupportedLanguage;

    if (currentLanguage === language) {
      return; // No change needed
    }

    console.warn(
      `Language change attempted via deprecated method. Please use the settings screen for proper language switching that requires manual app restart.`
    );
  };

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
    switchLanguage,
    currentLanguage,
    isRTL,
    availableLanguages,
    // Re-export i18n instance for advanced usage
    i18n,
  };
};

// Export default for compatibility with existing patterns
export default useTranslation;
