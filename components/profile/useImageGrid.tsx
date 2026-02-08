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
const SPACING = 2;
const NUM_COLUMNS = 3;
const CONTAINER_PADDING = 16;

// Types for grid data
type GridItemType =
    | { type: 'row'; items: Media[]; startIndex: number }
    | { type: 'shimmer'; startIndex: number };

interface UseImageGridOptions {
    containerPadding?: number;
    photos?: Media[];
    onVideoPress?: (video: Media) => void;
    onImagePress?: (visible: boolean, index: number) => void;
    loading?: boolean;
    fetchingMore?: boolean;
}

const processMediaToGrid = (media: Media[], numColumns: number): { gridData: GridItemType[]; sortedUrls: string[] } => {
    if (!media || media.length === 0) {
        return { gridData: [], sortedUrls: [] };
    }

    // Sort by created_at (newest first)
    const sorted = [...media].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Only collect URLs for images for Galeria
    const sortedUrls = sorted.filter(m => !m.type.toLowerCase().includes('video')).map(m => m.url);
    const gridData: GridItemType[] = [];

    for (let i = 0; i < sorted.length; i += numColumns) {
        const chunk = sorted.slice(i, i + numColumns);
        gridData.push({
            type: 'row',
            items: chunk,
            startIndex: i
        });
    }

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
        containerPadding = CONTAINER_PADDING,
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

    // Calculate item width
    const availableWidth = screenWidth - (containerPadding * 2) - (SPACING * 2);
    const itemWidth = (availableWidth / NUM_COLUMNS) - (SPACING * (NUM_COLUMNS - 1) / NUM_COLUMNS);
    const rowHeight = itemWidth + SPACING;

    const imageStyle = useMemo(
        () => ({
            width: itemWidth,
            height: itemWidth,
            marginRight: SPACING,
            marginBottom: SPACING,
            borderRadius: 0,
            backgroundColor: colors.card,
        }),
        [itemWidth, colors.card]
    );

    const videoStyle = useMemo(
        () => ({
            width: itemWidth,
            height: itemWidth * 1.7,
            marginRight: SPACING,
            marginBottom: SPACING,
            backgroundColor: colors.card,
            overflow: 'hidden' as const,
        }),
        [itemWidth, colors.card]
    );


    // Process photos from profile data and prefetch images
    useEffect(() => {
        try {
            const mediaList = photos || [];
            const result = processMediaToGrid(mediaList, NUM_COLUMNS);

            let finalGridData: GridItemType[] = result.gridData;

            if (loading && mediaList.length === 0) {
                // Initial loading state - show full screen of shimmers
                finalGridData = Array.from({ length: 6 }).map((_, index) => ({
                    type: 'shimmer',
                    startIndex: index // fake index for key
                }));
            } else if (fetchingMore) {
                // Appending loading state - add one row of shimmers
                finalGridData = [
                    ...finalGridData,
                    { type: 'shimmer', startIndex: -1 }
                ];
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
                <View style={[common.row, { paddingHorizontal: containerPadding }]}>
                    {Array.from({ length: NUM_COLUMNS }).map((_, i) => (
                        <View
                            key={`shimmer-${i}`}
                            style={[
                                style,
                                {
                                    marginRight: i === NUM_COLUMNS - 1 ? 0 : SPACING,
                                    backgroundColor: colors.card
                                }
                            ]}
                        >
                            <ShimmerEffect
                                isLoading={true}
                                style={StyleSheet.absoluteFill}
                            />
                        </View>
                    ))}
                </View>
            );
        }

        return (
            <View style={[common.row, { paddingHorizontal: containerPadding }]}>
                {item.items.map((mediaItem, i) => {
                    const isVideo = mediaItem.type.toLowerCase().includes('video');
                    const imageUrl = isVideo ? (mediaItem.thumbnail_url || mediaItem.url || placeholderImage) : mediaItem.url || placeholderImage;
                    const content = (
                        <TurboImage
                            key={mediaItem.id}
                            source={{ uri: imageUrl }}
                            style={[
                                imageStyle,
                                { marginRight: i === item.items.length - 1 ? 0 : SPACING }
                            ]}
                            resizeMode="cover"
                            cachePolicy={IMAGE_CACHE_POLICY}
                            fadeDuration={150}
                        />
                    );

                    if (isVideo) {
                        return (
                            <VideoGridItem
                                key={mediaItem.id}
                                mediaItem={mediaItem}
                                videoStyle={videoStyle}
                                marginRight={i === item.items.length - 1 ? 0 : SPACING}
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
                            onPress={() => onImagePress?.(true, item.startIndex + i)}
                            onLongPress={() => handleLongPress(mediaItem.url)}
                            onPressOut={handlePressOut}
                            delayLongPress={300}
                        >
                            {content}
                        </Pressable>
                    );
                })}
                {Array.from({ length: NUM_COLUMNS - item.items.length }).map((_, i) => (
                    <View
                        key={`empty-${i}`}
                        style={[
                            imageStyle,
                            {
                                marginRight: (i === NUM_COLUMNS - item.items.length - 1) ? 0 : SPACING,
                                backgroundColor: 'transparent'
                            }
                        ]}
                    />
                ))}
            </View>
        );
    }, [imageStyle, videoStyle, common, onVideoPress, onImagePress, handleLongPress, handlePressOut, containerPadding, colors.card]);

    const keyExtractor = useCallback((item: GridItemType, index: number): string => {
        if (item.type === 'shimmer') return `shimmer-${index}`;
        return `r-${item.startIndex}`;
    }, []);

    // Simple getItemLayout since all rows are same height now
    const getItemLayout = useCallback((data: ArrayLike<GridItemType> | null | undefined, index: number) => {
        const height = onVideoPress ? (itemWidth * 1.7 + SPACING) : rowHeight;
        return { length: height, offset: height * index, index };
    }, [rowHeight, itemWidth, onVideoPress]);

    // FlatList optimization props
    const flatListProps = useMemo(() => ({
        removeClippedSubviews: true,
        maxToRenderPerBatch: 6,
        updateCellsBatchingPeriod: 50,
        windowSize: 5,
        initialNumToRender: 8,
        getItemLayout,
    }), [getItemLayout]);

    return {
        gridData,
        sortedUrls,
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
