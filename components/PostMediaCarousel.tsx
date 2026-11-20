import PauseIcon from "@/assets/images/svg/pause.svg";
import PlayIcon from "@/assets/images/svg/play.svg";
import SoundMuteIcon from "@/assets/images/svg/sound-mute-1.svg";
import SoundIcon from "@/assets/images/svg/sound.svg";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { useThrottledValue } from "@/hooks/useThrottledValue";
import { buildCachedVideoSource } from "@/services/videoCache";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { type GallerySourceRect, useGalleryStore } from "@/stores/gallery";
import { useSettingsStore } from "@/stores/settings";
import { Media } from "@/types/post";
import { buildFallbackUrls, chosenMediaPath } from "@/utils/imageurl";
import { BlueskyVideoView, updateActiveVideoViewAsync } from "@bsky.app/video";
import { useEventListener } from "expo";
import { Image as ExpoImage } from "expo-image";
import { type BufferOptions, useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    type FlatListProps,
    type ListViewToken,
    PixelRatio,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue
} from "react-native-reanimated";

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

const ASPECT_RATIO = 3 / 4;
export const MEDIA_BORDER_RADIUS = 28;

// Defined outside component so it's never recreated
const PLACEHOLDER_IMAGE_VIDEO = 'https://placehold.net/3-600x800.png';

// ─── TimeIndicator ────────────────────────────────────────────────────────────
interface TimeIndicatorProps {
    time: number;
    style?: StyleProp<ViewStyle>;
}

const TimeIndicator = React.memo(({ time, style }: TimeIndicatorProps) => {
    if (isNaN(time) || time < 0) return null;
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return (
        <View
            pointerEvents="none"
            style={[
                {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    height: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                style,
            ]}
        >
            <Text
                style={{
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: '600',
                    fontVariant: ['tabular-nums'],
                    lineHeight: 14,
                }}
            >
                {`${mins}:${secs.toString().padStart(2, '0')}`}
            </Text>
        </View>
    );
});
TimeIndicator.displayName = "TimeIndicator";

// ─── VideoPresentationControls ────────────────────────────────────────────────
export interface FeedVideoControllerHandle {
    togglePlayback: () => void;
    toggleMuted: () => void;
    enterFullscreen: (keepDisplayOn?: boolean) => void;
}

export interface VideoPresentationControlsHandle {
    setTimeRemaining: (time: number) => void;
}

interface VideoPresentationControlsProps {
    videoRef: React.RefObject<FeedVideoControllerHandle | null>;
    isPlaying: boolean;
    isMuted: boolean;
}

const VideoPresentationControls = React.memo(React.forwardRef<VideoPresentationControlsHandle, VideoPresentationControlsProps>(({
    videoRef,
    isPlaying,
    isMuted,
}, ref) => {
    const [timeRemaining, setTimeRemaining] = useState(0);

    React.useImperativeHandle(ref, () => ({
        setTimeRemaining: (time: number) => {
            setTimeRemaining(time);
        },
    }), []);

    const handleTogglePlayback = useCallback(() => {
        videoRef.current?.togglePlayback();
    }, [videoRef]);

    const handleToggleMuted = useCallback(() => {
        videoRef.current?.toggleMuted();
    }, [videoRef]);

    const handleEnterFullscreen = useCallback(() => {
        videoRef.current?.enterFullscreen(true);
    }, [videoRef]);

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {/* Fullscreen tap area */}
            <Pressable
                onPress={handleEnterFullscreen}
                style={StyleSheet.absoluteFill}
            />
            {/* Play / Pause button */}
            <Pressable
                onPress={handleTogglePlayback}
                style={{
                    position: 'absolute',
                    left: 10,
                    bottom: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                }}
                hitSlop={10}
            >
                {isPlaying ? (
                    <PauseIcon width={18} height={18} color="#ffffff" />
                ) : (
                    <PlayIcon width={18} height={18} color="#ffffff" />
                )}
            </Pressable>

            {/* Time remaining */}
            <TimeIndicator
                time={timeRemaining}
                style={{
                    position: 'absolute',
                    left: 48,
                    bottom: 14,
                    zIndex: 10,
                }}
            />

            {/* Mute / Unmute button */}
            <Pressable
                onPress={handleToggleMuted}
                style={{
                    position: 'absolute',
                    right: 10,
                    bottom: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 10,
                }}
                hitSlop={10}
            >
                {isMuted ? (
                    <SoundMuteIcon width={16} height={16} color="#ffffff" />
                ) : (
                    <SoundIcon width={16} height={16} color="#ffffff" />
                )}
            </Pressable>
        </View>
    );
}));
VideoPresentationControls.displayName = "VideoPresentationControls";

// ─── ActiveCachedFeedVideo (expo-video with persistent disk caching) ─────────
const FEED_VIDEO_BUFFER_OPTIONS: BufferOptions = {
    preferredForwardBufferDuration: Platform.OS === 'ios' ? 0 : 15,
    minBufferForPlayback: 1,
    maxBufferBytes: 0,
    prioritizeTimeOverSizeThreshold: true,
};

interface ActiveCachedFeedVideoProps {
    videoUrl: string;
    isMuted: boolean;
    onLoadingChange: (isLoading: boolean) => void;
    onStatusChange: (status: 'playing' | 'paused') => void;
    onTimeRemainingChange: (timeRemaining: number) => void;
    onFirstFrame: () => void;
    onError: (message: string) => void;
}

const ActiveCachedFeedVideo = React.memo(
    React.forwardRef<FeedVideoControllerHandle, ActiveCachedFeedVideoProps>(
        (
            {
                videoUrl,
                isMuted,
                onLoadingChange,
                onStatusChange,
                onTimeRemainingChange,
                onFirstFrame,
                onError,
            },
            ref,
        ) => {
            const expoVideoViewRef = useRef<VideoView>(null);
            const enteredFullscreenMutedRef = useRef(isMuted);

            const videoSource = useMemo(
                () => buildCachedVideoSource(videoUrl),
                [videoUrl],
            );

            const player = useVideoPlayer(videoSource, (p) => {
                p.loop = true;
                p.muted = isMuted;
                p.timeUpdateEventInterval = 0.5;
                p.bufferOptions = FEED_VIDEO_BUFFER_OPTIONS;
                p.play();
            });

            useEffect(() => {
                try {
                    player.muted = isMuted;
                } catch { }
            }, [player, isMuted]);

            useEventListener(player, 'statusChange', ({ status, error }) => {
                if (status === 'loading') {
                    onLoadingChange(true);
                } else if (status === 'readyToPlay') {
                    onLoadingChange(false);
                    const dur = player.duration ?? 0;
                    const curr = player.currentTime ?? 0;
                    if (dur > 0) {
                        onTimeRemainingChange(Math.max(0, Math.round(dur - curr)));
                    }
                } else if (status === 'error') {
                    onLoadingChange(false);
                    if (error?.message) {
                        onError(error.message);
                    }
                }
            });

            useEventListener(player, 'playingChange', ({ isPlaying }) => {
                onStatusChange(isPlaying ? 'playing' : 'paused');
                if (isPlaying) {
                    onLoadingChange(false);
                }
            });

            useEventListener(player, 'mutedChange', ({ muted }) => {
                useFeedVideoStore.getState().setMuted(muted);
            });

            useEventListener(player, 'timeUpdate', ({ currentTime }) => {
                const dur = player.duration ?? 0;
                if (dur > 0) {
                    onTimeRemainingChange(Math.max(0, Math.round(dur - currentTime)));
                }
            });

            React.useImperativeHandle(
                ref,
                () => ({
                    togglePlayback: () => {
                        try {
                            if (player.playing) {
                                player.pause();
                            } else {
                                player.play();
                            }
                        } catch { }
                    },
                    toggleMuted: () => {
                        try {
                            const nextMuted = !player.muted;
                            player.muted = nextMuted;
                            useFeedVideoStore.getState().setMuted(nextMuted);
                        } catch { }
                    },
                    enterFullscreen: () => {
                        try {
                            enteredFullscreenMutedRef.current = player.muted;
                            player.muted = false;
                            useFeedVideoStore.getState().setMuted(false);
                            if (!player.playing) {
                                player.play();
                            }
                            expoVideoViewRef.current?.enterFullscreen();
                        } catch { }
                    },
                }),
                [player],
            );

            return (
                <VideoView
                    ref={expoVideoViewRef}
                    player={player}
                    style={{ width: '100%', height: '100%', borderRadius: MEDIA_BORDER_RADIUS }}
                    contentFit="cover"
                    nativeControls={false}
                    surfaceType={Platform.OS === 'android' ? 'textureView' : 'surfaceView'}
                    onFirstFrameRender={onFirstFrame}
                    onFullscreenExit={() => {
                        try {
                            if (enteredFullscreenMutedRef.current) {
                                player.muted = true;
                                useFeedVideoStore.getState().setMuted(true);
                            }
                        } catch { }
                    }}
                />
            );
        },
    ),
);
ActiveCachedFeedVideo.displayName = 'ActiveCachedFeedVideo';

// ─── VideoCarouselItem ────────────────────────────────────────────────────────
interface VideoCarouselItemProps {
    item: Media;
    postId: string;
    profileName: string;
    content?: string;
    colors: any;
    placeholderImageVideo: string;
    mediaHeight: number;
    screenWidth: number;
    isItemActive?: boolean;
}

const VideoCarouselItem = React.memo(({
    item,
    postId,
    profileName,
    content,
    colors,
    placeholderImageVideo,
    mediaHeight,
    screenWidth,
    isItemActive = true,
}: VideoCarouselItemProps) => {
    const activePlayerRef = useRef<FeedVideoControllerHandle | null>(null);
    const controlsRef = useRef<VideoPresentationControlsHandle>(null);
    const isMuted = useFeedVideoStore(s => s.isMuted);
    const disableAutoplay = useSettingsStore(s => s.disableAutoplay);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isViewportActive, setIsViewportActive] = useState(false);
    const [isManualActive, setIsManualActive] = useState(false);
    const [hasFirstFrame, setHasFirstFrame] = useState(false);
    const [status, setStatus] = useState<'playing' | 'paused' | 'pending'>('pending');

    const isActive = isItemActive && ((isViewportActive && !disableAutoplay) || isManualActive);
    const showSpinner = useThrottledValue(isActive && (isLoading || !hasFirstFrame), 100);

    const videoUrl = chosenMediaPath(item);
    const fallbackUrls = useMemo(() => buildFallbackUrls(item, placeholderImageVideo), [item, placeholderImageVideo]);
    const [prev, setPrev] = useState(0);
    const placeholderBlurhash = useMemo(
        () => resolveBlurhash(item.blurhash, item.id),
        [item.blurhash, item.id],
    );

    const targetWidth = useMemo(() => Math.round(screenWidth * PixelRatio.get()), [screenWidth]);
    const targetHeight = useMemo(() => Math.round(mediaHeight * PixelRatio.get()), [mediaHeight]);

    const handleThumbnailError = useCallback(() => {
        setPrev(p => (p < fallbackUrls.length - 1 ? p + 1 : p));
    }, [fallbackUrls.length]);

    const controllerBridgeRef = useRef<FeedVideoControllerHandle>({
        togglePlayback: () => {
            if (activePlayerRef.current) {
                activePlayerRef.current.togglePlayback();
            } else {
                setIsLoading(true);
                setHasFirstFrame(false);
                setIsManualActive(true);
                if (videoUrl) {
                    useFeedVideoStore.getState().setActiveVideo(postId, item.id, videoUrl);
                }
            }
        },
        toggleMuted: () => {
            if (activePlayerRef.current) {
                activePlayerRef.current.toggleMuted();
            } else {
                useFeedVideoStore.getState().toggleMute();
            }
        },
        enterFullscreen: () => {
            activePlayerRef.current?.enterFullscreen(true);
        },
    });

    if (!isActive && (status !== 'pending' || hasFirstFrame || isPlaying)) {
        if (status !== 'pending') setStatus('pending');
        if (hasFirstFrame) setHasFirstFrame(false);
        if (isPlaying) setIsPlaying(false);
    }

    const showOverlay =
        !isActive ||
        isLoading ||
        !hasFirstFrame ||
        status === 'pending';

    return (
        <View style={{ width: screenWidth, height: mediaHeight, borderRadius: MEDIA_BORDER_RADIUS, overflow: 'hidden' }}>
            <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                {videoUrl ? (
                    <>
                        {/* Lightweight native viewport visibility sensor (autoplay=false prevents uncached Bluesky ExoPlayer/AVPlayer from spawning) */}
                        <BlueskyVideoView
                            url={videoUrl}
                            autoplay={false}
                            beginMuted={isMuted}
                            style={StyleSheet.absoluteFill}
                            onActiveChange={e => {
                                const active = e.nativeEvent.isActive;
                                setIsViewportActive(active);
                                if (!active) {
                                    setIsManualActive(false);
                                }
                                if (active && !disableAutoplay && isItemActive) {
                                    setIsLoading(true);
                                    useFeedVideoStore.getState().setActiveVideo(postId, item.id, videoUrl);
                                } else if (!active && useFeedVideoStore.getState().activeMediaId === item.id) {
                                    useFeedVideoStore.getState().clearActiveVideo();
                                }
                            }}
                            accessibilityLabel="Video"
                            accessibilityHint=""
                        />

                        {/* Active cached expo-video player */}
                        {isActive && (
                            <ActiveCachedFeedVideo
                                ref={activePlayerRef}
                                videoUrl={videoUrl}
                                isMuted={isMuted}
                                onLoadingChange={setIsLoading}
                                onStatusChange={nextStatus => {
                                    setStatus(nextStatus);
                                    setIsPlaying(nextStatus === 'playing');
                                }}
                                onTimeRemainingChange={time => {
                                    controlsRef.current?.setTimeRemaining(time);
                                }}
                                onFirstFrame={() => {
                                    setHasFirstFrame(true);
                                    setIsLoading(false);
                                }}
                                onError={err => {
                                    console.warn('[VideoCarousel] Error:', err);
                                }}
                            />
                        )}
                    </>
                ) : null}

                {/* Thumbnail overlay: visible when video is inactive, loading, or pending first frame */}
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: 'transparent',
                            ...Platform.select({
                                android: { display: showOverlay ? 'flex' : 'none' },
                                ios: { zIndex: showOverlay ? 1 : -1 },
                            }),
                        }
                    ]}
                    pointerEvents={showOverlay ? 'auto' : 'none'}
                >
                    <ExpoImage
                        source={{
                            uri: fallbackUrls[prev],
                            width: targetWidth,
                            height: targetHeight,
                        }}
                        recyclingKey={fallbackUrls[prev]}
                        style={{ width: '100%', height: '100%', borderRadius: MEDIA_BORDER_RADIUS }}
                        contentFit="cover"
                        onError={handleThumbnailError}
                        placeholder={{ blurhash: placeholderBlurhash }}
                        cachePolicy="memory-disk"
                    />

                    {showOverlay && (
                        <Pressable
                            onPress={() => controllerBridgeRef.current.togglePlayback()}
                            style={[
                                StyleSheet.absoluteFill,
                                {
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: 'rgba(0,0,0,0.15)',
                                    borderRadius: MEDIA_BORDER_RADIUS,
                                },
                            ]}
                        >
                            {showSpinner ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <View style={{
                                    width: 52, height: 52, borderRadius: 26,
                                    backgroundColor: 'rgba(0,0,0,0.45)',
                                    justifyContent: 'center', alignItems: 'center',
                                }}>
                                    <PlayIcon width={28} height={28} color="#ffffff" />
                                </View>
                            )}
                        </Pressable>
                    )}
                </View>

                {/* Presentation Controls: active & first frame ready */}
                {isActive && hasFirstFrame && !isLoading && (
                    <VideoPresentationControls
                        ref={controlsRef}
                        videoRef={controllerBridgeRef}
                        isPlaying={isPlaying}
                        isMuted={isMuted}
                    />
                )}
            </View>
        </View>
    );
}, (prev, next) =>
    prev.item.id === next.item.id &&
    prev.postId === next.postId &&
    prev.profileName === next.profileName &&
    prev.content === next.content &&
    prev.mediaHeight === next.mediaHeight &&
    prev.screenWidth === next.screenWidth &&
    prev.isItemActive === next.isItemActive,
);
VideoCarouselItem.displayName = "VideoCarouselItem";

// ─── PhotoCarouselItem ────────────────────────────────────────────────────────
interface PhotoCarouselItemProps {
    item: Media;
    postId: string;
    photoIndex: number;
    colors: any;
    mediaHeight: number;
    screenWidth: number;
    onPress: () => void;
}

const PhotoCarouselItem = React.memo(({
    item,
    postId,
    colors,
    mediaHeight,
    screenWidth,
    onPress,
}: PhotoCarouselItemProps) => {
    const imageUri = chosenMediaPath(item);
    const sourceKey = `${postId}:${item.id}`;
    const isHidden = useGalleryStore(state => state.hiddenSourceKey === sourceKey);
    const targetWidth = useMemo(() => Math.round(screenWidth * PixelRatio.get()), [screenWidth]);
    const targetHeight = useMemo(() => Math.round(mediaHeight * PixelRatio.get()), [mediaHeight]);
    const placeholderBlurhash = useMemo(
        () => resolveBlurhash(item.blurhash, item.id),
        [item.blurhash, item.id],
    );

    return (
        <View
            style={{
                width: screenWidth,
                height: mediaHeight,
                borderRadius: MEDIA_BORDER_RADIUS,
                overflow: 'hidden',
                opacity: isHidden ? 0 : 1,
            }}
        >
            <Pressable
                android_ripple={{ color: colors.divider, foreground: true }}
                onPress={onPress}
                style={{ width: '100%', height: '100%' }}
            >
                <ExpoImage
                    source={{
                        uri: imageUri,
                        width: targetWidth,
                        height: targetHeight,
                    }}
                    recyclingKey={imageUri}
                    contentFit="cover"
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: MEDIA_BORDER_RADIUS,
                        backgroundColor: colors.divider,
                    }}
                    placeholder={{ blurhash: placeholderBlurhash }}
                    cachePolicy="memory-disk"
                />
            </Pressable>
        </View>
    );
}, (prev, next) =>
    prev.item.id === next.item.id &&
    prev.postId === next.postId &&
    prev.photoIndex === next.photoIndex &&
    prev.mediaHeight === next.mediaHeight &&
    prev.screenWidth === next.screenWidth &&
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
    screenWidth: number;
    isItemActive?: boolean;
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
    screenWidth,
    isItemActive = true,
    onPhotoPress,
}: MediaCarouselItemProps) => {
    // Photo index: how many photos came before this slot
    const photoIndex = useMemo(() =>
        media.slice(0, index).filter(m => m.type === 'photo').length,
        [media, index]
    );

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
                mediaHeight={mediaHeight}
                screenWidth={screenWidth}
                isItemActive={isItemActive}
            />
        );
    }

    return (
        <PhotoCarouselItem
            item={item}
            postId={postId}
            photoIndex={photoIndex}
            colors={colors}
            mediaHeight={mediaHeight}
            screenWidth={screenWidth}
            onPress={handlePhotoPress}
        />
    );
}, (prev, next) =>
    prev.item.id === next.item.id &&
    prev.index === next.index &&
    prev.postId === next.postId &&
    prev.profileName === next.profileName &&
    prev.content === next.content &&
    prev.mediaHeight === next.mediaHeight &&
    prev.screenWidth === next.screenWidth &&
    prev.isItemActive === next.isItemActive &&
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
        const borderRadius = interpolate(pressAnim.value, [0, 1], [MEDIA_BORDER_RADIUS, 30]);
        return { transform: [{ scale }], borderRadius };
    });

    return (
        <Animated.View style={[{ flex: 1, overflow: "hidden" }, animStyle]}>
            {children}
        </Animated.View>
    );
});
AnimatedMediaWrapper.displayName = "AnimatedMediaWrapper";

// ─── SingleMediaView (Fast path: avoids nested FlatList) ─────────────────────
const SingleMediaView = React.memo(({
    media, postId, profileName, content, colors,
    isVerified, musicUrl, musicTitle,
}: PostMediaCarouselProps) => {
    const screenWidth = Dimensions.get('window').width;
    const mediaHeight = screenWidth / ASPECT_RATIO;
    const containerRef = useRef<React.ComponentRef<typeof View>>(null);
    const openGallery = useGalleryStore(state => state.openGallery);

    const galleryImages = useMemo(() =>
        media.filter(m => m.type === 'photo').map(m => ({
            uri: m.url,
            caption: content,
            profileName,
            isVerified,
            musicUrl,
            musicTitle,
            blurhash: m.blurhash,
            sourceKey: `${postId}:${m.id}`,
        })),
        [media, postId, content, profileName, isVerified, musicUrl, musicTitle]);

    const handlePhotoPress = useCallback((photoIndex: number) => {
        if (useGalleryStore.getState().isVisible) return;

        if (containerRef.current?.measureInWindow) {
            containerRef.current.measureInWindow((x, y, width, height) => {
                const sourceRect: GallerySourceRect | null =
                    width > 0 && height > 0
                        ? { x, y, width, height, borderRadius: MEDIA_BORDER_RADIUS }
                        : null;
                openGallery(galleryImages, photoIndex, {
                    sourceRect,
                    sourcePostId: postId,
                });
            });
        } else {
            openGallery(galleryImages, photoIndex);
        }
    }, [openGallery, galleryImages, postId]);

    return (
        <View
            ref={containerRef}
            collapsable={false}
            style={{ marginBottom: 16, width: screenWidth, height: mediaHeight }}
        >
            <MediaCarouselItem
                item={media[0]}
                index={0}
                media={media}
                postId={postId}
                profileName={profileName}
                content={content}
                colors={colors}
                placeholderImageVideo={PLACEHOLDER_IMAGE_VIDEO}
                mediaHeight={mediaHeight}
                screenWidth={screenWidth}
                onPhotoPress={handlePhotoPress}
            />
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
SingleMediaView.displayName = "SingleMediaView";

// ─── MultiMediaCarousel (Horizontal paging FlatList) ──────────────────────────
const MultiMediaCarousel = React.memo(({
    media, postId, profileName, content, colors,
    isVerified, musicUrl, musicTitle,
}: PostMediaCarouselProps) => {
    const screenWidth = Dimensions.get('window').width;
    const mediaHeight = screenWidth / ASPECT_RATIO;
    const pressAnim = useSharedValue<number>(0);
    const [activeIndex, setActiveIndex] = useState(0);
    const currentIndexRef = useRef(0);
    const containerRef = useRef<React.ComponentRef<typeof View>>(null);
    const flatListRef = useRef<FlatList<Media>>(null);
    const openGallery = useGalleryStore(state => state.openGallery);
    const isCarouselHidden = useGalleryStore(state => state.hiddenSourcePostId === postId);

    const photoMediaIndices = useMemo(() => {
        const indices: number[] = [];
        media.forEach((m, i) => {
            if (m.type === 'photo') {
                indices.push(i);
            }
        });
        return indices;
    }, [media]);

    const galleryImages = useMemo(() =>
        media.filter(m => m.type === 'photo').map(m => ({
            uri: m.url,
            caption: content,
            profileName,
            isVerified,
            musicUrl,
            musicTitle,
            blurhash: m.blurhash,
            sourceKey: `${postId}:${m.id}`,
        })),
        [media, postId, content, profileName, isVerified, musicUrl, musicTitle]);

    const handlePhotoPress = useCallback((photoIndex: number) => {
        if (useGalleryStore.getState().isVisible) return;

        const onIndexSync = (newPhotoIndex: number) => {
            const mediaIdx = photoMediaIndices[newPhotoIndex];
            if (mediaIdx !== undefined && mediaIdx !== currentIndexRef.current) {
                currentIndexRef.current = mediaIdx;
                setActiveIndex(mediaIdx);
                try {
                    flatListRef.current?.scrollToIndex({ index: mediaIdx, animated: false });
                } catch { }
            }
        };

        if (containerRef.current?.measureInWindow) {
            containerRef.current.measureInWindow((x, y, width, height) => {
                const sourceRect: GallerySourceRect | null =
                    width > 0 && height > 0
                        ? { x, y, width, height, borderRadius: MEDIA_BORDER_RADIUS }
                        : null;
                openGallery(galleryImages, photoIndex, {
                    sourceRect,
                    sourcePostId: postId,
                    onIndexSync,
                });
            });
        } else {
            openGallery(galleryImages, photoIndex, { onIndexSync });
        }
    }, [openGallery, galleryImages, photoMediaIndices, postId]);

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
        if (viewableItems.length > 0) {
            const idx = viewableItems[0].index ?? 0;
            setActiveIndex(idx);
            currentIndexRef.current = idx;
            // Native autoplay: scan for active video when horizontal slide changes
            updateActiveVideoViewAsync();
        }
    }).current;

    const viewabilityConfig = useRef<NonNullable<FlatListProps<Media>["viewabilityConfig"]>>({
        itemVisiblePercentThreshold: 50,
    }).current;

    const keyExtractor = useCallback((item: Media) => item.id, []);

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
                mediaHeight={mediaHeight}
                screenWidth={screenWidth}
                isItemActive={index === activeIndex}
                onPhotoPress={handlePhotoPress}
            />
        </AnimatedMediaWrapper>
    ), [pressAnim, media, postId, profileName, content, colors, mediaHeight, screenWidth, activeIndex, handlePhotoPress]);

    return (
        <View style={{ marginBottom: 16 }}>
            <View
                ref={containerRef}
                collapsable={false}
                style={{ width: screenWidth, height: mediaHeight }}
            >
                <FlatList
                    ref={flatListRef}
                    data={media}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={keyExtractor}
                    viewabilityConfig={viewabilityConfig}
                    onViewableItemsChanged={onViewableItemsChanged}
                    renderItem={renderMediaItem}
                    initialNumToRender={1}
                    maxToRenderPerBatch={2}
                    windowSize={3}
                    getItemLayout={(_data, index) => ({
                        length: screenWidth,
                        offset: screenWidth * index,
                        index,
                    })}
                />
            </View>

            <View
                style={{
                    position: 'absolute',
                    bottom: 12,
                    flexDirection: 'row',
                    width: '100%',
                    justifyContent: 'center',
                    gap: 6,
                    opacity: isCarouselHidden ? 0 : 1,
                }}
            >
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
MultiMediaCarousel.displayName = "MultiMediaCarousel";

export const PostMediaCarousel = (props: PostMediaCarouselProps) => {
    if (!props.media || props.media.length === 0) return null;
    if (props.media.length === 1) {
        return <SingleMediaView {...props} />;
    }
    return <MultiMediaCarousel {...props} />;
};
