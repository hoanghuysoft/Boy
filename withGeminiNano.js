// Local wrapper for the react-native-gemini-nano config plugin.
// The package's main entry is ESM-only which crashes Expo's CJS config loader,
// so we reference the CJS plugin directly via this wrapper.
const { createRunOncePlugin, withGradleProperties } = require('@expo/config-plugins');

const pkg = require('./node_modules/react-native-gemini-nano/package.json');

/**
 * Ensures newArchEnabled=true in android/gradle.properties.
 * Required for Turbo Modules (react-native-gemini-nano uses the New Architecture).
 */
const withAndroidNewArch = (config) => {
  return withGradleProperties(config, (props) => {
    const idx = props.modResults.findIndex(
      (item) => item.type === 'property' && item.key === 'newArchEnabled'
    );
    if (idx === -1) {
      props.modResults.push({ type: 'property', key: 'newArchEnabled', value: 'true' });
    } else {
      props.modResults[idx].value = 'true';
    }
    return props;
  });
};

const withGeminiNano = (config) => {
  config = withAndroidNewArch(config);
  return config;
};

module.exports = createRunOncePlugin(withGeminiNano, pkg.name, pkg.version);
