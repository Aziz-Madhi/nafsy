/**
 * Language Utility Functions
 * Centralized language resolution and RTL detection
 */

import { getLocales } from 'expo-localization';

// Define supported languages
export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguagePreference = SupportedLanguage | 'system';

/**
 * Resolve language preference to actual language
 */
export const resolveLanguage = (
  languagePreference: LanguagePreference
): SupportedLanguage => {
  if (languagePreference === 'system') {
    const locales = getLocales();
    const deviceLanguage = locales[0]?.languageCode;
    return deviceLanguage &&
      SUPPORTED_LANGUAGES.includes(deviceLanguage as SupportedLanguage)
      ? (deviceLanguage as SupportedLanguage)
      : 'en';
  }
  return languagePreference;
};

/**
 * Check if language is RTL
 */
export const isRTLLanguage = (language: string): boolean => {
  return language === 'ar';
};

/**
 * Get device locale
 */
export const getDeviceLocale = (): SupportedLanguage => {
  try {
    const locales = getLocales();
    const primaryLocale = locales[0];
    const languageCode = primaryLocale?.languageCode;

    return languageCode &&
      SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguage)
      ? (languageCode as SupportedLanguage)
      : 'en';
  } catch {
    return 'en';
  }
};
