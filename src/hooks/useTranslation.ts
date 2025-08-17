import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { type SupportedLanguage } from '~/lib/language-utils';
import { isCurrentLanguageRTL } from '~/lib/rtl-utils';

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
   * Check if current language is RTL (for text direction only)
   * UI layout always stays LTR
   */
  const isRTL = isCurrentLanguageRTL();

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
