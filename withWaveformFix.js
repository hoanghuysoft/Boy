const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to patch @kaannn/react-native-waveform
 *
 * Fixes Kotlin 2.x build error in AudioWaveViewManager.kt:
 *   "Only safe (?.) or non-null asserted (!!.) calls are allowed on a nullable receiver of type 'ReadableArray?'"
 *
 * Root cause: `samples.asArray()` returns `ReadableArray?` (nullable).
 * Kotlin 2.x rejects calling `.size()` / `.getInt()` on it without a null check.
 *
 * Fix: replace `val array = samples.asArray()` with `val array = samples.asArray() ?: return`
 * so Kotlin's smart-cast makes `array` non-null for the rest of the block.
 */
const withWaveformFix = (config) => {
    return withDangerousMod(config, [
        'android',
        async (config) => {
            const fileRelativePath =
                'node_modules/@kaannn/react-native-waveform/android/src/main/java/com/audiowave/AudioWaveViewManager.kt';
            const filePath = path.resolve(config.modRequest.projectRoot, fileRelativePath);

            if (!fs.existsSync(filePath)) {
                console.warn(`[WaveformFix] Could not find file at ${filePath}. Skipping patch.`);
                return config;
            }

            let content = fs.readFileSync(filePath, 'utf-8');

            const BROKEN = 'val array = samples.asArray()';
            const FIXED  = 'val array = samples.asArray() ?: return';

            if (content.includes(FIXED)) {
                console.log('ℹ️  [WaveformFix] Already patched. Skipping.');
                return config;
            }

            if (!content.includes(BROKEN)) {
                console.warn('[WaveformFix] Could not find target line. File may have changed. Skipping.');
                return config;
            }

            content = content.replace(BROKEN, FIXED);
            fs.writeFileSync(filePath, content, 'utf-8');
            console.log('✅ [WaveformFix] Successfully patched AudioWaveViewManager.kt');

            return config;
        },
    ]);
};

module.exports = withWaveformFix;