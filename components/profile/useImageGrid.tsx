import { Ionicons } from "@expo/vector-icons";

import { FasterImageView } from '@rraut/react-native-faster-image';
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ListRenderItem,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
    useWindowDimensions
} from "react-native";
import { Pressable } from "react-native-gesture-handler";
import TurboImage from "react-native-turbo-image";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { Media } from "../../types/media";
import { ShimmerEffect } from "../shimmer/Shimmer";
import QuickPreviewModal from "./QuickPreviewModal";

// TurboImage cache policy - use dataCache for aggressive local caching
// This ignores server cache-control headers and caches everything locally
const IMAGE_CACHE_POLICY = "dataCache" as const;

// Constants
const SPACING = 1;
const NUM_COLUMNS = 3;

// Types for grid data
type GridItemType =
    | { type: 'media'; item: Media; flatIndex: number }
    | { type: 'shimmer'; flatIndex: number };

interface UseImageGridOptions {
    photos?: Media[];
    onVideoPress?: (video: Media) => void;
    onImagePress?: (visible: boolean, index: number) => void;
    loading?: boolean;
    fetchingMore?: boolean;
}

const processMediaToFlat = (media: Media[]): { gridData: GridItemType[]; sortedUrls: string[] } => {
    if (!media || media.length === 0) {
        return { gridData: [], sortedUrls: [] };
    }

    // Sort by created_at (newest first)
    const sorted = [...media].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Only collect URLs for images for Galeria
    const sortedUrls = sorted.filter(m => !m.type.toLowerCase().includes('video')).map(m => m.url);
    const gridData: GridItemType[] = sorted.map((item, index) => ({
        type: 'media',
        item,
        flatIndex: index,
    }));

    return { gridData, sortedUrls };
};

// Separate component for video grid items - allows using hooks for thumbnail generation
interface VideoGridItemProps {
    mediaItem: Media;
    videoStyle: ViewStyle;
    marginRight: number;
    placeholderImageVideo: string;
    onPress: () => void;
    onLongPress: () => void;
    onPressOut: () => void;
}

const VideoGridItem: React.FC<VideoGridItemProps> = React.memo(({
    mediaItem,
    videoStyle,
    marginRight,
    placeholderImageVideo,
    onPress,
    onLongPress,
    onPressOut,
}) => {
    return (
        <TouchableOpacity
            key={mediaItem.id}
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                videoStyle,
                { marginRight, justifyContent: 'center', alignItems: 'center' }
            ]}
        >
            <FasterImageView
                source={{ uri: mediaItem.thumbnail_url || mediaItem.url, resizeMode: 'cover' }}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.overlay}>
                <Ionicons name="play" size={24} color="white" />
            </View>
        </TouchableOpacity>
    );
});

export const useImageGrid = (options: UseImageGridOptions = {}) => {
    const {
        photos,
        onVideoPress,
        onImagePress,
        loading = false,
        fetchingMore = false
    } = options;

    const [gridData, setGridData] = useState<GridItemType[]>([]);
    const [sortedUrls, setSortedUrls] = useState<string[]>([]);
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { width: screenWidth } = useWindowDimensions();
    const placeholderImageVideo = 'https://placehold.net/3-600x800.png';
    const placeholderImage = 'https://placehold.net/default.png';

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    const handleLongPress = useCallback((url: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPreviewUrl(url);
        setIsPreviewVisible(true);
    }, []);

    const handlePressOut = useCallback(() => {
        setIsPreviewVisible(false);
    }, []);

    // Calculate item size for estimatedItemSize
    const itemWidth = (screenWidth - SPACING * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

    const imageStyle = useMemo(
        () => ({
            flex: 1,
            aspectRatio: 1,
            margin: SPACING / 2,
            borderRadius: 0,
            backgroundColor: colors.card,
        }),
        [colors.card]
    );

    const videoStyle = useMemo(
        () => ({
            flex: 1,
            aspectRatio: 1 / 1.7,
            margin: SPACING / 2,
            backgroundColor: colors.card,
            overflow: 'hidden' as const,
        }),
        [colors.card]
    );


    // Process photos from profile data and prefetch images
    useEffect(() => {
        try {
            const mediaList = photos || [];
            const result = processMediaToFlat(mediaList);

            let finalGridData: GridItemType[] = result.gridData;

            if (loading && mediaList.length === 0) {
                // Initial loading state - show shimmers (NUM_COLUMNS * 2 rows)
                finalGridData = Array.from({ length: NUM_COLUMNS * 2 }).map((_, index) => ({
                    type: 'shimmer' as const,
                    flatIndex: index,
                }));
            } else if (fetchingMore) {
                // Appending loading state - add shimmer cells
                const shimmerItems: GridItemType[] = Array.from({ length: NUM_COLUMNS }).map((_, i) => ({
                    type: 'shimmer' as const,
                    flatIndex: -(i + 1),
                }));
                finalGridData = [...finalGridData, ...shimmerItems];
            }

            setSortedUrls(result.sortedUrls);
            setGridData(finalGridData);

            // Prefetch images for faster grid loading
            if (result.sortedUrls.length > 0) {
                const urlsToPreload = result.sortedUrls.slice(0, 12); // Prefetch first 12 images
                TurboImage.prefetch(urlsToPreload.map(uri => ({ uri })));
            }
        } catch (error) {
            console.error("Error processing media:", error);
        }
    }, [photos, loading, fetchingMore]);

    // Render items
    const renderItem: ListRenderItem<GridItemType> = useCallback(({ item }) => {
        if (item.type === 'shimmer') {
            const isVideoGrid = onVideoPress !== undefined;
            const style = isVideoGrid ? videoStyle : imageStyle;

            return (
                <View style={[style, { backgroundColor: colors.card }]}>
                    <ShimmerEffect
                        isLoading={true}
                        style={StyleSheet.absoluteFill}
                    />
                </View>
            );
        }

        const mediaItem = item.item;
        const isVideo = mediaItem.type.toLowerCase().includes('video');
        const imageUrl = mediaItem.thumbnail_url || mediaItem.url || placeholderImage;

        if (isVideo) {
            return (
                <VideoGridItem
                    key={mediaItem.id}
                    mediaItem={mediaItem}
                    videoStyle={videoStyle}
                    marginRight={0}
                    placeholderImageVideo={placeholderImageVideo}
                    onPress={() => onVideoPress?.(mediaItem)}
                    onLongPress={() => handleLongPress(mediaItem.thumbnail_url || mediaItem.url)}
                    onPressOut={handlePressOut}
                />
            );
        }

        return (
            <Pressable
                key={mediaItem.id}
                onPress={() => onImagePress?.(true, item.flatIndex)}
                onLongPress={() => handleLongPress(mediaItem.url)}
                onPressOut={handlePressOut}
                delayLongPress={300}
            >
                <TurboImage
                    source={{ uri: imageUrl }}
                    style={imageStyle}
                    resizeMode="cover"
                    cachePolicy={IMAGE_CACHE_POLICY}
                    fadeDuration={150}
                />
            </Pressable>
        );
    }, [imageStyle, videoStyle, onVideoPress, onImagePress, handleLongPress, handlePressOut, colors.card]);

    const keyExtractor = useCallback((item: GridItemType, index: number): string => {
        if (item.type === 'shimmer') return `shimmer-${index}`;
        return `media-${item.item.id}`;
    }, []);

    // Estimated item size for FlashList performance
    const estimatedItemSize = onVideoPress ? (itemWidth * 1.7) : itemWidth;

    // FlatList optimization props
    const flatListProps = useMemo(() => ({
        removeClippedSubviews: true,
        maxToRenderPerBatch: 8,
        updateCellsBatchingPeriod: 50,
        windowSize: 5,
        initialNumToRender: NUM_COLUMNS * 3,
    }), []);

    return {
        gridData,
        sortedUrls,
        numColumns: NUM_COLUMNS,
        estimatedItemSize,
        renderItem,
        keyExtractor,
        contentContainerStyle: styles.listContent,
        flatListProps,
        renderQuickPreview: () => (
            <QuickPreviewModal
                visible={isPreviewVisible}
                imageUrl={previewUrl}
                onClose={() => setIsPreviewVisible(false)}
            />
        )
    };
};

const styles = StyleSheet.create({
    listContent: {
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default useImageGrid;
