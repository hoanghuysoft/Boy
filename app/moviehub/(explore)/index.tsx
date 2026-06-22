import { FlexText } from "@/components/FlexText";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import type { VideoCard } from "@/types/shows";
import { useHomeViewModel } from "@/viewmodels/Shows/HomeViewModel";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ALL_TAG = "All";

const ExploreScreen = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const vm = useHomeViewModel(true);
  const [selectedTag, setSelectedTag] = useState<string>(ALL_TAG);

  const thumbHeight = Math.round(width * (9 / 16));

  // Build category chips from section headings
  const tags = useMemo<string[]>(() => {
    const headings = vm.sections?.sections?.map((s) => s.heading) ?? [];
    return [ALL_TAG, ...headings];
  }, [vm.sections]);

  // Map each section heading → its items (for quick lookup)
  const sectionMap = useMemo(() => {
    const map = new Map<string, VideoCard[]>();
    for (const s of vm.sections?.sections ?? []) {
      map.set(s.heading, s.items);
    }
    return map;
  }, [vm.sections]);

  // Merge + dedup all items, filtered by selected tag
  const items = useMemo<VideoCard[]>(() => {
    const rawItems =
      selectedTag === ALL_TAG
        ? (vm.sections?.sections?.flatMap((s) => s.items) ?? [])
        : (sectionMap.get(selectedTag) ?? []);

    const seen = new Set<string>();
    return rawItems.filter((item) => {
      if (!item.video_url || seen.has(item.video_url)) return false;
      seen.add(item.video_url);
      return true;
    });
  }, [vm.sections, selectedTag, sectionMap]);

  const renderItem = useCallback(
    ({ item }: { item: VideoCard }) => (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/moviehub/(explore)/video_detail",
            params: { video_url: item.video_url },
          })
        }
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      >
        {/* Thumbnail — full width, 16:9 */}
        <View style={{ width, height: thumbHeight, backgroundColor: colors.surfaceContainerLow }}>
          <ExpoImage
            source={{ uri: item.thumb_url }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            placeholder={{ blurhash: resolveBlurhash((item as any).blurhash, item.video_url || item.thumb_url) }}
          />
          {/* Duration badge */}
          {!!item.duration && (
            <View style={styles.durationBadge}>
              <FlexText style={styles.durationText}>{item.duration}</FlexText>
            </View>
          )}
        </View>

        {/* Info row below thumbnail */}
        <View style={styles.infoRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <FlexText numberOfLines={2} style={[styles.title, { color: colors.onSurface }]}>
              {item.title}
            </FlexText>
            <FlexText numberOfLines={1} style={[styles.meta, { color: colors.onSurfaceVariant }]}>
              {[item.views, item.duration].filter(Boolean).join(" • ")}
            </FlexText>
          </View>
        </View>
      </Pressable>
    ),
    [colors, width, thumbHeight],
  );

  const keyExtractor = useCallback(
    (item: VideoCard, index: number) => item.video_url || String(index),
    [],
  );

  const renderHeader = () => (
    <View style={{ paddingTop: insets.top + 20 }}>
      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.push("/search_shows")}>
          <SquircleView
            borderRadius={999}
            cornerSmoothing={100}
            preserveSmoothing
            style={{ height: 50, backgroundColor: colors.surfaceContainerHigh, justifyContent: 'center', paddingHorizontal: 16 }}
          >
            <FlexText style={{ color: colors.onSurfaceVariant }}>Search WeLove Hub</FlexText>
          </SquircleView>
        </TouchableOpacity>
      </View>

      {/* YouTube-style category chip row */}
      {tags.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}
        >
          {tags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => setSelectedTag(tag)}
                activeOpacity={0.75}
              >
                <SquircleView cornerSmoothing={60} preserveSmoothing style={[
                  styles.chip,
                  isSelected
                    ? { backgroundColor: colors.onSurface }
                    : { backgroundColor: colors.surfaceContainerHigh },
                ]}>
                  <FlexText
                    style={[
                      styles.chipText,
                      { color: isSelected ? colors.surface : colors.onSurface },
                    ]}
                  >
                    {tag}
                  </FlexText>
                </SquircleView>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (!vm.isLoadingSections) return null;
    return (
      <SkeletonGroup isLoading={true} variant="shimmer">
        <View style={{ gap: 20 }}>
          {[1, 2, 3].map((key) => (
            <View key={key}>
              <SkeletonGroup.Item style={{ width, height: thumbHeight }} />
              <View style={styles.infoRow}>
                <View style={{ flex: 1, gap: 8 }}>
                  <SkeletonGroup.Item style={{ height: 14, width: "85%", borderRadius: 4 }} />
                  <SkeletonGroup.Item style={{ height: 12, width: "55%", borderRadius: 4 }} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </SkeletonGroup>
    );
  };

  return (
    <View style={[common.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmpty()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          gap: 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={vm.isRefetchingSections}
            onRefresh={vm.refetchSections}
            tintColor={colors.onSurface}
            colors={[colors.onSurface]}
            progressBackgroundColor={colors.surfaceContainerHigh}
            progressViewOffset={insets.top}
          />
        }
      />
    </View>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  chip: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    fontWeight: "400",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
});
