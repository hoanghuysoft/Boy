import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowDimensions } from "react-native";
import TurboImage from "react-native-turbo-image";
import { useThemeContext } from "../context/ThemeContext";
import { createCommonStyles } from "../styles/common";
import { Media } from "../types/media";

// Constants
const SPACING = 1;
const NUM_COLUMNS = 3;

// Types for grid data
export type GridItemType =
    | { type: 'media'; item: Media; flatIndex: number }
    | { type: 'shimmer'; flatIndex: number };

export interface UseImageGridViewModelOptions {
    photos?: Media[];
    onVideoPress?: (video: Media) => void;
    onImagePress?: (visible: boolean, index: number) => void;
    loading?: boolean;
    fetchingMore?: boolean;
}

// Pure function — sort media and build grid data
const processMediaToFlat = (media: Media[]): { gridData: GridItemType[]; sortedUrls: string[] } => {
    if (!media || media.length === 0) {
        return { gridData: [], sortedUrls: [] };
    }

    const sorted = [...media].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const sortedUrls = sorted.filter(m => !m.type.toLowerCase().includes('video')).map(m => m.url);
    const gridData: GridItemType[] = sorted.map((item, index) => ({
        type: 'media',
        item,
        flatIndex: index,
    }));

    return { gridData, sortedUrls };
};

export const useImageGridViewModel = (options: UseImageGridViewModelOptions = {}) => {
    const {
        photos,
        onVideoPress,
        onImagePress,
        loading = false,
        fetchingMore = false
    } = options;

    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { width: screenWidth } = useWindowDimensions();

    // ─── Constants ─────────────────────────────────────────────────
    const placeholderImageVideo = 'https://placehold.net/3-600x800.png';
    const placeholderImage = 'https://placehold.net/default.png';

    // ─── State ─────────────────────────────────────────────────────
    const [gridData, setGridData] = useState<GridItemType[]>([]);
    const [sortedUrls, setSortedUrls] = useState<string[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewBlurhash, setPreviewBlurhash] = useState<string | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState(false);

    // ─── Quick Preview Handlers ────────────────────────────────────
    const handleLongPress = useCallback((url: string, blurhash: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setPreviewUrl(url);
        setIsPreviewVisible(true);
        setPreviewBlurhash(blurhash);
    }, []);

    const handlePressOut = useCallback(() => {
        setIsPreviewVisible(false);
    }, []);

    const closePreview = useCallback(() => {
        setIsPreviewVisible(false);
    }, []);

    // ─── Layout ────────────────────────────────────────────────────
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

    // ─── Data Processing & Prefetch ────────────────────────────────
    useEffect(() => {
        try {
            const mediaList = photos || [];
            const result = processMediaToFlat(mediaList);

            let finalGridData: GridItemType[] = result.gridData;

            if (loading && mediaList.length === 0) {
                finalGridData = Array.from({ length: NUM_COLUMNS * 2 }).map((_, index) => ({
                    type: 'shimmer' as const,
                    flatIndex: index,
                }));
            } else if (fetchingMore) {
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
                const urlsToPreload = result.sortedUrls.slice(0, 12);
                TurboImage.prefetch(urlsToPreload.map(uri => ({ uri })));
            }
        } catch (error) {
            console.error("Error processing media:", error);
        }
    }, [photos, loading, fetchingMore]);

    // ─── Key Extractor ─────────────────────────────────────────────
    const keyExtractor = useCallback((item: GridItemType, index: number): string => {
        if (item.type === 'shimmer') return `shimmer-${index}`;
        return `media-${item.item.id}`;
    }, []);

    // ─── Estimated Item Size ───────────────────────────────────────
    const estimatedItemSize = onVideoPress ? (itemWidth * 1.7) : itemWidth;

    // ─── FlatList Optimization ─────────────────────────────────────
    const flatListProps = useMemo(() => ({
        removeClippedSubviews: true,
        maxToRenderPerBatch: 8,
        updateCellsBatchingPeriod: 50,
        windowSize: 5,
        initialNumToRender: NUM_COLUMNS * 3,
    }), []);

    // ─── Return ViewModel ──────────────────────────────────────────
    return {
        // Theme
        colors,

        //  Data
        gridData,
        sortedUrls,
        numColumns: NUM_COLUMNS,
        estimatedItemSize,
        keyExtractor,
        flatListProps,

        // Placeholders
        placeholderImage,
        placeholderImageVideo,

        // Styles
        imageStyle,
        videoStyle,

        // Quick Preview
        previewUrl,
        isPreviewVisible,
        previewBlurhash,
        handleLongPress,
        handlePressOut,
        closePreview,

        // Options (pass-through for View layer)
        onVideoPress,
        onImagePress,
    };
};
