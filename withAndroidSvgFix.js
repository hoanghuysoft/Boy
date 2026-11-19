const path = require('path');
const expoDir = path.dirname(require.resolve('expo/package.json'));
const { withAppBuildGradle } = require(require.resolve('@expo/config-plugins', { paths: [expoDir] }));

// expo-video 58.0.14 / expo-audio 58.0.12 require Media3 1.9.1.
// expo-media-viewer hardcodes 1.5.1 which causes AbstractMethodError at runtime.
// Force 1.9.1 across all configurations so the runtime interface matches what expo-video compiled against.
const MEDIA3_VERSION = '1.9.1';

module.exports = function withAndroidBuildFixes(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      // Remove any previous version of this block to avoid duplicates on re-runs
      config.modResults.contents = config.modResults.contents.replace(
        /\/\/ \[withAndroidSvgFix\][\s\S]*?\/\/ \[\/withAndroidSvgFix\]/g,
        ''
      );

      config.modResults.contents += `
// [withAndroidSvgFix]
// Force Media3 ${MEDIA3_VERSION} across all modules.
// expo-video requires 1.9.0; expo-media-viewer pins 1.5.1 which causes
// AbstractMethodError: LoadControl.getAllocator() at runtime.
configurations.all {
    resolutionStrategy {
        force 'androidx.media3:media3-exoplayer:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-exoplayer-hls:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-exoplayer-dash:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-exoplayer-rtsp:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-exoplayer-smoothstreaming:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-datasource:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-datasource-okhttp:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-common:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-session:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-ui:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-extractor:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-decoder:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-container:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-effect:${MEDIA3_VERSION}'
        force 'androidx.media3:media3-transformer:${MEDIA3_VERSION}'
    }
}
// [/withAndroidSvgFix]
`;
    }
    return config;
  });
};