/**
 * Language Bootstrap - Simple Language Detection with Forced LTR Layout
 * Forces the app to use LTR layout always, regardless of language
 * Text alignment is handled per-component based on current language
 */

import { I18nManager } from 'react-native';
import { getSavedLanguage } from './mmkv-storage';
import { getDeviceLocale } from './language-utils';

/**
 * Get current language preference - simple fallback chain
 */
const getCurrentLanguage = (): 'en' | 'ar' => {
  // 1) Check saved language preference first
  const savedLanguage = getSavedLanguage();
  if (savedLanguage) {
    console.log('🌐 Bootstrap: Using saved language:', savedLanguage);
    return savedLanguage;
  }

  // 2) Fallback to device locale
  const deviceLocale = getDeviceLocale();
  console.log('🌐 Bootstrap: Using device locale:', deviceLocale);
  return deviceLocale;
};

/**
 * Initialize app with forced LTR layout
 * UI layout is always LTR, text alignment is handled per-component
 */
const initializeLanguageBootstrap = (): void => {
  const currentLanguage = getCurrentLanguage();

  // FORCE the app to use LTR layout always (no mirroring)
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);

  console.log('🌐 Language Bootstrap: Initialized', {
    currentLanguage,
    uiLayout: 'LTR (forced)',
    textAlignment: 'Per-component based on language',
  });
};

// Execute language bootstrap immediately when this module is imported
// Forces LTR layout always, text alignment handled per-component

initializeLanguageBootstrap();

export { initializeLanguageBootstrap, getCurrentLanguage };
