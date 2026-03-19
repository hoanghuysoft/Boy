import { FlexText } from "@/components/FlexText";
import { queryClient } from "@/services/client";
import { useFeed } from "@/services/feed";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { Post } from "@/types/post";
import { choosenMediaPath } from "@/utils/imageurl";
import { uniqBy } from "lodash";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DataProvider, LayoutProvider, RecyclerListView } from "recyclerlistview";
import { PostItem } from "../../../components/PostItem";
import { ShimmerEffect } from "../../../components/shimmer/Shimmer";
import { useThemeContext } from "../../../context/ThemeContext";
import { useAudioStore } from "../../../stores/audio";
import { useScrollStore } from "../../../stores/scroll";
import { useSettingsStore } from "../../../stores/settings";
import { createCommonStyles } from "../../../styles/common";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// View types for RecyclerListView
const ViewTypes = {
    POST: 0,
    LOADING: 1,
};

// Estimated post height (will be adjusted with forceNonDeterministicRendering)
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

    const listRef = useRef<RecyclerListView<any, any> | null>(null);
    const trigger = useScrollStore((state) => state.triggers['index']);

    useEffect(() => {
        if (trigger > 0 && listRef.current) {
            listRef.current.scrollToTop(true);
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
                // Find the first video media item in this post
                const videoMedia = post.media.find((m: any) => m.type === 'video');
                if (videoMedia) {
                    return { postId: post.id, mediaId: videoMedia.id, videoUrl: choosenMediaPath(videoMedia) };
                }
            }
        }
        return null;
    }, [posts]);

    // Autoplay setting
    const autoplayVideos = useSettingsStore(s => s.autoplayVideos);

    // Handle visible indices change from RecyclerListView
    const handleVisibleIndicesChanged = useCallback((all: number[]) => {
        // Skip if autoplay is disabled
        if (!autoplayVideos) {
            clearActiveVideo();
            return;
        }

        // Clear any pending debounce
        if (videoDebounceRef.current) {
            clearTimeout(videoDebounceRef.current);
        }

        // Debounce by 300ms to ignore fast scrolling
        videoDebounceRef.current = setTimeout(() => {
            const result = findTopmostVideoPost(all);
            if (result) {
                setActiveVideo(result.postId, result.mediaId, result.videoUrl);
                // Stop music playback when video starts to avoid audio conflict
                stopAudioPlayback();
            } else {
                clearActiveVideo();
            }
        }, 500);
    }, [autoplayVideos, findTopmostVideoPost, setActiveVideo, clearActiveVideo, stopAudioPlayback]);

    const handleRefresh = async () => {
        queryClient.removeQueries({ queryKey: ['feed', feedType] });
        refetch();
    };

    // Create DataProvider with rowHasChanged comparison
    const [dataProvider, setDataProvider] = useState<DataProvider>(
        new DataProvider((r1, r2) => {
            // Compare by id AND mutable fields so recycled cells get fresh data
            return r1.id !== r2.id
                || r1.is_liked !== r2.is_liked
                || r1.like_count !== r2.like_count
                || r1.comment_count !== r2.comment_count
                || r1.is_bookmarked !== r2.is_bookmarked;
        })
    );

    // Update dataProvider when posts change
    useEffect(() => {
        if (posts.length > 0) {
            setDataProvider(prevProvider => prevProvider.cloneWithRows(posts));
        }
    }, [posts]);

    // Create LayoutProvider
    const layoutProvider = useMemo(() => {
        return new LayoutProvider(
            (index) => ViewTypes.POST,
            (type, dim) => {
                dim.width = SCREEN_WIDTH;
                dim.height = ESTIMATED_POST_HEIGHT;
            }
        );
    }, []);

    // Row renderer for RecyclerListView
    const rowRenderer = useCallback((type: string | number, data: Post, index: number) => {
        return (
            <View style={{ marginBottom: 30 }}>
                <PostItem post={data} onOptionsPress={onOptionsPress} onLikeCountPress={onLikeCountPress} onCommentPress={onCommentPress} />
            </View>
        );
    }, [onOptionsPress, onLikeCountPress, onCommentPress]);

    const renderPostSkeleton = () => {
        return (
            <View style={{ marginTop: 20 }}>
                <View style={[common.row, { gap: 10, marginBottom: 12, paddingHorizontal: 16 }]}>
                    <ShimmerEffect
                        isLoading={true}
                        style={{ width: 30, height: 30, borderRadius: 100, backgroundColor: colors.divider }}
                    />
                    <ShimmerEffect
                        isLoading={true}
                        style={{ width: 120, height: 16, borderRadius: 8, backgroundColor: colors.divider }}
                    />
                </View>
                <View style={{ gap: 8, marginBottom: 12, paddingHorizontal: 16 }}>
                    <ShimmerEffect
                        isLoading={true}
                        style={{ width: '100%', height: 14, borderRadius: 6, backgroundColor: colors.divider }}
                    />
                    <ShimmerEffect
                        isLoading={true}
                        style={{ width: '80%', height: 14, borderRadius: 6, backgroundColor: colors.divider }}
                    />
                </View>
                <ShimmerEffect
                    isLoading={true}
                    style={{ width: "100%", height: 200, backgroundColor: colors.divider }}
                />
            </View>
        );
    };

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
    const handleScroll = useCallback((rawEvent: any, offsetX: number, offsetY: number) => {
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
            onScroll({
                nativeEvent: {
                    contentOffset: { x: offsetX, y: offsetY }
                }
            });
        }
    }, [onScroll, clearActiveVideo]);

    // Handle end reached for infinite scroll
    const handleEndReached = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Custom external scroll view with RefreshControl
    const renderScrollComponent = useCallback((props: any) => {
        return (
            <ScrollView
                {...props}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={handleRefresh}
                        tintColor={colors.text}
                        colors={[colors.text]}
                        progressBackgroundColor={colors.card}
                    />
                }
            />
        );
    }, [isRefetching, handleRefresh, colors]);

    // Render footer for loading state
    const renderFooter = useCallback(() => {
        if (isFetchingNextPage) {
            return renderPostSkeleton();
        }
        return <View style={{ height: bottomPadding }} />;
    }, [isFetchingNextPage, bottomPadding]);

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
            <RecyclerListView
                ref={listRef}
                layoutProvider={layoutProvider}
                dataProvider={dataProvider}
                rowRenderer={rowRenderer}
                onScroll={handleScroll}
                onVisibleIndicesChanged={handleVisibleIndicesChanged}
                scrollViewProps={{
                    showsVerticalScrollIndicator: false,
                    contentContainerStyle: {
                        paddingTop: headerHeight + 10,
                    },
                    refreshControl: (
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={handleRefresh}
                            tintColor={colors.text}
                            colors={[colors.text]}
                            progressBackgroundColor={colors.card}
                            progressViewOffset={insets.top}
                        />
                    ),
                }}
                // Enable non-deterministic rendering for variable height items
                forceNonDeterministicRendering={true}
                // Render items ahead for smoother scrolling
                renderAheadOffset={300}
                // Handle infinite scroll
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.5}
                // Render footer
                renderFooter={renderFooter}
                // Enable stable ids for better recycling
                // Note: extendedState can be used for external state dependencies
                canChangeSize={true}
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
