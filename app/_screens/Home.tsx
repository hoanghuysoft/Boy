import { useGalleryStore } from "@/stores/gallery";
import { Post } from "@/types/post";
import FastImage from "@d11/react-native-fast-image";
import { Search1Outlined } from "@lineiconshq/free-icons";
import Lineicons from "@lineiconshq/react-native-lineicons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import GalleryPreview from 'react-native-gallery-preview';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GalleryOverlay } from '../../components/gallery/GalleryOverlay';
import { PostOptionsSheet } from "../../components/post/PostOptionsSheet";
import { useThemeContext } from "../../context/ThemeContext";
import { useProfile } from "../../services/userprofile";
import { createCommonStyles } from "../../styles/common";

import OptionModal from "@/components/HomeOptionModal";
import SettingsIcon from "@/icons/settings";
import { useSettingsStore } from "@/stores/settings";
import CustomTopTabBar from "./home/CustomTopTabBar";
import FeedTab from "./home/FeedTab";

const Tab = createMaterialTopTabNavigator();

// Tab screen components
const FollowingTab = ({ onScroll, onOptionsPress, headerHeight }: any) => (
  <FeedTab
    feedType="latest"
    onScroll={onScroll}
    onOptionsPress={onOptionsPress}
    headerHeight={headerHeight}
  />
);

const LuckyTab = ({ onScroll, onOptionsPress, headerHeight }: any) => (
  <FeedTab
    feedType="lucky"
    onScroll={onScroll}
    onOptionsPress={onOptionsPress}
    headerHeight={headerHeight}
  />
);

const ThisDayTab = ({ onScroll, onOptionsPress, headerHeight }: any) => (
  <FeedTab
    feedType="this_day"
    onScroll={onScroll}
    onOptionsPress={onOptionsPress}
    headerHeight={headerHeight}
  />
);

const HomeScreen = () => {
  const router = useRouter();
  const { colors, typography, theme } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();

  // Current user profile
  const { data: myProfile } = useProfile('me', true);

  // Post options sheet
  const optionsSheetRef = useRef<TrueSheet>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Global gallery state
  const { isVisible: galleryVisible, images: galleryImages, initialIndex: galleryIndex, closeGallery } = useGalleryStore();

  // Carousel settings
  const { showCarousel: carouselEnabled } = useSettingsStore();
  const [isAtTop, setIsAtTop] = useState(true);
  const carouselVisibility = useRef(new Animated.Value(1)).current;
  const [modalVisible, setModalVisible] = useState(false);

  // Scroll animation for floating header
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabVisibility = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const isTabVisible = useRef(true);
  const scrollThreshold = 10;

  const tabOpacity = tabVisibility;

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const headerPillVisibility = tabVisibility;

  const openModal = () => {
    setModalVisible(true);
  };

  // Scroll handler
  const onScroll = useCallback((event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    if (Math.abs(diff) > scrollThreshold) {
      if (diff > 0 && isTabVisible.current && currentScrollY > 50) {
        isTabVisible.current = false;
        Animated.spring(tabVisibility, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else if (diff < 0 && !isTabVisible.current) {
        isTabVisible.current = true;
        Animated.spring(tabVisibility, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }

      lastScrollY.current = currentScrollY;
    }

    const shouldShowCarousel = currentScrollY <= 10;
    if (shouldShowCarousel !== isAtTop) {
      setIsAtTop(shouldShowCarousel);
      Animated.spring(carouselVisibility, {
        toValue: shouldShowCarousel ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    }
  }, [isAtTop]);

  const handlePostOptionsPress = useCallback((post: Post) => {
    setSelectedPost(post);
    optionsSheetRef.current?.present();
  }, []);

  const handlePostDeleted = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const headerHeight = 75;
  const tabsHeight = 50;
  const totalHeaderHeight = headerHeight + tabsHeight;

  return (
    <>
      <View style={[common.screen, { position: 'relative' }]}>
        {/* {carouselEnabled && (
          <HomeCarousel
            isVisible={isAtTop}
            animatedVisibility={carouselVisibility}
          />
        )} */}
        <OptionModal modalVisible={modalVisible} setModalVisible={setModalVisible} />
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: totalHeaderHeight + insets.top,
            zIndex: -10,
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
              backgroundColor: isAtTop ? 'transparent' : (theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'),
              borderRadius: 100,
              opacity: headerPillVisibility,
              transform: [{ scale: headerPillVisibility.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            }]}>
              <FastImage resizeMode="contain" source={require("../../assets/images/logo_head.png")} style={{ width: 40, height: 30, borderRadius: 100 }} />
            </Animated.View>

            <Animated.View style={[common.row, {
              gap: 10,
              padding: 8,
              backgroundColor: isAtTop ? 'transparent' : (theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)'),
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
              <TouchableOpacity onPress={openModal}>
                <SettingsIcon size={24} color={colors.text} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Material Top Tabs */}
        <Tab.Navigator
          tabBar={(props) => (
            <View style={{ position: 'absolute', top: insets.top + headerHeight, left: 0, right: 0, zIndex: 99 }}>
              <CustomTopTabBar
                {...props}
                isAtTop={isAtTop}
                tabOpacity={tabOpacity}
              />
            </View>
          )}
          screenOptions={{
            swipeEnabled: true,
            lazy: true,
            lazyPreloadDistance: 0,
            sceneStyle: { backgroundColor: 'transparent' },
          }}
        >
          <Tab.Screen name="Following">
            {() => (
              <FollowingTab
                onScroll={onScroll}
                onOptionsPress={handlePostOptionsPress}
                headerHeight={totalHeaderHeight + insets.top}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Lucky">
            {() => (
              <LuckyTab
                onScroll={onScroll}
                onOptionsPress={handlePostOptionsPress}
                headerHeight={totalHeaderHeight + insets.top}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="This Day" options={{ title: "This Day" }}>
            {() => (
              <ThisDayTab
                onScroll={onScroll}
                onOptionsPress={handlePostOptionsPress}
                headerHeight={totalHeaderHeight + insets.top}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
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
                  pathname: '/image_poster' as any,
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
      <PostOptionsSheet
        ref={optionsSheetRef}
        post={selectedPost}
        currentProfileId={myProfile?.id || null}
        onDeleted={handlePostDeleted}
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
