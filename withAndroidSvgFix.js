const path = require('path');
const expoDir = path.dirname(require.resolve('expo/package.json'));
const { withAppBuildGradle } = require(require.resolve('@expo/config-plugins', { paths: [expoDir] }));


module.exports = function withAndroidBuildFixes(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents += `
// Fix for duplicate androidsvg class
configurations.all {
    exclude group: 'com.caverock', module: 'androidsvg-aar'
}

// Fix AbstractMethodError: react-native-nitro-player pulls Media3 1.9.0 but expo-video
// was compiled against 1.8.0. Force 1.8.0 so the runtime interface matches.
configurations.all {
    resolutionStrategy {
        force 'androidx.media3:media3-exoplayer:1.8.0'
        force 'androidx.media3:media3-exoplayer-hls:1.8.0'
        force 'androidx.media3:media3-exoplayer-dash:1.8.0'
        force 'androidx.media3:media3-exoplayer-rtsp:1.8.0'
        force 'androidx.media3:media3-exoplayer-smoothstreaming:1.8.0'
        force 'androidx.media3:media3-datasource:1.8.0'
        force 'androidx.media3:media3-datasource-okhttp:1.8.0'
        force 'androidx.media3:media3-common:1.8.0'
        force 'androidx.media3:media3-session:1.8.0'
        force 'androidx.media3:media3-ui:1.8.0'
        force 'androidx.media3:media3-extractor:1.8.0'
        force 'androidx.media3:media3-decoder:1.8.0'
    }
}
`;
    }
    return config;
  });
};