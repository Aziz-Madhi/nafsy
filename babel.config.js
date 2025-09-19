module.exports = function (api) {
  api.cache(false);
  return {
    presets: [
      [
        'babel-preset-expo',
        { jsxImportSource: 'nativewind', reanimated: true },
      ],
      'nativewind/babel',
    ],
    plugins: [
      '@babel/plugin-proposal-export-namespace-from', // Required for Skia
      ['react-native-worklets/plugin', {}, 'react-native-worklets'],
      ['react-native-reanimated/plugin', {}, 'react-native-reanimated'],
    ],
  };
};
