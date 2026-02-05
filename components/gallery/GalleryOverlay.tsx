import { useThemeContext } from '@/context/ThemeContext';
import VerifiedIcon from '@/icons/verified';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface GalleryOverlayProps {
    /** Current image index (0-based) */
    currentIndex: number;
    /** Total number of images */
    totalCount: number;
    /** Callback when close button is pressed */
    onClose: () => void;
    /** Profile or author name to display at the bottom */
    profileName?: string;
    /** Caption for the current image */
    caption?: string;
    /** Whether to show the bottom bar with profile info */
    showBottomBar?: boolean;
    /** Whether to show the download button */
    showDownload?: boolean;
    /** Callback when share button is pressed */
    onShare?: () => void;
    /** Callback when download button is pressed */
    onDownload?: () => void;
    /** Callback when poster button is pressed */
    onPoster?: () => void;
    /** Whether the profile is verified */
    isVerified?: boolean;
}

export const GalleryOverlay: React.FC<GalleryOverlayProps> = ({
    currentIndex,
    totalCount,
    onClose,
    profileName,
    caption,
    showBottomBar = true,
    showDownload = true,
    onShare,
    onDownload,
    onPoster,
    isVerified,
}) => {
    const inset = useSafeAreaInsets();
    const { colors } = useThemeContext();

    return (
        <View style={styles.galleryOverlay} pointerEvents="box-none">
            {/* Top Bar */}
            <View style={[styles.galleryTopBar, { paddingTop: inset.top + 8 }]}>
                <TouchableOpacity
                    onPress={onClose}
                    style={[styles.galleryButton, styles.galleryButtonBg]}
                >
                    <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>

                <View style={styles.galleryPagination}>
                    <Text style={styles.galleryPaginationText}>
                        {currentIndex + 1} / {totalCount}
                    </Text>
                </View>

                <View style={styles.actionButtons}>
                    {onShare && (
                        <TouchableOpacity
                            onPress={onShare}
                            style={[styles.galleryButton, styles.galleryButtonBg]}
                        >
                            <Ionicons name="share-outline" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                    {onPoster && (
                        <TouchableOpacity
                            onPress={onPoster}
                            style={[styles.galleryButton, styles.galleryButtonBg]}
                        >
                            <Ionicons name="image" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                    {showDownload && onDownload && (
                        <TouchableOpacity
                            onPress={onDownload}
                            style={[styles.galleryButton, styles.galleryButtonBg]}
                        >
                            <Ionicons name="download-outline" size={20} color="white" />
                        </TouchableOpacity>
                    )}
                    {/* Placeholder to maintain spacing when no buttons */}
                    {!onShare && !showDownload && !onPoster && <View style={styles.galleryButton} />}
                </View>
            </View>

            {/* Bottom Bar */}
            {showBottomBar && (profileName || caption) && (
                <View style={[styles.galleryBottomBar, { paddingBottom: inset.bottom + 16 }]}>
                    {profileName && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.galleryProfileName}>{profileName}</Text>
                            {isVerified && <VerifiedIcon size={14} backgroundColor={colors.verify} />}
                        </View>
                    )}
                    {caption && (
                        <Text style={styles.galleryImageCaption} numberOfLines={3}>
                            {caption}
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    galleryOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    galleryTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    galleryButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    galleryButtonBg: {
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    galleryPagination: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    galleryPaginationText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    galleryBottomBar: {
        paddingHorizontal: 16,
        paddingTop: 16,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    galleryProfileName: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    galleryImageCaption: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 14,
        lineHeight: 20,
    },
});

export default GalleryOverlay;
