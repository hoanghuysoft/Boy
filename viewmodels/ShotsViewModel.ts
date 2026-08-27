import { getCachedUri, precacheVideos } from "@/services/videoCache";
import { useScrollStore } from "@/stores/scroll";
import { VideoFeedType, VideoItem } from "@/types/video";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { createVideoPlayer, VideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../context/ThemeContext";
import { useToggleLike } from "../services/like";
import { useInfiniteVideoFeed } from "../services/videos";
import { createCommonStyles } from "../styles/common";

const VIEWABILITY_CONFIG = {
    itemVisiblePercentThreshold: 50,
};

function createThreeVideoPlayers(
    sources?: [string, string, string],
): [VideoPlayer, VideoPlayer, VideoPlayer] {
    const eventInterval = Platform.select({
        ios: 0.2,
        android: 0.25,
        default: 0.2,
    });
    const p1 = createVideoPlayer(sources?.[0] ?? '');
    p1.loop = true;
    p1.muted = false;
    p1.timeUpdateEventInterval = eventInterval;

    const p2 = createVideoPlayer(sources?.[1] ?? '');
    p2.loop = true;
    p2.muted = false;
    p2.timeUpdateEventInterval = eventInterval;

    const p3 = createVideoPlayer(sources?.[2] ?? '');
    p3.loop = true;
    p3.muted = false;
    p3.timeUpdateEventInterval = eventInterval;

    return [p1, p2, p3];
}

/**
 * ViewModel for the Shots (TikTok-style) screen.
 *
 * Implements the fixed 3-Player Pool Pattern (Bluesky architecture):
 * - Exactly 3 persistent VideoPlayer instances in memory (O(1) memory)
 * - Each row indexes via modulo: player = players[index % 3]
 * - On scroll to index:
 *   - Active (index % 3): play()
 *   - Previous ((index + 2) % 3): replaceAsync(prevVideo) & pause()
 *   - Next ((index + 1) % 3): replaceAsync(nextVideo) & pause()
 */
export const useShotsViewModel = (
    initialFeedType: VideoFeedType = 'random',
    isFocused: boolean = true,
) => {
    const { colors, typography } = useThemeContext();
    const { height: screenHeight } = useWindowDimensions();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();

    const [feedType, setFeedType] = useState<VideoFeedType>(initialFeedType);
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

    // ─── 3-Player Pool State ─────────────────────────────────────
    const [players, setPlayers] = useState<[VideoPlayer, VideoPlayer, VideoPlayer] | null>(null);
    const [currentSources, setCurrentSources] = useState<[string | null, string | null, string | null]>([null, null, null]);
    const currentSourcesRef = useRef(currentSources);
    currentSourcesRef.current = currentSources;

    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    const [, setReadyIndices] = useState<Set<number>>(new Set());
    const readyIndicesRef = useRef<Set<number>>(new Set());

    // ─── Video Cache Preload ────────────────────────────────────
    useEffect(() => {
        if (videos.length === 0 || !isFocused) return;
        const urlsToCache = videos
            .slice(activeIndex, activeIndex + 2)
            .map(v => v.media_url);
        precacheVideos(urlsToCache);
    }, [activeIndex, videos, isFocused]);

    // ─── Update 3-Player Pool State ─────────────────────────────
    const updateVideoState = useCallback(async (index: number) => {
        if (!videos.length) return;

        const prevVideo = videos[index - 1]?.media_url ?? null;
        const currVideo = videos[index]?.media_url ?? null;
        const nextVideo = videos[index + 1]?.media_url ?? null;

        // Fetch cached local URIs if available
        const [prevUri, currUri, nextUri] = await Promise.all([
            prevVideo ? getCachedUri(prevVideo) : Promise.resolve(null),
            currVideo ? getCachedUri(currVideo) : Promise.resolve(null),
            nextVideo ? getCachedUri(nextVideo) : Promise.resolve(null),
        ]);

        const prevPlayerSource = currentSourcesRef.current[(index + 2) % 3];
        const currPlayerSource = currentSourcesRef.current[index % 3];
        const nextPlayerSource = currentSourcesRef.current[(index + 1) % 3];

        const shouldPlay = isFocused && !isPaused && AppState.currentState === 'active';

        if (!players) {
            const args: [string, string, string] = ['', '', ''];
            if (prevUri) args[(index + 2) % 3] = prevUri;
            if (currUri) args[index % 3] = currUri;
            if (nextUri) args[(index + 1) % 3] = nextUri;

            const newPlayers = createThreeVideoPlayers(args);
            setPlayers(newPlayers);

            if (currUri) {
                const currPlayer = newPlayers[index % 3];
                if (shouldPlay) {
                    try {
                        currPlayer.play();
                    } catch { }
                }
            }
        } else {
            const [player1, player2, player3] = players;
            const prevPlayer = [player1, player2, player3][(index + 2) % 3];
            const currPlayer = [player1, player2, player3][index % 3];
            const nextPlayer = [player1, player2, player3][(index + 1) % 3];

            if (prevUri && prevUri !== prevPlayerSource) {
                try {
                    prevPlayer.replaceAsync(prevUri).catch(() => { });
                } catch { }
            }
            try {
                prevPlayer.muted = true;
                prevPlayer.pause();
            } catch { }

            if (currUri) {
                if (currUri !== currPlayerSource) {
                    try {
                        currPlayer.replaceAsync(currUri).then(() => {
                            currPlayer.currentTime = 0;
                        }).catch(() => { });
                    } catch { }
                }
                try {
                    currPlayer.muted = !isFocused;
                } catch { }

                if (shouldPlay) {
                    try {
                        currPlayer.play();
                    } catch { }
                } else {
                    try {
                        currPlayer.pause();
                    } catch { }
                }
            }

            if (nextUri && nextUri !== nextPlayerSource) {
                try {
                    nextPlayer.replaceAsync(nextUri).catch(() => { });
                } catch { }
            }
            try {
                nextPlayer.muted = true;
                nextPlayer.pause();
            } catch { }
        }

        const updatedSources: [string | null, string | null, string | null] = [...currentSourcesRef.current];
        if (prevUri) updatedSources[(index + 2) % 3] = prevUri;
        if (currUri) updatedSources[index % 3] = currUri;
        if (nextUri) updatedSources[(index + 1) % 3] = nextUri;
        setCurrentSources(updatedSources);
    }, [videos, players, isPaused, isFocused]);

    // Initial update when videos first become available
    useEffect(() => {
        if (videos.length > 0 && !players) {
            updateVideoState(activeIndex);
        }
    }, [videos.length, players, activeIndex, updateVideoState]);

    // Focus & AppState listener to pause/resume active player
    useEffect(() => {
        if (!players) return;
        const currPlayer = players[activeIndex % 3];
        if (!currPlayer) return;

        if (isFocused && !isPaused && AppState.currentState === 'active') {
            try {
                currPlayer.muted = false;
                currPlayer.play();
            } catch { }
        } else {
            try {
                currPlayer.muted = true;
                currPlayer.pause();
            } catch { }
        }
    }, [isFocused, isPaused, activeIndex, players]);

    // AppState listener
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (state) => {
            if (!players) return;
            const currPlayer = players[activeIndex % 3];
            if (!currPlayer) return;

            if (isFocused && state === 'active' && !isPaused) {
                try {
                    currPlayer.muted = false;
                    currPlayer.play();
                } catch { }
            } else {
                try {
                    currPlayer.muted = true;
                    currPlayer.pause();
                } catch { }
            }
        });
        return () => subscription.remove();
    }, [players, activeIndex, isPaused, isFocused]);

    // Release 3 players on unmount
    useEffect(() => {
        return () => {
            if (players) {
                players.forEach(p => {
                    try {
                        p.release();
                    } catch { }
                });
            }
        };
    }, [players]);

    // ─── Like State (optimistic, per video) ─────────────────────
    const [prevVideos, setPrevVideos] = useState<VideoItem[]>(videos);
    const [likeMap, setLikeMap] = useState<Map<string, { isLiked: boolean; likeCount: number }>>(() => {
        const map = new Map<string, { isLiked: boolean; likeCount: number }>();
        for (const v of videos) {
            map.set(v.id, { isLiked: v.is_liked ?? false, likeCount: v.like_count });
        }
        return map;
    });

    if (videos !== prevVideos) {
        setPrevVideos(videos);
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
    }

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
    const itemHeight = screenHeight;

    // ─── Handlers ───────────────────────────────────────────────
    const switchFeedType = useCallback((type: VideoFeedType) => {
        if (feedType !== type) {
            setFeedType(type);
            setActiveIndex(0);
            readyIndicesRef.current = new Set();
            setReadyIndices(new Set());
            setLikeMap(new Map());
            setIsPaused(false);
            setIsBuffering(true);
            listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
        }
    }, [feedType]);

    const togglePause = useCallback(() => {
        setIsPaused(prev => {
            const next = !prev;
            if (players) {
                const currPlayer = players[activeIndex % 3];
                if (currPlayer) {
                    if (next) {
                        currPlayer.pause();
                    } else {
                        currPlayer.play();
                    }
                }
            }
            return next;
        });
    }, [players, activeIndex]);

    const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
        if (viewableItems?.length > 0) {
            const newIndex = viewableItems[0].index ?? 0;
            setActiveIndex(newIndex);
            setIsPaused(false);
            setIsBuffering(!readyIndicesRef.current.has(newIndex));
            updateVideoState(newIndex);
        }
    }, [updateVideoState]);

    const viewabilityConfig = VIEWABILITY_CONFIG;

    const markReady = useCallback((index: number) => {
        readyIndicesRef.current.add(index);
        setReadyIndices(prev => {
            const next = new Set(prev);
            next.add(index);
            return next;
        });
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

    const [prevScrollTrigger, setPrevScrollTrigger] = useState(scrollTrigger);

    if (scrollTrigger !== prevScrollTrigger) {
        setPrevScrollTrigger(scrollTrigger);
        if (scrollTrigger && scrollTrigger > 0) {
            setActiveIndex(0);
            setReadyIndices(new Set());
            setLikeMap(new Map());
            setIsPaused(false);
            setIsBuffering(true);
        }
    }

    // ─── Scroll to Top Handle ───────────────────────────────────
    useEffect(() => {
        if (scrollTrigger && scrollTrigger > 0) {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
            queryClient.removeQueries({ queryKey: ["videoFeed", feedType], exact: false });
            readyIndicesRef.current = new Set();
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

        // Player Pool State
        players,
        activeIndex,
        isPaused,
        isBuffering,

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
        togglePause,
        onViewableItemsChanged,
        viewabilityConfig,
        markReady,
    };
};

