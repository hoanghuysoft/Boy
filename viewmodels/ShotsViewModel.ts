import {
    buildCachedVideoSource,
    registerCachePlayerPool,
} from "@/services/videoCache";
import { useScrollStore } from "@/stores/scroll";
import { VideoFeedType, VideoItem } from "@/types/video";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { BufferOptions, createVideoPlayer, VideoPlayer } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../context/ThemeContext";
import { useToggleBookmark } from "../services/bookmark";
import { useToggleLike } from "../services/like";
import { useToggleRepost } from "../services/post";
import { useInfiniteVideoFeed } from "../services/videos";
import { createCommonStyles } from "../styles/common";

const VIEWABILITY_CONFIG = {
    itemVisiblePercentThreshold: 50,
};

// Configured per expo-video BufferOptions docs so active & preloaded players
// buffer enough data into the persistent native disk cache without premature 4MB cutoff.
const BUFFER_OPTIONS: BufferOptions = {
    preferredForwardBufferDuration: Platform.OS === "ios" ? 0 : 15,
    minBufferForPlayback: 1,
    maxBufferBytes: 0,
    prioritizeTimeOverSizeThreshold: true,
};

function createThreeVideoPlayers(
    sources?: [string | null, string | null, string | null],
    activeSlot: number = 0,
): [VideoPlayer, VideoPlayer, VideoPlayer] {
    const eventInterval = Platform.select({
        ios: 0.2,
        android: 0.25,
        default: 0.2,
    });

    const createSlotPlayer = (uri: string | null | undefined, slot: number) => {
        const player = createVideoPlayer(buildCachedVideoSource(uri));
        player.loop = true;
        player.muted = slot !== activeSlot;
        player.timeUpdateEventInterval = eventInterval;
        player.bufferOptions = BUFFER_OPTIONS;
        return player;
    };

    return [
        createSlotPlayer(sources?.[0], 0),
        createSlotPlayer(sources?.[1], 1),
        createSlotPlayer(sources?.[2], 2),
    ];
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
    const playersRef = useRef<[VideoPlayer, VideoPlayer, VideoPlayer] | null>(null);
    const [, setCurrentSources] = useState<[string | null, string | null, string | null]>([null, null, null]);
    const currentSourcesRef = useRef<[string | null, string | null, string | null]>([null, null, null]);

    const [activeIndex, setActiveIndex] = useState(0);
    const activeIndexRef = useRef(0);
    activeIndexRef.current = activeIndex;

    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(false);
    isPausedRef.current = isPaused;

    const isFocusedRef = useRef(isFocused);
    isFocusedRef.current = isFocused;

    const videosRef = useRef<VideoItem[]>(videos);
    videosRef.current = videos;

    const [isBuffering, setIsBuffering] = useState(false);

    const [, setReadyIndices] = useState<Set<number>>(new Set());
    const readyIndicesRef = useRef<Set<number>>(new Set());

    const releasePlayerPool = useCallback(() => {
        const currentPool = playersRef.current;
        if (!currentPool) return;
        playersRef.current = null;
        currentSourcesRef.current = [null, null, null];
        setCurrentSources([null, null, null]);
        setPlayers(null);
        currentPool.forEach(p => {
            try {
                p.release();
            } catch { }
        });
    }, []);

    // ─── Update 3-Player Pool State ─────────────────────────────
    const updateVideoState = useCallback((index: number) => {
        const currentVideos = videosRef.current;
        if (!currentVideos.length) return;

        // Avoid allocating a 3-player pool for an unfocused tab until it becomes focused
        if (!playersRef.current && !isFocusedRef.current) {
            return;
        }

        const prevUri = currentVideos[index - 1]?.media_url ?? null;
        const currUri = currentVideos[index]?.media_url ?? null;
        const nextUri = currentVideos[index + 1]?.media_url ?? null;

        const prevSlot = (index + 2) % 3;
        const currSlot = index % 3;
        const nextSlot = (index + 1) % 3;

        const prevPlayerSource = currentSourcesRef.current[prevSlot];
        const currPlayerSource = currentSourcesRef.current[currSlot];
        const nextPlayerSource = currentSourcesRef.current[nextSlot];

        const shouldPlay = isFocusedRef.current && !isPausedRef.current && AppState.currentState === 'active';

        // Synchronously record target sources before async operations to prevent duplicate replaceAsync calls
        const updatedSources: [string | null, string | null, string | null] = [...currentSourcesRef.current];
        if (prevUri) updatedSources[prevSlot] = prevUri;
        if (currUri) updatedSources[currSlot] = currUri;
        if (nextUri) updatedSources[nextSlot] = nextUri;
        currentSourcesRef.current = updatedSources;
        setCurrentSources(updatedSources);

        if (!playersRef.current) {
            const args: [string | null, string | null, string | null] = [null, null, null];
            if (prevUri) args[prevSlot] = prevUri;
            if (currUri) args[currSlot] = currUri;
            if (nextUri) args[nextSlot] = nextUri;

            const newPlayers = createThreeVideoPlayers(args, currSlot);
            playersRef.current = newPlayers;
            setPlayers(newPlayers);

            if (currUri) {
                const currPlayer = newPlayers[currSlot];
                if (shouldPlay) {
                    try {
                        currPlayer.muted = false;
                        currPlayer.play();
                    } catch { }
                }
            }
        } else {
            const pool = playersRef.current;
            const prevPlayer = pool[prevSlot];
            const currPlayer = pool[currSlot];
            const nextPlayer = pool[nextSlot];

            try {
                prevPlayer.muted = true;
                prevPlayer.pause();
            } catch { }
            if (prevUri && prevUri !== prevPlayerSource) {
                try {
                    prevPlayer.replaceAsync(buildCachedVideoSource(prevUri)).catch(() => { });
                } catch { }
            }

            if (currUri) {
                try {
                    currPlayer.muted = !isFocusedRef.current;
                } catch { }

                if (currUri !== currPlayerSource) {
                    try {
                        currPlayer.replaceAsync(buildCachedVideoSource(currUri)).then(() => {
                            if (activeIndexRef.current !== index) return;
                            try {
                                currPlayer.currentTime = 0;
                                if (isFocusedRef.current && !isPausedRef.current && AppState.currentState === 'active') {
                                    currPlayer.muted = false;
                                    currPlayer.play();
                                }
                            } catch { }
                        }).catch(() => { });
                    } catch { }
                } else {
                    try {
                        currPlayer.currentTime = 0;
                        if (shouldPlay) {
                            currPlayer.play();
                        } else {
                            currPlayer.pause();
                        }
                    } catch { }
                }
            }

            try {
                nextPlayer.muted = true;
                nextPlayer.pause();
            } catch { }
            if (nextUri && nextUri !== nextPlayerSource) {
                try {
                    nextPlayer.replaceAsync(buildCachedVideoSource(nextUri)).catch(() => { });
                } catch { }
            }
        }
    }, []);

    // Update players when videos first load, when new pages append adjacent to activeIndex, or when tab becomes focused
    useEffect(() => {
        if (videos.length > 0 && isFocused) {
            const index = activeIndexRef.current;
            const currUri = videos[index]?.media_url ?? null;
            const nextUri = videos[index + 1]?.media_url ?? null;
            const currSlot = index % 3;
            const nextSlot = (index + 1) % 3;

            const needsInit = !playersRef.current;
            const needsCurrUpdate = currUri !== null && currentSourcesRef.current[currSlot] !== currUri;
            const needsNextUpdate = nextUri !== null && currentSourcesRef.current[nextSlot] !== nextUri;

            if (needsInit || needsCurrUpdate || needsNextUpdate) {
                updateVideoState(index);
            }
        }
    }, [videos, isFocused, updateVideoState]);

    // Focus & pause state listener to pause/resume active player
    useEffect(() => {
        const pool = playersRef.current;
        if (!pool) return;
        const currPlayer = pool[activeIndex % 3];
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
            const pool = playersRef.current;
            if (!pool) return;
            const currPlayer = pool[activeIndexRef.current % 3];
            if (!currPlayer) return;

            if (isFocusedRef.current && state === 'active' && !isPausedRef.current) {
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
    }, []);

    // Register with videoCache so Settings can clear or resize cache even after visiting Shots
    useEffect(() => {
        const unregister = registerCachePlayerPool({
            releasePlayersForCacheOp: () => {
                releasePlayerPool();
            },
            restorePlayersAfterCacheOp: () => {
                if (isFocusedRef.current && videosRef.current.length > 0) {
                    updateVideoState(activeIndexRef.current);
                }
            },
        });

        return () => {
            unregister();
            releasePlayerPool();
        };
    }, [releasePlayerPool, updateVideoState]);

    // ─── Like, Bookmark, Repost State (optimistic, per video) ────────────
    const [prevVideos, setPrevVideos] = useState<VideoItem[]>(videos);
    
    // Like
    const [likeMap, setLikeMap] = useState<Map<string, { isLiked: boolean; likeCount: number }>>(() => {
        const map = new Map<string, { isLiked: boolean; likeCount: number }>();
        for (const v of videos) {
            map.set(v.id, { isLiked: v.is_liked ?? false, likeCount: v.like_count ?? 0 });
        }
        return map;
    });

    // Bookmark
    const [bookmarkMap, setBookmarkMap] = useState<Map<string, { isBookmarked: boolean; bookmarkCount: number }>>(() => {
        const map = new Map<string, { isBookmarked: boolean; bookmarkCount: number }>();
        for (const v of videos) {
            map.set(v.id, { isBookmarked: v.is_bookmarked ?? false, bookmarkCount: v.bookmark_count ?? 0 });
        }
        return map;
    });

    // Repost
    const [repostMap, setRepostMap] = useState<Map<string, { isReposted: boolean; repostCount: number }>>(() => {
        const map = new Map<string, { isReposted: boolean; repostCount: number }>();
        for (const v of videos) {
            map.set(v.id, { isReposted: v.is_reposted ?? false, repostCount: v.repost_count ?? 0 });
        }
        return map;
    });

    if (videos !== prevVideos) {
        setPrevVideos(videos);
        
        // Update Like
        setLikeMap(prev => {
            let changed = false;
            const next = new Map(prev);
            for (const v of videos) {
                if (!next.has(v.id)) {
                    next.set(v.id, { isLiked: v.is_liked ?? false, likeCount: v.like_count ?? 0 });
                    changed = true;
                }
            }
            return changed ? next : prev;
        });

        // Update Bookmark
        setBookmarkMap(prev => {
            let changed = false;
            const next = new Map(prev);
            for (const v of videos) {
                if (!next.has(v.id)) {
                    next.set(v.id, { isBookmarked: v.is_bookmarked ?? false, bookmarkCount: v.bookmark_count ?? 0 });
                    changed = true;
                }
            }
            return changed ? next : prev;
        });

        // Update Repost
        setRepostMap(prev => {
            let changed = false;
            const next = new Map(prev);
            for (const v of videos) {
                if (!next.has(v.id)) {
                    next.set(v.id, { isReposted: v.is_reposted ?? false, repostCount: v.repost_count ?? 0 });
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }

    // Like Handlers
    const getLikeState = useCallback((video: VideoItem) => {
        return likeMap.get(video.id) ?? { isLiked: false, likeCount: video.like_count ?? 0 };
    }, [likeMap]);

    const toggleLikeMutation = useToggleLike();

    const handleLikePress = useCallback((video: VideoItem) => {
        if (!video.post_id) return;
        const current = getLikeState(video);
        const newIsLiked = !current.isLiked;
        const newCount = Math.max(0, current.likeCount + (newIsLiked ? 1 : -1));

        setLikeMap(prev => new Map(prev).set(video.id, { isLiked: newIsLiked, likeCount: newCount }));

        toggleLikeMutation.mutate(
            { postId: video.post_id, isLiked: current.isLiked },
            {
                onError: () => setLikeMap(prev => new Map(prev).set(video.id, current)),
            }
        );
    }, [getLikeState, toggleLikeMutation]);

    // Bookmark Handlers
    const getBookmarkState = useCallback((video: VideoItem) => {
        return bookmarkMap.get(video.id) ?? { isBookmarked: false, bookmarkCount: video.bookmark_count ?? 0 };
    }, [bookmarkMap]);

    const toggleBookmarkMutation = useToggleBookmark();

    const handleBookmarkPress = useCallback((video: VideoItem) => {
        if (!video.post_id) return;
        const current = getBookmarkState(video);
        const newIsBookmarked = !current.isBookmarked;
        const newCount = Math.max(0, current.bookmarkCount + (newIsBookmarked ? 1 : -1));

        setBookmarkMap(prev => new Map(prev).set(video.id, { isBookmarked: newIsBookmarked, bookmarkCount: newCount }));

        toggleBookmarkMutation.mutate(
            { postId: video.post_id, isBookmarked: current.isBookmarked },
            {
                onError: () => setBookmarkMap(prev => new Map(prev).set(video.id, current)),
            }
        );
    }, [getBookmarkState, toggleBookmarkMutation]);

    // Repost Handlers
    const getRepostState = useCallback((video: VideoItem) => {
        return repostMap.get(video.id) ?? { isReposted: false, repostCount: video.repost_count ?? 0 };
    }, [repostMap]);

    const toggleRepostMutation = useToggleRepost();

    const handleRepostPress = useCallback((video: VideoItem) => {
        if (!video.post_id) return;
        const current = getRepostState(video);
        const newIsReposted = !current.isReposted;
        const newCount = Math.max(0, current.repostCount + (newIsReposted ? 1 : -1));

        setRepostMap(prev => new Map(prev).set(video.id, { isReposted: newIsReposted, repostCount: newCount }));

        toggleRepostMutation.mutate(
            { postId: video.post_id, isReposted: current.isReposted },
            {
                onError: () => setRepostMap(prev => new Map(prev).set(video.id, current)),
            }
        );
    }, [getRepostState, toggleRepostMutation]);

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
            setBookmarkMap(new Map());
            setRepostMap(new Map());
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
            activeIndexRef.current = newIndex;
            isPausedRef.current = false;
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
            setBookmarkMap(new Map());
            setRepostMap(new Map());
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
        likeMap,
        getLikeState,
        handleLikePress,

        // Bookmark
        bookmarkMap,
        getBookmarkState,
        handleBookmarkPress,

        // Repost
        repostMap,
        getRepostState,
        handleRepostPress,

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

