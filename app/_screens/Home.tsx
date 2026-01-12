import { useFeed } from "@/services/feed";
import { useGalleryStore } from "@/stores/gallery";
import { Post } from "@/types/post";
import FastImage from "@d11/react-native-fast-image";
import { MenuMeatballs1Outlined, Search1Outlined } from "@lineiconshq/free-icons";
import Lineicons from "@lineiconshq/react-native-lineicons";
import { FlashList as FlashListOriginal } from "@shopify/flash-list";
import React, { useEffect, useRef, useState } from "react";
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import GalleryPreview from 'react-native-gallery-preview';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GalleryOverlay } from '../../components/gallery/GalleryOverlay';
import { PostItem } from "../../components/PostItem";
import { ShimmerEffect } from "../../components/shimmer/Shimmer";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const FlashList = FlashListOriginal as any;

import { uniqBy } from "lodash";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";

dayjs.extend(relativeTime);

import { queryClient } from "@/services/client";
import { useScrollStore } from "../../stores/scroll";

const HomeScreen = () => {
  const router = useRouter();
  const { colors, typography, theme } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"Following" | "Lucky" | "This Day">("Following");

  // Global gallery state
  const { isVisible: galleryVisible, images: galleryImages, initialIndex: galleryIndex, closeGallery } = useGalleryStore();

  const feedType = activeTab === "Following" ? "latest" : activeTab === "Lucky" ? "lucky" : "this_day";
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useFeed(feedType);

  const posts = React.useMemo(() => {
    const allPosts = data?.pages.flatMap(page => page.data) || [];
    return uniqBy(allPosts, 'id');
  }, [data?.pages]);

  const bottomNavHeight = 67;
  const bottomNavMargin = 13;
  const extraPadding = 20;
  const bottomPadding = bottomNavHeight + bottomNavMargin + insets.bottom + extraPadding;

  const followIndicatorAnim = useRef(new Animated.Value(1)).current;
  const thisDayIndicatorAnim = useRef(new Animated.Value(0)).current;
  const luckyIndicatorAnim = useRef(new Animated.Value(0)).current;

  const listRef = useRef<any>(null);

  const trigger = useScrollStore((state) => state.triggers['index']);

  useEffect(() => {
    if (trigger > 0 && listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [trigger]);

  useEffect(() => {
    // Reset all animations
    const animations = [
      Animated.spring(followIndicatorAnim, {
        toValue: activeTab === "Following" ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.spring(luckyIndicatorAnim, {
        toValue: activeTab === "Lucky" ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.spring(thisDayIndicatorAnim, {
        toValue: activeTab === "This Day" ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
    ];

    Animated.parallel(animations).start();
  }, [activeTab]);

  const onRefresh = () => {
    handleRefresh();
  };

  const handleRefresh = async () => {
    queryClient.removeQueries({ queryKey: ['feed', feedType] });
    refetch();
  };

  const renderPostSkeleton = () => {
    return (
      <View style={{ marginTop: 20 }}>
        <View style={[common.row, { gap: 10, marginBottom: 12, paddingHorizontal: 16 }]}>
          <ShimmerEffect
            isLoading={true}
            style={{ width: 30, height: 30, borderRadius: 100, backgroundColor: colors.divider }}
          />
          <ShimmerEffect
            isLoading={true}
            style={{ width: 120, height: 16, borderRadius: 8, backgroundColor: colors.divider }}
          />
        </View>
        <View style={{ gap: 8, marginBottom: 12, paddingHorizontal: 16 }}>
          <ShimmerEffect
            isLoading={true}
            style={{ width: '100%', height: 14, borderRadius: 6, backgroundColor: colors.divider }}
          />
          <ShimmerEffect
            isLoading={true}
            style={{ width: '80%', height: 14, borderRadius: 6, backgroundColor: colors.divider }}
          />
        </View>
        <ShimmerEffect
          isLoading={true}
          style={{ width: "100%", height: 200, backgroundColor: colors.divider }}
        />
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Text style={[common.heading, { color: colors.muted, textAlign: 'center' }]}>
          No posts yet
        </Text>
        <Text style={[common.label, { color: colors.muted, textAlign: 'center', marginTop: 8 }]}>
          {activeTab === "Following" ? "Follow some people to see their posts" : activeTab === "Lucky" ? "No lucky posts yet" : "No posts from this day"}
        </Text>
      </View>
    );
  };

  const renderPost = (post: Post) => {
    return <PostItem key={post.id} post={post} />;
  };

  // Scroll animation for floating header - using direction-based approach
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabVisibility = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden
  const lastScrollY = useRef(0);
  const isTabVisible = useRef(true);
  const scrollThreshold = 10; // Minimum scroll distance to trigger show/hide

  const tabOpacity = tabVisibility; // Direct use for simple fade

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Header pill uses the same visibility as tabs (show/hide together)
  const headerPillVisibility = tabVisibility;

  // Use simple scroll handler for native driver animations
  const onScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    // Only trigger if scroll exceeds threshold
    if (Math.abs(diff) > scrollThreshold) {
      if (diff > 0 && isTabVisible.current && currentScrollY > 50) {
        // Scrolling down - hide tabs and header pills
        isTabVisible.current = false;
        Animated.spring(tabVisibility, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else if (diff < 0 && !isTabVisible.current) {
        // Scrolling up - show tabs and header pills
        isTabVisible.current = true;
        Animated.spring(tabVisibility, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }

      lastScrollY.current = currentScrollY;
    }
  };

  const tabItems = () => {
    return (
      <Animated.View style={{
        paddingHorizontal: 12,
        marginTop: -15,
        opacity: tabOpacity,
      }}>
        <View
          style={{
            backgroundColor: colors.background,
            borderRadius: 999,
            overflow: 'hidden',
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ padding: 12 }}
          >
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab("Following")}
            >
              <Text
                style={[
                  common.label,
                  {
                    color: activeTab === "Following" ? colors.text : colors.muted,
                    fontWeight: activeTab === "Following" ? "600" : "400",
                  },
                ]}
              >
                Following
              </Text>
              <Animated.View
                style={[
                  styles.activeIndicator,
                  {
                    opacity: followIndicatorAnim,
                    transform: [{ scaleX: followIndicatorAnim }],
                  },
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab("Lucky")}
            >
              <Text
                style={[
                  common.label,
                  {
                    color: activeTab === "Lucky" ? colors.text : colors.muted,
                    fontWeight: activeTab === "Lucky" ? "600" : "400",
                  },
                ]}
              >
                Lucky
              </Text>
              <Animated.View
                style={[
                  styles.activeIndicator,
                  {
                    opacity: luckyIndicatorAnim,
                    transform: [{ scaleX: luckyIndicatorAnim }],
                  },
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab("This Day")}
            >
              <Text
                style={{
                  color: activeTab === "This Day" ? colors.text : colors.muted,
                  fontWeight: activeTab === "This Day" ? "600" : "400",
                }}
              >
                This Day
              </Text>
              <Animated.View
                style={[
                  styles.activeIndicator,
                  {
                    opacity: thisDayIndicatorAnim,
                    transform: [{ scaleX: thisDayIndicatorAnim }],
                  },
                ]}
              />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Animated.View>
    );
  };

  const headerHeight = 75; // Approx height of the top logo/search row
  const tabsHeight = 50;   // Approx height of the tab row
  const totalHeaderHeight = headerHeight + tabsHeight;

  return (
    <>
      <View style={[common.screen, { position: 'relative' }]}>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: totalHeaderHeight + insets.top,
            zIndex: 1,
            opacity: headerBgOpacity,
          }}
        />

        <View style={{ position: 'absolute', top: insets.top, left: 0, right: 0, zIndex: 100 }}>
          <View style={[common.row, {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }]}>
            <Animated.View style={[common.row, {
              gap: 10,
              padding: 8,
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255,255,255,0.8)',
              borderRadius: 100,
              opacity: headerPillVisibility,
              transform: [{ scale: headerPillVisibility.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            }]}>
              <FastImage resizeMode="contain" source={require("../../assets/images/logo_head.png")} style={{ width: 40, height: 30, borderRadius: 100 }} />
            </Animated.View>

            <Animated.View style={[common.row, {
              gap: 10,
              padding: 8,
              backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255,255,255,0.8)',
              borderRadius: 100,
              opacity: headerPillVisibility,
              transform: [{ scale: headerPillVisibility.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            }]}>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Lineicons
                  icon={Search1Outlined}
                  size={24}
                  color={colors.text}
                  strokeWidth={3}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
                <Lineicons
                  icon={MenuMeatballs1Outlined}
                  size={24}
                  color={colors.text}
                  strokeWidth={3}
                  style={{ transform: [{ rotate: "90deg" }] }}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {tabItems()}
        </View>

        {/* <FastImage resizeMode="cover" source={{uri: 'https://picsum.photos/1280/720'}} style={{ width: '100%', height: 200, borderRadius: 16, borderWidth: 1, borderColor: colors.divider, marginBottom: 12 }} /> */}
        {
          isLoading ? (
            <FlashList
              data={[1, 2, 3]}
              renderItem={() => renderPostSkeleton()}
              keyExtractor={(item: number) => item.toString()}
              contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: totalHeaderHeight + insets.top }}
              estimatedItemSize={300}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
          ) : (
            <FlashList
              ref={listRef}
              key={activeTab}
              onScroll={onScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              data={posts}
              ListEmptyComponent={renderEmptyState}
              renderItem={({ item }: { item: Post }) => renderPost(item)}
              keyExtractor={(item: Post) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: bottomPadding, paddingTop: totalHeaderHeight + insets.top }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={onRefresh}
                  tintColor={colors.text}
                  colors={[colors.text]}
                  progressBackgroundColor={colors.card}
                />
              }
              onEndReached={() => {
                if (hasNextPage) fetchNextPage();
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={isFetchingNextPage ? renderPostSkeleton() : null}
              estimatedItemSize={300}
              ItemSeparatorComponent={() => <View style={{ height: 30 }} />}
            />
          )
        }
      </View>
      <GalleryPreview
        isVisible={galleryVisible}
        onRequestClose={closeGallery}
        images={galleryImages}
        initialIndex={galleryIndex}
        OverlayComponent={(props) => {
          const currentImage = galleryImages[props.currentImageIndex];
          return (
            <GalleryOverlay
              {...props}
              profileName={currentImage?.profileName}
              caption={currentImage?.caption ?? undefined}
              showBottomBar={true}
              showDownload={false}
              onShare={() => { }}
              onPoster={() => {
                closeGallery();
                router.push({
                  pathname: '/image_poster',
                  params: {
                    imageUrl: currentImage?.uri,
                    name: currentImage?.profileName || '',
                    description: currentImage?.caption || '',
                    musicUrl: currentImage?.musicUrl || '',
                    musicTitle: currentImage?.musicTitle || '',
                  }
                });
              }}
              isVerified={currentImage?.isVerified}
            />
          );
        }}
      />
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  tabItem: {
    paddingRight: 16,
  },
  activeIndicator: {
    width: '100%',
    height: 2,
    backgroundColor: 'orange',
    borderRadius: 999,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
});

