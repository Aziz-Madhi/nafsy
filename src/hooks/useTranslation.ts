import { useCallback, useEffect, useState } from 'react';
import { t, getCurrentLocale, setLocale, isRTL, getTextDirection, getTextAlign, getFlexDirection, type Language, type TranslationKeyPath } from '../lib/i18n';
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
  const { settings, updateSettings } = useAppStore();
  const [locale, setLocaleState] = useState<Language>(getCurrentLocale());
  const [rtlState, setRtlState] = useState(isRTL());

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

  const setLanguage = useCallback((language: Language) => {
    updateSettings({ language });
    setLocale(language);
    setLocaleState(language);
    setRtlState(isRTL());
  }, [updateSettings]);

  const translate = useCallback((key: TranslationKeyPath, options?: any): string => {
    return t(key, options);
  }, []);

  return {
    t: translate,
    locale,
    isRTL: rtlState,
    textDirection: getTextDirection(),
    textAlign: getTextAlign(),
    flexDirection: getFlexDirection(),
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