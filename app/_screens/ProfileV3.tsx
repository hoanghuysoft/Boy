import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import { SkeletonGroup, Spinner, Surface } from 'heroui-native';
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  InteractionManager,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { Snackbar } from 'react-native-paper';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostItem } from '../../components/PostItem';
import ProfileHeaderV3, { COVER_HEIGHT } from '../../components/profile/ProfileHeaderV3';
import { AddressSheet } from "../../components/profile/sheets/AddressSheet";
import { MusicSheet } from "../../components/profile/sheets/MusicSheet";
import { SocialSheet } from "../../components/profile/sheets/SocialSheet";
import { WorkplaceSheet } from "../../components/profile/sheets/WorkplaceSheet";
import { useImageGrid } from '../../components/profile/useImageGrid';
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { Post } from '../../types/post';
import { useProfileViewModel } from "../../viewmodels/ProfileViewModel";

import { FlexText } from "@/components/FlexText";
import { List } from "@/components/list";
import { PagerWithHeader, type PagerWithHeaderChildParams } from "@/components/pager/PagerWithHeader";
import { PostOptionsSheet } from "@/components/post";
import { CommentsSheet } from "@/components/post/CommentsSheet";
import { LikersSheet } from "@/components/post/LikersSheet";
import { BriefInfoSheet } from "@/components/profile/sheets/BriefInfoSheet";
import { RelationshipSheet } from "@/components/profile/sheets/RelationshipSheet";
import { BlurTargetView, BlurView } from "expo-blur";
import { Tabs } from "heroui-native";
import { GalleryModal } from "../../components/gallery/GalleryModal";
import { ProfileGalleryModal } from "../../components/gallery/ProfileGalleryModal";
import { SpinningArtwork } from "../../components/profile/SpinningArtwork";

// ─── Static skeleton shown during navigation transition ────────────────────────
const ProfileSkeletonInner = ({ insets }: { insets: any }) => {
  const { colors } = useThemeContext();
  return (
    <View style={{ paddingHorizontal: 12, flex: 1 }}>
      <SkeletonGroup isLoading variant="pulse" isSkeletonOnly>
        {/* Top Space */}
        <View style={{ height: insets.top + 12 }} />

        {/* Cover */}
        <SkeletonGroup.Item className="rounded-2xl" style={{ width: '100%', height: COVER_HEIGHT, marginBottom: 32 }} />

        {/* Avatar & Actions Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          {/* Avatar */}
          <SkeletonGroup.Item className="rounded-full" style={{ width: 64, height: 64 }} />
          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SkeletonGroup.Item className="rounded-xl" style={{ width: 44, height: 44 }} />
            <SkeletonGroup.Item className="rounded-full" style={{ width: 120, height: 44 }} />
          </View>
        </View>

        {/* Name, Username, Bio */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 150, height: 24 }} />
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 100, height: 16 }} />
          <SkeletonGroup.Item className="rounded-lg" style={{ width: '80%', height: 16 }} />
        </View>

        {/* Cards Scroll */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, overflow: 'hidden' }}>
          <SkeletonGroup.Item className="rounded-full" style={{ width: 150, height: 50 }} />
          <SkeletonGroup.Item className="rounded-full" style={{ width: 150, height: 50 }} />
          <SkeletonGroup.Item className="rounded-full" style={{ width: 150, height: 50 }} />
        </View>

        {/* Counts */}
        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 16 }}>
          <SkeletonGroup.Item className="rounded-md" style={{ width: 60, height: 16 }} />
          <SkeletonGroup.Item className="rounded-md" style={{ width: 60, height: 16 }} />
          <SkeletonGroup.Item className="rounded-md" style={{ width: 60, height: 16 }} />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, alignSelf: 'center', backgroundColor: colors.card, padding: 4, borderRadius: 16 }}>
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 80, height: 32 }} />
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 80, height: 32 }} />
          <SkeletonGroup.Item className="rounded-lg" style={{ width: 80, height: 32 }} />
        </View>

        {/* Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonGroup.Item key={i} className="rounded-lg" style={{ width: '31%', aspectRatio: 1 }} />
          ))}
        </View>
      </SkeletonGroup>
    </View>
  );
};

const ProfileSkeleton: React.FC = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  return (
    <View style={common.screen}>
      <ProfileSkeletonInner insets={insets} />
    </View>
  );
};

// ─── ProfileContent — PagerWithHeader-based architecture ───────────────────────
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
  }, [vm.showHeaderAvatar, headerAvatarProgress]);

  const headerAvatarContainerStyle = useAnimatedStyle(() => {
    const layoutProgress = Math.min(1, Math.max(0, headerAvatarProgress.value));
    return {
      width: layoutProgress * 40,
      marginRight: layoutProgress * 8,
      opacity: layoutProgress,
    };
  });

  const headerAvatarImageStyle = useAnimatedStyle(() => {
    const scaleProgress = Math.max(0, headerAvatarProgress.value);
    return {
      transform: [{ scale: scaleProgress }],
    };
  });

  // Grid Hooks (chunked rows for List with numColumns=1)
  const {
    chunkedGridData: imageChunkedRows,
    renderChunkedRow: renderImageChunkedRow,
    chunkedKeyExtractor: imageChunkedKeyExtractor,
    estimatedItemSize: imageEstimatedItemSize,
    renderQuickPreview: renderImageQuickPreview,
  } = useImageGrid({
    photos: vm.photos,
    onImagePress: vm.handleImagePress,
    loading: vm.isPhotosLoading,
    fetchingMore: vm.isFetchingNextPhotos
  });

  const {
    chunkedGridData: videoChunkedRows,
    renderChunkedRow: renderVideoChunkedRow,
    chunkedKeyExtractor: videoChunkedKeyExtractor,
    estimatedItemSize: videoEstimatedItemSize,
    renderQuickPreview: renderVideoQuickPreview,
  } = useImageGrid({
    photos: vm.videos,
    onVideoPress: vm.handleVideoPress,
    loading: vm.isVideosLoading,
    fetchingMore: vm.isFetchingNextVideos
  });

  // ─── Tab items for PagerWithHeader ────────────────────────────────
  const tabItems = useMemo(() => [
    t("profile.tabs.feed"),
    t("profile.tabs.images"),
    t("profile.tabs.videos"),
  ], [t]);

  const tabKeys = useMemo(() => ["Feed", "Images", "Videos"], []);

  // ─── Page selection tracking ──────────────────────────────────────
  const onPageSelected = useCallback((index: number) => {
    const tabKey = tabKeys[index] as "Feed" | "Images" | "Videos";
    vm.stableTabChange(tabKey);
  }, [tabKeys, vm.stableTabChange]);

  // ─── Header renderer for PagerWithHeader ──────────────────────────
  const renderHeader = useCallback(({ setMinimumHeight }: { setMinimumHeight: (h: number) => void }) => {
    // Tell PagerWithHeader: when collapsed, keep this much header visible
    // so the tab bar sticks below the floating back button + music pill.
    // Floating overlay: top = inset.top + 8, height = 40, gap = 8 → total = inset.top + 56
    setMinimumHeight(vm.inset.top + 56);

    return (
      <ProfileHeaderV3
        scrollY={vm.scrollY}
        activeTab={vm.selectedTab as any}
        onTabChange={vm.stableTabChange}
        profile={vm.profile}
        isMe={vm.isMe}
        isOwner={vm.isOwner}
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
        onPresentSheet={vm.safePresent}
      />
    );
  }, [vm.scrollY, vm.selectedTab, vm.stableTabChange, vm.profile, vm.isMe, vm.isOwner, vm.musicSheetRef, vm.socialSheetRef, vm.addressSheetRef, vm.workplaceSheetRef, vm.workplaces, vm.music, vm.socialLinks, vm.addresses, vm.imageCount, vm.videoCount, vm.postCount, vm.familySheetRef, vm.briefSheetRef, vm.safePresent, vm.inset.top]);

  // ─── Tab bar renderer for PagerWithHeader ──────────────────────────
  const renderTabBar = useCallback(({ items, currentPage, onSelect }: {
    items: string[]
    currentPage: number
    onSelect?: (index: number) => void
  }) => {
    const activeTab = tabKeys[currentPage];
    return (
      <View style={{ paddingHorizontal: 12 }}>
        <Tabs
          value={activeTab}
          onValueChange={(val: any) => {
            const idx = tabKeys.indexOf(val);
            if (idx !== -1) onSelect?.(idx);
          }}
          style={{ paddingHorizontal: 0, marginBottom: 0 }}
        >
          <Tabs.List>
            <Tabs.ScrollView scrollAlign="center">
              <Tabs.Indicator />
              {tabKeys.map((key, i) => (
                <Tabs.Trigger key={key} value={key}>
                  <Tabs.Label>{items[i]}</Tabs.Label>
                </Tabs.Trigger>
              ))}
            </Tabs.ScrollView>
          </Tabs.List>
        </Tabs>
      </View>
    );
  }, [tabKeys, vm.colors.background]);

  // ─── Empty component factory ──────────────────────────────────────
  const makeEmptyComponent = useCallback((tabKey: string) => {
    const isLoading =
      (tabKey === "Images" && vm.isPhotosLoading) ||
      (tabKey === "Videos" && vm.isVideosLoading) ||
      (tabKey === "Feed" && vm.isFeedLoading);

    if (isLoading) {
      return (
        <View style={{ paddingVertical: 80, justifyContent: 'center', alignItems: 'center' }}>
          <Spinner size="lg" color={vm.colors.secondary} />
        </View>
      );
    }

    let title = "";
    let message = "";
    switch (tabKey) {
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
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <FlexText style={vm.common.subheading}>{title}</FlexText>
        <FlexText style={[vm.common.body, styles.emptyMessage]}>{message}</FlexText>
      </View>
    );
  }, [vm.common, t, vm.isPhotosLoading, vm.isVideosLoading, vm.isFeedLoading]);

  // ─── Feed tab renderer ────────────────────────────────────────────
  const renderFeedTab = useCallback(({ headerHeight, isFocused, scrollElRef }: PagerWithHeaderChildParams) => {
    return (
      <List
        ref={scrollElRef as React.RefObject<FlatList>}
        data={vm.feedPosts}
        renderItem={({ item }: { item: Post }) => (
          <PostItem
            post={item}
            key={item.id}
            onOptionsPress={vm.handlePostOptionsPress}
            onLikeCountPress={vm.handleLikeCountPress}
            onCommentPress={vm.handleCommentPress}
          />
        )}
        keyExtractor={(item: Post) => item.id || String(Math.random())}
        headerOffset={headerHeight}
        progressBackgroundColor={vm.colors.card}
        initialNumToRender={6}
        windowSize={5}
        maxToRenderPerBatch={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshing={vm.isProfileRefetching}
        onRefresh={vm.onRefresh}
        refreshTintColor={vm.colors.text}
        progressViewOffset={vm.inset.top + 30}
        onEndReached={() => {
          if (vm.activeTab === "Feed") vm.handleEndReached();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={makeEmptyComponent("Feed")}
        contentContainerStyle={{ paddingBottom: vm.isMe ? 100 + vm.inset.bottom : vm.inset.bottom + 10 }}
        showsVerticalScrollIndicator={false}
        onScrollY={vm.onScrollYChange}
        ListHeaderComponent={<View style={{ height: 12 }} />}
      />
    );
  }, [vm.feedPosts, vm.handlePostOptionsPress, vm.handleLikeCountPress, vm.handleCommentPress, vm.isProfileRefetching, vm.onRefresh, vm.colors.text, vm.inset, vm.isMe, vm.handleEndReached, vm.activeTab, makeEmptyComponent, vm.onScrollYChange]);

  // ─── Images tab renderer ──────────────────────────────────────────
  const renderImagesTab = useCallback(({ headerHeight, isFocused, scrollElRef }: PagerWithHeaderChildParams) => {
    return (
      <List
        ref={scrollElRef as React.RefObject<FlatList>}
        data={imageChunkedRows}
        renderItem={({ item, index }: any) => renderImageChunkedRow({ item, index, separators: {} as any })}
        keyExtractor={(item: any, index: number) => imageChunkedKeyExtractor(item, index)}
        headerOffset={headerHeight}
        initialNumToRender={6}
        windowSize={5}
        maxToRenderPerBatch={5}
        progressBackgroundColor={vm.colors.card}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshing={vm.isProfileRefetching}
        onRefresh={vm.onRefresh}
        refreshTintColor={vm.colors.text}
        progressViewOffset={vm.inset.top + 30}
        onEndReached={() => {
          if (vm.activeTab === "Images") vm.handleEndReached();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={makeEmptyComponent("Images")}
        contentContainerStyle={{ paddingBottom: vm.isMe ? 100 + vm.inset.bottom : vm.inset.bottom + 10 }}
        showsVerticalScrollIndicator={false}
        onScrollY={vm.onScrollYChange}
        ListHeaderComponent={<View style={{ height: 12 }} />}
      />
    );
  }, [imageChunkedRows, renderImageChunkedRow, imageChunkedKeyExtractor, vm.isProfileRefetching, vm.onRefresh, vm.colors.text, vm.inset, vm.isMe, vm.handleEndReached, vm.activeTab, makeEmptyComponent, vm.onScrollYChange]);

  // ─── Videos tab renderer ──────────────────────────────────────────
  const renderVideosTab = useCallback(({ headerHeight, isFocused, scrollElRef }: PagerWithHeaderChildParams) => {
    return (
      <List
        ref={scrollElRef as React.RefObject<FlatList>}
        data={videoChunkedRows}
        renderItem={({ item, index }: any) => renderVideoChunkedRow({ item, index, separators: {} as any })}
        keyExtractor={(item: any, index: number) => videoChunkedKeyExtractor(item, index)}
        headerOffset={headerHeight}
        initialNumToRender={6}
        windowSize={5}
        maxToRenderPerBatch={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshing={vm.isProfileRefetching}
        onRefresh={vm.onRefresh}
        refreshTintColor={vm.colors.text}
        progressBackgroundColor={vm.colors.card}
        progressViewOffset={vm.inset.top + 30}
        onEndReached={() => {
          if (vm.activeTab === "Videos") vm.handleEndReached();
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={makeEmptyComponent("Videos")}
        contentContainerStyle={{ paddingBottom: vm.isMe ? 100 + vm.inset.bottom : vm.inset.bottom + 10 }}
        showsVerticalScrollIndicator={false}
        onScrollY={vm.onScrollYChange}
        ListHeaderComponent={<View style={{ height: 12 }} />}
      />
    );
  }, [videoChunkedRows, renderVideoChunkedRow, videoChunkedKeyExtractor, vm.isProfileRefetching, vm.onRefresh, vm.colors.text, vm.inset, vm.isMe, vm.handleEndReached, vm.activeTab, makeEmptyComponent, vm.onScrollYChange]);

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
          <ProfileSkeletonInner insets={vm.inset} />
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

          {/* ─── PagerWithHeader: the collapsible header + tab architecture ─── */}
          <PagerWithHeader
            items={tabItems}
            isHeaderReady={!!vm.profile}
            renderHeader={renderHeader}
            renderTabBar={renderTabBar}
            initialPage={tabKeys.indexOf(vm.selectedTab as string)}
            onPageSelected={onPageSelected}
            allowHeaderOverScroll>
            {renderFeedTab}
            {renderImagesTab}
            {renderVideosTab}
          </PagerWithHeader>
        </BlurTargetView>

        {/* Floating back button + avatar + music pill overlay */}
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
              onPress={() => vm.safePresent(vm.musicSheetRef)}
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
          profileId={vm.profile?.id}
          onEndReached={vm.handleMusicEndReached}
          isOwner={vm.isOwner}
        />
        <SocialSheet
          ref={vm.socialSheetRef}
          data={vm.socialLinks}
          profileId={vm.profile?.id}
          isOwner={vm.isOwner}
          onEndReached={vm.handleSocialEndReached}
        />
        <AddressSheet
          ref={vm.addressSheetRef}
          data={vm.addresses}
          profileId={vm.profile?.id}
          isOwner={vm.isOwner}
          onEndReached={vm.handleAddressesEndReached}
        />
        <WorkplaceSheet
          ref={vm.workplaceSheetRef}
          data={vm.workplaces}
          profileId={vm.profile?.id}
          isOwner={vm.isOwner}
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
          onDismiss={vm.handleLikersSheetDismiss}
        />
        <CommentsSheet
          ref={vm.commentsSheetRef}
          postId={vm.selectedCommentPostId}
          onDismiss={vm.handleCommentSheetDismiss}
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
