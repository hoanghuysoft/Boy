import { GalleryOverlay } from '@/components/gallery/GalleryOverlay';
import WallpaperOverlay from '@/components/WallpaperOverlay';
import { getOrDownloadFile } from '@/services/fileCacheUtils';
import type { GalleryImage as GalleryImageMeta, GallerySourceRect } from '@/stores/gallery';
import { useGalleryStore } from '@/stores/gallery';
import { openInGoogleLens } from '@/utils/openInGoogleLens';
import { Directory, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Album, Asset } from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useToast } from "heroui-native/toast";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, StatusBar, StyleSheet, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { resolveBlurhash } from './fallbackBlurhash';
import { GalleryBackdrop } from './GalleryBackdrop';
import GalleryImage from './GalleryImage';
import { getCachedImageDimension } from './imageDimensionCache';
import { fitContainer, ZoomableGallery, type ZoomableGalleryRef } from './ZoomableGallery';

interface GalleryModalContentProps {
    galleryRef: React.RefObject<ZoomableGalleryRef | null>;
    wallpaperOpenRef: React.MutableRefObject<boolean>;
    imagesUrl: string[];
    galleryImages: GalleryImageMeta[];
    initialIndex: number;
    sourceRect: GallerySourceRect | null;
    sourcePostId: string | null;
    onIndexSync: ((index: number) => void) | null;
    setHiddenSource: (sourceKey: string | null, postId?: string | null) => void;
    onClose: () => void;
    showDownload?: boolean;
}

const GalleryModalContent: React.FC<GalleryModalContentProps> = ({
    galleryRef,
    wallpaperOpenRef,
    imagesUrl,
    galleryImages,
    initialIndex,
    sourceRect,
    sourcePostId,
    onIndexSync,
    setHiddenSource,
    onClose,
    showDownload = false,
}) => {
    const windowDims = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [hasSwiped, setHasSwiped] = useState(false);
    const [isWallpaperVisible, setIsWallpaperVisible] = useState(false);
    const destination = new Directory(Paths.cache, 'images');
    const { toast } = useToast();

    useEffect(() => {
        wallpaperOpenRef.current = isWallpaperVisible;
        return () => {
            wallpaperOpenRef.current = false;
        };
    }, [isWallpaperVisible, wallpaperOpenRef]);

    const backdropOpacity = useSharedValue(0);
    const overlayOpacity = useSharedValue(0);

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value,
    }));

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const sourceAspectRatio =
        sourceRect && sourceRect.height > 0
            ? sourceRect.width / sourceRect.height
            : undefined;

    const initialChildSize = useMemo(() => {
        const initialUri = imagesUrl[initialIndex];
        const cached = getCachedImageDimension(initialUri);
        const aspect = cached
            ? cached.width / cached.height
            : sourceAspectRatio ?? 1;
        return fitContainer(aspect, windowDims);
    }, [imagesUrl, initialIndex, sourceAspectRatio, windowDims]);

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
                fallbackAspectRatio={sourceAspectRatio}
            />
        ),
        [galleryImages, sourceAspectRatio],
    );

    const keyExtractor = useCallback((item: string, index: number) => {
        return `${item}-${index}`;
    }, []);

    const handleOpenAnimationStart = useCallback(() => {
        const key = galleryImages[initialIndex]?.sourceKey ?? null;
        if (key || sourcePostId) {
            setHiddenSource(key, sourcePostId);
        }
    }, [galleryImages, initialIndex, setHiddenSource, sourcePostId]);

    const onIndexChange = useCallback(
        (index: number) => {
            setHasSwiped(true);
            setCurrentIndex(index);
            const key = galleryImages[index]?.sourceKey ?? null;
            if (key || sourcePostId) {
                setHiddenSource(key, sourcePostId);
            }
            onIndexSync?.(index);
        },
        [galleryImages, onIndexSync, setHiddenSource, sourcePostId],
    );

    const handleBeforeDismissComplete = useCallback(() => {
        setHiddenSource(null, null);
    }, [setHiddenSource]);

    const handleClosePress = useCallback(() => {
        if (galleryRef.current) {
            galleryRef.current.dismiss();
        } else {
            onClose();
        }
    }, [galleryRef, onClose]);

    const onTap = useCallback(() => {
    }, []);

    const saveRemoteImage = async (remoteUrl: string) => {
        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                toast.show({ label: "Permission Denied!", description: "We need access to your photos to save images.", variant: "danger" });
                return;
            }

            const localFile = await getOrDownloadFile(remoteUrl, destination, 'image.jpg');
            const asset = await Asset.create(localFile.uri);

            await Album.create('WeLove Downloads', [asset]);

            toast.show({ label: "Success", description: "Image saved to gallery!", variant: "success" });
        } catch (error) {
            console.error(error);
            toast.show({ label: "Error", description: "Failed to save image.", variant: "danger" });
        }
    };

    const onShare = async (imageUrl: string) => {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            toast.show({ label: "Unavailable", description: "Sharing is not available on this platform", variant: "warning" });
            return;
        }

        try {
            const localFile = await getOrDownloadFile(imageUrl, destination, 'image.jpg');
            await Sharing.shareAsync(localFile.uri);
        } catch (error) {
            console.error('Error sharing image:', error);
            toast.show({ label: "Error", description: "An error occurred while sharing the image", variant: "danger" });
        }
    };

    const handleGoogleLens = async (imageUrl: string) => {
        try {
            const localFile = await getOrDownloadFile(imageUrl, destination, 'image.jpg');
            await openInGoogleLens(localFile.uri, imageUrl);
        } catch (error) {
            console.error('Error opening in Google Lens:', error);
            toast.show({ label: 'Unavailable', description: 'Could not open Google Lens on this device.', variant: 'warning' });
        }
    };

    const bgImage = galleryImages[currentIndex];
    const bgImageUri = imagesUrl[currentIndex];
    const bgBlurhash = resolveBlurhash(bgImage?.blurhash, bgImage?.uri);

    return (
        <GestureHandlerRootView style={styles.root}>
            <StatusBar barStyle="light-content" />
            <Animated.View
                style={[StyleSheet.absoluteFill, styles.backdropContainer, backdropStyle]}
                pointerEvents="none"
            >
                {bgImageUri && (
                    <GalleryBackdrop
                        blurhash={bgBlurhash}
                        transition={hasSwiped ? 350 : 0}
                    />
                )}
            </Animated.View>
            <ZoomableGallery
                ref={galleryRef}
                data={imagesUrl}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                initialIndex={initialIndex}
                onIndexChange={onIndexChange}
                onTap={onTap}
                maxScale={3}
                zoomEnabled={true}
                onDismiss={onClose}
                animateTransitions={true}
                sourceRect={sourceRect}
                initialChildSize={initialChildSize}
                backdropOpacity={backdropOpacity}
                overlayOpacity={overlayOpacity}
                onOpenAnimationStart={handleOpenAnimationStart}
                onBeforeDismissComplete={handleBeforeDismissComplete}
            />
            <Animated.View
                style={[StyleSheet.absoluteFill, overlayStyle]}
                pointerEvents="box-none"
            >
                <GalleryOverlay
                    currentIndex={currentIndex}
                    totalCount={imagesUrl.length}
                    onClose={handleClosePress}
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
                    onGoogleLens={() => {
                        if (currentImage?.uri) {
                            handleGoogleLens(currentImage.uri);
                        }
                    }}
                    isVerified={currentImage?.isVerified}
                />
            </Animated.View>
            <WallpaperOverlay
                isVisible={isWallpaperVisible}
                url={currentImage?.uri ?? ''}
                onClose={() => setIsWallpaperVisible(false)}
            />
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    backdropContainer: {
        backgroundColor: '#000',
    },
});

// Main Gallery Modal component that wraps the content in a Modal
export const GalleryModal: React.FC = () => {
    const {
        isVisible,
        images,
        imagesUrl,
        initialIndex,
        sourceRect,
        sourcePostId,
        onIndexSync,
        setHiddenSource,
        closeGallery,
    } = useGalleryStore();
    const galleryRef = useRef<ZoomableGalleryRef>(null);
    const wallpaperOpenRef = useRef(false);

    const handleRequestClose = useCallback(() => {
        if (wallpaperOpenRef.current) {
            return;
        }
        if (galleryRef.current) {
            galleryRef.current.dismiss();
        } else {
            closeGallery();
        }
    }, [closeGallery]);

    return (
        <Modal
            visible={isVisible}
            transparent
            statusBarTranslucent
            navigationBarTranslucent
            animationType="none"
            onRequestClose={handleRequestClose}
        >
            {isVisible && (
                <GalleryModalContent
                    galleryRef={galleryRef}
                    wallpaperOpenRef={wallpaperOpenRef}
                    imagesUrl={imagesUrl}
                    galleryImages={images}
                    initialIndex={initialIndex}
                    sourceRect={sourceRect}
                    sourcePostId={sourcePostId}
                    onIndexSync={onIndexSync}
                    setHiddenSource={setHiddenSource}
                    onClose={closeGallery}
                    showDownload={true}
                />
            )}
        </Modal>
    );
};

export default GalleryModal;
