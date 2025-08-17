import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getSavedLanguage } from '~/lib/mmkv-storage';
import { getDeviceLocale, type SupportedLanguage } from './language-utils';

// Import translation files
import en from '../locales/en.json';
import ar from '../locales/ar.json';

// Define the resources for i18next
export const resources = {
  en: {
    translation: en,
  },
  ar: {
    translation: ar,
  },
} as const;

// Simple language initialization - no complex state
const getInitialLanguage = (): SupportedLanguage => {
  // 1) Check saved language preference first
  const savedLanguage = getSavedLanguage();
  if (savedLanguage) {
    console.log('🎯 i18n: Using saved language:', savedLanguage);
    return savedLanguage;
  }

  // 2) Fallback to device locale
  const deviceLocale = getDeviceLocale();
  console.log('🎯 i18n: Using device locale:', deviceLocale);
  return deviceLocale;
};

// Initialize i18next with simple language detection
const initI18n = () => {
  const initialLanguage = getInitialLanguage();

  console.log('🎯 i18n: Initializing with language:', initialLanguage);

  i18next.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    debug: __DEV__,
  });

  return i18next;
};

// Initialize and export
const i18n = initI18n();

export default i18n;

// Helper function to change language instantly
export const changeLanguage = async (language: 'en' | 'ar'): Promise<void> => {
  const currentLanguage = i18n.language;

  if (currentLanguage === language) {
    return; // No change needed
  }

  console.log('🎯 i18n: Changing language to:', language);

  // Change i18next language - text alignment updates automatically
  await i18n.changeLanguage(language);

  console.log('🎯 i18n: Language changed successfully');
};
