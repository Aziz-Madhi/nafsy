# Writing Custom Components

This guide is about writing your own components. If you are looking for a guide on how to use Nativewind with third-party components, see the third-party components guide.

Unless you are styling a custom native component, you should never have to use cssInterop or remapProps when writing your own components. These are only used when working with third-party components.
Your first component

Nativewind works by passing class names to components. This is the same pattern as Tailwind CSS, which uses utility classes to style elements.

To create a component with default styles, simply merge the className string.

function MyComponent({ className }) {
const defaultStyles = "text-black dark:text-white";
return <Text className={`${defaultStyles} ${className}`} />;
}

<MyComponent className="font-bold" />;
You can expand this pattern to create more complex components. For example, you can create a Button component with different variants.

const variantStyles = {
default: "rounded",
primary: "bg-blue-500 text-white",
secondary: "bg-white-500 text-black",
};

function MyComponent({ variant, className, ...props }) {
return (
<Text
className={`         ${variantStyles.default}
        ${variantStyles[variant]}
        ${className}
      `}
{...props }
/>
);
}
Creating your own variants can quickly become complex. We recommend using a class name management library to simplify the process.

tailwind-variants
cva
tw-classed
clsx
classnames
Merging with inline styles

Nativewind will automatically merge with inline-styles. Read more about style specificity documentation.

<Text className="text-white" style={{ color: "black" }} /> // Will be black
Handling components with multiple style props

Custom components can have multiple style props. For example, a Button component may have an outerClassName and an innerClassName.

function MyComponent({ className, textClassName }) {
return (
<View className={className}>
<Text className={textClassName}>Hello, Nativewind!</Text>
</View>
);
}

# Styling Third-Party Components

A third-party component is a component that is a dependency of your application and not a core React Native component. Nativewind works by passing the className prop to the core React Native components. Unfortunately, its not always obvious what third-party components implement this behavior without checking their source code.

This is an example of a 3rd party component that does not pass the className prop down:

// ❌ This component will not work with Nativewind
// This component is 'picking' the props.
// Any props that are not explicitly defined will not be passed down
function ThirdPartyComponent({ style }) {
return <View style={style} />;
}

// ✅ This component will work with Nativewind
function ThirdPartyComponent({ style, ...props }) {
return <View style={style} {...props} />;
}
Improving 3rd party components

If you encounter a 3rd party component 'picks' its props, you should consider submitting a pull request to modify the component so it passes all props down. Components that 'pick' their props can be very limiting, and not just for Nativewind! React Native often adds new APIs and 'picking' props prevents you from using these new features.

function ThirdPartyComponent({ style }) {
return <View style={style} />;
}

// aria-label was added in 0.71, but this component will not work with it!
<ThirdPartyComponent aria-label="My Label" />;
Handling components with multiple style props

Some components will pass the className prop down, but they may also have multiple style props. For example, React Native's <FlatList /> component has a style and contentContainerStyle prop. The remapProps function can be used to create new className props for these components.

// This component has two 'style' props
function ThirdPartyComponent({ style, contentContainerStyle, ...props }) {
return (
<FlatList
style={style}
contentContainerStyle={contentContainerStyle}
{...props}
/>
);
}

// Call this once at the entry point of your app
remapProps(ThirdPartyComponent, {
className: "style",
contentContainerClassName: "contentContainerStyle",
});

// Now you can use the component with Nativewind
<ThirdPartyComponent className="p-5" contentContainerClassName="p-2" />;
Nativewind's style objects are more complex than the objected created StyleSheet.create. To not break third-party components, remapProps will pass a special object to the target prop. To the third-party component this will appear as an empty object.
Handling components with style attribute props

Some components may require style attributes to be passed as props (for example, React Native's <StatusBar /> component accepts a backgroundColor prop), or they may access the style prop directly.

/\*

- This component will not work as expected with Nativewind
- - borderColor will not work as it is a prop
- - backgroundColor will not work as it is based on the style.color value
    \*/
    function ThirdPartyComponent({ borderColor, style, ...props }) {
    // The background color is based on the style prop
    const backgroundColor = style.color === "white" ? "black" : "white";
    return (
    <View
    style={{
            ...style,
            borderColor,
            backgroundColor,
          }}
    />
    );
    }
    To support these components, you can use the cssInterop function. You can think of cssInterop as a "className termination". It a marker that Nativewind needs to convert the className props into style objects.

CAUTION

Enabling the cssInterop for a component comes at a performance cost. Nativewind will need to resolve the styles, add event handlers, inject context, etc.
Handling multiple props with similar properties

Sometimes a component will have multiple props that are similar.

function ThirdPartyComponent({ labelColor, inputColor, ...props }) {
return (
<>
<Text style={color: labelColor}>Label</Text>
<TextInput style={color: labelColor} />
</>
);
}
You could creating a new mapping for each props, but it can be cumbersome to manage multiple props with className management libraries

// This is possible
cssInterop(ThirdPartyComponent, {
labelColorClassName: {
target: false
nativeStyleToProps: { color: 'labelColor' }
}
inputColorClassName: {
target: false
nativeStyleToProps: { color: 'inputColor' }
}
})

function Wrapper() {
// Need to create a new className for each prop
const labelStyle = cva('color-black')
const inputStyle = cva('color-black')

return (
<ThirdPartyComponent
      labelColorClassName={labelStyle}
      inputColorClassName={inputStyle}
    />
)
}
Instead, you can use the dynamic mapping modifier to move props.

cssInterop(ThirdPartyComponent, {
className: "style",
});

function Wrapper() {
// Need to create a new className for each prop
const style = cva("{}-[inputColor]:color-black {}-[labelColor]:color-black");

return <ThirdPartyComponent className={style} />;
}
Dynamic mapping modifier

The dynamic mapping modifier allows you to move props from one prop to another. This is useful when you have multiple props that are similar, or you want to manage the styles in a single prop.

There are two ways to use the dynamic mapping modifier:

{}-[<propName>]: This will move the values the style to the propName prop. If a className sets multiple properties, the last property will be used.
{}-[<propName>]:style-property: This will move the propName prop to the style-property of the className prop, but only for the specified style-property
Both propName and style-property can be written using dot notation to access nested properties.

//This class
{}-[screenOptions.tabBarTintColor]/color:color-red-500
// Will output
{ screenOptions: { tabBarTintColor: 'color-red-500' } }
TypeScript

Both remapProps and cssInterop will return a typed version of your component. However, you can globally defined the types in a new declaration file.

declare module "<3rd party package>" {
interface 3rdPartyComponentProps {
customClassName?: string;
}
}
Example

Setting global types requires in-depth knowledge of TypeScript. Your interface declaration needs to exactly match the 3rd party declaration (including extends and generics).

For example, Nativewind uses the follow types for React Native's <FlatList />, which uses multiple interfaces for its props, across multiple packages.

import {
ScrollViewProps,
ScrollViewPropsAndroid,
ScrollViewPropsIOS,
Touchable,
VirtualizedListProps,
} from "react-native";

declare module "@react-native/virtualized-lists" {
export interface VirtualizedListWithoutRenderItemProps<ItemT>
extends ScrollViewProps {
ListFooterComponentClassName?: string;
ListHeaderComponentClassName?: string;
}
}

declare module "react-native" {
interface ScrollViewProps
extends ViewProps,
ScrollViewPropsIOS,
ScrollViewPropsAndroid,
Touchable {
contentContainerClassName?: string;
indicatorClassName?: string;
}
interface FlatListProps<ItemT> extends VirtualizedListProps<ItemT> {
columnWrapperClassName?: string;
}
interface ViewProps {
className?: string;
}
}

#Themes
As Nativewind uses Tailwind CLI, it supports all the theming options Tailwind CSS does. Read the Tailwind CSS docs on each className to learn more about the possible theming values.

Dynamic themes

To transition from a static theme to a dynamic one in Nativewind, utilize CSS Variables as colors. This approach ensures flexibility and adaptability in theme application, catering to user preferences.

tailwind.config.js

module.exports = {
theme: {
colors: {
// Create a custom color that uses a CSS custom value
primary: "rgb(var(--color-values) / <alpha-value>)",
},
},
plugins: [
// Set a default value on the `:root` element
({ addBase }) =>
addBase({
":root": {
"--color-values": "255 0 0",
"--color-rgb": "rgb(255 0 0)",
},
}),
],
};
App.tsx

import { vars } from 'nativewind'

const userTheme = vars({
'--color-values': '0 255 0',
'--color-rgb': 'rbg(0 0 255)'
});

export default App() {
return (
<View>
<Text className="text-primary">Access as a theme value</Text>
<Text className="text-[--color-rgb]">Or the variable directly</Text>

      {/* Variables can be changed inline */}
      <View style={userTheme}>
        <Text className="text-primary">I am now green!</Text>
        <Text className="text-[--color-rgb]">I am now blue!</Text>
      </View>
    </View>

)
}
Switching themes

Nativewind is unopinionated on how you implement your theming. This is an example implementation that supports two themes with both a light/dark mode.

App.jsx

import { vars, useColorScheme } from 'nativewind'

const themes = {
brand: {
'light': vars({
'--color-primary': 'black',
'--color-secondary': 'white'
}),
'dark': vars({
'--color-primary': 'white',
'--color-secondary': 'dark'
})
},
christmas: {
'light': vars({
'--color-primary': 'red',
'--color-secondary': 'green'
}),
'dark': vars({
'--color-primary': 'green',
'--color-secondary': 'red'
})
}
}

function Theme(props) {
const { colorScheme } = useColorScheme()
return (
<View style={themes[props.name][colorScheme]}>
{props.children}
</View>
)
}

export default App() {
return (
<Theme name="brand">
<View className="text-primary">{/_ rgba(0, 0, 0, 1) _/}>
<Theme name="christmas">
<View className="text-primary">{/_ rgba(255, 0, 0, 1) _/}>
</Theme>
</Theme>
)
}
Retrieving theme values

Accessing default colors

If you need the default color values at runtime, you can import them directly from tailwindcss

retrieve them directly from tailwindcss/colors

import colors from "tailwindcss/colors";

export function MyActivityIndicator(props) {
return <ActivityIndicator size="small" color={colors.blue.500} {...props} />;
}
Access theme values

If you use custom theme values, extract them to a file that is shared with your code and your tailwind.config.js. Please read the Tailwind CSS documentation for more information.

colors.ts

module.exports = {
tahiti: {
100: "#cffafe",
200: "#a5f3fc",
300: "#67e8f9",
400: "#22d3ee",
500: "#06b6d4",
600: "#0891b2",
700: "#0e7490",
800: "#155e75",
900: "#164e63",
},
};
tailwind.config.js

const colors = require("./colors");

module.exports = {
theme: {
extend: {
colors,
},
},
};
MyActivityIndicator.js

import colors from "./colors";

export function MyActivityIndicator(props) {
return <ActivityIndicator color={colors.tahiti.500} {...props} />;
}
Platform specific theming

platformSelect

platformSelect is the equivalent to Platform.select()

tailwind.config.js

const { platformSelect } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
colors: {
error: platformSelect({
ios: "red",
android: "blue",
default: "green",
}),
},
},
},
};
platformColor()

Equivalent of PlatformColor. Typically used with platformSelect.

tailwind.config.js

const { platformColor } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
colors: {
platformRed: platformSelect({
android: platformColor("systemRed"),
web: "red",
}),
},
},
},
};
Device specific theming

hairlineWidth()

Equivalent of StyleSheet.hairlineWidth

tailwind.config.js

const { hairlineWidth } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
borderWidth: {
hairline: hairlineWidth(),
},
},
},
};
pixelRatio()

Equivalent of PixelRatio.get(). If a number is provided it returns PixelRatio.get() \* <value>, otherwise it returns the PixelRatio value.

tailwind.config.js

const { pixelRatio } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
borderWidth: {
number: pixelRatio(2),
},
},
},
};
pixelRatioSelect()

A helper function to use PixelRatio.get() in a conditional statement, similar to Platform.select.

tailwind.config.js

const { pixelRatio, hairlineWidth } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
borderWidth: pixelRatioSelect({
2: 1,
default: hairlineWidth(),
}),
},
},
};
fontScale()

Equivalent of PixelRatio.getFontScale(). If a number is provided it returns PixelRatio.getFontScale() \* <value>, otherwise it returns the PixelRatio.getFontScale() value.

tailwind.config.js

const { fontScale } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
fontSize: {
custom: fontScale(2),
},
},
},
};
fontScaleSelect()

A helper function to use PixelRatio.getFontScale() in a conditional statement, similar to Platform.select.

tailwind.config.js

const { fontScaleSelect, hairlineWidth } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
fontSize: {
custom: fontScaleSelect({
2: 14,
default: 16,
}),
},
},
},
};
getPixelSizeForLayoutSize()

Equivalent of PixelRatio.getPixelSizeForLayoutSize()

const { getPixelSizeForLayoutSize } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
size: {
custom: getPixelSizeForLayoutSize(2),
},
},
},
};
roundToNearestPixel()

Equivalent of PixelRatio.roundToNearestPixel()

const { roundToNearestPixel } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
size: {
custom: roundToNearestPixel(8.4)
},
},
},
});

# Built on Tailwind CSS

Nativewind is built upon the Tailwind CSS style language. As such the core-concepts of Tailwind CSS apply to Nativewind. Recommend you read their guides on:

Utility-First Fundamentals
Reusing Styles
Adding Custom Styles
It is also important to understand that since CSS styles are generated via the Tailwind CLI, the entire Tailwind CSS language & compiler options are available for web.

This documentation only documents whats is universally compatible, but you can always use a platform prefix to apply styles that are only support on web.

Supporting React Native

Nativewind works in a similar manner to CSS, it can accept all classes but will only apply the styles that it support. For example, if you use grid, this will work on web but not on native.

Please read the differences guide for more information on some minor differences between Nativewind and Tailwind CSS.

# Quirks

Nativewind aligns CSS and React Native into a common language. However the two style engines do have their differences. We refer to these differences as quirks.

Explicit styles

React Native has various issues when conditionally applying styles. To prevent these issues it's best to declare all styles.

For example, instead of only applying a text color for dark mode, provide both a light and dark mode text color. This is especially important for transitions and animations.

dp vs px

React Native's default unit is density-independent pixels (dp) while the web's default is pixels (px). These two units are different, however Nativewind treats them as if they are equivalent. Additionally, the Nativewind's compiler requires a unit for most numeric values forcing some styles to use a px unit. Generally this works fine, however you may need to use the platform modifiers (web:/native:/ios:/android:) to adjust per platform

Flex

Flexbox works the same way in React Native as it does in CSS on the web, with a few exceptions. The defaults are different, with flexDirection defaulting to column instead of row, alignContent defaulting to flex-start instead of stretch, flexShrink defaulting to 0 instead of 1, the flex parameter only supporting a single number.

We recommend explicitly setting the flex direction and using the className flex-1 for consistent styles

Yoga 2 vs 3

React Native previously flipped left/right (and start/end) edges when dealing with margin, padding, or border, set on a row-reverse container. In Yoga 3 (introduced in React Native 0.74) the behavior of these properties lines up with web.

# Dark Mode

Nativewind supports two primary approaches for implementing dark mode in your app:

System Preference (Automatic)
Manual Selection (User Toggle)
Both approaches use colorScheme from Nativewind, which provides a unified API for reading and setting the color scheme using React Native's appearance APIs. Under the hood, the Appearance API is used on native and prefers-color-scheme is used on web.

To read the current system preference, use the colorScheme value returned from useColorScheme.
To manually set the color scheme (e.g., via a user toggle), use the colorScheme.set() function.
Both colorScheme and colorScheme.set() are imported from Nativewind.

1. System Preference (Automatic)

By default, Nativewind will follow the device's system appearance (light, dark, or automatic). This is the recommended approach for most apps, as it provides a seamless experience for users who have set their device to a preferred mode.

To read the current system preference, use the colorScheme value from the useColorScheme hook:

Expo Note: Expo apps only follow the system appearance if userInterfaceStyle is set to automatic in your app.json. See the Expo color scheme guide for more details.
Example (Expo Snack): See a full example in the Expo Docs.

This will automatically update when the system appearance changes.

2. Manual Selection (User Toggle)

If you want to allow users to manually select between light, dark, or system mode, you should use the colorScheme.set() function. This is useful for apps that provide a theme toggle in their UI.

Example: See a full implementation at nativewind/theme-toggle on GitHub.

Basic Toggle Example:

import { useState } from "react";
import { SafeAreaView, Text, Pressable } from "react-native";
import { colorScheme } from "nativewind";
import { StatusBar } from 'expo-status-bar';

import './global.css';

export default function App() {
const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");

const toggleTheme = () => {
const newTheme = currentTheme === "light" ? "dark" : "light";
setCurrentTheme(newTheme);
colorScheme.set(newTheme);
};

return (
<SafeAreaView
className={`flex-1 ${currentTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} justify-center items-center`} >
<StatusBar style={currentTheme === 'dark' ? 'light' : 'dark'} />
<Pressable
        onPress={toggleTheme}
        className="mt-4"
      >
<Text className={currentTheme === 'dark' ? 'text-gray-100' : 'text-gray-900'} style={{ fontSize: 16, fontWeight: 'bold' }}>
{currentTheme === 'dark' ? 'Dark' : 'Light'}
</Text>
</Pressable>
</SafeAreaView>
);
}
You can persist the user's choice using a storage solution like React Native Async Storage.

# Functions & Directives

Overview

Nativewind allows the same functions and directives as Tailwind CSS. Please refer to the Tailwind CSS documentation.

These functions can be used within your theme, arbitrary class names, or within your custom CSS.

In addition to the functions and directives provided by Tailwind CSS, Nativewind polyfills the following CSS functions:

var()

var() is a CSS function that allows you to use the value of a custom property (sometimes called a "CSS variable") inside the value of another property.

tailwind.config.js

module.exports = {
theme: {
extend: {
color: {
custom: "var(--my-custom-color)",
},
},
},
};

// style: { color: "red" }
<Text className="text-custom [--my-custom-color:red]">

// style: { color: "green" }
<View style={vars({ "--my-custom-color": "green" })}>
<Text className="text-custom">
</View>
calc()

CAUTION

Support for calc() is limited and will be improved in the future.
calc() is a CSS function that allows you to perform calculations when specifying CSS property values. It can be used to perform addition, subtraction, multiplication, and division and can be used with other CSS functions such as var()

// Can be used to calculate a value
.element {
width: calc(var(--my-variable) - (20px + 2rem));
}

// Or part of a value
.element {
background-color: hsl(
calc(var(--H) + 20),
calc(var(--S) - 10%),
calc(var(--L) + 30%)
)
}
Limitations

Mixing Units

On the web, calc() is a powerful tool that allows you to perform calculations with multiple units. However, React Native's layout engine is more limited and does not support mixing units. As a result, Nativewind only supports calc() in two modes: numerical and percentage.

.element {
// ❌ This mixes `numerical` and `percentage` units
width: calc(100% - 20px);
}

.element {
// ❌ This mixes `numerical` and `percentage` units
--width: 100%;
width: calc(var(--width) - 20px);
}

.element {
// ✅ This only uses `numerical` units
--width: 100rem;
width: calc(var(--width) - 20px);
}

.element {
// ✅ This only uses `percentage` units
--width: 100%;
width: calc(var(--width) - 20%);
}
Custom Properties

Nativewind does not support operations in custom properties. Instead, you can use calc() with custom properties by first defining the custom property and then using calc() to perform the operation.

.element {
// ❌ Operators cannot be in a custom property
--width: 100% - 20%;
width: calc(var(--width));
}

.element {
// ✅ Operator is part of the `calc()` expression
--width: 100%;
width: calc(var(--width) - 20%);
}
Looking to contribute? We're looking for contributors to help improve support for calc() in Nativewind, such as adding support for other modes (e.g deg)
env()

env() is a CSS function that allows you to access device specific environment information.

Nativewind supports:

env(safe-area-inset-top);
env(safe-area-inset-bottom);
env(safe-area-inset-left);
env(safe-area-inset-right);

# Units

Polyfilled Units

You can use these units within classes or tailwind.config.js.

Unit Name Description
vw View Width Polyfilled using Dimensions.get('window')
vh View height Polyfilled using Dimensions.get('window')

# Platform Differences

Nativewind aligns CSS and React Native into a common language. However the two style engines do have their differences. These are some common differences you may encounter.

Styling per platform

Styles can be applied selectively per platform using a platform variant. Additionally the native variant can be used to target all platforms except for web.

Supported platform modifiers are: ios:, android:, web:, windows:, osx:, native:.

Explicit styles

React Native has various issues when conditionally applying styles. To prevent these issues it's best to declare all styles.

For example, instead of only applying a text color for dark mode, provide both a light and dark mode text color.

❌ <Text className="dark:text-white-500" />
✅ <Text className="text-black dark:text-red-500" />
dp vs px

React Native's default unit is density-independent pixels (dp) while the web's default is pixels (px). These two units are different, however Nativewind treats them as if they are equivalent. This can cause confusion in your theme, do you use 10 or 10px? The general rule of theme is use 10px, and Nativewind will fix it for you.

Flex

React Native uses a different base flex definition to the web. Generally this can be fixed by adding flex-1 to your classes, however you may need custom styles for more complex layouts.

Flex Direction

React Native uses a different default flex-direction to the web. This can be fixed by explicitly setting a flex-direction.

rem sizing

React Native's <Text /> renders with a fontSize: 14, while the web's default is 16px. For consistency, Nativewind uses an rem value of 16 on web and 14 on native.

Color Opacity

For performance reasons, Nativewind renders with the corePlugins: textOpacity,borderOpacity, divideOpacity and backgroundOpacity disabled. Theses plugin allows colors to dynamically changed via CSS variables. Instead, the opacity is set as a static value in the color property.

If you require this functionality, you can enable the disabled plugins in your tailwind.config.js file.

# Style Specificity

Nativewind employs a specificity model that aligns with CSS rules, augmented to accommodate the inline-style characteristic of React Native and its existing ecosystem.

Problem Identification

function MyText({ style }) {
return <Text {...props} style={[{ color: 'black' }, style]} />;
}

remapProps(MyText, { className: 'style' })

<MyText style={{ color: 'red' }}>The text will be red on all platforms</MyText>
<MyText className="text-red-500">What color should I render as?</MyText>
Different platforms interpret this differently due to variations in style specificity rules, causing inconsistencies.

// Native has red text
<Text style={{ color: 'black' }, { color: 'red' }} />

// Web has black text
<Text className="text-red-500" style={{ color: 'black'}} />
Specificity Order

Nativewind has defined the following order of specificity (highest to lowest):

Styles marked as important (following CSS specificity order)
Inline & remapped styles (applied in right-to-left order)
className styles (following CSS specificity order)
Concept of Remapped Styles

Remapped styles are a novel concept introduced by Nativewind, not present in traditional CSS. They refer to styles translated from a className to a prop, and applied inline. This approach maintains the order of styles, ensuring consistency with existing React Native components.

Addressing Styling Differences

To address styling discrepancies across platforms, Nativewind allows the use of the !important modifier. This returns the styles to a specificity-based order, facilitating consistency.

Examples

Basic components

// Basic components
<Text className="text-red-500" style={{ color: 'green' }} /> // green text
<Text className="!text-red-500" style={{ color: 'green' }} /> // red text

// Remapped components (reusing the initial problem example)
<MyText className="text-red-500" /> // Native: red, Web: black
<MyText className="!text-red-500" /> // Both platforms: red

# Safe Area Insets

Overview

Safe Area Insets are the area of the screen that is not covered by the notch, home indicator, or rounded corners. This is the area where you should place your content to ensure it is not obscured by the system UI.

Usage (native)

On native, the safe area measurements are provided by react-native-safe-area-context. You will need to wrap your app with the SafeAreaProvider and use the useSafeAreaEnv hook to get the safe area insets.

import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export function MyApp(props) {
// Make sure you have the SafeAreaProvider at the root of your app
return (
<SafeAreaProvider>
<View className="p-safe" {...props} />
</SafeAreaProvider>
);
}
Expo Router adds the <SafeAreaProvider /> to every route. This setup is not needed
Usage (web)

On web, your CSS StyleSheet will use the CSS env() function and no extra setup is needed.

The h-screen-safe and min-h-screen-safe utilities may not work as expected on Google Chrome. Add height: -webkit-fill-available on parent nodes:

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
html {
height: -webkit-fill-available;
}

body {
height: -webkit-fill-available;
}

#root {
height: -webkit-fill-available;
}
}
Compatibility

Class Support Comments
m-safe
✅ Full Support margin-top: env(safe-area-inset-top); margin-bottom: env(safe-area-inset-bottom); margin-left: env(safe-area-inset-left); margin-right: env(safe-area-inset-right);
p-safe
✅ Full Support padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);
mx-safe
✅ Full Support margin-left: env(safe-area-inset-left); margin-right: env(safe-area-inset-right);
px-safe
✅ Full Support padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right);
my-safe
✅ Full Support margin-top: env(safe-area-inset-top); margin-bottom: env(safe-area-inset-bottom);
py-safe
✅ Full Support padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);
mt-safe
✅ Full Support margin-top: env(safe-area-inset-top);
pt-safe
✅ Full Support padding-top: env(safe-area-inset-top);
mr-safe
✅ Full Support margin-right: env(safe-area-inset-top);
pr-safe
✅ Full Support padding-right: env(safe-area-inset-top);
mb-safe
✅ Full Support margin-bottom: env(safe-area-inset-top);
pb-safe
✅ Full Support padding-bottom: env(safe-area-inset-top);
ml-safe
✅ Full Support margin-left: env(safe-area-inset-top);
pl-safe
✅ Full Support padding-left: env(safe-area-inset-top);
\*-safe-or-[n]
✅ Full Support

- can be substituted for any spacing utility.
  [n] can be substituted for any spacing value.// example using mt-safe-or-4 margin-top: max(env(safe-area-inset-top), 1rem); // example using mt-safe-or-[2px] margin-top: max(env(safe-area-inset-top), 2px);
  h-screen-safe
  🌐 Web only height: calc(100vh - (env(safe-area-inset-top) + env(safe-area-inset-bottom)))
  \*-safe-offset-[n]
  🌐 Web only
- can be substituted for any spacing utility.
  [n] can be substituted for any spacing value.// example using mt-safe-offset-4 margin-top: calc(env(safe-area-inset-top) + 1rem); // example using mt-safe-offset-[2px] margin-top: calc(env(safe-area-inset-top) + 2px);

# Configuration

Nativewind uses the same tailwind.config.js as Tailwind CSS. You can read more about how to configure your project through the Tailwind CSS documentation.

Metro configuration

input

required

Type: string

The path to the entry file for your Tailwind styles

projectRoot

Default: process.cwd()

The path to the root of your project

outputDir

Default: node_modules/.cache/nativewind

The path to the directory where the generated styles should be written. Should be relative to the projectRoot

configFile

Default: tailwind.config.js

The path to your Tailwind config file

cliCommand

Default: node node_modules/tailwind/lib/cli.js

The command to run the Tailwind CLI

browserslist

Default: last 1 versions

The browserslist used by browserslist & autoprefixer

browserslistEnv

Default: native

The environment used by browserslist & autoprefixer

hotServerOptions

Default: { port: <next-available> }

The options passed to ws for the development hot reloading server.

# Theme

Nativewind uses the same theme values as as Tailwind CSS. You can read more about how to configure your project through the Tailwind CSS documentation.

Fully dynamic React Native applications often make use of helper functions such as Platform.select and PixelRatio. Nativewind exports helpers allowing you to embed these functions into your theme.

platformSelect

platformSelect is the equivalent to Platform.select().

// tailwind.config.js

const { platformSelect } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
colors: {
error: platformSelect({
ios: "red",
android: "blue",
default: "green",
}),
},
},
},
};
platformColor()

Equivalent of PlatformColor. Typically used with platformSelect.

const { platformColor } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
colors: {
platformRed: platformSelect({
android: platformColor("systemRed"),
web: "red",
}),
},
},
},
};
hairlineWidth()

Equivalent of StyleSheet.hairlineWidth

const { hairlineWidth } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
borderWidth: {
hairline: hairlineWidth(),
},
},
},
};
pixelRatio()

Equivalent of PixelRatio.get(). If a number is provided it returns PixelRatio.get() \* <value>, otherwise it returns the PixelRatio value.

const { pixelRatio } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
borderWidth: {
number: pixelRatio(2),
},
},
},
};
pixelRatioSelect()

A helper function to use PixelRatio.get() in a conditional statement, similar to Platform.select.

const { pixelRatio, hairlineWidth } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
borderWidth: pixelRatioSelect({
2: 1,
default: hairlineWidth(),
}),
},
},
};
fontScale()

Equivalent of PixelRatio.getFontScale(). If a number is provided it returns PixelRatio.getFontScale() \* <value>, otherwise it returns the PixelRatio.getFontScale() value.

const { fontScale } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
fontSize: {
custom: fontScale(2),
},
},
},
};
fontScaleSelect()

A helper function to use PixelRatio.getFontScale() in a conditional statement, similar to Platform.select.

const { fontScaleSelect, hairlineWidth } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
fontSize: {
custom: fontScaleSelect({
2: 14,
default: 16,
}),
},
},
},
};
getPixelSizeForLayoutSize()

Equivalent of PixelRatio.getPixelSizeForLayoutSize()

const { getPixelSizeForLayoutSize } = require("nativewind");

module.exports = {
theme: {
extend: {
size: {
custom: getPixelSizeForLayoutSize(2),
},
},
},
};
roundToNearestPixel()

Equivalent of PixelRatio.roundToNearestPixel()

const { roundToNearestPixel } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
size: {
custom: roundToNearestPixel(8.4)
},
},
},
});

# Colors

You can customize your colors in the same manner as Tailwind CSS. Please refer to the Tailwind CSS documentation for more information.

Platform Colors

Unlike the web, which uses a common color palette, native platforms have their own unique system colors which are accessible through PlatformColor.

Nativewind allows you to use access PlatformColor via the platformColor() utility.

// tailwind.config.js

const { platformSelect, platformColor } = require("nativewind/theme");

module.exports = {
theme: {
extend: {
colors: {
error: platformSelect({
// Now you can provide platform specific values
ios: platformColor("systemRed"),
android: platformColor("?android:colorError"),
default: "red",
}),
},
},
},
};

# withNativeWind

withNativeWind is a higher order component that updates your Metro configuration to support NativeWind.

The only required option is input, which is the relative path to your .css file.

import { withNativeWind } from "native-wind/metro";

module.exports = withNativeWind(config, {
input: "<relative path to your .css file>",
});
Options

output: The relative path to the output file. Defaults to <projectRoot>/node_modules/.cache/nativewind/
projectRoot: Abolsute path to your project root. Only used to set output
inlineRem: The numeric value used to inline the value of rem units on native. false will disable the behaviour. Defaults to 14. More information
configPath: Relative path to your tailwind.config file. Defaults to tailwind.config. Recommended you use @config instead of this option.
hotServerOptions: Options to pass to the hot server. Defaults to { port: 8089 }
Experimental Options

These options are available under the experiments key.

inlineAnimations: Use react-native-reanimated's inline shared values instead of hooks. This greatly improves performance, but has issues with fast-refresh

# useColorScheme()

useColorScheme() provides access to the devices color scheme.

Value Description
colorScheme The current device colorScheme
setColorScheme Override the current colorScheme with a different scheme (accepted values are light/dark/system)
toggleColorScheme Toggle the color scheme between light and dark
You can also manually change the color scheme via NativeWindStyleSheet.setColorScheme(colorScheme)

import { useColorScheme } from "nativewind";
import { Text } from "react-native";

function MyComponent() {
const { colorScheme, setColorScheme } = useColorScheme();

return (
<Text
onPress={() => setColorScheme(colorScheme === "light" ? "dark" : "light")} >
{`The color scheme is ${colorScheme}`}
</Text>
);
}

# remapProps

Nativewind provides the remapProps utility to simplify working with third-party components with multiple "style" props.

import { remapProps } from "nativewind";

/\*_
ThirdPartyButton is a component with two "style" props, buttonStyle & labelStyle.
We can use remapProps to create new props that accept Tailwind CSS's classNames.
_/
const CustomizedButton = remapProps(ThirdPartyButton, {
buttonClass: "buttonStyle",
labelClass: "labelStyle",
});

<CustomizedButton buttonClass="bg-blue-500" labelClass="text-white" />;
remapProps can be used with the following options

// Create a new prop and map it to an existing prop
remapProps(component, { "new-prop": "existing-prop" });

// Override an existing prop.
remapProps(component, { prop: true });

# cssInterop

This function "tags" components so that when its rendered, the runtime will know to resolve the className strings into styles. You should only use this when:

You have a custom native component
You are using a third party component that needs the style prop to be resolved
You are using a third party component that does not pass all its props to its children
Usage

import { cssInterop } from 'nativewind';

// Create a new prop and map it to an existing prop
cssInterop(component, { "new-prop": "existing-prop" });

// Override an existing prop.
cssInterop(component, { "new-prop": true });

// Override an existing prop.
cssInterop(component, {
"new-prop": {
target: "existing-prop", // string or boolean
nativeStyleToProp: {
"style-attribute": "existing-prop",
}
}
}
});
Examples

Here is the mapping using the core component, <TextInput />

cssInterop(TextInput, {
className: {
target: "style", // map className->style
nativeStyleToProp: {
textAlign: true, // extract `textAlign` styles and pass them to the `textAlign` prop
},
},
placeholderClassName: {
target: false, // Don't pass this as a prop
nativeStyleToProp: {
color: "placeholderTextColor", // extract `color` and pass it to the `placeholderTextColor`prop
},
},
selectionClassName: {
target: false, // Don't pass this as a prop
nativeStyleToProp: {
color: "selectionColor", // extract `color` and pass it to the `selectionColor`prop
},
},
});

#
