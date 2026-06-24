import React, { useCallback, useEffect, useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { SkeletonGroup } from "heroui-native/skeleton-group";

import { useThemeContext } from "@/context/ThemeContext";
import { useVideoDetailQuery } from "@/services/shows";
import { useGalleryStore } from "@/stores/gallery";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { FlexText } from "@/components/FlexText";
import { createCommonStyles } from "@/styles/common";

const GalleryScreen = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ video_url: string }>();
  const videoUrl = Array.isArray(params.video_url) ? params.video_url[0] : params.video_url;

  const { data: videoDetail, isLoading, isError } = useVideoDetailQuery(videoUrl);
  const detail = videoDetail?.video_detail;
  const extraImages = useMemo(() => detail?.extra_images ?? [], [detail]);

  const openGallery = useGalleryStore((s) => s.openGallery);

  const galleryImages = useMemo(
    () => extraImages.map((uri) => ({ uri, caption: detail?.title })),
    [extraImages, detail]
  );

  // Prefetch gallery images for smooth loading
  useEffect(() => {
    if (extraImages.length === 0) return;
    for (const uri of extraImages) {
      ExpoImage.prefetch(uri);
    }
  }, [extraImages]);

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <Pressable
        onPress={() => openGallery(galleryImages, index)}
        style={({ pressed }) => [
          styles.imageCard,
          { opacity: pressed ? 0.85 : 1 }
        ]}
      >
        <ExpoImage
          source={{ uri: item }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </Pressable>
    ),
    [galleryImages, openGallery]
  );

  const keyExtractor = useCallback(
    (item: string, index: number) => `${item}-${index}`,
    []
  );

  const ListHeaderComponent = useCallback(() => (
    <View style={{ marginTop: insets.top + 66, paddingHorizontal: 16, marginBottom: 16 }}>
      <FlexText style={[common.heading, { fontSize: 28 }]}>
        Gallery
      </FlexText>
      {detail?.title && (
        <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={2}>
          {detail.title}
        </FlexText>
      )}
    </View>
  ), [insets.top, common, colors, detail]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <SkeletonGroup isLoading variant="shimmer">
          <View style={[styles.gridContainer, { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 8 }]}>
            {[1, 2, 3, 4, 5, 6].map((key) => (
              <View key={key} style={styles.imageCard}>
                <SkeletonGroup.Item style={styles.skeletonItem} />
              </View>
            ))}
          </View>
        </SkeletonGroup>
      );
    }
    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <FlexText style={[common.body, styles.errorText, { color: colors.onSurface }]}>
            Failed to load gallery images.
          </FlexText>
        </View>
      );
    }
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="images-outline" size={48} color={colors.onSurfaceVariant} style={{ opacity: 0.5 }} />
        <FlexText style={[common.body, styles.emptyText, { color: colors.onSurfaceVariant }]}>
          No images available in this gallery.
        </FlexText>
      </View>
    );
  }, [isLoading, isError, colors, common]);

  return (
    <View style={[common.screen, { backgroundColor: colors.background }]}>
      {/* Floating back button */}
      <View style={{ position: "absolute", top: insets.top + 16, left: 16, zIndex: 1000 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.surfaceContainerHigh,
            borderRadius: 999,
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={isLoading || isError ? [] : extraImages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.gridContainer,
          { paddingBottom: insets.bottom + 24 },
          (isLoading || isError || extraImages.length === 0) && { flex: 1 }
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Full Screen Gallery Modal */}
      <GalleryModal />
    </View>
  );
};

export default GalleryScreen;

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: 8,
  },
  imageCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
    aspectRatio: 16 / 9,
    minWidth: "40%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  skeletonItem: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 8,
    marginTop: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
  },
});
