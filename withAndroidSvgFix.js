const path = require('path');
const expoDir = path.dirname(require.resolve('expo/package.json'));
const { withAppBuildGradle } = require(require.resolve('@expo/config-plugins', { paths: [expoDir] }));


module.exports = function withAndroidBuildFixes(config) {
  return withAppBuildGradle(config, (config) => {
    // Media3 version override block removed: both expo-video and react-native-nitro-player
    // now compile against the same Media3 version (1.9.0).
    return config;
  });
};