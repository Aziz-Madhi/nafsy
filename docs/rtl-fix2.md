Ah! Now we’re getting to the core tension between JS-level language switching and native-level layout direction (RTL/LTR) in React Native / Expo. Let’s break this down carefully.

You essentially described two observed behaviors: 1. Immediate JS update works, layout wrong until restart
• Text changes immediately because i18n.changeLanguage() updates JS instantly.
• Layout is wrong (LTR instead of RTL, or vice versa) because native views don’t know the direction has changed yet.
• Restart fixes layout → JS and native are finally consistent. 2. Text shows correctly on first launch after relaunch, but layout wrong → second launch needed
• You pre-set the saved language on startup and re-initialize i18n before first render.
• JS shows correct text immediately.
• I18nManager RTL flag (I18nManager.forceRTL()) is applied too late or requires a full reload, which you’re only doing after the first launch → layout only fixes on second launch.

⸻

Core issue

The fundamental problem is:

Changing language involves two separate layers: 1. JavaScript (i18n strings) 2. Native layout direction (LTR/RTL)

These two are not synchronized automatically.
• i18n.changeLanguage() updates JS immediately.
• I18nManager.forceRTL() only sets a native flag, and React Native does not automatically re-render native views. It often requires a full reload of the JS bundle or app restart to propagate the change.

So, your app is “functional” but inconsistent because:
• You see JS updates without native layout update on first launch.
• Or you see layout update applied too late, requiring a second launch.

⸻

Why you see this two-launch behavior 1. On app startup:

I18nManager.isRTL === false
forceRTL(savedLangIsRTL)
initializeI18n(savedLang)

But if the native flag changed, RN does not re-layout the already mounted views. JS shows text correctly, but native views are still laid out as LTR.

    2.	After the first relaunch, native views read the updated I18nManager.isRTL value at mount, so layout is correct.

⸻

How to fix it correctly 1. Determine language + direction before the root app mounts.
• Do not render any UI until you know both:
• JS language (i18n)
• RTL flag (I18nManager) 2. If RTL differs from current native state, reload the app immediately before first render.
• In Expo: Updates.reloadAsync()
• Bare RN: react-native-restart 3. After reload:
• JS uses correct language
• Native uses correct layout
• No second launch needed

Key takeaway

The root cause of your “two-launch problem” is that the native RTL/LTR flag (I18nManager) and the JS i18n language are not synchronized before the app mounts.

Instant JS text change works because JS updates independently of native layout, but layout requires the native reload. Any “first launch shows correct text but wrong layout” is a timing problem: the native RTL flag isn’t applied before the root component mounts.
