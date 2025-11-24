module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            'react-native-maps': 'react-native-web-maps',
          },
        },
      ],
      // Mantenha outros plugins se tiver (como reanimated), senão, deixe assim
    ],
  };
};