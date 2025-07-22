import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { setLocale, getCurrentLocale, isRTL, type Language } from '../lib/i18n';
import { useAppStore, useLanguage } from '../store/useAppStore';

interface LanguageContextType {
  currentLanguage: Language;
  isRTL: boolean;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * LanguageProvider - Backwards compatibility layer
 *
 * This provider now syncs with Zustand store while maintaining the same API.
 * Eventually, this can be removed once all components use useTranslation directly.
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  // Connect to Zustand store
  const storeLanguage = useLanguage();
  const updateSettings = useAppStore((state) => state.updateSettings);
  const isStoreHydrated = useAppStore(
    (state) => state.persist?.hasHydrated?.() ?? false
  );

  // Initialize with store value if available, fallback to i18n
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    if (isStoreHydrated && storeLanguage) {
      return storeLanguage;
    }
    try {
      return getCurrentLocale() || 'en';
    } catch {
      return 'en';
    }
  });

  const [isRTLEnabled, setIsRTLEnabled] = useState(() => {
    const lang = (isStoreHydrated && storeLanguage) || currentLanguage;
    return lang === 'ar';
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize provider after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Sync with store when it changes
  useEffect(() => {
    if (isStoreHydrated && storeLanguage && storeLanguage !== currentLanguage) {
      setCurrentLanguage(storeLanguage);
      setIsRTLEnabled(storeLanguage === 'ar');

      // Ensure i18n is synced
      try {
        if (getCurrentLocale() !== storeLanguage) {
          setLocale(storeLanguage);
        }
      } catch (error) {
        console.warn(
          'LanguageProvider: Failed to sync i18n with store:',
          error
        );
      }
    }
  }, [isStoreHydrated, storeLanguage, currentLanguage]);

  // Update RTL state when language changes
  useEffect(() => {
    const shouldBeRTL = currentLanguage === 'ar';
    setIsRTLEnabled(shouldBeRTL);
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    try {
      // Update Zustand store (primary source of truth)
      updateSettings({ language });

      // Update local state immediately for UI responsiveness
      setCurrentLanguage(language);
      setIsRTLEnabled(language === 'ar');

      // Update i18n as backup (store middleware should handle this)
      setLocale(language);
    } catch (error) {
      console.warn('LanguageProvider: Failed to set language:', error);

      // Fallback to direct i18n update
      setLocale(language);
      setCurrentLanguage(language);
      setIsRTLEnabled(language === 'ar');
    }
  };

  const toggleLanguage = () => {
    const newLanguage: Language = currentLanguage === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    isRTL: isRTLEnabled,
    setLanguage,
    toggleLanguage,
  };

  // Don't render children until provider is initialized and store is ready
  if (!isInitialized) {
    return null;
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(
      'useLanguageContext must be used within a LanguageProvider'
    );
  }
  return context;
};

// Higher-order component for language support
export const withLanguage = <T extends object>(
  Component: React.ComponentType<T>
) => {
  const WithLanguageComponent = (props: T) => {
    const languageContext = useLanguageContext();
    return <Component {...props} {...languageContext} />;
  };
  WithLanguageComponent.displayName = `withLanguage(${Component.displayName || Component.name || 'Component'})`;
  return WithLanguageComponent;
};
