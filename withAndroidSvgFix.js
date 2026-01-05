const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidSvgFix(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents += `
// Fix for duplicate androidsvg class
configurations.all {
    exclude group: 'com.caverock', module: 'androidsvg-aar'
}
`;
    }
    return config;
  });
};