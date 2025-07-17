import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { setLocale, getCurrentLocale, isRTL, type Language } from '../lib/i18n';
import { useAppStore } from '../store/useAppStore';

interface LanguageContextType {
  currentLanguage: Language;
  isRTL: boolean;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { settings, updateSettings } = useAppStore();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(getCurrentLocale());
  const [isRTLEnabled, setIsRTLEnabled] = useState(isRTL());

  // Initialize language from settings
  useEffect(() => {
    const settingsLanguage = settings.language as Language;
    if (settingsLanguage !== currentLanguage) {
      setLanguage(settingsLanguage);
    }
  }, [settings.language]);

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
    
    // Update app store
    updateSettings({ language });
    
    // Update RTL state
    setIsRTLEnabled(language === 'ar');
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
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};

// Higher-order component for language support
export const withLanguage = <T extends object>(Component: React.ComponentType<T>) => {
  return (props: T) => {
    const languageContext = useLanguageContext();
    return <Component {...props} {...languageContext} />;
  };
};