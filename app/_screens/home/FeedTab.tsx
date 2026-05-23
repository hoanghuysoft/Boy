import { FlexText } from "@/components/FlexText";
import { queryClient } from "@/services/client";
import { useFeed } from "@/services/feed";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { Post } from "@/types/post";
import { choosenMediaPath } from "@/utils/imageurl";
import { LegendList, LegendListRef } from "@legendapp/list";
import { Image } from "expo-image";
import { SkeletonGroup } from "heroui-native";
import { uniqBy } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    Dimensions,
    NativeScrollEvent,
    NativeSyntheticEvent,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
    ViewabilityConfig,
    ViewToken
} from "react-native";
import { WebImages } from "react-native-nitro-web-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostItem } from "../../../components/PostItem";
import { useThemeContext } from "../../../context/ThemeContext";
import { useAudioStore } from "../../../stores/audio";
import { useScrollStore } from "../../../stores/scroll";
import { useSettingsStore } from "../../../stores/settings";
import { createCommonStyles } from "../../../styles/common";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// How many posts ahead to prefetch images for
const PREFETCH_AHEAD = 3;

// Fast-scroll velocity threshold (px/s) — above this, pause video activation
const FAST_SCROLL_PX_PER_SEC = 3000;

// Debounce duration when viewable items change during active scrolling
const VIEWABLE_DEBOUNCE_MS = 300;

interface FeedTabProps {
    feedType: "latest" | "lucky" | "this_day";
    onScroll?: (event: any) => void;
    onOptionsPress: (post: Post) => void;
    onLikeCountPress?: (post: Post) => void;
    onCommentPress?: (post: Post) => void;
    headerHeight: number;
}

const FeedTab: React.FC<FeedTabProps> = ({
    feedType,
    onScroll,
    onOptionsPress,
    onLikeCountPress,
    onCommentPress,
    headerHeight,
}) => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    const {
        data,
        isLoading,
        isRefetching,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useFeed(feedType);

    const posts = useMemo(() => {
        const allPosts = data?.pages.flatMap(page => page.data) || [];
        return uniqBy(allPosts, 'id');
    }, [data?.pages]);

    const bottomNavHeight = 67;
    const bottomNavMargin = 13;
    const extraPadding = 20;
    const bottomPadding = bottomNavHeight + bottomNavMargin + insets.bottom + extraPadding;

    const listRef = useRef<LegendListRef | null>(null);
    const trigger = useScrollStore((state) => state.triggers['index']);

    useEffect(() => {
        if (trigger > 0 && listRef.current) {
            listRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [trigger]);

    // ─── Feed Video Autoplay ────────────────────────────────────
    const setActiveVideo = useFeedVideoStore(s => s.setActiveVideo);
    const clearActiveVideo = useFeedVideoStore(s => s.clearActiveVideo);
    const stopAudioPlayback = useAudioStore(s => s.stopPlayback);

    // Debounce timer ref for video activation
    const videoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track last scroll state for velocity and drag detection
    const lastScrollOffsetRef = useRef(0);
    const lastScrollTimeRef = useRef(Date.now());
    const isScrollingFastRef = useRef(false);

    /**
     * lastVisibleIndicesRef — always reflects the most recent set of visible
     * item indices reported by onViewableItemsChanged.  Used by the "scroll
     * ended" handlers (momentum + drag-end) so they can activate the correct
     * video even when the viewability callback hasn't fired yet in that frame.
     */
    const lastVisibleIndicesRef = useRef<number[]>([]);

    // Clear active video when component unmounts (tab switch)
    useEffect(() => {
        return () => {
            clearActiveVideo();
            if (videoDebounceRef.current) {
                clearTimeout(videoDebounceRef.current);
            }
        };
    }, [clearActiveVideo]);

    // Autoplay setting
    const autoplayVideos = useSettingsStore(s => s.autoplayVideos);

    // Find the topmost visible post that has a video
    const findTopmostVideoPost = useCallback((visibleIndices: number[]) => {
        if (!posts.length || visibleIndices.length === 0) return null;

        // Sort indices to find the topmost (smallest index = closest to top)
        const sorted = [...visibleIndices].sort((a, b) => a - b);

        for (const idx of sorted) {
            const post = posts[idx];
            if (post?.media?.some((m: any) => m.type === 'video')) {
                // Only immediately activate the video if the carousel's first slot is a video.
                // If the first slot is an image (mixed-media carousel), activate the post
                // without a specific mediaId — the carousel's own viewability handler will
                // set the correct media once it knows which slot is visible.
                const firstMedia = post.media[0];
                if (firstMedia?.type === 'video') {
                    return {
                        postId: post.id,
                        mediaId: firstMedia.id as string | null,
                        videoUrl: choosenMediaPath(firstMedia) as string | null,
                    };
                } else {
                    return {
                        postId: post.id,
                        mediaId: null as string | null,
                        videoUrl: null as string | null,
                    };
                }
            }
        }
        return null;
    }, [posts]);

    // Shared helper: activate the best video post from a set of visible indices
    const activateVideoFromIndices = useCallback((indices: number[]) => {
        if (!autoplayVideos) {
            clearActiveVideo();
            return;
        }
        const result = findTopmostVideoPost(indices);
        if (result) {
            setActiveVideo(result.postId, result.mediaId, result.videoUrl);
            stopAudioPlayback();
        } else {
            clearActiveVideo();
        }
    }, [autoplayVideos, findTopmostVideoPost, setActiveVideo, clearActiveVideo, stopAudioPlayback]);

    const cancelDebounce = useCallback(() => {
        if (videoDebounceRef.current) {
            clearTimeout(videoDebounceRef.current);
            videoDebounceRef.current = null;
        }
    }, []);

    /**
     * Called when FlatList reports that the set of "viewable" items changed.
     *
     * Strategy:
     *  - Always update lastVisibleIndicesRef so scroll-end handlers have fresh data.
     *  - Run prefetch for upcoming posts.
     *  - If scrolling fast, skip activation (the scroll-end handler will pick it up).
     *  - Otherwise start a short debounce so rapid viewport changes (slow drag) don't
     *    thrash the video decoder.  The debounce is cancelled and superseded by the
     *    scroll-end handlers which fire immediately when the list truly stops.
     */
    const handleViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            const visibleIndices = viewableItems
                .map(v => v.index)
                .filter((i): i is number => i !== null);

            // Always keep a reference to the latest visible indices
            lastVisibleIndicesRef.current = visibleIndices;

            // Prefetch images for posts just beyond the visible window.
            if (visibleIndices.length > 0) {
                const maxVisible = Math.max(...visibleIndices);
                const aheadPosts = posts.slice(maxVisible + 1, maxVisible + 1 + PREFETCH_AHEAD);
                const nitroUrls: { url: string }[] = [];
                const expoUrls: { uri: string }[] = [];
                for (const p of aheadPosts) {
                    if (p.profile_avatar) nitroUrls.push({ url: p.profile_avatar });
                    for (const m of p.media ?? []) {
                        if (m.type === 'video' && m.thumbnail_url) expoUrls.push({ uri: m.thumbnail_url });
                        else if (m.type === 'photo' && m.url) expoUrls.push({ uri: m.url });
                    }
                }
                if (expoUrls.length > 0) for (const url of expoUrls) Image.prefetch(url.uri);
                if (nitroUrls.length > 0) for (const url of nitroUrls) WebImages.preload(url.url);
            }

            // Skip video autoplay if disabled
            if (!autoplayVideos) {
                clearActiveVideo();
                return;
            }

            // If scrolling fast, bail — momentumScrollEnd / scrollEndDrag will handle it
            if (isScrollingFastRef.current) return;

            // Cancel any existing debounce and start a fresh one.
            // This is the "slow drag" path; momentum/drag-end handlers cancel it early.
            cancelDebounce();
            videoDebounceRef.current = setTimeout(() => {
                activateVideoFromIndices(lastVisibleIndicesRef.current);
            }, VIEWABLE_DEBOUNCE_MS);
        },
        [posts, autoplayVideos, activateVideoFromIndices, clearActiveVideo, cancelDebounce]
    );

    /**
     * Called when a flick/momentum scroll fully stops.
     * This is the primary fast-path: cancel the debounce and activate immediately.
     */
    const handleMomentumScrollEnd = useCallback(() => {
        isScrollingFastRef.current = false;
        cancelDebounce();
        activateVideoFromIndices(lastVisibleIndicesRef.current);
    }, [activateVideoFromIndices, cancelDebounce]);

    /**
     * Called when a touch-drag scroll ends (user lifts finger, no momentum).
     * Without this, a slow drag that releases without flicking would wait the
     * full debounce delay because onMomentumScrollEnd never fires for non-flicks.
     */
    const handleScrollEndDrag = useCallback(
        (_event: NativeSyntheticEvent<NativeScrollEvent>) => {
            // Only act immediately if the scroll won't produce momentum.
            // We can't know for certain, so we use a short extra delay to let
            // onMomentumScrollBegin fire first — if it does, that path takes over.
            // If momentum begins, it will call cancelDebounce again; no double-fire.
            const DRAG_END_DELAY = 80; // ms — enough for momentum to start
            videoDebounceRef.current = setTimeout(() => {
                isScrollingFastRef.current = false;
                activateVideoFromIndices(lastVisibleIndicesRef.current);
            }, DRAG_END_DELAY);
        },
        [activateVideoFromIndices]
    );

    /**
     * When a momentum scroll begins, any drag-end timer becomes irrelevant.
     * Cancel it so handleMomentumScrollEnd takes exclusive responsibility.
     */
    const handleMomentumScrollBegin = useCallback(() => {
        cancelDebounce();
    }, [cancelDebounce]);

    const handleRefresh = useCallback(async () => {
        queryClient.removeQueries({ queryKey: ['feed', feedType] });
        refetch();
    }, [feedType, refetch]);

    /**
     * viewabilityConfigCallbackPairs — React Native's recommended API when
     * you need viewability callbacks.  Using this ref-based approach avoids
     * the "changing onViewableItemsChanged on the fly is not supported" warning
     * that can occur when the callback prop reference changes across renders.
     */
    const viewabilityConfigCallbackPairs = useRef([
        {
            viewabilityConfig: {
                // An item is "viewable" when at least 60 % of its height is visible
                // and it has been in that state for at least 200 ms at the native level.
                // 60 % (vs 50 %) avoids triggering on the item that is just peeking
                // at the top/bottom edge of the viewport.
                itemVisiblePercentThreshold: 60,
                minimumViewTime: 200,
            } as ViewabilityConfig,
            onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
                // Forward to the memoised handler (read via ref to stay stable)
                handleViewableItemsChangedRef.current({ viewableItems });
            },
        },
    ]);

    // Keep a ref to handleViewableItemsChanged so the stable pair callback above
    // always calls the latest version without needing to recreate the pairs array.
    const handleViewableItemsChangedRef = useRef(handleViewableItemsChanged);
    useEffect(() => {
        handleViewableItemsChangedRef.current = handleViewableItemsChanged;
    }, [handleViewableItemsChanged]);

    // Row renderer for FlatList
    const renderItem = useCallback(({ item }: { item: Post }) => {
        return (
            <View style={{ marginBottom: 30 }}>
                <PostItem post={item} onOptionsPress={onOptionsPress} onLikeCountPress={onLikeCountPress} onCommentPress={onCommentPress} />
            </View>
        );
    }, [onOptionsPress, onLikeCountPress, onCommentPress]);

    const renderPostSkeleton = useCallback(() => {
        return (
            <SkeletonGroup
                isLoading={true}
                variant="pulse"
                style={{ marginTop: 20 }}
            >
                <View style={[common.row, { gap: 10, marginBottom: 12, paddingHorizontal: 16 }]}>
                    <SkeletonGroup.Item className="rounded-full" style={{ width: 30, height: 30 }} />
                    <SkeletonGroup.Item className="rounded-lg" style={{ width: 120, height: 16 }} />
                </View>
                <View style={{ gap: 8, marginBottom: 12, paddingHorizontal: 16 }}>
                    <SkeletonGroup.Item className="rounded-md" style={{ width: '100%', height: 14 }} />
                    <SkeletonGroup.Item className="rounded-md" style={{ width: '80%', height: 14 }} />
                </View>
                <SkeletonGroup.Item style={{ width: '100%', height: 200 }} />
            </SkeletonGroup>
        );
    }, [common.row]);

    const renderEmptyState = () => {
        const emptyMessages: Record<string, string> = {
            latest: t('home.feed.emptyLatest'),
            lucky: t('home.feed.emptyLucky'),
            this_day: t('home.feed.emptyThisDay'),
        };

        return (
            <View style={styles.emptyState}>
                <FlexText style={[common.heading, { color: colors.muted, textAlign: 'center' }]}>
                    {t('home.feed.emptyTitle')}
                </FlexText>
                <FlexText style={[common.label, { color: colors.muted, textAlign: 'center', marginTop: 8 }]}>
                    {emptyMessages[feedType]}
                </FlexText>
            </View>
        );
    };

    // Handle scroll events — detect fast scrolling for velocity gate
    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;

        const now = Date.now();
        const dt = now - lastScrollTimeRef.current;
        const dy = Math.abs(offsetY - lastScrollOffsetRef.current);
        lastScrollOffsetRef.current = offsetY;
        lastScrollTimeRef.current = now;

        const isFast = dt > 0 && (dy / dt) * 1000 > FAST_SCROLL_PX_PER_SEC;

        if (isFast) {
            isScrollingFastRef.current = true;
            clearActiveVideo();
            cancelDebounce();
        } else {
            // Once we drop below the fast threshold, mark as no longer fast
            // (scroll-end handlers will do the final reset, but this keeps
            //  the flag accurate during deceleration)
            isScrollingFastRef.current = false;
        }

        if (onScroll) {
            onScroll(event);
        }
    }, [onScroll, clearActiveVideo, cancelDebounce]);

    // Handle end reached for infinite scroll
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Render footer for loading state
    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return renderPostSkeleton();
        }
        return <View style={{ height: bottomPadding }} />;
    }, [isFetchingNextPage, bottomPadding, renderPostSkeleton]);

    if (isLoading) {
        return (
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: headerHeight + 10 }}
            >
                {renderPostSkeleton()}
                <View style={{ height: 12 }} />
                {renderPostSkeleton()}
                <View style={{ height: 12 }} />
                {renderPostSkeleton()}
            </ScrollView>
        );
    }

    if (posts.length === 0) {
        return (
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: headerHeight + 10, flex: 1 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                    />
                }
            >
                {renderEmptyState()}
            </ScrollView>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <LegendList
                ref={listRef}
                data={posts}
                renderItem={renderItem}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: headerHeight + 10,
                }}
                onMomentumScrollBegin={handleMomentumScrollBegin}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                onScrollEndDrag={handleScrollEndDrag}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                        progressViewOffset={-200}
                    />
                }
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
            />
        </View>
    );
};

export default FeedTab;

const styles = StyleSheet.create({
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
});
