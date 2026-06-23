import { avatar } from '@/services/shows';
import type { VideoCard } from '@/types/shows';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FlexText } from '../FlexText';
import { resolveBlurhash } from '../gallery/fallbackBlurhash';

interface RelatedVideoCardProps {
  item: VideoCard;
  onPress: () => void;
  colors: any;
  videoHeight: number;
  width: number;
}

export const RelatedVideoCard = React.memo(({ item, onPress, colors, videoHeight, width }: RelatedVideoCardProps) => {
  const matchedAvatar = avatar.find(
    (a) => a.name !== "Default" && item.title.toLowerCase().includes(a.name.toLowerCase())
  ) || avatar.find((a) => a.name === "Default") || avatar[0];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <View style={{ width, height: videoHeight, backgroundColor: colors.surfaceContainerLow }}>
        <ExpoImage
          source={{ uri: item.thumb_url }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          placeholder={{ blurhash: resolveBlurhash((item as any).blurhash, item.video_url || item.thumb_url) }}
        />
        {!!item.duration && (
          <View style={styles.durationBadge}>
            <FlexText style={styles.durationText}>{item.duration}</FlexText>
          </View>
        )}
      </View>

      <View style={styles.infoRow}>
        <ExpoImage
          source={{ uri: matchedAvatar.url }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: matchedAvatar.background || colors.surfaceContainerHigh,
          }}
          contentFit="cover"
        />
        <View style={{ flex: 1, gap: 2 }}>
          <FlexText numberOfLines={2} style={[styles.title, { color: colors.onSurface }]}>
            {item.title}
          </FlexText>
          <FlexText numberOfLines={1} style={[styles.meta, { color: colors.onSurfaceVariant }]}>
            {[item.views, item.duration].filter(Boolean).join(" • ")}
          </FlexText>
        </View>
        <TouchableOpacity style={{ padding: 4, marginTop: -2 }} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.onSurface} />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
});

RelatedVideoCard.displayName = "RelatedVideoCard";

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    fontWeight: "400",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
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
