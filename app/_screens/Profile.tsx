import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Animated,
  InteractionManager,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Snackbar } from 'react-native-paper';
import { PostItem } from '../../components/PostItem';
import InfoCard from '../../components/profile/InfoCard';
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

import { PostOptionsSheet } from "@/components/post";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import { LikersSheet } from "@/components/post/LikersSheet";
import { HeadphonesRoundSoundBold } from "@solar-icons/react-native";
import TurboImage from "react-native-turbo-image";
import { GalleryModal } from "../../components/gallery/GalleryModal";
import { ProfileGalleryModal } from "../../components/gallery/ProfileGalleryModal";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any;

type TabType = "Images" | "Videos" | "Feed" | "Information";

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
      activeTab={vm.activeTab}
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
    />
  ), [vm.scrollY, vm.profile, vm.isMe, vm.workplaces, vm.music, vm.socialLinks, vm.addresses, vm.imageCount, vm.videoCount, vm.postCount, vm.stableTabChange, vm.activeTab]);

  // Dynamic data based on tab
  const data = useMemo(() => {
    switch (vm.activeTab) {
      case "Information": return [{ _type: 'info' as const }];
      case "Images": return imageData;
      case "Videos": return videoData;
      case "Feed": return vm.feedPosts;
    }
  }, [vm.activeTab, imageData, videoData, vm.feedPosts]);

  // Dynamic numColumns based on tab
  const numColumns = useMemo(() => {
    switch (vm.activeTab) {
      case "Images": return imageNumColumns;
      case "Videos": return videoNumColumns;
      default: return 1;
    }
  }, [vm.activeTab, imageNumColumns, videoNumColumns]);

  // Dynamic estimatedItemSize based on tab
  const estimatedItemSize = useMemo(() => {
    switch (vm.activeTab) {
      case "Images": return imageEstimatedItemSize;
      case "Videos": return videoEstimatedItemSize;
      case "Feed": return 400;
      case "Information": return 600;
      default: return 200;
    }
  }, [vm.activeTab, imageEstimatedItemSize, videoEstimatedItemSize]);

  // Dynamic renderItem based on tab
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    switch (vm.activeTab) {
      case "Information":
        return <InfoCard profile={vm.profile} />;
      case "Images":
        return renderImageItem({ item, index, separators: {} as any });
      case "Videos":
        return renderVideoItem({ item, index, separators: {} as any });
      case "Feed":
        return <PostItem post={item as Post} key={item.id} onOptionsPress={vm.handlePostOptionsPress} onLikeCountPress={vm.handleLikeCountPress} onCommentPress={vm.handleCommentPress} />;
    }
  }, [vm.activeTab, vm.profile, renderImageItem, renderVideoItem]);

  // Dynamic keyExtractor
  const keyExtractor = useCallback((item: any, index: number) => {
    switch (vm.activeTab) {
      case "Information":
        return 'info';
      case "Images":
        return imageKeyExtractor(item, index);
      case "Videos":
        return videoKeyExtractor(item, index);
      case "Feed":
        return (item as Post).id || String(index);
      default:
        return String(index);
    }
  }, [vm.activeTab, imageKeyExtractor, videoKeyExtractor]);

  // Empty component
  const ListEmpty = useMemo(() => {
    if (vm.activeTab === "Information") return null;
    let title = "";
    let message = "";
    switch (vm.activeTab) {
      case "Images":
        title = "No Photos";
        message = "No photos have been uploaded yet.";
        break;
      case "Videos":
        title = "No Videos";
        message = "No videos have been uploaded yet.";
        break;
      case "Feed":
        title = "No Posts";
        message = "No posts have been published yet.";
        break;
    }
    return (
      <View style={[vm.common.card, styles.emptyCard]}>
        <Text style={vm.common.subheading}>{title}</Text>
        <Text style={[vm.common.body, styles.emptyMessage]}>{message}</Text>
      </View>
    );
  }, [vm.activeTab, vm.common]);

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
            label: 'Retry',
            onPress: vm.onRefresh,
          }}>
          Failed to load profile
        </Snackbar>
      </View>
    );
  }

  const formattedImages = sortedUrls.map(url => ({ uri: url }));

  return (
    <View style={vm.common.screen}>
      {/* Sticky Header Container */}
      {!vm.isMe && (
        <View style={{ position: 'absolute', top: vm.inset.top + 8, left: 16, zIndex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>

            {/* Back Button */}
            <TouchableOpacity
              onPress={() => vm.router.back()}
              style={{
                backgroundColor: vm.colors.containerContent,
                borderRadius: 999,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Ionicons name='chevron-back' size={24} color={vm.colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => vm.musicSheetRef.current?.present()}
              style={{ height: 40, width: 150 }}
            >
              <View style={styles.blurWrapper}>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: vm.colors.containerContent }]}
                />

                <View style={styles.blurContent}>
                  <View style={[styles.artworkContainer, { width: 32, height: 32 }]}>
                    {!vm.hasMusic ? (
                      <View style={[styles.placeholderIcon, { backgroundColor: vm.colors.card }]}>
                        <HeadphonesRoundSoundBold size={18} color={vm.colors.text} />
                      </View>
                    ) : (
                      <TurboImage
                        source={{ uri: vm.currentTrack?.cover_url || '' }}
                        style={styles.artworkImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  <View style={styles.textContainer}>
                    <Text
                      style={[styles.titleText, { color: vm.colors.text }]}
                      numberOfLines={1}
                    >
                      {vm.hasMusic ? vm.currentTrack?.title : 'Add Music'}
                    </Text>
                    <Text
                      style={[styles.artistText, { color: vm.colors.text }]}
                      numberOfLines={1}
                    >
                      {vm.hasMusic ? vm.currentTrack?.artist : 'Select track'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

          </View>
        </View>
      )}
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
        key={`flashlist-${numColumns}`}
        ref={vm.listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        contentContainerStyle={[
          { paddingBottom: vm.isMe ? 100 + vm.inset.bottom : vm.inset.bottom + 10 }
        ]}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        onScroll={vm.onScroll}
        scrollEventThrottle={16}
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
        estimatedItemSize={estimatedItemSize}
        onEndReached={vm.handleEndReached}
        onEndReachedThreshold={0.5}
      />

      {/* Floating Scroll to Top Button */}
      {!vm.isMe && (
        <Animated.View
          pointerEvents={vm.showScrollTop ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            bottom: vm.inset.bottom + 20,
            right: 16,
            opacity: vm.scrollTopButtonOpacity,
            zIndex: 1000,
          }}
        >
          <TouchableOpacity
            onPress={vm.scrollToTop}
            style={{
              backgroundColor: vm.colors.containerContent,
              borderRadius: 999,
              width: 48,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Ionicons name='chevron-up' size={24} color={vm.colors.text} />
          </TouchableOpacity>
        </Animated.View>
      )}
      <Snackbar
        visible={vm.snackbarVisible}
        onDismiss={vm.dismissSnackbar}
        action={{
          label: 'Retry',
          onPress: vm.onRefresh,
        }}>
        Failed to load profile
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
    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });
    return () => task.cancel();
  }, []);

  if (!isReady) {
    return <ProfileSkeleton />;
  }

  return <ProfileContent />;
};

export default ProfileScreen;
