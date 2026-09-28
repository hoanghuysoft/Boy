import { FlexText } from "@/components/FlexText";
import { usePagerHeaderContext } from "@/components/pager/PagerHeaderContext";
import { useThemeContext } from "@/context/ThemeContext";
import VerifiedIcon from "@/icons/verified";
import type { FxTwitterUser } from "@/services/fxtwitter/types";
import { createCommonStyles } from "@/styles/common";
import { formatCompactNumber } from "@/utils/formatNumber";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SquircleView } from "expo-squircle-view";
import { Button } from "heroui-native/button";
import { ImageViewer } from "panelui-native";
import React, { memo, useState } from "react";
import { Linking, StyleSheet, TouchableOpacity, View } from "react-native";
import Reanimated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const COVER_HEIGHT = 260;
const FALLBACK_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";

export interface XProfileHeaderV3Props {
  user?: FxTwitterUser | null;
  postCount: number;
  mediaCount: number;
  isSavedCustom: boolean;
  onToggleSave: () => void;
}

export const XProfileHeaderV3 = memo(function XProfileHeaderV3({
  user,
  postCount,
  mediaCount,
  isSavedCustom,
  onToggleSave,
}: XProfileHeaderV3Props) {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const [showFullBio, setShowFullBio] = useState(false);

  const headerCtx = usePagerHeaderContext();
  const topInset = insets.top;
  const animatedContentStyle = useAnimatedStyle(() => {
    if (!headerCtx) return { opacity: 1 };
    const { scrollY, headerHeight } = headerCtx;
    const collapseDistance = Math.max(headerHeight - (topInset + 56), 50);
    const opacity = interpolate(
      scrollY.get(),
      [0, collapseDistance * 0.6],
      [1, 0],
      "clamp"
    );
    return {
      opacity,
      transform: [
        {
          translateY: interpolate(
            scrollY.get(),
            [0, collapseDistance],
            [0, -16],
            "clamp"
          ),
        },
      ],
    };
  });

  const transparentColor = colors.surface + "00";
  const midColor1 = colors.surface + "59";
  const midColor2 = colors.surface + "CC";
  const solidColor = colors.surface;

  const avatarUri = user?.avatar_url
    ? user.avatar_url.replace(/_normal\.(jpg|jpeg|png|gif)$/i, "_400x400.$1")
    : FALLBACK_AVATAR;

  const bannerUri = user?.banner_url
    ? user.banner_url.replace(/\/([0-9]+x[0-9]+)$/, "/1500x500")
    : DEFAULT_COVER;

  return (
    <Reanimated.View pointerEvents="box-none" style={[styles.headerContainer, animatedContentStyle]}>
      {/* Absolute Cover Background with Fade Overlay */}
      <View pointerEvents="none" style={styles.absoluteCoverContainer}>
        <ExpoImage
          source={{ uri: bannerUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <LinearGradient
          colors={[transparentColor, midColor1, midColor2, solidColor]}
          locations={[0, 0.4, 0.75, 1]}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      </View>

      {/* Top space pushing avatar below header controls */}
      <View pointerEvents="none" style={{ height: topInset + 110 }} />

      {/* Avatar & Action Buttons Row */}
      <View pointerEvents="box-none" style={styles.avatarRow}>
        <ImageViewer>
          <ImageViewer.Trigger
            source={{ uri: avatarUri }}
            alt="Avatar"
            radius={999}
            className="h-18 w-18"
          />
        </ImageViewer>

        <View pointerEvents="box-none" className="flex-row gap-2">
          {user?.screen_name && (
            <Button
              variant="secondary"
              isIconOnly
              onPress={() =>
                Linking.openURL(`https://x.com/${user.screen_name}`).catch(() => {})
              }
            >
              <Ionicons name="logo-twitter" size={20} color="#1d9bf0" />
            </Button>
          )}

          <SquircleView
            borderRadius={999}
            cornerSmoothing={100}
            preserveSmoothing
            style={[
              styles.editButton,
              {
                backgroundColor: isSavedCustom
                  ? colors.surfaceContainerHighest
                  : colors.primary,
              },
            ]}
          >
            <TouchableOpacity onPress={onToggleSave}>
              <FlexText
                style={{
                  color: isSavedCustom ? colors.onSurface : colors.onPrimary,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                {isSavedCustom ? "Following" : "+ Follow"}
              </FlexText>
            </TouchableOpacity>
          </SquircleView>
        </View>
      </View>

      {/* Name and Verified Badge */}
      <View pointerEvents="none" className="flex-row items-center gap-2 mb-1">
        <FlexText style={[common.headline, { fontWeight: "bold" }]}>
          {user?.name || user?.screen_name}
        </FlexText>
        {user?.verification?.verified && <VerifiedIcon size={24} />}
      </View>

      {/* Handle */}
      {!!user?.screen_name && (
        <View pointerEvents="none">
          <FlexText style={[common.body, { color: colors.muted, marginBottom: 8 }]}>
            @{user.screen_name}
          </FlexText>
        </View>
      )}

      {/* Bio */}
      {!!user?.description && (
        <View style={{ marginBottom: 8 }}>
          <FlexText numberOfLines={showFullBio ? undefined : 2} style={[common.body]}>
            {user.description}
          </FlexText>
          {(user.description.length > 70 || user.description.includes("\n")) && (
            <TouchableOpacity
              onPress={() => setShowFullBio((prev) => !prev)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ marginTop: 2, alignSelf: "flex-start" }}
            >
              <FlexText style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>
                {showFullBio ? "Show less" : "Read more"}
              </FlexText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Location / Website / Joined metadata */}
      {(!!user?.location || !!user?.website?.url || !!user?.joined) && (
        <View style={styles.metaRow}>
          {!!user?.location && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.muted} />
              <FlexText style={[common.caption, { color: colors.muted }]}>
                {user.location}
              </FlexText>
            </View>
          )}
          {!!user?.website?.url && (
            <TouchableOpacity
              onPress={() => Linking.openURL(user.website?.url || "").catch(() => {})}
              style={styles.metaItem}
            >
              <Ionicons name="link-outline" size={14} color={colors.primary} />
              <FlexText style={[common.caption, { color: colors.primary }]}>
                {user.website.display_url || user.website.url}
              </FlexText>
            </TouchableOpacity>
          )}
          {!!user?.joined && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.muted} />
              <FlexText style={[common.caption, { color: colors.muted }]}>
                {user.joined}
              </FlexText>
            </View>
          )}
        </View>
      )}

      {/* Stats Row */}
      <View pointerEvents="none" className="flex-row gap-2" style={{ marginBottom: 12 }}>
        <FlexText style={{ color: colors.text }}>
          {formatCompactNumber(user?.statuses || postCount)}{" "}
          <FlexText style={{ fontWeight: "bold", color: colors.muted, textTransform: "capitalize" }}>
            Posts
          </FlexText>
        </FlexText>
        <FlexText style={{ color: colors.text }}>
          {formatCompactNumber(mediaCount)}{" "}
          <FlexText style={{ fontWeight: "bold", color: colors.muted, textTransform: "capitalize" }}>
            Media
          </FlexText>
        </FlexText>
        <FlexText style={{ color: colors.text }}>
          {formatCompactNumber(user?.following)}{" "}
          <FlexText style={{ fontWeight: "bold", color: colors.muted, textTransform: "capitalize" }}>
            Following
          </FlexText>
        </FlexText>
        <FlexText style={{ color: colors.text }}>
          {formatCompactNumber(user?.followers)}{" "}
          <FlexText style={{ fontWeight: "bold", color: colors.muted, textTransform: "capitalize" }}>
            Followers
          </FlexText>
        </FlexText>
      </View>
    </Reanimated.View>
  );
});

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 12,
    position: "relative",
  },
  absoluteCoverContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: COVER_HEIGHT,
    overflow: "hidden",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "85%",
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  editButton: {
    paddingHorizontal: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});

