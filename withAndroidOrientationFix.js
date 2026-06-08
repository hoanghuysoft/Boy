const {
  withAndroidManifest,
} = require('@expo/config-plugins');

/**
 * Two things this plugin does to MainActivity in AndroidManifest.xml:
 *
 * 1. Ensures the full set of configChanges required for in-process orientation
 *    handling are present, so Android does NOT recreate the Activity on rotate.
 *
 * 2. REMOVES android:screenOrientation from MainActivity.
 *    This is the critical piece: when screenOrientation is declared in the manifest
 *    (Expo sets it to "portrait" from app.json "orientation": "portrait"), Android
 *    ignores runtime configChanges for orientation — calling lockAsync(LANDSCAPE)
 *    causes a full Activity recreation, which wipes the RN navigation stack and
 *    produces a gray screen + back-button-exits-app.
 *    expo-screen-orientation is designed to manage orientation entirely at runtime;
 *    it doesn't need (and conflicts with) a manifest-level orientation lock.
 *
 * References:
 *   https://developer.android.com/guide/topics/resources/runtime-changes
 *   https://docs.expo.dev/versions/latest/sdk/screen-orientation/
 */
module.exports = function withAndroidOrientationFix(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application?.[0];
    if (!mainApplication) return config;

    const activities = mainApplication.activity ?? [];
    const mainActivity = activities.find(
      (activity) =>
        activity.$['android:name'] === '.MainActivity' ||
        activity.$['android:name'] === 'com.facebook.react.ReactActivity'
    );

    if (!mainActivity) return config;

    // 1. Ensure all required configChanges are present
    const requiredChanges = [
      'keyboard',
      'keyboardHidden',
      'orientation',
      'screenLayout',
      'screenSize',
      'smallestScreenSize',
      'uiMode',
    ];

    const existing = (mainActivity.$['android:configChanges'] ?? '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);

    const merged = Array.from(new Set([...existing, ...requiredChanges]));
    mainActivity.$['android:configChanges'] = merged.join('|');

    // 2. Remove manifest-level orientation lock — this is what causes Activity
    //    recreation when expo-screen-orientation calls lockAsync().
    //    The library handles orientation at runtime; it doesn't need this attribute.
    delete mainActivity.$['android:screenOrientation'];

    return config;
  });
};
