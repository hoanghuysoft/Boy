import { FlexText } from "@/components/FlexText";
import type { VideoCard } from "@/types/shows";
import { useHomeViewModel } from "@/viewmodels/Shows/HomeViewModel";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { ChatLineBoldDuotone, FolderFavouriteBookmarkBold, RoundedMagnifierBold } from "@solar-icons/react-native";
import { BlurTargetView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { SkeletonGroup } from "heroui-native";
import React, { useCallback, useRef, useState } from "react";
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { FlatList as GestureFlatList, Pressable as GesturePressable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const MovieHubScreen = () => {
  const { colors, typography } = useThemeContext();
  const blurTargetRef = useRef<View | null>(null);
  const common = createCommonStyles(colors, typography);
  const { width } = useWindowDimensions();
  const posterHeight = 250;
  const inset = useSafeAreaInsets();
  const [headerScrollX] = useState(() => new Animated.Value(0));
  const vm = useHomeViewModel(true); // Always true, active by default now

  const renderSectionItem = useCallback(
    ({ item }: { item: VideoCard }) => (
      <GesturePressable
        onPress={() =>
          router.push({
            pathname: "/show_detail",
            params: { video_url: item.video_url },
          })
        }
        style={{ width: 200, marginRight: 12, overflow: "hidden", position: "relative" }}
      >
        <View style={{ width: 200, borderRadius: 16, overflow: "hidden", position: "relative" }}>
          <ExpoImage
            source={{ uri: item.thumb_url }}
            style={{
              width: 200,
              aspectRatio: 16 / 9
            }}
            contentFit="cover"
          />
          <View
            style={{
              zIndex: 2,
              position: "absolute",
              bottom: 8,
              right: 12,
              backgroundColor: "rgba(0,0,0,0.5)",
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <FlexText style={{ color: "white", fontSize: 12 }}>{item.duration}</FlexText>
          </View>
        </View>
        <FlexText
          numberOfLines={2}
          ellipsizeMode="tail"
          style={[styles.textStyle, { color: "white", width: "100%", flexShrink: 1 }]}
        >
          {item.title}
        </FlexText>
        <FlexText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.textStyle, { color: "white", opacity: 0.5, width: "100%", flexShrink: 1 }]}
        >
          {item.views}
        </FlexText>
      </GesturePressable>
    ),
    [],
  );

  const sectionKeyExtractor = useCallback((item: VideoCard) => item.video_url, []);

  return (
    <View style={[common.screen, { backgroundColor: "#000000" }]}>
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[{ gap: 12, paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetchingSections || vm.isRefetchingSlider}
              onRefresh={() => {
                vm.refetchSections();
                vm.refetchSlider();
              }}
              tintColor={colors.text}
              colors={[colors.text]}
              progressBackgroundColor={colors.card}
              progressViewOffset={inset.top}
            />
          }
        >
          {/* Loading Shimmer */}
          {(vm.isLoadingSlider || vm.isLoadingSections) ? (
            <SkeletonGroup isLoading={true} variant="shimmer">
              <View style={{ gap: 24 }}>
                <SkeletonGroup.Item style={{ height: posterHeight, width: '100%' }} />
                <View style={{ gap: 16 }}>
                  <SkeletonGroup.Item style={{ height: 24, width: 120, marginLeft: 16, borderRadius: 4 }} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                    <SkeletonGroup.Item style={{ height: 110, width: 200, borderRadius: 16 }} />
                    <SkeletonGroup.Item style={{ height: 110, width: 200, borderRadius: 16 }} />
                    <SkeletonGroup.Item style={{ height: 110, width: 200, borderRadius: 16 }} />
                  </ScrollView>
                </View>
                <View style={{ gap: 16 }}>
                  <SkeletonGroup.Item style={{ height: 24, width: 150, marginLeft: 16, borderRadius: 4 }} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                    <SkeletonGroup.Item style={{ height: 110, width: 200, borderRadius: 16 }} />
                    <SkeletonGroup.Item style={{ height: 110, width: 200, borderRadius: 16 }} />
                    <SkeletonGroup.Item style={{ height: 110, width: 200, borderRadius: 16 }} />
                  </ScrollView>
                </View>
              </View>
            </SkeletonGroup>
          ) : (
            <>
              {(vm.isErrorSlider || vm.isErrorSections) && (
                <View
                  style={{
                    marginHorizontal: 16,
                    marginTop: 8,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "rgba(255, 0, 0, 0.12)",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Failed to load shows.</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                    Pull to refresh and try again.
                  </Text>
                </View>
              )}
              <Animated.ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: headerScrollX } } }],
                  { useNativeDriver: true }
                )}
                style={{ height: posterHeight }}
              >
                {vm.slider?.slider_items.map((slider, i) => {
                  // 1. We remove the 'extra' width variable entirely.

                  // 2. Parallax translation: Move the image opposite to the scroll direction
                  // 1. Set a balanced pan distance (10% of screen width)
                  const panDistance = width * 0.1;

                  const translateX = headerScrollX.interpolate({
                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                    // Use the panDistance here
                    outputRange: [panDistance, 0, -panDistance],
                    extrapolate: "clamp",
                  });

                  const scale = headerScrollX.interpolate({
                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                    // Base scale must be at least 1 + (0.1 * 2) = 1.2 to cover the edges
                    outputRange: [1.2, 1.25, 1.2],
                    extrapolate: "clamp",
                  });

                  const overlayOpacity = headerScrollX.interpolate({
                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                    outputRange: [0, 1, 0],
                    extrapolate: "clamp",
                  });

                  return (
                    <Pressable
                      key={i}
                      onPress={() =>
                        router.push({
                          pathname: "/show_detail",
                          params: { video_url: slider.video_url },
                        })
                      }
                      style={{ width, height: posterHeight, overflow: "hidden" }} // Container stays exact width
                    >
                      <Animated.View
                        style={{
                          width: "100%",  // Match parent perfectly
                          height: "100%", // Match parent perfectly
                          transform: [{ scale }, { translateX }], // Apply scale and translation here
                        }}
                      >
                        <ExpoImage
                          source={{ uri: slider.background_image }}
                          style={{ width: "100%", height: "100%" }}
                          contentFit="cover"
                        />
                      </Animated.View>
                      <Animated.View
                        pointerEvents="none"
                        style={[styles.headerOverlay, { paddingBottom: 24, opacity: overlayOpacity }]}
                      >
                        <FlexText style={{ color: "white", fontSize: 36, fontWeight: "700", textAlign: "center" }}>
                          {slider.title}
                        </FlexText>
                        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                          <FlexText style={[styles.textStyle, { color: "white" }]}>{slider.category}</FlexText>
                          <View style={{ height: 3, width: 3, backgroundColor: "white", opacity: 0.5, borderRadius: 9999 }} />
                          <ExpoImage source={require("../../assets/images/vision.png")} style={{ width: 32, height: 32, opacity: 0.8 }} contentFit="contain" />
                          <ExpoImage source={require("../../assets/images/atmos.png")} style={{ width: 32, height: 32, opacity: 0.8 }} contentFit="contain" />
                        </View>
                      </Animated.View>
                    </Pressable>
                  );
                })}
              </Animated.ScrollView>
              {vm.sections?.sections?.map((section, index) => (
                <View key={index}>
                  <Pressable
                    onPress={() => {
                      const headingLower = section.heading.toLowerCase();
                      const urlLower = section.more_url.toLowerCase();
                      let mode = "latest";
                      if (
                        headingLower.includes("popular") ||
                        headingLower.includes("most viewed") ||
                        urlLower.includes("/popular") ||
                        urlLower.includes("/most-viewed")
                      ) {
                        mode = "popular";
                      } else if (
                        headingLower.includes("least viewed") ||
                        urlLower.includes("/least-viewed")
                      ) {
                        mode = "leastViewed";
                      }
                      router.push({
                        pathname: "/show_list",
                        params: { mode },
                      });
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}
                  >
                    <FlexText style={[styles.sectionTitle, { color: "white", marginBottom: 12, flex: 1 }]}>
                      {section.heading}
                    </FlexText>
                    <View style={{ backgroundColor: "rgba(52, 52, 52, 1)", padding: 8, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 999 }}>
                      <Ionicons name='chevron-forward' size={20} color={'white'} />
                    </View>
                  </Pressable>
                  <GestureFlatList
                    horizontal
                    data={section.items}
                    keyExtractor={sectionKeyExtractor}
                    renderItem={renderSectionItem}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                  />
                </View>
              ))}
            </>
          )}
          <View style={{ height: inset.bottom + 80 }} />
        </ScrollView>
      </BlurTargetView>
      <View
        style={{
          position: "absolute",
          top: inset.top,
          left: 16,
          right: 16,
          zIndex: 1000,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ExpoImage source={require("../../assets/images/logo_head.png")} style={{ width: 35, aspectRatio: 1 }} contentFit="contain" />
          <Text style={[styles.textStyle, { color: "white", fontSize: 34, fontWeight: "700" }]}>Hub</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <TouchableOpacity
            onPress={() => router.push("/show_chat")}
            style={{
              borderRadius: 999,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ChatLineBoldDuotone size={28} color={"white"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/watchlist")}
            style={{
              borderRadius: 999,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FolderFavouriteBookmarkBold size={28} color={"white"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/search_shows")}
            style={{
              borderRadius: 999,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <RoundedMagnifierBold size={28} color={"white"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default MovieHubScreen;

const styles = StyleSheet.create({
  headerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  textStyle: {
    fontSize: 14,
  },
});
