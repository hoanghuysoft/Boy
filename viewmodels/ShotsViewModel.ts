import { precacheVideos } from "@/services/videoCache";
import { useScrollStore } from "@/stores/scroll";
import { VideoFeedType, VideoItem } from "@/types/video";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../context/ThemeContext";
import { useToggleLike } from "../services/like";
import { useInfiniteVideoFeed } from "../services/videos";
import { createCommonStyles } from "../styles/common";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * ViewModel for the Shots (TikTok-style) screen.
 *
 * Implements the ±1 pre-buffer strategy:
 * - Previous video: keep reference for instant swipe-back
 * - Current video: PLAYING
 * - Next video: pre-buffered
 *
 * Single decoder pattern — one video source is active at a time,
 * controlled via paused prop (not mount/unmount).
 */
export const useShotsViewModel = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();

    const [feedType, setFeedType] = useState<VideoFeedType>('random');
    const scrollTrigger = useScrollStore(state => state.triggers['shots']);
    const listRef = useRef<any>(null);

    // ─── Data ───────────────────────────────────────────────────
    const {
        data,
        isLoading,
        isError,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isRefetching,
    } = useInfiniteVideoFeed(feedType, 30);

    const videos: VideoItem[] = useMemo(() => {
        return data?.pages?.flatMap(p => p.data) || [];
    }, [data]);

    // ─── Player State ───────────────────────────────────────────
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    const [readyIndices, setReadyIndices] = useState<Set<number>>(new Set());

    // ─── Pre-buffer Strategy ────────────────────────────────────
    const preloadIndicesRef = useRef<number[]>([0]);
    const newIndices: number[] = [];
    if (activeIndex > 0) newIndices.push(activeIndex - 1);
    newIndices.push(activeIndex);
    if (activeIndex < videos.length - 1) newIndices.push(activeIndex + 1);
    const indicesKey = newIndices.join(',');
    const prevIndicesKey = preloadIndicesRef.current.join(',');
    if (indicesKey !== prevIndicesKey) {
        preloadIndicesRef.current = newIndices;
    }
    const preloadIndices = preloadIndicesRef.current;

    const activeVideo = videos[activeIndex] || null;

    // ─── Video Cache ────────────────────────────────────────────
    useEffect(() => {
        if (videos.length === 0) return;
        const urlsToCache = videos
            .slice(activeIndex, activeIndex + 3)
            .map(v => v.media_url);
        precacheVideos(urlsToCache);
    }, [activeIndex, videos]);

    // ─── Like State (optimistic, per video) ─────────────────────
    // likeMap: videoId → { isLiked, likeCount }
    // Initialized from server data on first render; toggled locally.
    const [likeMap, setLikeMap] = useState<Map<string, { isLiked: boolean; likeCount: number }>>(new Map());

    // Seed the map with any newly fetched videos that aren't already tracked
    useEffect(() => {
        if (videos.length === 0) return;
        setLikeMap(prev => {
            let changed = false;
            const next = new Map(prev);
            for (const v of videos) {
                if (!next.has(v.id)) {
                    next.set(v.id, { isLiked: v.is_liked ?? false, likeCount: v.like_count });
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [videos]);

    const getLikeState = useCallback((video: VideoItem) => {
        return likeMap.get(video.id) ?? { isLiked: false, likeCount: video.like_count };
    }, [likeMap]);

    const toggleLikeMutation = useToggleLike();

    const handleLikePress = useCallback((video: VideoItem) => {
        if (!video.post_id) return;
        const current = getLikeState(video);
        const newIsLiked = !current.isLiked;
        const newCount = Math.max(0, current.likeCount + (newIsLiked ? 1 : -1));

        // Optimistic local update
        setLikeMap(prev => new Map(prev).set(video.id, { isLiked: newIsLiked, likeCount: newCount }));

        toggleLikeMutation.mutate(
            { postId: video.post_id, isLiked: current.isLiked },
            {
                onError: () => {
                    // Rollback local state
                    setLikeMap(prev => new Map(prev).set(video.id, current));
                },
            }
        );
    }, [getLikeState, toggleLikeMutation]);

    // ─── Comments Sheet ──────────────────────────────────────────
    const commentsSheetRef = useRef<TrueSheet>(null);
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);

    const handleCommentPress = useCallback((video: VideoItem) => {
        if (!video.post_id) return;
        setActiveCommentPostId(video.post_id);
        setIsCommentsOpen(true);
        commentsSheetRef.current?.present();
    }, []);

    const handleCommentsDismiss = useCallback(() => {
        setIsCommentsOpen(false);
        setActiveCommentPostId(null);
    }, []);

    // ─── Layout ─────────────────────────────────────────────────
    const itemHeight = SCREEN_HEIGHT;

    // ─── Handlers ───────────────────────────────────────────────
    const switchFeedType = useCallback((type: VideoFeedType) => {
        if (feedType !== type) {
            setFeedType(type);
            setActiveIndex(0);
            setReadyIndices(new Set());
            setLikeMap(new Map());
            setIsPaused(false);
            setIsBuffering(true);
            listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
        }
    }, [feedType]);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const togglePause = useCallback(() => {
        setIsPaused(prev => !prev);
    }, []);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            const newIndex = viewableItems[0].index ?? 0;
            setActiveIndex(newIndex);
            setIsPaused(false);
            setIsBuffering(true);
        }
    }).current;

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 80,
        minimumViewTime: 100,
    }).current;

    const markReady = useCallback((index: number) => {
        setReadyIndices(prev => {
            const next = new Set(prev);
            next.add(index);
            return next;
        });
    }, []);

    const onVideoLoad = useCallback(() => {
        markReady(activeIndex);
    }, [activeIndex, markReady]);

    const onVideoProgress = useCallback(() => {
        if (isBuffering) {
            setIsBuffering(false);
            markReady(activeIndex);
        }
    }, [isBuffering, activeIndex, markReady]);

    const onVideoBuffer = useCallback(({ isBuffering: buffering }: { isBuffering: boolean }) => {
        setIsBuffering(buffering);
    }, []);

    const onVideoEnd = useCallback(() => {
        // Shots loop automatically — no-op
    }, []);

    // ─── Fetch More When Nearing End ────────────────────────────
    const isLoadMoreQueuedRef = useRef(false);

    const loadMore = useCallback(() => {
        if (!hasNextPage || isFetchingNextPage) return;
        fetchNextPage();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    useEffect(() => {
        if (videos.length === 0) return;
        if (!hasNextPage || isFetchingNextPage) return;

        if (activeIndex >= videos.length - 5 && !isLoadMoreQueuedRef.current) {
            isLoadMoreQueuedRef.current = true;
            fetchNextPage().finally(() => {
                isLoadMoreQueuedRef.current = false;
            });
        }
    }, [activeIndex, videos.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // ─── Scroll to Top Handle ───────────────────────────────────
    useEffect(() => {
        if (scrollTrigger && scrollTrigger > 0) {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
            queryClient.removeQueries({ queryKey: ["videoFeed", feedType], exact: false });
            setActiveIndex(0);
            setReadyIndices(new Set());
            setLikeMap(new Map());
            setIsPaused(false);
            setIsBuffering(true);
            refetch();
        }
    }, [scrollTrigger, refetch, queryClient, feedType]);

    // ─── Return ViewModel ───────────────────────────────────────
    return {
        // Theme
        colors,
        common,
        insets,

        // Data
        videos,
        isLoading,
        isError,
        refetch,
        feedType,
        hasNextPage,
        isFetchingNextPage,
        isRefetching,
        loadMore,

        // Player State
        activeIndex,
        activeVideo,
        isMuted,
        isPaused,
        isBuffering,
        preloadIndices,

        // Layout
        itemHeight,
        listRef,

        // Like
        getLikeState,
        handleLikePress,

        // Comments
        commentsSheetRef,
        activeCommentPostId,
        isCommentsOpen,
        handleCommentPress,
        handleCommentsDismiss,

        // Handlers
        switchFeedType,
        toggleMute,
        togglePause,
        onViewableItemsChanged,
        viewabilityConfig,
        onVideoLoad,
        onVideoProgress,
        onVideoBuffer,
        onVideoEnd,
    };
};
