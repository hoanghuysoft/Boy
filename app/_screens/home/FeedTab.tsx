import { FlexText } from "@/components/FlexText";
import { List } from "@/components/list";
import { useNonReactiveCallback } from "@/components/list/useNonReactiveCallback";
import { queryClient } from "@/services/client";
import { useFeed } from "@/services/feed";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { Post } from "@/types/post";
import { updateActiveVideoViewAsync } from "@bsky.app/video";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { uniqBy } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { FlatList } from "react-native";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostItem } from "../../../components/PostItem";
import { useThemeContext } from "../../../context/ThemeContext";
import { useScrollStore } from "../../../stores/scroll";
import { createCommonStyles } from "../../../styles/common";

// How many posts ahead to prefetch images for
const PREFETCH_AHEAD = 3;

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

    const stableOnOptionsPress = useNonReactiveCallback(onOptionsPress);
    const stableOnLikeCountPress = useNonReactiveCallback(onLikeCountPress);
    const stableOnCommentPress = useNonReactiveCallback(onCommentPress);

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

    const listRef = useRef<FlatList | null>(null);
    const trigger = useScrollStore((state) => state.triggers['index']);

    useEffect(() => {
        if (trigger > 0 && listRef.current) {
            listRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [trigger]);

    // ─── Feed Video Autoplay ────────────────────────────────────
    // We only keep the mute state for the store, and clear on unmount.
    const clearActiveVideo = useFeedVideoStore(s => s.clearActiveVideo);

    // Clear active video when component unmounts (tab switch)
    useEffect(() => {
        return () => {
            clearActiveVideo();
        };
    }, [clearActiveVideo]);

    // ─── Re-activate the correct video when navigating back to this screen ──
    // BlueskyVideoView destroys its ExoPlayer (turns black) when it loses
    // "active" status. updateActiveVideoViewAsync() is normally only triggered
    // by scroll events in List.tsx, so the video stays black until the user
    // scrolls. Calling it on focus-regain re-activates the most visible view
    // immediately — no scroll required.
    useFocusEffect(
        useCallback(() => {
            updateActiveVideoViewAsync();
            return () => {
                clearActiveVideo();
                updateActiveVideoViewAsync();
            };
        }, [clearActiveVideo])
    );

    /**
     * onScrollY — fires on every scroll frame with the raw Y offset.
     * Used to bridge the List's Reanimated scroll handler back to the
     * HomeViewModel's Animated.Value-based header animation system.
     *
     * Note: The List calls this via runOnJS so it already runs on the JS thread.
     */
    const handleScrollY = useCallback((y: number) => {
        if (onScroll) {
            // Synthesise a minimal scroll event compatible with vm.onScroll
            onScroll({ nativeEvent: { contentOffset: { y, x: 0 } } });
        }
    }, [onScroll]);

    /**
     * viewabilityConfigCallbackPairs — tracks visible items for:
     *   1. Prefetching upcoming posts' images
     *   2. Passing indices to activateVideoFromIndices on settle
     *
     * The List's built-in onItemSeen uses 40%/500ms for impression tracking.
     * This separate pair uses 60%/200ms for video activation — kept distinct
     * so video logic doesn't interfere with impression analytics.
     */
    const handleViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: { index: number | null; item: Post; isViewable: boolean }[] }) => {
            const visibleIndices = viewableItems
                .map(v => v.index)
                .filter((i): i is number => i !== null);
            // Prefetch images for posts just beyond the visible window
            if (visibleIndices.length > 0) {
                const maxVisible = Math.max(...visibleIndices);
                const aheadPosts = posts.slice(maxVisible + 1, maxVisible + 1 + PREFETCH_AHEAD);
                const urls: string[] = [];
                for (const p of aheadPosts) {
                    if (p.profile_avatar) urls.push(p.profile_avatar);
                    for (const m of p.media ?? []) {
                        if (m.type === 'video' && m.thumbnail_url) urls.push(m.thumbnail_url);
                        else if (m.type === 'photo' && m.url) urls.push(m.url);
                    }
                }
                if (urls.length > 0) for (const url of urls) Image.prefetch(url);
            }
        },
        [posts],
    );

    // Keep a ref so the stable viewabilityConfigCallbackPairs always calls the
    // latest closure without needing to recreate the array
    const handleViewableItemsChangedRef = useRef(handleViewableItemsChanged);
    useEffect(() => {
        handleViewableItemsChangedRef.current = handleViewableItemsChanged;
    }, [handleViewableItemsChanged]);

    const viewabilityConfigCallbackPairs = useMemo(() => [
        {
            viewabilityConfig: {
                itemVisiblePercentThreshold: 60,
                minimumViewTime: 200,
            },
            onViewableItemsChanged: ({ viewableItems }: any) => {
                handleViewableItemsChangedRef.current({ viewableItems });
            },
        },
    ], []);

    const handleRefresh = useCallback(async () => {
        queryClient.removeQueries({ queryKey: ['feed', feedType] });
        refetch();
    }, [feedType, refetch]);

    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Row renderer
    const renderItem = useCallback(({ item }: { item: Post }) => {
        return (
            <View style={{ marginBottom: 30 }}>
                <PostItem
                    post={item}
                    onOptionsPress={stableOnOptionsPress}
                    onLikeCountPress={stableOnLikeCountPress}
                    onCommentPress={stableOnCommentPress}
                />
            </View>
        );
    }, [stableOnOptionsPress, stableOnLikeCountPress, stableOnCommentPress]);

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
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
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
            <List
                ref={listRef}
                data={posts}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: headerHeight + 10,
                }}
                // ─── Scroll events ──────────────────────────────────────
                // onScrollY bridges the Reanimated handler to the ViewModel's
                // Animated.Value header animation (runs on JS thread via runOnJS)
                onScrollY={handleScrollY}
                // ─── Pull-to-refresh ────────────────────────────────────
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                refreshTintColor={colors.text}
                progressBackgroundColor={colors.card}
                // ─── Infinite scroll ────────────────────────────────────
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                // ─── Viewability (image prefetch + video index tracking) ─
                viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
                // ─── Performance (matching Bluesky's config) ────────────
                removeClippedSubviews={true}
                windowSize={9}
                maxToRenderPerBatch={5}
                updateCellsBatchingPeriod={40}
                initialNumToRender={4}
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
