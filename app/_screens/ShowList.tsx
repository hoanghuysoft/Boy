import { FlexText } from "@/components/FlexText";
import {
  useCategoryInfiniteQuery,
  useTagInfiniteQuery,
  useLatestInfiniteQuery,
  usePopularInfiniteQuery,
  useLeastViewedInfiniteQuery
} from "@/services/shows";
import type { VideoCard } from "@/types/shows";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { Image as ExpoImage } from "expo-image";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from "heroui-native/spinner";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

type Mode = "category" | "tag" | "latest" | "popular" | "leastViewed";

const ShowListScreen = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const inset = useSafeAreaInsets();

  const params = useLocalSearchParams<{ mode: string; slug?: string }>();
  const mode: Mode = (params.mode as Mode) || "latest";
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? "");

  const categoryQuery = useCategoryInfiniteQuery(mode === "category" ? slug : undefined);
  const tagQuery = useTagInfiniteQuery(mode === "tag" ? slug : undefined);
  const latestQuery = useLatestInfiniteQuery(mode === "latest");
  const popularQuery = usePopularInfiniteQuery(mode === "popular");
  const leastViewedQuery = useLeastViewedInfiniteQuery(mode === "leastViewed");

  const query = useMemo(() => {
    switch (mode) {
      case "category":
        return categoryQuery;
      case "tag":
        return tagQuery;
      case "latest":
        return latestQuery;
      case "popular":
        return popularQuery;
      case "leastViewed":
        return leastViewedQuery;
      default:
        return latestQuery;
    }
  }, [mode, categoryQuery, tagQuery, latestQuery, popularQuery, leastViewedQuery]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    isRefetching,
    isError,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = query;

  const items = useMemo<VideoCard[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const heading = useMemo(() => {
    switch (mode) {
      case "tag":
        return `#${slug}`;
      case "category":
        return slug.charAt(0).toUpperCase() + slug.slice(1);
      case "latest":
        return "Latest Videos";
      case "popular":
        return "Popular Videos";
      case "leastViewed":
        return "Least Viewed Videos";
      default:
        return "Videos";
    }
  }, [mode, slug]);

  const subtitle = useMemo(() => {
    switch (mode) {
      case "tag":
        return `Videos tagged with #${slug}`;
      case "category":
        return `Videos in the "${heading}" category`;
      case "latest":
        return "Showing the most recently added videos";
      case "popular":
        return "Showing the most viewed videos";
      case "leastViewed":
        return "Showing the least viewed videos";
      default:
        return "";
    }
  }, [mode, slug, heading]);

  const renderItem = useCallback(
    ({ item }: { item: VideoCard }) => (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/show_detail",
            params: { video_url: item.video_url },
          })
        }
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.background, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <ExpoImage
          source={{ uri: item.thumb_url }}
          style={styles.thumbnail}
          contentFit="cover"
        />
        <View style={{ flex: 1, gap: 4 }}>
          <FlexText numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {item.title}
          </FlexText>
          <FlexText
            numberOfLines={2}
            style={[styles.description, { color: (colors as any).muted ?? "rgba(255,255,255,0.7)" }]}
          >
            {item.duration} • {item.views}
          </FlexText>
        </View>
      </Pressable>
    ),
    [colors],
  );

  const ListHeaderComponent = useCallback(
    () => (
      <View style={{ marginTop: inset.top + 66, paddingHorizontal: 16, marginBottom: 8 }}>
        <FlexText style={[common.heading, { fontSize: 28 }]}>{heading}</FlexText>
        <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
          {subtitle}
        </FlexText>
      </View>
    ),
    [inset.top, common, colors.muted, heading, subtitle],
  );

  const ListFooterComponent = useCallback(() => {
    if (isLoading) {
      return (
        <SkeletonGroup isLoading={true} variant="shimmer">
          <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 16 }}>
            {[1, 2, 3, 4, 5].map((key) => (
              <View key={key} style={[styles.row, { padding: 0 }]}>
                <SkeletonGroup.Item style={styles.thumbnail} />
                <View style={{ flex: 1, gap: 8 }}>
                  <SkeletonGroup.Item style={{ height: 16, width: '80%', borderRadius: 4 }} />
                  <SkeletonGroup.Item style={{ height: 12, width: '60%', borderRadius: 4 }} />
                </View>
              </View>
            ))}
          </View>
        </SkeletonGroup>
      );
    }

    if (isError) {
      return (
        <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          <View style={{ padding: 12, borderRadius: 12, backgroundColor: "rgba(255,0,0,0.12)" }}>
            <Text style={{ color: "white", fontWeight: "700" }}>
              Failed to load. Try going back and retrying.
            </Text>
          </View>
        </View>
      );
    }

    if (!hasNextPage) return null;

    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <TouchableOpacity
          onPress={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          style={[
            styles.loadMoreButton,
            { backgroundColor: colors.card, opacity: isFetchingNextPage ? 0.7 : 1 },
          ]}
        >
          {isFetchingNextPage ? (
            <Spinner size="md" color={colors.text} />
          ) : (
            <FlexText style={{ color: colors.text, fontWeight: "700" }}>Load more</FlexText>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [colors, fetchNextPage, hasNextPage, isError, isLoading, isFetchingNextPage]);

  return (
    <View style={common.screen}>
      {/* Floating back button */}
      <View style={{ position: "absolute", top: inset.top + 16, left: 16, zIndex: 1000 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.containerContent,
            borderRadius: 999,
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.video_url}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        contentContainerStyle={{
          paddingHorizontal: 8,
          paddingBottom: inset.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={colors.text}
            colors={[colors.text]}
            progressBackgroundColor={colors.card}
            progressViewOffset={inset.top}
          />
        }
      />
    </View>
  );
};

export default ShowListScreen;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    gap: 12,
    marginBottom: 12,
  },
  thumbnail: {
    width: 150,
    height: 80,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    fontWeight: "400",
  },
  loadMoreButton: {
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
