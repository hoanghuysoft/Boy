import { GalleryOverlay } from '@/components/gallery/GalleryOverlay';
import WallpaperOverlay from '@/components/WallpaperOverlay';
import { getOrDownloadFile } from '@/services/fileCacheUtils';
import { Media } from '@/types/media';
import { ProfileMusic } from '@/types/profilemusic';
import { Directory, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useRef, useState } from 'react';
import { Modal, StatusBar, ToastAndroid } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { Gallery, stackTransition, type GalleryRefType } from 'react-native-zoom-toolkit';
import GalleryImage from './GalleryImage';

interface ProfileGalleryModalContentProps {
    imagesUrl: string[];
    photos: Media[];
    music?: ProfileMusic[];
    initialIndex: number;
    onClose: () => void;
    profileName?: string;
    isVerified?: boolean;
}

// Inner component that uses the Gallery from react-native-zoom-toolkit
const ProfileGalleryModalContent: React.FC<ProfileGalleryModalContentProps> = ({
    imagesUrl,
    photos,
    music,
    initialIndex,
    onClose,
    profileName,
    isVerified,
}) => {
    const router = useRouter();
    const ref = useRef<GalleryRefType>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isWallpaperVisible, setIsWallpaperVisible] = useState(false);
    const destination = new Directory(Paths.cache, 'images');

    const currentPhoto = photos[currentIndex];
    const currentMusic = music?.[0];

    const handlePoster = () => {
        if (currentPhoto?.url) {
            setIsWallpaperVisible(true);
        }
    };

    const renderItem = useCallback(
        (item: string, index: number) => (
            <GalleryImage
                uri={item}
                index={index}
                blurhash={photos[index]?.blurhash}
            />
        ),
        [photos],
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
            const localFile = await getOrDownloadFile(remoteUrl, destination, 'image.jpg');
            const asset = await MediaLibrary.createAssetAsync(localFile.uri);

            await MediaLibrary.createAlbumAsync('WeLove', asset, false);

            ToastAndroid.show("Image saved to gallery!", ToastAndroid.SHORT);
        } catch (error) {
            console.error(error);
            ToastAndroid.show("Failed to save image.", ToastAndroid.SHORT);
        }
    };

    const onShare = async (imageUrl: string) => {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            alert("Sharing is not available on this platform");
            return;
        }

        try {
            const localFile = await getOrDownloadFile(imageUrl, destination, 'image.jpg');
            await Sharing.shareAsync(localFile.uri);
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
                profileName={profileName}
                caption={currentPhoto?.caption ?? undefined}
                showBottomBar={true}
                showDownload={true}
                onShare={() => {
                    if (currentPhoto?.url) {
                        onShare(currentPhoto.url);
                    }
                }}
                onPoster={handlePoster}
                onDownload={() => {
                    if (currentPhoto?.url) {
                        saveRemoteImage(currentPhoto.url);
                    }
                }}
                isVerified={isVerified}
            />
            <WallpaperOverlay
                isVisible={isWallpaperVisible}
                url={currentPhoto?.url ?? ''}
                onClose={() => setIsWallpaperVisible(false)}
            />
        </GestureHandlerRootView>
    );
};

interface ProfileGalleryModalProps {
    visible: boolean;
    photos: Media[];
    music?: ProfileMusic[];
    initialIndex: number;
    onClose: () => void;
    profileName?: string;
    isVerified?: boolean;
}

// Main Profile Gallery Modal component
export const ProfileGalleryModal: React.FC<ProfileGalleryModalProps> = ({
    visible,
    photos,
    music,
    initialIndex,
    onClose,
    profileName,
    isVerified,
}) => {
    const imagesUrl = photos.map(p => p.url);

    if (!visible || photos.length === 0) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <ProfileGalleryModalContent
                imagesUrl={imagesUrl}
                photos={photos}
                music={music}
                initialIndex={initialIndex}
                onClose={onClose}
                profileName={profileName}
                isVerified={isVerified}
            />
        </Modal>
    );
};

export default ProfileGalleryModal;
