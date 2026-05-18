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
import { Dimensions, Pressable as RNPressable, View, ViewabilityConfig, ViewToken } from "react-native";
import { FlatList, Pressable } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming
} from "react-native-reanimated";

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

// Defined outside component so it's never recreated
const PLACEHOLDER_IMAGE_VIDEO = 'https://placehold.net/3-600x800.png';
const MEDIA_HEIGHT = SCREEN_WIDTH / ASPECT_RATIO;

// ─── VideoCarouselItem ────────────────────────────────────────────────────────
interface VideoCarouselItemProps {
    item: Media;
    postId: string;
    profileName: string;
    content?: string;
    colors: any;
    placeholderImageVideo: string;
}

const VideoCarouselItem = React.memo(({
    item,
    postId,
    profileName,
    content,
    colors,
    placeholderImageVideo,
}: VideoCarouselItemProps) => {
    const router = useRouter();

    // Select ONLY the boolean — avoids re-render when an unrelated media changes
    const isActive = useFeedVideoStore(s => s.activeMediaId === item.id);
    const isEnded = useFeedVideoStore(s => s.isEnded);
    const setEnded = useFeedVideoStore(s => s.setEnded);

    const showReplay = isActive && isEnded;
    const showPlayer = isActive && !isEnded;

    const videoUrl = choosenMediaPath(item);
    const resolvedVideoUrl = useCachedVideoUri(videoUrl, item.backup1 || null);

    const fallbackUrls = useMemo(() => buildFallbackUrls(item, placeholderImageVideo), [item, placeholderImageVideo]);
    const [prev, setPrev] = useState(0);
    const placeholderBlurhash = useMemo(
        () => resolveBlurhash(item.blurhash, item.id),
        [item.blurhash, item.id],
    );

    const handleThumbnailError = useCallback(() => {
        setPrev(p => (p < fallbackUrls.length - 1 ? p + 1 : p));
    }, [fallbackUrls.length]);

    const handleReplay = useCallback(() => {
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
                {/* Base layer: thumbnail always present */}
                <ExpoImage
                    source={{ uri: fallbackUrls[prev] }}
                    recyclingKey={fallbackUrls[prev]}
                    style={{ width: SCREEN_WIDTH, height: MEDIA_HEIGHT }}
                    contentFit="cover"
                    onError={handleThumbnailError}
                    placeholder={{ blurhash: placeholderBlurhash }}
                />

                {/* Video layer: overlays on top when active */}
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
}, (prev, next) =>
    prev.item.id === next.item.id &&
    prev.postId === next.postId &&
    prev.profileName === next.profileName &&
    prev.content === next.content,
);
VideoCarouselItem.displayName = "VideoCarouselItem";

// ─── PhotoCarouselItem ────────────────────────────────────────────────────────
interface PhotoCarouselItemProps {
    item: Media;
    photoIndex: number;
    colors: any;
    mediaHeight: number;
    onPress: () => void;
}

const PhotoCarouselItem = React.memo(({
    item,
    colors,
    onPress,
}: PhotoCarouselItemProps) => {
    return (
        <View style={{ width: SCREEN_WIDTH }}>
            <Pressable android_ripple={{ color: colors.divider, foreground: true }} onPress={onPress}>
                <View style={{
                    width: SCREEN_WIDTH,
                    height: MEDIA_HEIGHT,
                    backgroundColor: colors.divider,
                    overflow: 'hidden',
                }}>
                    <ExpoImage
                        source={{ uri: choosenMediaPath(item) }}
                        recyclingKey={choosenMediaPath(item)}
                        contentFit="cover"
                        style={{ width: '100%', height: '100%' }}
                    />
                </View>
            </Pressable>
        </View>
    );
}, (prev, next) =>
    prev.item.id === next.item.id &&
    prev.photoIndex === next.photoIndex &&
    prev.onPress === next.onPress,
);
PhotoCarouselItem.displayName = "PhotoCarouselItem";

// ─── MediaCarouselItem ────────────────────────────────────────────────────────
interface MediaCarouselItemProps {
    item: Media;
    index: number;
    media: Media[];
    postId: string;
    profileName: string;
    content?: string;
    colors: any;
    placeholderImageVideo: string;
    mediaHeight: number;
    onPhotoPress: (photoIndex: number) => void;
}

const MediaCarouselItem = React.memo(({
    item,
    index,
    media,
    postId,
    profileName,
    content,
    colors,
    placeholderImageVideo,
    mediaHeight,
    onPhotoPress,
}: MediaCarouselItemProps) => {
    // Photo index: how many photos came before this slot
    const photoIndex = useMemo(() =>
        media.slice(0, index).filter(m => m.type === 'photo').length,
        [media, index]
    );

    // Stable callback — avoids breaking React.memo on PhotoCarouselItem
    const handlePhotoPress = useCallback(() => {
        onPhotoPress(photoIndex);
    }, [onPhotoPress, photoIndex]);

    if (item.type === 'video') {
        return (
            <VideoCarouselItem
                item={item}
                postId={postId}
                profileName={profileName}
                content={content}
                colors={colors}
                placeholderImageVideo={placeholderImageVideo}
            />
        );
    }

    return (
        <PhotoCarouselItem
            item={item}
            photoIndex={photoIndex}
            colors={colors}
            mediaHeight={mediaHeight}
            onPress={handlePhotoPress}
        />
    );
}, (prev, next) =>
    prev.item.id === next.item.id &&
    prev.index === next.index &&
    prev.postId === next.postId &&
    prev.profileName === next.profileName &&
    prev.content === next.content &&
    prev.onPhotoPress === next.onPhotoPress,
);
MediaCarouselItem.displayName = "MediaCarouselItem";

// ─── AnimatedMediaWrapper ─────────────────────────────────────────────────────
interface AnimatedMediaWrapperProps {
    pressAnim: SharedValue<number>;
    children: React.ReactNode;
}

const AnimatedMediaWrapper = React.memo(({ pressAnim, children }: AnimatedMediaWrapperProps) => {
    const animStyle = useAnimatedStyle(() => {
        const scale = interpolate(pressAnim.value, [0, 1], [1, 0.9]);
        const borderRadius = interpolate(pressAnim.value, [0, 1], [0, 30]);
        return { transform: [{ scale }], borderRadius };
    }, []);

    return (
        <Animated.View style={[{ flex: 1, overflow: "hidden" }, animStyle]}>
            {children}
        </Animated.View>
    );
});
AnimatedMediaWrapper.displayName = "AnimatedMediaWrapper";

// ─── ClassicMediaCarousel ─────────────────────────────────────────────────────
const ClassicMediaCarousel = React.memo(({
    media, postId, profileName, content, colors,
    isAdult = false, isVerified, musicUrl, musicTitle,
}: PostMediaCarouselProps) => {
    const pressAnim = useSharedValue<number>(0);
    const isMomentumScrolling = useRef(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const currentIndexRef = useRef(0);
    const { showSensitiveContent, setShowSensitiveContent } = useSettingsStore();
    const openGallery = useGalleryStore(state => state.openGallery);
    const [isRevealed, setIsRevealed] = useState(false);

    const shouldBlur = isAdult && !showSensitiveContent && !isRevealed;

    const onReveal = useCallback(() => {
        setIsRevealed(true);
        setShowSensitiveContent(true);
    }, [setShowSensitiveContent]);

    const galleryImages = useMemo(() =>
        media.filter(m => m.type === 'photo').map(m => ({
            uri: m.url,
            caption: content,
            profileName,
            isVerified,
            musicUrl,
            musicTitle,
            blurhash: m.blurhash,
        })),
        [media, content, profileName, isVerified, musicUrl, musicTitle]);

    const handlePhotoPress = useCallback((photoIndex: number) => {
        openGallery(galleryImages, photoIndex);
    }, [openGallery, galleryImages]);

    // Select only the boolean — no unnecessary re-render when an unrelated post's
    // activePostId changes (Zustand equality check handles this)
    const isActiveVideoPost = useFeedVideoStore(s => s.activePostId === postId);
    const setActiveMedia = useFeedVideoStore(s => s.setActiveMedia);

    // Keep a ref so the viewability callback always reads the current value
    // without needing to be recreated when isActiveVideoPost changes
    const isActiveRef = useRef(isActiveVideoPost);
    isActiveRef.current = isActiveVideoPost;

    // ── Viewability (stable pair — never recreated) ──────────────────────────
    // The onViewableItemsChanged callback itself is kept in a ref so the stable
    // pair always calls the latest closure (same pattern as FeedTab).
    const handleViewableItemsChangedImpl = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
            const idx = viewableItems[0].index ?? 0;
            setActiveIndex(idx);
            currentIndexRef.current = idx;

            if (isActiveRef.current) {
                const visibleItem = media[idx];
                if (visibleItem?.type === 'video') {
                    setActiveMedia(visibleItem.id, choosenMediaPath(visibleItem));
                } else {
                    setActiveMedia(null, null);
                }
            }
        }
    }, [media, setActiveMedia]);

    const handleViewableItemsChangedRef = useRef(handleViewableItemsChangedImpl);
    useEffect(() => {
        handleViewableItemsChangedRef.current = handleViewableItemsChangedImpl;
    }, [handleViewableItemsChangedImpl]);

    // Stable pair — created once, never causes the "changing on the fly" warning
    const viewabilityConfigCallbackPairs = useRef([
        {
            viewabilityConfig: {
                itemVisiblePercentThreshold: 50,
            } as ViewabilityConfig,
            onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
                handleViewableItemsChangedRef.current({ viewableItems });
            },
        },
    ]);

    // Sync active media when this post becomes/stops being the active video post
    useEffect(() => {
        if (isActiveVideoPost) {
            const currentItem = media[currentIndexRef.current];
            if (currentItem?.type === 'video') {
                setActiveMedia(currentItem.id, choosenMediaPath(currentItem));
            } else {
                setActiveMedia(null, null);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActiveVideoPost, postId]);

    // Prefetch all media for this post on first mount
    useEffect(() => {
        if (!media || media.length === 0) return;
        const videoThumbnails = media.filter(m => m.type === 'video' && m.thumbnail_url).map(m => m.thumbnail_url as string);
        const photoUrls = media.filter(m => m.type === 'photo' && m.url).map(m => m.url);
        if (videoThumbnails.length > 0) ExpoImage.prefetch(videoThumbnails);
        if (photoUrls.length > 0) ExpoImage.prefetch(photoUrls);
    }, [media]);

    const keyExtractor = useCallback((item: Media) => item.id, []);

    // renderItem is stable as long as the props it closes over don't change.
    // media identity is stable (useMemo in FeedTab), so this rarely recreates.
    const renderMediaItem = useCallback(({ item, index }: { item: Media; index: number }) => (
        <AnimatedMediaWrapper pressAnim={pressAnim}>
            <MediaCarouselItem
                item={item}
                index={index}
                media={media}
                postId={postId}
                profileName={profileName}
                content={content}
                colors={colors}
                placeholderImageVideo={PLACEHOLDER_IMAGE_VIDEO}
                mediaHeight={MEDIA_HEIGHT}
                onPhotoPress={handlePhotoPress}
            />
        </AnimatedMediaWrapper>
    ), [pressAnim, media, postId, profileName, content, colors, handlePhotoPress]);

    if (!media || media.length === 0) return null;

    return (
        <View style={{ marginBottom: 16 }}>
            <FlatList
                data={media}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={keyExtractor}
                viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
                renderItem={renderMediaItem}
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                windowSize={3}
                onScrollBeginDrag={() => {
                    isMomentumScrolling.current = false;
                    pressAnim.value = withTiming(1, { duration: 150 });
                }}
                onScrollEndDrag={() => {
                    if (!isMomentumScrolling.current) {
                        pressAnim.value = withDelay(1200, withTiming(0, { duration: 400 }));
                    }
                }}
                onMomentumScrollBegin={() => {
                    isMomentumScrolling.current = true;
                }}
                onMomentumScrollEnd={() => {
                    isMomentumScrolling.current = false;
                    pressAnim.value = withDelay(120, withTiming(0, { duration: 400 }));
                }}
                getItemLayout={(_data, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
            />

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
}, (prev, next) =>
    prev.postId === next.postId &&
    prev.media === next.media &&
    prev.profileName === next.profileName &&
    prev.content === next.content &&
    prev.isAdult === next.isAdult &&
    prev.isVerified === next.isVerified &&
    prev.musicUrl === next.musicUrl &&
    prev.musicTitle === next.musicTitle,
);
ClassicMediaCarousel.displayName = "ClassicMediaCarousel";

export const PostMediaCarousel = (props: PostMediaCarouselProps) => {
    return <ClassicMediaCarousel {...props} />;
};
