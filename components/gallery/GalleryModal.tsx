import { GalleryOverlay } from '@/components/gallery/GalleryOverlay';
import { renderImage } from '@/components/profile/FastImageGalleryComponent';
import { useGalleryStore } from '@/stores/gallery';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, View } from 'react-native';
import { GestureViewer, useGestureViewerState } from 'react-native-gesture-image-viewer';

interface GalleryImage {
    uri: string;
    caption?: string;
    profileName?: string;
    isVerified?: boolean;
    musicUrl?: string;
    musicTitle?: string;
}

interface GalleryModalContentProps {
    imagesUrl: string[];
    galleryImages: GalleryImage[];
    initialIndex: number;
    onClose: () => void;
    showDownload?: boolean;
}

// Inner component that uses the useGestureViewerState hook
const GalleryModalContent: React.FC<GalleryModalContentProps> = ({
    imagesUrl,
    galleryImages,
    initialIndex,
    onClose,
    showDownload = false,
}) => {
    const router = useRouter();
    const { currentIndex, totalCount } = useGestureViewerState();

    const currentImage = galleryImages[currentIndex];

    const handlePoster = () => {
        onClose();
        router.push({
            pathname: '/image_poster' as any,
            params: {
                imageUrl: currentImage?.uri,
                name: currentImage?.profileName || '',
                description: currentImage?.caption || '',
                musicUrl: currentImage?.musicUrl || '',
                musicTitle: currentImage?.musicTitle || '',
            }
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <GestureViewer
                data={imagesUrl}
                renderItem={renderImage}
                ListComponent={FlashList}
                onDismiss={onClose}
                enableLoop
                initialIndex={initialIndex}
            />
            <GalleryOverlay
                currentIndex={currentIndex}
                totalCount={totalCount}
                onClose={onClose}
                profileName={currentImage?.profileName}
                caption={currentImage?.caption}
                showBottomBar={true}
                showDownload={showDownload}
                onShare={() => { }}
                onPoster={handlePoster}
                isVerified={currentImage?.isVerified}
            />
        </View>
    );
};

// Main Gallery Modal component that wraps the content in a Modal
export const GalleryModal: React.FC = () => {
    const { isVisible, images, imagesUrl, initialIndex, closeGallery } = useGalleryStore();

    if (!isVisible) return null;

    return (
        <Modal visible={isVisible} transparent onRequestClose={closeGallery}>
            <GalleryModalContent
                imagesUrl={imagesUrl}
                galleryImages={images}
                initialIndex={initialIndex}
                onClose={closeGallery}
                showDownload={false}
            />
        </Modal>
    );
};

export default GalleryModal;
