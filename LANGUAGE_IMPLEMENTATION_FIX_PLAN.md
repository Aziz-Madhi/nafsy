# Language Switching Implementation Fix Plan

## Overview

This document outlines the specific technical changes needed to improve the language switching implementation based on the analysis. The plan focuses on removing redundancy, improving consistency, and enhancing maintainability.

## Phase 1: Immediate Fixes

### 1. Remove Manual RTL Management from Settings

**File**: `src/app/settings.tsx`

**Current Code**:
```typescript
const handleLanguageChange = useCallback(() => {
  impactAsync(ImpactFeedbackStyle.Light);
  const nextLanguage = currentLanguage === 'en' ? 'ar' : 'en';

  // 1) Persist pending language and dedicated language key for next startup
  requestLanguageChange(nextLanguage);
  saveLanguage(nextLanguage);

  // 2) Do NOT change i18n language now to avoid text flicker before restart

  // 3) Offer restart now/later. Apply native direction only if user confirms restart
  const shouldBeRTL = isRTLLanguage(nextLanguage);
  Alert.alert(
    nextLanguage === 'ar' ? 'إعادة تشغيل مطلوبة' : 'Restart required',
    nextLanguage === 'ar'
      ? 'سيتم تطبيق تغييرات اللغة والتخطيط بعد إعادة تشغيل التطبيق.'
      : 'Language and layout changes will be applied after restarting the app.',
    [
      {
        text: nextLanguage === 'ar' ? 'أعد التشغيل الآن' : 'Restart now',
        onPress: async () => {
          try {
            // Ensure native direction flag matches the next language before restart
            if (I18nManager.isRTL !== shouldBeRTL) {
              I18nManager.allowRTL(shouldBeRTL);
              I18nManager.forceRTL(shouldBeRTL);
            }
            await Updates.reloadAsync();
          } catch {}
        },
      },
      { text: nextLanguage === 'ar' ? 'لاحقًا' : 'Later', style: 'cancel' },
    ]
  );
}, [currentLanguage, requestLanguageChange]);
```

**Fixed Code**:
```typescript
const handleLanguageChange = useCallback(() => {
  impactAsync(ImpactFeedbackStyle.Light);
  const nextLanguage = currentLanguage === 'en' ? 'ar' : 'en';

  // 1) Persist pending language and dedicated language key for next startup
  requestLanguageChange(nextLanguage);
  saveLanguage(nextLanguage);

  // 2) Offer restart now/later - RTL will be handled by bootstrap on restart
  Alert.alert(
    nextLanguage === 'ar' ? 'إعادة تشغيل مطلوبة' : 'Restart required',
    nextLanguage === 'ar'
      ? 'سيتم تطبيق تغييرات اللغة والتخطيط بعد إعادة تشغيل التطبيق.'
      : 'Language and layout changes will be applied after restarting the app.',
    [
      {
        text: nextLanguage === 'ar' ? 'أعد التشغيل الآن' : 'Restart now',
        onPress: async () => {
          try {
            await Updates.reloadAsync();
          } catch {}
        },
      },
      { text: nextLanguage === 'ar' ? 'لاحقًا' : 'Later', style: 'cancel' },
    ]
  );
}, [currentLanguage, requestLanguageChange]);
```

### 2. Remove Deprecated Methods from i18n.ts

**File**: `src/lib/i18n.ts`

**Remove the following functions**:
- `wouldChangeRTL()`
- `getRestartMessage()`

**Update the changeLanguage function comment**:
```typescript
// Helper function to change language (RTL handled by bootstrap)
export const changeLanguage = async (language: 'en' | 'ar'): Promise<void> => {
  const currentLanguage = i18n.language;

  if (currentLanguage === language) {
    return; // No change needed
  }

  console.log(
    '🎯 i18n: Runtime language change (RTL handled by rtl-bootstrap):',
    language
  );

  // Change i18next language only - RTL is handled by rtl-bootstrap.ts at app startup
  await i18n.changeLanguage(language);

  console.log(
    '🎯 i18n: Language changed, RTL requires app restart to take effect'
  );
};
```

### 3. Remove Deprecated Methods from deferred-language.ts

**File**: `src/lib/deferred-language.ts`

**Remove the entire file** as it's deprecated and no longer needed.

## Phase 2: Refactoring

### 1. Create Language Utility Module

**File**: `src/lib/language-utils.ts`

```typescript
/**
 * Language Utility Functions
 * Centralized language resolution and RTL detection
 */

import { getLocales } from 'expo-localization';

// Define supported languages
export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguagePreference = SupportedLanguage | 'system';

/**
 * Resolve language preference to actual language
 */
export const resolveLanguage = (
  languagePreference: LanguagePreference
): SupportedLanguage => {
  if (languagePreference === 'system') {
    const locales = getLocales();
    const deviceLanguage = locales[0]?.languageCode;
    return deviceLanguage && SUPPORTED_LANGUAGES.includes(deviceLanguage as SupportedLanguage)
      ? (deviceLanguage as SupportedLanguage)
      : 'en';
  }
  return languagePreference;
};

/**
 * Check if language is RTL
 */
export const isRTLLanguage = (language: string): boolean => {
  return language === 'ar';
};

/**
 * Get device locale
 */
export const getDeviceLocale = (): SupportedLanguage => {
  try {
    const locales = getLocales();
    const primaryLocale = locales[0];
    const languageCode = primaryLocale?.languageCode;

    return languageCode && SUPPORTED_LANGUAGES.includes(languageCode as SupportedLanguage)
      ? (languageCode as SupportedLanguage)
      : 'en';
  } catch {
    return 'en';
  }
};
```

### 2. Update i18n.ts to Use Language Utilities

**File**: `src/lib/i18n.ts`

**Replace language resolution logic**:
```typescript
// Remove old getDeviceLocale and getInitialLanguage functions

// Import new utilities
import { 
  resolveLanguage, 
  isRTLLanguage, 
  getDeviceLocale,
  type SupportedLanguage,
  type LanguagePreference
} from './language-utils';

// Update getInitialLanguage to use new utilities
const getInitialLanguage = (): SupportedLanguage => {
  try {
    // 0) Prefer explicit language key to keep i18n and RTL in lockstep
    const explicit = getSavedLanguage();
    if (explicit) {
      console.log('🎯 i18n: Using explicit saved language:', explicit);
      return explicit as SupportedLanguage;
    }

    // 1) Fallback to reading from persisted app store
    const currentStorage = getCurrentStorage();
    console.log('🎯 i18n: Reading from unified storage');

    const storedSettings = currentStorage.getString('app-store');
    console.log(
      '🎯 i18n: Raw stored settings:',
      storedSettings ? 'found' : 'not found'
    );

    if (storedSettings) {
      const settings = JSON.parse(storedSettings);
      console.log('🎯 i18n: Parsed settings structure:', {
        hasPendingLanguage: !!settings?.state?.pendingLanguage,
        hasLanguagePreference: !!settings?.state?.settings?.language,
        currentLanguage: settings?.state?.currentLanguage,
      });

      // CRITICAL: Check for pendingLanguage FIRST - this is set when user requested a language change
      const pendingLanguage = settings?.state?.pendingLanguage;
      if (pendingLanguage && SUPPORTED_LANGUAGES.includes(pendingLanguage)) {
        console.log('🎯 i18n: Found pending language change:', pendingLanguage);
        return pendingLanguage as SupportedLanguage;
      }

      // If no pending language, check regular preference
      const languagePreference =
        settings?.state?.settings?.language || 'system';
      console.log(
        '🎯 i18n: No pending language, using preference:',
        languagePreference
      );

      if (languagePreference === 'system') {
        const deviceLocale = getDeviceLocale();
        console.log('🎯 i18n: Using device locale:', deviceLocale);
        return deviceLocale;
      }
      if (SUPPORTED_LANGUAGES.includes(languagePreference as SupportedLanguage)) {
        console.log('🎯 i18n: Using stored preference:', languagePreference);
        return languagePreference as SupportedLanguage;
      }
    } else {
      console.log('🎯 i18n: No stored settings found in unified storage');
    }
  } catch (error) {
    console.warn('🎯 i18n: Failed to read stored language preference:', error);
  }

  // Fallback to device locale
  const fallbackLocale = getDeviceLocale();
  console.log('🎯 i18n: Using fallback device locale:', fallbackLocale);
  return fallbackLocale;
};
```

### 3. Update RTL Bootstrap to Use Language Utilities

**File**: `src/lib/rtl-bootstrap.ts`

**Replace language resolution logic**:
```typescript
// Import new utilities
import { 
  resolveLanguage, 
  isRTLLanguage, 
  getDeviceLocale,
  type SupportedLanguage
} from './language-utils';

// Remove old helper functions and replace with imports

// Update getStoredLanguageForRTL to use new utilities
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
      if (pendingLanguage && SUPPORTED_LANGUAGES.includes(pendingLanguage)) {
        console.log(
          '🚀 RTL Bootstrap: Found pending language:',
          pendingLanguage
        );
        return pendingLanguage as SupportedLanguage;
      }

      // Check stored language preference
      const languagePreference = settings?.state?.settings?.language || 'system';
      if (languagePreference === 'system') {
        const deviceLocale = getDeviceLocale();
        console.log('🚀 RTL Bootstrap: Using system language:', deviceLocale);
        return deviceLocale;
      }
      if (SUPPORTED_LANGUAGES.includes(languagePreference as SupportedLanguage)) {
        console.log('🚀 RTL Bootstrap: Using stored language:', languagePreference);
        return languagePreference as SupportedLanguage;
      }
    }
  } catch (error) {
    console.warn('🚀 RTL Bootstrap: Failed to read language preference:', error);
  }
  
  // Fallback to system or English
  const fallback = getDeviceLocale();
  console.log('🚀 RTL Bootstrap: Using fallback language:', fallback);
  return fallback;
};
```

### 4. Update App Store to Use Language Utilities

**File**: `src/store/useAppStore.ts`

**Replace language resolution logic**:
```typescript
// Import new utilities
import { 
  resolveLanguage, 
  isRTLLanguage,
  type SupportedLanguage,
  type LanguagePreference
} from '~/lib/language-utils';

// Remove old resolveCurrentLanguage function

// Update resolveCurrentTheme function (keep as is)
const resolveCurrentTheme = (
  themePreference: 'light' | 'dark' | 'system'
): 'light' | 'dark' => {
  if (themePreference === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return themePreference;
};

// Update the updateSettings function
updateSettings: (newSettings: Partial<AppSettings>) => {
  const currentSettings = get().settings;
  const updatedSettings = { ...currentSettings, ...newSettings };

  let stateUpdate: any = { settings: updatedSettings };

  // Handle theme updates
  if (newSettings.theme && newSettings.theme !== currentSettings.theme) {
    const newTheme = resolveCurrentTheme(newSettings.theme);
    const isSystemTheme = newSettings.theme === 'system';

    stateUpdate.currentTheme = newTheme;
    stateUpdate.isSystemTheme = isSystemTheme;
  }

  // Handle language updates
  if (
    newSettings.language &&
    newSettings.language !== currentSettings.language
  ) {
    const newLanguage = resolveLanguage(newSettings.language);
    const isSystemLanguage = newSettings.language === 'system';
    const isRTL = isRTLLanguage(newLanguage);

    stateUpdate.currentLanguage = newLanguage;
    stateUpdate.isSystemLanguage = isSystemLanguage;
    stateUpdate.isRTL = isRTL;

    // DO NOT apply language change immediately - this should only be for preference storage
    // Language changes that need immediate effect should use changeLanguage() directly
    console.warn(
      'updateSettings changed language preference but did not apply it immediately. Use changeLanguage() for immediate effect.'
    );
  }

  set(stateUpdate);
},

// Update applySystemLanguage function
applySystemLanguage: () => {
  const { settings } = get();
  if (settings.language === 'system') {
    const systemLanguage = resolveLanguage('system');
    const isRTL = isRTLLanguage(systemLanguage);

    set({
      currentLanguage: systemLanguage,
      isRTL,
    });

    changeLanguage(systemLanguage).catch(console.error);
  }
},

// Update reset function to use deferred system
reset: () => {
  const resetLanguage = resolveLanguage(defaultSettings.language);

  set({
    activeTab: 'mood',
    currentTheme: resolveCurrentTheme(defaultSettings.theme),
    currentLanguage: resetLanguage,
    isSystemTheme: defaultSettings.theme === 'system',
    isSystemLanguage: defaultSettings.language === 'system',
    isRTL: isRTLLanguage(resetLanguage),
    isLoading: false,
    error: null,
    pendingLanguage: null,
    languageChangeRequested: false,
    settings: defaultSettings,
  });

  // Note: Language change is handled by RTL bootstrap on app restart
},
```

## Phase 3: Documentation

### 1. Update README with Language Implementation Details

Add a section to your README about the language switching system:

```markdown
## Language Switching

The app implements a deferred language switching system with proper RTL support:

1. **RTL Bootstrap**: Early initialization of RTL layout during app startup
2. **Deferred Changes**: Language changes are deferred until app restart to prevent UI flickering
3. **Persistent Storage**: Language preferences are stored using MMKV for fast access
4. **Consistent State**: All components use the same language and RTL state from the app store

### How to Implement Language Switching in Components

To implement language switching in a component:

1. Use `useAppStore.getState().requestLanguageChange(language)` to request a language change
2. Use `saveLanguage(language)` to persist the language preference
3. Show a restart prompt to the user
4. Call `Updates.reloadAsync()` when user confirms restart

### RTL Handling

RTL layout is automatically handled during app initialization. Do not manually change RTL settings in components as this can conflict with the bootstrap system.
```

### 2. Create Example Component for Language Switching

**File**: `src/components/LanguageSwitcherExample.tsx`

```typescript
import React, { useCallback } from 'react';
import { Pressable, Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { Text } from '~/components/ui/text';
import { useAppStore } from '~/store/useAppStore';
import { saveLanguage } from '~/lib/mmkv-storage';
import { isRTLLanguage } from '~/lib/language-utils';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

export const LanguageSwitcherExample = () => {
  const currentLanguage = useAppStore((state) => state.currentLanguage);
  const requestLanguageChange = useAppStore((state) => state.requestLanguageChange);

  const handleLanguageChange = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    const nextLanguage = currentLanguage === 'en' ? 'ar' : 'en';

    // 1) Persist pending language and dedicated language key for next startup
    requestLanguageChange(nextLanguage);
    saveLanguage(nextLanguage);

    // 2) Offer restart now/later - RTL will be handled by bootstrap on restart
    Alert.alert(
      nextLanguage === 'ar' ? 'إعادة تشغيل مطلوبة' : 'Restart required',
      nextLanguage === 'ar'
        ? 'سيتم تطبيق تغييرات اللغة والتخطيط بعد إعادة تشغيل التطبيق.'
        : 'Language and layout changes will be applied after restarting the app.',
      [
        {
          text: nextLanguage === 'ar' ? 'أعد التشغيل الآن' : 'Restart now',
          onPress: async () => {
            try {
              await Updates.reloadAsync();
            } catch {}
          },
        },
        { text: nextLanguage === 'ar' ? 'لاحقًا' : 'Later', style: 'cancel' },
      ]
    );
  }, [currentLanguage, requestLanguageChange]);

  return (
    <Pressable onPress={handleLanguageChange}>
      <Text>
        Switch to {currentLanguage === 'en' ? 'Arabic' : 'English'}
      </Text>
    </Pressable>
  );
};
```

## Testing Plan

1. **Unit Tests**: Create tests for language utility functions
2. **Integration Tests**: Test language switching workflow
3. **RTL Tests**: Verify RTL layout changes work correctly
4. **Edge Cases**: Test language switching with app restarts

## Rollout Strategy

1. **Development**: Implement changes in development branch
2. **Testing**: Test thoroughly with both English and Arabic
3. **Staging**: Deploy to staging environment for QA
4. **Production**: Release with clear communication about restart requirements

## Monitoring

1. **Crash Reports**: Monitor for any RTL-related crashes
2. **User Feedback**: Collect feedback on language switching experience
3. **Analytics**: Track language switching usage patterns