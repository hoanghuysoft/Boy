import { FlexText } from "@/components/FlexText";
import { PostItem } from "@/components/PostItem";
import { CrossPostDialog } from "@/components/fprofile/CrossPostDialog";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { XProfileHeader } from "@/components/fprofile/XProfileHeader";
import { transformFxTwitterStatusToPost } from "@/components/fprofile/transformFxPost";
import { extractXProfileInfo } from "@/components/profile/header/utils";
import { List } from "@/components/list/List";
import { Shimmer, ShimmerGroup } from "@/components/ui/molecules/Shimmer/Shimmer";
import { useThemeContext } from "@/context/ThemeContext";
import { useFxUserProfile, useFxUserStatuses } from "@/services/fxtwitter";
import { useProfile } from "@/services/userprofile";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { createCommonStyles } from "@/styles/common";
import { Post } from "@/types/post";
import { ProfileDetail } from "@/types/profiledetail";
import { updateActiveVideoViewAsync } from "@bsky.app/video";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Spinner } from "heroui-native/spinner";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, theme } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const { t } = useTranslation();
  const isDark = theme === "dark";

  // Read route parameters
  const params = useLocalSearchParams<{
    profile?: string;
    handle?: string;
    socialLinks?: string;
  }>();

  const parsedProfile: ProfileDetail | null = useMemo(() => {
    if (!params.profile) return null;
    try {
      return typeof params.profile === "string"
        ? JSON.parse(params.profile)
        : params.profile;
    } catch {
      return null;
    }
  }, [params.profile]);

  const parsedSocialLinks: any[] = useMemo(() => {
    if (params.socialLinks) {
      try {
        return typeof params.socialLinks === "string"
          ? JSON.parse(params.socialLinks)
          : params.socialLinks;
      } catch {}
    }
    if (parsedProfile) {
      return (
        (parsedProfile as any)?.social_links ||
        (parsedProfile as any)?.socialLinks ||
        []
      );
    }
    return [];
  }, [params.socialLinks, parsedProfile]);

  // Extract X handle from direct parameter, social links, or profile
  const targetHandle = useMemo(() => {
    // 1. Direct handle parameter passed in router
    if (params.handle && typeof params.handle === "string" && params.handle.trim()) {
      return params.handle.trim().replace(/^@/, "");
    }

    // 2. Extract from social links or profile object
    const info = extractXProfileInfo(parsedSocialLinks, parsedProfile);
    if (info?.handle) {
      return info.handle;
    }

    return "";
  }, [params.handle, parsedSocialLinks, parsedProfile]);

  // 1. Fetch X user profile details
  const {
    data: userProfileData,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
    isRefetching: isProfileRefetching,
  } = useFxUserProfile(targetHandle, {
    about_account: true,
    enabled: !!targetHandle,
  });

  // 2. Fetch user statuses/posts with infinite scroll pagination
  const {
    data: statusesData,
    isLoading: isStatusesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchStatuses,
    isRefetching: isStatusesRefetching,
  } = useFxUserStatuses(targetHandle, {
    count: 20,
    enabled: !!targetHandle,
  });

  // Transform FxTwitter statuses to optimized Post model
  const posts: Post[] = useMemo(() => {
    const pages = statusesData?.pages;
    if (!pages) return [];
    const rawList = pages.flatMap((page) => page.results || []);
    return rawList.map(transformFxTwitterStatusToPost);
  }, [statusesData?.pages]);

  const isRefetching = isProfileRefetching || isStatusesRefetching;
  const isLoading = isProfileLoading || isStatusesLoading;

  // ─── Video Autoplay Integration ────────────────────────────────
  const clearActiveVideo = useFeedVideoStore((s) => s.clearActiveVideo);

  // Clear active video on component unmount
  useEffect(() => {
    return () => {
      clearActiveVideo();
    };
  }, [clearActiveVideo]);

  // Reactivate visible video when navigating to or returning to screen
  useFocusEffect(
    useCallback(() => {
      updateActiveVideoViewAsync();
      return () => {
        clearActiveVideo();
        updateActiveVideoViewAsync();
      };
    }, [clearActiveVideo])
  );

  // Initial video trigger when feed items first render
  useEffect(() => {
    if (posts.length > 0) {
      const timer = setTimeout(() => {
        updateActiveVideoViewAsync();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [posts.length]);

  const { data: myProfile } = useProfile("me", true);
  const targetProfile = parsedProfile || myProfile;

  const [crossPostTarget, setCrossPostTarget] = useState<Post | null>(null);

  const handleCrossPostPress = useCallback((post: Post) => {
    setCrossPostTarget(post);
  }, []);

  const handleRefresh = useCallback(() => {
    refetchProfile();
    refetchStatuses();
  }, [refetchProfile, refetchStatuses]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <View style={{ marginBottom: 30 }}>
        <PostItem
          post={item}
          metricsOnly={true}
          onCrossPostPress={handleCrossPostPress}
        />
      </View>
    ),
    [handleCrossPostPress]
  );

  const renderFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <View style={[styles.refreshIndicator, { backgroundColor: colors.card }]}>
            <Spinner size="md" color={colors.text} />
          </View>
        </View>
      );
    }
    return <View style={{ height: 80 }} />;
  }, [isFetchingNextPage, colors.text, colors.card]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <ShimmerGroup key={i} isLoading>
              <View style={{ marginBottom: 30 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                  <Shimmer style={{ width: 40, height: 40, borderRadius: 20 }} />
                  <View style={{ marginLeft: 12, flex: 1, gap: 6 }}>
                    <Shimmer style={{ width: 128, height: 16, borderRadius: 6 }} />
                    <Shimmer style={{ width: 96, height: 12, borderRadius: 6 }} />
                  </View>
                </View>
                <View style={{ gap: 8, marginBottom: 12 }}>
                  <Shimmer style={{ width: "100%", height: 16, borderRadius: 6 }} />
                  <Shimmer style={{ width: "83%", height: 16, borderRadius: 6 }} />
                  <Shimmer style={{ width: "66%", height: 16, borderRadius: 6 }} />
                </View>
                <Shimmer style={{ width: "100%", height: 192, borderRadius: 12 }} />
              </View>
            </ShimmerGroup>
          ))}
        </View>
      );
    }

    if (!targetHandle) {
      return (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIconContainer,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
              },
            ]}
          >
            <Ionicons name="logo-x" size={36} color={colors.muted} />
          </View>
          <FlexText style={[common.heading, { fontSize: 20, marginTop: 20, marginBottom: 8 }]}>
            No X Handle Found
          </FlexText>
          <FlexText style={[common.body, { color: colors.muted, textAlign: "center", lineHeight: 22 }]}>
            This profile does not have a linked X / Twitter account yet.
          </FlexText>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View
          style={[
            styles.emptyIconContainer,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.04)",
            },
          ]}
        >
          <Ionicons name="logo-x" size={36} color={colors.muted} />
        </View>
        <FlexText style={[common.heading, { fontSize: 20, marginTop: 20, marginBottom: 8 }]}>
          No Posts Yet
        </FlexText>
        <FlexText style={[common.body, { color: colors.muted, textAlign: "center", lineHeight: 22 }]}>
          @{targetHandle} hasn&apos;t posted anything on X yet.
        </FlexText>
      </View>
    );
  }, [isLoading, targetHandle, colors, common, isDark]);

  const ListHeaderComponent = useCallback(
    () => (
      <XProfileHeader
        user={userProfileData?.user}
        postCount={posts.length}
        isLoading={isProfileLoading}
      />
    ),
    [userProfileData?.user, posts.length, isProfileLoading]
  );

  return (
    <View style={common.screen}>
      {/* Floating Back Button */}
      <View style={[styles.backButtonContainer, { top: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          style={[
            styles.backButton,
            {
              backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.85)",
            },
          ]}
        >
          <Ionicons name="chevron-back" size={24} color={isDark ? "#FFF" : "#000"} />
        </TouchableOpacity>
      </View>

      {/* Posts Timeline using LegendList with high performance virtualization and autoplay */}
      <List
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        refreshing={isRefetching}
        onRefresh={handleRefresh}
        refreshTintColor={colors.text}
        progressBackgroundColor={colors.card}
        progressViewOffset={insets.top + 50}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : undefined}
        estimatedItemSize={250}
        recycleItems={false}
        maintainVisibleContentPosition
      />

      <GalleryModal />

      <CrossPostDialog
        post={crossPostTarget}
        targetProfile={targetProfile}
        isOpen={crossPostTarget !== null}
        onClose={() => setCrossPostTarget(null)}
      />
    </View>
  );
};

export default FProfileScreen;

const styles = StyleSheet.create({
  backButtonContainer: {
    position: "absolute",
    left: 16,
    zIndex: 1000,
  },
  backButton: {
    borderRadius: 999,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  footerLoader: {
    paddingVertical: 24,
    alignItems: "center",
  },
  refreshIndicator: {
    borderRadius: 999,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    paddingVertical: 60,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
