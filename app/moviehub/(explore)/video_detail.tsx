import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { avatar, useVideoDetailQuery, mockComments, IComment } from "@/services/shows";
import { resolveVideoSource } from "@/services/shows/videoSource";
import { useShowWatchlistStore } from "@/stores/showWatchlist";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer } from "expo-video";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { RelatedVideoCard } from "@/components/moviehub/RelatedVideoCard";
import { DescriptionSheet } from "@/components/moviehub/DescriptionSheet";
import { CommentsSheet } from "@/components/moviehub/CommentsSheet";
import { VideoPlayerSection } from "@/components/moviehub/VideoPlayerSection";
import { VideoInfoSection } from "@/components/moviehub/VideoInfoSection";
import { ActionBar } from "@/components/moviehub/ActionBar";
import { CommentsPreviewSection } from "@/components/moviehub/CommentsPreviewSection";
import { EpisodeSelectorSection } from "@/components/moviehub/EpisodeSelectorSection";

const VideoDetailScreen = () => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { width, height: screenHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{ video_url: string }>();
  const videoUrl = Array.isArray(params.video_url) ? params.video_url[0] : params.video_url;

  const videoHeight = Math.round(width * (9 / 16));
  const remainingHeight = screenHeight - videoHeight - insets.top;
  const detentFraction = useMemo(() => {
    return Math.max(0.1, Math.min(0.9, remainingHeight / screenHeight));
  }, [screenHeight, videoHeight, insets.top]);

  const { data: videoDetail, isLoading, isError } = useVideoDetailQuery(videoUrl);
  const detail = videoDetail?.video_detail;
  const relatedVideos = Array.isArray(videoDetail?.related_videos) ? videoDetail.related_videos : [];

  const matchedAvatar = useMemo(() => {
    if (!detail?.title) return avatar[0];
    return avatar.find(
      (a) => a.name !== "Default" && detail.title.toLowerCase().includes(a.name.toLowerCase())
    ) || avatar.find((a) => a.name === "Default") || avatar[0];
  }, [detail]);

  const channelName = useMemo(() => {
    if (!matchedAvatar || matchedAvatar.name === "Default") {
      return "MovieHub Official";
    }
    return matchedAvatar.name;
  }, [matchedAvatar]);

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
  const [isLiked, setIsLiked] = useState(false);

  // Watchlist (Bookmark) store hooks
  const watchlist = useShowWatchlistStore((s) => s.watchlist);
  const addToWatchlist = useShowWatchlistStore((s) => s.add);
  const removeFromWatchlist = useShowWatchlistStore((s) => s.remove);
  const styles = style(colors);

  const isBookmarked = useMemo(
    () => watchlist.some((item) => item.video_url === (videoUrl ?? "")),
    [watchlist, videoUrl]
  );

  const handleToggleLike = () => {
    setIsLiked((prev) => !prev);
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

  const player = useVideoPlayer(
    resolvedUri
      ? { uri: resolvedUri, headers: resolvedHeaders }
      : null,
    (p) => {
      p.play();
    },
  );

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
      <View style={{ height: insets.top }}></View>

      {/* Video player Section */}
      <VideoPlayerSection
        player={player}
        resolvedUri={resolvedUri}
        posterUrl={detail?.poster_url}
        width={width}
        videoHeight={videoHeight}
      />

      {/* Scrollable content below the player */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {isLoading ? (
          <SkeletonGroup isLoading variant="shimmer">
            <View style={{ padding: 16, gap: 12 }}>
              <SkeletonGroup.Item style={{ height: 22, width: "75%", borderRadius: 4 }} />
              <SkeletonGroup.Item style={{ height: 14, width: "50%", borderRadius: 4 }} />
              <SkeletonGroup.Item style={{ height: 40, width: "100%", borderRadius: 8, marginTop: 8 }} />
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
          <View key={item.video_url || String(index)} style={{ marginBottom: 20 }}>
            <RelatedVideoCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: "/moviehub/(explore)/video_detail",
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
