# Expo 54

Today we're announcing the release of Expo SDK 54. SDK 54 includes React Native 0.81. Thank you to everyone who helped with beta testing.

Precompiled React Native for iOS

Starting with React Native 0.81 and Expo SDK 54, React Native on iOS and its dependencies will be shipped as precompiled XCFrameworks alongside the source.

We’ve found that [using the precompiled XCFrameworks] reduced clean build times for RNTester from about 120 seconds to 10 seconds (on an M4 Max — exact numbers will vary depending on your machine specs). While you’re unlikely to see a ~10x build time improvement in your app due to the number of other dependencies in most apps that will still need to be compiled, we expect a noticeable reduction in build times in large projects and an even more pronounced improvement in smaller projects where React Native is responsible for a greater share of the build time.
In addition to the speed benefits, this improvement brings us closer to being able to move from CocoaPods to Swift Package Manager for React Native and Expo projects.

Note that if your app uses use_frameworks! in your Podfile (or useFrameworks in expo-build-properties), it will always build from source and you won't be able to take advantage of this improvement yet. We hope to add support for this case in the near future.

Learn more in Precompiled React Native for iOS: Faster builds are coming in 0.81.

iOS 26 and Liquid Glass

Support for Liquid Glass icons and Icon Composer

SDK 54 adds support for iOS 26 Liquid Glass icons, which you can create using the new Icon Composer app. The Icon Composer app produces a .icon file, which you can reference in your app.json under the ios.icon key:

{

"ios": {

    "icon": "./assets/app.icon"

},

"android": {

    "adaptiveIcon": {

      ...

    }

}

}

It’s important to note that the Icon Composer app is macOS only — if you don’t have access to a macOS machine that can run the app, then you won’t be able to take advantage of the UI for building the icons. However, the output is relatively straightforward JSON and it’s possible that a tool will emerge to handle this.

When your app using this icon format is run on an older iOS version (iOS ≤ 19), an appropriate fallback will be automatically provided by the operating system.

Using Liquid Glass views in your app

See these effects live on this YouTube short. Also notice the iOS 26 bottom tabs UI — this is available in Expo Router v6. See the Expo Router section below for more information.

Using UIKit (best choice for most Expo apps today)

You can use Liquid Glass views seamlessly in your app with the new expo-glass-effect library and its <GlassView> and <GlassContainer> views, which are built on UIVisualEffectView. Learn more about expo-glass-effect.

import { StyleSheet, View, Image } from 'react-native';

import { GlassView } from 'expo-glass-effect';

export default function App() {

return (

    <View style={styles.container}>

      <Image

        style={styles.backgroundImage}

        source={{

          uri: '<https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop>',

        }}

      />



      {}

      <GlassView style={styles.glassView} />



      {}

      <GlassView style={styles.tintedGlassView} glassEffectStyle="clear" />

    </View>

);

}

Using SwiftUI (try out our beta Expo UI library!)

Expo UI for iOS, a library that gives you SwiftUI primitives in your Expo app, is now in beta. This release includes a brand new guide in the docs in addition to support for Liquid Glass SwiftUI modifiers, button variants, and much more.

import { Host, HStack, Text } from "@expo/ui/swift-ui";

import { glassEffect, padding } from '@expo/ui/swift-ui/modifiers';

<Host matchContents>

<HStack

    alignment='center'

    modifiers={[

      padding({

        all: 16,

      }),

      glassEffect({

        glass: {

          variant: 'regular',

        },

      }),

    ]}>

    <Text>Regular glass effect</Text>

  </HStack>

</Host>

Xcode 26 and Liquid Glass

Compiling your project with Xcode 26 is required if you plan to take advantage of the iOS 26 features mentioned above.

EAS Build and Workflows will default to using Xcode 26 for SDK 54 projects. If you are building your project on your own machine, you can download the latest version of Xcode from the Apple Developer Releases page. Xcode 26 is currently in RC status, and the GM should be released by Apple on September 15. By building your app with Xcode 26 now, you can ensure it is ready for iOS 26 immediately on its release (also on September 15). A new version of Expo Go that is built with Xcode 26 will be available shortly.

React Native for Android now targets Android 16 / API 36

Edge-to-edge is now always enabled

With Expo SDK 54 and React Native 0.81 now targeting Android 16, edge-to-edge will be enabled in all Android apps, and cannot be disabled. Additionally, react-native-edge-to-edge is no longer a dependency of the expo package because the required functionality was built into React Native by the author of the library, Mathieu Acthernoene. If you are using the react-native-edge-to-edge config plugin to configure edge-to-edge in your project, make sure that the package is a direct dependency of your project (npx expo install react-native-edge-to-edge). If you were only using the plugin only to configure the enforceNavigationBarContrast option you can use the new androidNavigationBar.enforceContrast property in your app.json to get the same effect without additional dependencies.

Predictive back gesture available as opt-in

The Android predictive back gesture feature is disabled by default in all projects in SDK 54, and you can enable it in your project's app.json with android.predictiveBackGestureEnabled. As with edge-to-edge, we expect opt-outs will eventually be removed from a future version of Android, and we plan to enable this by default in all projects in SDK 55 or 56. Learn more.

Expo Updates & EAS Update

The HTTP headers Update sends, such as channel, can now be overridden at runtime with Updates.setUpdateRequestHeadersOverride(). This enables developers to easily implement patterns such as opting employees into a different update channel than end-users. Unlike Updates.setUpdateURLAndRequestHeadersOverride() , which allows you to also override the update URL and requires the disableAntiBrickingMeasures build time flag — the new method only applies to headers, is available without setting any flags, and can be used safely in production apps. Configuration set with either method will apply immediately to the currently running app. This means that you don’t need to restart the app for the new configuration to take effect, you can call Updates.fetchUpdateAsync() and Updates.reloadAsync() after you update the headers. Learn more about overriding request headers.
The useUpdates() hook now includes a downloadProgress property, which you can use to track the progress of asset downloads during an update. You can use this to show a progress bar when downloading an update, and possibly other creative scenarios. Learn more.
Updates.reloadAsync() now accepts reloadScreenOptions to give developers control over the UI that is presented while your app is reloading. This provides a much better user experience than a flash of empty content. The following example configuration shows a full screen image and fades out when the update has been applied: In development, you can test your reload screen configuration by using Updates.showReloadScreen({ reloadScreenOptions }) and Updates.hideReloadScreen().
import \* as Updates from 'expo-updates';

Updates.reloadAsync({

reloadScreenOptions: {

    backgroundColor: '#fa0000',

    image: require('./assets/images/reload.jpg'),

    imageResizeMode: 'cover',

    imageFullScreen: true,

    fade: true

},

});

Improved package manager support and Expo Autolinking revamp

We’ve worked on improving the reliability of running Expo projects with package managers supporting workspaces (monorepos), with isolated dependency installations and when your dependencies have active hoisting conflicts. To support this, several changes were made to Expo Autolinking, as well:

React Native modules that are installed as transitive dependencies will now be autolinked. While Expo Autolinking always worked this way for Expo modules, now that we take care of linking React Native modules, (as of SDK 52) we were able to implement this behavior for React Native modules as well. This means that you will be able to let libraries take care of managing their dependencies, rather than copying and pasting a command to install a handful of native dependencies on their behalf (learn more). You can revert back to the previous autolinking behavior by adding the expo.autolinking.legacy_shallowReactNativeLinking: true flag in your app’s package.json.
Expo and React Native modules will now link according to your app’s direct and nested dependencies, rather than them scanning your node_modules folders. Now, either your app or a dependency of your app will need to contain a native module in their dependencies or peerDependencies for it to be linked. You can revert back to the previous autolinking behavior by adding your node_modules folders to expo.autolinking.searchPaths in your app’s package.json.
Expo Autolinking now has unified behavior across Expo and React Native modules, and so it will behave more predictably when it comes to isolated dependency installations (Bun and pnpm) and hoisting conflicts.
Changes that impact how dependencies are handled will often lead to issues in more unique project configurations that can't be anticipated. You can verify your expected native modules against the output of npx expo-modules-autolinking verify -v , or with Expo Doctor proactively, if you believe they may be impacted by these changes. If you need to opt out of the autolinking changes mentioned above, add the following to your app’s package.json:

{

"expo": {

    "autolinking": {

      "legacy_shallowReactNativeLinking": true,

      "searchPaths": ["../../node_modules", "node_modules"]

    }

}

}

While these changes affect native modules linking, they may also now be applied experimentally to Expo CLI’s bundling, which can actively help in resolving native module duplicates or allow multiple versions of React or a native module to be installed in a single monorepo. Set experiments.autolinkingModuleResolution to true in app.json to test this.

All popular package managers (Bun, npm, pnpm, and Yarn) are now supported, our monorepo instructions have been updated, and Expo Doctor and the Expo CLI have been updated accordingly.

SDK 54 is the final release to include Legacy Architecture support

In React Native 0.80, the React Native team introduced a code freeze on the Legacy Architecture. In React Native 0.82, it will no longer be possible to opt out of the New Architecture. This means that SDK 55, which will likely include React Native 0.83, only support the New Architecture.

In recent months, a growing number of libraries have started to only support the new architecture. For example: react-native-reanimated v4 and @shopify/react-native-flashlist v2. The interop layer will remain a part of React Native for the foreseeable future, in order to ensure that libraries built for the Legacy Architecture continue to work well in modern apps.

At the time of writing, 75% of SDK 53 projects built on EAS use the New Architecture. If you are still concerned about migrating, learn more about work that has been done to address the last remaining identified issues found while migrating some of the largest React Native apps, such as the primary Shopify app and their Point of Sale app, which "[serve] millions of merchants”.

Highlights

React Native 0.81 with React 19.1. Refer to the release notes for React Native 0.81 and React 19.1 changelog for detailed information. Also, learn more about the Expo SDK policy for tracking React Native versions.
expo-file-system/next is stable: The new expo-file-system API is now stable and exposed as a default. If you were using it prior to upgrading, you will need to update your imports from expo-file-system/next → expo-file-system. The old API is still available under expo-file-system/legacy. Some improvements include: an object-oriented API for working with files and directories, support SAF URIs on Android and bundled assets on both iOS and Android. You can expect more information in an upcoming blog post, in the meantime you can refer to the API reference.
expo-sqlite now includes a drop-in implementation for the localStorage web API. If you're already familiar with this API from the web, or you would like to be able to share storage code between web and other platforms, this may be useful. Learn how to import and install the localStorage API.
Prebuild template now included in the expo package rather than downloaded from npm. This ensures that the template used by a given expo package version remains unchanged even if new template versions are released. Updating the expo package will also bring in a new template version. Thanks to Thibault Malbranche for suggesting this change. Note that you can still provide a custom prebuild template with the --template flag.
expo-sqlite added loadExtensionAsync() and loadExtensionSync() APIs to support loading SQLite extensions. The sqlite-vec extension, which supports vector data processing, is also bundled to expo-sqlite as an opt-in extension. You can use sqlite-vec for some RAG AI work. See the implementation in expo#38693, for loadExtensionAsync() API usage, the withSQLiteVecExtension config-plugin option to opt-in sqlite-vec.
expo-app-integrity: New package for verifying app integrity using DeviceCheck (DCAppAttestService) on iOS and the Play Integrity API on Android. This allows you to confirm that the app is installed via the App Store or Play Store and is running on a genuine, untampered device. Learn more.
expo/blob: New package for working with binary large objects on iOS and Android. Our implementation is consistent with the W3C specification, providing you with interfaces familiar from the web. expo-blob is now in beta, and we’re excited to get your feedback! This library is not yet included in Expo Go.
expo-maps: Added support for JSON and Google Cloud based map ID styling on Google Maps and Points of Interest (POI) filtering on Apple maps. Learn more.
buildCacheProvider promoted from experimental to stable. When using a build cache provider, npx expo run:[android|ios] will automatically download your project's most recent build with the same fingerprint, if it exists. If there is no build for the fingerprint yet, then npx expo run will continue as usual and compile your project, and then upload the build to the cache provider after launching it. Out-of-the-box integrations are available with GitHub and EAS, and you can implement your own custom provider to cache builds in your preferred location (you could even just copy it to a NAS if you want). If you already have EAS configured in your project, run npx expo install eas-build-cache-provider and then add "buildCacheProvider": "eas" to your app.json - that's it! Once you've set this up, you can also use eas fingerprint:compare to easily understand what caused your fingerprint to change. Learn more about using GitHub and EAS build cache providers, and creating your own.
Improvements to brownfield experience, and more on the way. We are continuously improving the brownfield experience, and rewriting our documentation on native app integration. We've also added support custom folder structures, which is especially useful for large codebases where moving native projects to android and ios directories isn't feasible. Learn more.
Expo Go is now available for the Meta Quest on the Horizon Store. We've seen some massive improvements to the platform over the past year and we're excited for more existing Android apps get up and running as 2D apps on the Meta Quest. It's not meaningfully different from getting an Android app running on other Android platforms without Google Services, and you can expect to hear more from us and from the team at Meta about this in the near future. Reach out if you are interested in getting your Android app deployed to Quest devices, we'd be happy to discuss it.
expo-dev-launcher rewrite: we rebuilt the expo-dev-client UI in order to simplify the interface with React Native and improve the Hermes debugging experience. In doing so, we also made some other improvements to the look and feel — let us know what you think!
Apple and Android TV

Experimental expo-dev-client support for Apple TV, full support on Android TV. Support on tvOS is still early, and you can’t yet authenticate with your Expo account in the app, but give it a try if you have an Apple TV and let us know what you think.
Added support for Apple TV in various SDK packages: expo-sqlite, expo-background-task, expo-task-manager, expo-insights, expo-image-loader, expo-image-manipulator, and expo-video-thumbnails. See the doc pages for the individual packages for more details.
tvOS builds will leverage the new precompiled frameworks provided in React Native 0.81: This will significantly reduce build times for these platforms (related blog).
Expo CLI

Import stack traces are now enabled by default. You can now see a list of imports leading to a missing module which makes it much easier to trace broken packages. With this feature, we found agents (such as claude code) could always resolve broken imports.
experimentalImportSupport is now enabled by default. We’ve rebuilt Metro ESM support in Expo CLI to better support React Compiler, and tree shaking. This moves us one step closer to full ESM support in Expo.
You can revert to the older system by setting experimentalImportSupport: false in the metro.config.js. We plan to remove this flag altogether in the next SDK release.
The rebuilt support uses live bindings by default to improve compliance with the ECMAScript specification and to support a wide range of projects. If you don't want this, set EXPO_UNSTABLE_LIVE_BINDINGS=false. Disabling live bindings will cause issues with many projects, and will break circular import support.
Expo CLI now auto-prefixes CSS by default using the Rust-based lightningcss. You can remove autoprefixer from your postcss.config.mjs file in favor of this implementation. We’ve also added support for browserslist in the package.json for CSS prefxi. Learn more.
@babel/plugin-transform-class-static-block is now added to babel-preset-expo by default. This enables an even wider set of web and server libraries to work with Expo by default. Learn more about static class blocks.
React Compiler is now enabled in the default template. We recommend using it in your projects. The Meta team is actively fielding support for any remaining issues with React Compiler. You can see which components are memoized by pressing J in Expo CLI and going to the components panel. You will see “Experimental React Compiler is enabled.” printed in your logs when you run npx expo start — this is because it is currently in Release Candidate. However, we believe it is ready for most apps. This default may change if this proves false during the beta period. Learn more in the Expo + React Compiler docs.
React Native owner stacks are now enabled by default. These improve errors that occur in React components and make it easier to find/fix problems for both humans and agents.
Unhandled promise rejections are now logged as errors. After upgrading to this SDK, you might notice new promise rejection errors in your mobile applications. These aren't caused by the SDK itself, but are now properly surfaced as errors, which aligns with how Promises work in web browsers.
Experimental autolinking module resolution was added. Expo CLI is now able to apply Expo Autolinking’s linking decisions to JavaScript module resolution. This prevents mismatches between native modules and JavaScript modules, even in the presence of dependency conflicts and duplicates, and also resolves react and react-dom to a single version. Set experiments.autolinkingModuleResolution to true in app.json to test this.
Bumped the recommend TypeScript version to ~5.9.2
Reminder from SDK 53: The import.meta transform plugin is still an experimental opt-in feature, which you can turn on with the unstable_transformImportMeta option in the babel-preset-expo configuration (example). Enable this if some of your ESM dependencies rely on import.meta.

# Expo Router

Expo Router v6 - Link Previews
Link now supports iOS view controller previews, transitions, and context menu items. These can be used to add quick actions and information to any link in your app. Learn more.
Beta support for native tabs on iOS and Android. Unlike the JS tabs implementation, this enables liquid glass tabs, automatic scrolling on tab press, and many other beautiful native effects. The API is still under development and subject to breaking changes until we remove the unstable- prefix from the import. Learn more.
Modals on web now emulate iPad and iPhone behavior instead of just being a full screen page with no modal-like attributes.
New experimental server middleware support. Middleware can be used to run code before requests reach a route. Learn more.
TextDecoderStream and TextEncoderStream are added to the native runtime to better support fetch streaming and working with AI.
Deprecations & removals

expo-build-properties field enableProguardInReleaseBuilds is deprecated in favor of enableMinifyInReleaseBuilds.
React Native’s <SafeAreaView> component has been deprecated: use react-native-safe-area-context instead if you aren’t already. It’s a much more powerful alternative, and one of those libraries that nearly every app uses.
The notification configuration field in app config has been deprecated in favor of expo-notifications config plugin.
expo-av will be removed in SDK 55. It was deprecated in SDK 53, and this will be the last SDK release where it will be a part of the SDK. Migrate to expo-audio and expo-video.
Notable breaking changes

First-party JSC support removed from React Native: React Native 0.81 no longer provides built-in JSC support — if you would like to continue using JSC, refer to https://github.com/react-native-community/javascriptcore. Note: this community-maintained JSC library does not yet provide a config plugin, and so you will need to either write your own or modify your native projects directly in order to use it.
Reanimated v4 introduces react-native-workletsand only supports the New Architecture. Refer to the Reanimated 3.x to 4.x migration guide, but skip modifying your babel.config.js (this is handled automatically by babel-preset-expo). If you need to continue using the Legacy Architecture, you can continue using Reanimated v3 — learn how to use Reanimated v3 with SDK 54.
Internal Metro imports have changed in metro@0.83. Importing internals from metro/src/.. is not longer supported. Internals are now only accessible via metro/private/... For most app developers, this won’t impact you. If you maintain a library or app that interacts with Metro directly, please switch to Metro’s public APIs. If you use a library that runs into an error due to src imports, open an issue on the library’s GitHub issues.
expo-file-system legacy API now available through expo-file-system/legacy and the default exports for the library were replaced with what was formerly expo-file-system/next . The quickest way to upgrade and have your app working the same as before is to replace all imports for expo-file-system to expo-file-system/legacy. Next, you can migrate to the new API at your own pace. If you were already using expo-file-system/next, update your imports to expo-file-system instead (the old imports will still work, but you will be warned). We plan to expo-file-system/legacy in SDK 55. Learn more about the new API.
expo-notifications deprecated function exports were removed expo/expo#38782.
@expo/vector-icons icon families updated to the latest versions from react-native-vector-icons. If you use TypeScript in your project, typecheck the your project after upgrading to see if any of the icons that you use were renamed or removed.
The locales configuration field in app config now supports both Android and iOS. Move translation strings specific to iOS under the locales.ios key.
Tool version bumps

Minimum Xcode bumped to 16.1. Xcode 26 is recommended.
Minimum Node version bumped to 20.19.4.
Known issues

Precompiled React Native for iOS is not compatible with use_frameworks!. When using use_frameworks!, React Native for iOS will always build from source.
Found an issue? Report it.
➡️ Upgrading your app

Here's how to upgrade your app to Expo SDK 54 from 53:

Update to the latest version of EAS CLI (if you use it):
Upgrade all dependencies to match SDK 54:

- npx expo install expo@^54.0.0 --fix

If you have any resolutions/overrides in your package.json, verify that they are still needed. For example, you should remove metro and metro-resolver overrides if you added them for expo-router in a previous SDK release. Additionally, if you previously configured your metro.config.js to work well in a monorepo, we recommend reading the updated Work with monorepos guide to see if you need to make any changes
Check for any possible known issues:
Refer to the "Deprecations, renamings, and removals" section above for breaking changes that are most likely to impact your app.
Make sure to check the changelog for all other breaking changes!
Upgrade Xcode if needed: Xcode 16.1 or higher is needed to compile a native iOS project. We recommend Xcode 26 for SDK 54. For EAS Build and Workflows, projects without any specified image will default to Xcode 26.
If you use Continuous Native Generation:
Delete the android and ios directories if you generated them for a previous SDK version in your local project directory. They'll be re-generated next time you run a build, either with npx expo run:ios, npx expo prebuild, or with EAS Build.
If you don't use Continuous Native Generation:
Run npx pod-install if you have an ios directory.
Apply any relevant changes from the Native project upgrade helper.
Optionally, you could consider adopting prebuild for easier upgrades in the future.
If you use development builds with expo-dev-client: Create a new development build after upgrading.

Upgrade to Expo SDK 54 with React Native 0.81, Reanimated v4, Android API 36, and iOS 26 support. Learn key changes, tips, and migration advice.

How to upgrade to Expo SDK 54
‘Tis the season for a new Expo SDK! Expo SDK 54 is here, bringing with it React Native 0.81, Reanimated v4, and more! Android API level 36 is supported, as are iOS 26 features. Just check out the changelog...there’s a lot going on!

Each SDK undergoes extensive testing and a beta test period, where the Expo team and the community collaborate to find issues that might stand in the way of a fast and smooth upgrade for others. A lot of Expo engineers maintain our own apps and try to upgrade those as soon as the beta is out.

Nonetheless, there’s practically infinite possibilities out there. Every app is unique, and has it’s own complexities that will need to be accounted for when upgrading. Therefore, we wanted to highlight some specific key changes that may affect your upgrade to SDK 54, as well as some evergreen advice when it comes to upgrading to the latest Expo SDK.

If you prefer to consume your info via video check out this demo of an upgrade from SDK 53 to SDK 54:

Key things to know as you upgrade to SDK 54

iOS builds on EAS now use precompiled React Native

React Native 0.81 now ships as an XCFramework, rather than source code that needs to be compiled into your app on every build. This could make the Fastlane step of your builds significantly faster. A small number of libraries may be referencing React Native core native components in a way that doesn’t work with this yet. If you do run into issues with this, we definitely appreciate issue submissions, and in the meantime you can switch back to compiling by source via expo-build-properties ’s ios.buildReactNativeFromSource property. We wrote a blog post about precompiled React Native that you can reference for more info.

Significant changes in Reanimated v4 / some projects should not upgrade yet

Be sure to check out the migration guide for react-native-reanimated v4 . You can skip the babel.config.js steps, as babel-preset-expo handles them for you. If you use Nativewind, you will want to stay on Reanimated v3 for now.

SDK 54 is the last SDK that will support React Native Old Architecture

Check out our advice for upgrading to New Architecture below.

Get ready for new Android UI features

Android edge-to-edge support has been around since SDK 52, but it is now enabled by default in all Android apps. Functionality that previously required react-native-edge-to-edge is now shipped inside React Native. If you continue using the react-native-edge-to-edge config plugin, you’ll need to install the package directly in your project. Or, you can use built-in properties on androidNavigationBar in your app config to achieve the same effect. If you haven’t yet tested edge-to-edge support, now is the time to make sure everything looks good on Android.

Android predictive back support can also be enabled via the android.predictiveBackGestureEnabled app config property. It is not yet enabled by default due to compatibility issues with react-native-screens.

expo-file-system → expo-file-system/legacy

The rewrite of expo-file-system is now the default when you import the package. If you still would like to use the old version, though, you can import expo-file-system/legacy.

Unhandled promise rejections are now logged as errors

Don’t adjust your terminal! You might see new runtime errors if you have unhandled exceptions thrown from async code. These were always there; they just weren’t surfaced before. This behavior change aligns better with how web browsers work.

Tips for upgrading your Expo SDK

We have written up detailed advice for troubleshooting issues found during an upgrade. This includes considerations for both before and during your upgrade, with a list of suggestions, starting with the quickest/easiest to try. We recommend reading the entire guide, but we wanted to highlight a few key items in brief here:

Check the changelog!

Most SDK releases will have a list of known breaking changes, or notable changes where you may need to tweak configuration for a scenario specific to your app. The best time to read the changelog and breaking changes is before you upgrade, so you can make those tweaks before you test, but the next best time to read it is after you upgrade, particularly if you see a compilation error or crash.

Using development builds over Expo Go

Upgrades are best taken when you don’t feel rushed to complete them. As Expo Go automatically upgraded to the latest version after the SDK release on your phone, you may have noticed that your app no longer worked in Expo Go, and felt that you needed to upgrade right away in order to keep working on features.

Development builds help reduce the temperature, giving you time and space to take on an upgrade while not interrupting ongoing feature work. A development build works a lot like Expo Go, allowing you to scan a QR code to work on your code locally without rebuilding. But it’s your own app, so it will not get upgraded when a new version of Expo Go is released.

If you still feel that you need to use Expo Go, know that you don’t necessarily have to use the latest version on the Play and App Stores. You can go to https://expo.dev/go and download previous versions for use on Android devices and iOS simulators. Unfortunately, due to App Store restrictions, this does not work on iOS devices.

Still, another reason to migrate to a development build is because Expo Go is quite limited in how it can replicate your production app, leading to issues where it works in Expo Go but not when you build your production app. Expo Go can run your JavaScript, but it cannot apply most of your app.json / app.config.js configuration, because that would require modifying native code. In short, Expo Go can’t contain nearly everything that’s unique and special about your app. Development builds can. There's plenty of headroom in the Free plan to make some development builds, or you build locally npx expo run:android or npx expo run:ios.

New Architecture advice

If you’re still on the Old Architecture, upgrade to the latest SDK, and then upgrade to New Architecture.

Expo SDK 54 will be the last SDK to support the Old Architecture, as the next version of React Native will only support the New Architecture. Therefore, if you haven’t upgraded to the New Architecture yet, now is the time! A number of the latest versions of major packages, such as react-native-reanimated v4 and @shopify/flash-list v4, only support New Architecture. 75% of SDK 53 projects built on EAS are using New Architecture, so it’s working well for most apps, and major progress has been made on the few remaining blockers for apps that have not yet migrated.

However, there’s no need to rush. Avoid upgrading both your Expo SDK and adopting New Architecture at the same time. This makes it more difficult to isolate any issues. Compared to upgrading your Expo SDK, adopting New Architecture is the bigger change, so any issues are likely related to that- but it will be hard to tell if you upgrade to both at the same time.

With a development build, you can upgrade to SDK 54 / React Native 0.81 separately. Make a development build that just upgrades to SDK 54 first (e.g., by running npx expo install expo@latest --fix and follow the release notes to address any breaking changes). Test against that and make sure everything is working with the SDK 54 upgrade. Then, turn on New Architecture and make another development build and test against that. Also note that you will want to not upgrade Reanimated from v3 to v4 until after turning on New Architecture.

You could do that immediately, or even release your app on SDK 54 / old architecture and then release later on the New Architecture. There’s no hurry to do both at once, and, if you do each of them separately, you’ll be able to pinpoint more closely if the issue is SDK 54 / React Native 0.81 or New Architecture-related. If it’s New Architecture-related, you can use our New Architecture troubleshooting guide to help.

Check the troubleshooting guides

We have a landing page of our most popular troubleshooting guides that you can browse depending on your issue. If your issue is an error when building, you’ll want to take different steps compared to a crash or performance issue. Even if you don’t fully get to the root cause, using a tool like ADB Logcat or macOS console to find a native error that the operating system reports from a crash can be very helpful as you engage in further troubleshooting or ask others for help.

Reach out if you need a hand!

We appreciate your bug reports and feedback! The best way to surface an issue is and will always be a Github issue with a minimal reproduction, where you send us a link to a Github repo based on the default project template created with npx create-expo-app , plus just enough code to reproduce the issue.

A minimal reproduction ensures that our team can see exactly what you’re seeing and gives us a way to test that our fix will work for you. Even if that seems like a lot to do, often spending 15 or 30 minutes trying to make a minimal reproduction is more effective than hours spent debugging on your actual app, where there are a lot of moving pieces and it’s more difficult to isolate issues.

We also understand the value in discussing an issue in the moment, even before you’re ready to try to reproduce it. Other developers may be experiencing the same thing and already have an answer. Discussions about issues on Discord, Reddit, Bluesky and elsewhere can result in a sort of collaborative virtual rubberducking where we find the answer together while talking through it.

We encourage you to post screenshots or videos of the issues you’re facing, or at least descriptions of what exactly you’re seeing, what platforms are affected, etc. so we can see what is broken and help the community think through how to isolate that issue and find a solution. If you have detailed feedback about the upgrade process that doesn’t fit neatly into a minimal reproduction of a single issue, we’d love to hear about it, as well. Besides social forums, we always have someone checking on the messages received from our support page.

Happy upgrading and we hope you love SDK 54!
