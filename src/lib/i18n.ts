import I18n from 'react-native-i18n';
import { NativeModules, Platform } from 'react-native';
import { translations, type Language, type TranslationKeyPath } from '../locales';

// Get device locale
const getDeviceLocale = (): string => {
  let locale = 'en';
  
  if (Platform.OS === 'ios') {
    locale = NativeModules.SettingsManager?.settings?.AppleLocale || 
             NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en';
  } else {
    locale = NativeModules.I18nManager.localeIdentifier || 'en';
  }
  
  return locale.split('_')[0]; // Get language code only (e.g., 'en' from 'en_US')
};

// Configure I18n
I18n.translations = translations;
I18n.defaultLocale = 'en';
I18n.fallbacks = true;

// Set initial locale
const deviceLocale = getDeviceLocale();
I18n.locale = ['en', 'ar'].includes(deviceLocale) ? deviceLocale : 'en';

// Helper function to get nested translation value
const getNestedTranslation = (obj: any, path: string): string => {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return the key if translation not found
    }
  }
  
  return typeof current === 'string' ? current : path;
};

// Translation function with type safety
export const t = (key: TranslationKeyPath, options?: any): string => {
  try {
    const translation = getNestedTranslation(I18n.translations[I18n.locale as Language], key);
    return I18n.interpolate(translation, options);
  } catch (error) {
    console.warn(`Translation not found for key: ${key}`);
    return key;
  }
};

// Get current locale
export const getCurrentLocale = (): Language => {
  return I18n.locale as Language;
};

// Set locale
export const setLocale = (locale: Language): void => {
  I18n.locale = locale;
};

// Check if current locale is RTL
export const isRTL = (): boolean => {
  return I18n.locale === 'ar';
};

// Get text direction
export const getTextDirection = (): 'ltr' | 'rtl' => {
  return isRTL() ? 'rtl' : 'ltr';
};

// Get text align based on locale
export const getTextAlign = (): 'left' | 'right' => {
  return isRTL() ? 'right' : 'left';
};

// Get flex direction based on locale
export const getFlexDirection = (): 'row' | 'row-reverse' => {
  return isRTL() ? 'row-reverse' : 'row';
};

// Helper to check if a language is supported
export const isSupportedLanguage = (language: string): language is Language => {
  return ['en', 'ar'].includes(language);
};

// Export I18n instance for advanced usage
export { I18n };
export type { Language, TranslationKeyPath };