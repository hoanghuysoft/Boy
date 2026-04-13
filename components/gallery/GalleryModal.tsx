import { GalleryOverlay } from '@/components/gallery/GalleryOverlay';
import WallpaperOverlay from '@/components/WallpaperOverlay';
import { useGalleryStore } from '@/stores/gallery';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef, useState } from 'react';
import { Modal, StatusBar, ToastAndroid } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { Gallery, stackTransition, type GalleryRefType } from 'react-native-zoom-toolkit';
import type { GalleryImage as GalleryImageMeta } from '@/stores/gallery';
import GalleryImage from './GalleryImage';

interface GalleryModalContentProps {
    imagesUrl: string[];
    galleryImages: GalleryImageMeta[];
    initialIndex: number;
    onClose: () => void;
    showDownload?: boolean;
}

// Inner component that uses the Gallery from react-native-zoom-toolkit
const GalleryModalContent: React.FC<GalleryModalContentProps> = ({
    imagesUrl,
    galleryImages,
    initialIndex,
    onClose,
    showDownload = false,
}) => {
    const ref = useRef<GalleryRefType>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isWallpaperVisible, setIsWallpaperVisible] = useState(false);

    const currentImage = galleryImages[currentIndex];

    const handlePoster = () => {
        if (currentImage?.uri) {
            setIsWallpaperVisible(true);
        }
    };

    const renderItem = useCallback(
        (item: string, index: number) => (
            <GalleryImage
                uri={item}
                index={index}
                blurhash={galleryImages[index]?.blurhash}
            />
        ),
        [galleryImages],
    );

    const keyExtractor = useCallback((item: string, index: number) => {
        return `${item}-${index}`;
    }, []);

    const onIndexChange = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    const onTap = useCallback(() => {
        // Single tap can toggle overlay visibility if needed
    }, []);

    const saveRemoteImage = async (remoteUrl: string) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                ToastAndroid.show("Permission Denied! We need access to your photos to save images.", ToastAndroid.SHORT);
                return;
            }

            const fileUri = FileSystem.cacheDirectory + 'downloaded_image.jpg';

            const downloadResult = await FileSystem.downloadAsync(remoteUrl, fileUri);

            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

            await MediaLibrary.createAlbumAsync('MyApp Downloads', asset, false);

            ToastAndroid.show("Image saved to gallery!", ToastAndroid.SHORT);
        } catch (error) {
            console.error(error);
            ToastAndroid.show("Failed to save image.", ToastAndroid.SHORT);
        }
    };

    const onShare = async (imageUrl: string) => {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            ToastAndroid.show("Sharing is not available on this platform", ToastAndroid.SHORT);
            return;
        }

        try {
            const filename = imageUrl.split('/').pop()?.split('?')[0] || 'shared_image.jpg';
            const fileUri = `${FileSystem.cacheDirectory}${filename}`;

            const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

            await Sharing.shareAsync(downloadResult.uri);
        } catch (error) {
            console.error('Error sharing image:', error);
            alert("An error occurred while sharing the image");
        }
    };

    const transition = useCallback(stackTransition, []);

    return (
        <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar hidden />
            <Gallery
                ref={ref}
                data={imagesUrl}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                initialIndex={initialIndex}
                onIndexChange={onIndexChange}
                onTap={onTap}
                maxScale={3}
                customTransition={transition}
                zoomEnabled={true}
                onVerticalPull={() => {
                    'worklet';
                    scheduleOnRN(onClose);
                }}
            />
            <GalleryOverlay
                currentIndex={currentIndex}
                totalCount={imagesUrl.length}
                onClose={onClose}
                profileName={currentImage?.profileName}
                caption={currentImage?.caption}
                showBottomBar={true}
                showDownload={showDownload}
                onDownload={() => {
                    if (currentImage?.uri) {
                        saveRemoteImage(currentImage.uri);
                    }
                }}
                onShare={() => {
                    if (currentImage?.uri) {
                        onShare(currentImage.uri);
                    }
                }}
                onPoster={handlePoster}
                isVerified={currentImage?.isVerified}
            />
            <WallpaperOverlay
                isVisible={isWallpaperVisible}
                url={currentImage?.uri ?? ''}
                onClose={() => setIsWallpaperVisible(false)}
            />
        </GestureHandlerRootView>
    );
};

// Main Gallery Modal component that wraps the content in a Modal
export const GalleryModal: React.FC = () => {
    const { isVisible, images, imagesUrl, initialIndex, closeGallery } = useGalleryStore();

    if (!isVisible) return null;

    return (
        <Modal visible={isVisible} transparent animationType="fade" onRequestClose={closeGallery}>
            <GalleryModalContent
                imagesUrl={imagesUrl}
                galleryImages={images}
                initialIndex={initialIndex}
                onClose={closeGallery}
                showDownload={true}
            />
        </Modal>
    );
};

export default GalleryModal;
