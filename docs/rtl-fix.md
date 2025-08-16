You’re right — this shouldn’t feel this hard. The core of the problem is small and predictable:
• Translation text is pure JS and updates immediately.
• Layout direction (LTR/RTL) is a native setting (I18nManager) that must be applied before native views mount — it usually requires a full native-level reload to take effect everywhere.
• If those two things are handled in separate lifecycles (JS updates vs native direction), you get the “first restart wrong layout, second restart correct” behaviour.

Below is a simple, robust, production-ready plan you can implement in minutes. It uses your stack: Expo, expo-updates (for restart in production), MMKV (fast storage) and Zustand (optional app state). No magic. No auto-reloads. UX = “ask user to restart” (what you want).

⸻

One-line design

Store the chosen language in MMKV → bootstrap the app before rendering (read language, init i18n, set I18nManager if needed) → when user changes language, persist it, change i18n, set I18nManager if direction changed and ask the user to restart (button triggers Updates.reloadAsync()).

⸻

Implementation plan (step-by-step, minimal)

1. Single source of truth

Keep language code in one persistent place (MMKV preferred for speed). Don’t initialize i18n with a default that races with storage reads.

storage/mmkv.ts

import { MMKV } from 'react-native-mmkv';
export const storage = new MMKV({ id: 'app' });

export const saveLanguage = (lang: string) => storage.set('language', lang);
export const getSavedLanguage = (): string | null => storage.getString('language');

(If you don’t use MMKV, use @react-native-async-storage/async-storage — just await reads in bootstrap.)

⸻

2. Initialize i18n only after reading storage (bootstrap)

Prevent your app UI from mounting until you’ve read the language and set layout direction. Use the splash screen to hide the UI while bootstrapping.

i18n/initI18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Put your translation resources (or load them dynamically)
const resources = {
en: { translation: { /_ ... _/ } },
ar: { translation: { /_ ... _/ } },
};

export async function initI18n(lang?: string) {
if (!i18n.isInitialized) {
await i18n.use(initReactI18next).init({
resources,
lng: lang || 'en',
fallbackLng: 'en',
interpolation: { escapeValue: false },
});
} else if (lang) {
await i18n.changeLanguage(lang);
}
return i18n;
}

bootstrap.ts

import \* as SplashScreen from 'expo-splash-screen';
import { I18nManager } from 'react-native';
import { initI18n } from './i18n/initI18n';
import { getSavedLanguage } from './storage/mmkv';

const RTL_LANGS = new Set(['ar','he','fa','ur','ur']);

export async function prepareApp() {
await SplashScreen.preventAutoHideAsync();
const lang = getSavedLanguage() || 'en';
await initI18n(lang);

const shouldBeRTL = RTL_LANGS.has(lang);
if (I18nManager.isRTL !== shouldBeRTL) {
// Crucial: set native direction BEFORE rendering any UI
I18nManager.allowRTL(shouldBeRTL);
I18nManager.forceRTL(shouldBeRTL);
// NOTE: because this is before first render, a reload is NOT required here.
// But you MUST do this prior to mounting the navigation / views.
}

await SplashScreen.hideAsync();
}

App.tsx (entry)

export default function Root() {
const [ready, setReady] = React.useState(false);
React.useEffect(() => {
(async () => {
await prepareApp();
setReady(true);
})();
}, []);
if (!ready) return null; // splash screen is shown
return <MainApp />; // your navigation/root component
}

Why this fixes first-launch issues: you set I18nManager before any UI mounts so the first cold start always shows correct layout & text.

⸻

3. Change-language flow (what happens when user taps language)

This is the minimal flow that matches other apps (they tell the user to restart): 1. Save new language in storage. 2. Update i18n (so text in new screens/components will be correct next mount). 3. If direction changed (LTR ↔ RTL), set I18nManager.allowRTL/forceRTL. 4. Show a modal: “Restart required — Restart now / Later”.
• If user taps Restart now → call Updates.reloadAsync() (Expo) or RNRestart.Restart() (bare RN).
• If user taps Later → leave app running (text might be partially updated in JS, but layout remains the old direction until a real restart).

language switch example

import { Alert, I18nManager } from 'react-native';
import \* as Updates from 'expo-updates';
import i18n from 'i18next';
import { saveLanguage } from './storage/mmkv';

const RTL_LANGS = new Set(['ar','he','fa','ur']);

export async function changeAppLanguage(nextLang: string) {
saveLanguage(nextLang); // persist
await i18n.changeLanguage(nextLang); // update translations

const shouldBeRTL = RTL_LANGS.has(nextLang);
if (I18nManager.isRTL !== shouldBeRTL) {
I18nManager.allowRTL(shouldBeRTL);
I18nManager.forceRTL(shouldBeRTL);

    Alert.alert(
      "Restart required",
      "This language requires restarting the app to apply layout changes.",
      [
        { text: "Restart now", onPress: async () => { await Updates.reloadAsync(); } },
        { text: "Later", style: "cancel" }
      ]
    );

}
}

Important UX choice: this asks the user and then restarts only when they confirm. Exactly like the apps you use.

⸻

4. Keep app styles direction-aware

Make styles resilient so changing text language (without direction change) doesn’t require a reload:
• Prefer marginStart, marginEnd, paddingStart, paddingEnd.
• For text: textAlign: 'auto'.
• For rows that must flip: compute flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' (or use helper function).
• Mirror icons when necessary: transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }].
• Avoid hard-coded left/right.

A small helper:

import { I18nManager } from 'react-native';
export const dir = I18nManager.isRTL ? 'rtl' : 'ltr';

⸻

5. Zustand (optional) — keep simple

Use Zustand for UI state, but don’t use it as the persistent source of truth for language. Let MMKV be the persistent source and reflect that into Zustand on bootstrap.

store/useAppStore.ts

import create from 'zustand';
export const useAppStore = create(set => ({
language: 'en',
setLanguage: (lang) => set({ language: lang }),
}));

After prepareApp() completes, set the store language so UI components can read it immediately.

⸻

Quick checklist to remove the “double restart” bug
• Remove any module-level i18n initialization that uses a default language before storage is read. (Init i18n in bootstrap instead.)
• Read persisted language synchronously (MMKV) or await AsyncStorage before rendering.
• Set I18nManager before any navigation or view mounts on cold start.
• When changing language at runtime, call I18nManager.forceRTL() only if direction changes, then ask user to restart, and call Updates.reloadAsync() only when user confirms.
• Confirm you’re not relying on Fast Refresh or JS-only reload for layout direction changes.
• Convert left/right styles to start/end or direction-aware logic.

⸻

Why your “expo-updates auto reload” accidentally fixed it

Expo’s auto-reload performed a full native reload — that’s exactly what Updates.reloadAsync() does. It accidentally applied the I18nManager change for you. But relying on auto-updates is brittle (and surprising for users), so use the explicit “ask to restart” flow above.

⸻

Troubleshooting if it still asks for two restarts
• Search for any other code that calls i18n.init() or sets I18nManager at module import time — those can race with bootstrap.
• Ensure splash-screen blocking really prevents any UI mount until bootstrap is finished.
• Verify the saved language is exactly what you expect before init (no empty strings, no wrong keys).
• If using Hermes or aggressive caching, try clearing the app data once to ensure native flags aren’t stale.

⸻

TL;DR (exact minimal steps you can paste into your app) 1. Read saved language before rendering (SplashScreen while you do it). 2. initI18n(savedLang). 3. Set I18nManager.allowRTL/forceRTL if savedLang is RTL (do it before rendering). 4. When user changes language: persist, i18n.changeLanguage(), if direction changed → set I18nManager and show “Restart required” modal with “Restart now” calling Updates.reloadAsync().
