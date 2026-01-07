import { Galeria } from "@nandorojo/galeria";
import { useLocalSearchParams, useRouter } from "expo-router";

import { TrueSheet } from "@lodev09/react-native-true-sheet";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import GalleryPreview from 'react-native-gallery-preview';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import InfoCard from '../../components/profile/InfoCard';
import ProfileHeader, { COVER_HEIGHT } from '../../components/profile/ProfileHeader';
import { AddressSheet } from "../../components/profile/sheets/AddressSheet";
import { MusicSheet } from "../../components/profile/sheets/MusicSheet";
import { SocialSheet } from "../../components/profile/sheets/SocialSheet";
import { WorkplaceSheet } from "../../components/profile/sheets/WorkplaceSheet";
import { useImageGrid } from '../../components/profile/useImageGrid';
import { ShimmerEffect } from '../../components/shimmer/Shimmer';
import { useThemeContext } from "../../context/ThemeContext";
import { useProfile } from "../../services/userprofile";
import { getWorkplace } from "../../services/workplace";
import { createCommonStyles } from "../../styles/common";
import { Media } from '../../types/media';



type TabType = "Images" | "Videos" | "Information";

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList as any) as any;

const ProfileScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isMe = params.isMe === 'true';

  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const inset = useSafeAreaInsets();

  // State
  const [activeTab, setActiveTab] = useState<TabType>("Images");

  const {
    data: profile,
    isLoading: isProfileLoading,
    isRefetching: isProfileRefetching,
    refetch: refetchProfile,
    isError: isProfileError
  } = useProfile(id as string, isMe);

  const { data: workplacesData, refetch: refetchWorkplaces } = useQuery({
    queryKey: ['workplaces', profile?.id],
    queryFn: () => getWorkplace(profile!.id),
    enabled: !!profile?.id
  });

  const workplaces = workplacesData || [];

  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

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

  const onScroll = useMemo(() =>
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    ),
    [scrollY]);

  // Handlers
  const handleTabChange = useCallback((tab: TabType) => setActiveTab(tab), []);

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
    }
  }, [refetchProfile, refetchWorkplaces, profile?.id]);

  // Grid Hooks
  const {
    gridData: imageData,
    sortedUrls,
    renderItem: renderImageItem,
    keyExtractor: imageKeyExtractor,
    flatListProps: imageFlatListProps,
    renderQuickPreview: renderImageQuickPreview,
  } = useImageGrid({ containerPadding: 10, photos: profile?.photos, onImagePress: handleImagePress });

  const {
    gridData: videoData,
    renderItem: renderVideoItem,
    keyExtractor: videoKeyExtractor,
    contentContainerStyle: videoContainerStyle,
    flatListProps: videoFlatListProps,
    renderQuickPreview: renderVideoQuickPreview,
  } = useImageGrid({
    containerPadding: 10,
    photos: profile?.videos,
    onVideoPress: handleVideoPress,
  });

  // Single header
  const ListHeader = useMemo(() => (
    <ProfileHeader
      scrollY={scrollY}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      profile={profile}
      isMe={isMe}
      musicSheetRef={musicSheetRef}
      socialSheetRef={socialSheetRef}
      addressSheetRef={addressSheetRef}
      workplaceSheetRef={workplaceSheetRef}
      workplaces={workplaces}
    />
  ), [scrollY, activeTab, handleTabChange, profile, isMe, workplaces]);

  // Dynamic data based on tab
  const data = useMemo(() => {
    switch (activeTab) {
      case "Information": return [{ _type: 'info' as const }];
      case "Images": return imageData;
      case "Videos": return videoData;
    }
  }, [activeTab, imageData, videoData]);

  // Dynamic renderItem based on tab
  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    switch (activeTab) {
      case "Information":
        return <InfoCard profile={profile} />;
      case "Images":
        return renderImageItem({ item, index, separators: {} as any });
      case "Videos":
        return renderVideoItem({ item, index, separators: {} as any });
    }
  }, [activeTab, profile, renderImageItem, renderVideoItem]);

  // Dynamic keyExtractor
  const keyExtractor = useCallback((item: any, index: number) => {
    switch (activeTab) {
      case "Information":
        return 'info';
      case "Images":
        return imageKeyExtractor(item);
      case "Videos":
        return videoKeyExtractor(item);
      default:
        return String(index);
    }
  }, [activeTab, imageKeyExtractor, videoKeyExtractor]);

  // Empty component
  const ListEmpty = useMemo(() => {
    if (activeTab === "Information") return null;
    const title = activeTab === "Images" ? "No Photos" : "No Videos";
    const message = activeTab === "Images"
      ? "No photos have been uploaded yet."
      : "No videos have been uploaded yet.";
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
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
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
          progressBackgroundColor={colors.background}
        />
      }
      estimatedItemSize={150}
    />
  );

  const formattedImages = sortedUrls.map(url => ({ uri: url }));

  return (
    <View style={common.screen}>
      {renderImageQuickPreview()}
      {renderVideoQuickPreview()}
      <GalleryPreview
        isVisible={galleryVisible}
        onRequestClose={() => setGalleryVisible(false)}
        images={formattedImages}
        initialIndex={galleryIndex}
        OverlayComponent={() => (
          <View>
          </View>
        )}
      />
      {sortedUrls.length > 0 ? (
        <Galeria urls={sortedUrls}>{flatList}</Galeria>
      ) : (
        flatList
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
        data={profile?.music || []}
      />
      <SocialSheet
        ref={socialSheetRef}
        data={profile?.social_links || []}
      />
      <AddressSheet
        ref={addressSheetRef}
        data={profile?.addresses || []}
      />
      <WorkplaceSheet
        ref={workplaceSheetRef}
        data={workplaces}
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
});

export default ProfileScreen;
