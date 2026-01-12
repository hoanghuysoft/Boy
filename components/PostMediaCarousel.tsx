import { useVideoThumbnail } from "@/hooks/useVideoThumbnail";
import PlayIcon from "@/icons/play";
import { useGalleryStore } from "@/stores/gallery";
import { useSettingsStore } from "@/stores/settings";
import { Media } from "@/types/post";
import FastImage from "@d11/react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";
import { FlashList as FlashListOriginal } from "@shopify/flash-list";
import { Blur, Canvas, Image as SkiaImage, useImage } from "@shopify/react-native-skia";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const FlashList = FlashListOriginal as any;

interface PostMediaCarouselProps {
    media: Media[];
    profileName: string;
    content?: string;
    colors: any;
    isAdult?: boolean;
    isVerified?: boolean;
    musicUrl?: string;
    musicTitle?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ASPECT_RATIO = 3 / 4;

// Skia Blur Overlay Component
interface BlurOverlayProps {
    imageUrl: string;
    width: number;
    height: number;
    onReveal: () => void;
}

const BlurOverlay = ({ imageUrl, width, height, onReveal }: BlurOverlayProps) => {
    const [isPreloaded, setIsPreloaded] = useState(false);
    const image = useImage(imageUrl);
    const isLoading = !image;

    // Preload with FastImage first so Skia can use the disk cache
    React.useEffect(() => {
        if (imageUrl) {
            FastImage.preload([{ uri: imageUrl }]);
            // Give FastImage a moment to cache before Skia tries to load
            const timeout = setTimeout(() => setIsPreloaded(true), 100);
            return () => clearTimeout(timeout);
        }
    }, [imageUrl]);

    return (
        <TouchableOpacity
            onPress={onReveal}
            activeOpacity={1}
            style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
        >
            {/* Dark overlay shown while blur is loading */}
            {isLoading && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.95)' }]} />
            )}
            {/* Skia blur shown when image is ready */}
            {image && (
                <Canvas style={StyleSheet.absoluteFill}>
                    <SkiaImage
                        x={0}
                        y={0}
                        width={width}
                        height={height}
                        image={image}
                        fit="cover"
                    >
                        <Blur blur={30} mode="clamp" />
                    </SkiaImage>
                </Canvas>
            )}
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: isLoading ? 'transparent' : 'rgba(0,0,0,0.3)' }]}>
                <View style={{ alignItems: 'center', gap: 8 }}>
                    <Ionicons name="eye-off-outline" size={32} color="white" />
                    <Text style={{ color: 'white', fontWeight: '600' }}>Sensitive Content</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Tap to see</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// Video carousel item component - uses hook for thumbnail generation
interface VideoCarouselItemProps {
    item: Media;
    profileName: string;
    content?: string;
    colors: any;
    shouldBlur: boolean;
    onReveal: () => void;
    placeholderImageVideo: string;
}

const VideoCarouselItem: React.FC<VideoCarouselItemProps> = React.memo(({
    item,
    profileName,
    content,
    colors,
    shouldBlur,
    onReveal,
    placeholderImageVideo,
}) => {
    const router = useRouter();

    // Use hook to get thumbnail - generates one if not available from API
    const thumbnailUrl = useVideoThumbnail(
        item.url,
        item.thumbnail_url,
        placeholderImageVideo
    );

    return (
        <View style={{ width: SCREEN_WIDTH }}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push({ pathname: '/video_player', params: { videoUrl: item.url, name: profileName, caption: content, portrait: 'true' } })}
                style={{ width: '100%', aspectRatio: ASPECT_RATIO }}
            >
                <FastImage
                    source={{ uri: thumbnailUrl }}
                    style={{ width: '100%', height: '100%', backgroundColor: colors.divider }}
                    resizeMode="cover"
                >
                    {shouldBlur && (
                        <TouchableOpacity
                            onPress={onReveal}
                            activeOpacity={1}
                            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 10, justifyContent: 'center', alignItems: 'center' }]}
                        >
                            <View style={{ alignItems: 'center', gap: 8 }}>
                                <Ionicons name="eye-off-outline" size={32} color="white" />
                                <Text style={{ color: 'white', fontWeight: '600' }}>Sensitive Content</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Tap to see</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
                            <PlayIcon size={24} color="#ffffff" style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                </FastImage>
            </TouchableOpacity>
        </View>
    );
});

// Photo carousel item component - now with onPress callback for gallery
interface PhotoCarouselItemProps {
    item: Media;
    photoIndex: number;
    colors: any;
    shouldBlur: boolean;
    onReveal: () => void;
    mediaHeight: number;
    onPress: () => void;
}

const PhotoCarouselItem: React.FC<PhotoCarouselItemProps> = React.memo(({
    item,
    photoIndex,
    colors,
    shouldBlur,
    onReveal,
    mediaHeight,
    onPress,
}) => {
    return (
        <View style={{ width: SCREEN_WIDTH }}>
            <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
                <FastImage
                    source={{ uri: item.url }}
                    style={{ width: '100%', aspectRatio: ASPECT_RATIO, backgroundColor: colors.divider }}
                    resizeMode={FastImage.resizeMode.cover}
                />
                {shouldBlur && (
                    <BlurOverlay
                        imageUrl={item.url}
                        width={SCREEN_WIDTH}
                        height={mediaHeight}
                        onReveal={onReveal}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
});

// Main media item component - decides between video and photo
interface MediaCarouselItemProps {
    item: Media;
    index: number;
    media: Media[];
    profileName: string;
    content?: string;
    colors: any;
    shouldBlur: boolean;
    onReveal: () => void;
    placeholderImageVideo: string;
    mediaHeight: number;
    onPhotoPress: (photoIndex: number) => void;
}

const MediaCarouselItem: React.FC<MediaCarouselItemProps> = React.memo(({
    item,
    index,
    media,
    profileName,
    content,
    colors,
    shouldBlur,
    onReveal,
    placeholderImageVideo,
    mediaHeight,
    onPhotoPress,
}) => {
    // Calculate index for gallery: count how many photos appeared before this item
    const photoIndex = useMemo(() =>
        media.slice(0, index).filter(m => m.type === 'photo').length,
        [media, index]
    );

    if (item.type === 'video') {
        return (
            <VideoCarouselItem
                item={item}
                profileName={profileName}
                content={content}
                colors={colors}
                shouldBlur={shouldBlur}
                onReveal={onReveal}
                placeholderImageVideo={placeholderImageVideo}
            />
        );
    }

    return (
        <PhotoCarouselItem
            item={item}
            photoIndex={photoIndex}
            colors={colors}
            shouldBlur={shouldBlur}
            onReveal={onReveal}
            mediaHeight={mediaHeight}
            onPress={() => onPhotoPress(photoIndex)}
        />
    );
});

export const PostMediaCarousel = ({ media, profileName, content, colors, isAdult = false, isVerified, musicUrl, musicTitle }: PostMediaCarouselProps) => {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const { showSensitiveContent, setShowSensitiveContent } = useSettingsStore();
    const openGallery = useGalleryStore(state => state.openGallery);
    const [isRevealed, setIsRevealed] = useState(false);

    // If "Everyone" setting is ON, we are revealed by default.
    // If OFF, we respect "isAdult" -> if isAdult, then not revealed.
    // However, user can tap to reveal locally.

    const shouldBlur = isAdult && !showSensitiveContent && !isRevealed;

    const onReveal = useCallback(() => {
        setIsRevealed(true);
        // Requirement: "save the config". 
        // If users taps reveal, do we enable it GLOBALLY? 
        // "touching it will shows the content and save the config"
        setShowSensitiveContent(true);
    }, [setShowSensitiveContent]);

    // Filter urls for gallery (only photos) - include metadata for poster
    const galleryImages = useMemo(() =>
        media.filter(m => m.type === 'photo').map(m => ({
            uri: m.url,
            caption: content,
            profileName: profileName,
            isVerified: isVerified,
            musicUrl: musicUrl,
            musicTitle: musicTitle,
        })),
        [media, content, profileName, isVerified, musicUrl, musicTitle]);

    // Open gallery with photo data when a photo is pressed
    const handlePhotoPress = useCallback((photoIndex: number) => {
        openGallery(galleryImages, photoIndex);
    }, [openGallery, galleryImages]);

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    }, []);

    // Calculate media height based on aspect ratio
    const mediaHeight = SCREEN_WIDTH / ASPECT_RATIO;
    const placeholderImageVideo = 'https://placehold.net/3-600x800.png';

    // Prefetch all carousel images for smoother scrolling
    React.useEffect(() => {
        if (media && media.length > 0) {
            const imagesToPrefetch = media
                .map(m => m.type === 'video' ? m.thumbnail_url : m.url)
                .filter(Boolean)
                .map(uri => ({ uri: uri as string }));

            if (imagesToPrefetch.length > 0) {
                FastImage.preload(imagesToPrefetch);
            }
        }
    }, [media]);

    // Memoized keyExtractor
    const keyExtractor = useCallback((item: Media) => item.id, []);

    // Memoized viewabilityConfig
    const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 50 }), []);

    // Memoized renderItem
    const renderMediaItem = useCallback(({ item, index }: { item: Media, index: number }) => (
        <MediaCarouselItem
            key={item.id}
            item={item}
            index={index}
            media={media}
            profileName={profileName}
            content={content}
            colors={colors}
            shouldBlur={shouldBlur}
            onReveal={onReveal}
            placeholderImageVideo={placeholderImageVideo}
            mediaHeight={mediaHeight}
            onPhotoPress={handlePhotoPress}
        />
    ), [media, profileName, content, colors, shouldBlur, onReveal, placeholderImageVideo, mediaHeight, handlePhotoPress]);

    if (!media || media.length === 0) return null;

    return (
        <View style={{ marginBottom: 16 }}>
            <FlashList
                data={media}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                estimatedItemSize={SCREEN_WIDTH}
                keyExtractor={keyExtractor}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={renderMediaItem}
            />

            {/* Pagination Dots */}
            {media.length > 1 && (
                <View style={{ position: 'absolute', bottom: 12, flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 6 }}>
                    {media.map((_, i) => (
                        <View
                            key={i}
                            style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: i === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.3,
                                shadowRadius: 2,
                            }}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};
