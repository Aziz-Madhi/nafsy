/**
 * RTL Bootstrap - Critical Early RTL Initialization
 * This MUST be imported BEFORE any styles or components to prevent RTL caching issues
 */

import { I18nManager } from 'react-native';
import { getCurrentStorage, getSavedLanguage, storage } from './mmkv-storage';
import * as Updates from 'expo-updates';
import {
  isRTLLanguage,
  getDeviceLocale,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './language-utils';

/**
 * Read stored language preference synchronously from MMKV
 * This is a simplified version of i18n's getInitialLanguage for RTL bootstrap only
 */
const getStoredLanguageForRTL = (): SupportedLanguage => {
  try {
    // 1) Prefer dedicated language key to avoid JSON parsing and hydration races
    const explicit = getSavedLanguage();
    if (explicit) {
      console.log('🚀 RTL Bootstrap: Using explicit saved language:', explicit);
      return explicit;
    }

    // 2) Fallback to Zustand-persisted settings
    const storage = getCurrentStorage();
    const storedSettings = storage.getString('app-store');

    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      // Check for pendingLanguage FIRST (user requested language change)
      const pendingLanguage = settings?.state?.pendingLanguage;
      if (
        pendingLanguage &&
        SUPPORTED_LANGUAGES.includes(pendingLanguage as SupportedLanguage)
      ) {
        console.log(
          '🚀 RTL Bootstrap: Found pending language:',
          pendingLanguage
        );
        return pendingLanguage as SupportedLanguage;
      }

      // Check stored language preference
      const languagePreference =
        settings?.state?.settings?.language || 'system';
      if (languagePreference === 'system') {
        const deviceLocale = getDeviceLocale();
        console.log('🚀 RTL Bootstrap: Using system language:', deviceLocale);
        return deviceLocale;
      }
      if (
        SUPPORTED_LANGUAGES.includes(languagePreference as SupportedLanguage)
      ) {
        console.log(
          '🚀 RTL Bootstrap: Using stored language:',
          languagePreference
        );
        return languagePreference as SupportedLanguage;
      }
    }
  } catch (error) {
    console.warn(
      '🚀 RTL Bootstrap: Failed to read language preference:',
      error
    );
  }

  // Fallback to system or English
  const fallback = getDeviceLocale();
  console.log('🚀 RTL Bootstrap: Using fallback language:', fallback);
  return fallback;
};

/**
 * Apply RTL state immediately during app bootstrap
 * This runs synchronously before any React components or styles are processed
 */
const applyEarlyRTL = async (): Promise<void> => {
  const language = getStoredLanguageForRTL();
  const shouldBeRTL = isRTLLanguage(language);

  const target = shouldBeRTL ? 'rtl' : 'ltr';
  const current = I18nManager.isRTL ? 'rtl' : 'ltr';
  const reloadKey = 'rtl_reload_done_for';
  const lastReload = storage.getString(reloadKey);

  console.log('🚀 RTL Bootstrap: Direction check BEFORE any styling', {
    language,
    shouldBeRTL,
    current,
    lastReload,
  });

  if (current !== target) {
    // Set native direction immediately
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);

    // Only reload once for this target to avoid loops
    if (lastReload !== target) {
      try {
        storage.set(reloadKey, target);
      } catch {}
      try {
        console.log(
          '🚀 RTL Bootstrap: Direction changed. Reloading app now...'
        );
        await Updates.reloadAsync();
      } catch (e) {
        console.warn('🚀 RTL Bootstrap: Failed to reload after RTL change', e);
      }
    } else {
      console.log(
        '🚀 RTL Bootstrap: Reload already performed for target. Skipping reload.'
      );
    }
    return;
  }

  // Direction already correct; clear marker to allow future toggles
  if (lastReload === target) {
    try {
      storage.delete(reloadKey);
    } catch {}
  }

  console.log('🚀 RTL Bootstrap: Direction already correct. Proceeding.');
};

// Execute RTL bootstrap immediately when this module is imported
// Fire and forget; any required reload will interrupt startup immediately

applyEarlyRTL();

export { applyEarlyRTL, getStoredLanguageForRTL };
