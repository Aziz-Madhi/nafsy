Themes
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

Colors
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

useColorScheme()
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
