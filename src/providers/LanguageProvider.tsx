import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { setLocale, getCurrentLocale, isRTL, type Language } from '../lib/i18n';

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

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
}) => {
  // Remove dependency on useAppStore - manage language state independently
  const [currentLanguage, setCurrentLanguage] =
    useState<Language>(getCurrentLocale());
  const [isRTLEnabled, setIsRTLEnabled] = useState(isRTL());

  // Update RTL layout manager when language changes
  useEffect(() => {
    const shouldBeRTL = currentLanguage === 'ar';
    setIsRTLEnabled(shouldBeRTL);

    // Note: We don't force global RTL layout as it affects entire app structure
    // Instead, we use selective RTL for text content via RTL utilities
  }, [currentLanguage]);

  const setLanguage = (language: Language) => {
    // Update i18n locale
    setLocale(language);

    // Update local state
    setCurrentLanguage(language);

    // Update RTL state
    setIsRTLEnabled(language === 'ar');

    // Note: App store sync will be handled separately to avoid navigation context issues
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
