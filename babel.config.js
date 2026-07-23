module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated/plugin debe ser el último de la lista de plugins.
    plugins: ['react-native-reanimated/plugin'],
  };
};
