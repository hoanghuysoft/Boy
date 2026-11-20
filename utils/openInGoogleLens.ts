import { File } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

export async function openInGoogleLens(
    localImageUri: string,
    remoteImageUrl?: string,
): Promise<void> {
    const isPng = localImageUri.toLowerCase().endsWith('.png');
    const mimeType = isPng ? 'image/png' : 'image/jpeg';

    if (Platform.OS === 'android') {
        const contentUri = new File(localImageUri).contentUri;

        try {
            await IntentLauncher.startActivityAsync('com.google.android.apps.photos.SEARCH_IMAGE', {
                packageName: 'com.google.android.googlequicksearchbox',
                className: 'com.google.android.apps.lens.SearchImageActivity',
                category: 'android.intent.category.DEFAULT',
                data: contentUri,
                type: mimeType,
                flags: 1,
            });
            return;
        } catch {
            // Fall through to web Lens / share fallback if Google Lens activity is unavailable or restricted
        }

        if (remoteImageUrl) {
            await Linking.openURL(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(remoteImageUrl)}`);
            return;
        }
    } else if (remoteImageUrl) {
        await Linking.openURL(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(remoteImageUrl)}`);
        return;
    }

    if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localImageUri, {
            mimeType,
            UTI: isPng ? 'public.png' : 'public.jpeg',
        });
    }
}
