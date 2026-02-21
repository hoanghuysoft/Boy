import { useLocalSearchParams, useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useInfiniteAddresses } from "../../services/address";
import { useProfileFeed } from "../../services/feed";
import { useInfiniteMedia } from "../../services/media";
import { useInfiniteMusic } from "../../services/music";
import { useInfiniteSocialLinks } from "../../services/sociallink";
import { useProfile } from "../../services/userprofile";
import { useInfiniteWorkplaces } from "../../services/workplace";
import { createCommonStyles } from "../../styles/common";
import { Media } from '../../types/media';
import { Post } from '../../types/post';



type TabType = "Images" | "Videos" | "Feed" | "Information";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any;

import { PostOptionsSheet } from "@/components/post";
import { HeadphonesRoundSoundBold } from "@solar-icons/react-native";
import TurboImage from "react-native-turbo-image";
import { GalleryModal } from "../../components/gallery/GalleryModal";
import { ProfileGalleryModal } from "../../components/gallery/ProfileGalleryModal";
import { useScrollStore } from "../../stores/scroll";

// ─── Static skeleton shown during navigation transition ────────────────────────
// Pure JSX — no hooks, no queries. Gives the slide animation full JS thread time.
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

// ─── ProfileContent — all heavy logic lives here ──────────────────────────────
// Only mounts after the navigation animation completes.
const ProfileContent = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isMe = params.isMe === 'true';

  const { colors, typography, theme } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const inset = useSafeAreaInsets();

  const listRef = useRef<any>(null);
  const trigger = useScrollStore((state) => state.triggers['profile']);

  // Per-tab scroll offset memory — plain refs, zero re-render overhead
  const scrollPositions = useRef<Record<TabType, number>>({
    Images: 0,
    Videos: 0,
    Feed: 0,
    Information: 0,
  });
  // Tracks the live scroll Y so handleTabChange can save it without reading Animated
  const currentScrollY = useRef(0);

  useEffect(() => {
    if (trigger > 0 && listRef.current) {
      // Clear saved position for the active tab when scroll-to-top is triggered
      scrollPositions.current[activeTab] = 0;
      currentScrollY.current = 0;
      scrollY.setValue(0);
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [trigger]);

  // State
  const [activeTab, setActiveTab] = useState<TabType>("Images");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const {
    data: profile,
    isLoading: isProfileLoading,
    isRefetching: isProfileRefetching,
    refetch: refetchProfile,
    isError: isProfileError
  } = useProfile(id as string, isMe);

  const profileId = profile?.id ?? "";

  const {
    data: musicPaging,
    refetch: refetchMusic,
    fetchNextPage: fetchNextMusic,
    hasNextPage: hasNextMusic,
    isFetchingNextPage: isFetchingNextMusic
  } = useInfiniteMusic(profileId);
  const music = useMemo(() => musicPaging?.pages.flatMap(p => p.data) || [], [musicPaging]);

  const {
    data: socialPaging,
    refetch: refetchSocial,
    fetchNextPage: fetchNextSocial,
    hasNextPage: hasNextSocial,
    isFetchingNextPage: isFetchingNextSocial
  } = useInfiniteSocialLinks(profileId);
  const socialLinks = useMemo(() => socialPaging?.pages.flatMap(p => p.data) || [], [socialPaging]);

  const {
    data: addressPaging,
    refetch: refetchAddresses,
    fetchNextPage: fetchNextAddresses,
    hasNextPage: hasNextAddresses,
    isFetchingNextPage: isFetchingNextAddresses
  } = useInfiniteAddresses(profileId);
  const addresses = useMemo(() => addressPaging?.pages.flatMap(p => p.data) || [], [addressPaging]);

  const {
    data: workplacePaging,
    refetch: refetchWorkplaces,
    fetchNextPage: fetchNextWorkplaces,
    hasNextPage: hasNextWorkplaces,
    isFetchingNextPage: isFetchingNextWorkplaces
  } = useInfiniteWorkplaces(profileId);
  const workplaces = useMemo(() => workplacePaging?.pages.flatMap(p => p.data) || [], [workplacePaging]);

  const {
    data: photosPaging,
    refetch: refetchPhotos,
    fetchNextPage: fetchNextPhotos,
    hasNextPage: hasNextPhotos,
    isFetchingNextPage: isFetchingNextPhotos,
    isLoading: isPhotosLoading
  } = useInfiniteMedia(profileId, 'photo');
  const photos = useMemo(() => photosPaging?.pages.flatMap(p => p.data) || [], [photosPaging]);

  const {
    data: videosPaging,
    refetch: refetchVideos,
    fetchNextPage: fetchNextVideos,
    hasNextPage: hasNextVideos,
    isFetchingNextPage: isFetchingNextVideos,
    isLoading: isVideosLoading
  } = useInfiniteMedia(profileId, 'video');
  const videos = useMemo(() => videosPaging?.pages.flatMap(p => p.data) || [], [videosPaging]);

  const {
    data: feedPaging,
    refetch: refetchFeed,
    fetchNextPage: fetchNextFeed,
    hasNextPage: hasNextFeed,
    isFetchingNextPage: isFetchingNextFeed,
    isLoading: isFeedLoading
  } = useProfileFeed(profileId);
  const feedPosts = useMemo(() => feedPaging?.pages.flatMap(p => p.data) || [], [feedPaging]);

  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const hasMusic = music.length > 0;
  const currentTrack = hasMusic ? music[0] : null;

  useEffect(() => {
    if (isProfileError) {
      setSnackbarVisible(true);
    }
  }, [isProfileError]);

  // Refs
  const musicSheetRef = useRef<TrueSheet>(null);
  const socialSheetRef = useRef<TrueSheet>(null);
  const addressSheetRef = useRef<TrueSheet>(null);
  const workplaceSheetRef = useRef<TrueSheet>(null);

  // Single scroll value
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollTopButtonOpacity = useRef(new Animated.Value(0)).current;

  const onScroll = useMemo(() =>
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
        useNativeDriver: true,
        listener: (event: any) => {
          const offsetY = event.nativeEvent.contentOffset.y;
          // Track live position in a plain ref — no setState, no re-render
          currentScrollY.current = offsetY;
          const shouldShow = offsetY > 300;
          if (shouldShow !== showScrollTop) {
            setShowScrollTop(shouldShow);
            Animated.timing(scrollTopButtonOpacity, {
              toValue: shouldShow ? 1 : 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        }
      }
    ),
    [scrollY, showScrollTop]);

  // Handlers
  // Use a ref so ProfileHeader's ListHeader memo stays stable across tab changes
  const handleTabChangeRef = useRef<((tab: TabType) => void) | undefined>(undefined);
  const handleTabChange = useCallback((tab: TabType) => {
    if (tab === activeTab) return; // same tab — no-op
    // Save scroll position of the tab we are leaving
    scrollPositions.current[activeTab] = currentScrollY.current;
    // Defer the heavy state update so the tap feels instant
    InteractionManager.runAfterInteractions(() => {
      setActiveTab(tab);
    });
  }, [activeTab]);
  // Keep ref in sync so ProfileHeader callback never triggers header re-render
  handleTabChangeRef.current = handleTabChange;

  // Restore saved scroll position whenever the active tab changes
  useEffect(() => {
    const savedY = scrollPositions.current[activeTab];
    // A small delay is needed so the FlashList (possibly remounted due to key change)
    // has time to mount before we attempt scrollToOffset
    const timer = setTimeout(() => {
      scrollY.setValue(savedY);
      if (savedY > 0) {
        listRef.current?.scrollToOffset({ offset: savedY, animated: false });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeTab, scrollY]);

  const handleVideoPress = useCallback((video: Media) => {
    router.push({
      pathname: '/video_player',
      params: {
        videoUrl: video.url,
        name: profile?.name || 'Video',
        caption: video.caption || '',
        portrait: 'true',
      }
    });
  }, [router, profile?.name]);

  const handleImagePress = useCallback((visible: boolean, index: number) => {
    setGalleryIndex(index);
    setGalleryVisible(visible);
  }, []);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    refetchProfile();
    if (profile?.id) {
      refetchWorkplaces();
      refetchMusic();
      refetchSocial();
      refetchAddresses();
      refetchPhotos();
      refetchVideos();
      refetchFeed();
    }
  }, [refetchProfile, refetchWorkplaces, refetchMusic, refetchSocial, refetchAddresses, refetchPhotos, refetchVideos, refetchFeed, profile?.id]);

  const handleEndReached = useCallback(() => {
    if (activeTab === "Images" && hasNextPhotos && !isFetchingNextPhotos) {
      fetchNextPhotos();
    } else if (activeTab === "Videos" && hasNextVideos && !isFetchingNextVideos) {
      fetchNextVideos();
    } else if (activeTab === "Feed" && hasNextFeed && !isFetchingNextFeed) {
      fetchNextFeed();
    }
  }, [activeTab, hasNextPhotos, isFetchingNextPhotos, fetchNextPhotos, hasNextVideos, isFetchingNextVideos, fetchNextVideos, hasNextFeed, isFetchingNextFeed, fetchNextFeed]);

  const handleMusicEndReached = useCallback(() => {
    if (hasNextMusic && !isFetchingNextMusic) fetchNextMusic();
  }, [hasNextMusic, isFetchingNextMusic, fetchNextMusic]);

  const handleSocialEndReached = useCallback(() => {
    if (hasNextSocial && !isFetchingNextSocial) fetchNextSocial();
  }, [hasNextSocial, isFetchingNextSocial, fetchNextSocial]);

  const handleAddressesEndReached = useCallback(() => {
    if (hasNextAddresses && !isFetchingNextAddresses) fetchNextAddresses();
  }, [hasNextAddresses, isFetchingNextAddresses, fetchNextAddresses]);

  const handleWorkplacesEndReached = useCallback(() => {
    if (hasNextWorkplaces && !isFetchingNextWorkplaces) fetchNextWorkplaces();
  }, [hasNextWorkplaces, isFetchingNextWorkplaces, fetchNextWorkplaces]);

  const optionsSheetRef = useRef<TrueSheet>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { data: myProfile } = useProfile('me', true);

  const handlePostDeleted = useCallback(() => {
    setSelectedPost(null);
  }, []);

  const handlePostOptionsPress = useCallback((post: Post) => {
    setSelectedPost(post);
    optionsSheetRef.current?.present();
  }, []);


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
    photos: photos,
    onImagePress: handleImagePress,
    loading: isPhotosLoading,
    fetchingMore: isFetchingNextPhotos
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
    photos: videos, // This hook expects Media[] in 'photos' prop
    onVideoPress: handleVideoPress,
    loading: isVideosLoading,
    fetchingMore: isFetchingNextVideos
  });

  // Stable tab-change callback for the header — using a ref wrapper means
  // ProfileHeader never re-renders just because handleTabChange identity changed
  const stableTabChange = useCallback((tab: TabType) => {
    handleTabChangeRef.current?.(tab);
  }, []);

  // Single header — deps exclude activeTab so ProfileHeader doesn't re-render
  // on every tab press (cover image, avatar, bio, etc. all stay mounted)
  const ListHeader = useMemo(() => (
    <ProfileHeader
      scrollY={scrollY}
      activeTab={activeTab}
      onTabChange={stableTabChange}
      profile={profile}
      isMe={isMe}
      musicSheetRef={musicSheetRef}
      socialSheetRef={socialSheetRef}
      addressSheetRef={addressSheetRef}
      workplaceSheetRef={workplaceSheetRef}
      workplaces={workplaces}
      music={music}
      socialLinks={socialLinks}
      addresses={addresses}
      imageCount={photosPaging?.pages[0]?.pagination?.total || 0}
      videoCount={videosPaging?.pages[0]?.pagination?.total || 0}
      postCount={feedPaging?.pages[0]?.pagination?.total || 0}
    />
  ), [scrollY, profile, isMe, workplaces, music, socialLinks, addresses, photosPaging, videosPaging, feedPaging, stableTabChange, activeTab]);

  // Dynamic data based on tab
  const data = useMemo(() => {
    switch (activeTab) {
      case "Information": return [{ _type: 'info' as const }];
      case "Images": return imageData;
      case "Videos": return videoData;
      case "Feed": return feedPosts;
    }
  }, [activeTab, imageData, videoData, feedPosts]);

  // Dynamic numColumns based on tab
  const numColumns = useMemo(() => {
    switch (activeTab) {
      case "Images": return imageNumColumns;
      case "Videos": return videoNumColumns;
      default: return 1;
    }
  }, [activeTab, imageNumColumns, videoNumColumns]);

  // Dynamic estimatedItemSize based on tab
  const estimatedItemSize = useMemo(() => {
    switch (activeTab) {
      case "Images": return imageEstimatedItemSize;
      case "Videos": return videoEstimatedItemSize;
      case "Feed": return 400;
      case "Information": return 600;
      default: return 200;
    }
  }, [activeTab, imageEstimatedItemSize, videoEstimatedItemSize]);

  // Dynamic renderItem based on tab
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    switch (activeTab) {
      case "Information":
        return <InfoCard profile={profile} />;
      case "Images":
        return renderImageItem({ item, index, separators: {} as any });
      case "Videos":
        return renderVideoItem({ item, index, separators: {} as any });
      case "Feed":
        return <PostItem post={item as Post} key={item.id} onOptionsPress={handlePostOptionsPress} />;
    }
  }, [activeTab, profile, renderImageItem, renderVideoItem]);

  // Dynamic keyExtractor
  const keyExtractor = useCallback((item: any, index: number) => {
    switch (activeTab) {
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
  }, [activeTab, imageKeyExtractor, videoKeyExtractor]);

  // Empty component
  const ListEmpty = useMemo(() => {
    if (activeTab === "Information") return null;
    let title = "";
    let message = "";
    switch (activeTab) {
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
      <View style={[common.card, styles.emptyCard]}>
        <Text style={common.subheading}>{title}</Text>
        <Text style={[common.body, styles.emptyMessage]}>{message}</Text>
      </View>
    );
  }, [activeTab, common]);

  // Loading / Error state (Show Shimmer with Pull to Refresh)
  if (!profile) {
    return (
      <View style={common.screen}>
        <ScrollView
          style={common.screen}
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isProfileRefetching}
              onRefresh={onRefresh}
              tintColor={colors.text}
              colors={[colors.text]}
              style={{ zIndex: 10 }}
              progressViewOffset={inset.top + 30}
            />
          }
        >
          <ShimmerEffect
            isLoading={true}
            style={{ width: "100%", height: COVER_HEIGHT, backgroundColor: colors.divider }}
          />
          <View style={{
            borderRadius: 8,
            marginTop: -8,
            backgroundColor: colors.background,
            flex: 1
          }}>
            <View style={common.screenPadding}>
              {/* Avatar */}
              <View style={[common.row, { marginTop: -55, gap: 5 }]}>
                <View style={[common.avatarLarge, { overflow: 'hidden', borderWidth: 3, borderColor: colors.background, backgroundColor: colors.background }]}>
                  <ShimmerEffect
                    isLoading={true}
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
              </View>

              {/* Name & Bio */}
              <View style={{ marginTop: 8, gap: 8 }}>
                <ShimmerEffect isLoading={true} style={{ width: 150, height: 24, borderRadius: 8, backgroundColor: colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: 100, height: 14, borderRadius: 8, backgroundColor: colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: '80%', height: 16, borderRadius: 8, marginTop: 8, backgroundColor: colors.divider }} />
              </View>

              {/* Scrollable Items (Music/Socials) */}
              <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
                <ShimmerEffect isLoading={true} style={{ width: 170, height: 70, borderRadius: 35, backgroundColor: colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: 170, height: 70, borderRadius: 35, backgroundColor: colors.divider }} />
              </View>

              {/* Tabs */}
              <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
                <ShimmerEffect isLoading={true} style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: colors.divider }} />
                <ShimmerEffect isLoading={true} style={{ width: 100, height: 36, borderRadius: 18, backgroundColor: colors.divider }} />
              </View>

              {/* Grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, gap: 10 }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <ShimmerEffect key={i} isLoading={true} style={{ width: '31%', aspectRatio: 1, borderRadius: 8, backgroundColor: colors.divider }} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          action={{
            label: 'Retry',
            onPress: () => {
              onRefresh();
            },
          }}>
          Failed to load profile
        </Snackbar>
      </View>
    );
  }

  const flatList = (
    <AnimatedFlashList
      key={`flashlist-${numColumns}`}
      ref={listRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      contentContainerStyle={[
        { paddingBottom: isMe ? 100 + inset.bottom : inset.bottom + 10 }
      ]}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isProfileRefetching}
          onRefresh={onRefresh}
          tintColor={colors.text}
          colors={[colors.text]}
          progressBackgroundColor={colors.card}
          style={{ zIndex: 10 }}
          progressViewOffset={inset.top + 30} // Push spinner below the absolute header
        />
      }
      estimatedItemSize={estimatedItemSize}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
    />
  );

  const formattedImages = sortedUrls.map(url => ({ uri: url }));

  return (
    <View style={common.screen}>
      {/* Sticky Back Button */}
      {/* Sticky Header Container */}
      {!isMe && (
        <View style={{ position: 'absolute', top: inset.top + 8, left: 16, zIndex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>

            {/* 1. BACK BUTTON (Height: 40px) */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                backgroundColor: colors.containerContent, // Or use BlurView here too for consistency
                borderRadius: 999,
                width: 40,
                height: 40,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Ionicons name='chevron-back' size={24} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => musicSheetRef.current?.present()}
              style={{ height: 40, width: 150 }}
            >
              <View style={styles.blurWrapper}>
                <View
                  style={[StyleSheet.absoluteFill, { backgroundColor: colors.containerContent }]}
                />

                <View style={styles.blurContent}>
                  <View style={[styles.artworkContainer, { width: 32, height: 32 }]}>
                    {!hasMusic ? (
                      <View style={[styles.placeholderIcon, { backgroundColor: colors.card }]}>
                        <HeadphonesRoundSoundBold size={18} color={colors.text} />
                      </View>
                    ) : (
                      <TurboImage
                        source={{ uri: currentTrack?.cover_url || '' }}
                        style={styles.artworkImage}
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  <View style={styles.textContainer}>
                    <Text
                      style={[styles.titleText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {hasMusic ? currentTrack?.title : 'Add Music'}
                    </Text>

                    {/* Optional: Hide artist if it gets too cramped, or keep small */}
                    <Text
                      style={[styles.artistText, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {hasMusic ? currentTrack?.artist : 'Select track'}
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
        visible={galleryVisible}
        photos={photos}
        music={music}
        initialIndex={galleryIndex}
        onClose={() => setGalleryVisible(false)}
        profileName={profile?.name}
        isVerified={profile?.is_verified}
      />
      {/* Global gallery for feed posts */}
      <GalleryModal />
      {flatList}

      {/* Floating Scroll to Top Button - Only for non-owner view */}
      {!isMe && (
        <Animated.View
          pointerEvents={showScrollTop ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            bottom: inset.bottom + 20,
            right: 16,
            opacity: scrollTopButtonOpacity,
            zIndex: 1000,
          }}
        >
          <TouchableOpacity
            onPress={() => {
              // Clear saved position for the current tab so coming back doesn't restore the old offset
              scrollPositions.current[activeTab] = 0;
              currentScrollY.current = 0;
              listRef.current?.scrollToOffset({ offset: 0, animated: true });
            }}
            style={{
              backgroundColor: colors.containerContent,
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
            <Ionicons name='chevron-up' size={24} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>
      )}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        action={{
          label: 'Retry',
          onPress: () => {
            onRefresh();
          },
        }}>
        Failed to load profile
      </Snackbar>

      <MusicSheet
        ref={musicSheetRef}
        data={music}
        onEndReached={handleMusicEndReached}
      />
      <SocialSheet
        ref={socialSheetRef}
        data={socialLinks}
        onEndReached={handleSocialEndReached}
      />
      <AddressSheet
        ref={addressSheetRef}
        data={addresses}
        onEndReached={handleAddressesEndReached}
      />
      <WorkplaceSheet
        ref={workplaceSheetRef}
        data={workplaces}
        onEndReached={handleWorkplacesEndReached}
      />
      <PostOptionsSheet
        ref={optionsSheetRef}
        post={selectedPost}
        currentProfileId={myProfile?.id || null}
        onDeleted={handlePostDeleted}
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
// Exported default. Renders a static skeleton during the navigate-in animation
// so the JS thread is free to drive the slide at 60fps. Only after
// InteractionManager.runAfterInteractions (i.e. navigation animation done)
// does it swap in the real ProfileContent with all its hooks and queries.
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

