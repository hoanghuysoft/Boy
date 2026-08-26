import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import VerifiedIcon from "@/icons/verified";
import { FxPhoto, FxTwitterStatus, FxVideo } from "@/services/fxtwitter/types";
import { createCommonStyles } from "@/styles/common";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Image as ExpoImage } from "expo-image";
import React, { memo, useMemo } from "react";
import {
  Dimensions,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

dayjs.extend(relativeTime);

const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export interface XPostCardProps {
  post: FxTwitterStatus;
  onPress?: (post: FxTwitterStatus) => void;
  onAuthorPress?: (handle: string) => void;
}

function formatNumber(num?: number | null): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

function formatVideoDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export const XPostCard = memo(({ post, onPress, onAuthorPress }: XPostCardProps) => {
  const { colors, typography, theme } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const isDark = theme === "dark";

  const timeAgo = useMemo(() => {
    if (post.created_timestamp) {
      return dayjs(post.created_timestamp * 1000).fromNow(true);
    }
    if (post.created_at) {
      return dayjs(post.created_at).fromNow(true);
    }
    return "";
  }, [post.created_timestamp, post.created_at]);

  const author = post.author;
  const photos = post.media?.photos || [];
  const videos = post.media?.videos || [];
  const hasPhotos = photos.length > 0;
  const hasVideos = videos.length > 0;

  const handleOpenLink = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.card,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        },
      ]}
    >
      {/* Repost Header if applicable */}
      {post.reposted_by && (
        <View style={styles.repostHeader}>
          <Ionicons name="repeat" size={14} color={colors.muted} />
          <FlexText style={[common.caption, { color: colors.muted, marginLeft: 6 }]}>
            {post.reposted_by.name || post.reposted_by.screen_name} Reposted
          </FlexText>
        </View>
      )}

      {/* Main Content Row */}
      <View style={styles.headerRow}>
        {/* Author Avatar */}
        <TouchableOpacity
          onPress={() => onAuthorPress?.(author?.screen_name || "")}
          activeOpacity={0.8}
        >
          <ExpoImage
            source={{ uri: author?.avatar_url || FALLBACK_AVATAR }}
            style={styles.avatar}
            contentFit="cover"
            transition={200}
          />
        </TouchableOpacity>

        {/* Author Details & Time */}
        <View style={styles.authorInfoContainer}>
          <View style={styles.nameRow}>
            <TouchableOpacity
              onPress={() => onAuthorPress?.(author?.screen_name || "")}
              activeOpacity={0.8}
              style={{ flexDirection: "row", alignItems: "center", flexShrink: 1 }}
            >
              <FlexText
                numberOfLines={1}
                style={[common.heading, { fontSize: 15, fontWeight: "700" }]}
              >
                {author?.name || "User"}
              </FlexText>
              {author?.verification?.verified && (
                <View style={{ marginLeft: 4 }}>
                  <VerifiedIcon size={14} />
                </View>
              )}
            </TouchableOpacity>

            <FlexText
              numberOfLines={1}
              style={[
                common.bodySmall,
                { color: colors.muted, marginLeft: 6, flexShrink: 1 },
              ]}
            >
              @{author?.screen_name}
            </FlexText>

            {timeAgo ? (
              <FlexText style={[common.caption, { color: colors.muted, marginLeft: 6 }]}>
                · {timeAgo}
              </FlexText>
            ) : null}
          </View>

          {/* Replying To info */}
          {post.replying_to && (
            <FlexText style={[common.caption, { color: colors.muted, marginTop: 2 }]}>
              Replying to{" "}
              <FlexText style={{ color: "#1D9BF0" }}>
                @{post.replying_to.screen_name}
              </FlexText>
            </FlexText>
          )}
        </View>
      </View>

      {/* Post Text */}
      {!!post.text && (
        <FlexText
          style={[
            common.body,
            {
              fontSize: 15,
              lineHeight: 22,
              marginTop: 10,
              color: colors.text,
            },
          ]}
        >
          {post.text}
        </FlexText>
      )}

      {/* Media with exact aspect ratio */}
      {hasPhotos && <PhotoGallery photos={photos} />}
      {hasVideos && <VideoGallery videos={videos} />}

      {/* Embedded Quote Status */}
      {post.quote && post.quote.type === "status" && (
        <View
          style={[
            styles.quoteContainer,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.03)"
                : "rgba(0,0,0,0.02)",
              borderColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <View style={styles.quoteHeader}>
            <ExpoImage
              source={{ uri: post.quote.author?.avatar_url || FALLBACK_AVATAR }}
              style={styles.quoteAvatar}
              contentFit="cover"
            />
            <FlexText
              numberOfLines={1}
              style={[common.heading, { fontSize: 13, fontWeight: "700", marginLeft: 6 }]}
            >
              {post.quote.author?.name}
            </FlexText>
            <FlexText
              numberOfLines={1}
              style={[common.caption, { color: colors.muted, marginLeft: 4 }]}
            >
              @{post.quote.author?.screen_name}
            </FlexText>
          </View>
          {!!post.quote.text && (
            <FlexText
              numberOfLines={3}
              style={[common.bodySmall, { color: colors.text, marginTop: 4 }]}
            >
              {post.quote.text}
            </FlexText>
          )}
        </View>
      )}

      {/* External Card Link Preview */}
      {post.card && (
        <TouchableOpacity
          onPress={() => handleOpenLink(post.card?.url)}
          activeOpacity={0.85}
          style={[
            styles.cardLinkWrapper,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.04)"
                : "rgba(0,0,0,0.03)",
              borderColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          {post.card.image?.url && (
            <ExpoImage
              source={{ uri: post.card.image.url }}
              style={styles.cardLinkImage}
              contentFit="cover"
            />
          )}
          <View style={{ padding: 10 }}>
            {post.card.domain && (
              <FlexText style={[common.caption, { color: colors.muted }]}>
                {post.card.domain}
              </FlexText>
            )}
            {post.card.title && (
              <FlexText
                numberOfLines={1}
                style={[common.heading, { fontSize: 14, marginTop: 2 }]}
              >
                {post.card.title}
              </FlexText>
            )}
            {post.card.description && (
              <FlexText
                numberOfLines={2}
                style={[common.caption, { color: colors.muted, marginTop: 2 }]}
              >
                {post.card.description}
              </FlexText>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Action Footer (Replies, Reposts, Likes, Views, Share) */}
      <View style={styles.actionRow}>
        <View style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={17} color={colors.muted} />
          <FlexText style={[common.caption, { color: colors.muted, marginLeft: 6 }]}>
            {formatNumber(post.replies)}
          </FlexText>
        </View>

        <View style={styles.actionItem}>
          <Ionicons name="repeat-outline" size={19} color={colors.muted} />
          <FlexText style={[common.caption, { color: colors.muted, marginLeft: 6 }]}>
            {formatNumber(post.reposts)}
          </FlexText>
        </View>

        <View style={styles.actionItem}>
          <Ionicons name="heart-outline" size={18} color={colors.muted} />
          <FlexText style={[common.caption, { color: colors.muted, marginLeft: 6 }]}>
            {formatNumber(post.likes)}
          </FlexText>
        </View>

        {post.views !== undefined && post.views !== null && (
          <View style={styles.actionItem}>
            <Ionicons name="bar-chart-outline" size={17} color={colors.muted} />
            <FlexText style={[common.caption, { color: colors.muted, marginLeft: 6 }]}>
              {formatNumber(post.views)}
            </FlexText>
          </View>
        )}

        <TouchableOpacity
          onPress={() => handleOpenLink(post.url)}
          style={styles.actionItem}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="share-outline" size={17} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// ============================================================================
// Media Sub-components (Exact Aspect Ratio Rendering)
// ============================================================================

const PhotoGallery = memo(({ photos }: { photos: FxPhoto[] }) => {
  if (photos.length === 0) return null;

  // Single Photo: Respect exact natural aspect ratio from API response
  if (photos.length === 1) {
    const photo = photos[0];
    const width = photo.width || 16;
    const height = photo.height || 9;
    // Clamp aspect ratio between 0.6 and 2.2 to prevent awkward extreme heights
    const ratio = Math.max(0.6, Math.min(2.2, width / height));

    return (
      <View style={styles.mediaContainer}>
        <ExpoImage
          source={{ uri: photo.url }}
          style={[styles.singleImage, { aspectRatio: ratio }]}
          contentFit="cover"
          transition={250}
        />
      </View>
    );
  }

  // 2 Photos: Side by side
  if (photos.length === 2) {
    return (
      <View style={[styles.mediaContainer, styles.multiPhotoRow]}>
        <ExpoImage
          source={{ uri: photos[0].url }}
          style={[styles.gridPhoto, { height: 180, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }]}
          contentFit="cover"
        />
        <ExpoImage
          source={{ uri: photos[1].url }}
          style={[styles.gridPhoto, { height: 180, borderTopRightRadius: 14, borderBottomRightRadius: 14 }]}
          contentFit="cover"
        />
      </View>
    );
  }

  // 3 Photos: 1 on Left, 2 on Right
  if (photos.length === 3) {
    return (
      <View style={[styles.mediaContainer, styles.multiPhotoRow, { height: 220 }]}>
        <ExpoImage
          source={{ uri: photos[0].url }}
          style={{ flex: 1.2, height: "100%", borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }}
          contentFit="cover"
        />
        <View style={{ flex: 1, height: "100%", gap: 4 }}>
          <ExpoImage
            source={{ uri: photos[1].url }}
            style={{ flex: 1, width: "100%", borderTopRightRadius: 14 }}
            contentFit="cover"
          />
          <ExpoImage
            source={{ uri: photos[2].url }}
            style={{ flex: 1, width: "100%", borderBottomRightRadius: 14 }}
            contentFit="cover"
          />
        </View>
      </View>
    );
  }

  // 4 Photos: 2x2 Grid
  return (
    <View style={[styles.mediaContainer, { gap: 4 }]}>
      <View style={styles.multiPhotoRow}>
        <ExpoImage
          source={{ uri: photos[0].url }}
          style={[styles.gridPhoto, { height: 130, borderTopLeftRadius: 14 }]}
          contentFit="cover"
        />
        <ExpoImage
          source={{ uri: photos[1].url }}
          style={[styles.gridPhoto, { height: 130, borderTopRightRadius: 14 }]}
          contentFit="cover"
        />
      </View>
      <View style={styles.multiPhotoRow}>
        <ExpoImage
          source={{ uri: photos[2].url }}
          style={[styles.gridPhoto, { height: 130, borderBottomLeftRadius: 14 }]}
          contentFit="cover"
        />
        <ExpoImage
          source={{ uri: photos[3].url }}
          style={[styles.gridPhoto, { height: 130, borderBottomRightRadius: 14 }]}
          contentFit="cover"
        />
      </View>
    </View>
  );
});

const VideoGallery = memo(({ videos }: { videos: FxVideo[] }) => {
  if (videos.length === 0) return null;
  const video = videos[0];

  const width = video.width || 16;
  const height = video.height || 9;
  const ratio = Math.max(0.6, Math.min(2.2, width / height));
  const thumbUrl = video.thumbnail_url || video.url;

  return (
    <View style={styles.mediaContainer}>
      <View style={[styles.videoWrapper, { aspectRatio: ratio }]}>
        <ExpoImage
          source={{ uri: thumbUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {/* Play Icon Overlay */}
        <View style={styles.playButton}>
          <Ionicons name="play" size={24} color="#FFF" style={{ marginLeft: 2 }} />
        </View>

        {/* Video Duration Badge */}
        {video.duration ? (
          <View style={styles.durationBadge}>
            <FlexText style={styles.durationText}>
              {formatVideoDuration(video.duration)}
            </FlexText>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  repostHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginLeft: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  authorInfoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mediaContainer: {
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  singleImage: {
    width: "100%",
    borderRadius: 14,
  },
  multiPhotoRow: {
    flexDirection: "row",
    gap: 4,
  },
  gridPhoto: {
    flex: 1,
  },
  videoWrapper: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
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
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  quoteContainer: {
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  quoteHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  quoteAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  cardLinkWrapper: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  cardLinkImage: {
    width: "100%",
    height: 140,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150,150,150,0.15)",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
