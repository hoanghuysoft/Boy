/**
 * Instagram Profile Header Component (Redesigned)
 *
 * Modern, rich Instagram profile header featuring:
 * - Ambient atmospheric cover banner with blurred avatar backdrop & gradient fade
 * - Instagram platform badge with quick navigation
 * - Avatar with active Instagram Story gradient ring & live story indicator
 * - Modern 3-column stats dashboard (Posts, Followers, Following) in glass capsules
 * - Verified badge, category pill tag, business badge & private account status
 * - Clean formatted biography & interactive external URL pill chip
 * - Action toolbar: "Open Instagram" (vibrant gradient button), "Share", and "Copy Link"
 * - Integrated story highlights tray
 * - High-fidelity shimmer skeleton matching the exact layout
 */

import { FlexText } from "@/components/FlexText";
import { FALLBACK_AVATAR_URL } from "@/components/profile/header/constants";
import { Shimmer, ShimmerGroup } from "@/components/ui/molecules/Shimmer/Shimmer";
import { useThemeContext } from "@/context/ThemeContext";
import VerifiedIcon from "@/icons/verified";
import { InstagramStoryItem, InstagramUser } from "@/services/instagram/types";
import { createCommonStyles } from "@/styles/common";
import { formatCompactNumber } from "@/utils/formatNumber";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useToast } from "heroui-native/toast";
import React, { memo, useCallback } from "react";
import {
  Linking,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { InstagramStoryBar } from "./InstagramStoryBar";
import { InstagramStoryRing } from "./InstagramStoryRing";
import { getHighestQualityImageUrl } from "./transformInstagramPost";

export interface InstagramProfileHeaderProps {
  user?: InstagramUser | any | null;
  stories?: InstagramStoryItem[];
  postCount?: number;
  isLoading?: boolean;
  onStoryPress?: (index: number) => void;
}

export const InstagramProfileHeader = memo(
  ({
    user,
    stories = [],
    postCount = 0,
    isLoading = false,
    onStoryPress,
  }: InstagramProfileHeaderProps) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { toast } = useToast();
    const isDark = theme === "dark";

    const hasStories = stories.length > 0;
    const authorAvatar = getHighestQualityImageUrl(user) || FALLBACK_AVATAR_URL;

    const authorName =
      user?.name ||
      user?.fullName ||
      user?.full_name ||
      user?.username ||
      "Instagram Profile";

    const username = user?.username || "";
    const bio = user?.biography || user?.bio || user?.description || "";
    const externalUrl =
      user?.externalUrl ||
      user?.external_url ||
      (user?.url && !user.url.includes("instagram.com") ? user.url : "");
    const category = user?.category || "";
    const isVerified = !!(user?.isVerified || user?.is_verified);
    const isPrivate = !!(user?.isPrivate || user?.is_private);
    const isBusiness = !!(user?.isBusiness || user?.is_business_account);

    const followers =
      user?.followersCount ??
      user?.follower_count ??
      user?.followers ??
      user?.edge_followed_by?.count ??
      0;

    const following =
      user?.followingCount ??
      user?.following_count ??
      user?.following ??
      user?.edge_follow?.count ??
      0;

    const totalPosts =
      user?.postsCount ??
      user?.media_count ??
      user?.edge_owner_to_timeline_media?.count ??
      postCount;

    const profileUrl = username
      ? `https://www.instagram.com/${username}`
      : "https://www.instagram.com";

    // ─── Actions Handlers ──────────────────────────────────────────
    const handleOpenUrl = useCallback(
      (url?: string) => {
        if (!url) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        const cleanUrl = url.startsWith("http") ? url : `https://${url}`;
        Linking.openURL(cleanUrl).catch(() => {});
      },
      []
    );

    const handleOpenInstagram = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (username) {
        const appUrl = `instagram://user?username=${username}`;
        try {
          const supported = await Linking.canOpenURL(appUrl);
          if (supported) {
            await Linking.openURL(appUrl);
            return;
          }
        } catch {}
      }
      Linking.openURL(profileUrl).catch(() => {});
    }, [username, profileUrl]);

    const handleShareProfile = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      try {
        await Share.share({
          message: username
            ? `Check out @${username} on Instagram: ${profileUrl}`
            : `Check out this profile on Instagram: ${profileUrl}`,
          url: profileUrl,
        });
      } catch {}
    }, [username, profileUrl]);

    const handleCopyLink = useCallback(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await Clipboard.setStringAsync(profileUrl);
      toast.show({
        label: "Link Copied",
        description: `@${username || "profile"}'s Instagram link copied to clipboard.`,
        variant: "success",
      });
    }, [profileUrl, username, toast]);

    // ─── Skeleton Loading State ────────────────────────────────────
    if (isLoading) {
      return (
        <ShimmerGroup isLoading>
          <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* Banner Shimmer */}
            <View style={styles.bannerContainer}>
              <Shimmer style={StyleSheet.absoluteFill} />
            </View>

            <View style={styles.contentPadding}>
              {/* Avatar + Stats Shimmer */}
              <View style={styles.topSection}>
                <View style={styles.avatarWrapper}>
                  <Shimmer style={styles.avatarShimmer} />
                </View>
                <View style={styles.statsRow}>
                  <Shimmer style={styles.statCardShimmer} />
                  <Shimmer style={styles.statCardShimmer} />
                  <Shimmer style={styles.statCardShimmer} />
                </View>
              </View>

              {/* Bio & Details Shimmer */}
              <View style={{ marginTop: 16, gap: 8 }}>
                <Shimmer style={{ width: 180, height: 20, borderRadius: 6 }} />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                  <Shimmer style={{ width: 90, height: 14, borderRadius: 4 }} />
                  <Shimmer style={{ width: 110, height: 14, borderRadius: 4 }} />
                </View>
                <Shimmer style={{ width: "95%", height: 14, borderRadius: 4, marginTop: 4 }} />
                <Shimmer style={{ width: "75%", height: 14, borderRadius: 4 }} />
                <Shimmer style={{ width: 140, height: 28, borderRadius: 14, marginTop: 6 }} />
              </View>

              {/* Action Buttons Shimmer */}
              <View style={styles.actionRow}>
                <Shimmer style={{ flex: 1, height: 40, borderRadius: 12 }} />
                <Shimmer style={{ width: 85, height: 40, borderRadius: 12 }} />
                <Shimmer style={{ width: 40, height: 40, borderRadius: 12 }} />
              </View>
            </View>
          </View>
        </ShimmerGroup>
      );
    }

    // ─── Render Profile Header ─────────────────────────────────────
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Atmospheric Blurred Cover Banner */}
        <View style={styles.bannerContainer}>
          <ExpoImage
            source={{ uri: authorAvatar }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            blurRadius={32}
            transition={300}
          />
          {/* Gradient Overlay melting into the surface */}
          <LinearGradient
            colors={
              isDark
                ? [
                    "rgba(131, 58, 180, 0.45)",
                    "rgba(225, 48, 108, 0.28)",
                    "rgba(253, 29, 29, 0.12)",
                    colors.surface,
                  ]
                : [
                    "rgba(131, 58, 180, 0.22)",
                    "rgba(225, 48, 108, 0.15)",
                    "rgba(253, 29, 29, 0.08)",
                    colors.surface,
                  ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Instagram Platform Badge on top right */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenInstagram}
            style={[
              styles.platformBadge,
              {
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.55)"
                  : "rgba(255, 255, 255, 0.8)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.18)"
                  : "rgba(0, 0, 0, 0.08)",
              },
            ]}
          >
            <Ionicons name="logo-instagram" size={13} color="#E1306C" />
            <FlexText
              style={[
                styles.platformBadgeText,
                { color: isDark ? "#FFFFFF" : "#1A1A1A" },
              ]}
              numberOfLines={1}
            >
              {username ? `@${username}` : "Instagram"}
            </FlexText>
            <Ionicons
              name="open-outline"
              size={11}
              color={isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)"}
            />
          </TouchableOpacity>
        </View>

        {/* Content Section (overlaps the banner) */}
        <View style={styles.contentPadding}>
          {/* Avatar + Stats Dashboard */}
          <View style={styles.topSection}>
            {/* Avatar with Story Gradient Ring */}
            <View style={styles.avatarWrapper}>
              <InstagramStoryRing
                hasStory={hasStories}
                size={82}
                borderWidth={2.6}
                gap={3}
                onPress={
                  hasStories && onStoryPress ? () => onStoryPress(0) : undefined
                }
              >
                <ExpoImage
                  source={{ uri: authorAvatar }}
                  style={[
                    styles.avatar,
                    {
                      borderColor: colors.surface,
                      backgroundColor: colors.card,
                    },
                  ]}
                  contentFit="cover"
                  transition={200}
                />
              </InstagramStoryRing>

              {/* Story indicator pill badge on avatar */}
              {hasStories && (
                <View style={styles.storyPillBadgeWrapper}>
                  <LinearGradient
                    colors={["#F58529", "#DD2A7B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.storyPillBadge}
                  >
                    <Ionicons name="play" size={8} color="#FFFFFF" />
                    <FlexText style={styles.storyPillText}>STORY</FlexText>
                  </LinearGradient>
                </View>
              )}
            </View>

            {/* 3-Column Stats Dashboard */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                ]}
              >
                <FlexText style={[styles.statValue, { color: colors.text }]}>
                  {formatCompactNumber(totalPosts)}
                </FlexText>
                <FlexText style={[styles.statLabel, { color: colors.muted }]}>
                  Posts
                </FlexText>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                ]}
              >
                <FlexText style={[styles.statValue, { color: colors.text }]}>
                  {formatCompactNumber(followers)}
                </FlexText>
                <FlexText style={[styles.statLabel, { color: colors.muted }]}>
                  Followers
                </FlexText>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                  },
                ]}
              >
                <FlexText style={[styles.statValue, { color: colors.text }]}>
                  {formatCompactNumber(following)}
                </FlexText>
                <FlexText style={[styles.statLabel, { color: colors.muted }]}>
                  Following
                </FlexText>
              </View>
            </View>
          </View>

          {/* User Bio & Meta Section */}
          <View style={styles.bioSection}>
            {/* Full Name & Verified Badge */}
            <View style={styles.nameRow}>
              <FlexText style={[styles.fullName, { color: colors.text }]}>
                {authorName}
              </FlexText>
              {isVerified && (
                <View style={styles.verifiedIconWrapper}>
                  <VerifiedIcon size={16} backgroundColor="#0095F6" color="#FFF" />
                </View>
              )}
              {isPrivate && (
                <View
                  style={[
                    styles.privateBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                    },
                  ]}
                >
                  <Ionicons name="lock-closed" size={11} color={colors.muted} />
                  <FlexText style={[styles.privateBadgeText, { color: colors.muted }]}>
                    Private
                  </FlexText>
                </View>
              )}
            </View>

            {/* Handle & Category Tag Row */}
            <View style={styles.metaRow}>
              {!!username && (
                <FlexText style={[styles.usernameText, { color: colors.muted }]}>
                  @{username}
                </FlexText>
              )}

              {!!category && (
                <View
                  style={[
                    styles.categoryTag,
                    {
                      backgroundColor: isDark
                        ? "rgba(225, 48, 108, 0.12)"
                        : "rgba(225, 48, 108, 0.08)",
                      borderColor: isDark
                        ? "rgba(225, 48, 108, 0.25)"
                        : "rgba(225, 48, 108, 0.16)",
                    },
                  ]}
                >
                  <Ionicons name="sparkles" size={10} color="#E1306C" />
                  <FlexText style={styles.categoryTagText}>{category}</FlexText>
                </View>
              )}

              {isBusiness && (
                <View
                  style={[
                    styles.categoryTag,
                    {
                      backgroundColor: isDark
                        ? "rgba(0, 149, 246, 0.12)"
                        : "rgba(0, 149, 246, 0.08)",
                      borderColor: isDark
                        ? "rgba(0, 149, 246, 0.25)"
                        : "rgba(0, 149, 246, 0.16)",
                    },
                  ]}
                >
                  <Ionicons name="briefcase-outline" size={10} color="#0095F6" />
                  <FlexText style={[styles.categoryTagText, { color: "#0095F6" }]}>
                    Business
                  </FlexText>
                </View>
              )}
            </View>

            {/* Biography */}
            {!!bio && (
              <FlexText style={[styles.bioText, { color: colors.text }]}>
                {bio}
              </FlexText>
            )}

            {/* External URL Chip */}
            {!!externalUrl && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOpenUrl(externalUrl)}
                style={[
                  styles.linkPill,
                  {
                    backgroundColor: isDark
                      ? "rgba(0, 149, 246, 0.1)"
                      : "rgba(0, 149, 246, 0.06)",
                    borderColor: isDark
                      ? "rgba(0, 149, 246, 0.25)"
                      : "rgba(0, 149, 246, 0.15)",
                  },
                ]}
              >
                <Ionicons name="link-outline" size={13} color="#0095F6" />
                <FlexText style={styles.linkText} numberOfLines={1}>
                  {externalUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </FlexText>
                <Ionicons name="open-outline" size={11} color="#0095F6" />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionRow}>
            {/* Primary "Open Instagram" Gradient Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenInstagram}
              style={styles.primaryActionButton}
            >
              <LinearGradient
                colors={["#833AB4", "#FD1D1D", "#FCB045"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryActionGradient}
              >
                <Ionicons name="logo-instagram" size={17} color="#FFFFFF" />
                <FlexText style={styles.primaryActionText}>
                  Open Instagram
                </FlexText>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary "Share Profile" Button */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleShareProfile}
              style={[
                styles.secondaryActionButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.05)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            >
              <Ionicons
                name="share-social-outline"
                size={16}
                color={colors.text}
              />
              <FlexText
                style={[styles.secondaryActionText, { color: colors.text }]}
              >
                Share
              </FlexText>
            </TouchableOpacity>

            {/* "Copy Link" Icon Button */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleCopyLink}
              style={[
                styles.iconActionButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.08)"
                    : "rgba(0, 0, 0, 0.05)",
                  borderColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.08)",
                },
              ]}
            >
              <Ionicons name="copy-outline" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Story Tray (If user has stories) */}
        {hasStories && onStoryPress && (
          <InstagramStoryBar
            stories={stories}
            user={user}
            onStoryPress={onStoryPress}
          />
        )}
      </View>
    );
  }
);

InstagramProfileHeader.displayName = "InstagramProfileHeader";

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.15)",
  },
  bannerContainer: {
    height: 136,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  platformBadge: {
    position: "absolute",
    top: 12,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 5,
  },
  platformBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  contentPadding: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: -42,
  },
  avatarWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2.5,
  },
  avatarShimmer: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  storyPillBadgeWrapper: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    shadowColor: "#E1306C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  storyPillBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  storyPillText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    marginLeft: 14,
    gap: 6,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statCardShimmer: {
    flex: 1,
    height: 52,
    borderRadius: 14,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "capitalize",
  },
  bioSection: {
    marginTop: 14,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  fullName: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  verifiedIconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  privateBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
    marginLeft: 2,
  },
  privateBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 1,
  },
  usernameText: {
    fontSize: 13.5,
    fontWeight: "600",
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  categoryTagText: {
    color: "#E1306C",
    fontSize: 11,
    fontWeight: "700",
  },
  bioText: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  linkPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
    maxWidth: "95%",
  },
  linkText: {
    color: "#0095F6",
    fontSize: 12.5,
    fontWeight: "600",
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  primaryActionButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#E1306C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryActionGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
  secondaryActionButton: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  iconActionButton: {
    height: 38,
    width: 38,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
});
