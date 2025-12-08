module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // 👇 IMPORTANTE: quita el plugin manual
    plugins: ['react-native-reanimated/plugin'],
  };
};
