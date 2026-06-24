import Bookmark from '@/assets/images/svg/bookmark.svg';
import CloudDownload from '@/assets/images/svg/downloadyt.svg';
import ImageIcon from '@/assets/images/svg/image.svg';
import Report from '@/assets/images/svg/report.svg';
import ShareIcon from '@/assets/images/svg/shareyt.svg';
import ThumbUp from '@/assets/images/svg/thumb-up.svg';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ActionBarProps {
  colors: any;
  matchedAvatar: { url: string; background: string | null };
  isLiked: boolean;
  isBookmarked: boolean;
  onToggleLike: () => void;
  onShare: () => void;
  onToggleBookmark: () => void;
  onReport: () => void;
  onDownloadPress?: () => void;
  onGalleryPress?: () => void;
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
  onDownloadPress,
  onGalleryPress,
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

        {/* Gallery */}
        {onGalleryPress && (
          <TouchableOpacity
            onPress={onGalleryPress}
            style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
            activeOpacity={0.75}
          >
            <ImageIcon width={20} height={20} color={colors.onSurface} />
          </TouchableOpacity>
        )}

        {/* Share */}
        <TouchableOpacity
          onPress={onShare}
          style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
          activeOpacity={0.75}
        >
          <ShareIcon width={22} height={22} color={colors.onSurface} />
          <Text style={[styles.actionText, { color: colors.onSurface }]}>Share</Text>
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

        {/* Download */}
        {onDownloadPress && (
          <TouchableOpacity
            onPress={onDownloadPress}
            style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
            activeOpacity={0.75}
          >
            <CloudDownload width={24} height={24} color={colors.onSurface} />
            <Text style={[styles.actionText, { color: colors.onSurface }]}>Download</Text>
          </TouchableOpacity>
        )}

        {/* Report */}
        <TouchableOpacity
          onPress={onReport}
          style={[styles.actionButton, { backgroundColor: colors.surfaceContainerHigh }]}
          activeOpacity={0.75}
        >
          <Report width={24} height={24} color={colors.onSurface} />
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
