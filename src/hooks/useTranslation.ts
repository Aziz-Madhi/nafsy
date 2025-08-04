import { useCallback, useEffect, useState } from 'react';
import {
  t,
  getCurrentLocale,
  setLocale,
  isRTL,
  getTextDirection,
  getTextAlign,
  type Language,
  type TranslationKeyPath,
} from '../lib/i18n';
import { useAppStore, useLanguage } from '../store/useAppStore';

export interface TranslationHook {
  t: (key: TranslationKeyPath, options?: any) => string;
  locale: Language;
  language: Language; // Added for backward compatibility
  isRTL: boolean;
  textDirection: 'ltr' | 'rtl';
  textAlign: 'left' | 'right';
  // Removed flexDirection - use useRTLSupport() hook when RTL layout is needed
  setLanguage: (language: Language) => void;
}

export const useTranslation = (): TranslationHook => {
  // Use Zustand selectors for optimal performance
  const language = useLanguage();
  const updateSettings = useAppStore((state) => state.updateSettings);

  // Force component re-render when language changes
  const [, forceUpdate] = useState({});

  // Initialize with safe defaults, prioritizing store values once hydrated
  const [locale, setLocaleState] = useState<Language>(() => {
    if (language) {
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

  // Sync language changes and force re-render
  useEffect(() => {
    if (language && language !== locale) {
      try {
        setLocale(language);
        setLocaleState(language);
        setRtlState(language === 'ar');
        // Force all components using this hook to re-render
        forceUpdate({});
      } catch (error) {
        console.warn('Failed to sync locale with store:', error);
      }
    }
  }, [language, locale]);

  // Initialize locale from store on mount
  useEffect(() => {
    const targetLanguage = language || 'en';
    try {
      setLocale(targetLanguage);
      setLocaleState(targetLanguage);
      setRtlState(targetLanguage === 'ar');
    } catch (error) {
      console.warn('Failed to initialize locale:', error);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Removed getFlexDirectionSafe - flex direction is no longer part of main translation hook

  return {
    t: translate,
    locale: locale || 'en',
    language: locale || 'en', // Added for backward compatibility
    isRTL: rtlState,
    textDirection: getTextDirectionSafe(),
    textAlign: getTextAlignSafe(),
    // Removed flexDirection - use useRTLSupport() when explicit RTL layout is needed
    setLanguage,
  };
};

// Type-safe translation hook with better TypeScript support
export const useT = () => {
  const { t } = useTranslation();
  return t;
};

// Hook specifically for RTL support - includes RTL-aware flex direction
export const useRTLSupport = () => {
  const { isRTL, textDirection, textAlign } = useTranslation();

  // Get RTL-aware flex direction for components that explicitly want RTL layout
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return {
    isRTL,
    textDirection,
    textAlign,
    flexDirection, // RTL-aware flex direction for explicit RTL layout needs
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
