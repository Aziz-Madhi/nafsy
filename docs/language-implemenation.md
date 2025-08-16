### **Project: Bilingual App Implementation (EN/AR)**

**Objective:** To integrate a seamless language switching mechanism between English (LTR) and Arabic (RTL), ensuring all text is translated and UI layouts adapt correctly using NativeWind and TypeScript.

---

### **Phase 0: Project Setup & Style Audit**

This preparatory phase ensures your project is ready and that you have a clear picture of the required style changes.

- **Step 0.1: Verify Dependencies**
  Ensure you have the core libraries installed. Open your terminal and run:

  ```bash
  npx expo install i18next react-i18next expo-localization
  ```

- **Step 0.2: Establish File Structure**
  Organize your project to keep the internationalization (i18n) logic clean and maintainable. Create the following structure inside your `/src` folder:

  ```
  /src
  |-- /components
  |-- /translations
  |   |-- index.ts        // i18next configuration
  |   |-- en.json         // Your existing English translations
  |   |-- ar.json         // Your existing Arabic translations
  |-- /types
  |   |-- react-i18next.d.ts // TypeScript definitions for i18next
  |-- App.tsx
  ```

- **Step 0.3: [CRITICAL] Audit Existing NativeWind Styles**
  Before writing any code, you must find all direction-specific classnames in your project. Search your entire codebase for the following patterns and identify where they need to be replaced:
  - **Margins:** `ml-`, `mr-`
  - **Paddings:** `pl-`, `pr-`
  - **Positioning:** `left-`, `right-`
  - **Borders:** `border-l-`, `border-r-`
  - **Text Alignment:** `text-left`, `text-right`

  This audit is the most important step for ensuring a correct RTL layout.

---

### **Phase 1: Core I18n Service Configuration (TypeScript)**

This phase focuses on setting up the brain of your translation system.

- **Step 1.1: Configure the `i18next` Service**
  This file will initialize `i18next` and tell it about your translation files.

  **File: `src/translations/index.ts`**

  ```typescript
  import i18next from 'i18next';
  import { initReactI18next } from 'react-i18next';
  import * as Localization from 'expo-localization';

  // Import your existing translation files.
  import en from './en.json';
  import ar from './ar.json';

  // Define the resources for i18next
  export const resources = {
    en: {
      translation: en.translation,
    },
    ar: {
      translation: ar.translation,
    },
  } as const; // 'as const' helps TypeScript infer the exact keys

  i18next.use(initReactI18next).init({
    resources,
    // Detect user's device language, falling back to English
    lng: Localization.locale.slice(0, 2),
    fallbackLng: 'en',
    compatibilityJSON: 'v3', // Essential for Android compatibility
    interpolation: {
      escapeValue: false, // React already handles XSS protection
    },
  });

  export default i18next;
  ```

- **Step 1.2: Implement Type Safety for Translations**
  This step gives you autocomplete and compile-time safety for your translation keys.

  **File: `src/types/react-i18next.d.ts`**

  ```typescript
  import { resources } from '../translations';

  // This merges with the original module declaration.
  declare module 'react-i18next' {
    interface CustomTypeOptions {
      // This line makes the 't' function aware of all your keys in 'en.json'.
      resources: (typeof resources)['en'];
    }
  }
  ```

- **Step 1.3: Initialize the Service in Your App**
  The i18n service must be loaded when the app starts. Add the import statement to the very top of your main app file.

  **File: `App.tsx`**

  ```tsx
  import './src/translations'; // <-- INITIALIZE I18N SERVICE: MUST BE AT THE TOP

  // ... rest of your App.tsx imports and code
  ```

---

### **Phase 2: UI Adaptation for RTL with NativeWind**

Now, apply the findings from your audit in Phase 0.

- **Step 2.1: Refactor All Styles to Use Logical Properties**
  Go through every component you identified in the audit and replace the directional classnames with their logical counterparts.

  **Example Refactor:**

  **Before (Incorrect for RTL):**

  ```tsx
  <View className="flex-row items-center p-4 mr-4 border-l-2">
    <Text className="text-lg text-left">Profile</Text>
  </View>
  ```

  **After (Correct for LTR & RTL):**

  ```tsx
  <View className="flex-row items-center p-4 me-4 border-s-2">
    <Text className="text-lg text-start">Profile</Text>
  </View>
  ```

- **Step 2.2: Create a Reusable Pattern for Directional Icons**
  Icons like back-arrows must be flipped manually. Create a reusable component for this.

  **File: `src/components/DirectionalIcon.tsx`**

  ```tsx
  import { I18nManager, View, StyleProp, ViewStyle } from 'react-native';
  import { ReactNode } from 'react';

  interface DirectionalIconProps {
    children: ReactNode; // The icon component itself
  }

  // This component acts as a wrapper that flips its child in RTL.
  export const DirectionalIcon = ({
    children,
  }: DirectionalIconProps): React.JSX.Element => {
    const containerStyle: StyleProp<ViewStyle> = {
      transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
    };

    return <View style={containerStyle}>{children}</View>;
  };

  // --- USAGE EXAMPLE ---
  // import { ChevronRightIcon } from 'react-native-heroicons/solid';
  // <DirectionalIcon>
  //   <ChevronRightIcon color="black" />
  // </DirectionalIcon>
  ```

---

### **Phase 3: Implementation and User Control**

With the foundation laid, integrate the translation logic into your components and allow the user to switch languages.

- **Step 3.1: Translate All Text in Components**
  Replace all hardcoded strings in your app with the `t` function from the `useTranslation` hook.

  **File: `src/components/ProfileHeader.tsx`**

  ```tsx
  import { View, Text } from 'react-native';
  import { useTranslation } from 'react-i18next';

  export const ProfileHeader = (): React.JSX.Element => {
    const { t } = useTranslation();

    return (
      <View className="p-4 bg-blue-500">
        <Text className="text-white text-2xl font-bold text-start">
          {t('profile')}
        </Text>
      </View>
    );
  };
  ```

- **Step 3.2: Build the Language Switcher Component**
  This component contains the core logic for changing the language and forcing a UI reload when necessary.

  **File: `src/components/LanguageSwitcher.tsx`**

  ```tsx
  import { View, Button } from 'react-native';
  import { useTranslation } from 'react-i18next';
  import { I18nManager } from 'react-native';
  import * as Updates from 'expo-updates';

  export const LanguageSwitcher = (): React.JSX.Element => {
    const { i18n } = useTranslation();

    const changeLanguage = async (lang: 'en' | 'ar') => {
      const currentLanguage = i18n.language;
      if (currentLanguage === lang) {
        return; // Do nothing if the language is already selected
      }

      // 1. Update i18next to use the new language's strings
      await i18n.changeLanguage(lang);

      // 2. Determine if a layout direction change is required
      const isRTL = lang === 'ar';
      if (isRTL !== I18nManager.isRTL) {
        // 3. Command React Native to change the layout direction
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);

        // 4. Reload the entire app. This is a mandatory step for RTL changes.
        await Updates.reloadAsync();
      }
    };

    return (
      <View className="flex-row justify-center space-x-4 my-8">
        <Button title="English" onPress={() => changeLanguage('en')} />
        <Button title="العربية" onPress={() => changeLanguage('ar')} />
      </View>
    );
  };
  ```

---

### **Phase 4: Testing and Validation**

Thoroughly test the implementation to catch any layout or text issues.

- **Step 4.1: Test English (LTR) Mode**
  - Start the app. Ensure it defaults to English (or the device language).
  - Navigate through all screens.
  - **Checklist:**
    - Is all text displayed correctly in English?
    - Are all layouts aligned to the left?
    - Are icons pointing in the correct (LTR) direction?

- **Step 4.2: Test Arabic (RTL) Mode**
  - Use the language switcher to select "العربية".
  - The app should automatically restart.
  - Navigate through all screens again.
  - **Checklist:**
    - Is all text translated to Arabic?
    - Are all layouts mirrored? (e.g., content that was on the left is now on the right).
    - Is all text right-aligned (`text-start`)?
    - Are margins and paddings correctly flipped (`ms-4` is now `margin-right`)?
    - Are directional icons (wrapped in `<DirectionalIcon>`) now pointing left?

- **Step 4.3: Test Switching Logic**
  - Switch from Arabic back to English. The app should restart again.
  - Verify the UI returns to the correct LTR layout.
  - Press the currently active language button again. The app should **not** restart.

By following this structured plan, you will have a robust, type-safe, and maintainable internationalization system that correctly handles the complexities of RTL layouts with NativeWind.
