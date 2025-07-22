import { useCallback, useEffect, useState } from 'react';
import {
  t,
  getCurrentLocale,
  setLocale,
  isRTL,
  getTextDirection,
  getTextAlign,
  getFlexDirection,
  type Language,
  type TranslationKeyPath,
} from '../lib/i18n';
import { useAppStore, useLanguage, useSettings } from '../store/useAppStore';

export interface TranslationHook {
  t: (key: TranslationKeyPath, options?: any) => string;
  locale: Language;
  isRTL: boolean;
  textDirection: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  flexDirection: 'row' | 'row-reverse';
  setLanguage: (language: Language) => void;
}

export const useTranslation = (): TranslationHook => {
  // Use Zustand selectors for optimal performance
  const language = useLanguage();
  const settings = useSettings();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const isStoreHydrated = useAppStore(
    (state) => state.persist?.hasHydrated?.() ?? false
  );

  // Initialize with safe defaults, prioritizing store values once hydrated
  const [locale, setLocaleState] = useState<Language>(() => {
    if (isStoreHydrated && language) {
      return language;
    }
    try {
      return getCurrentLocale() || 'en';
    } catch {
      return 'en';
    }
  });

  const [rtlState, setRtlState] = useState(() => {
    try {
      return isRTL();
    } catch {
      return false;
    }
  });

  // Sync with store once it's hydrated
  useEffect(() => {
    if (isStoreHydrated && language && language !== locale) {
      try {
        setLocale(language);
        setLocaleState(language);
        setRtlState(isRTL());
      } catch (error) {
        console.warn('Failed to sync locale with store:', error);
      }
    }
  }, [isStoreHydrated, language, locale]);

  // Update locale when store language changes
  useEffect(() => {
    if (language && language !== locale) {
      try {
        setLocale(language);
        setLocaleState(language);
        setRtlState(isRTL());
      } catch (error) {
        console.warn('Failed to update locale:', error);
      }
    }
  }, [language, locale]);

  // Initialize locale from store on mount (with fallback)
  useEffect(() => {
    const targetLanguage = language || 'en';
    const currentI18nLocale = getCurrentLocale();

    if (targetLanguage !== currentI18nLocale) {
      try {
        setLocale(targetLanguage);
        setLocaleState(targetLanguage);
        setRtlState(isRTL());
      } catch (error) {
        console.warn('Failed to initialize locale:', error);
      }
    }
  }, [language]);

  const setLanguage = useCallback(
    (newLanguage: Language) => {
      try {
        // Update store first (this will trigger i18n update via store middleware)
        updateSettings({ language: newLanguage });

        // Update local state immediately for UI responsiveness
        setLocaleState(newLanguage);
        setRtlState(newLanguage === 'ar');

        // Ensure i18n is updated (backup in case store middleware fails)
        setLocale(newLanguage);
      } catch (error) {
        console.warn('Failed to set language:', error);
      }
    },
    [updateSettings]
  );

  const translate = useCallback(
    (key: TranslationKeyPath, options?: any): string => {
      try {
        const result = t(key, options);
        // Ensure we never return undefined or null
        return typeof result === 'string' ? result : key;
      } catch (error) {
        console.warn('Translation error:', error);
        return key; // Return the key as fallback
      }
    },
    []
  );

  // Safe getters with fallbacks
  const getTextDirectionSafe = (): 'ltr' | 'rtl' => {
    try {
      return getTextDirection();
    } catch {
      return rtlState ? 'rtl' : 'ltr';
    }
  };

  const getTextAlignSafe = (): 'left' | 'right' => {
    try {
      return getTextAlign();
    } catch {
      return rtlState ? 'right' : 'left';
    }
  };

  const getFlexDirectionSafe = (): 'row' | 'row-reverse' => {
    try {
      return getFlexDirection();
    } catch {
      return rtlState ? 'row-reverse' : 'row';
    }
  };

  return {
    t: translate,
    locale: locale || 'en',
    isRTL: rtlState,
    textDirection: getTextDirectionSafe(),
    textAlign: getTextAlignSafe(),
    flexDirection: getFlexDirectionSafe(),
    setLanguage,
  };
};

// Type-safe translation hook with better TypeScript support
export const useT = () => {
  const { t } = useTranslation();
  return t;
};

// Hook specifically for RTL support
export const useRTLSupport = () => {
  const { isRTL, textDirection, textAlign, flexDirection } = useTranslation();

  return {
    isRTL,
    textDirection,
    textAlign,
    flexDirection,
    getMarginStart: (value: number) =>
      isRTL ? { marginRight: value } : { marginLeft: value },
    getMarginEnd: (value: number) =>
      isRTL ? { marginLeft: value } : { marginRight: value },
    getPaddingStart: (value: number) =>
      isRTL ? { paddingRight: value } : { paddingLeft: value },
    getPaddingEnd: (value: number) =>
      isRTL ? { paddingLeft: value } : { paddingRight: value },
  };
};

// Hook for language switching
export const useLanguageSwitcher = () => {
  const { locale, setLanguage } = useTranslation();

  const toggleLanguage = useCallback(() => {
    setLanguage(locale === 'en' ? 'ar' : 'en');
  }, [locale, setLanguage]);

  const switchToEnglish = useCallback(() => {
    setLanguage('en');
  }, [setLanguage]);

  const switchToArabic = useCallback(() => {
    setLanguage('ar');
  }, [setLanguage]);

  return {
    currentLanguage: locale,
    setLanguage,
    toggleLanguage,
    switchToEnglish,
    switchToArabic,
    isEnglish: locale === 'en',
    isArabic: locale === 'ar',
  };
};
