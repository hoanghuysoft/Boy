import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons/static';
import { Image as ExpoImage } from 'expo-image';

// SVG Icons
import Bookmark from '@/assets/images/svg/bookmark.svg';
import ShareIcon from '@/assets/images/svg/shareyt.svg';
import ThumbUp from '@/assets/images/svg/thumb-up.svg';

interface ActionBarProps {
  colors: any;
  matchedAvatar: { url: string; background: string | null };
  isLiked: boolean;
  isBookmarked: boolean;
  onToggleLike: () => void;
  onShare: () => void;
  onToggleBookmark: () => void;
  onReport: () => void;
}

export const ActionBar = ({
  colors,
  matchedAvatar,
  isLiked,
  isBookmarked,
  onToggleLike,
  onShare,
  onToggleBookmark,
  onReport,
}: ActionBarProps) => {
  return (
    <View style={styles.channelRow}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionBarScroll}
        style={{ flex: 1 }}
      >
        {/* Channel Avatar */}
        <ExpoImage
          source={{ uri: matchedAvatar.url }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 19,
            backgroundColor: matchedAvatar.background || colors.surfaceContainerHigh,
          }}
          contentFit="cover"
        />

        {/* Like */}
        <TouchableOpacity
          onPress={onToggleLike}
          style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
          activeOpacity={0.75}
        >
          {isLiked ? (
            <ThumbUp width={24} height={24} fill={colors.error} color={colors.error} />
          ) : (
            <ThumbUp width={24} height={24} color={colors.onSurface} />
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          onPress={onShare}
          style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
          activeOpacity={0.75}
        >
          <ShareIcon width={22} height={22} color={colors.onSurface} />
        </TouchableOpacity>

        {/* Save / Bookmark */}
        <TouchableOpacity
          onPress={onToggleBookmark}
          style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
          activeOpacity={0.75}
        >
          {isBookmarked ? (
            <Bookmark width={24} height={24} fill={colors.primary} color={colors.primary} />
          ) : (
            <Bookmark width={24} height={24} color={colors.onSurface} />
          )}
          <Text style={[styles.actionText, { color: colors.onSurface }]}>
            {isBookmarked ? "Saved" : "Save"}
          </Text>
        </TouchableOpacity>

        {/* Report */}
        <TouchableOpacity
          onPress={onReport}
          style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
          activeOpacity={0.75}
        >
          <Ionicons name="flag-outline" size={22} color={colors.onSurface} />
          <Text style={[styles.actionText, { color: colors.onSurface }]}>Report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 14,
    gap: 16,
  },
  actionBarScroll: {
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 50,
    flexDirection: 'row',
    height: 32,
    borderRadius: 999,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
