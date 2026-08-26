import { FlexText } from "@/components/FlexText";
import { X_COVER_URL } from "@/components/profile/header/constants";
import { useThemeContext } from "@/context/ThemeContext";
import VerifiedIcon from "@/icons/verified";
import { FxTwitterUser } from "@/services/fxtwitter/types";
import { createCommonStyles } from "@/styles/common";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import React, { memo } from "react";
import {
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

export interface XProfileHeaderProps {
  user?: FxTwitterUser | null;
  postCount?: number;
  isLoading?: boolean;
}

function formatStat(num?: number | null): string {
  if (num === undefined || num === null) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

export const XProfileHeader = memo(({ user, postCount }: XProfileHeaderProps) => {
  const { colors, typography, theme } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const isDark = theme === "dark";

  const handleOpenUrl = (url?: string) => {
    if (url) {
      Linking.openURL(url).catch(() => { });
    }
  };

  const bannerUrl = user?.banner_url
    ? user.banner_url.replace(/\/([0-9]+x[0-9]+)$/, "/1500x500")
    : X_COVER_URL;
  const avatarUrl = user?.avatar_url
    ? user.avatar_url.replace(/_normal\.(jpg|jpeg|png|gif)$/i, "_400x400.$1")
    : FALLBACK_AVATAR;

  return (
    <View style={styles.container}>
      {/* Cover Banner */}
      <View style={styles.bannerWrapper}>
        <ExpoImage
          source={{ uri: bannerUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.bannerOverlay} />
      </View>

      {/* Profile Details Container */}
      <View style={[styles.detailsContainer, { backgroundColor: colors.surface }]}>
        {/* Avatar positioned overlapping the banner */}
        <View style={styles.avatarRow}>
          <View
            style={[
              styles.avatarBorder,
              {
                backgroundColor: colors.surface,
                borderColor: colors.surface,
              },
            ]}
          >
            <ExpoImage
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          </View>
        </View>

        {/* User Names */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <FlexText style={[common.heading, { fontSize: 22, fontWeight: "800" }]}>
              {user?.name || "X Profile"}
            </FlexText>
            {user?.verification?.verified && (
              <View style={{ marginLeft: 6 }}>
                <VerifiedIcon size={18} />
              </View>
            )}
          </View>

          <FlexText style={[common.body, { color: colors.muted, marginTop: 2 }]}>
            @{user?.screen_name || "user"}
          </FlexText>

          {/* Bio / Description */}
          {!!user?.description && (
            <FlexText style={[common.body, { marginTop: 10, lineHeight: 21, color: colors.text }]}>
              {user.description}
            </FlexText>
          )}

          {/* Metadata Row (Location, Website, Joined) */}
          <View style={styles.metadataRow}>
            {user?.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={15} color={colors.muted} />
                <FlexText style={[common.caption, { color: colors.muted, marginLeft: 4 }]}>
                  {user.location}
                </FlexText>
              </View>
            ) : null}

            {user?.website?.url || user?.url ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(user?.website?.url || user?.url)}
                style={styles.metaItem}
                activeOpacity={0.7}
              >
                <Ionicons name="link-outline" size={15} color="#1D9BF0" />
                <FlexText
                  numberOfLines={1}
                  style={[common.caption, { color: "#1D9BF0", marginLeft: 4, maxWidth: 160 }]}
                >
                  {user?.website?.display_url || user?.url}
                </FlexText>
              </TouchableOpacity>
            ) : null}

            {user?.joined ? (
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={15} color={colors.muted} />
                <FlexText style={[common.caption, { color: colors.muted, marginLeft: 4 }]}>
                  Joined {user.joined}
                </FlexText>
              </View>
            ) : null}

            {user?.about_account?.based_in ? (
              <View style={styles.metaItem}>
                <Ionicons name="globe-outline" size={15} color={colors.muted} />
                <FlexText style={[common.caption, { color: colors.muted, marginLeft: 4 }]}>
                  Based in {user.about_account.based_in}
                </FlexText>
              </View>
            ) : null}
          </View>

          {/* Stats Row (Following, Followers, Posts) */}
          <View
            style={[
              styles.statsRow,
              {
                borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <View style={styles.statItem}>
              <FlexText style={[common.heading, { fontSize: 16, fontWeight: "800" }]}>
                {formatStat(user?.following)}
              </FlexText>
              <FlexText style={[common.caption, { color: colors.muted, marginLeft: 4 }]}>
                Following
              </FlexText>
            </View>

            <View style={styles.statItem}>
              <FlexText style={[common.heading, { fontSize: 16, fontWeight: "800" }]}>
                {formatStat(user?.followers)}
              </FlexText>
              <FlexText style={[common.caption, { color: colors.muted, marginLeft: 4 }]}>
                Followers
              </FlexText>
            </View>

            <View style={styles.statItem}>
              <FlexText style={[common.heading, { fontSize: 16, fontWeight: "800" }]}>
                {formatStat(user?.statuses || postCount)}
              </FlexText>
              <FlexText style={[common.caption, { color: colors.muted, marginLeft: 4 }]}>
                Posts
              </FlexText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 8,
  },
  bannerWrapper: {
    width: "100%",
    height: 145,
    backgroundColor: "#15202B",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  detailsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: -40,
    marginBottom: 8,
  },
  avatarBorder: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  infoSection: {
    marginTop: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metadataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    alignItems: "center",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "baseline",
  },
});
