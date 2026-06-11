import { BlurMask } from "@/components/blur mask/BlurMask";
import { FlexText } from "@/components/FlexText";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { ShimmerEffect } from "@/components/shimmer/Shimmer";
import { useVideoDetailQuery } from "@/services/shows";
import { useGalleryStore } from "@/stores/gallery";
import { useShowWatchlistStore } from "@/stores/showWatchlist";
import type { VideoCard } from "@/types/shows";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Canvas, ImageShader, LinearGradient, Rect, useImage, vec } from "@shopify/react-native-skia";
import { Bookmark as BookmarkBold, CloudDownload } from "@solar-icons/react-native/Bold";
import { Bookmark as BookmarkOutline } from "@solar-icons/react-native/Outline";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { getColors } from "react-native-image-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { showDetailStorage as storage } from "../../services/storage";
import { createCommonStyles } from "../../styles/common";


const DARK_DOMINANT_CACHE_PREFIX = "show:darkDominant:";

const withAlpha = (hex: string, alphaHex: string) => {
  // Supports '#RRGGBB' and '#RRGGBBAA'. If not hex, fall back to original.
  if (typeof hex !== "string") return hex as unknown as string;
  if (hex.startsWith("#") && (hex.length === 7 || hex.length === 9)) {
    return hex.slice(0, 7) + alphaHex;
  }
  return hex;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
};

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const darkenHex = (hex: string, amount: number): string => {
  // amount: 0..1, where 0 = unchanged, 1 = black
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = Math.max(0, Math.min(1, amount));
  const r = clamp255(rgb.r * (1 - a));
  const g = clamp255(rgb.g * (1 - a));
  const b = clamp255(rgb.b * (1 - a));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const ChatScreen = () => {
  const { colors, typography } = useThemeContext();
  const blurTargetRef = useRef<View | null>(null);
  const common = createCommonStyles(colors, typography);
  const params = useLocalSearchParams();
  const videoUrlOrSlug = Array.isArray(params.video_url) ? params.video_url[0] : params.video_url;

  const { data: videoDetail, isLoading: isVideoDetailLoading, isError: isVideoDetailError } = useVideoDetailQuery(videoUrlOrSlug);

  const detail = videoDetail?.video_detail;
  const relatedVideos = videoDetail?.related_videos;
  const posterUrl = detail?.poster_url;
  const image = useImage(posterUrl || null);

  // Keep the shimmer visible until both the API data and the Skia image are ready
  const isLoading = (isVideoDetailLoading || (posterUrl ? image === null : false)) && !isVideoDetailError;
  const { width } = useWindowDimensions();
  const posterHeight = 500;
  const inset = useSafeAreaInsets();

  const episodes = useMemo(() => {
    if (!detail) return [];
    const apiEpisodes = (detail.episodes ?? []).map((e) => ({ episode: e.episode, url: e.url }));
    if (apiEpisodes.length > 0) {
      return apiEpisodes.slice().sort((a, b) => a.episode - b.episode);
    }
    if (detail.stream_url) return [{ episode: 1, url: detail.stream_url }];
    return [];
  }, [detail]);

  const openGallery = useGalleryStore((s) => s.openGallery);

  const galleryImages = useMemo(
    () => (detail?.extra_images ?? []).map((uri) => ({ uri, caption: detail?.title })),
    [detail?.extra_images, detail?.title],
  );

  useEffect(() => {
    const uris = detail?.extra_images;
    if (!uris || uris.length === 0) return;
    for (const uri of uris) {
      ExpoImage.prefetch(uri);
    }
  }, [detail?.extra_images]);

  const renderGalleryItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <Pressable
        onPress={() => openGallery(galleryImages, index)}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <ExpoImage
          source={{ uri: item }}
          style={{ width: 250, aspectRatio: 16 / 9, borderRadius: 12 }}
          contentFit="cover"
        />
      </Pressable>
    ),
    [galleryImages, openGallery],
  );

  const galleryKeyExtractor = useCallback(
    (item: string, index: number) => `${item}-${index}`,
    [],
  );

  const renderRelatedVideo = useCallback(
    ({ item }: { item: VideoCard }) => (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/show_detail",
            params: { video_url: item.video_url },
          })
        }
        style={{ width: 200, marginRight: 12, overflow: "hidden", position: "relative" }}
      >
        <View style={{ width: 200, borderRadius: 16, overflow: "hidden", position: "relative" }}>
          <ExpoImage
            source={{ uri: item.thumb_url }}
            style={{
              width: 200,
              aspectRatio: 16 / 9,
            }}
            contentFit="cover"
          />
          <View
            style={{
              zIndex: 2,
              position: "absolute",
              bottom: 8,
              right: 12,
              backgroundColor: "rgba(0,0,0,0.5)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <FlexText style={{ color: "white", fontSize: 12 }}>{item.duration}</FlexText>
          </View>
        </View>
        <FlexText
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[styles.textStyle, { color: "white", width: "100%", flexShrink: 1 }]}
        >
          {item.title}
        </FlexText>
        <FlexText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.textStyle, { color: "white", opacity: 0.5, width: "100%", flexShrink: 1 }]}
        >
          {item.views}
        </FlexText>
      </Pressable>
    ),
    [],
  );

  const relatedVideoKeyExtractor = useCallback((item: VideoCard) => item.video_url, []);

  const downloadUrl = detail?.download_url ?? "";

  const renderTag = useCallback(
    ({ item }: { item: string }) => {
      const slug = item.startsWith("#") ? item.slice(1) : item;
      return (
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/show_list",
              params: { mode: "tag", slug },
            })
          }
          style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.card }}
        >
          <Text style={[styles.textStyle, { color: colors.text }]}>{item}</Text>
        </TouchableOpacity>
      );
    },
    [colors.card, colors.text],
  );

  const tagKeyExtractor = useCallback((item: string) => item, []);

  const fallbackBase = useMemo(() => {
    const c = colors.background;
    return typeof c === "string" && c.startsWith("#") && c.length >= 7 ? c.slice(0, 7) : "#000000";
  }, [colors.background]);
  const [darkDominant, setDarkDominant] = useState<string>(darkenHex(fallbackBase, 0.55));

  const { refetch } = useVideoDetailQuery(videoUrlOrSlug);

  const watchlist = useShowWatchlistStore((s) => s.watchlist);
  const addToWatchlist = useShowWatchlistStore((s) => s.add);
  const removeFromWatchlist = useShowWatchlistStore((s) => s.remove);
  const isSaved = useMemo(
    () => watchlist.some((item) => item.video_url === (videoUrlOrSlug ?? "")),
    [watchlist, videoUrlOrSlug]
  );

  const handleToggleWatchlist = () => {
    if (!detail) return;
    if (isSaved) {
      removeFromWatchlist(videoUrlOrSlug ?? '');
    } else {
      addToWatchlist({
        video_url: videoUrlOrSlug ?? '',
        title: detail.title,
        thumb_url: detail.poster_url,
        views: detail.views,
        duration: detail.duration,
        added_at: Date.now(),
      });
    }
  };

  useEffect(() => {
    const url = posterUrl;
    if (!url) return;
    let cancelled = false;

    const run = async () => {
      try {
        const cacheKey = `${DARK_DOMINANT_CACHE_PREFIX}${url}:${fallbackBase}`;
        const cachedDarkDominant = storage.getString(cacheKey);

        if (cachedDarkDominant) {
          if (!cancelled) setDarkDominant(cachedDarkDominant);
          return;
        }

        const result = await getColors(url, {
          fallback: fallbackBase,
          cache: true,
          key: url,
        });

        let dominant: string | undefined | null = null;
        if (result.platform === "android") dominant = result.dominant ?? result.average;
        if (result.platform === "ios") dominant = result.background ?? result.primary;

        const dominantHex = dominant ? (dominant.startsWith("#") ? dominant : `#${dominant}`) : fallbackBase;
        const darker = darkenHex(dominantHex, 0.55);
        const finalDarkDominant = darker;
        storage.set(cacheKey, finalDarkDominant);
        if (!cancelled) setDarkDominant(finalDarkDominant);
      } catch {
        const fallbackDarkDominant = darkenHex(fallbackBase, 0.55);
        storage.set(`${DARK_DOMINANT_CACHE_PREFIX}${url}:${fallbackBase}`, fallbackDarkDominant);
        if (!cancelled) setDarkDominant(fallbackDarkDominant);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [posterUrl, fallbackBase]);

  return (
    <View style={[common.screen, { backgroundColor: darkDominant }]}>
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[{ gap: 12, paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.text}
              colors={[colors.text]}
              progressBackgroundColor={colors.card}
              progressViewOffset={inset.top}
            />
          }
        >
          {isLoading ? (
            <View style={{ gap: 16 }}>
              <ShimmerEffect style={{ height: posterHeight, width: '100%' }} />
              <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 16 }}>
                <ShimmerEffect style={{ height: 32, width: '60%', borderRadius: 8, alignSelf: 'center' }} />
                <ShimmerEffect style={{ height: 16, width: '100%', borderRadius: 8 }} />
                <ShimmerEffect style={{ height: 16, width: '80%', borderRadius: 8 }} />
                <ShimmerEffect style={{ height: 120, width: '100%', borderRadius: 12, marginTop: 24 }} />
              </View>
            </View>
          ) : isVideoDetailError ? (
            <View style={{ marginHorizontal: 16, padding: 12, borderRadius: 12, backgroundColor: "rgba(255,0,0,0.12)", marginTop: posterHeight * 0.5 }}>
              <Text style={{ color: "white", fontWeight: "700", textAlign: "center" }}>Failed to load video.</Text>
            </View>
          ) : (
            <>
              {/* Header poster (scrolls away) */}
              <View style={[styles.header, { height: posterHeight }]}>
                {image && (
                  <Canvas style={{ height: posterHeight }}>
                    <BlurMask
                      mask={
                        <LinearGradient
                          start={vec(0, posterHeight * 0.5)}
                          end={vec(0, posterHeight)}
                          colors={["transparent", "black"]}
                        />
                      }
                    >
                      <ImageShader
                        image={image}
                        x={0}
                        width={width}
                        height={posterHeight}
                        fit="cover"
                        tx="clamp"
                        ty="clamp"
                      />
                    </BlurMask>

                    {/* Bottom→top overlay to blend into the solid background */}
                    <Rect x={0} y={0} width={width} height={posterHeight}>
                      <LinearGradient
                        start={vec(0, posterHeight)}
                        end={vec(0, 0)}
                        // Strong at bottom, fades out quickly (adjust positions to taste)
                        colors={[
                          withAlpha(darkDominant, "FF"), // solid at bottom
                          withAlpha(darkDominant, "99"), // stronger mid fade
                          "transparent",
                        ]}
                        positions={[0, 0.25, 1]}
                      />
                    </Rect>
                  </Canvas>
                )}

                <View
                  pointerEvents="none"
                  style={[
                    styles.headerOverlay,
                    {
                      paddingBottom: 24, // distance from bottom
                    },
                  ]}
                >
                  {/* Badge */}
                  <ExpoImage source={require("../../assets/images/oscar.png")} style={{ width: 150, height: 150 }} contentFit="contain" />
                  <FlexText style={{ color: "white", fontSize: 36, fontWeight: "700", textAlign: "center" }}>
                    {detail?.title ?? ""}
                  </FlexText>
                  <FlexText numberOfLines={2} style={{ color: "white", fontSize: 16, fontWeight: "400", textAlign: "justify" }}>
                    {detail?.description ?? ""}
                  </FlexText>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    <FlexText style={[styles.textStyle, { color: "white" }]}>{detail?.views ?? ""}</FlexText>
                    <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }}></View>
                    <FlexText style={[styles.textStyle, { color: "white" }]}>{detail?.category ?? ""}</FlexText>
                    <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }}></View>
                    <ExpoImage source={require("../../assets/images/vision.png")} style={{ width: 32, height: 32, opacity: 0.8 }} contentFit="contain" />
                    <ExpoImage source={require("../../assets/images/atmos.png")} style={{ width: 32, height: 32, opacity: 0.8 }} contentFit="contain" />
                  </View>
                </View>
              </View>
              <View>
                <View style={{ paddingHorizontal: 16 }}>
                  <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12 }]}>
                    Episodes
                  </Text>
                  <View style={styles.episodeGrid}>
                    {episodes.map((ep, index) => (
                      <Pressable
                        key={`${ep.episode}-${ep.url}-${index}`}
                        onPress={() => {
                          if (!ep.url) return;
                          // const isHls = ep.url.toLowerCase().includes(".m3u8");
                          // if (isHls && webviewUrl) {
                          //   WebBrowser.openBrowserAsync(webviewUrl);
                          //   return;
                          // }
                          console.log("ep.url", ep.url);
                          router.push({
                            pathname: "/video_player",
                            params: {
                              videoUrl: ep.url,
                              name: detail?.title ?? "",
                              caption: detail?.description ?? "",
                              portrait: "true",
                            },
                          });
                        }}
                        style={({ pressed }) => [
                          styles.episodeButton,
                          {
                            backgroundColor: withAlpha("#FFFFFF", "14"),
                            borderColor: withAlpha("#FFFFFF", "2A"),
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <Text style={[styles.episodeText, { color: "white" }]}>
                          Episode {ep.episode}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {(detail?.extra_images?.length ?? 0) > 0 && (
                  <View>
                    <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12, marginTop: 24, paddingHorizontal: 16 }]}>
                      Gallery
                    </Text>
                    <FlatList
                      horizontal
                      data={detail?.extra_images ?? []}
                      keyExtractor={galleryKeyExtractor}
                      renderItem={renderGalleryItem}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
                    />
                  </View>
                )}
                <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12, marginTop: 20, paddingHorizontal: 16 }]}>
                  Information
                </Text>
                <View style={{ gap: 8 }}>
                  <View style={{ paddingHorizontal: 16 }}>
                    <Text style={[styles.textStyle, { color: "white", }]}>
                      Released
                    </Text>
                    <Text style={[styles.textStyle, { color: colors.muted }]}>
                      {detail?.uploaded ?? ""}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.textStyle, { color: "white", paddingHorizontal: 16 }]}>
                      Tags
                    </Text>
                    <FlatList
                      horizontal
                      data={detail?.tags ?? []}
                      keyExtractor={tagKeyExtractor}
                      renderItem={renderTag}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, marginTop: 8, paddingHorizontal: 16 }}
                    />
                  </View>
                </View>
                <Text style={[styles.sectionTitle, { color: "white", marginBottom: 12, marginTop: 20, paddingHorizontal: 16 }]}>
                  Related Videos
                </Text>
                <FlatList
                  horizontal
                  data={relatedVideos ?? []}
                  keyExtractor={relatedVideoKeyExtractor}
                  renderItem={renderRelatedVideo}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                />
              </View>
              <View style={{ height: inset.bottom }} />
            </>
          )}
        </ScrollView>
      </BlurTargetView>
      <View
        style={{
          position: 'absolute',
          top: inset.top,
          left: 16,
          right: 16,
          zIndex: 1000,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <BlurView
          tint={"systemMaterialDark"}
          intensity={80}
          blurTarget={blurTargetRef}
          blurMethod="dimezisBlurViewSdk31Plus"
          style={{
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              borderRadius: 999,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name='chevron-back' size={24} color={'white'} />
          </TouchableOpacity>
        </BlurView>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Watchlist toggle */}
          <BlurView
            tint={"systemMaterialDark"}
            intensity={80}
            blurTarget={blurTargetRef}
            blurMethod="dimezisBlurViewSdk31Plus"
            style={{ borderRadius: 999, overflow: 'hidden' }}
          >
            <TouchableOpacity
              onPress={handleToggleWatchlist}
              style={{
                borderRadius: 999,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {
                isSaved ? (
                  <BookmarkBold size={22} color={'#facc15'} />
                ) : (
                  <BookmarkOutline size={22} color={'white'} />
                )
              }
            </TouchableOpacity>
          </BlurView>

          {downloadUrl ? (
            <BlurView
              tint={"systemMaterialDark"}
              intensity={80}
              blurTarget={blurTargetRef}
              blurMethod="dimezisBlurViewSdk31Plus"
              style={{ borderRadius: 999, overflow: 'hidden' }}
            >
              <TouchableOpacity
                onPress={() => {
                  WebBrowser.openBrowserAsync(downloadUrl);
                }}
                style={{
                  borderRadius: 999,
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CloudDownload size={24} color={'white'} />
              </TouchableOpacity>
            </BlurView>
          ) : null}
        </View>
      </View>
      <GalleryModal />
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  header: {
    position: "relative",
    overflow: "hidden",
  },
  headerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  episodeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  episodeButton: {
    flexBasis: "30%",
    flexGrow: 1,
    maxWidth: "32%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  episodeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  textStyle: {
    fontSize: 14,
  },
});

