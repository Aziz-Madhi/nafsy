# Install NativewindUI

[Create Expo Stack](https://nativewindui.com/installation)[Manual Installation

](https://nativewindui.com/installation/manual)

**Note:** These docs do not currently support React Navigation, only Expo Router. These docs also assume that you have already installed Expo Router.

**On this page**[1. Install the NativewindUI dependencies](https://nativewindui.com/installation/manual#deps)[2. Setup TailwindCSS](https://nativewindui.com/installation/manual#tw)[3. Add the Babel preset](https://nativewindui.com/installation/manual#babel)[4. Configure Metro](https://nativewindui.com/installation/manual#metro)[5. Use TypeScript](https://nativewindui.com/installation/manual#ts)[6. Add the NativewindUI theme and colors](https://nativewindui.com/installation/manual#theme)[7. Import NativewindUI](https://nativewindui.com/installation/manual#import)[8. Usage Example](https://nativewindui.com/installation/manual#usage)[9. Build and run your project](https://nativewindui.com/installation/manual#build)

## 1. Install the NativewindUI dependencies

Run the following command in the root of your Expo project to install the NativewindUI dependencies:

```bash
npx expo install nativewind react-native-reanimated tailwindcss@^3.4.0 prettier-plugin-tailwindcss @roninoss/icons @shopify/flash-list class-variance-authority clsx expo-dev-client tailwind-merge expo-navigation-bar
```

## 2. Setup Tailwind CSS

Run 

```bash
npx tailwindcss init
```

in the root of your Expo project to create a 

```bash
tailwind.config.js
```

.

Make sure to update the

```bash
content
```

 array with the file paths of any pre-existing components in your project styled with Nativewind. As seen below, add the NativewindUI theme to your

```bash
tailwind.config.js
```

.

tailwind.config.js

DownloadCopy

Expand

```javascript
const { hairlineWidth, platformSelect } = require('nativewind/theme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: withOpacity('border'),
        input: withOpacity('input'),
        ring: withOpacity('ring'),
        background: withOpacity('background'),
        foreground: withOpacity('foreground'),
        primary: {
          DEFAULT: withOpacity('primary'),
          foreground: withOpacity('primary-foreground'),
        },
        secondary: {
          DEFAULT: withOpacity('secondary'),
          foreground: withOpacity('secondary-foreground'),
        },
        destructive: {
          DEFAULT: withOpacity('destructive'),
          foreground: withOpacity('destructive-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('muted'),
          foreground: withOpacity('muted-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('accent'),
          foreground: withOpacity('accent-foreground'),
        },
        popover: {
          DEFAULT: withOpacity('popover'),
          foreground: withOpacity('popover-foreground'),
        },
        card: {
          DEFAULT: withOpacity('card'),
          foreground: withOpacity('card-foreground'),
        },
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return platformSelect({
        ios: `rgb(var(--${variableName}) / ${opacityValue})`,
        android: `rgb(var(--android-${variableName}) / ${opacityValue})`,
      });
    }
    return platformSelect({
      ios: `rgb(var(--${variableName}))`,
      android: `rgb(var(--android-${variableName}))`,
    });
  };
}
```

Create a

```bash
global.css
```

file in the root of your Expo project. This file will include the Tailwind directives as well as the color configurations for light and dark modes.

global.css

DownloadCopy

Expand

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 242 242 247;
    --foreground: 0 0 0;
    --card: 255 255 255;
    --card-foreground: 8 28 30;
    --popover: 230 230 235;
    --popover-foreground: 0 0 0;
    --primary: 0 123 254;
    --primary-foreground: 255 255 255;
    --secondary: 45 175 231;
    --secondary-foreground: 255 255 255;
    --muted: 175 176 180;
    --muted-foreground: 142 142 147;
    --accent: 255 40 84;
    --accent-foreground: 255 255 255;
    --destructive: 255 56 43;
    --destructive-foreground: 255 255 255;
    --border: 230 230 235;
    --input: 210 210 215;
    --ring: 230 230 235;

    --android-background: 249 249 255;
    --android-foreground: 0 0 0;
    --android-card: 255 255 255;
    --android-card-foreground: 24 28 35;
    --android-popover: 215 217 228;
    --android-popover-foreground: 0 0 0;
    --android-primary: 0 112 233;
    --android-primary-foreground: 255 255 255;
    --android-secondary: 176 201 255;
    --android-secondary-foreground: 20 55 108;
    --android-muted: 193 198 215;
    --android-muted-foreground: 65 71 84;
    --android-accent: 169 73 204;
    --android-accent-foreground: 255 255 255;
    --android-destructive: 186 26 26;
    --android-destructive-foreground: 255 255 255;
    --android-border: 215 217 228;
    --android-input: 210 210 215;
    --android-ring: 215 217 228;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --background: 0 0 0;
      --foreground: 255 255 255;
      --card: 21 21 24;
      --card-foreground: 255 255 255;
      --popover: 40 40 42;
      --popover-foreground: 255 255 255;
      --primary: 3 133 255;
      --primary-foreground: 255 255 255;
      --secondary: 100 211 254;
      --secondary-foreground: 255 255 255;
      --muted: 70 70 73;
      --muted-foreground: 142 142 147;
      --accent: 255 52 95;
      --accent-foreground: 255 255 255;
      --destructive: 254 67 54;
      --destructive-foreground: 255 255 255;
      --border: 40 40 42;
      --input: 55 55 57;
      --ring: 40 40 42;

      --android-background: 0 0 0;
      --android-foreground: 255 255 255;
      --android-card: 16 19 27;
      --android-card-foreground: 224 226 237;
      --android-popover: 39 42 50;
      --android-popover-foreground: 224 226 237;
      --android-primary: 3 133 255;
      --android-primary-foreground: 255 255 255;
      --android-secondary: 28 60 114;
      --android-secondary-foreground: 189 209 255;
      --android-muted: 216 226 255;
      --android-muted-foreground: 139 144 160;
      --android-accent: 83 0 111;
      --android-accent-foreground: 238 177 255;
      --android-destructive: 147 0 10;
      --android-destructive-foreground: 255 255 255;
      --android-border: 39 42 50;
      --android-input: 55 55 57;
      --android-ring: 39 42 50;
    }
  }
}
```

## 3. Add the Babel preset

Configure babel to support Nativewind via the relevant presets.

babel.config.js

DownloadCopy

Expand

```javascript
module.exports = function (api) {
  api.cache(true);
  const plugins = [];

  plugins.push('react-native-reanimated/plugin');

  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins,
  };
};
```

## 4. Configure Metro

If your Expo project does not have a

```bash
metro.config.js
```

in the project root, run the following command:

```bash
npx expo customize metro.config.js
```

For those using Expo SDK 50+, your config should look like this:

metro.config.js

DownloadCopy

Expand

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: './global.css',
  inlineRem: 16,
});
```

## 5. Use TypeScript

Add

```bash
nativewind-env.d.ts
```

to the root of your project to satisfy the Typescript gods

nativewind-env.d.ts

DownloadCopy

Expand

```typescript
/// <reference types="nativewind/types" />
```

Additionally, ensure you have

```bash
expo-env.d.ts
```

in the root of your project and make sure toadd it to your 

```bash
.gitignore
```

.

expo-env.d.ts

DownloadCopy

Expand

```typescript
/// <reference types="expo/types" />

// NOTE: This file should not be edited and should be in your git ignore
```

## 6. Add the NativewindUI theme and colors

Add a

```bash
lib
```

folder to the root of your project to make it easy to access our colors.

Now, add the following files to said folder:

~/lib/useColorScheme.tsx

DownloadCopy

Expand

```typescript
import * as NavigationBar from 'expo-navigation-bar';
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import * as React from 'react';
import { Platform } from 'react-native';

import { COLORS } from '~/theme/colors';

function useColorScheme() {
  const { colorScheme, setColorScheme: setNativewindColorScheme } =
    useNativewindColorScheme();

  async function setColorScheme(colorScheme: 'light' | 'dark') {
    setNativewindColorScheme(colorScheme);
    if (Platform.OS !== 'android') return;
    try {
      await setNavigationBar(colorScheme);
    } catch (error) {
      console.error('useColorScheme.tsx", "setColorScheme', error);
    }
  }

  function toggleColorScheme() {
    return setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
  }

  return {
    colorScheme: colorScheme ?? 'light',
    isDarkColorScheme: colorScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
    colors: COLORS[colorScheme ?? 'light'],
  };
}

/**
 * Set the Android navigation bar color based on the color scheme.
 */
function useInitialAndroidBarSync() {
  const { colorScheme } = useColorScheme();
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;
    setNavigationBar(colorScheme).catch((error) => {
      console.error('useColorScheme.tsx", "useInitialColorScheme', error);
    });
  }, []);
}

export { useColorScheme, useInitialAndroidBarSync };

function setNavigationBar(colorScheme: 'light' | 'dark') {
  return Promise.all([
    NavigationBar.setButtonStyleAsync(
      colorScheme === 'dark' ? 'light' : 'dark'
    ),
    NavigationBar.setPositionAsync('absolute'),
    NavigationBar.setBackgroundColorAsync(
      colorScheme === 'dark' ? '#00000030' : '#ffffff80'
    ),
  ]);
}
```

**Important:** The **useInitialAndroidBarSync** hook needs to be called in the root **\_layout.tsx**.

~/lib/cn.ts

DownloadCopy

Expand

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Add a 

```bash
theme
```

 folder in the project root to make it easy to access our theme configurations. Add the following files to said folder:

~/theme/colors.ts

DownloadCopy

Expand

```typescript
import { Platform } from 'react-native';

const IOS_SYSTEM_COLORS = {
  white: 'rgb(255, 255, 255)',
  black: 'rgb(0, 0, 0)',
  light: {
    grey6: 'rgb(242, 242, 247)',
    grey5: 'rgb(230, 230, 235)',
    grey4: 'rgb(210, 210, 215)',
    grey3: 'rgb(199, 199, 204)',
    grey2: 'rgb(175, 176, 180)',
    grey: 'rgb(142, 142, 147)',
    background: 'rgb(242, 242, 247)',
    foreground: 'rgb(0, 0, 0)',
    root: 'rgb(255, 255, 255)',
    card: 'rgb(255, 255, 255)',
    destructive: 'rgb(255, 56, 43)',
    primary: 'rgb(0, 123, 254)',
  },
  dark: {
    grey6: 'rgb(21, 21, 24)',
    grey5: 'rgb(40, 40, 42)',
    grey4: 'rgb(55, 55, 57)',
    grey3: 'rgb(70, 70, 73)',
    grey2: 'rgb(99, 99, 102)',
    grey: 'rgb(142, 142, 147)',
    background: 'rgb(0, 0, 0)',
    foreground: 'rgb(255, 255, 255)',
    root: 'rgb(0, 0, 0)',
    card: 'rgb(21, 21, 24)',
    destructive: 'rgb(254, 67, 54)',
    primary: 'rgb(3, 133, 255)',
  },
} as const;

const ANDROID_COLORS = {
  white: 'rgb(255, 255, 255)',
  black: 'rgb(0, 0, 0)',
  light: {
    grey6: 'rgb(249, 249, 255)',
    grey5: 'rgb(215, 217, 228)',
    grey4: 'rgb(193, 198, 215)',
    grey3: 'rgb(113, 119, 134)',
    grey2: 'rgb(65, 71, 84)',
    grey: 'rgb(24, 28, 35)',
    background: 'rgb(249, 249, 255)',
    foreground: 'rgb(0, 0, 0)',
    root: 'rgb(255, 255, 255)',
    card: 'rgb(255, 255, 255)',
    destructive: 'rgb(186, 26, 26)',
    primary: 'rgb(0, 112, 233)',
  },
  dark: {
    grey6: 'rgb(16, 19, 27)',
    grey5: 'rgb(39, 42, 50)',
    grey4: 'rgb(49, 53, 61)',
    grey3: 'rgb(54, 57, 66)',
    grey2: 'rgb(139, 144, 160)',
    grey: 'rgb(193, 198, 215)',
    background: 'rgb(0, 0, 0)',
    foreground: 'rgb(255, 255, 255)',
    root: 'rgb(0, 0, 0)',
    card: 'rgb(16, 19, 27)',
    destructive: 'rgb(147, 0, 10)',
    primary: 'rgb(3, 133, 255)',
  },
} as const;

const COLORS = Platform.OS === 'ios' ? IOS_SYSTEM_COLORS : ANDROID_COLORS;

export { COLORS };
```

~/theme/index.ts

DownloadCopy

Expand

```typescript
import { DefaultTheme, DarkTheme } from '@react-navigation/native';

import { COLORS } from './colors';

const NAV_THEME = {
  light: {
    ...DefaultTheme,
    colors: {
      background: COLORS.light.background,
      border: COLORS.light.grey5,
      card: COLORS.light.card,
      notification: COLORS.light.destructive,
      primary: COLORS.light.primary,
      text: COLORS.black,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: COLORS.dark.background,
      border: COLORS.dark.grey5,
      card: COLORS.dark.grey6,
      notification: COLORS.dark.destructive,
      primary: COLORS.dark.primary,
      text: COLORS.white,
    },
  },
};

export { NAV_THEME };
```

Lastly, add a 

```bash
components/nativewindui
```

 folder in the project root, this is where our components will live:

~/components/nativewindui/Text.tsx

DownloadCopy

Expand

```typescript
import { VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText } from 'react-native';

import { cn } from '~/lib/cn';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      largeTitle: 'text-4xl',
      title1: 'text-2xl',
      title2: 'text-[22px] leading-7',
      title3: 'text-xl',
      heading: 'text-[17px] leading-6 font-semibold',
      body: 'text-[17px] leading-6',
      callout: 'text-base',
      subhead: 'text-[15px] leading-6',
      footnote: 'text-[13px] leading-5',
      caption1: 'text-xs',
      caption2: 'text-[11px] leading-4',
    },
    color: {
      primary: '',
      secondary: 'text-secondary-foreground/90',
      tertiary: 'text-muted-foreground/90',
      quarternary: 'text-muted-foreground/50',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'primary',
  },
});

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  variant,
  color,
  ...props
}: React.ComponentPropsWithoutRef<typeof RNText> & VariantProps<typeof textVariants>) {
  const textClassName = React.useContext(TextClassContext);
  return (
    <RNText className={cn(textVariants({ variant, color }), textClassName, className)} {...props} />
  );
}

export { Text, TextClassContext, textVariants };
```

~/components/nativewindui/ThemeToggle.tsx

DownloadCopy

Expand

```typescript
import { Icon } from '@roninoss/icons';
import { Pressable, View } from 'react-native';
import Animated, { LayoutAnimationConfig, ZoomInRotate } from 'react-native-reanimated';

import { cn } from '~/lib/cn';
import { useColorScheme } from '~/lib/useColorScheme';
import { COLORS } from '~/theme/colors';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  return (
    <LayoutAnimationConfig skipEntering>
      <Animated.View
        className="items-center justify-center"
        key={"toggle-" + colorScheme}
        entering={ZoomInRotate}>
        <Pressable
          onPress={() => {
            setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
          }}
          className="opacity-80">
          {colorScheme === 'dark'
            ? ({ pressed }) => (
                <View className={cn('px-0.5', pressed && 'opacity-50')}>
                  <Icon namingScheme="sfSymbol" name="moon.stars" color={COLORS.white} />
                </View>
              )
            : ({ pressed }) => (
                <View className={cn('px-0.5', pressed && 'opacity-50')}>
                  <Icon namingScheme="sfSymbol" name="sun.min" color={COLORS.black} />
                </View>
              )}
        </Pressable>
      </Animated.View>
    </LayoutAnimationConfig>
  );
}
```

## 7. Import NativewindUI

Wrap your root navigation stack in

```html
<NavThemeProvider></NavThemeProvider>
```

:

~/app/\_layout.tsx

DownloadCopy

Expand

```typescript
import '../global.css';
import 'expo-dev-client';
{YOUR_OTHER_IMPORTS}
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as NavThemeProvider } from '@react-navigation/native';

import { useColorScheme, useInitialAndroidBarSync } from '~/lib/useColorScheme';
import { NAV_THEME } from '~/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  useInitialAndroidBarSync();
  const { colorScheme, isDarkColorScheme } = useColorScheme();

  return (
    <>
      <StatusBar
        key={`root-status-bar-${isDarkColorScheme ? 'light' : 'dark'}`}
        style={isDarkColorScheme ? 'light' : 'dark'}
      />

      <NavThemeProvider value={NAV_THEME[colorScheme]}>
        {YOUR_ROOT_NAVIGATOR}
      </NavThemeProvider>
    </>
  );
}
```

Make sure to replace all instances of

```bash
import { Text } from 'react-native';
```

, throughout your project, with

```typescript
import { Text } from '~/components/nativewindui/Text';
```

.

## 8. Usage Example

Here is an example

```bash
index.tsx
```

that uses NativewindUI:

~/app/index.tsx

DownloadCopy

Expand

```typescript
import { useHeaderHeight } from '@react-navigation/elements';
import { Icon } from '@roninoss/icons';
import { FlashList } from '@shopify/flash-list';
import { cssInterop } from 'nativewind';
import * as React from 'react';
import {
  Linking,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '~/components/nativewindui/Text';
import { useColorScheme } from '~/lib/useColorScheme';

cssInterop(FlashList, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

export default function Screen() {
  return (
    <FlashList
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      data={COMPONENTS}
      estimatedItemSize={200}
      contentContainerClassName="py-4"
      keyExtractor={keyExtractor}
      ItemSeparatorComponent={renderItemSeparator}
      renderItem={renderItem}
      ListEmptyComponent={COMPONENTS.length === 0 ? ListEmptyComponent : undefined}
    />
  );
}

function ListEmptyComponent() {
  const insets = useSafeAreaInsets();
  const dimensions = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const { colors } = useColorScheme();
  const height = dimensions.height - headerHeight - insets.bottom - insets.top;

  return (
    <View style={{ height }} className="flex-1 items-center justify-center gap-1 px-12">
      <Icon name="file-plus-outline" size={42} color={colors.grey} />
      <Text variant="title3" className="pb-1 text-center font-semibold">
        No Components Installed
      </Text>
      <Text color="tertiary" variant="subhead" className="pb-4 text-center">
        You can install any of the free components from the{' '}
        <Text
          onPress={() => Linking.openURL('https://nativewindui.com')}
          variant="subhead"
          className="text-primary">
          NativewindUI
        </Text>
        {' website.'}
      </Text>
    </View>
  );
}

type ComponentItem = { name: string; component: React.FC };

function keyExtractor(item: ComponentItem) {
  return item.name;
}

function renderItemSeparator() {
  return <View className="p-2" />;
}

function renderItem({ item }: { item: ComponentItem }) {
  return (
    <Card title={item.name}>
      <item.component />
    </Card>
  );
}

function Card({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View className="px-4">
      <View className="gap-4 rounded-xl border border-border bg-card p-4 pb-6 shadow-sm shadow-black/10 dark:shadow-none">
        <Text className="text-center text-sm font-medium tracking-wider opacity-60">{title}</Text>
        {children}
      </View>
    </View>
  );
}

const COMPONENTS: ComponentItem[] = [];
```

# React Native Reusables

1. Follow the installation guide for NativeWind from the [official documentation](https://www.nativewind.dev/getting-started/expo-router)

2. Install the following packages:

- [Universal](https://www.reactnativereusables.com/getting-started/initial-setup/#tab-panel-69) 
- [Native only](https://www.reactnativereusables.com/getting-started/initial-setup/#tab-panel-70) 

**Platforms:** iOS and Android

Terminal window

```
npx expo install class-variance-authority clsx tailwind-merge
```

3. Configure path aliases

We use the `~` alias. This is how you can configure it in your `tsconfig.json` file:

```
{  "compilerOptions": {    "baseUrl": ".",    "paths": {      "~/*": ["*"]    }  }}
```

4. Add a cn helper

Add the following code to the `~/lib/utils.ts` file:

```
import { clsx, type ClassValue } from 'clsx';import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) {  return twMerge(clsx(inputs));}
```

5. Add the useColorScheme hook

Add the following code to the `~/lib/useColorScheme.tsx` file:

```
import { useColorScheme as useNativewindColorScheme } from 'nativewind';
export function useColorScheme() {  const { colorScheme, setColorScheme, toggleColorScheme } = useNativewindColorScheme();  return {    colorScheme: colorScheme ?? 'dark',    isDarkColorScheme: colorScheme === 'dark',    setColorScheme,    toggleColorScheme,  };}
```

6. Add the following css variables to `~/global.css` file.

~/global.css

```
@tailwind base;  @tailwind components;  @tailwind utilities;
  @layer base {      :root {        --background: 0 0% 100%;        --foreground: 240 10% 3.9%;        --card: 0 0% 100%;        --card-foreground: 240 10% 3.9%;        --popover: 0 0% 100%;        --popover-foreground: 240 10% 3.9%;        --primary: 240 5.9% 10%;        --primary-foreground: 0 0% 98%;        --secondary: 240 4.8% 95.9%;        --secondary-foreground: 240 5.9% 10%;        --muted: 240 4.8% 95.9%;        --muted-foreground: 240 3.8% 46.1%;        --accent: 240 4.8% 95.9%;        --accent-foreground: 240 5.9% 10%;        --destructive: 0 84.2% 60.2%;        --destructive-foreground: 0 0% 98%;        --border: 240 5.9% 90%;        --input: 240 5.9% 90%;        --ring: 240 5.9% 10%;      }
      .dark:root {        --background: 240 10% 3.9%;        --foreground: 0 0% 98%;        --card: 240 10% 3.9%;        --card-foreground: 0 0% 98%;        --popover: 240 10% 3.9%;        --popover-foreground: 0 0% 98%;        --primary: 0 0% 98%;        --primary-foreground: 240 5.9% 10%;        --secondary: 240 3.7% 15.9%;        --secondary-foreground: 0 0% 98%;        --muted: 240 3.7% 15.9%;        --muted-foreground: 240 5% 64.9%;        --accent: 240 3.7% 15.9%;        --accent-foreground: 0 0% 98%;        --destructive: 0 72% 51%;        --destructive-foreground: 0 0% 98%;        --border: 240 3.7% 15.9%;        --input: 240 3.7% 15.9%;        --ring: 240 4.9% 83.9%;      }  }
```

Collapse

Tip 

If you want inspiration for your own colors, check out:

[

ui by jln.dev/

](https://ui.jln.dev/)

or

[

themes by ui/shadcn

](https://ui.shadcn.com/themes)

Note 

When customizing, make sure to use `.dark:root` or `@media (prefers-color-scheme: dark)` for the dark mode css selector.

7. Add the following code in the `~/lib/constants.ts` file for the navigation theme colors:

~/lib/constants.ts

```
export const NAV_THEME = {    light: {      background: 'hsl(0 0% 100%)', // background      border: 'hsl(240 5.9% 90%)', // border      card: 'hsl(0 0% 100%)', // card      notification: 'hsl(0 84.2% 60.2%)', // destructive      primary: 'hsl(240 5.9% 10%)', // primary      text: 'hsl(240 10% 3.9%)', // foreground    },    dark: {      background: 'hsl(240 10% 3.9%)', // background      border: 'hsl(240 3.7% 15.9%)', // border      card: 'hsl(240 10% 3.9%)', // card      notification: 'hsl(0 72% 51%)', // destructive      primary: 'hsl(0 0% 98%)', // primary      text: 'hsl(0 0% 98%)', // foreground    },  };
```

Collapse

If you changed the colors in the `~/global.css` file, update the `~/lib/constants.ts` file with the new colors. Each color has a commented css variable name next to it.

8. Use the CSS variables in your tailwind.config.js file.

- [Universal](https://www.reactnativereusables.com/getting-started/initial-setup/#tab-panel-71) 
- [Native only](https://www.reactnativereusables.com/getting-started/initial-setup/#tab-panel-72) 

**Platforms:** iOS and Android

tailwind.config.js

```
const { hairlineWidth } = require('nativewind/theme');
/** @type {import('tailwindcss').Config} */module.exports = {  darkMode: 'class',  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],  presets: [require('nativewind/preset')],  theme: {    extend: {      colors: {        border: 'hsl(var(--border))',        input: 'hsl(var(--input))',        ring: 'hsl(var(--ring))',        background: 'hsl(var(--background))',        foreground: 'hsl(var(--foreground))',        primary: {          DEFAULT: 'hsl(var(--primary))',          foreground: 'hsl(var(--primary-foreground))',        },        secondary: {          DEFAULT: 'hsl(var(--secondary))',          foreground: 'hsl(var(--secondary-foreground))',        },        destructive: {          DEFAULT: 'hsl(var(--destructive))',          foreground: 'hsl(var(--destructive-foreground))',        },        muted: {          DEFAULT: 'hsl(var(--muted))',          foreground: 'hsl(var(--muted-foreground))',        },        accent: {          DEFAULT: 'hsl(var(--accent))',          foreground: 'hsl(var(--accent-foreground))',        },        popover: {          DEFAULT: 'hsl(var(--popover))',          foreground: 'hsl(var(--popover-foreground))',        },        card: {          DEFAULT: 'hsl(var(--card))',          foreground: 'hsl(var(--card-foreground))',        },      },      borderWidth: {        hairline: hairlineWidth(),      },    },  },  plugins: [],};
```

Collapse

9. Configure React Navigation Theme

In your root component (ex: the root `_layout.tsx` if you’re using expo-router), add the following code to load the selected theme, prevent the flash of the default theme, and store the selected theme in the async storage.

\_layout.tsx

```
import '~/global.css';
  import { Theme, ThemeProvider, DefaultTheme, DarkTheme } from '@react-navigation/native';  import { Stack } from 'expo-router';  import { StatusBar } from 'expo-status-bar';  import * as React from 'react';  import { Platform } from 'react-native';  import { NAV_THEME } from '~/lib/constants';  import { useColorScheme } from '~/lib/useColorScheme';
  const LIGHT_THEME: Theme = {    ...DefaultTheme,    colors: NAV_THEME.light,  };  const DARK_THEME: Theme = {    ...DarkTheme,    colors: NAV_THEME.dark,  };
  export {  // Catch any errors thrown by the Layout component.  ErrorBoundary,  } from 'expo-router';
  export default function RootLayout() {    const hasMounted = React.useRef(false);    const { colorScheme, isDarkColorScheme } = useColorScheme();    const [isColorSchemeLoaded, setIsColorSchemeLoaded] = React.useState(false);
    useIsomorphicLayoutEffect(() => {      if (hasMounted.current) {        return;      }
      if (Platform.OS === 'web') {        // Adds the background color to the html element to prevent white background on overscroll.        document.documentElement.classList.add('bg-background');      }      setIsColorSchemeLoaded(true);      hasMounted.current = true;    }, []);
    if (!isColorSchemeLoaded) {      return null;    }
    return (      <ThemeProvider value={isDarkColorScheme ? DARK_THEME : LIGHT_THEME}>        <StatusBar style={isDarkColorScheme ? 'light' : 'dark'} />        <Stack />      </ThemeProvider>    );  }
  const useIsomorphicLayoutEffect =    Platform.OS === 'web' && typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;
```

Collapse

10. Add the `<ToggleTheme/>` icons

Follow the next step and add the `<Sun/>` and `<MoonStar/>` icons from the examples.
