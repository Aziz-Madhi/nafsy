import React, { useEffect } from 'react';
import { I18nManager } from 'react-native';
import { useAppStore } from '~/store/useAppStore';
import { setLocale } from '~/lib/i18n';

interface LanguageProviderProps {
  children: React.ReactNode;
}

/**
 * LanguageProvider - Syncs the app store language with i18n
 *
 * This ensures that when the language changes in the store,
 * it's properly reflected in the i18n library for translations
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const language = useAppStore((state) => state.settings.language);

  useEffect(() => {
    // Update i18n locale when language changes
    setLocale(language);

    // Note: Removed global RTL layout enforcement (I18nManager.forceRTL)
    // to prevent entire app layout from flipping when switching to Arabic.
    // Text-level RTL alignment is handled by individual Text components.
  }, [language]);

  // Initial setup - use hook instead of getState to avoid initialization issues
  const initialLanguage = useAppStore((state) => state.settings.language);
  
  useEffect(() => {
    setLocale(initialLanguage);
    // Enable RTL text rendering support but don't force layout direction
    I18nManager.allowRTL(true);
    // Note: Removed I18nManager.forceRTL() to prevent global layout flipping
  }, [initialLanguage]);

  return <>{children}</>;
}
