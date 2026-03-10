import { getCachedUri } from "@/services/videoCache";
import { VideoItem } from "@/types/video";
import FastImage from "@d11/react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { ChatRoundLikeBold, HeartBold, MutedBold, SquareShareLineBold, VolumeLoudBold } from "@solar-icons/react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video, { VideoRef } from "react-native-video";
import { useShotsViewModel } from "../../viewmodels/ShotsViewModel";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Single Video Item ──────────────────────────────────────────────
interface ShotItemProps {
    item: VideoItem;
    index: number;
    isActive: boolean;
    isMuted: boolean;
    isPaused: boolean;
    isFocused: boolean;
    shouldPreload: boolean;
    onVideoLoad: () => void;
    onVideoProgress: () => void;
    onVideoBuffer: (state: { isBuffering: boolean }) => void;
    onVideoEnd: () => void;
    onTogglePause: () => void;
    onToggleMute: () => void;
    colors: any;
    insets: any;
}

const ShotItem: React.FC<ShotItemProps> = React.memo(({
    item,
    index,
    isActive,
    isMuted,
    isPaused,
    isFocused,
    shouldPreload,
    onVideoLoad,
    onVideoProgress,
    onVideoBuffer,
    onVideoEnd,
    onTogglePause,
    onToggleMute,
    colors,
    insets,
}) => {
    const videoRef = useRef<VideoRef>(null);

    // ─── Per-item URI resolution ────────────────────────────────
    // Each item resolves its own cached URI so that cache-resolve
    // transitions don't cause the parent to re-render all items.
    const [resolvedUri, setResolvedUri] = useState(item.media_url);

    useEffect(() => {
        let cancelled = false;
        getCachedUri(item.media_url).then(uri => {
            if (!cancelled) setResolvedUri(uri);
        });
        return () => { cancelled = true; };
    }, [item.media_url]);

    // ─── Fade-in: hide video until first frame is ready ─────────
    // This prevents the flash when the <Video> mounts but hasn't
    // rendered a frame yet (black frame over the thumbnail).
    const videoOpacity = useRef(new Animated.Value(0)).current;
    const hasLoaded = useRef(false);

    // Reset opacity when item leaves the preload window entirely
    useEffect(() => {
        if (!isActive && !shouldPreload) {
            hasLoaded.current = false;
            videoOpacity.setValue(0);
        }
    }, [isActive, shouldPreload]);

    // When a pre-loaded video becomes active and already loaded,
    // snap opacity to 1 immediately (onLoad won't fire again).
    useEffect(() => {
        if (isActive && hasLoaded.current) {
            videoOpacity.setValue(1);
        }
    }, [isActive]);

    // Internal load handler — always fades in, regardless of active state.
    // This ensures pre-buffered videos are already visible when scrolled to.
    const handleInternalLoad = useCallback(() => {
        if (!hasLoaded.current) {
            hasLoaded.current = true;
            Animated.timing(videoOpacity, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [videoOpacity]);

    // Forward parent callbacks only when active
    const handleLoad = useCallback(() => {
        handleInternalLoad();
        if (isActive) onVideoLoad();
    }, [handleInternalLoad, isActive, onVideoLoad]);

    // Memory optimization:
    // When tab is focused, mount active + preload pipeline.
    // When tab loses focus, ONLY keep the active video mounted so it can resume instantly,
    // and aggressively destroy the pre-buffers to save RAM.
    const shouldRenderVideo = isFocused ? (isActive || shouldPreload) : isActive;

    return (
        <View style={[styles.itemContainer, { height: SCREEN_HEIGHT }]}>
            {/* Thumbnail as poster (always present) */}
            {item.thumbnail_url && (
                <FastImage
                    source={{ uri: item.thumbnail_url }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="contain"
                />
            )}

            {/* Video layer — fades in over thumbnail once first frame is decoded */}
            {shouldRenderVideo && (
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: videoOpacity }]}>
                    <Video
                        ref={videoRef}
                        source={{ uri: resolvedUri }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="contain"
                        controls={false}
                        muted={isMuted}
                        paused={!isActive || isPaused || !isFocused}
                        repeat={true}
                        onLoad={handleLoad}
                        onProgress={isActive ? onVideoProgress : undefined}
                        onBuffer={isActive ? onVideoBuffer : undefined}
                        onEnd={isActive ? onVideoEnd : undefined}
                        bufferConfig={{
                            minBufferMs: 3000,
                            maxBufferMs: 15000,
                            bufferForPlaybackMs: 500,
                            bufferForPlaybackAfterRebufferMs: 1500,
                        }}
                        pointerEvents="none"
                    />
                </Animated.View>
            )}

            {/* Tap to pause/play overlay */}
            <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
                onPress={onTogglePause}
            />

            {/* Paused indicator */}
            {isPaused && isActive && (
                <View style={styles.pausedOverlay} pointerEvents="none">
                    <Ionicons name="play" size={64} color="rgba(255,255,255,0.8)" />
                </View>
            )}

            {/* Bottom dark overlay */}
            {/* <View
                style={styles.bottomGradient}
                pointerEvents="none"
            /> */}

            {/* Bottom info */}
            <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 100 }]} pointerEvents="none">
                <View style={styles.profileRow}>
                    {item.profile_avatar && (
                        <FastImage
                            source={{ uri: item.profile_avatar }}
                            style={styles.avatar}
                        />
                    )}
                    <Text style={styles.profileName}>{item.profile_name}</Text>
                </View>
                {item.caption && (
                    <Text style={styles.caption} numberOfLines={2}>
                        {item.caption}
                    </Text>
                )}
            </View>

            {/* Right side actions */}
            <View style={[styles.rightActions, { bottom: insets.bottom + 110 }]}>
                {/* Mute/Unmute */}
                <TouchableOpacity style={styles.actionButton} onPress={onToggleMute}>
                    {isMuted ? <MutedBold
                        size={26}
                        color="white"
                    /> : <VolumeLoudBold
                        size={26}
                        color="white"
                    />}
                </TouchableOpacity>

                {/* Placeholder actions — will be implemented later */}
                <TouchableOpacity style={styles.actionButton}>
                    <HeartBold size={26} color="white" />
                    <Text style={styles.actionText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <ChatRoundLikeBold size={26} color="white" />
                    <Text style={styles.actionText}>0</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <SquareShareLineBold size={26} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    // Custom memo comparison for performance
    return (
        prevProps.isActive === nextProps.isActive &&
        prevProps.isMuted === nextProps.isMuted &&
        prevProps.isPaused === nextProps.isPaused &&
        prevProps.isFocused === nextProps.isFocused &&
        prevProps.shouldPreload === nextProps.shouldPreload &&
        prevProps.item.id === nextProps.item.id
    );
});

// ─── Main Shots Screen ──────────────────────────────────────────────
const ShotsScreen = () => {
    const vm = useShotsViewModel();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();

    const renderItem = useCallback(({ item, index }: { item: VideoItem; index: number }) => {
        const isActive = index === vm.activeIndex;
        const shouldPreload = vm.preloadIndices.includes(index);

        return (
            <ShotItem
                item={item}
                index={index}
                isActive={isActive}
                isMuted={vm.isMuted}
                isPaused={vm.isPaused}
                isFocused={isFocused}
                shouldPreload={shouldPreload}
                onVideoLoad={vm.onVideoLoad}
                onVideoProgress={vm.onVideoProgress}
                onVideoBuffer={vm.onVideoBuffer}
                onVideoEnd={vm.onVideoEnd}
                onTogglePause={vm.togglePause}
                onToggleMute={vm.toggleMute}
                colors={vm.colors}
                insets={insets}
            />
        );
    }, [vm.activeIndex, vm.isMuted, vm.isPaused, isFocused, vm.preloadIndices, vm.colors, insets]);

    const keyExtractor = useCallback((item: VideoItem) => item.id, []);

    // ─── Shared top header (always visible regardless of state) ────────
    const topHeader = (
        <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
                style={styles.headerTab}
                onPress={() => vm.switchFeedType('random')}
            >
                <Text style={[styles.headerTitle, vm.feedType === 'random' ? styles.activeTabTitle : styles.inactiveTabTitle]}>Following</Text>
                <View style={[styles.activeTabIndicator, vm.feedType !== 'random' && { backgroundColor: 'transparent' }]} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.headerTab}
                onPress={() => vm.switchFeedType('on_this_day')}
            >
                <Text style={[styles.headerTitle, vm.feedType === 'on_this_day' ? styles.activeTabTitle : styles.inactiveTabTitle]}>This day</Text>
                <View style={[styles.activeTabIndicator, vm.feedType !== 'on_this_day' && { backgroundColor: 'transparent' }]} />
            </TouchableOpacity>
        </View>
    );

    // Loading state
    if (vm.isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <ActivityIndicator size="large" color="white" style={{ flex: 1 }} />
                {topHeader}
            </View>
        );
    }

    // Empty/error state
    if (vm.videos.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.5)" />
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 12 }}>
                    {vm.isError ? "Failed to load videos" : "No videos yet"}
                </Text>
                <TouchableOpacity
                    onPress={() => vm.refetch()}
                    style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}
                >
                    <Text style={{ color: 'white', fontSize: 14 }}>Retry</Text>
                </TouchableOpacity>
                {topHeader}
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <FlashList
                ref={vm.listRef}
                data={vm.videos}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                pagingEnabled
                showsVerticalScrollIndicator={false}
                snapToInterval={SCREEN_HEIGHT}
                snapToAlignment="start"
                decelerationRate="fast"
                disableIntervalMomentum
                onViewableItemsChanged={vm.onViewableItemsChanged}
                viewabilityConfig={vm.viewabilityConfig}
            />

            {topHeader}

            {/* Buffering indicator */}
            {/* {vm.isBuffering && (
                <View style={styles.bufferingIndicator} pointerEvents="none">
                    <ActivityIndicator size="large" color="rgba(255,255,255,0.7)" />
                </View>
            )} */}
        </View>
    );
};

export default ShotsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    itemContainer: {
        width: SCREEN_WIDTH,
        backgroundColor: '#000',
    },
    pausedOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 250,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    bottomInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 70,
        paddingHorizontal: 16,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    profileName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    caption: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 13,
        lineHeight: 18,
    },
    rightActions: {
        position: 'absolute',
        right: 12,
        alignItems: 'center',
        gap: 15,
    },
    actionButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: 'white',
        fontSize: 12,
        marginTop: 2,
        fontWeight: '600',
    },
    topHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        paddingHorizontal: 16,
        paddingBottom: 8,
        zIndex: 10,
    },
    headerTab: {
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    activeTabTitle: {
        color: '#fff',
    },
    inactiveTabTitle: {
        color: 'rgba(255,255,255,0.6)',
    },
    activeTabIndicator: {
        width: 24,
        height: 3,
        backgroundColor: '#fff',
        borderRadius: 2,
        marginTop: 6,
    },
    bufferingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -15,
        marginTop: -15,
    },
});
