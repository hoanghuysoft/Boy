import { useFeed } from "@/services/feed";
import { Post } from "@/types/post";
import FastImage from "@d11/react-native-fast-image";
import { Ionicons } from "@expo/vector-icons";
import { MenuMeatballs1Outlined, PlaySolid, Search1Outlined } from "@lineiconshq/free-icons";
import Lineicons from "@lineiconshq/react-native-lineicons";
import Galeria from "@nandorojo/galeria/build/GaleriaView";
import { FlashList as FlashListOriginal } from "@shopify/flash-list";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import CaptionText from "../../components/CaptionText";
import { ShimmerEffect } from "../../components/shimmer/Shimmer";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const FlashList = FlashListOriginal as any;

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";

dayjs.extend(relativeTime);

const HomeScreen = () => {
  const router = useRouter();
  const { colors, theme, toggleTheme, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"Follow" | "This Day">("Follow");

  const feedType = activeTab === "Follow" ? "random" : "on_this_day";
  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useFeed(feedType);

  const posts = data?.pages.flat() || [];

  const bottomNavHeight = 67;
  const bottomNavMargin = 13;
  const extraPadding = 20;
  const bottomPadding = bottomNavHeight + bottomNavMargin + insets.bottom + extraPadding;

  const followIndicatorAnim = useRef(new Animated.Value(1)).current;
  const thisDayIndicatorAnim = useRef(new Animated.Value(0)).current;

  // Scroll to top logic
  const listRef = useRef<any>(null);
  const showScrollTop = useRef(new Animated.Value(0)).current;
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const show = offsetY > 500;

    if (show && !isScrollTopVisible) {
      setIsScrollTopVisible(true);
      Animated.spring(showScrollTop, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();
    } else if (!show && isScrollTopVisible) {
      setIsScrollTopVisible(false);
      Animated.spring(showScrollTop, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }
  };

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  useEffect(() => {
    if (activeTab === "Follow") {
      Animated.parallel([
        Animated.spring(followIndicatorAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 100,
        }),
        Animated.spring(thisDayIndicatorAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 100,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(followIndicatorAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 100,
        }),
        Animated.spring(thisDayIndicatorAnim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 100,
        }),
      ]).start();
    }
  }, [activeTab]);

  const onRefresh = () => {
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
          {activeTab === "Follow" ? "Follow some people to see their posts" : "No posts from this day"}
        </Text>
      </View>
    );
  };

  const renderPost = (post: Post) => {
    return (
      <View style={{}}>
        {/* Header */}
        <View style={[common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }]}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/profile/[id]', params: { id: post.profile_id } })} style={[common.row, { gap: 12 }]}>
            <FastImage source={{ uri: post.profile_avatar }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.divider }} />
            <View>
              <Text style={[common.heading, { fontSize: 16 }]}>{post.profile_name}</Text>
              <Text style={[common.label, { color: colors.muted, fontSize: 12 }]}>{dayjs(post.created_at).fromNow()}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity hitSlop={10} style={{ backgroundColor: colors.card, borderRadius: 999, alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {post.caption ? (
          <View style={{ paddingHorizontal: 16 }}>
            <CaptionText caption={post.caption} colors={colors} common={common} />
          </View>
        ) : null}

        {/* Media */}
        {(post.media_type === 'photo' || post.media_type === 'video') && (
          <View style={{ marginBottom: 16 }}>
            {
              post.media_type === 'photo' && (
                <Galeria urls={[post.media_url]}>
                  <Galeria.Image>
                    <Image
                      source={{ uri: post.media_url, cache: 'force-cache' }}
                      resizeMode="cover"
                      style={{ width: '100%', aspectRatio: 3 / 4, backgroundColor: colors.divider }}
                    />
                  </Galeria.Image>
                </Galeria>
              )
            }
            {
              post.media_type === 'video' && (
                <TouchableOpacity onPress={() => router.push({ pathname: '/video_player', params: { videoUrl: post.media_url, name: post.profile_name, caption: post.caption, portrait: 'true' } })}>
                  <FastImage source={{ uri: post.media_url }} style={{ width: "100%", height: 350, backgroundColor: colors.divider }}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
                        <Lineicons icon={PlaySolid} size={24} color={'#ffffff'} style={{ marginLeft: 4 }} />
                      </View>
                    </View>
                  </FastImage>
                </TouchableOpacity>
              )
            }
          </View>
        )}

        {/* Action Bar */}
        <View style={[common.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 }]}>
          <View style={[common.row, { gap: 20 }]}>
            <TouchableOpacity hitSlop={10} style={[common.row, { gap: 6, alignItems: 'center' }]}>
              <Ionicons name="heart-outline" size={26} color={colors.text} />
              <Text style={[common.label, { color: colors.text, fontWeight: '600' }]}>1.2M</Text>
            </TouchableOpacity>
            <TouchableOpacity hitSlop={10} style={[common.row, { gap: 6, alignItems: 'center' }]}>
              <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
              <Text style={[common.label, { color: colors.text, fontWeight: '600' }]}>800K</Text>
            </TouchableOpacity>
            <TouchableOpacity hitSlop={10}>
              <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity hitSlop={10}>
            <Ionicons name="bookmark-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View >
    );
  };

  const tabItems = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[{ marginBottom: 12, flexGrow: 0, paddingHorizontal: 16 }]}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("Follow")}
        >
          <Text
            style={[
              common.label,
              {
                color: activeTab === "Follow" ? colors.text : colors.muted,
                fontWeight: activeTab === "Follow" ? "600" : "400",
              },
            ]}
          >
            Follow
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
    );
  };

  return (
    <SafeAreaView style={[common.screen]}>
      {/* Header */}
      <View style={[common.row, { paddingHorizontal: 16, paddingTop: 16, justifyContent: "space-between", alignItems: "center", marginBottom: 12 }]}>
        <View style={[common.row, { gap: 10 }]}>
          <FastImage resizeMode="contain" source={require("../../assets/images/logo_head.png")} style={{ width: 40, height: 30, borderRadius: 100 }} />
        </View>
        <View style={[common.row, { gap: 10 }]}>
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
        </View>
      </View>

      {tabItems()}
      {/* <FastImage resizeMode="cover" source={{uri: 'https://picsum.photos/1280/720'}} style={{ width: '100%', height: 200, borderRadius: 16, borderWidth: 1, borderColor: colors.divider, marginBottom: 12 }} /> */}
      {
        isLoading ? (
          <FlashList
            data={[1, 2, 3]}
            renderItem={() => renderPostSkeleton()}
            keyExtractor={(item: number) => item.toString()}
            contentContainerStyle={{ paddingBottom: bottomPadding }}
            estimatedItemSize={300}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
        ) : (
          <FlashList
            ref={listRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            data={posts}
            ListEmptyComponent={renderEmptyState}
            renderItem={({ item }: { item: Post }) => renderPost(item)}
            keyExtractor={(item: Post, index: number) => item.id + index.toString()}
            contentContainerStyle={{ paddingBottom: bottomPadding }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={onRefresh}
                tintColor={colors.text}
                colors={[colors.text]}
                progressBackgroundColor={colors.background}
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

      {/* Scroll To Top Button */}
      <Animated.View
        style={[
          styles.scrollTopButton,
          {
            backgroundColor: colors.containerContent,
            opacity: showScrollTop,
            transform: [{ scale: showScrollTop }],
            marginBottom: bottomNavHeight + bottomNavMargin, // Position above tab bar
          },
        ]}
        pointerEvents={isScrollTopVisible ? "auto" : "none"}
      >
        <TouchableOpacity onPress={scrollToTop} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="arrow-up" size={24} color={colors.text} />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
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
  scrollTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Glassmorphism-ish
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 100,
  },
});