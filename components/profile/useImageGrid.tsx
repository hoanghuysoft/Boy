import FastImage from "@d11/react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";

import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ListRenderItem,
    StyleSheet,
    TouchableOpacity,
    View,
    useWindowDimensions
} from "react-native";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { Media } from "../../types/media";
import { ShimmerEffect } from "../shimmer/Shimmer";
import QuickPreviewModal from "./QuickPreviewModal";

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
            borderRadius: 5,
            backgroundColor: colors.card,
            overflow: 'hidden' as const,
        }),
        [itemWidth, colors.card]
    );


    // Process photos from profile data
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
                    const content = (
                        <FastImage
                            source={{ uri: isVideo ? (mediaItem.thumbnail_url || mediaItem.url) : mediaItem.url }}
                            style={[
                                imageStyle,
                                { marginRight: i === item.items.length - 1 ? 0 : SPACING }
                            ]}
                            resizeMode={FastImage.resizeMode.cover}
                        />
                    );

                    if (isVideo) {
                        return (
                            <TouchableOpacity
                                key={mediaItem.id}
                                activeOpacity={0.7}
                                onPress={() => onVideoPress?.(mediaItem)}
                                onLongPress={() => handleLongPress(mediaItem.thumbnail_url || mediaItem.url)}
                                onPressOut={handlePressOut}
                                delayLongPress={300}
                                style={[
                                    videoStyle,
                                    { marginRight: i === item.items.length - 1 ? 0 : SPACING, justifyContent: 'center', alignItems: 'center' }
                                ]}
                            >
                                <FastImage
                                    source={{ uri: mediaItem.thumbnail_url || mediaItem.url, }}
                                    style={StyleSheet.absoluteFill}
                                    resizeMode={FastImage.resizeMode.cover}
                                />
                                <View style={styles.overlay}>
                                    <Ionicons name="play" size={24} color="white" />
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={mediaItem.id}
                            activeOpacity={0.8}
                            onPress={() => onImagePress?.(true, item.startIndex + i)}
                            onLongPress={() => handleLongPress(mediaItem.url)}
                            onPressOut={handlePressOut}
                            delayLongPress={300}
                        >
                            {content}
                        </TouchableOpacity>
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
