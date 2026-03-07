const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidBuildFixes(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents += `
// Fix for duplicate androidsvg class
configurations.all {
    exclude group: 'com.caverock', module: 'androidsvg-aar'
}

// Fix duplicate Glide GeneratedAppGlideModuleImpl from @d11/react-native-fast-image
rootProject.ext.excludeAppGlideModule = true
`;
    }
    return config;
  });
};