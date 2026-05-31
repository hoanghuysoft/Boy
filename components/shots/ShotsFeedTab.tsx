import { FlexText } from "@/components/FlexText";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import { VideoFeedType, VideoItem } from "@/types/video";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { LegendList, LegendListRef, ViewToken } from "@legendapp/list/react-native";
import { useIsFocused } from "expo-router/react-navigation";
import { Spinner } from "heroui-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    LayoutChangeEvent,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShotsViewModel } from "@/viewmodels/ShotsViewModel";
import {
    DECELERATION_RATE,
    Direction,
    DRAW_DISTANCE_MULTIPLIER,
    FALLBACK_ITEM_HEIGHT,
    ITEM_OVERLAP,
    PRELOAD_AHEAD,
    PRELOAD_BEHIND,
    SCREEN_WIDTH,
    SCROLL_EVENT_THROTTLE,
    USE_PLACEHOLDER_OUTSIDE_PRELOAD,
} from "./constants";
import { ShotItem } from "./ShotItem";

// ─── Feed Tab (adopting reference VideoFeedList pattern with LegendList) ─
export const ShotsFeedTab = ({ feedType }: { feedType: VideoFeedType }) => {
    const vm = useShotsViewModel(feedType);
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const { t } = useTranslation();

    // ─── Ref-based active index tracking (from reference) ──────────
    const currentIndexRef = useRef(0);
    const directionRef = useRef<Direction>("down");
    const [renderTrigger, setRenderTrigger] = useState(0);

    // ─── Seeking state (disables scroll during seek bar drag, like reference SeekContext) ──
    const [seeking, setSeeking] = useState(false);
    const handleSeekingChange = useCallback((value: boolean) => {
        setSeeking(value);
    }, []);

    // ─── Measured container height for precise snapping (from reference) ──
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
    const listRef = useRef<LegendListRef | null>(null);

    // ─── Viewability config (from reference) ───────────────────────
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
        waitForInteraction: false,
        minimumViewTime: 0,
        viewAreaCoveragePercentThreshold: 50,
    }).current;

    // ─── Viewable items changed handler (from reference) ───────────
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
                viewableItems: [{ index: clampedIndex, item: vm.videos[clampedIndex], isViewable: true, key: vm.videos[clampedIndex]?.id }],
            });

            setRenderTrigger((t) => t + 1);
        },
        [vm.videos.length, vm.onViewableItemsChanged],
    );

    // ─── renderItem with direction-aware preloading (from reference) ──
    const renderItem = useCallback(
        ({ item, index }: { item: VideoItem; index: number }) => {
            const currentIndex = currentIndexRef.current;
            const direction = directionRef.current;
            const isActive = index === currentIndex;
            const distanceFromActive = index - currentIndex;
            const isAhead =
                direction === "down"
                    ? distanceFromActive > 0
                    : distanceFromActive < 0;

            const isNeighbor = Math.abs(distanceFromActive) <= 1;
            const shouldPreloadAhead =
                isAhead && Math.abs(distanceFromActive) <= PRELOAD_AHEAD;
            const isBehind =
                direction === "down"
                    ? distanceFromActive < 0
                    : distanceFromActive > 0;
            const shouldPreloadBehind =
                isBehind && Math.abs(distanceFromActive) <= PRELOAD_BEHIND;

            const shouldPreload =
                isActive ||
                isNeighbor ||
                shouldPreloadAhead ||
                shouldPreloadBehind;

            // Render placeholder for items outside preload window (from reference)
            if (
                USE_PLACEHOLDER_OUTSIDE_PRELOAD &&
                !shouldPreload &&
                !isActive
            ) {
                return (
                    <View
                        style={[
                            styles.placeholder,
                            { width: SCREEN_WIDTH, height: itemHeight },
                        ]}
                    />
                );
            }

            const { isLiked, likeCount } = vm.getLikeState(item);

            return (
                <ShotItem
                    item={item}
                    isActive={isActive}
                    shouldPreload={shouldPreload}
                    isFocused={isFocused}
                    itemHeight={itemHeight}
                    isMuted={vm.isMuted}
                    isPaused={vm.isPaused}
                    isLiked={isLiked}
                    likeCount={likeCount}
                    onToggleMute={vm.toggleMute}
                    onLikePress={() => vm.handleLikePress(item)}
                    onCommentPress={() => vm.handleCommentPress(item)}
                    onSeekingChange={handleSeekingChange}
                    colors={vm.colors}
                    insets={insets}
                />
            );
        },
        [renderTrigger, itemHeight, vm.isMuted, vm.isPaused, vm.getLikeState, isFocused, vm.colors, insets],
    );

    const keyExtractor = useCallback((item: VideoItem) => item.id, []);

    // ─── LegendList performance helpers (from reference) ────────────
    const getFixedItemSize = useCallback(() => itemHeight, [itemHeight]);

    const viewabilityConfigCallbackPairs = useMemo(
        () => [
            {
                viewabilityConfig,
                onViewableItemsChanged: handleVideoChange,
            },
        ],
        [handleVideoChange],
    );

    const getItemType = useCallback(() => "video", []);

    const drawDistance = useMemo(
        () => itemHeight * DRAW_DISTANCE_MULTIPLIER,
        [itemHeight],
    );

    if (vm.isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: '#000' }]}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
                <Spinner size="lg" color="white" style={{ flex: 1 }} />
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
                    ref={listRef}
                    data={vm.videos}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    extraData={renderTrigger}
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
                    estimatedItemSize={itemHeight}
                    getFixedItemSize={getFixedItemSize}
                    drawDistance={drawDistance}
                    getItemType={getItemType}
                    bounces={false}
                    overScrollMode="never"
                    style={styles.list}
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
    },
    list: {
        flex: 1,
        width: SCREEN_WIDTH,
    },
    listContent: {
        paddingVertical: 0,
        flexGrow: 1,
    },
    placeholder: {
        backgroundColor: "black",
    },
});
