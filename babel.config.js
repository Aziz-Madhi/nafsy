module.exports = function (api) {
  api.cache(false);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      '@babel/plugin-proposal-export-namespace-from', // Required for Skia
      'react-native-worklets/plugin', // Must be last
    ],
  };
};
