import { Shimmer, ShimmerGroup } from "@/components/ui/molecules/Shimmer/Shimmer";
import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COVER_HEIGHT } from "./XProfileHeaderV3";

export const XProfileSkeletonInner = ({ insets }: { insets: any }) => {
  const { colors } = useThemeContext();
  return (
    <View style={{ paddingHorizontal: 12, flex: 1, position: "relative" }}>
      <ShimmerGroup isLoading>
        {/* Cover Shimmer */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: COVER_HEIGHT }}>
          <Shimmer style={{ width: "100%", height: "100%" }} />
        </View>

        {/* Top Space pushing UI down */}
        <View style={{ height: insets.top + 110 }} />

        {/* Avatar & Actions Row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          {/* Avatar */}
          <Shimmer style={{ width: 64, height: 64, borderRadius: 32 }} />
          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Shimmer style={{ width: 44, height: 44, borderRadius: 12 }} />
            <Shimmer style={{ width: 120, height: 44, borderRadius: 22 }} />
          </View>
        </View>

        {/* Name, Username, Bio */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          <Shimmer style={{ width: 150, height: 24, borderRadius: 8 }} />
          <Shimmer style={{ width: 100, height: 16, borderRadius: 8 }} />
          <Shimmer style={{ width: "80%", height: 16, borderRadius: 8 }} />
        </View>

        {/* Counts */}
        <View style={{ flexDirection: "row", gap: 16, marginBottom: 16 }}>
          <Shimmer style={{ width: 60, height: 16, borderRadius: 6 }} />
          <Shimmer style={{ width: 60, height: 16, borderRadius: 6 }} />
          <Shimmer style={{ width: 60, height: 16, borderRadius: 6 }} />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, alignSelf: "center", backgroundColor: colors.card, padding: 4, borderRadius: 16 }}>
          <Shimmer style={{ width: 120, height: 32, borderRadius: 8 }} />
          <Shimmer style={{ width: 120, height: 32, borderRadius: 8 }} />
        </View>

        {/* Feed Shimmer Items */}
        <View style={{ gap: 20, marginTop: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Shimmer style={{ width: 40, height: 40, borderRadius: 20 }} />
                <View style={{ gap: 6 }}>
                  <Shimmer style={{ width: 120, height: 14, borderRadius: 4 }} />
                  <Shimmer style={{ width: 80, height: 12, borderRadius: 4 }} />
                </View>
              </View>
              <Shimmer style={{ width: "100%", height: 16, borderRadius: 4 }} />
              <Shimmer style={{ width: "85%", height: 16, borderRadius: 4 }} />
              <Shimmer style={{ width: "100%", height: 180, borderRadius: 12 }} />
            </View>
          ))}
        </View>
      </ShimmerGroup>
    </View>
  );
};

export const XProfileSkeleton: React.FC = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  return (
    <View style={common.screen}>
      <XProfileSkeletonInner insets={insets} />
    </View>
  );
};

