/**
 * Instagram Story Bar (Story Tray) - Redesigned
 *
 * Horizontal tray displaying user stories with:
 * - Section header with story count badge
 * - Instagram story ring with thumbnail previews
 * - Video badge indicator for video stories
 * - Haptic feedback on tap
 */

import { FlexText } from "@/components/FlexText";
import { FALLBACK_AVATAR_URL } from "@/components/profile/header/constants";
import { useThemeContext } from "@/context/ThemeContext";
import { InstagramStoryItem, InstagramUser } from "@/services/instagram/types";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { InstagramStoryRing } from "./InstagramStoryRing";
import { getHighestQualityImageUrl } from "./transformInstagramPost";
import { formatStoryTime } from "./utils";

interface InstagramStoryBarProps {
  stories: InstagramStoryItem[];
  user?: InstagramUser | null;
  onStoryPress: (index: number) => void;
}

export const InstagramStoryBar: React.FC<InstagramStoryBarProps> = memo(
  ({ stories = [], user, onStoryPress }) => {
    const { colors, theme } = useThemeContext();
    const isDark = theme === "dark";

    const handlePress = useCallback(
      (idx: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onStoryPress(idx);
      },
      [onStoryPress]
    );

    if (stories.length === 0) return null;

    const authorAvatar = getHighestQualityImageUrl(user) || FALLBACK_AVATAR_URL;

    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Tray Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            <LinearGradient
              colors={["#F58529", "#DD2A7B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientDot}
            />
            <FlexText style={[styles.headerTitle, { color: colors.text }]}>
              Stories & Highlights
            </FlexText>
          </View>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.05)",
              },
            ]}
          >
            <FlexText style={[styles.countBadgeText, { color: colors.muted }]}>
              {stories.length}
            </FlexText>
          </View>
        </View>

        {/* Stories Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {stories.map((story, idx) => {
            const thumb = getHighestQualityImageUrl(story) || authorAvatar;
            const isVideo =
              story.mediaType === "video" ||
              story.mediaType === 2 ||
              !!story.videoUrl;
            const timeAgo = formatStoryTime(story.takenAt);

            return (
              <TouchableOpacity
                key={story.id || idx}
                activeOpacity={0.8}
                onPress={() => handlePress(idx)}
                style={styles.storyItem}
              >
                <View style={styles.ringWrapper}>
                  <InstagramStoryRing
                    hasStory={true}
                    size={62}
                    borderWidth={2.2}
                    gap={2.5}
                  >
                    <ExpoImage
                      source={{ uri: thumb }}
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.surface,
                        },
                      ]}
                      contentFit="cover"
                      transition={150}
                    />
                  </InstagramStoryRing>

                  {/* Video badge if media is video */}
                  {isVideo && (
                    <View style={styles.videoBadge}>
                      <Ionicons name="videocam" size={9} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <FlexText
                  style={[styles.storyLabel, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {timeAgo ? `${timeAgo}` : `Part ${idx + 1}`}
                </FlexText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }
);

InstagramStoryBar.displayName = "InstagramStoryBar";

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150, 150, 150, 0.12)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gradientDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: "center",
    width: 68,
  },
  ringWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
  },
  videoBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.75)",
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  storyLabel: {
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
    fontWeight: "600",
  },
});
