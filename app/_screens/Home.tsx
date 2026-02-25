import HomeCarousel from "@/components/HomeCarousel";
import OptionModal from "@/components/HomeOptionModal";
import SettingsIcon from "@/icons/settings";
import { useHomeViewModel } from "@/viewmodels/HomeViewModel";
import FastImage from "@d11/react-native-fast-image";
import { Magnifier } from '@solar-icons/react-native/Outline';
import React from "react";
import { Animated, StyleSheet, TouchableOpacity, View } from "react-native";
import { GalleryModal } from "../../components/gallery/GalleryModal";
import { CommentsSheet } from "../../components/post/CommentsSheet";
import { LikersSheet } from "../../components/post/LikersSheet";
import { PostOptionsSheet } from "../../components/post/PostOptionsSheet";
import HomeTabs from "./home/HomeTabs";

const HomeScreen = () => {
  const vm = useHomeViewModel();

  return (
    <>
      <View style={[vm.common.screen, { position: 'relative' }]}>
        {vm.carouselEnabled && (
          <HomeCarousel
            animatedVisibility={vm.carouselVisibility}
          />
        )}
        <OptionModal modalVisible={vm.modalVisible} setModalVisible={vm.setModalVisible} />
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: vm.totalHeaderHeight + vm.insets.top,
            zIndex: -10,
            opacity: vm.headerBgOpacity,
          }}
        />
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: vm.insets.top,
            left: 0,
            right: 0,
            zIndex: 100,
            opacity: vm.headerPillVisibility,
            transform: [{ translateY: vm.headerPillVisibility.interpolate({ inputRange: [0, 1], outputRange: [-100, 0] }) }],
          }}
        >
          <View style={[vm.common.row, {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 8,
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }]}>
            <Animated.View style={[vm.common.row, {
              gap: 10,
              padding: 8,
              borderRadius: 100,
              overflow: 'hidden',
              transform: [{ scale: vm.headerPillVisibility.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            }]}>
              {/* Animated background */}
              <Animated.View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: vm.pillBgColor,
                opacity: vm.pillBgOpacity,
              }} />
              <FastImage resizeMode="contain" source={require("../../assets/images/logo_head.png")} style={{ width: 40, height: 30, borderRadius: 100 }} />
            </Animated.View>

            <Animated.View style={[vm.common.row, {
              gap: 10,
              padding: 8,
              borderRadius: 100,
              overflow: 'hidden',
              transform: [{ scale: vm.headerPillVisibility.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            }]}>
              {/* Animated background */}
              <Animated.View style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: vm.pillBgColor,
                opacity: vm.pillBgOpacity,
              }} />
              <TouchableOpacity onPress={vm.navigateToSearch}>
                <Magnifier size={24} color={vm.iconColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={vm.openModal}>
                <SettingsIcon size={24} color={vm.iconColor} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Material Top Tabs */}
        <HomeTabs vm={vm} />
      </View>
      <GalleryModal />
      <PostOptionsSheet
        ref={vm.optionsSheetRef}
        post={vm.selectedPost}
        currentProfileId={vm.myProfile?.id || null}
        onDeleted={vm.handlePostDeleted}
      />
      <LikersSheet
        ref={vm.likersSheetRef}
        postId={vm.selectedLikePostId}
      />
      <CommentsSheet
        ref={vm.commentsSheetRef}
        postId={vm.selectedCommentPostId}
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
