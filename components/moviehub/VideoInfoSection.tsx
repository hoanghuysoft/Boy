import React from 'react';
import { Pressable, View, StyleSheet, Text } from 'react-native';
import { FlexText } from '../FlexText';
import type { VideoDetail } from '@/types/shows';

interface VideoInfoSectionProps {
  detail: VideoDetail | undefined;
  colors: any;
  onPress: () => void;
}

export const VideoInfoSection = ({ detail, colors, onPress }: VideoInfoSectionProps) => {
  const metaText = [
    detail?.views,
    detail?.duration,
    detail?.uploaded
  ].filter(Boolean).join(" · ");

  return (
    <View style={styles.container}>
      <FlexText style={[styles.title, { color: colors.onSurface }]}>
        {detail?.title ?? ""}
      </FlexText>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.metaRow,
          { opacity: pressed ? 0.85 : 1 }
        ]}
      >
        <FlexText style={[styles.meta, { color: colors.onSurfaceVariant }]}>
          {metaText}
        </FlexText>
        <Text style={[styles.moreText, { color: colors.primary }]}>
          ...more
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  meta: {
    fontSize: 12,
    fontWeight: "400",
  },
  moreText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
});
