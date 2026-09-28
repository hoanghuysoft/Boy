import { FlexText } from "@/components/FlexText";
import { PostItem } from "@/components/PostItem";
import {
  CrossPostMode,
  executeCrossPost,
  showCrossPostAlertDialog,
} from "@/components/fprofile/crossPostService";
import { GalleryModal } from "@/components/gallery/GalleryModal";
import { List } from "@/components/list/List";
import { PostOptionsSheet } from "@/components/post";
import {
  extractThreadsProfileInfo,
  getCachedThreadsPost,
  ThreadsProfileHeader,
} from "@/components/tprofile";
import { Shimmer, ShimmerGroup } from "@/components/ui/molecules/Shimmer/Shimmer";
import { useThemeContext } from "@/context/ThemeContext";
import {
  ThreadsPostType,
  useThreadsPosts,
  useThreadsUserInfo,
} from "@/services/threads";
import { useProfile } from "@/services/userprofile";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { createCommonStyles } from "@/styles/common";
import { Post } from "@/types/post";
import { ProfileDetail } from "@/types/profiledetail";
import { updateActiveVideoViewAsync } from "@bsky.app/video";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useToast } from "heroui-native/toast";
import { Spinner } from "panelui-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, theme } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const { t } = useTranslation();
  const isDark = theme === "dark";

  // Tab State: 'Threads' | 'Replies' | 'Media' | 'Reposts'
  const [selectedTab, setSelectedTab] = useState<ThreadsPostType>('Threads');

  // Read route parameters
  const params = useLocalSearchParams<{
    profile?: string;
    url?: string;
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
      } catch { }
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

  // Extract Threads username or URL from route params or profile links
  const targetInput = useMemo(() => {
    // 1. Direct url parameter
    if (params.url && typeof params.url === "string" && params.url.trim()) {
      return params.url.trim();
    }
    // 2. Direct handle parameter
    if (params.handle && typeof params.handle === "string" && params.handle.trim()) {
      return params.handle.trim();
    }
    // 3. Extract from social links or profile object
    const info = extractThreadsProfileInfo(parsedSocialLinks, parsedProfile);
    if (info?.rawUrl) return info.rawUrl;
    if (info?.handle) return info.handle;

    return "";
  }, [params.url, params.handle, parsedSocialLinks, parsedProfile]);

  // 1. Fetch Threads User Profile
  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
    isRefetching: isProfileRefetching,
  } = useThreadsUserInfo(targetInput, {
    enabled: !!targetInput,
  });

  // 2. Fetch Threads User Posts (Filtered by Tab)
  const {
    data: postsData,
    isLoading: isPostsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchPosts,
    isRefetching: isPostsRefetching,
  } = useThreadsPosts(targetInput, {
    type: selectedTab,
    enabled: !!targetInput,
  });

  const threadsUser =
    profileData?.result ||
    profileData?.info ||
    profileData?.user ||
    (profileData as any)?.data ||
    profileData;

  // Transform Threads post items to Post models
  const posts: Post[] = useMemo(() => {
    const pages = postsData?.pages;
    if (!pages) return [];
    const rawList = pages.flatMap((page: any) => {
      if (!page) return [];
      if (Array.isArray(page)) return page;
      if (Array.isArray(page.result)) return page.result;
      if (Array.isArray(page.posts)) return page.posts;
      if (Array.isArray(page.data)) return page.data;
      if (Array.isArray(page.items)) return page.items;
      return [];
    });
    const seen = new Set<string>();
    const uniquePosts: Post[] = [];
    for (const item of rawList) {
      const post = getCachedThreadsPost(item, threadsUser);
      if (post && post.id) {
        if (!seen.has(post.id)) {
          seen.add(post.id);
          uniquePosts.push(post);
        }
      }
    }
    return uniquePosts;
  }, [postsData?.pages, threadsUser]);

  const isRefetching = isProfileRefetching || isPostsRefetching;
  const isLoading = isProfileLoading || isPostsLoading;

  // ─── Video Autoplay Integration ────────────────────────────────
  const clearActiveVideo = useFeedVideoStore((s) => s.clearActiveVideo);

  useEffect(() => {
    return () => {
      clearActiveVideo();
    };
  }, [clearActiveVideo]);

  useFocusEffect(
    useCallback(() => {
      updateActiveVideoViewAsync();
      return () => {
        clearActiveVideo();
      };
    }, [clearActiveVideo])
  );

  useEffect(() => {
    if (posts.length > 0) {
      const timer = setTimeout(() => {
        updateActiveVideoViewAsync();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [posts.length]);

  // ─── Cross-Post Integration ────────────────────────────────────
  const { toast } = useToast();
  const { data: myProfile } = useProfile("me", true);
  const targetProfile = parsedProfile || myProfile;

  const handleCrossPostPress = useCallback(
    (post: Post) => {
      const targetProfileId = targetProfile?.id;
      if (!targetProfileId) {
        toast.show({
          label: "Error",
          description: "Target profile is not loaded yet.",
          variant: "danger",
        });
        return;
      }

      showCrossPostAlertDialog(
        post,
        targetProfile?.name || "",
        async (mode: CrossPostMode, isAdult?: boolean) => {
          toast.show({
            label: "Cross-posting...",
            description: "Publishing Threads content to WeLove...",
          });

          try {
            await executeCrossPost(targetProfileId, post, mode, undefined, isAdult);
            toast.show({
              label: "Cross-posted Successfully",
              description: `Post published as ${targetProfile?.name || "profile"}.`,
              variant: "success",
            });
          } catch (error: any) {
            console.error("Cross-post failed:", error);
            toast.show({
              label: "Cross-post Failed",
              description: error.message || "Failed to create post.",
              variant: "danger",
            });
          }
        }
      );
    },
    [targetProfile, toast]
  );

  const handleRefresh = useCallback(async () => {
    await refetchProfile();
    await refetchPosts();
  }, [refetchProfile, refetchPosts]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ─── Post Options Sheet State ─────────────────────────────────
  const optionsSheetRef = useRef<any>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleOptionsPress = useCallback((post: Post) => {
    setSelectedPost(post);
    optionsSheetRef.current?.present();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <View style={{ marginBottom: 30 }}>
        <PostItem
          post={item}
          metricsOnly={true}
          onCrossPostPress={handleCrossPostPress}
          onOptionsPress={handleOptionsPress}
        />
      </View>
    ),
    [handleCrossPostPress, handleOptionsPress]
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
                <Shimmer style={{ width: "100%", height: 260, borderRadius: 12 }} />
              </View>
            </ShimmerGroup>
          ))}
        </View>
      );
    }

    if (!targetInput) {
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
            <Ionicons name="at" size={36} color={colors.muted} />
          </View>
          <FlexText style={[common.heading, { fontSize: 20, marginTop: 20, marginBottom: 8 }]}>
            No Threads Link Found
          </FlexText>
          <FlexText style={[common.body, { color: colors.muted, textAlign: "center", lineHeight: 22 }]}>
            This profile does not have a linked Threads account yet.
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
          <Ionicons name="at" size={36} color={colors.muted} />
        </View>
        <FlexText style={[common.heading, { fontSize: 20, marginTop: 20, marginBottom: 8 }]}>
          No {selectedTab} Yet
        </FlexText>
        <FlexText style={[common.body, { color: colors.muted, textAlign: "center", lineHeight: 22 }]}>
          {threadsUser?.username ? `@${threadsUser.username}` : targetInput} hasn&apos;t posted any {selectedTab.toLowerCase()} on Threads yet.
        </FlexText>
      </View>
    );
  }, [isLoading, targetInput, selectedTab, threadsUser?.username, colors, common, isDark]);

  const ListHeaderComponent = useCallback(
    () => (
      <ThreadsProfileHeader
        user={threadsUser}
        postCount={posts.length}
        isLoading={isProfileLoading}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
      />
    ),
    [threadsUser, posts.length, isProfileLoading, selectedTab]
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

      {/* Posts Timeline using LegendList virtualization */}
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
        getItemType={(item: Post) => {
          const content = item.reposted_post || item;
          if (content.media?.length) return "media";
          if (content.audio_url) return "audio";
          if (content.links?.length) return "link";
          if (content.music) return "music";
          return "text";
        }}
        estimatedItemSize={500}
        recycleItems={true}
        drawDistance={500}
        maintainVisibleContentPosition
      />

      {/* Post Options Sheet with Save to Gallery */}
      <PostOptionsSheet
        ref={optionsSheetRef}
        post={selectedPost}
        isExternal={true}
      />

      <GalleryModal />
    </View>
  );
};

export default TProfileScreen;

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
  emptyIconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
