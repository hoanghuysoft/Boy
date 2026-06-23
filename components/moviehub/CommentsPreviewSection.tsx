import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { FlexText } from '../FlexText';
import type { IComment } from '@/services/shows';

interface CommentsPreviewSectionProps {
  comments: IComment[];
  colors: any;
  onPress: () => void;
}

export const CommentsPreviewSection = ({
  comments,
  colors,
  onPress,
}: CommentsPreviewSectionProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.wrapper,
        { opacity: pressed ? 0.9 : 1 }
      ]}
    >
      <View style={[styles.container, { backgroundColor: colors.surfaceContainerHigh }]}>
        {/* Header */}
        <View style={styles.header}>
          <FlexText style={[styles.title, { color: colors.onSurface }]}>
            Comments{" "}
            <Text style={[styles.count, { color: colors.onSurfaceVariant }]}>
              {comments.length}
            </Text>
          </FlexText>
          <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceVariant} />
        </View>

        {/* First comment preview */}
        {comments.length > 0 ? (
          <View style={styles.commentRow}>
            <ExpoImage
              source={{ uri: comments[0].avatarUrl }}
              style={[styles.avatar, { backgroundColor: colors.surfaceContainerLowest }]}
              contentFit="cover"
            />
            <FlexText numberOfLines={2} style={[styles.previewText, { color: colors.onSurface }]}>
              <Text style={{ fontWeight: '600' }}>
                {comments[0].userName}
              </Text>
              {": "}{comments[0].commentText}
            </FlexText>
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
            Add a public comment...
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  container: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
  },
  count: {
    fontSize: 12,
    fontWeight: "400",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  previewText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 12,
  },
});
