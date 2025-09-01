declare module 'react-native/Libraries/Utilities/PolyfillFunctions' {
  export const polyfillGlobal: (name: string, getValue: () => unknown) => void;
}

declare module '@ungap/structured-clone' {
  const structuredClone: (value: unknown) => unknown;
  export default structuredClone;
}
