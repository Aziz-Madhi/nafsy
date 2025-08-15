import { resources } from '../lib/i18n';

// This merges with the original module declaration to provide type safety
declare module 'react-i18next' {
  interface CustomTypeOptions {
    // This makes the 't' function aware of all translation keys
    resources: (typeof resources)['en'];
  }
}