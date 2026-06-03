import { FlexText } from "@/components/FlexText";
import { ShimmerEffect } from "@/components/shimmer/Shimmer";
import { useCategoryInfiniteQuery } from "@/services/shows/category";
import { useTagInfiniteQuery } from "@/services/shows/tag";
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
import { Spinner } from "heroui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

type Mode = "category" | "tag";

const ShowListScreen = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const inset = useSafeAreaInsets();

  const params = useLocalSearchParams<{ mode: Mode; slug: string }>();
  const mode: Mode = params.mode === "tag" ? "tag" : "category";
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug ?? "");

  const categoryQuery = useCategoryInfiniteQuery(mode === "category" ? slug : undefined);
  const tagQuery = useTagInfiniteQuery(mode === "tag" ? slug : undefined);
  const query = mode === "category" ? categoryQuery : tagQuery;

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

  const heading = mode === "tag"
    ? `#${slug}`
    : slug.charAt(0).toUpperCase() + slug.slice(1);

  const subtitle = mode === "tag"
    ? `Videos tagged with #${slug}`
    : `Videos in the "${heading}" category`;

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
        <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 16 }}>
          {[1, 2, 3, 4, 5].map((key) => (
            <View key={key} style={[styles.row, { padding: 0 }]}>
              <ShimmerEffect style={styles.thumbnail} />
              <View style={{ flex: 1, gap: 8 }}>
                <ShimmerEffect style={{ height: 16, width: '80%', borderRadius: 4 }} />
                <ShimmerEffect style={{ height: 12, width: '60%', borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>
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
