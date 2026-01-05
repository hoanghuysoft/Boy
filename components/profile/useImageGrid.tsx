import FastImage from "@d11/react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";
import { Galeria } from "@nandorojo/galeria";
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

// Constants
const SPACING = 2;
const NUM_COLUMNS = 3;
const CONTAINER_PADDING = 16;

// Types for grid data (only rows now)
type GridItemType = { type: 'row'; items: Media[]; startIndex: number };

interface UseImageGridOptions {
    containerPadding?: number;
    photos?: Media[];
    onVideoPress?: (video: Media) => void;
    onImagePress?: (visible: boolean, index: number) => void;
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
    const { containerPadding = CONTAINER_PADDING, photos, onVideoPress, onImagePress } = options;

    const [gridData, setGridData] = useState<GridItemType[]>([]);
    const [sortedUrls, setSortedUrls] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { width: screenWidth } = useWindowDimensions();

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
            borderRadius: 16,
            backgroundColor: colors.card,
            overflow: 'hidden' as const,
        }),
        [itemWidth, colors.card]
    );


    // Process photos from profile data
    useEffect(() => {
        setLoading(true);
        try {
            const mediaList = photos || [];
            const result = processMediaToGrid(mediaList, NUM_COLUMNS);
            setSortedUrls(result.sortedUrls);
            setGridData(result.gridData);
        } catch (error) {
            console.error("Error processing media:", error);
        } finally {
            setLoading(false);
        }
    }, [photos]);

    // Render items
    const renderItem: ListRenderItem<GridItemType> = useCallback(({ item }) => {
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
                                style={[
                                    videoStyle,
                                    { marginRight: i === item.items.length - 1 ? 0 : SPACING, justifyContent: 'center', alignItems: 'center' }
                                ]}
                            >
                                <FastImage
                                    source={{ uri: mediaItem.thumbnail_url || mediaItem.url }}
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
                        >
                            <Galeria.Image
                                index={item.startIndex + i}
                            >
                                {content}
                            </Galeria.Image>
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
    }, [imageStyle, common, onVideoPress]);

    const keyExtractor = useCallback((item: GridItemType): string => {
        return `r-${item.startIndex}`;
    }, []);

    // Simple getItemLayout since all rows are same height now
    const getItemLayout = useCallback((data: ArrayLike<GridItemType> | null | undefined, index: number) => {
        return { length: rowHeight, offset: rowHeight * index, index };
    }, [rowHeight]);

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
        loading,
        renderItem,
        keyExtractor,
        contentContainerStyle: styles.listContent,
        flatListProps,
    };
};

const styles = StyleSheet.create({
    listContent: {
        // padding: SPACING, // Removed double padding
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default useImageGrid;
