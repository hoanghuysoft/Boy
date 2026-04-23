import { FlexText } from "@/components/FlexText";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import { getCachedUri } from "@/services/videoCache";
import { VideoFeedType, VideoItem } from "@/types/video";
import FastImage from "@d11/react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";
import {
    ReanimatedTrueSheetProvider,
    useReanimatedTrueSheet,
} from "@lodev09/react-native-true-sheet/reanimated";
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
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
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import Reanimated, { runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video, { VideoRef } from "react-native-video";
import { useShotsViewModel } from "../../viewmodels/ShotsViewModel";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Floating Heart Animation ──────────────────────────────────────────────
const FloatingHeart = React.memo(({ x, y, onComplete }: { x: number, y: number, onComplete: () => void }) => {
    const scale = useSharedValue(0);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    useEffect(() => {
        // Pop in
        scale.value = withSequence(
            withSpring(1.2, { damping: 10, stiffness: 200 }),
            withSpring(1, { damping: 10, stiffness: 200 })
        );
        // Float up
        translateY.value = withTiming(-150, { duration: 1000 });
        // Fade out
        opacity.value = withSequence(
            withTiming(1, { duration: 600 }),
            withTiming(0, { duration: 400 }, (finished) => {
                if (finished) {
                    runOnJS(onComplete)();
                }
            })
        );
    }, []);

    const style = useAnimatedStyle(() => {
        return {
            position: 'absolute',
            left: x - 50, // center horizontally (icon size 100)
            top: y - 50,  // center vertically
            transform: [
                { translateY: translateY.value },
                { scale: scale.value },
                { rotate: '-15deg' }
            ],
            opacity: opacity.value,
        };
    });

    return (
        <Reanimated.View style={[style, { zIndex: 9999 }]} pointerEvents="none">
            <HeartBold size={100} color="#ff4d6d" />
        </Reanimated.View>
    );
});

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

    const [hearts, setHearts] = useState<{ id: number, x: number, y: number }[]>([]);
    const lastTapTime = useRef(0);
    const singleTapTimer = useRef<NodeJS.Timeout | null>(null);

    const handleVideoPress = (e: any) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        // Always clear the single tap timeout if a new tap arrives
        if (singleTapTimer.current) {
            clearTimeout(singleTapTimer.current);
            singleTapTimer.current = null;
        }

        if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
            // Double tap or rapid multi-tap!
            if (!isLiked) {
                onLikePress();
            }
            const { locationX, locationY } = e.nativeEvent;
            // Use something unique for ID in case of ultra-fast taps with same ms
            setHearts(prev => [...prev, { id: now + Math.random(), x: locationX, y: locationY }]);
            // Keep the chain alive! No reset to 0 so 3rd taps also register as multi-taps
            lastTapTime.current = now;
        } else {
            // First tap of a new sequence
            lastTapTime.current = now;
            singleTapTimer.current = setTimeout(() => {
                onTogglePause(); // Single tap behaviour executes after delay
                singleTapTimer.current = null;
            }, DOUBLE_TAP_DELAY);
        }
    };

    const removeHeart = useCallback((id: number) => {
        setHearts(prev => prev.filter(h => h.id !== id));
    }, []);

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

            {/* Tap to pause/play / double tap to like — covers the full item */}
            <TouchableOpacity
                activeOpacity={1}
                style={StyleSheet.absoluteFill}
                onPress={handleVideoPress}
            />

            {/* Render Floating Hearts */}
            {hearts.map(heart => (
                <FloatingHeart
                    key={heart.id}
                    x={heart.x}
                    y={heart.y}
                    onComplete={() => removeHeart(heart.id)}
                />
            ))}

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
const ShotsFeedTab = ({ feedType }: { feedType: VideoFeedType }) => {
    const vm = useShotsViewModel(feedType);
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const { t } = useTranslation();

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

    if (vm.isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <ActivityIndicator size="large" color="white" style={{ flex: 1 }} />
            </View>
        );
    }

    if (vm.videos.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Ionicons name="videocam-off-outline" size={48} color="rgba(255,255,255,0.5)" />
                <FlexText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 12 }}>
                    {vm.isError ? t('shots.empty.error') : t('shots.empty.noVideos')}
                </FlexText>
                <TouchableOpacity
                    onPress={() => vm.refetch()}
                    style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20 }}
                >
                    <FlexText style={{ color: 'white', fontSize: 14 }}>{t('shots.actions.retry')}</FlexText>
                </TouchableOpacity>
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
                bounces
                onViewableItemsChanged={vm.onViewableItemsChanged}
                viewabilityConfig={vm.viewabilityConfig}
                onEndReached={() => vm.loadMore()}
                onEndReachedThreshold={0.8}
                refreshControl={
                    <RefreshControl
                        refreshing={vm.isRefetching}
                        onRefresh={vm.refetch}
                        tintColor={vm.colors.text}
                        colors={[vm.colors.text]}
                        progressBackgroundColor={vm.colors.card}
                        progressViewOffset={insets.top + 30}
                    />
                }
                ListFooterComponent={
                    vm.isFetchingNextPage ? (
                        <View style={{ paddingVertical: 24 }}>
                            <ActivityIndicator size="small" color="rgba(255,255,255,0.8)" />
                        </View>
                    ) : null
                }
            />

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

// ─── Tab Bar Implementation ──────────────────────────────────────────

const TopTabBar = ({ state, navigation, insets, t }: MaterialTopTabBarProps & { insets: any, t: any }) => {
    return (
        <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const title = route.name === 'random' ? t('shots.tabs.following') : t('shots.tabs.thisDay');

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });
                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                return (
                    <TouchableOpacity
                        key={route.key}
                        style={styles.headerTab}
                        onPress={onPress}
                    >
                        <FlexText style={[styles.headerTitle, isFocused ? styles.activeTabTitle : styles.inactiveTabTitle]}>
                            {title}
                        </FlexText>
                        <View style={[styles.activeTabIndicator, !isFocused && { backgroundColor: 'transparent' }]} />
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

// ─── Navigator ──────────────────────────────────────────────────────

const Tab = createMaterialTopTabNavigator();

const RandomFeedScreen = () => <ShotsFeedTab feedType="random" />;
const OnThisDayFeedScreen = () => <ShotsFeedTab feedType="on_this_day" />;

const ShotsInner = () => {
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            tabBar={(props: any) => <TopTabBar {...props} insets={insets} t={t} />}
            screenOptions={{ sceneStyle: { backgroundColor: '#000' } }}
        >
            <Tab.Screen name="random" component={RandomFeedScreen} />
            <Tab.Screen name="on_this_day" component={OnThisDayFeedScreen} />
        </Tab.Navigator>
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
        zIndex: 1000,
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
