/**
 * Threads Profile Header Component
 *
 * Modern, rich Threads profile header reusing the aesthetic of InstagramProfileHeader:
 * - Ambient atmospheric cover banner with blurred avatar backdrop & gradient fade
 * - Threads platform badge with quick navigation
 * - Avatar with stylish border
 * - Modern 3-column stats dashboard (Threads, Followers, Following) in glass capsules
 * - Verified badge, category pill tag, private account status
 * - Clean formatted biography & interactive external URL pill chip
 * - Action toolbar: "Open Threads" (dark luxury button), "Share", and "Copy Link"
 * - Tab selector tray ('Threads' | 'Replies' | 'Media' | 'Reposts')
 * - High-fidelity shimmer skeleton matching the exact layout
 */

import { FlexText } from "@/components/FlexText";
import { FALLBACK_AVATAR_URL } from "@/components/profile/header/constants";
import { Shimmer, ShimmerGroup } from "@/components/ui/molecules/Shimmer/Shimmer";
import { useThemeContext } from "@/context/ThemeContext";
import VerifiedIcon from "@/icons/verified";
import { ThreadsPostType, ThreadsUser } from "@/services/threads/types";
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
import { getHighestQualityImageUrl } from "./transformThreadsPost";

export interface ThreadsProfileHeaderProps {
  user?: ThreadsUser | any | null;
  postCount?: number;
  isLoading?: boolean;
  selectedTab?: ThreadsPostType;
  onTabChange?: (tab: ThreadsPostType) => void;
}

const TABS: { key: ThreadsPostType; label: string }[] = [
  { key: 'Threads', label: 'Threads' },
  { key: 'Replies', label: 'Replies' },
  { key: 'Media', label: 'Media' },
  { key: 'Reposts', label: 'Reposts' },
];

export const ThreadsProfileHeader = memo(
  ({
    user,
    postCount = 0,
    isLoading = false,
    selectedTab = 'Threads',
    onTabChange,
  }: ThreadsProfileHeaderProps) => {
    const { colors, typography, theme } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const { toast } = useToast();
    const isDark = theme === "dark";

    const authorAvatar = getHighestQualityImageUrl(user) || FALLBACK_AVATAR_URL;

    const authorName =
      user?.name ||
      user?.fullName ||
      user?.full_name ||
      user?.username ||
      "Threads Profile";

    const username = user?.username || "";
    const bio = user?.biography || user?.bio || user?.description || "";
    const externalUrl =
      user?.externalUrl ||
      user?.external_url ||
      (user?.bioLinks && user.bioLinks[0]?.url) ||
      (user?.url && !user.url.includes("threads.net") ? user.url : "");
    const isVerified = !!(user?.isVerified || user?.is_verified);
    const isPrivate = !!(user?.isPrivate || user?.is_private);

    const followers =
      user?.followersCount ??
      user?.follower_count ??
      user?.followers ??
      user?.followerCount ??
      0;

    const following =
      user?.followingCount ??
      user?.following_count ??
      user?.following ??
      0;

    const totalPosts =
      user?.postsCount ??
      user?.media_count ??
      postCount;

    const profileUrl = username
      ? `https://www.threads.net/@${username}`
      : "https://www.threads.net";

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

    const handleOpenThreads = useCallback(async () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (username) {
        const appUrl = `threads://user?username=${username}`;
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
            ? `Check out @${username} on Threads: ${profileUrl}`
            : `Check out this profile on Threads: ${profileUrl}`,
          url: profileUrl,
        });
      } catch {}
    }, [username, profileUrl]);

    const handleCopyLink = useCallback(async () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await Clipboard.setStringAsync(profileUrl);
      toast.show({
        label: "Link Copied",
        description: `@${username || "profile"}'s Threads link copied to clipboard.`,
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
                    "rgba(30, 30, 30, 0.7)",
                    "rgba(20, 20, 20, 0.5)",
                    "rgba(10, 10, 10, 0.2)",
                    colors.surface,
                  ]
                : [
                    "rgba(0, 0, 0, 0.18)",
                    "rgba(0, 0, 0, 0.10)",
                    "rgba(0, 0, 0, 0.04)",
                    colors.surface,
                  ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Threads Platform Badge on top right */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleOpenThreads}
            style={[
              styles.platformBadge,
              {
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.65)"
                  : "rgba(255, 255, 255, 0.85)",
                borderColor: isDark
                  ? "rgba(255, 255, 255, 0.18)"
                  : "rgba(0, 0, 0, 0.08)",
              },
            ]}
          >
            <Ionicons name="at" size={14} color={isDark ? "#FFFFFF" : "#000000"} />
            <FlexText
              style={[
                styles.platformBadgeText,
                { color: isDark ? "#FFFFFF" : "#1A1A1A" },
              ]}
              numberOfLines={1}
            >
              {username ? `@${username}` : "Threads"}
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
            {/* Avatar with Circular Border */}
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatarRing,
                  {
                    borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)",
                    backgroundColor: colors.surface,
                  },
                ]}
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
              </View>
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
                  Threads
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
                  <VerifiedIcon size={16} backgroundColor="#000000" color="#FFF" />
                </View>
              )}
              {isPrivate && (
                <View
                  style={[
                    styles.privateBadge,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.06)",
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed"
                    size={11}
                    color={colors.muted}
                  />
                  <FlexText style={[styles.privateBadgeText, { color: colors.muted }]}>
                    Private
                  </FlexText>
                </View>
              )}
            </View>

            {/* Username Handle tag */}
            {!!username && (
              <FlexText style={[styles.handleText, { color: colors.muted }]}>
                @{username}
              </FlexText>
            )}

            {/* Biography */}
            {!!bio && (
              <FlexText style={[styles.bioText, { color: colors.text }]}>
                {bio}
              </FlexText>
            )}

            {/* External URL Link Chip */}
            {!!externalUrl && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleOpenUrl(externalUrl)}
                style={[
                  styles.linkChip,
                  {
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.06)"
                      : "rgba(0, 0, 0, 0.04)",
                    borderColor: isDark
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.08)",
                  },
                ]}
              >
                <Ionicons name="link" size={13} color={colors.primary} />
                <FlexText
                  style={[styles.linkChipText, { color: colors.primary }]}
                  numberOfLines={1}
                >
                  {externalUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </FlexText>
                <Ionicons name="open-outline" size={11} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Action Buttons Toolbar */}
          <View style={styles.actionRow}>
            {/* Primary "Open Threads" Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleOpenThreads}
              style={styles.primaryActionButtonWrapper}
            >
              <View
                style={[
                  styles.primaryActionButton,
                  {
                    backgroundColor: isDark ? "#FFFFFF" : "#000000",
                  },
                ]}
              >
                <Ionicons
                  name="at"
                  size={15}
                  color={isDark ? "#000000" : "#FFFFFF"}
                />
                <FlexText
                  style={[
                    styles.primaryActionText,
                    { color: isDark ? "#000000" : "#FFFFFF" },
                  ]}
                >
                  Open Threads
                </FlexText>
              </View>
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
              <Ionicons name="share-outline" size={15} color={colors.text} />
              <FlexText style={[styles.secondaryActionText, { color: colors.text }]}>
                Share
              </FlexText>
            </TouchableOpacity>

            {/* Tertiary "Copy Link" Icon Button */}
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
              <Ionicons name="copy-outline" size={15} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Filter Tabs Bar (Threads | Replies | Media | Reposts) */}
          <View style={styles.tabsContainer}>
            {TABS.map((tab) => {
              const isActive = selectedTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.75}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    onTabChange?.(tab.key);
                  }}
                  style={[
                    styles.tabItem,
                    isActive && {
                      borderBottomColor: colors.text,
                      borderBottomWidth: 2,
                    },
                  ]}
                >
                  <FlexText
                    style={[
                      styles.tabLabel,
                      {
                        color: isActive ? colors.text : colors.muted,
                        fontWeight: isActive ? "700" : "500",
                      },
                    ]}
                  >
                    {tab.label}
                  </FlexText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  }
);

ThreadsProfileHeader.displayName = "ThreadsProfileHeader";

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  bannerContainer: {
    width: "100%",
    height: 140,
    position: "relative",
    overflow: "hidden",
  },
  platformBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  platformBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  contentPadding: {
    paddingHorizontal: 16,
    marginTop: -42,
  },
  topSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
  },
  avatarShimmer: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statCardShimmer: {
    flex: 1,
    height: 52,
    borderRadius: 14,
  },
  statValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  bioSection: {
    marginTop: 14,
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  fullName: {
    fontSize: 18,
    fontWeight: "700",
  },
  verifiedIconWrapper: {
    marginLeft: -2,
  },
  privateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  privateBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  handleText: {
    fontSize: 13,
    fontWeight: "500",
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  linkChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  linkChipText: {
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 220,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    alignItems: "center",
  },
  primaryActionButtonWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "600",
  },
  iconActionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150, 150, 150, 0.2)",
    marginTop: 18,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 14,
  },
});
