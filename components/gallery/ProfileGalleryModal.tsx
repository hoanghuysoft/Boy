import { GalleryOverlay } from '@/components/gallery/GalleryOverlay';
import { renderImage } from '@/components/profile/FastImageGalleryComponent';
import { Media } from '@/types/media';
import { ProfileMusic } from '@/types/profilemusic';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, View } from 'react-native';
import { GestureViewer, useGestureViewerState } from 'react-native-gesture-image-viewer';

interface ProfileGalleryModalContentProps {
    imagesUrl: string[];
    photos: Media[];
    music?: ProfileMusic[];
    initialIndex: number;
    onClose: () => void;
    profileName?: string;
    isVerified?: boolean;
}

// Inner component that uses the useGestureViewerState hook
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
    const { currentIndex, totalCount } = useGestureViewerState('profile-gallery');

    const currentPhoto = photos[currentIndex];
    const currentMusic = music?.[0];

    const handlePoster = () => {
        onClose();
        router.push({
            pathname: '/image_poster' as any,
            params: {
                imageUrl: currentPhoto?.url,
                name: profileName || '',
                description: currentPhoto?.caption || '',
                musicUrl: currentMusic?.preview_url || '',
                musicTitle: currentMusic ? `${currentMusic.artist} - ${currentMusic.title}` : '',
            }
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <GestureViewer
                id="profile-gallery"
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
                profileName={profileName}
                caption={currentPhoto?.caption ?? undefined}
                showBottomBar={true}
                showDownload={true}
                onShare={() => { }}
                onPoster={handlePoster}
                onDownload={() => { }}
                isVerified={isVerified}
            />
        </View>
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
        <Modal visible={visible} transparent onRequestClose={onClose}>
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
