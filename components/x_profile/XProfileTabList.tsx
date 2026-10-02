import { FlexText } from "@/components/FlexText";
import { List } from "@/components/list";
import { PostItem } from "@/components/PostItem";
import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import { Post } from "@/types/post";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Spinner } from "panelui-native";
import React, { memo, useCallback } from "react";
import { StyleSheet, View } from "react-native";

export interface XProfileTabListProps {
  data: Post[];
  scrollElRef: any;
  headerHeight: number;
  windowHeight: number;
  bottomInset: number;
  isRefetching: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  onScrollY: (y: number) => void;
  onCrossPostPress?: (post: Post) => void;
  onOptionsPress?: (post: Post) => void;
  emptyTitle: string;
  emptySubtitle: string;
  emptyIconName: any;
}

export const XProfileTabList = memo(function XProfileTabList({
  data,
  scrollElRef,
  headerHeight,
  windowHeight,
  bottomInset,
  isRefetching,
  isLoading,
  isFetchingNextPage,
  onRefresh,
  onEndReached,
  onScrollY,
  onCrossPostPress,
  onOptionsPress,
  emptyTitle,
  emptySubtitle,
  emptyIconName,
}: XProfileTabListProps) {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);

  const renderPostItem = useCallback(
    ({ item }: { item: Post }) => (
      <View style={{ marginBottom: 24 }}>
        <PostItem
          post={item}
          metricsOnly={true}
          onCrossPostPress={onCrossPostPress}
          onOptionsPress={onOptionsPress}
        />
      </View>
    ),
    [onCrossPostPress, onOptionsPress]
  );

  return (
    <List
      ref={scrollElRef as any}
      data={data}
      renderItem={renderPostItem}
      keyExtractor={(item: Post) => item.id}
      getItemType={(item: Post) => {
        const content = item.reposted_post || item;
        if (content.media?.length) return "media";
        if (content.audio_url) return "audio";
        if (content.links?.length) return "link";
        return "text";
      }}
      estimatedItemSize={380}
      recycleItems={true}
      drawDistance={400}
      headerOffset={headerHeight}
      progressBackgroundColor={colors.card}
      refreshing={isRefetching}
      onRefresh={onRefresh}
      refreshTintColor={colors.text}
      progressViewOffset={headerHeight}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons name={emptyIconName} size={44} color={colors.outline} />
          <FlexText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {isLoading ? "Loading..." : emptyTitle}
          </FlexText>
          <FlexText
            style={[styles.emptySubtitle, { color: colors.muted }]}
          >
            {emptySubtitle}
          </FlexText>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.tabFooterLoader}>
            <Spinner size="sm" color={colors.primary} />
          </View>
        ) : null
      }
      contentContainerStyle={{
        minHeight: windowHeight + headerHeight,
        paddingBottom: bottomInset + 80,
      }}
      showsVerticalScrollIndicator={false}
      onScrollY={onScrollY}
      ListHeaderComponent={<View style={{ height: 12 }} />}
    />
  );
});

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  tabFooterLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

