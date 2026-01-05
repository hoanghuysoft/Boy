import { useFeed } from "@/services/feed";
import { Post } from "@/types/post";
import FastImage from "@d11/react-native-fast-image";
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

const HomeScreen = ({ navigation }: { navigation: any }) => {
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
      <View style={[common.card]}>
        <View style={[common.row, { gap: 10, marginBottom: 12 }]}>
          <ShimmerEffect
            isLoading={true}
            style={{ width: 30, height: 30, borderRadius: 100, backgroundColor: colors.divider }}
          />
          <ShimmerEffect
            isLoading={true}
            style={{ width: 120, height: 16, borderRadius: 8, backgroundColor: colors.divider }}
          />
        </View>
        <View style={{ gap: 8, marginBottom: 12 }}>
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
          style={{ width: "100%", height: 200, borderRadius: 24, backgroundColor: colors.divider }}
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
      <View style={[common.card]}>
        <View style={[common.row, { gap: 10 }]}>
          <FastImage source={{ uri: post.profile_avatar }} style={{ width: 30, height: 30, borderRadius: 100 }} />
          <Text style={[common.label, { color: colors.text }]}>{post.profile_name}</Text>
        </View>
        {post.caption ? (
          <CaptionText caption={post.caption} colors={colors} common={common} />
        ) : <View style={{ height: 20 }} />}
        {
          post.media_type === 'photo' && (
            <Galeria urls={[post.media_url]}>
              <Galeria.Image>
                <Image
                  source={{
                    uri: post.media_url,
                  }}
                  resizeMode="cover"
                  style={{ width: "100%", height: 200, borderRadius: 24, borderWidth: 1, borderColor: colors.divider }}
                />
              </Galeria.Image>
            </Galeria>
          )
        }
        {
          post.media_type === 'video' && (
            <TouchableOpacity onPress={() => navigation.navigate("VideoPlayer", { videoUrl: post.media_url, name: post.profile_name, caption: post.caption, portrait: true })}>
              <FastImage source={{ uri: post.media_url }} style={{ width: "100%", height: 200, borderRadius: 24, borderWidth: 1, borderColor: colors.divider }}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
                  <Lineicons icon={PlaySolid} size={45} color={'#ffffff'} strokeWidth={3} />
                </View>
              </FastImage>
            </TouchableOpacity>
          )
        }
      </View >
    );
  };

  const tabItems = () => {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
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
    <SafeAreaView style={[common.screen, common.screenPadding]}>
      {/* Header */}
      <View style={[common.row, { justifyContent: "space-between", alignItems: "center", marginBottom: 30 }]}>
        <View style={[common.row, { gap: 10 }]}>
          <FastImage resizeMode="contain" source={require("../../assets/images/logo_head.png")} style={{ width: 40, height: 30, borderRadius: 100 }} />
        </View>
        <View style={[common.row, { gap: 10 }]}>
          <TouchableOpacity onPress={() => navigation.navigate("Search")}>
            <Lineicons
              icon={Search1Outlined}
              size={24}
              color={colors.text}
              strokeWidth={3}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Search")}>
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
      {/* <FastImage resizeMode="cover" source={{uri: 'https://picsum.photos/1280/720'}} style={{ width: '100%', height: 200, borderRadius: 16, borderWidth: 1, borderColor: colors.divider, marginBottom: 12 }} /> */}
      {isLoading ? (
        <FlashList
          data={[1, 2, 3]}
          ListHeaderComponent={tabItems}
          renderItem={() => renderPostSkeleton()}
          keyExtractor={(item: number) => item.toString()}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          estimatedItemSize={300}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      ) : (
        <FlashList
          showsVerticalScrollIndicator={false}
          data={posts}
          ListHeaderComponent={tabItems}
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
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
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
});