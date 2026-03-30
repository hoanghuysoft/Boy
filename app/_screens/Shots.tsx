import { FlexText } from "@/components/FlexText";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import { getCachedUri } from "@/services/videoCache";
import { VideoItem } from "@/types/video";
import FastImage from "@d11/react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";
import {
    ReanimatedTrueSheetProvider,
    useReanimatedTrueSheet,
} from "@lodev09/react-native-true-sheet/reanimated";
import { useIsFocused } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import {
    ChatRoundLikeBold,
    HeartBold,
    MutedBold,
    SquareShareLineBold,
    VolumeLoudBold
} from "@solar-icons/react-native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
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
    isLiked: boolean;
    likeCount: number;
    onVideoLoad: () => void;
    onVideoProgress: () => void;
    onVideoBuffer: (state: { isBuffering: boolean }) => void;
    onVideoEnd: () => void;
    onTogglePause: () => void;
    onToggleMute: () => void;
    onLikePress: () => void;
    onCommentPress: () => void;
    colors: any;
    insets: any;
}

const ShotItem: React.FC<ShotItemProps> = React.memo(({
    item,
    isActive,
    isMuted,
    isPaused,
    isFocused,
    shouldPreload,
    isLiked,
    likeCount,
    onVideoLoad,
    onVideoProgress,
    onVideoBuffer,
    onVideoEnd,
    onTogglePause,
    onToggleMute,
    onLikePress,
    onCommentPress,
    colors,
    insets,
}) => {
    const videoRef = useRef<VideoRef>(null);

    // ─── Per-item URI resolution ────────────────────────────────
    const [resolvedUri, setResolvedUri] = useState(item.media_url);

    useEffect(() => {
        let cancelled = false;
        getCachedUri(item.media_url).then(uri => {
            if (!cancelled) setResolvedUri(uri);
        });
        return () => { cancelled = true; };
    }, [item.media_url]);

    // ─── Shrink via animatedPosition (UI-thread, zero JS overhead) ──
    // animatedPosition = Y of the sheet's top edge from screen top.
    // When the sheet is dismissed it returns to ~SCREEN_HEIGHT (full video).
    // When the sheet is open at detent 0.5 it is SCREEN_HEIGHT * 0.5.
    const { animatedPosition } = useReanimatedTrueSheet();
    const videoAreaStyle = useAnimatedStyle(() => {
        // Limit the video shrink to the initial comment sheet size (detent 0.6 -> top edge at 0.4)
        const minHeight = SCREEN_HEIGHT * 0.4;
        return {
            height: Math.max(animatedPosition.value, minHeight),
        };
    });

    const handleLoad = useCallback(() => {
        if (isActive) onVideoLoad();
    }, [isActive, onVideoLoad]);

    const shouldRenderVideo = isFocused ? (isActive || shouldPreload) : isActive;

    return (
        <View style={[styles.itemContainer, { height: SCREEN_HEIGHT }]}>
            {/* Video + thumbnail area — height tracks the sheet's top edge */}
            <Reanimated.View style={[styles.videoArea, videoAreaStyle]}>
                {item.thumbnail_url && (
                    <FastImage
                        source={{ uri: item.thumbnail_url }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="contain"
                    />
                )}

                {shouldRenderVideo && (
                    <Video
                        ref={videoRef}
                        source={{
                            uri: resolvedUri,
                            bufferConfig: {
                                minBufferMs: 3000,
                                maxBufferMs: 15000,
                                bufferForPlaybackMs: 500,
                                bufferForPlaybackAfterRebufferMs: 1500,
                            }
                        }}
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
                        pointerEvents="none"
                    />
                )}
            </Reanimated.View>

            {/* Tap to pause/play — covers the full item */}
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

            {/* Bottom info */}
            <View style={[styles.bottomInfo, { paddingBottom: insets.bottom + 100 }]} pointerEvents="none">
                <TouchableOpacity onPress={() => router.push(`/profile/${item.profile_id}`)} style={styles.profileRow}>
                    {item.profile_avatar && (
                        <FastImage
                            source={{ uri: item.profile_avatar }}
                            style={styles.avatar}
                        />
                    )}
                    <FlexText style={styles.profileName}>{item.profile_name}</FlexText>
                </TouchableOpacity>
                {item.caption && (
                    <FlexText style={styles.caption} numberOfLines={2}>
                        {item.caption}
                    </FlexText>
                )}
            </View>

            {/* Right side actions */}
            <View style={[styles.rightActions, { bottom: insets.bottom + 110 }]}>
                {/* Mute/Unmute */}
                <TouchableOpacity style={styles.actionButton} onPress={onToggleMute}>
                    {isMuted
                        ? <MutedBold size={26} color="white" />
                        : <VolumeLoudBold size={26} color="white" />
                    }
                </TouchableOpacity>

                {/* Like */}
                <TouchableOpacity style={styles.actionButton} onPress={onLikePress} hitSlop={10}>
                    {isLiked
                        ? <HeartBold size={28} color="#ff4d6d" />
                        : <HeartBold size={28} color="white" />
                    }
                    <FlexText style={[styles.actionText, isLiked && { color: '#ff4d6d' }]}>
                        {likeCount > 0 ? likeCount : 0}
                    </FlexText>
                </TouchableOpacity>

                {/* Comments */}
                <TouchableOpacity style={styles.actionButton} onPress={onCommentPress} hitSlop={10}>
                    <ChatRoundLikeBold size={26} color="white" />
                    <FlexText style={styles.actionText}>
                        {item.comment_count > 0 ? item.comment_count : 0}
                    </FlexText>
                </TouchableOpacity>

                {/* Share (placeholder) */}
                <TouchableOpacity style={styles.actionButton}>
                    <SquareShareLineBold size={26} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.isActive === nextProps.isActive &&
        prevProps.isMuted === nextProps.isMuted &&
        prevProps.isPaused === nextProps.isPaused &&
        prevProps.isFocused === nextProps.isFocused &&
        prevProps.shouldPreload === nextProps.shouldPreload &&
        prevProps.item.id === nextProps.item.id &&
        prevProps.item.comment_count === nextProps.item.comment_count &&
        prevProps.isLiked === nextProps.isLiked &&
        prevProps.likeCount === nextProps.likeCount
    );
});

ShotItem.displayName = 'ShotItem';

// ─── Inner screen (needs to be inside ReanimatedTrueSheetProvider) ─
const ShotsInner = () => {
    const vm = useShotsViewModel();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();

    const renderItem = useCallback(({ item, index }: { item: VideoItem; index: number }) => {
        const isActive = index === vm.activeIndex;
        const shouldPreload = vm.preloadIndices.includes(index);
        const { isLiked, likeCount } = vm.getLikeState(item);

        return (
            <ShotItem
                item={item}
                index={index}
                isActive={isActive}
                isMuted={vm.isMuted}
                isPaused={vm.isPaused}
                isFocused={isFocused}
                shouldPreload={shouldPreload}
                isLiked={isLiked}
                likeCount={likeCount}
                onVideoLoad={vm.onVideoLoad}
                onVideoProgress={vm.onVideoProgress}
                onVideoBuffer={vm.onVideoBuffer}
                onVideoEnd={vm.onVideoEnd}
                onTogglePause={vm.togglePause}
                onToggleMute={vm.toggleMute}
                onLikePress={() => vm.handleLikePress(item)}
                onCommentPress={() => vm.handleCommentPress(item)}
                colors={vm.colors}
                insets={insets}
            />
        );
    }, [
        vm.activeIndex,
        vm.isMuted,
        vm.isPaused,
        vm.getLikeState,
        isFocused,
        vm.preloadIndices,
        vm.colors,
        insets,
    ]);

    const keyExtractor = useCallback((item: VideoItem) => item.id, []);

    // ─── Shared top header ──────────────────────────────────────
    const topHeader = !vm.isCommentsOpen && (
        <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity
                style={styles.headerTab}
                onPress={() => vm.switchFeedType('random')}
            >
                <FlexText style={[styles.headerTitle, vm.feedType === 'random' ? styles.activeTabTitle : styles.inactiveTabTitle]}>
                    Following
                </FlexText>
                <View style={[styles.activeTabIndicator, vm.feedType !== 'random' && { backgroundColor: 'transparent' }]} />
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.headerTab}
                onPress={() => vm.switchFeedType('on_this_day')}
            >
                <FlexText style={[styles.headerTitle, vm.feedType === 'on_this_day' ? styles.activeTabTitle : styles.inactiveTabTitle]}>
                    This day
                </FlexText>
                <View style={[styles.activeTabIndicator, vm.feedType !== 'on_this_day' && { backgroundColor: 'transparent' }]} />
            </TouchableOpacity>
        </View>
    );

    if (vm.isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <ActivityIndicator size="large" color="white" style={{ flex: 1 }} />
                {topHeader}
            </View>
        );
    }

    if (vm.videos.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.5)" />
                <FlexText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 12 }}>
                    {vm.isError ? "Failed to load videos" : "No videos yet"}
                </FlexText>
                <TouchableOpacity
                    onPress={() => vm.refetch()}
                    style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}
                >
                    <FlexText style={{ color: 'white', fontSize: 14 }}>Retry</FlexText>
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
                scrollEnabled={!vm.isCommentsOpen}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                onViewableItemsChanged={vm.onViewableItemsChanged}
                viewabilityConfig={vm.viewabilityConfig}
                onEndReached={() => vm.loadMore()}
                onEndReachedThreshold={0.8}
                ListFooterComponent={
                    vm.isFetchingNextPage ? (
                        <View style={{ paddingVertical: 24 }}>
                            <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                        </View>
                    ) : null
                }
            />

            {topHeader}

            {/* Comments sheet — ReanimatedTrueSheet so animatedPosition drives video height */}
            <CommentsSheet
                ref={vm.commentsSheetRef}
                postId={vm.activeCommentPostId}
                onDismiss={vm.handleCommentsDismiss}
                useReanimated
                detents={[0.6]}
            />
        </View>
    );
};

// ─── Main Shots Screen ──────────────────────────────────────────────
// Wrapped with ReanimatedTrueSheetProvider so that useReanimatedTrueSheet()
// inside ShotItem can read animatedPosition from the CommentsSheet.
const ShotsScreen = () => (
    <ReanimatedTrueSheetProvider>
        <ShotsInner />
    </ReanimatedTrueSheetProvider>
);

export default ShotsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    itemContainer: {
        width: SCREEN_WIDTH,
        backgroundColor: '#000',
    },
    videoArea: {
        width: SCREEN_WIDTH,
        overflow: 'hidden',
    },
    pausedOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'center',
        alignItems: 'center',
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
});
