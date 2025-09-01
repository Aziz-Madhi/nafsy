import { Platform } from 'react-native';

// Lazy polyfill setup for native platforms
if (Platform.OS !== 'web') {
  (async () => {
    try {
      // Dynamic import to avoid type issues; see ambient type declaration
      const { polyfillGlobal } = (await import(
        'react-native/Libraries/Utilities/PolyfillFunctions'
      )) as { polyfillGlobal: (name: string, getValue: () => unknown) => void };

      const structuredCloneMod = await import('@ungap/structured-clone');
      const streamsEncoding = await import('@stardazed/streams-text-encoding');

      if (!('structuredClone' in global)) {
        polyfillGlobal('structuredClone', () => structuredCloneMod.default);
      }

      polyfillGlobal(
        'TextEncoderStream',
        () => streamsEncoding.TextEncoderStream
      );
      polyfillGlobal(
        'TextDecoderStream',
        () => streamsEncoding.TextDecoderStream
      );
    } catch {
      // Ignore polyfill errors; environment may already support these
    }
  })();
}

export {};
