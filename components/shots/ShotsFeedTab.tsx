import { FlexText } from "@/components/FlexText";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import { VideoFeedType, VideoItem } from "@/types/video";
import { useShotsViewModel } from "@/viewmodels/ShotsViewModel";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list/react-native";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useIsFocused } from "expo-router/react-navigation";
import { Spinner } from "panelui-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    LayoutChangeEvent,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
    ViewToken
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    DECELERATION_RATE,
    Direction,
    DRAW_DISTANCE_MULTIPLIER,
    FALLBACK_ITEM_HEIGHT,
    ITEM_OVERLAP,
    SCROLL_EVENT_THROTTLE,
} from "./constants";
import { ShotItem } from "./ShotItem";

// ─── Feed Tab (adopting reference VideoFeedList pattern with LegendList) ─
export const ShotsFeedTab = ({ feedType }: { feedType: VideoFeedType }) => {
    const { width: screenWidth } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const vm = useShotsViewModel(feedType, isFocused);
    const { t } = useTranslation();

    // ─── Ref-based active index + direction tracking (reference pattern) ──
    const currentIndexRef = useRef(0);
    const directionRef = useRef<Direction>("down");

    // renderTrigger: bumped on index change OR pause change so LegendList
    // re-evaluates renderItem with the latest closure values for ALL visible items.
    const [renderTrigger, setRenderTrigger] = useState(0);

    // ─── Seeking state (disables scroll during seek-bar drag) ────────────
    const [seeking, setSeeking] = useState(false);
    const handleSeekingChange = useCallback((value: boolean) => {
        setSeeking(value);
    }, []);

    // ─── Measured container height for precise snapping (reference pattern) ─
    const [measuredHeight, setMeasuredHeight] = useState<number | null>(
        Platform.OS === "ios" ? FALLBACK_ITEM_HEIGHT : null,
    );
    const handleContainerLayout = useCallback((e: LayoutChangeEvent) => {
        const h = Math.ceil(e.nativeEvent.layout.height);
        if (h > 0) setMeasuredHeight(h);
    }, []);

    const itemHeight = useMemo(
        () => (measuredHeight ?? FALLBACK_ITEM_HEIGHT) + ITEM_OVERLAP,
        [measuredHeight],
    );
    const listReady = useMemo(() => measuredHeight !== null, [measuredHeight]);

    // ─── Viewability config (reference pattern) ───────────────────────────
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        waitForInteraction: false,
        minimumViewTime: 0,
    }).current;

    // ─── Viewable items changed handler (reference pattern) ──────────────
    const handleVideoChange = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            const nextIndex = viewableItems[0]?.index ?? -1;
            if (nextIndex === -1 || vm.videos.length === 0) {
                return;
            }
            const maxIndex = vm.videos.length - 1;
            const clampedIndex = Math.max(0, Math.min(nextIndex, maxIndex));
            const prevIndex = currentIndexRef.current;

            if (clampedIndex === prevIndex) {
                return;
            }

            directionRef.current = clampedIndex > prevIndex ? "down" : "up";
            currentIndexRef.current = clampedIndex;

            // Sync with ViewModel's activeIndex for like state, comments, etc.
            vm.onViewableItemsChanged({
                viewableItems: [{
                    index: clampedIndex,
                    item: vm.videos[clampedIndex],
                    isViewable: true,
                    key: vm.videos[clampedIndex]?.id,
                }],
            });

            setRenderTrigger(t => t + 1);
        },
        [vm.videos.length, vm.onViewableItemsChanged],
    );

    // ─── renderItem — 3-Player Pool Pattern matching Bluesky architecture ─
    const vmRef = useRef(vm);
    vmRef.current = vm;

    const renderItem = useCallback(
        ({ item, index }: LegendListRenderItemProps<VideoItem>) => {
            const currentIndex = currentIndexRef.current;
            const isActive = isFocused && index === currentIndex;
            const isAdjacent = index === currentIndex - 1 || index === currentIndex + 1;
            const player = vmRef.current.players?.[index % 3];

            // Read live vm values via ref
            const { isLiked, likeCount } = vmRef.current.getLikeState(item);
            const { isBookmarked, bookmarkCount } = vmRef.current.getBookmarkState(item);
            const { isReposted, repostCount } = vmRef.current.getRepostState(item);

            return (
                <ShotItem
                    item={item}
                    player={player}
                    isActive={isActive}
                    isAdjacent={isAdjacent}
                    isFocused={isFocused}
                    isPaused={isActive ? vmRef.current.isPaused : false}
                    itemHeight={itemHeight}
                    isLiked={isLiked}
                    likeCount={likeCount}
                    isBookmarked={isBookmarked}
                    bookmarkCount={bookmarkCount}
                    isReposted={isReposted}
                    repostCount={repostCount}
                    onLikePress={() => vmRef.current.handleLikePress(item)}
                    onCommentPress={() => vmRef.current.handleCommentPress(item)}
                    onBookmarkPress={() => vmRef.current.handleBookmarkPress(item)}
                    onRepostPress={() => vmRef.current.handleRepostPress(item)}
                    onTogglePause={vmRef.current.togglePause}
                    onSeekingChange={handleSeekingChange}
                    colors={vmRef.current.colors}
                    insets={insets}
                    isCommentsOpen={vmRef.current.isCommentsOpen}
                />
            );
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [renderTrigger, itemHeight, isFocused, insets, handleSeekingChange],
    );

    const keyExtractor = useCallback((item: VideoItem) => item.id, []);

    const handleVideoChangeRef = useRef(handleVideoChange);
    handleVideoChangeRef.current = handleVideoChange;

    const viewabilityConfigCallbackPairsRef = useRef<any>(null);
    if (!viewabilityConfigCallbackPairsRef.current) {
        viewabilityConfigCallbackPairsRef.current = [
            {
                viewabilityConfig,
                onViewableItemsChanged: (info: any) => {
                    handleVideoChangeRef.current(info);
                },
            },
        ];
    }
    const viewabilityConfigCallbackPairs = viewabilityConfigCallbackPairsRef.current;

    const getItemType = useCallback(() => "video", []);

    const drawDistance = useMemo(
        () => itemHeight * DRAW_DISTANCE_MULTIPLIER,
        [itemHeight],
    );

    // ─── Bump renderTrigger when isPaused, isCommentsOpen, isFocused, activeIndex or interaction maps change ───
    useEffect(() => {
        setRenderTrigger(t => t + 1);
    }, [vm.isPaused, vm.isCommentsOpen, isFocused, vm.activeIndex, vm.likeMap, vm.bookmarkMap, vm.repostMap]);

    if (vm.isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Spinner size="lg" color="white" />
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
        <View style={[styles.container, { backgroundColor: '#000' }]} onLayout={handleContainerLayout}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {listReady ? (
                <LegendList
                    ref={vm.listRef}
                    data={vm.videos}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    extraData={renderTrigger}
                    getItemType={getItemType}
                    getFixedItemSize={() => itemHeight}
                    estimatedItemSize={itemHeight}
                    estimatedListSize={{ height: itemHeight, width: screenWidth }}
                    drawDistance={itemHeight}
                    recycleItems={true}
                    scrollEnabled={!vm.isCommentsOpen && !seeking}
                    pagingEnabled={true}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={itemHeight}
                    snapToAlignment="start"
                    decelerationRate={DECELERATION_RATE}
                    scrollEventThrottle={SCROLL_EVENT_THROTTLE}
                    disableIntervalMomentum={true}
                    viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
                    onEndReached={() => vm.loadMore()}
                    onEndReachedThreshold={0.8}
                    bounces={false}
                    overScrollMode="never"
                    style={[styles.list, { width: screenWidth }]}
                    contentContainerStyle={styles.listContent}
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
                />
            ) : null}

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

// ─── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingVertical: 0,
        flexGrow: 1,
    },
    placeholder: {
        backgroundColor: "black",
    },
});
