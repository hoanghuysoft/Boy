import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { useGlobalVideoPlayer, useGlobalVideoPlayerOwner } from "@/contexts/VideoPlayerContext";
import { avatar, IComment, mockComments, useVideoDetailQuery } from "@/services/shows";
import { resolveVideoSource } from "@/services/shows/videoSource";
import { useLikedVideosStore } from "@/stores/likedVideos";
import { useShowWatchlistStore } from "@/stores/showWatchlist";
import { useWatchHistoryStore } from "@/stores/watchHistory";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import * as WebBrowser from "expo-web-browser";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Sub-components
import { ActionBar } from "@/components/moviehub/ActionBar";
import { CommentsPreviewSection } from "@/components/moviehub/CommentsPreviewSection";
import { CommentsSheet } from "@/components/moviehub/CommentsSheet";
import { DescriptionSheet } from "@/components/moviehub/DescriptionSheet";
import { EpisodeSelectorSection } from "@/components/moviehub/EpisodeSelectorSection";
import { RelatedVideoCard } from "@/components/moviehub/RelatedVideoCard";
import { VideoInfoSection } from "@/components/moviehub/VideoInfoSection";
import { VideoPlayerSection } from "@/components/moviehub/VideoPlayerSection";

const VideoDetailScreen = () => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { width, height: screenHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{ video_url: string }>();
  const videoUrl = Array.isArray(params.video_url) ? params.video_url[0] : params.video_url;

  const videoHeight = width ? Math.round(width * (9 / 16)) : 200;
  const remainingHeight = screenHeight - videoHeight - (insets?.top ?? 0);
  const detentFraction = useMemo(() => {
    if (!screenHeight || isNaN(screenHeight) || screenHeight <= 0) return 0.55;
    const fraction = (remainingHeight - 2) / screenHeight;
    if (isNaN(fraction) || !isFinite(fraction)) return 0.55;
    return Math.max(0.1, Math.min(0.9, fraction));
  }, [screenHeight, remainingHeight]);

  const { data: videoDetail, isLoading, isError } = useVideoDetailQuery(videoUrl);
  const detail = videoDetail?.video_detail;
  const relatedVideos = Array.isArray(videoDetail?.related_videos) ? videoDetail.related_videos : [];

  const matchedAvatar = useMemo(() => {
    if (!detail?.title) return avatar[0];
    return avatar.find(
      (a) => a.name !== "Default" && detail.title.toLowerCase().includes(a.name.toLowerCase())
    ) || avatar.find((a) => a.name === "Default") || avatar[0];
  }, [detail]);

  // Local comments state initialized from mockComments
  const [comments, setComments] = useState<IComment[]>(mockComments);

  // Build episode list
  const episodes = useMemo(() => {
    if (!detail) return [];
    const apiEpisodes = (detail.episodes ?? []).map((e) => ({ episode: e.episode, url: e.url }));
    if (apiEpisodes.length > 0) return apiEpisodes.sort((a, b) => a.episode - b.episode);
    if (detail.stream_url) return [{ episode: 1, url: detail.stream_url }];
    return [];
  }, [detail]);

  // Manually overridden episode; empty means "use first"
  const [selectedEpisodeUrl, setSelectedEpisodeUrl] = useState<string>("");
  const activeEpisodeUrl = selectedEpisodeUrl || episodes[0]?.url || "";
  const [resolvedUri, setResolvedUri] = useState<string>("");
  const [resolvedHeaders, setResolvedHeaders] = useState<Record<string, string> | undefined>();
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Liked videos store
  const likedStore = useLikedVideosStore();
  const isLiked = likedStore.isLiked(videoUrl ?? "");

  // Toggle fullscreen state reactively to physical screen orientation
  useEffect(() => {
    const sub = ScreenOrientation.addOrientationChangeListener((event) => {
      const orientation = event.orientationInfo.orientation;
      const isLandscape =
        orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;
      setIsFullscreen(isLandscape);
    });
    return () => sub.remove();
  }, []);

  // Watchlist (Bookmark) store hooks
  const watchlist = useShowWatchlistStore((s) => s.watchlist);
  const addToWatchlist = useShowWatchlistStore((s) => s.add);
  const removeFromWatchlist = useShowWatchlistStore((s) => s.remove);

  // Watch history — records interest signals for the recommendation engine
  const recordWatch = useWatchHistoryStore((s) => s.recordWatch);
  const styles = style(colors);

  const isBookmarked = useMemo(
    () => watchlist.some((item) => item.video_url === (videoUrl ?? "")),
    [watchlist, videoUrl]
  );

  const handleToggleLike = () => {
    if (!detail) return;
    if (isLiked) {
      likedStore.removeLike(videoUrl ?? "");
    } else {
      likedStore.addLike({
        video_url: videoUrl ?? "",
        title: detail.title ?? "",
        thumb_url: detail.poster_url ?? "",
        duration: detail.duration ?? "",
        liked_at: Date.now(),
      });
    }
  };

  const handleShare = async () => {
    if (!detail) return;
    try {
      await Share.share({
        message: `Watch "${detail.title}" here: ${videoUrl}`,
        url: videoUrl,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleBookmark = () => {
    if (!detail) return;
    if (isBookmarked) {
      removeFromWatchlist(videoUrl ?? "");
    } else {
      addToWatchlist({
        video_url: videoUrl ?? "",
        title: detail.title,
        thumb_url: detail.poster_url || "",
        views: detail.views || "",
        duration: detail.duration || "",
        added_at: Date.now(),
      });
    }
  };

  const handleReport = () => {
    Alert.alert("Report", "Thank you for reporting. We will take a look at it.");
  };

  const handleAddComment = (text: string) => {
    const newComment: IComment = {
      id: Date.now(),
      userName: "Me",
      avatarUrl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Me",
      commentText: text,
      likes: "0",
      timeAgo: "Just now",
    };
    setComments((prev) => [newComment, ...prev]);
  };

  // Sheet Refs
  const descSheetRef = useRef<TrueSheet>(null);
  const commentSheetRef = useRef<TrueSheet>(null);

  // Resolve the video source whenever the active URL changes
  useEffect(() => {
    if (!activeEpisodeUrl) return;
    let cancelled = false;
    resolveVideoSource(activeEpisodeUrl).then((source) => {
      if (cancelled) return;
      if (typeof source === "string") {
        setResolvedUri(source);
        setResolvedHeaders(undefined);
      } else {
        setResolvedUri(source.uri);
        setResolvedHeaders(source.headers);
      }
    });
    return () => { cancelled = true; };
  }, [activeEpisodeUrl]);

  const [isFocused, setIsFocused] = useState(true);

  // Singleton player — reused across navigations; just replace source.
  const player = useGlobalVideoPlayer();
  const activeOwnerIdRef = useGlobalVideoPlayerOwner();
  const screenInstanceId = useId();

  // Apply source whenever URI changes (episode switch, initial load).
  useEffect(() => {
    if (!resolvedUri) return;
    activeOwnerIdRef.current = screenInstanceId;
    try {
      player.replaceAsync({ uri: resolvedUri, headers: resolvedHeaders })
        .then(() => {
          try {
            player.play();
          } catch (e) {
            console.warn("Failed to play on URI change (released):", e);
          }
        })
        .catch(() => { });
    } catch (e) {
      console.warn("Failed to replace source on URI change (released):", e);
    }
    // Record watch event for the recommendation engine
    if (detail) {
      recordWatch({
        video_url: videoUrl ?? '',
        title: detail.title ?? '',
        thumb_url: detail.poster_url ?? '',
        duration: detail.duration ?? '',
        watched_at: Date.now(),
      });
    }
  }, [resolvedUri, resolvedHeaders, player, screenInstanceId, activeOwnerIdRef, detail, recordWatch, videoUrl]);

  // Re-apply source when screen regains focus (e.g. after back-gesture from a
  // child video_detail — the singleton player was cleared by the child's cleanup
  // but this screen's useEffect deps didn't change so it never re-fired).
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      if (!resolvedUri) return;
      activeOwnerIdRef.current = screenInstanceId;
      try {
        player.replaceAsync({ uri: resolvedUri, headers: resolvedHeaders })
          .then(() => {
            try {
              player.play();
            } catch (e) {
              console.warn("Failed to play on focus (released):", e);
            }
          })
          .catch(() => { });
      } catch (e) {
        console.warn("Failed to replace source on focus (released):", e);
      }

      return () => {
        setIsFocused(false);
        // Pause only if we are still the active owner when blurred
        if (activeOwnerIdRef.current === screenInstanceId) {
          try {
            player.pause();
          } catch (e) {
            console.warn("Failed to pause on blur (released):", e);
          }
        }
      };
    }, [resolvedUri, resolvedHeaders, player, screenInstanceId, activeOwnerIdRef])
  );

  // Pause + clear source on unmount so singleton doesn't keep playing in bg.
  useEffect(() => {
    return () => {
      if (activeOwnerIdRef.current === screenInstanceId) {
        try {
          player.pause();
        } catch (e) {
          console.warn("Failed to pause on unmount (released):", e);
        }
        try {
          player.replaceAsync(null).catch(() => { });
        } catch (e) {
          console.warn("Failed to clear source on unmount (released):", e);
        }
        activeOwnerIdRef.current = null;
      }
    };
  }, [player, screenInstanceId, activeOwnerIdRef]);

  const handleTagPress = useCallback((tag: string) => {
    descSheetRef.current?.dismiss();
    const slug = tag.startsWith("#") ? tag.slice(1) : tag;
    router.push({
      pathname: "/show_list",
      params: { mode: "tag", slug },
    });
  }, []);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Safe Area Spacer at Top */}
      {!isFullscreen && <View style={{ height: insets.top }}></View>}

      {/* Video player Section */}
      <VideoPlayerSection
        player={player}
        resolvedUri={resolvedUri}
        posterUrl={detail?.poster_url}
        width={width}
        videoHeight={videoHeight}
        isFocused={isFocused}
      />

      {/* Scrollable content below the player */}
      <ScrollView
        style={{ display: isFullscreen ? "none" : "flex" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {isLoading ? (
          <SkeletonGroup isLoading variant="shimmer">
            <View style={{ padding: 16, gap: 20 }}>
              {/* Title & Metadata Section */}
              <View style={{ gap: 8 }}>
                <SkeletonGroup.Item style={{ height: 24, width: "85%", borderRadius: 6 }} />
                <SkeletonGroup.Item style={{ height: 16, width: "45%", borderRadius: 4 }} />
              </View>

              {/* Action Bar pill buttons */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 }}>
                <SkeletonGroup.Item style={{ height: 36, width: 36, borderRadius: 18 }} />
                <SkeletonGroup.Item style={{ height: 36, width: 80, borderRadius: 18 }} />
                <SkeletonGroup.Item style={{ height: 36, width: 80, borderRadius: 18 }} />
                <SkeletonGroup.Item style={{ height: 36, width: 80, borderRadius: 18 }} />
                <SkeletonGroup.Item style={{ height: 36, width: 80, borderRadius: 18 }} />
                <SkeletonGroup.Item style={{ height: 36, width: 80, borderRadius: 18 }} />
              </View>

              {/* Comments Preview Section */}
              <View style={{ gap: 8, marginTop: 8 }}>
                <SkeletonGroup.Item style={{ height: 80, width: "100%", borderRadius: 16 }} />
              </View>

              {/* Episode selector */}
              <View style={{ gap: 12, marginTop: 8 }}>
                <SkeletonGroup.Item style={{ height: 20, width: 100, borderRadius: 4 }} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                  <SkeletonGroup.Item style={{ height: 40, flex: 1, minWidth: "28%", maxWidth: "31%", borderRadius: 12 }} />
                  <SkeletonGroup.Item style={{ height: 40, flex: 1, minWidth: "28%", maxWidth: "31%", borderRadius: 12 }} />
                  <SkeletonGroup.Item style={{ height: 40, flex: 1, minWidth: "28%", maxWidth: "31%", borderRadius: 12 }} />
                </View>
              </View>

              {/* Related Videos List */}
              <View style={{ gap: 16, marginTop: 12 }}>
                <SkeletonGroup.Item style={{ height: 20, width: 140, borderRadius: 4 }} />
                {[1, 2].map((key) => (
                  <View key={key} style={{ gap: 8 }}>
                    <SkeletonGroup.Item style={{ width: "100%", height: videoHeight, borderRadius: 16 }} />
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <SkeletonGroup.Item style={{ height: 32, width: 32, borderRadius: 16 }} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <SkeletonGroup.Item style={{ height: 16, width: "80%", borderRadius: 4 }} />
                        <SkeletonGroup.Item style={{ height: 12, width: "40%", borderRadius: 4 }} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </SkeletonGroup>
        ) : isError ? (
          <View style={{ margin: 16, padding: 12, borderRadius: 12, backgroundColor: "rgba(255,0,0,0.12)" }}>
            <Text style={{ color: colors.onSurface, fontWeight: "700", textAlign: "center" }}>
              Failed to load video details.
            </Text>
          </View>
        ) : (
          <>
            {/* Title & Metadata Section */}
            <VideoInfoSection
              detail={detail}
              colors={colors}
              onPress={() => descSheetRef.current?.present()}
            />

            {/* Action Bar pill buttons */}
            <ActionBar
              colors={colors}
              matchedAvatar={matchedAvatar}
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              onToggleLike={handleToggleLike}
              onShare={handleShare}
              onToggleBookmark={handleToggleBookmark}
              onReport={handleReport}
              onDownloadPress={
                detail?.download_url
                  ? () => WebBrowser.openBrowserAsync(detail.download_url)
                  : undefined
              }
              onGalleryPress={
                detail?.extra_images && detail.extra_images.length > 0
                  ? () =>
                    router.push({
                      pathname: "/moviehub/gallery",
                      params: { video_url: videoUrl },
                    })
                  : undefined
              }
            />

            {/* YouTube style comments preview box */}
            <CommentsPreviewSection
              comments={comments}
              colors={colors}
              onPress={() => commentSheetRef.current?.present()}
            />

            {/* Episode selector */}
            <EpisodeSelectorSection
              episodes={episodes}
              activeEpisodeUrl={activeEpisodeUrl}
              onSelectEpisode={setSelectedEpisodeUrl}
              colors={colors}
            />

            {/* Spacer */}
            <View style={{ marginBottom: 16 }} />
          </>
        )}

        {/* Related videos flat list */}
        {relatedVideos.map((item, index) => (
          <View key={`${item.video_url}-${index}`} style={{ marginBottom: 20 }}>
            <RelatedVideoCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: "/moviehub/video_detail",
                  params: { video_url: item.video_url },
                })
              }
              colors={colors}
              videoHeight={videoHeight}
              width={width}
            />
          </View>
        ))}
      </ScrollView>

      {/* Description Bottom Sheet */}
      <DescriptionSheet
        ref={descSheetRef}
        colors={colors}
        insets={insets}
        detentFraction={detentFraction}
        detail={detail}
        onTagPress={handleTagPress}
      />

      {/* Comments Bottom Sheet */}
      <CommentsSheet
        ref={commentSheetRef}
        colors={colors}
        insets={insets}
        detentFraction={detentFraction}
        comments={comments}
        onAddComment={handleAddComment}
      />
    </View>
  );
};

export default VideoDetailScreen;

const style = (colors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
  },
});
