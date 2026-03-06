import { precacheVideos } from "@/services/videoCache";
import { useScrollStore } from "@/stores/scroll";
import { VideoFeedType, VideoItem } from "@/types/video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../context/ThemeContext";
import { useVideoFeed } from "../services/videos";
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

    const [feedType, setFeedType] = useState<VideoFeedType>('random');
    const scrollTrigger = useScrollStore(state => state.triggers['shots']);
    const listRef = useRef<any>(null);

    // ─── Data ───────────────────────────────────────────────────
    const { data, isLoading, isError, refetch } = useVideoFeed(feedType, 30);

    const videos: VideoItem[] = useMemo(() => {
        return data?.data || [];
    }, [data]);

    // ─── Player State ───────────────────────────────────────────
    const [activeIndex, setActiveIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false); // Shots plays with sound by default (unlike feed)
    const [isPaused, setIsPaused] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    // Track which video is ready (buffered enough to play)
    const [readyIndices, setReadyIndices] = useState<Set<number>>(new Set());

    // ─── Pre-buffer Strategy ────────────────────────────────────
    // The indices we want to have buffered at any time: [current-1, current, current+1]
    // Use a ref with string comparison to avoid new array references on every render
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

    // Current video
    const activeVideo = videos[activeIndex] || null;

    // ─── Video Cache ────────────────────────────────────────────
    // Pre-cache upcoming videos in background (fire-and-forget)
    // URI resolution is handled per-item inside ShotItem to avoid
    // parent re-renders cascading to all visible items.
    useEffect(() => {
        if (videos.length === 0) return;

        // Cache current + next 2 videos
        const urlsToCache = videos
            .slice(activeIndex, activeIndex + 3)
            .map(v => v.media_url);
        precacheVideos(urlsToCache);
    }, [activeIndex, videos]);

    // ─── Layout ─────────────────────────────────────────────────
    const itemHeight = SCREEN_HEIGHT;

    // ─── Handlers ───────────────────────────────────────────────
    const switchFeedType = useCallback((type: VideoFeedType) => {
        if (feedType !== type) {
            setFeedType(type);
            setActiveIndex(0);
            setReadyIndices(new Set());
            setIsPaused(false);
            setIsBuffering(true);
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
            setIsPaused(false); // Auto-play when swiping to new video
            setIsBuffering(true); // Assume buffering until onLoad
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
        // onLoad doesn't always guarantee playback on Android, onReadyForDisplay/onProgress is safer
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
        // Shots loop automatically, do not pause on end
    }, []);

    // ─── Fetch More When Nearing End ────────────────────────────
    const hasTriggeredRefetch = useRef(false);

    useEffect(() => {
        if (activeIndex >= videos.length - 5 && !hasTriggeredRefetch.current && videos.length > 0) {
            hasTriggeredRefetch.current = true;
            // Could implement load-more here if needed
        }
    }, [activeIndex, videos.length]);

    // ─── Scroll to Top Handle ───────────────────────────────────
    useEffect(() => {
        if (scrollTrigger && scrollTrigger > 0) {
            // Scroll to top
            listRef.current?.scrollToOffset({ offset: 0, animated: true });

            // Refetch data
            refetch();
        }
    }, [scrollTrigger, refetch]);

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
