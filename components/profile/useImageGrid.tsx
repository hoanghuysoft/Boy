import { Ionicons } from "@expo/vector-icons";

import { buildFallbackUrls, choosenMediaPath } from "@/utils/imageurl";
import { FasterImageView } from '@rraut/react-native-faster-image';
import { Image } from "expo-image";
import React, { useCallback, useMemo, useState } from "react";
import {
    ImageStyle,
    ListRenderItem,
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

// TurboImage cache policy
const IMAGE_CACHE_POLICY = "dataCache" as const;

// ─── Video Grid Item (View) ────────────────────────────────────────────────────
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
    const fallbackUrls = useMemo(() => buildFallbackUrls(mediaItem, placeholderImageVideo), [mediaItem, placeholderImageVideo]);
    const [urlIndex, setUrlIndex] = useState(0);

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
                { marginRight, justifyContent: 'center', alignItems: 'center' }
            ]}
        >
            <FasterImageView
                source={{ uri: fallbackUrls[urlIndex], resizeMode: 'cover' }}
                onError={handleImageError}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.overlay}>
                <Ionicons name="play" size={24} color="white" />
            </View>
        </TouchableOpacity>
    );
});

// ─── Image Grid Item (View) ────────────────────────────────────────────────────
interface ImageGridItemProps {
    mediaItem: Media;
    flatIndex: number;
    imageStyle: ImageStyle;
    placeholderImage: string;
    onImagePress?: (visible: boolean, index: number) => void;
    onLongPress: () => void;
    onPressOut: () => void;
}

const ImageGridItem: React.FC<ImageGridItemProps> = React.memo(({
    mediaItem,
    flatIndex,
    imageStyle,
    placeholderImage,
    onImagePress,
    onLongPress,
    onPressOut,
}) => {
    const fallbackUrls = useMemo(() => buildFallbackUrls(mediaItem, placeholderImage), [mediaItem, placeholderImage]);
    const [urlIndex, setUrlIndex] = useState(0);

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
            {/* <TurboImage
                source={{ uri: fallbackUrls[urlIndex] }}
                style={imageStyle}
                resizeMode="cover"
                cachePolicy={IMAGE_CACHE_POLICY}
                fadeDuration={150}
                onFailure={handleImageError}
            /> */}
            <Image
                source={{ uri: fallbackUrls[urlIndex] }}
                style={imageStyle}
                contentFit="cover"
                transition={150}
                onError={handleImageError}
                placeholder={{blurhash: mediaItem.blurhash}}
            />
        </Pressable>
    );
});

// ─── useImageGrid (View Hook) ──────────────────────────────────────────────────
// Thin View layer — consumes ViewModel and provides render functions
export const useImageGrid = (options: UseImageGridViewModelOptions = {}) => {
    const vm = useImageGridViewModel(options);

    // Render items
    const renderItem: ListRenderItem<GridItemType> = useCallback(({ item }) => {
        if (item.type === 'shimmer') {
            const isVideoGrid = vm.onVideoPress !== undefined;
            const style = isVideoGrid ? vm.videoStyle : vm.imageStyle;

            return (
                <View style={[style, { backgroundColor: vm.colors.card }]}>
                    <ShimmerEffect
                        isLoading={true}
                        style={StyleSheet.absoluteFill}
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
                    onLongPress={() => vm.handleLongPress(mediaItem.thumbnail_url || mediaItem.url)}
                    onPressOut={vm.handlePressOut}
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
                onLongPress={() => vm.handleLongPress(mediaPath)}
                onPressOut={vm.handlePressOut}
            />
        );
    }, [vm.imageStyle, vm.videoStyle, vm.onVideoPress, vm.onImagePress, vm.handleLongPress, vm.handlePressOut, vm.colors.card, vm.placeholderImage, vm.placeholderImageVideo]);

    return {
        gridData: vm.gridData,
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
                onClose={vm.closePreview}
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
