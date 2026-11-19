import { FlexText } from "@/components/FlexText";
import { List, type ListMethods } from "@/components/list";
import { useNonReactiveCallback } from "@/components/list/useNonReactiveCallback";
import { PostItem } from "@/components/PostItem";
import { usePrecacheProfileFromPost } from "@/services/profileCache";
import { useThemeContext } from "@/context/ThemeContext";
import { queryClient } from "@/services/client";
import { useFeed } from "@/services/feed";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { useScrollStore } from "@/stores/scroll";
import { createCommonStyles } from "@/styles/common";
import { Post } from "@/types/post";
import { updateActiveVideoViewAsync } from "@bsky.app/video";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { Shimmer, ShimmerGroup } from "@/components/ui/molecules/Shimmer/Shimmer";
import { uniqBy } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// How many posts ahead to prefetch images for
const PREFETCH_AHEAD = 2;

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

    const listRef = useRef<ListMethods | null>(null);
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
    const latestY = useRef(0);
    const lastScrollCall = useRef(0);

    const prefetchedUrls = useRef(new Set<string>());

    const handleScrollY = useCallback((y: number) => {
        latestY.current = y;
        if (onScroll) {
            const now = Date.now();
            if (now - lastScrollCall.current > 80) { // throttle to ~12fps
                lastScrollCall.current = now;
                onScroll({ nativeEvent: { contentOffset: { y, x: 0 } } });
            }
        }
    }, [onScroll]);

    const handleScrollSettled = useCallback(() => {
        if (onScroll) {
            onScroll({ nativeEvent: { contentOffset: { y: latestY.current, x: 0 } } });
        }
    }, [onScroll]);

    useEffect(() => {
        if (!isLoading && posts.length > 0) {
            const timer = setTimeout(() => {
                updateActiveVideoViewAsync();
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isLoading, posts.length]);

    const precacheProfile = usePrecacheProfileFromPost();

    /**
     * onItemSeen — fires via List's unified 40%/500ms viewability tracking.
     * Prefetches upcoming post images, avatars, and precaches profile stubs
     * without stuttering scroll.
     */
    const handleItemSeen = useCallback((item: Post) => {
        precacheProfile(item);
        if (item.reposted_post && !item.reposted_post.deleted) {
            precacheProfile(item.reposted_post);
        }

        const itemIndex = posts.findIndex(p => p.id === item.id);
        if (itemIndex >= 0) {
            const aheadPosts = posts.slice(itemIndex + 1, itemIndex + 1 + PREFETCH_AHEAD);
            for (const p of aheadPosts) {
                if (p.profile_avatar && !prefetchedUrls.current.has(p.profile_avatar)) {
                    prefetchedUrls.current.add(p.profile_avatar);
                    Image.prefetch(p.profile_avatar);
                }
                const firstMedia = p.media?.[0];
                if (firstMedia) {
                    const url = firstMedia.type === 'video' ? firstMedia.thumbnail_url : firstMedia.url;
                    if (url && !prefetchedUrls.current.has(url)) {
                        prefetchedUrls.current.add(url);
                        Image.prefetch(url);
                    }
                }
            }
        }
    }, [posts, precacheProfile]);

    const handleRefresh = useCallback(async () => {
        prefetchedUrls.current.clear(); // Reset prefetch memory on pull-to-refresh
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
            <View style={styles.cellWrapper}>
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
            <ShimmerGroup
                isLoading={true}
            >
                <View style={{ marginTop: 20 }}>
                    <View style={[common.row, { gap: 10, marginBottom: 12, paddingHorizontal: 16 }]}>
                        <Shimmer style={{ width: 30, height: 30, borderRadius: 15 }} />
                        <Shimmer style={{ width: 120, height: 16, borderRadius: 8 }} />
                    </View>
                    <View style={{ gap: 8, marginBottom: 12, paddingHorizontal: 16 }}>
                        <Shimmer style={{ width: '100%', height: 14, borderRadius: 6 }} />
                        <Shimmer style={{ width: '80%', height: 14, borderRadius: 6 }} />
                    </View>
                    <Shimmer style={{ width: '100%', height: 200 }} />
                </View>
            </ShimmerGroup>
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

    const listContentContainerStyle = useMemo(() => ({
        paddingTop: headerHeight + 10,
    }), [headerHeight]);

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
                contentContainerStyle={listContentContainerStyle}
                // ─── Scroll events ──────────────────────────────────────
                onScrollY={handleScrollY}
                onScrollSettled={handleScrollSettled}
                // ─── Pull-to-refresh ────────────────────────────────────
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                refreshTintColor={colors.text}
                progressBackgroundColor={colors.card}
                // ─── Infinite scroll ────────────────────────────────────
                onEndReached={handleEndReached}
                onEndReachedThreshold={2}
                ListFooterComponent={renderFooter}
                // ─── Viewability (image prefetch) ───────────────────────
                onItemSeen={handleItemSeen}
                // ─── Performance (LegendList) ────────────
                estimatedItemSize={480}
                drawDistance={500}
                getItemType={(item: Post) => {
                    const content = item.reposted_post || item;
                    if (content.media?.length) return 'media';
                    if (content.audio_url) return 'audio';
                    if (content.links?.length) return 'link';
                    if (content.music) return 'music';
                    return 'text';
                }}
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
    cellWrapper: {
        marginBottom: 30,
    },
});
