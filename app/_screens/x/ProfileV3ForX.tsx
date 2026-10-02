import { GalleryModal } from "@/components/gallery/GalleryModal";
import { PagerWithHeader, type PagerWithHeaderChildParams } from "@/components/pager/PagerWithHeader";
import { PostOptionsSheet } from "@/components/post";
import {
  CrossPostMode,
  executeCrossPost,
  showCrossPostAlertDialog,
} from "@/components/fprofile/crossPostService";
import { getCachedFxTwitterPost } from "@/components/fprofile/transformFxPost";
import { extractXProfileInfo } from "@/components/profile/header/utils";
import {
  XProfileFloatingBar,
  XProfileHeaderV3,
  XProfileSkeletonInner,
  XProfileTabList,
} from "@/components/x_profile";
import { useThemeContext } from "@/context/ThemeContext";
import { useFxUserMedia, useFxUserProfile, useFxUserStatuses } from "@/services/fxtwitter";
import { useProfile } from "@/services/userprofile";
import { useFeedVideoStore } from "@/stores/feedVideo";
import { useXUsersStore } from "@/stores/xUsers";
import { createCommonStyles } from "@/styles/common";
import { Post } from "@/types/post";
import { ProfileDetail } from "@/types/profiledetail";
import { updateActiveVideoViewAsync } from "@bsky.app/video";
import { BlurTargetView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { Tabs } from "heroui-native/tabs";
import { useToast } from "heroui-native/toast";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import {
  interpolate,
  runOnUI,
  scrollTo,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileV3ForXScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const { toast } = useToast();
  const { height: windowHeight } = useWindowDimensions();
  const blurTargetRef = useRef<any>(null);

  // ─── Route Parameters ────────────────────────────────────────────────────────
  const params = useLocalSearchParams<{
    handle?: string;
    profile?: string;
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

  const targetHandle = useMemo(() => {
    if (params.handle && typeof params.handle === "string" && params.handle.trim()) {
      return params.handle.trim().replace(/^@/, "");
    }
    const info = extractXProfileInfo(parsedSocialLinks, parsedProfile);
    if (info?.handle) {
      return info.handle;
    }
    return "";
  }, [params.handle, parsedSocialLinks, parsedProfile]);

  const { data: myProfile } = useProfile("me", true);
  const targetProfile = parsedProfile || myProfile;

  // ─── Tabs Configuration & Lazy Loading ──────────────────────────────────────
  const tabKeys = useMemo(() => ["Posts", "Media"], []);
  const [activeTab, setActiveTab] = useState<"Posts" | "Media">("Posts");
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set(["Posts"]));

  const handleTabChange = useCallback((tab: "Posts" | "Media") => {
    setActiveTab(tab);
    setVisitedTabs((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  const isMediaEnabled = !!targetHandle && visitedTabs.has("Media");

  // ─── X Users Store (Follow / Save tracking) ──────────────────────────────────
  const { users: storedUsers, addCustomUser, removeUser } = useXUsersStore();
  const isSavedCustom = useMemo(() => {
    if (!targetHandle) return false;
    return !!storedUsers[targetHandle.toLowerCase()];
  }, [storedUsers, targetHandle]);

  // ─── 1. Fetch User Profile ───────────────────────────────────────────────────
  const {
    data: profileData,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
    isRefetching: isProfileRefetching,
  } = useFxUserProfile(targetHandle, {
    about_account: true,
    enabled: !!targetHandle,
  });

  const user = profileData?.user;

  // ─── 2. Fetch Tab 1: Posts / Statuses ─────────────────────────────────────────
  const {
    data: statusesData,
    isLoading: isStatusesLoading,
    fetchNextPage: fetchNextStatuses,
    hasNextPage: hasNextStatuses,
    isFetchingNextPage: isFetchingNextStatuses,
    refetch: refetchStatuses,
    isRefetching: isStatusesRefetching,
  } = useFxUserStatuses(targetHandle, {
    count: 20,
    enabled: !!targetHandle,
  });

  // ─── 3. Fetch Tab 2: Media Posts (Lazy loaded when visited) ───────────────────
  const {
    data: mediaData,
    isLoading: isMediaLoading,
    fetchNextPage: fetchNextMedia,
    hasNextPage: hasNextMedia,
    isFetchingNextPage: isFetchingNextMedia,
    refetch: refetchMedia,
    isRefetching: isMediaRefetching,
  } = useFxUserMedia(targetHandle, {
    count: 20,
    enabled: isMediaEnabled,
  });

  // ─── Deduplicated Transformation ─────────────────────────────────────────────
  const posts: Post[] = useMemo(() => {
    const pages = statusesData?.pages;
    if (!pages) return [];
    const rawList = pages.flatMap((page) => page.results || []);

    const seen = new Set<string>();
    const uniquePosts: Post[] = [];
    for (const item of rawList) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        uniquePosts.push(getCachedFxTwitterPost(item));
      }
    }
    return uniquePosts;
  }, [statusesData?.pages]);

  const mediaPosts: Post[] = useMemo(() => {
    const pages = mediaData?.pages;
    if (!pages) return [];
    const rawList = pages.flatMap((page) => page.results || []);

    const seen = new Set<string>();
    const uniquePosts: Post[] = [];
    for (const item of rawList) {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        uniquePosts.push(getCachedFxTwitterPost(item));
      }
    }
    return uniquePosts;
  }, [mediaData?.pages]);

  // ─── Video Autoplay Lifecycle ────────────────────────────────────────────────
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
    if (posts.length > 0 || mediaPosts.length > 0) {
      const timer = setTimeout(() => {
        updateActiveVideoViewAsync();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [posts.length, mediaPosts.length]);

  // ─── Header Avatar Spring Animation ──────────────────────────────────────────
  const headerAvatarProgress = useSharedValue(0);
  const showHeaderAvatarRef = useRef(false);

  const handleScrollY = useCallback(
    (y: number) => {
      const shouldShow = y > 160;
      if (shouldShow !== showHeaderAvatarRef.current) {
        showHeaderAvatarRef.current = shouldShow;
        headerAvatarProgress.value = withSpring(shouldShow ? 1 : 0, {
          damping: 18,
          stiffness: 220,
          mass: 0.6,
        });
      }
    },
    [headerAvatarProgress]
  );

  const headerAvatarContainerStyle = useAnimatedStyle(() => {
    const progress = headerAvatarProgress.value;
    return {
      opacity: progress,
      transform: [
        { scale: interpolate(progress, [0, 1], [0.6, 1], "clamp") },
        { translateY: interpolate(progress, [0, 1], [10, 0], "clamp") },
      ],
    };
  });

  // ─── Actions & Handlers ──────────────────────────────────────────────────────
  const handleToggleSave = useCallback(() => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isSavedCustom) {
      removeUser(user.screen_name);
      toast.show({
        label: "Unfollowed",
        description: `@${user.screen_name} removed from X list`,
        variant: "default",
      });
    } else {
      addCustomUser(user);
      toast.show({
        label: "Account Saved",
        description: `@${user.screen_name} added to X list`,
        variant: "success",
      });
    }
  }, [user, isSavedCustom, removeUser, addCustomUser, toast]);

  const handleRefresh = useCallback(() => {
    refetchProfile();
    refetchStatuses();
    if (visitedTabs.has("Media")) {
      refetchMedia();
    }
  }, [refetchProfile, refetchStatuses, refetchMedia, visitedTabs]);

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
            description: "Publishing post to WeLove...",
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

  // ─── Options Sheet ───────────────────────────────────────────────────────────
  const optionsSheetRef = useRef<any>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleOptionsPress = useCallback((post: Post) => {
    setSelectedPost(post);
    optionsSheetRef.current?.present();
  }, []);

  // ─── PagerWithHeader Renderers ───────────────────────────────────────────────
  const tabItems = useMemo(() => ["Posts", "Media"], []);

  const renderHeader = useCallback(
    ({ setMinimumHeight }: { setMinimumHeight: (h: number) => void }) => {
      setMinimumHeight(insets.top + 56);
      return (
        <XProfileHeaderV3
          user={user}
          postCount={posts.length}
          mediaCount={mediaPosts.length}
          isSavedCustom={isSavedCustom}
          onToggleSave={handleToggleSave}
        />
      );
    },
    [insets.top, user, posts.length, mediaPosts.length, isSavedCustom, handleToggleSave]
  );

  const postsListRef = useRef<any>(null);
  const mediaListRef = useRef<any>(null);

  const scrollToTop = useCallback(() => {
    const refOrInstance = activeTab === "Posts" ? postsListRef.current : mediaListRef.current;
    if (!refOrInstance) return;

    // Resolve underlying list instance if a Ref object is held
    const instance = refOrInstance.current !== undefined ? refOrInstance.current : refOrInstance;

    if (instance && typeof instance.scrollToOffset === "function") {
      instance.scrollToOffset({ offset: 0, animated: true });
    } else if (instance && typeof instance.scrollTo === "function") {
      instance.scrollTo({ y: 0, animated: true });
    } else if (instance && typeof instance.scrollToIndex === "function") {
      instance.scrollToIndex({ index: 0, animated: true });
    } else {
      try {
        const animatedRef = refOrInstance.current !== undefined ? refOrInstance : { current: instance };
        runOnUI(scrollTo)(animatedRef, 0, 0, true);
      } catch (err) {
        console.warn("Could not scroll to top:", err);
      }
    }
  }, [activeTab]);

  const renderTabBar = useCallback(
    ({
      items,
      currentPage,
      onSelect,
    }: {
      items: string[];
      currentPage: number;
      onSelect?: (index: number) => void;
    }) => {
      const activeTabVal = tabKeys[currentPage];
      return (
        <View style={{ paddingHorizontal: 12 }}>
          <Tabs
            value={activeTabVal}
            onValueChange={(val: any) => {
              const idx = tabKeys.indexOf(val);
              if (idx !== -1) {
                Haptics.selectionAsync();
                if (idx === currentPage) {
                  scrollToTop();
                } else {
                  handleTabChange(val as "Posts" | "Media");
                  onSelect?.(idx);
                }
              }
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
    },
    [tabKeys, handleTabChange, scrollToTop]
  );

  const handleEndReachedStatuses = useCallback(() => {
    if (hasNextStatuses && !isFetchingNextStatuses) {
      fetchNextStatuses();
    }
  }, [hasNextStatuses, isFetchingNextStatuses, fetchNextStatuses]);

  const handleEndReachedMedia = useCallback(() => {
    if (hasNextMedia && !isFetchingNextMedia) {
      fetchNextMedia();
    }
  }, [hasNextMedia, isFetchingNextMedia, fetchNextMedia]);

  const renderPostsTab = useCallback(
    ({ headerHeight, scrollElRef }: PagerWithHeaderChildParams) => {
      postsListRef.current = scrollElRef;
      return (
        <XProfileTabList
          data={posts}
          scrollElRef={scrollElRef}
          headerHeight={headerHeight}
          windowHeight={windowHeight}
          bottomInset={insets.bottom}
          isRefetching={isStatusesRefetching}
          isLoading={isStatusesLoading}
          isFetchingNextPage={isFetchingNextStatuses}
          onRefresh={handleRefresh}
          onEndReached={handleEndReachedStatuses}
          onScrollY={handleScrollY}
          onCrossPostPress={handleCrossPostPress}
          onOptionsPress={handleOptionsPress}
          emptyTitle="No Posts Yet"
          emptySubtitle={`@${targetHandle} has not posted anything on X yet.`}
          emptyIconName="chatbubbles-outline"
        />
      );
    },
    [
      posts,
      windowHeight,
      insets.bottom,
      isStatusesRefetching,
      isStatusesLoading,
      isFetchingNextStatuses,
      handleRefresh,
      handleEndReachedStatuses,
      handleScrollY,
      handleCrossPostPress,
      handleOptionsPress,
      targetHandle,
    ]
  );

  const renderMediaTab = useCallback(
    ({ headerHeight, scrollElRef }: PagerWithHeaderChildParams) => {
      mediaListRef.current = scrollElRef;
      return (
        <XProfileTabList
          data={mediaPosts}
          scrollElRef={scrollElRef}
          headerHeight={headerHeight}
          windowHeight={windowHeight}
          bottomInset={insets.bottom}
          isRefetching={isMediaRefetching}
          isLoading={isMediaLoading}
          isFetchingNextPage={isFetchingNextMedia}
          onRefresh={handleRefresh}
          onEndReached={handleEndReachedMedia}
          onScrollY={handleScrollY}
          onCrossPostPress={handleCrossPostPress}
          onOptionsPress={handleOptionsPress}
          emptyTitle="No Media Yet"
          emptySubtitle={`@${targetHandle} has not shared any photos or videos yet.`}
          emptyIconName="images-outline"
        />
      );
    },
    [
      mediaPosts,
      windowHeight,
      insets.bottom,
      isMediaRefetching,
      isMediaLoading,
      isFetchingNextMedia,
      handleRefresh,
      handleEndReachedMedia,
      handleScrollY,
      handleCrossPostPress,
      handleOptionsPress,
      targetHandle,
    ]
  );

  // ─── Loading Skeleton ────────────────────────────────────────────────────────
  if (isProfileLoading && !user) {
    return (
      <View style={common.screen}>
        <XProfileSkeletonInner insets={insets} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={common.screen}>
        <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
          <PagerWithHeader
            items={tabItems}
            isHeaderReady={!!user}
            renderHeader={renderHeader}
            renderTabBar={renderTabBar}
            initialPage={0}
            onPageSelected={(idx) => {
              handleTabChange(tabKeys[idx] as "Posts" | "Media");
            }}
            allowHeaderOverScroll
          >
            {renderPostsTab}
            {renderMediaTab}
          </PagerWithHeader>
        </BlurTargetView>

        {/* Floating Top Bar (Back button, spring avatar, share button) */}
        <XProfileFloatingBar
          topInset={insets.top}
          user={user}
          blurTargetRef={blurTargetRef}
          headerAvatarContainerStyle={headerAvatarContainerStyle}
          onScrollToTop={scrollToTop}
        />

        {/* Post Options Sheet */}
        <PostOptionsSheet
          ref={optionsSheetRef}
          post={selectedPost}
          isExternal={true}
        />
        <GalleryModal />
      </View>
    </View>
  );
}

