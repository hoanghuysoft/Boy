import { choosenMediaPath } from "@/utils/imageurl";
import type { PostOptionsSheetHandle } from "@/components/post/PostOptionsSheet";
import type { LikersSheetHandle } from "@/types/sheetHandles";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../context/ThemeContext";
import { useInfiniteAddresses } from "../services/address";
import { useProfileFeed } from "../services/feed";
import { useInfiniteMedia } from "../services/media";
import { useInfiniteMusic } from "../services/music";
import { useInfiniteSocialLinks } from "../services/sociallink";
import { useProfile } from "../services/userprofile";
import { useInfiniteWorkplaces } from "../services/workplace";
import { useAudioStore } from "../stores/audio";
import { useScrollStore } from "../stores/scroll";
import { createCommonStyles } from "../styles/common";
import { Media } from "../types/media";
import { Post } from "../types/post";
import type { TabType } from "./ProfileHeaderViewModel";

export const useProfileViewModel = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    const isMe = params.isMe === 'true';
    const blurTargetRef = useRef<View | null>(null);

    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const inset = useSafeAreaInsets();

    const listRef = useRef<any>(null);
    const trigger = useScrollStore((state) => state.triggers['profile']);

    // ─── Per-tab scroll offset memory ──────────────────────────────
    const scrollPositions = useRef<Record<TabType, number>>({
        Images: 0,
        Videos: 0,
        Feed: 0,
    });
    const currentScrollY = useRef(0);

    // ─── State ─────────────────────────────────────────────────────
    const [selectedTab, setSelectedTab] = useState<TabType>("Images");
    const [activeTab, setActiveTab] = useState<TabType>("Images");
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [showHeaderAvatar, setShowHeaderAvatar] = useState(false);
    const [galleryVisible, setGalleryVisible] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [snackbarVisible, setSnackbarVisible] = useState(false);

    // ─── Data Fetching ─────────────────────────────────────────────
    const {
        data: profile,
        isLoading: isProfileLoading,
        isRefetching: isProfileRefetching,
        refetch: refetchProfile,
        isError: isProfileError
    } = useProfile(id as string, isMe);

    const profileId = profile?.id ?? "";

    const {
        data: musicPaging,
        refetch: refetchMusic,
        fetchNextPage: fetchNextMusic,
        hasNextPage: hasNextMusic,
        isFetchingNextPage: isFetchingNextMusic
    } = useInfiniteMusic(profileId);
    const music = useMemo(() => musicPaging?.pages.flatMap(p => p.data) || [], [musicPaging]);

    const {
        data: socialPaging,
        refetch: refetchSocial,
        fetchNextPage: fetchNextSocial,
        hasNextPage: hasNextSocial,
        isFetchingNextPage: isFetchingNextSocial
    } = useInfiniteSocialLinks(profileId);
    const socialLinks = useMemo(() => socialPaging?.pages.flatMap(p => p.data) || [], [socialPaging]);

    const {
        data: addressPaging,
        refetch: refetchAddresses,
        fetchNextPage: fetchNextAddresses,
        hasNextPage: hasNextAddresses,
        isFetchingNextPage: isFetchingNextAddresses
    } = useInfiniteAddresses(profileId);
    const addresses = useMemo(() => addressPaging?.pages.flatMap(p => p.data) || [], [addressPaging]);

    const {
        data: workplacePaging,
        refetch: refetchWorkplaces,
        fetchNextPage: fetchNextWorkplaces,
        hasNextPage: hasNextWorkplaces,
        isFetchingNextPage: isFetchingNextWorkplaces
    } = useInfiniteWorkplaces(profileId);
    const workplaces = useMemo(() => workplacePaging?.pages.flatMap(p => p.data) || [], [workplacePaging]);

    const {
        data: photosPaging,
        refetch: refetchPhotos,
        fetchNextPage: fetchNextPhotos,
        hasNextPage: hasNextPhotos,
        isFetchingNextPage: isFetchingNextPhotos,
        isLoading: isPhotosLoading
    } = useInfiniteMedia(profileId, 'photo');
    const photos = useMemo(() => photosPaging?.pages.flatMap(p => p.data) || [], [photosPaging]);

    const {
        data: videosPaging,
        refetch: refetchVideos,
        fetchNextPage: fetchNextVideos,
        hasNextPage: hasNextVideos,
        isFetchingNextPage: isFetchingNextVideos,
        isLoading: isVideosLoading
    } = useInfiniteMedia(profileId, 'video');
    const videos = useMemo(() => videosPaging?.pages.flatMap(p => p.data) || [], [videosPaging]);

    const {
        data: feedPaging,
        refetch: refetchFeed,
        fetchNextPage: fetchNextFeed,
        hasNextPage: hasNextFeed,
        isFetchingNextPage: isFetchingNextFeed,
        isLoading: isFeedLoading
    } = useProfileFeed(profileId);
    const feedPosts = useMemo(() => feedPaging?.pages.flatMap(p => p.data) || [], [feedPaging]);

    // ─── Derived Data ──────────────────────────────────────────────
    const hasMusic = music.length > 0;
    const currentTrack = hasMusic ? music[0] : null;
    const imageCount = photosPaging?.pages[0]?.pagination?.total || 0;
    const videoCount = videosPaging?.pages[0]?.pagination?.total || 0;
    const postCount = feedPaging?.pages[0]?.pagination?.total || 0;

    // ─── Audio state ───────────────────────────────────────────────
    const currentlyPlayingId = useAudioStore(s => s.currentlyPlayingId);
    const isMusicPlaying = !!profileId && currentlyPlayingId === `profile-music-${profileId}`;

    // ─── Post Options Sheet ────────────────────────────────────────
    const optionsSheetRef = useRef<PostOptionsSheetHandle>(null);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const { data: myProfile } = useProfile('me', true);

    // ─── Likers Sheet ──────────────────────────────────────────────
    const likersSheetRef = useRef<LikersSheetHandle>(null);
    const [selectedLikePostId, setSelectedLikePostId] = useState<string | null>(null);

    // ─── Comments Sheet ────────────────────────────────────────────
    const commentsSheetRef = useRef<TrueSheet>(null);
    const [selectedCommentPostId, setSelectedCommentPostId] = useState<string | null>(null);

    // ─── Bottom Sheet Refs ─────────────────────────────────────────
    const musicSheetRef = useRef<TrueSheet>(null);
    const socialSheetRef = useRef<TrueSheet>(null);
    const addressSheetRef = useRef<TrueSheet>(null);
    const workplaceSheetRef = useRef<TrueSheet>(null);
    const familySheetRef = useRef<TrueSheet>(null);
    const briefSheetRef = useRef<TrueSheet>(null);

    // ─── Scroll Animation ──────────────────────────────────────────
    const scrollY = useRef(new Animated.Value(0)).current;
    const scrollTopButtonOpacity = useRef(new Animated.Value(0)).current;

    // ─── Effects ───────────────────────────────────────────────────
    useEffect(() => {
        if (isProfileError) {
            setSnackbarVisible(true);
        }
    }, [isProfileError]);

    useEffect(() => {
        if (trigger > 0 && listRef.current) {
            scrollPositions.current[activeTab] = 0;
            currentScrollY.current = 0;
            scrollY.setValue(0);
            listRef.current.scrollToOffset({ offset: 0, animated: true });
        }
    }, [trigger]);

    // Restore saved scroll position whenever the active tab changes
    useEffect(() => {
        const savedY = scrollPositions.current[activeTab];
        const timer = setTimeout(() => {
            scrollY.setValue(savedY);
            if (savedY > 0) {
                listRef.current?.scrollToOffset({ offset: savedY, animated: false });
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [activeTab, scrollY]);

    // ─── Scroll Handler ────────────────────────────────────────────
    const onScroll = useMemo(() =>
        Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {
                useNativeDriver: true,
                listener: (event: any) => {
                    const offsetY = event.nativeEvent.contentOffset.y;
                    currentScrollY.current = offsetY;
                    const shouldShow = offsetY > 300;
                    if (shouldShow !== showScrollTop) {
                        setShowScrollTop(shouldShow);
                        Animated.timing(scrollTopButtonOpacity, {
                            toValue: shouldShow ? 1 : 0,
                            duration: 200,
                            useNativeDriver: true,
                        }).start();
                    }
                    const shouldShowAvatar = offsetY > 160;
                    if (shouldShowAvatar !== showHeaderAvatar) {
                        setShowHeaderAvatar(shouldShowAvatar);
                    }
                }
            }
        ),
        [scrollY, showScrollTop, showHeaderAvatar]);

    // ─── Tab Change ────────────────────────────────────────────────
    const handleTabChangeRef = useRef<((tab: TabType) => void) | undefined>(undefined);
    const handleTabChange = useCallback((tab: TabType) => {
        if (tab === selectedTab) return;
        scrollPositions.current[selectedTab] = currentScrollY.current;
        
        // Update UI immediately (makes the button press feel instant)
        setSelectedTab(tab);

        // Defer heavy list rendering to unblock the UI thread's click animation
        requestAnimationFrame(() => {
            startTransition(() => {
                setActiveTab(tab);
            });
        });
    }, [selectedTab]);
    handleTabChangeRef.current = handleTabChange;

    const stableTabChange = useCallback((tab: TabType) => {
        handleTabChangeRef.current?.(tab);
    }, []);

    // ─── Handlers ──────────────────────────────────────────────────
    const handleVideoPress = useCallback((video: Media) => {
        const videoUrl = choosenMediaPath(video);
        router.push({
            pathname: '/video_player',
            params: {
                videoUrl,
                name: profile?.name || 'Video',
                caption: video.caption || '',
                portrait: 'true',
            }
        });
    }, [router, profile?.name]);

    const handleMusicPress = useCallback(() => {
        if (!currentTrack?.preview_url) return;
        const trackId = `profile-music-${profileId}`;
        const { currentlyPlayingId, playTrack, stopPlayback } = useAudioStore.getState();
        if (currentlyPlayingId === trackId) {
            stopPlayback();
        } else {
            playTrack(trackId, currentTrack.preview_url, {
                title: currentTrack.title,
                artist: currentTrack.artist,
                coverUrl: currentTrack.cover_url,
            });
        }
    }, [currentTrack, profileId]);

    const handleImagePress = useCallback((visible: boolean, index: number) => {
        setGalleryIndex(index);
        setGalleryVisible(visible);
    }, []);

    const onRefresh = useCallback(() => {
        refetchProfile();
        if (profile?.id) {
            refetchWorkplaces();
            refetchMusic();
            refetchSocial();
            refetchAddresses();
            refetchPhotos();
            refetchVideos();
            refetchFeed();
        }
    }, [refetchProfile, refetchWorkplaces, refetchMusic, refetchSocial, refetchAddresses, refetchPhotos, refetchVideos, refetchFeed, profile?.id]);

    const handleEndReached = useCallback(() => {
        if (activeTab === "Images" && hasNextPhotos && !isFetchingNextPhotos) {
            fetchNextPhotos();
        } else if (activeTab === "Videos" && hasNextVideos && !isFetchingNextVideos) {
            fetchNextVideos();
        } else if (activeTab === "Feed" && hasNextFeed && !isFetchingNextFeed) {
            fetchNextFeed();
        }
    }, [activeTab, hasNextPhotos, isFetchingNextPhotos, fetchNextPhotos, hasNextVideos, isFetchingNextVideos, fetchNextVideos, hasNextFeed, isFetchingNextFeed, fetchNextFeed]);

    const handleMusicEndReached = useCallback(() => {
        if (hasNextMusic && !isFetchingNextMusic) fetchNextMusic();
    }, [hasNextMusic, isFetchingNextMusic, fetchNextMusic]);

    const handleSocialEndReached = useCallback(() => {
        if (hasNextSocial && !isFetchingNextSocial) fetchNextSocial();
    }, [hasNextSocial, isFetchingNextSocial, fetchNextSocial]);

    const handleAddressesEndReached = useCallback(() => {
        if (hasNextAddresses && !isFetchingNextAddresses) fetchNextAddresses();
    }, [hasNextAddresses, isFetchingNextAddresses, fetchNextAddresses]);

    const handleWorkplacesEndReached = useCallback(() => {
        if (hasNextWorkplaces && !isFetchingNextWorkplaces) fetchNextWorkplaces();
    }, [hasNextWorkplaces, isFetchingNextWorkplaces, fetchNextWorkplaces]);

    const handlePostDeleted = useCallback(() => {
        setSelectedPost(null);
    }, []);

    const handlePostOptionsPress = useCallback((post: Post) => {
        setSelectedPost(post);
        optionsSheetRef.current?.present();
    }, []);

    const handleLikeCountPress = useCallback((post: Post) => {
        setSelectedLikePostId(post.id);
        likersSheetRef.current?.present();
    }, []);

    const handleCommentPress = useCallback((post: Post) => {
        setSelectedCommentPostId(post.id);
        commentsSheetRef.current?.present();
    }, []);

    const scrollToTop = useCallback(() => {
        scrollPositions.current[activeTab] = 0;
        currentScrollY.current = 0;
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, [activeTab]);

    const dismissSnackbar = useCallback(() => {
        setSnackbarVisible(false);
    }, []);

    const closeGallery = useCallback(() => {
        setGalleryVisible(false);
    }, []);

    // ─── Return ViewModel ──────────────────────────────────────────
    return {
        // Theme & Layout
        colors,
        typography,
        theme,
        common,
        inset,

        // Navigation
        router,
        isMe,

        // Refs
        listRef,
        musicSheetRef,
        socialSheetRef,
        addressSheetRef,
        workplaceSheetRef,
        familySheetRef,
        briefSheetRef,
        optionsSheetRef,
        likersSheetRef,
        commentsSheetRef,
        blurTargetRef,

        // Profile
        profile,
        isProfileLoading,
        isProfileRefetching,
        myProfile,

        // Tab
        selectedTab,
        activeTab,

        // Data
        music,
        socialLinks,
        addresses,
        workplaces,
        photos,
        videos,
        feedPosts,
        hasMusic,
        currentTrack,
        imageCount,
        videoCount,
        postCount,

        // Media loading states
        isPhotosLoading,
        isVideosLoading,
        isFeedLoading,
        isFetchingNextPhotos,
        isFetchingNextVideos,

        // Gallery
        galleryVisible,
        galleryIndex,

        // Snackbar
        snackbarVisible,

        // Post Options
        selectedPost,
        selectedLikePostId,
        selectedCommentPostId,

        // Scroll
        scrollY,
        showScrollTop,
        showHeaderAvatar,
        scrollTopButtonOpacity,
        onScroll,

        // Handlers
        stableTabChange,
        handleVideoPress,
        handleImagePress,
        handleMusicPress,
        onRefresh,
        handleEndReached,
        handleMusicEndReached,
        handleSocialEndReached,
        handleAddressesEndReached,
        handleWorkplacesEndReached,
        handlePostDeleted,
        handlePostOptionsPress,
        handleLikeCountPress,
        handleCommentPress,
        scrollToTop,
        dismissSnackbar,
        closeGallery,

        // Music playback
        isMusicPlaying,
    };
};
