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
import { useAppStore } from '../store/useAppStore';

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
  // Always call hooks at the top level
  const store = useAppStore();

  // Defensive fallbacks to prevent undefined returns during hydration
  const settings = store?.settings || { language: 'en' as Language };
  const updateSettings = store?.updateSettings || (() => {});

  // Initialize with safe defaults
  const [locale, setLocaleState] = useState<Language>(() => {
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

  // Update locale when settings change
  useEffect(() => {
    const newLocale = settings.language as Language;
    if (newLocale !== locale) {
      setLocale(newLocale);
      setLocaleState(newLocale);
      setRtlState(isRTL());
    }
  }, [settings.language, locale]);

  // Initialize locale from settings on mount
  useEffect(() => {
    const settingsLocale = settings.language as Language;
    if (settingsLocale !== getCurrentLocale()) {
      setLocale(settingsLocale);
      setLocaleState(settingsLocale);
      setRtlState(isRTL());
    }
  }, []);

  const setLanguage = useCallback(
    (language: Language) => {
      updateSettings({ language });
      setLocale(language);
      setLocaleState(language);
      setRtlState(isRTL());
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
