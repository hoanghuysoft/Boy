import Ionicons from "@react-native-vector-icons/ionicons/static";

import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { buildFallbackUrls, choosenMediaPath } from "@/utils/imageurl";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ImageStyle,
    ListRenderItem,
    ListRenderItemInfo,
    StyleSheet,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { Pressable } from "react-native-gesture-handler";
import { Media } from "../../types/media";
import {
    GridItemType,
    UseImageGridViewModelOptions,
    useImageGridViewModel
} from "../../viewmodels/ImageGridViewModel";
import { ShimmerEffect } from "../shimmer/Shimmer";
import QuickPreviewModal from "./QuickPreviewModal";

// ─── Video Grid Item (View) ────────────────────────────────────────────────────
interface VideoGridItemProps {
    mediaItem: Media;
    videoStyle: ViewStyle;
    marginRight: number;
    placeholderImageVideo: string;
    onPress: () => void;
    onLongPress: () => void;
    onPressOut: () => void;
    isFirst: boolean;
    isTopRight: boolean;
}

const VideoGridItem: React.FC<VideoGridItemProps> = React.memo(({
    mediaItem,
    videoStyle,
    marginRight,
    placeholderImageVideo,
    onPress,
    onLongPress,
    onPressOut,
    isFirst,
    isTopRight,
}) => {
    const fallbackUrls = useMemo(() => buildFallbackUrls(mediaItem, placeholderImageVideo), [mediaItem, placeholderImageVideo]);
    const [urlIndex, setUrlIndex] = useState(0);
    const placeholderBlurhash = useMemo(
        () => resolveBlurhash(mediaItem.blurhash, mediaItem.id),
        [mediaItem.blurhash, mediaItem.id],
    );

    const handleImageError = useCallback(() => {
        setUrlIndex(prev => (prev < fallbackUrls.length - 1 ? prev + 1 : prev));
    }, [fallbackUrls.length]);

    return (
        <TouchableOpacity
            key={mediaItem.id}
            activeOpacity={0.7}
            onPress={onPress}
            style={[
                videoStyle,
                { marginRight, justifyContent: 'center', alignItems: 'center' },
                isFirst && { borderTopLeftRadius: 16 },
                isTopRight && { borderTopRightRadius: 16 }
            ]}
        >
            <Image
                source={{ uri: fallbackUrls[urlIndex] }}
                onError={handleImageError}
                style={[
                    StyleSheet.absoluteFill,
                    {
                        borderTopLeftRadius: isFirst ? 16 : 0,
                        borderTopRightRadius: isTopRight ? 16 : 0
                    }
                ]}
                contentFit="cover"
                transition={150}
                placeholder={{ blurhash: placeholderBlurhash }}
            />
            <View style={[
                styles.overlay,
                {
                    borderTopLeftRadius: isFirst ? 16 : 0,
                    borderTopRightRadius: isTopRight ? 16 : 0
                }
            ]}>
                <Ionicons name="play" size={24} color="white" />
            </View>
        </TouchableOpacity>
    );
});

VideoGridItem.displayName = 'VideoGridItem';

// ─── Image Grid Item (View) ────────────────────────────────────────────────────
interface ImageGridItemProps {
    mediaItem: Media;
    flatIndex: number;
    imageStyle: ImageStyle;
    placeholderImage: string;
    onImagePress?: (visible: boolean, index: number) => void;
    onLongPress: () => void;
    onPressOut: () => void;
    isFirst: boolean;
    isTopRight: boolean;
}

const ImageGridItem: React.FC<ImageGridItemProps> = React.memo(({
    mediaItem,
    flatIndex,
    imageStyle,
    placeholderImage,
    onImagePress,
    onLongPress,
    onPressOut,
    isFirst,
    isTopRight,
}) => {
    const fallbackUrls = useMemo(() => buildFallbackUrls(mediaItem, placeholderImage), [mediaItem, placeholderImage]);
    const [urlIndex, setUrlIndex] = useState(0);
    const placeholderBlurhash = useMemo(
        () => resolveBlurhash(mediaItem.blurhash, mediaItem.id),
        [mediaItem.blurhash, mediaItem.id],
    );

    const handleImageError = useCallback(() => {
        setUrlIndex(prev => (prev < fallbackUrls.length - 1 ? prev + 1 : prev));
    }, [fallbackUrls.length]);

    return (
        <Pressable
            key={mediaItem.id}
            onPress={() => onImagePress?.(true, flatIndex)}
            onLongPress={onLongPress}
            onPressOut={onPressOut}
            delayLongPress={300}
        >
            <Image
                source={{ uri: fallbackUrls[urlIndex] }}
                onError={handleImageError}
                style={[
                    imageStyle,
                    {
                        borderTopLeftRadius: isFirst ? 16 : 0,
                        borderTopRightRadius: isTopRight ? 16 : 0
                    }
                ]}
                contentFit="cover"
                transition={150}
                placeholder={{ blurhash: placeholderBlurhash }}
            />
        </Pressable>
    );
});

ImageGridItem.displayName = 'ImageGridItem';

// ─── useImageGrid (View Hook) ──────────────────────────────────────────────────
// Thin View layer — consumes ViewModel and provides render functions
export const useImageGrid = (options: UseImageGridViewModelOptions = {}) => {
    const vm = useImageGridViewModel(options);

    // Render items
    const renderItem: ListRenderItem<GridItemType> = useCallback(({ item, index }) => {
        const isFirst = index === 0;
        const isTopRight = index === vm.numColumns - 1 || (index === vm.gridData.length - 1 && index < vm.numColumns);

        if (item.type === 'shimmer') {
            const isVideoGrid = vm.onVideoPress !== undefined;
            const style = isVideoGrid ? vm.videoStyle : vm.imageStyle;

            return (
                <View style={[
                    style,
                    { backgroundColor: vm.colors.card },
                    isFirst && { borderTopLeftRadius: 16 },
                    isTopRight && { borderTopRightRadius: 16 }
                ]}>
                    <ShimmerEffect
                        isLoading={true}
                        style={[
                            StyleSheet.absoluteFill,
                            {
                                borderTopLeftRadius: isFirst ? 16 : 0,
                                borderTopRightRadius: isTopRight ? 16 : 0
                            }
                        ]}
                    />
                </View>
            );
        }

        const mediaItem = item.item;
        const isVideo = mediaItem.type.toLowerCase().includes('video');
        const mediaPath = choosenMediaPath(mediaItem);

        if (isVideo) {
            return (
                <VideoGridItem
                    key={mediaItem.id}
                    mediaItem={mediaItem}
                    videoStyle={vm.videoStyle}
                    marginRight={0}
                    placeholderImageVideo={vm.placeholderImageVideo}
                    onPress={() => vm.onVideoPress?.(mediaItem)}
                    onLongPress={() => vm.handleLongPress(mediaItem.thumbnail_url || mediaItem.url, mediaItem.blurhash)}
                    onPressOut={vm.handlePressOut}
                    isFirst={isFirst}
                    isTopRight={isTopRight}
                />
            );
        }

        return (
            <ImageGridItem
                key={mediaItem.id}
                mediaItem={mediaItem}
                flatIndex={item.flatIndex}
                imageStyle={vm.imageStyle}
                placeholderImage={vm.placeholderImage}
                onImagePress={vm.onImagePress}
                onLongPress={() => vm.handleLongPress(mediaPath, mediaItem.blurhash)}
                onPressOut={vm.handlePressOut}
                isFirst={isFirst}
                isTopRight={isTopRight}
            />
        );
    }, [vm.imageStyle, vm.videoStyle, vm.onVideoPress, vm.onImagePress, vm.handleLongPress, vm.handlePressOut, vm.colors.card, vm.placeholderImage, vm.placeholderImageVideo]);

    /** Rows for FlashList with numColumns=1 (avoids remounting list header when columns change). */
    const chunkedGridData = useMemo(() => {
        const cols = vm.numColumns;
        const flat = vm.gridData;
        if (flat.length === 0) return [];
        const rows: GridItemType[][] = [];
        for (let i = 0; i < flat.length; i += cols) {
            rows.push(flat.slice(i, i + cols));
        }
        return rows;
    }, [vm.gridData, vm.numColumns]);

    const renderChunkedRow = useCallback(
        ({ item: row, index: rowIndex }: ListRenderItemInfo<GridItemType[]>) => (
            <View style={{ flexDirection: "row", width: "100%" }}>
                {row.map((subItem, subIndex) => (
                    <View key={subIndex} style={{ flex: 1 }}>
                        {renderItem({
                            item: subItem,
                            index: rowIndex * vm.numColumns + subIndex,
                            separators: {} as any,
                        } as ListRenderItemInfo<GridItemType>)}
                    </View>
                ))}
                {Array.from({ length: vm.numColumns - row.length }).map((_, i) => (
                    <View key={`spacer-${i}`} style={{ flex: 1 }} />
                ))}
            </View>
        ),
        [renderItem, vm.numColumns],
    );

    const chunkedKeyExtractor = useCallback(
        (row: GridItemType[], index: number) => {
            const first = row[0];
            return vm.keyExtractor(first, index * vm.numColumns);
        },
        [vm.keyExtractor, vm.numColumns],
    );

    return {
        gridData: vm.gridData,
        chunkedGridData,
        renderChunkedRow,
        chunkedKeyExtractor,
        sortedUrls: vm.sortedUrls,
        numColumns: vm.numColumns,
        estimatedItemSize: vm.estimatedItemSize,
        renderItem,
        keyExtractor: vm.keyExtractor,
        contentContainerStyle: styles.listContent,  
        flatListProps: vm.flatListProps,
        renderQuickPreview: () => (
            <QuickPreviewModal
                visible={vm.isPreviewVisible}
                imageUrl={vm.previewUrl}
                blurhash={vm.previewBlurhash}
                onClose={vm.closePreview}
            />
        )
    };
};

const styles = StyleSheet.create({
    listContent: {
    },
    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});

export default useImageGrid;
