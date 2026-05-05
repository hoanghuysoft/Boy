import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { useCachedVideoUri } from "@/hooks/useCachedVideoUri";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { useGalleryStore } from "@/stores/gallery";
import { useSettingsStore } from "@/stores/settings";
import { Media } from "@/types/post";
import { buildFallbackUrls, choosenMediaPath } from "@/utils/imageurl";
import { PlayBold, RestartCircleBold } from "@solar-icons/react-native";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, Pressable as RNPressable, View } from "react-native";
import { FlatList, Pressable } from "react-native-gesture-handler";
import { NitroImage } from "react-native-nitro-image";
import { WebImages } from "react-native-nitro-web-image";
import { FeedVideoPlayer } from "./FeedVideoPlayer";

interface PostMediaCarouselProps {
    media: Media[];
    postId: string;
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

// Video carousel item component - shows inline player when active, thumbnail otherwise
interface VideoCarouselItemProps {
    item: Media;
    postId: string;
    profileName: string;
    content?: string;
    colors: any;
    shouldBlur: boolean;
    onReveal: () => void;
    placeholderImageVideo: string;
}

const VideoCarouselItem: React.FC<VideoCarouselItemProps> = React.memo(({
    item,
    postId,
    profileName,
    content,
    colors,
    shouldBlur,
    onReveal,
    placeholderImageVideo,
}) => {
    const router = useRouter();
    const activeMediaId = useFeedVideoStore(s => s.activeMediaId);
    const isEnded = useFeedVideoStore(s => s.isEnded);
    const setEnded = useFeedVideoStore(s => s.setEnded);

    const isActive = activeMediaId === item.id;
    const showReplay = isActive && isEnded;
    const showPlayer = isActive && !isEnded;

    // Resolve video URL against cache — if Shots already downloaded it,
    // the full-screen player will open instantly from local storage.
    const videoUrl = choosenMediaPath(item);
    const resolvedVideoUrl = useCachedVideoUri(videoUrl, item.backup1 || null);

    const fallbackUrls = useMemo(() => buildFallbackUrls(item, placeholderImageVideo), [item, placeholderImageVideo]);
    const [prev, setPrev] = useState(0);
    const placeholderBlurhash = useMemo(
        () => resolveBlurhash(item.blurhash, item.id),
        [item.blurhash, item.id],
    );
    const handleThumbnailError = useCallback(() => {
        setPrev(prev => (prev < fallbackUrls.length - 1 ? prev + 1 : prev));
    }, [fallbackUrls.length]);

    const handleReplay = useCallback(() => {
        // Reset ended state — this will cause FeedVideoPlayer to re-render and play
        setEnded(false);
    }, [setEnded]);

    const handleFullScreenPress = useCallback(() => {
        router.push({
            pathname: '/video_player',
            params: {
                videoUrl: resolvedVideoUrl || videoUrl,
                name: profileName,
                caption: content,
                portrait: 'true',
            },
        });
    }, [router, resolvedVideoUrl, videoUrl, profileName, content]);

    return (
        <View style={{ width: SCREEN_WIDTH }}>
            <RNPressable onPress={handleFullScreenPress} style={{ width: '100%', aspectRatio: ASPECT_RATIO }}>
                {/* Base layer: thumbnail always present (stable dimensions, acts as poster) */}
                <ExpoImage
                    source={{ uri: fallbackUrls[prev] }}
                    style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH / ASPECT_RATIO }}
                    contentFit="cover"
                    blurRadius={shouldBlur ? 25 : 0}
                    onError={handleThumbnailError}
                    transition={150}
                    placeholder={{ blurhash: placeholderBlurhash }}
                />

                {/* Video layer: overlays on top of thumbnail when active */}
                {showPlayer && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                        <FeedVideoPlayer />
                    </View>
                )}

                {/* Replay overlay */}
                {showReplay && (
                    <RNPressable
                        onPress={handleReplay}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: 'rgba(0,0,0,0.35)',
                        }}
                    >
                        <View style={{
                            width: 56, height: 56, borderRadius: 28,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            justifyContent: 'center', alignItems: 'center',
                        }}>
                            <RestartCircleBold size={46} color="#ffffff" />
                        </View>
                    </RNPressable>
                )}

                {/* Play icon overlay (not active, not replaying) */}
                {!isActive && (
                    <View style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.1)',
                    }}>
                        <View style={{
                            width: 56, height: 56, borderRadius: 28,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            justifyContent: 'center', alignItems: 'center',
                        }}>
                            <PlayBold size={28} color="#ffffff" />
                        </View>
                    </View>
                )}
            </RNPressable>
        </View>
    );
});
VideoCarouselItem.displayName = "VideoCarouselItem";

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
    colors,
    shouldBlur,
    onPress,
}) => {
    return (
        <View style={{ width: SCREEN_WIDTH }}>
            <Pressable android_ripple={{ color: colors.divider, foreground: true }} onPress={onPress}>
                {/* NitroImage is a HybridView — wrap with overflow: 'hidden' for clipping */}
                <View style={{
                    width: SCREEN_WIDTH,
                    height: SCREEN_WIDTH / ASPECT_RATIO,
                    backgroundColor: colors.divider,
                    overflow: 'hidden',
                }}>
                    <NitroImage
                        image={{ url: choosenMediaPath(item) }}
                        recyclingKey={choosenMediaPath(item)}
                        resizeMode="cover"
                        style={[
                            { width: '100%', height: '100%' },
                            shouldBlur && { opacity: 0.1 },
                        ]}
                    />
                </View>
            </Pressable>
        </View>
    );
});
PhotoCarouselItem.displayName = "PhotoCarouselItem";

// Main media item component - decides between video and photo
interface MediaCarouselItemProps {
    item: Media;
    index: number;
    media: Media[];
    postId: string;
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
    postId,
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
                postId={postId}
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
MediaCarouselItem.displayName = "MediaCarouselItem";

export const PostMediaCarousel = ({ media, postId, profileName, content, colors, isAdult = false, isVerified, musicUrl, musicTitle }: PostMediaCarouselProps) => {
    const [activeIndex, setActiveIndex] = useState(0);
    // Ref mirrors activeIndex so effects and callbacks always read the latest value
    // without needing to list it as a dependency (avoids stale closures in FlatList).
    const currentIndexRef = useRef(0);
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
            blurhash: m.blurhash,
        })),
        [media, content, profileName, isVerified, musicUrl, musicTitle]);

    // Open gallery with photo data when a photo is pressed
    const handlePhotoPress = useCallback((photoIndex: number) => {
        openGallery(galleryImages, photoIndex);
    }, [openGallery, galleryImages]);

    // Track active post for carousel swipe updates
    const activePostId = useFeedVideoStore(s => s.activePostId);
    const setActiveMedia = useFeedVideoStore(s => s.setActiveMedia);

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const idx = viewableItems[0].index || 0;
            setActiveIndex(idx);
            currentIndexRef.current = idx;

            // If this post is the active video post, update which media is playing
            if (activePostId === postId) {
                const visibleItem = media[idx];
                if (visibleItem && visibleItem.type === 'video') {
                    // Swiped to a video — update the active media
                    setActiveMedia(visibleItem.id, choosenMediaPath(visibleItem));
                } else {
                    // Swiped to a photo — clear the active media (pause video)
                    setActiveMedia(null, null);
                }
            }
        }
    }, [activePostId, postId, media, setActiveMedia]);

    // When this post becomes the active feed post, sync activeMediaId with whatever
    // carousel slot is currently visible. This covers two cases:
    //  1. FlatList's onViewableItemsChanged uses a stale closure and didn't fire after
    //     the post was activated (known React Native limitation with that prop).
    //  2. findTopmostVideoPost passed mediaId=null for mixed-media carousels; this
    //     effect fills in the correct value once we know the visible slot.
    useEffect(() => {
        if (activePostId === postId) {
            const currentItem = media[currentIndexRef.current];
            if (currentItem?.type === 'video') {
                setActiveMedia(currentItem.id, choosenMediaPath(currentItem));
            } else {
                setActiveMedia(null, null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePostId, postId]);
    // Intentionally omit `media` and `setActiveMedia` — they don't change the
    // triggering condition. We only want to react to the post becoming active.

    // Calculate media height based on aspect ratio
    const mediaHeight = SCREEN_WIDTH / ASPECT_RATIO;
    const placeholderImageVideo = 'https://placehold.net/3-600x800.png';

    // Prefetch carousel images — route each URL to the correct native cache:
    // video thumbnails → ExpoImage.prefetch  (rendered by ExpoImage in VideoCarouselItem)
    // photo URLs       → WebImages.preload   (rendered by NitroImage in PhotoCarouselItem)
    //                    NitroImage's preload API takes a single string, so we iterate.
    useEffect(() => {
        if (!media || media.length === 0) return;

        const videoThumbnails = media
            .filter(m => m.type === 'video' && m.thumbnail_url)
            .map(m => m.thumbnail_url as string);

        const photoUrls = media
            .filter(m => m.type === 'photo' && m.url)
            .map(m => m.url);

        if (videoThumbnails.length > 0) ExpoImage.prefetch(videoThumbnails);
        for (const url of photoUrls) WebImages.preload(url);
    }, [media]);

    // Memoized keyExtractor
    const keyExtractor = useCallback((item: Media) => item.id, []);

    // Memoized viewabilityConfig
    const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 50 }), []);

    // Memoized renderItem
    const renderMediaItem = useCallback(({ item, index }: { item: Media, index: number }) => (
        <MediaCarouselItem
            item={item}
            index={index}
            media={media}
            postId={postId}
            profileName={profileName}
            content={content}
            colors={colors}
            shouldBlur={shouldBlur}
            onReveal={onReveal}
            placeholderImageVideo={placeholderImageVideo}
            mediaHeight={mediaHeight}
            onPhotoPress={handlePhotoPress}
        />
    ), [media, postId, profileName, content, colors, shouldBlur, onReveal, placeholderImageVideo, mediaHeight, handlePhotoPress]);

    if (!media || media.length === 0) return null;

    return (
        <View style={{ marginBottom: 16 }}>
            <FlatList
                data={media}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
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
