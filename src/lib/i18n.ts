import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getCurrentStorage, getSavedLanguage } from '~/lib/mmkv-storage';
import {
  isRTLLanguage,
  getDeviceLocale,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './language-utils';

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

// Get stored language preference or fallback to device/default
const getInitialLanguage = (): SupportedLanguage => {
  try {
    // 0) Prefer explicit language key to keep i18n and RTL in lockstep
    const explicit = getSavedLanguage();
    if (explicit) {
      console.log('🎯 i18n: Using explicit saved language:', explicit);
      return explicit as SupportedLanguage;
    }

    // 1) Fallback to reading from persisted app store
    const currentStorage = getCurrentStorage();
    console.log('🎯 i18n: Reading from unified storage');

    const storedSettings = currentStorage.getString('app-store');
    console.log(
      '🎯 i18n: Raw stored settings:',
      storedSettings ? 'found' : 'not found'
    );

    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      console.log('🎯 i18n: Parsed settings structure:', {
        hasPendingLanguage: !!settings?.state?.pendingLanguage,
        hasLanguagePreference: !!settings?.state?.settings?.language,
        currentLanguage: settings?.state?.currentLanguage,
      });

      // CRITICAL: Check for pendingLanguage FIRST - this is set when user requested a language change
      const pendingLanguage = settings?.state?.pendingLanguage;
      if (
        pendingLanguage &&
        SUPPORTED_LANGUAGES.includes(pendingLanguage as SupportedLanguage)
      ) {
        console.log('🎯 i18n: Found pending language change:', pendingLanguage);
        return pendingLanguage as SupportedLanguage;
      }

      // If no pending language, check regular preference
      const languagePreference =
        settings?.state?.settings?.language || 'system';
      console.log(
        '🎯 i18n: No pending language, using preference:',
        languagePreference
      );

      if (languagePreference === 'system') {
        const deviceLocale = getDeviceLocale();
        console.log('🎯 i18n: Using device locale:', deviceLocale);
        return deviceLocale;
      }
      if (
        SUPPORTED_LANGUAGES.includes(languagePreference as SupportedLanguage)
      ) {
        console.log('🎯 i18n: Using stored preference:', languagePreference);
        return languagePreference as SupportedLanguage;
      }
    } else {
      console.log('🎯 i18n: No stored settings found in unified storage');
    }
  } catch (error) {
    console.warn('🎯 i18n: Failed to read stored language preference:', error);
  }

  // Fallback to device locale
  const fallbackLocale = getDeviceLocale();
  console.log('🎯 i18n: Using fallback device locale:', fallbackLocale);
  return fallbackLocale;
};

// Initialize i18next with stored language preference
// Apply RTL state at startup to prevent runtime layout issues
const initI18n = () => {
  const initialLanguage = getInitialLanguage();
  const isRTL = isRTLLanguage(initialLanguage);

  console.log(
    '🎯 i18n: Initializing language (RTL handled by rtl-bootstrap):',
    {
      language: initialLanguage,
      isRTL,
    }
  );

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

// Helper function to change language (RTL handled by bootstrap)
// NOTE: This is mainly for legacy compatibility. With the current deferred language system,
// language changes should happen during app initialization via rtl-bootstrap.ts.
export const changeLanguage = async (language: 'en' | 'ar'): Promise<void> => {
  const currentLanguage = i18n.language;

  if (currentLanguage === language) {
    return; // No change needed
  }

  console.log(
    '🎯 i18n: Runtime language change (legacy, RTL not applied):',
    language
  );

  // Change i18next language only - RTL is handled by rtl-bootstrap.ts at app startup
  await i18n.changeLanguage(language);

  console.log(
    '🎯 i18n: Language changed, RTL requires app restart to take effect'
  );
};
