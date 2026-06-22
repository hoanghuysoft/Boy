import { FlexText } from "@/components/FlexText";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { useThemeContext } from "@/context/ThemeContext";
import { useVideoDetailQuery } from "@/services/shows";
import { resolveVideoSource } from "@/services/shows/videoSource";
import type { VideoCard } from "@/types/shows";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VideoDetailScreen = () => {
  const { colors } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ video_url: string }>();
  const videoUrl = Array.isArray(params.video_url) ? params.video_url[0] : params.video_url;

  const videoHeight = Math.round(width * (9 / 16));

  const { data: videoDetail, isLoading, isError } = useVideoDetailQuery(videoUrl);
  const detail = videoDetail?.video_detail;
  const relatedVideos = videoDetail?.related_videos ?? [];

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
  // Derive the active URL: manual pick wins, otherwise first episode
  const activeEpisodeUrl = selectedEpisodeUrl || episodes[0]?.url || "";
  const [resolvedUri, setResolvedUri] = useState<string>("");
  const [resolvedHeaders, setResolvedHeaders] = useState<Record<string, string> | undefined>();
  const [isExpanded, setIsExpanded] = useState(false);

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

  const renderRelated = useCallback(
    ({ item }: { item: VideoCard }) => (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/moviehub/(explore)/video_detail",
            params: { video_url: item.video_url },
          })
        }
        style={({ pressed }) => [styles.relatedRow, { opacity: pressed ? 0.85 : 1 }]}
      >
        <View style={styles.relatedThumbWrap}>
          <ExpoImage
            source={{ uri: item.thumb_url }}
            style={styles.relatedThumb}
            contentFit="cover"
            placeholder={{ blurhash: resolveBlurhash((item as any).blurhash, item.video_url || item.thumb_url) }}
          />
          {!!item.duration && (
            <View style={styles.durationBadge}>
              <FlexText style={styles.durationText}>{item.duration}</FlexText>
            </View>
          )}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <FlexText numberOfLines={2} style={[styles.relatedTitle, { color: colors.onSurface }]}>
            {item.title}
          </FlexText>
          <FlexText numberOfLines={1} style={[styles.relatedMeta, { color: colors.onSurfaceVariant }]}>
            {[item.views, item.duration].filter(Boolean).join(" • ")}
          </FlexText>
        </View>
      </Pressable>
    ),
    [colors],
  );



  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* ── Video player (always pinned at top) ── */}
      <View style={{ height: insets.top }}></View>
      <View style={{ width, height: videoHeight, backgroundColor: "#000" }}>
        {resolvedUri ? (
          <VideoView
            player={player}
            style={{ width: "100%", height: "100%" }}
            nativeControls
          />
        ) : (
          // Poster / loading placeholder while stream resolves
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000" }}>
            {detail?.poster_url ? (
              <ExpoImage
                source={{ uri: detail.poster_url }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : null}
            <View style={styles.loadingOverlay}>
              <Ionicons name="play-circle" size={56} color="rgba(255,255,255,0.7)" />
            </View>
          </View>
        )}
      </View>

      {/* ── Scrollable content below the player ── */}
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
            {/* Title + meta */}
            <View style={{ paddingHorizontal: 12, paddingTop: 12, gap: 4 }}>
              <FlexText style={[styles.title, { color: colors.onSurface }]}>
                {detail?.title ?? ""}
              </FlexText>
              <FlexText style={[styles.meta, { color: colors.onSurfaceVariant }]}>
                {[detail?.views, detail?.duration, detail?.uploaded].filter(Boolean).join(" · ")}
              </FlexText>
            </View>

            {/* Description (collapsible) */}
            {!!detail?.description && (
              <Pressable
                onPress={() => setIsExpanded((v) => !v)}
                style={{ paddingHorizontal: 12, paddingTop: 8 }}
              >
                <View style={[styles.descBox, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <FlexText
                    numberOfLines={isExpanded ? undefined : 2}
                    style={[styles.desc, { color: colors.onSurface }]}
                  >
                    {detail.description}
                  </FlexText>
                  <FlexText style={[styles.descToggle, { color: colors.primary }]}>
                    {isExpanded ? "Show less" : "more"}
                  </FlexText>
                </View>
              </Pressable>
            )}

            {/* Episode selector (if multiple episodes) */}
            {episodes.length > 1 && (
              <View style={{ paddingHorizontal: 12, paddingTop: 12 }}>
                <FlexText style={[styles.sectionLabel, { color: colors.onSurface }]}>Episodes</FlexText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
                  {episodes.map((ep) => {
                    const isActive = ep.url === activeEpisodeUrl;
                    return (
                      <TouchableOpacity
                        key={`${ep.episode}-${ep.url}`}
                        onPress={() => setSelectedEpisodeUrl(ep.url)}
                        activeOpacity={0.75}
                        style={[
                          styles.episodeChip,
                          {
                            backgroundColor: isActive ? colors.onSurface : colors.surfaceContainerHigh,
                          },
                        ]}
                      >
                        <FlexText
                          style={[
                            styles.episodeChipText,
                            { color: isActive ? colors.surface : colors.onSurface },
                          ]}
                        >
                          {`Ep ${ep.episode}`}
                        </FlexText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

            {/* Related videos label */}
            {relatedVideos.length > 0 && (
              <FlexText style={[styles.sectionLabel, { color: colors.onSurface, paddingHorizontal: 12, paddingTop: 4 }]}>
                Related Videos
              </FlexText>
            )}
          </>
        )}

        {/* Related videos flat list (inside ScrollView via map, avoids nested FlatList) */}
        {relatedVideos.map((item, index) => (
          <View key={item.video_url || String(index)}>
            {renderRelated({ item })}
          </View>
        ))}
      </ScrollView>

      {/* Back button */}
      {/* <TouchableOpacity
        onPress={() => router.back()}
        style={[
          styles.backButton,
          { top: insets.top + 8, backgroundColor: "rgba(0,0,0,0.55)" },
        ]}
      >
        <Ionicons name="chevron-back" size={22} color="white" />
      </TouchableOpacity> */}
    </View>
  );
};

export default VideoDetailScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  meta: {
    fontSize: 12,
    fontWeight: "400",
  },
  descBox: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
  },
  descToggle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
    marginVertical: 12,
  },
  episodeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  episodeChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  relatedRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  relatedThumbWrap: {
    width: 160,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  relatedThumb: {
    width: "100%",
    height: "100%",
  },
  durationBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  durationText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  relatedTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  relatedMeta: {
    fontSize: 11,
    fontWeight: "400",
  },
  backButton: {
    position: "absolute",
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
});
