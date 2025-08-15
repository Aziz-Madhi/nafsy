/**
 * Deferred Language Change Handler
 * Handles language switching with proper restart prompts for RTL layout changes
 */

import { Alert } from 'react-native';
import { isRTLLanguage, type SupportedLanguage } from './i18n';

export interface LanguageChangeOptions {
  showConfirmation: boolean;
  autoRestart: boolean;
}

/**
 * Handle deferred language change with simple manual restart prompt
 * DEPRECATED: This function is kept for compatibility but no longer needed
 * Use direct Alert.alert() in components instead
 */
export async function handleDeferredLanguageChange(
  currentLanguage: SupportedLanguage,
  newLanguage: SupportedLanguage,
  onConfirm: () => void,
  options: LanguageChangeOptions = {
    showConfirmation: true,
    autoRestart: false,
  }
) {
  console.warn(
    'handleDeferredLanguageChange is deprecated. Use direct Alert in component instead.'
  );

  // Store the pending language change
  onConfirm();

  // Always show manual restart instruction - no auto restart
  showManualRestartAlert(newLanguage);
}

/**
 * Show manual restart alert in appropriate language
 */
function showManualRestartAlert(language: SupportedLanguage) {
  Alert.alert(
    language === 'ar' ? 'إعادة تشغيل مطلوبة' : 'Restart Required',
    language === 'ar'
      ? 'يرجى إعادة تشغيل التطبيق يدوياً لرؤية تغييرات اللغة والتخطيط.'
      : 'Please manually restart the app to see language and layout changes.',
    [{ text: language === 'ar' ? 'موافق' : 'OK' }]
  );
}

/**
 * Check if language change would require RTL layout change
 */
export function wouldChangeRTL(
  currentLanguage: SupportedLanguage,
  newLanguage: SupportedLanguage
): boolean {
  return isRTLLanguage(currentLanguage) !== isRTLLanguage(newLanguage);
}

/**
 * Get appropriate restart message for language change
 */
export function getRestartMessage(
  newLanguage: SupportedLanguage,
  willChangeRTL: boolean
): string {
  if (newLanguage === 'ar') {
    return willChangeRTL
      ? 'سيتم إعادة تشغيل التطبيق لتطبيق تغييرات اللغة والتخطيط من اليمين إلى اليسار.'
      : 'سيتم إعادة تشغيل التطبيق لتطبيق تغيير اللغة.';
  } else {
    return willChangeRTL
      ? 'The app will restart to apply language and right-to-left layout changes.'
      : 'The app will restart to apply the language change.';
  }
}
