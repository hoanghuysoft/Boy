import { FlexText } from "@/components/FlexText";
import { queryClient } from "@/services/client";
import { useFeed } from "@/services/feed";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { Post } from "@/types/post";
import { choosenMediaPath } from "@/utils/imageurl";
import { Image } from "expo-image";
import { SkeletonGroup } from "heroui-native";
import { uniqBy } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, StyleSheet, View, ViewToken } from "react-native";
import { FlatList } from "react-native-gesture-handler";
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

// Estimated post height for FlashList
const ESTIMATED_POST_HEIGHT = 500;

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

    const listRef = useRef<FlatList<Post> | null>(null);
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
    // Track last scroll offset for velocity detection
    const lastScrollOffsetRef = useRef(0);
    const lastScrollTimeRef = useRef(Date.now());
    // Track the last known visible indices so momentumScrollEnd can use them
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
                    return { postId: post.id, mediaId: firstMedia.id as string | null, videoUrl: choosenMediaPath(firstMedia) as string | null };
                } else {
                    return { postId: post.id, mediaId: null as string | null, videoUrl: null as string | null };
                }
            }
        }
        return null;
    }, [posts]);

    // Autoplay setting
    const autoplayVideos = useSettingsStore(s => s.autoplayVideos);

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

    // Handle viewable items change from FlashList
    const handleViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        const visibleIndices = viewableItems.map(v => v.index).filter((i): i is number => i !== null);

        // Always keep a reference to the latest visible indices
        lastVisibleIndicesRef.current = visibleIndices;

        // Prefetch images for posts just beyond the visible window.
        // Route each URL to the cache of the component that will render it:
        // avatars → NitroImage.preload
        // photo media + video thumbnails → ExpoImage.prefetch
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

        // Clear any pending debounce
        if (videoDebounceRef.current) {
            clearTimeout(videoDebounceRef.current);
        }

        // Debounce: wait for indices to settle before activating video.
        // onMomentumScrollEnd provides a faster path when the list fully stops.
        videoDebounceRef.current = setTimeout(() => {
            activateVideoFromIndices(visibleIndices);
        }, 400);
    }, [posts, autoplayVideos, activateVideoFromIndices, clearActiveVideo]);

    // Immediately activate video when momentum scroll fully stops.
    // This prevents the debounce from being constantly reset during deceleration,
    // which caused the "fast scroll + stop at video = no autoplay" bug.
    const handleMomentumScrollEnd = useCallback(() => {
        if (videoDebounceRef.current) {
            clearTimeout(videoDebounceRef.current);
            videoDebounceRef.current = null;
        }
        activateVideoFromIndices(lastVisibleIndicesRef.current);
    }, [activateVideoFromIndices]);

    const handleRefresh = useCallback(async () => {
        queryClient.removeQueries({ queryKey: ['feed', feedType] });
        refetch();
    }, [feedType, refetch]);

    const viewabilityConfig = useMemo(() => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100,
    }), []);

    // Row renderer for FlashList
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

    // Handle scroll events
    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const offsetX = event.nativeEvent.contentOffset.x;

        // Track scroll velocity for fast-scroll detection
        const now = Date.now();
        const dt = now - lastScrollTimeRef.current;
        const dy = Math.abs(offsetY - lastScrollOffsetRef.current);
        lastScrollOffsetRef.current = offsetY;
        lastScrollTimeRef.current = now;

        // If scrolling very fast (>3000px/s), clear video to avoid wasted decoding
        if (dt > 0 && (dy / dt) * 1000 > 3000) {
            clearActiveVideo();
            if (videoDebounceRef.current) {
                clearTimeout(videoDebounceRef.current);
                videoDebounceRef.current = null;
            }
        }

        // Forward scroll event to parent in the expected format
        if (onScroll) {
            onScroll(event);
        }
    }, [onScroll, clearActiveVideo]);

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
            <FlatList
                ref={listRef}
                data={posts}
                renderItem={renderItem}
                onScroll={handleScroll}
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: headerHeight + 10,
                }}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                        progressViewOffset={insets.top}
                    />
                }
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={5}
                removeClippedSubviews={false} // Avoid Android display list crash
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
