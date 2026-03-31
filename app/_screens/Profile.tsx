import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Snackbar } from 'react-native-paper';
import { PostItem } from '../../components/PostItem';
import ProfileHeader, { COVER_HEIGHT } from '../../components/profile/ProfileHeader';
import { AddressSheet } from "../../components/profile/sheets/AddressSheet";
import { MusicSheet } from "../../components/profile/sheets/MusicSheet";
import { SocialSheet } from "../../components/profile/sheets/SocialSheet";
import { WorkplaceSheet } from "../../components/profile/sheets/WorkplaceSheet";
import { useImageGrid } from '../../components/profile/useImageGrid';
import { ShimmerEffect } from '../../components/shimmer/Shimmer';
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { Post } from '../../types/post';
import { useProfileViewModel } from "../../viewmodels/ProfileViewModel";

import { FlexText } from "@/components/FlexText";
import { PostOptionsSheet } from "@/components/post";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import { LikersSheet } from "@/components/post/LikersSheet";
import { BriefInfoSheet } from "@/components/profile/sheets/BriefInfoSheet";
import { RelationshipSheet } from "@/components/profile/sheets/RelationshipSheet";
import { BlurTargetView, BlurView } from "expo-blur";
import { GalleryModal } from "../../components/gallery/GalleryModal";
import { ProfileGalleryModal } from "../../components/gallery/ProfileGalleryModal";
import { SpinningArtwork } from "../../components/profile/SpinningArtwork";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any;

// ─── Static skeleton shown during navigation transition ────────────────────────
const ProfileSkeleton: React.FC = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  return (
    <View style={common.screen}>
      <ShimmerEffect
        isLoading
        style={{ width: '100%', height: COVER_HEIGHT, backgroundColor: colors.divider }}
      />
      <View style={{ borderRadius: 8, marginTop: -8, backgroundColor: colors.background, flex: 1 }}>
        <View style={common.screenPadding}>
          <View style={[common.row, { marginTop: -55, gap: 5 }]}>
            <View style={[common.avatarLarge, { overflow: 'hidden', borderWidth: 3, borderColor: colors.background, backgroundColor: colors.background }]}>
              <ShimmerEffect isLoading style={{ width: '100%', height: '100%' }} />
            </View>
          </View>
          <View style={{ marginTop: 8, gap: 8 }}>
            <ShimmerEffect isLoading style={{ width: 150, height: 24, borderRadius: 8, backgroundColor: colors.divider }} />
            <ShimmerEffect isLoading style={{ width: 100, height: 14, borderRadius: 8, backgroundColor: colors.divider }} />
            <ShimmerEffect isLoading style={{ width: '80%', height: 16, borderRadius: 8, marginTop: 8, backgroundColor: colors.divider }} />
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            <ShimmerEffect isLoading style={{ width: 170, height: 70, borderRadius: 35, backgroundColor: colors.divider }} />
            <ShimmerEffect isLoading style={{ width: 170, height: 70, borderRadius: 35, backgroundColor: colors.divider }} />
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            <ShimmerEffect isLoading style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: colors.divider }} />
            <ShimmerEffect isLoading style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: colors.divider }} />
            <ShimmerEffect isLoading style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: colors.divider }} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <ShimmerEffect key={i} isLoading style={{ width: '31%', aspectRatio: 1, borderRadius: 8, backgroundColor: colors.divider }} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── ProfileContent — uses ViewModel for all logic ─────────────────────────────
const ProfileContent = () => {
  const vm = useProfileViewModel();
  const { t } = useTranslation();

  // ─── Header avatar spring animation (native thread via Reanimated) ───
  const headerAvatarProgress = useSharedValue(0);

  useEffect(() => {
    headerAvatarProgress.value = withSpring(vm.showHeaderAvatar ? 1 : 0, {
      damping: 14,
      stiffness: 180,
      mass: 0.8,
    });
  }, [vm.showHeaderAvatar]);

  const headerAvatarContainerStyle = useAnimatedStyle(() => {
    // Clamp layout progress strictly between 0 and 1.
    // This prevents the container's width/margin from overshooting > 1, 
    // which stops the neighboring music pill from jittering back and forth!
    const layoutProgress = Math.min(1, Math.max(0, headerAvatarProgress.value));
    return {
      width: layoutProgress * 40,
      marginRight: layoutProgress * 8,
      opacity: layoutProgress,
    };
  });

  const headerAvatarImageStyle = useAnimatedStyle(() => {
    // Let the image purely bounce above 1 for a satisfying spring effect.
    // We only clamp at 0 so it doesn't invert (scale negative) when returning.
    const scaleProgress = Math.max(0, headerAvatarProgress.value);
    return {
      transform: [{ scale: scaleProgress }],
    };
  });

  // Grid Hooks
  const {
    gridData: imageData,
    sortedUrls,
    numColumns: imageNumColumns,
    estimatedItemSize: imageEstimatedItemSize,
    renderItem: renderImageItem,
    keyExtractor: imageKeyExtractor,
    flatListProps: imageFlatListProps,
    renderQuickPreview: renderImageQuickPreview,
  } = useImageGrid({
    photos: vm.photos,
    onImagePress: vm.handleImagePress,
    loading: vm.isPhotosLoading,
    fetchingMore: vm.isFetchingNextPhotos
  });

  const {
    gridData: videoData,
    numColumns: videoNumColumns,
    estimatedItemSize: videoEstimatedItemSize,
    renderItem: renderVideoItem,
    keyExtractor: videoKeyExtractor,
    contentContainerStyle: videoContainerStyle,
    flatListProps: videoFlatListProps,
    renderQuickPreview: renderVideoQuickPreview,
  } = useImageGrid({
    photos: vm.videos,
    onVideoPress: vm.handleVideoPress,
    loading: vm.isVideosLoading,
    fetchingMore: vm.isFetchingNextVideos
  });

  // Single header
  const ListHeader = useMemo(() => (
    <ProfileHeader
      scrollY={vm.scrollY}
      activeTab={vm.selectedTab as any}
      onTabChange={vm.stableTabChange}
      profile={vm.profile}
      isMe={vm.isMe}
      musicSheetRef={vm.musicSheetRef}
      socialSheetRef={vm.socialSheetRef}
      addressSheetRef={vm.addressSheetRef}
      workplaceSheetRef={vm.workplaceSheetRef}
      workplaces={vm.workplaces}
      music={vm.music}
      socialLinks={vm.socialLinks}
      addresses={vm.addresses}
      imageCount={vm.imageCount}
      videoCount={vm.videoCount}
      postCount={vm.postCount}
      familySheetRef={vm.familySheetRef}
      briefSheetRef={vm.briefSheetRef}
    />
  ), [vm.scrollY, vm.profile, vm.isMe, vm.workplaces, vm.music, vm.socialLinks, vm.addresses, vm.imageCount, vm.videoCount, vm.postCount, vm.stableTabChange, vm.selectedTab]);

  // Dynamic data based on tab
  const data = useMemo(() => {
    switch (vm.activeTab) {
      case "Images": return imageData;
      case "Videos": return videoData;
      case "Feed": return vm.feedPosts;
    }
  }, [vm.activeTab, imageData, videoData, vm.feedPosts]);

  // We extract the REAL column count for the active tab to chunk our data,
  // but we will explicitly force FlashList to ALWAYS use numColumns=1.
  // This completely stops FlashList from destroying and remounting the ListHeaderComponent (preventing the blink!)
  const actualNumColumns = useMemo(() => {
    switch (vm.activeTab) {
      case "Images": return imageNumColumns;
      case "Videos": return videoNumColumns;
      default: return 1;
    }
  }, [vm.activeTab, imageNumColumns, videoNumColumns]);

  // Manually chunk array into rows so the 1-column FlashList renders multi-column grids!
  const chunkedData = useMemo(() => {
    if (actualNumColumns === 1) return data;
    const chunked = [];
    for (let i = 0; i < data.length; i += actualNumColumns) {
      chunked.push(data.slice(i, i + actualNumColumns));
    }
    return chunked;
  }, [data, actualNumColumns]);

  // Dynamic estimatedItemSize based on tab
  const estimatedItemSize = useMemo(() => {
    switch (vm.activeTab) {
      case "Images": return imageEstimatedItemSize;
      case "Videos": return videoEstimatedItemSize;
      case "Feed": return 400;
      default: return 200;
    }
  }, [vm.activeTab, imageEstimatedItemSize, videoEstimatedItemSize]);

  // Dynamic renderItem based on tab
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    switch (vm.activeTab) {
      case "Images":
      case "Videos": {
        const RenderFunc = vm.activeTab === "Images" ? renderImageItem : renderVideoItem;
        return (
          <View style={{ flexDirection: 'row', width: '100%' }}>
            {item.map((subItem: any, subIndex: number) => (
              <View key={subIndex} style={{ flex: 1 }}>
                {RenderFunc({ item: subItem, index: index * actualNumColumns + subIndex, separators: {} as any })}
              </View>
            ))}
            {/* Fill remaining flex space for incomplete rows so they don't stretch to fill the width */}
            {Array.from({ length: actualNumColumns - item.length }).map((_, i) => (
              <View key={`spacer-${i}`} style={{ flex: 1 }} />
            ))}
          </View>
        );
      }
      case "Feed":
        return <PostItem post={item as Post} key={item.id} onOptionsPress={vm.handlePostOptionsPress} onLikeCountPress={vm.handleLikeCountPress} onCommentPress={vm.handleCommentPress} />;
    }
  }, [vm.activeTab, renderImageItem, renderVideoItem, actualNumColumns]);

  // Dynamic keyExtractor
  const keyExtractor = useCallback((item: any, index: number) => {
    switch (vm.activeTab) {
      case "Images":
      case "Videos":
        // Item is a row array. We extract the key by using the first element's key.
        const firstItem = item[0];
        const Extractor = vm.activeTab === "Images" ? imageKeyExtractor : videoKeyExtractor;
        return Extractor ? Extractor(firstItem, index * actualNumColumns) : String(index);
      case "Feed":
        return (item as Post).id || String(index);
      default:
        return String(index);
    }
  }, [vm.activeTab, imageKeyExtractor, videoKeyExtractor, actualNumColumns]);

  // Empty component
  const ListEmpty = useMemo(() => {
    let title = "";
    let message = "";
    switch (vm.activeTab) {
      case "Images":
        title = t("profile.empty.images.title");
        message = t("profile.empty.images.message");
        break;
      case "Videos":
        title = t("profile.empty.videos.title");
        message = t("profile.empty.videos.message");
        break;
      case "Feed":
        title = t("profile.empty.feed.title");
        message = t("profile.empty.feed.message");
        break;
    }
    return (
      <View style={[vm.common.card, styles.emptyCard]}>
        <FlexText style={vm.common.subheading}>{title}</FlexText>
        <FlexText style={[vm.common.body, styles.emptyMessage]}>{message}</FlexText>
      </View>
    );
  }, [vm.activeTab, vm.common, t]);

  // Loading / Error state
  if (!vm.profile) {
    return (
      <View style={vm.common.screen}>
        <ScrollView
          style={vm.common.screen}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={vm.isProfileRefetching}
              onRefresh={vm.onRefresh}
              tintColor={vm.colors.text}
              colors={[vm.colors.text]}
              style={{ zIndex: 10 }}
              progressViewOffset={vm.inset.top + 30}
            />
          }
        >
          <ShimmerEffect
            isLoading={true}
            style={{ width: "100%", height: COVER_HEIGHT, backgroundColor: vm.colors.divider }}
          />
          <View style={{
            borderRadius: 8,
            marginTop: -8,
            backgroundColor: vm.colors.background,
            flex: 1
          }}>
            <View style={vm.common.screenPadding}>
              <View style={[vm.common.row, { marginTop: -55, gap: 5 }]}>
                <View style={[vm.common.avatarLarge, { overflow: 'hidden', borderWidth: 3, borderColor: vm.colors.background, backgroundColor: vm.colors.background }]}>
                  <ShimmerEffect
                    isLoading={true}
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
              </View>
              <View style={{ marginTop: 8, gap: 8 }}>
                <ShimmerEffect isLoading={true} style={{ width: 150, height: 24, borderRadius: 8, backgroundColor: vm.colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: 100, height: 14, borderRadius: 8, backgroundColor: vm.colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: '80%', height: 16, borderRadius: 8, marginTop: 8, backgroundColor: vm.colors.divider }} />
              </View>
              <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
                <ShimmerEffect isLoading={true} style={{ width: 170, height: 70, borderRadius: 35, backgroundColor: vm.colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: 170, height: 70, borderRadius: 35, backgroundColor: vm.colors.divider }} />
              </View>
              <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
                <ShimmerEffect isLoading={true} style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: vm.colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: vm.colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: vm.colors.divider }} />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <ShimmerEffect key={i} isLoading={true} style={{ width: '31%', aspectRatio: 1, borderRadius: 8, backgroundColor: vm.colors.divider }} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
        <Snackbar
          visible={vm.snackbarVisible}
          onDismiss={vm.dismissSnackbar}
          action={{
            label: t("profile.actions.retry"),
            onPress: vm.onRefresh,
          }}>
          {t("profile.errors.failedToLoadProfile")}
        </Snackbar>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={vm.common.screen}>
        {/* Sticky Header Container */}
        <BlurTargetView ref={vm.blurTargetRef} style={{ flex: 1 }}>
          {renderImageQuickPreview()}
          {renderVideoQuickPreview()}
          <ProfileGalleryModal
            visible={vm.galleryVisible}
            photos={vm.photos}
            music={vm.music}
            initialIndex={vm.galleryIndex}
            onClose={vm.closeGallery}
            profileName={vm.profile?.name}
            isVerified={vm.profile?.is_verified}
          />
          <GalleryModal />

          <AnimatedFlashList
            key="flashlist-profile-view" // Static key prevents component destruction
            ref={vm.listRef}
            data={chunkedData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            numColumns={1} // Hardcoded to 1 to prevent dynamic mount flashes
            estimatedItemSize={estimatedItemSize}
            contentContainerStyle={[
              { paddingBottom: vm.isMe ? 100 + vm.inset.bottom : vm.inset.bottom + 10 }
            ]}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmpty}
            onScroll={vm.onScroll}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={vm.isProfileRefetching}
                onRefresh={vm.onRefresh}
                tintColor={vm.colors.text}
                colors={[vm.colors.text]}
                progressBackgroundColor={vm.colors.card}
                style={{ zIndex: 10 }}
                progressViewOffset={vm.inset.top + 30}
              />
            }
            onEndReached={vm.handleEndReached}
            onEndReachedThreshold={0.5}
          />
        </BlurTargetView>

        {!vm.isMe && (
          <View style={{ position: 'absolute', top: vm.inset.top + 8, left: 16, zIndex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>

              {/* Back Button */}
              <BlurView
                tint={vm.theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"}
                intensity={80}
                blurTarget={vm.blurTargetRef}
                blurMethod="dimezisBlurViewSdk31Plus"
                style={{
                  borderRadius: 999,
                  overflow: 'hidden',
                  marginRight: 8,
                }}
              >
                <TouchableOpacity
                  onPress={() => vm.router.back()}
                  style={{
                    borderRadius: 999,
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Ionicons name='chevron-back' size={24} color={vm.colors.text} />
                </TouchableOpacity>
              </BlurView>

              {/* Header Avatar — springs in when scrolled past profile avatar */}
              <Reanimated.View
                style={[
                  {
                    height: 40,
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  headerAvatarContainerStyle,
                ]}
              >
                <TouchableOpacity activeOpacity={0.8} onPress={vm.scrollToTop}>
                  <Reanimated.View
                    style={[
                      {
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        overflow: 'hidden',
                      },
                      headerAvatarImageStyle,
                    ]}
                  >
                    <Image
                      source={
                        vm.profile?.avatar_url
                          ? { uri: vm.profile.avatar_url }
                          : vm.profile?.gender === 'male'
                            ? require('../../assets/images/AV17.png')
                            : require('../../assets/images/AV86.png')
                      }
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </Reanimated.View>
                </TouchableOpacity>
              </Reanimated.View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => vm.musicSheetRef.current?.present()}
                style={{ height: 40, width: 150 }}
              >
                <BlurView tint={vm.theme === "dark" ? "systemMaterialDark" : "systemMaterialLight"} intensity={80} blurTarget={vm.blurTargetRef} blurMethod="dimezisBlurView" style={styles.blurWrapper}>
                  <View
                    style={[StyleSheet.absoluteFill, {}]}
                  />

                  <View style={styles.blurContent}>
                    <SpinningArtwork
                      isMusicPlaying={vm.isMusicPlaying}
                      hasMusic={vm.hasMusic}
                      coverUrl={vm.currentTrack?.cover_url}
                      onPress={vm.handleMusicPress}
                      colors={vm.colors}
                    />

                    <View style={styles.textContainer}>
                      <FlexText
                        style={[styles.titleText, { color: vm.colors.text }]}
                        numberOfLines={1}
                      >
                        {vm.hasMusic ? vm.currentTrack?.title : t("profile.music.addMusic")}
                      </FlexText>
                      <FlexText
                        style={[styles.artistText, { color: vm.colors.text }]}
                        numberOfLines={1}
                      >
                        {vm.hasMusic ? vm.currentTrack?.artist : t("profile.music.selectTrack")}
                      </FlexText>
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>

            </View>
          </View>
        )}


        <Snackbar
          visible={vm.snackbarVisible}
          onDismiss={vm.dismissSnackbar}
          action={{
            label: t("profile.actions.retry"),
            onPress: vm.onRefresh,
          }}>
          {t("profile.errors.failedToLoadProfile")}
        </Snackbar>

        <MusicSheet
          ref={vm.musicSheetRef}
          data={vm.music}
          onEndReached={vm.handleMusicEndReached}
        />
        <SocialSheet
          ref={vm.socialSheetRef}
          data={vm.socialLinks}
          onEndReached={vm.handleSocialEndReached}
        />
        <AddressSheet
          ref={vm.addressSheetRef}
          data={vm.addresses}
          onEndReached={vm.handleAddressesEndReached}
        />
        <WorkplaceSheet
          ref={vm.workplaceSheetRef}
          data={vm.workplaces}
          onEndReached={vm.handleWorkplacesEndReached}
        />
        <RelationshipSheet
          ref={vm.familySheetRef}
          data={vm.profile?.loved_ones || []}
        />
        <BriefInfoSheet
          ref={vm.briefSheetRef}
          profile={vm.profile}
          workplaces={vm.workplaces}
          homeInfo={vm.profile?.hometown || null}
        />
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

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  emptyMessage: {
    marginTop: 8,
  },
  touchableContainer: {
    marginVertical: 8,
    alignSelf: 'flex-start',
  },
  artworkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    overflow: 'hidden',
  },
  artworkPlaying: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  placeholderIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  artistText: {
    fontSize: 11,
    opacity: 0.7,
    lineHeight: 14,
  },
  blurWrapper: {
    borderRadius: 999,
    overflow: 'hidden',
    height: 40,
    maxWidth: 200,
    justifyContent: 'center',
  },
  blurContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 0,
    height: '100%',
    gap: 8,
  },
});

// ─── ProfileScreen shell ──────────────────────────────────────────────────────
const ProfileScreen = () => {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    const id = requestIdleCallback(() => {
      setIsReady(true);
    });
    return () => cancelIdleCallback(id);
  }, []);

  if (!isReady) {
    return <ProfileSkeleton />;
  }

  return <ProfileContent />;
};

export default ProfileScreen;
