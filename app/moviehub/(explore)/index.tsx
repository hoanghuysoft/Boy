import AiVideo from '@/assets/images/svg/ai-video.svg';
import { FlexText } from "@/components/FlexText";
import { resolveBlurhash } from "@/components/gallery/fallbackBlurhash";
import { useThemeContext } from "@/context/ThemeContext";
import {
  avatar,
  useCategoriesQuery,
  useCategoryInfiniteQuery,
  useLatestInfiniteQuery,
  useLeastViewedInfiniteQuery,
  usePopularInfiniteQuery,
} from "@/services/shows";
import { createCommonStyles } from "@/styles/common";
import type { VideoCard } from "@/types/shows";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from 'heroui-native/spinner';
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Tab types ────────────────────────────────────────────────────────────────
type BuiltinTabId = "all" | "popular" | "new" | "hidden";
type Tab =
  | { kind: "builtin"; id: BuiltinTabId; label: string }
  | { kind: "category"; slug: string; label: string };

const BUILTIN_TABS: Tab[] = [
  { kind: "builtin", id: "all", label: "All" },
  { kind: "builtin", id: "popular", label: "Popular" },
  { kind: "builtin", id: "new", label: "New" },
  { kind: "builtin", id: "hidden", label: "Hidden Gems" },
];

/** Extract slug from category URL: "https://traingon.top/category/south-korea" → "south-korea" */
function slugFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  } catch {
    // Fallback: strip trailing slash and grab last segment
    return url.replace(/\/$/, "").split("/").pop() ?? "";
  }
}

// ─── Helper: flatten infinite pages ──────────────────────────────────────────
function flattenPages<T extends { items: VideoCard[] }>(
  pages: T[] | undefined
): VideoCard[] {
  if (!pages) return [];
  const seen = new Set<string>();
  return pages.flatMap((p) =>
    p.items.filter((item) => {
      if (!item.video_url || seen.has(item.video_url)) return false;
      seen.add(item.video_url);
      return true;
    })
  );
}

/** Fisher-Yates shuffle (returns a new array, seed-agnostic but stable per call) */
function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── "All" hook — parallel fetch + shuffle ────────────────────────────────────
function useAllShuffled(seed: number) {
  const popular = usePopularInfiniteQuery(true);
  const latest = useLatestInfiniteQuery(true);
  const least = useLeastViewedInfiniteQuery(true);

  const isLoading = popular.isLoading || latest.isLoading || least.isLoading;
  const isRefetching = popular.isRefetching || latest.isRefetching || least.isRefetching;
  const isFetchingNextPage = false; // "All" is a fixed single-shuffle, no pagination
  const hasNextPage = false;

  const data = useMemo(() => {
    if (isLoading) return [];
    const raw = [
      ...flattenPages(popular.data?.pages as any),
      ...flattenPages(latest.data?.pages as any),
      ...flattenPages(least.data?.pages as any),
    ];
    // Dedup
    const seen = new Set<string>();
    const deduped = raw.filter((item) => {
      if (!item.video_url || seen.has(item.video_url)) return false;
      seen.add(item.video_url);
      return true;
    });
    // seed in deps triggers re-shuffle when user taps "All" again
    void seed;
    return shuffleArray(deduped);

  }, [popular.data, latest.data, least.data, isLoading, seed]);

  const refetch = useCallback(() => {
    popular.refetch();
    latest.refetch();
    least.refetch();
  }, [popular, latest, least]);

  return { data, isLoading, isRefetching, isFetchingNextPage, hasNextPage, refetch, fetchNextPage: () => { } };
}

// ─── Per-tab data hook ────────────────────────────────────────────────────────
function useTabData(tab: Tab, shuffleSeed: number) {
  const isAll = tab.kind === "builtin" && tab.id === "all";
  const isPopular = tab.kind === "builtin" && tab.id === "popular";
  const isNew = tab.kind === "builtin" && tab.id === "new";
  const isHidden = tab.kind === "builtin" && tab.id === "hidden";
  const slug = tab.kind === "category" ? tab.slug : undefined;

  // All hooks must be called unconditionally (Rules of Hooks)
  const allData = useAllShuffled(shuffleSeed);
  const popular = usePopularInfiniteQuery(isPopular);
  const latest = useLatestInfiniteQuery(isNew);
  const least = useLeastViewedInfiniteQuery(isHidden);
  const category = useCategoryInfiniteQuery(slug);

  if (isAll) return { ...allData, data: { pages: [{ items: allData.data }] } as any };
  if (isPopular) return popular;
  if (isNew) return latest;
  if (isHidden) return least;
  return category;
}

// ─── Main screen ─────────────────────────────────────────────────────────────
const ExploreScreen = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selectedTab, setSelectedTab] = useState<Tab>(BUILTIN_TABS[0]);
  // Increment to re-shuffle "All" feed on repeated taps
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const thumbHeight = Math.round(width * (9 / 16));

  // Real categories from API — extract slug from URL
  const categoriesQuery = useCategoriesQuery();
  const categoryTabs = useMemo<Tab[]>(
    () =>
      (categoriesQuery.data?.categories ?? []).map((c) => ({
        kind: "category",
        slug: slugFromUrl(c.url),
        label: c.name,
      })),
    [categoriesQuery.data]
  );

  const tabs = useMemo<Tab[]>(
    () => [...BUILTIN_TABS, ...categoryTabs],
    [categoryTabs]
  );

  // Data for selected tab
  const tabQuery = useTabData(selectedTab, shuffleSeed);
  const items = useMemo(
    () => flattenPages(tabQuery.data?.pages as any),
    [tabQuery.data]
  );

  const isLoading = tabQuery.isLoading;
  const isRefetching = tabQuery.isRefetching;
  const isFetchingNext = tabQuery.isFetchingNextPage;
  const hasNextPage = tabQuery.hasNextPage;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNext) {
      tabQuery.fetchNextPage();
    }
  }, [hasNextPage, isFetchingNext, tabQuery]);

  const handleRefresh = useCallback(() => {
    tabQuery.refetch();
  }, [tabQuery]);

  const handleTabChange = useCallback((tab: Tab) => {
    // Re-shuffle when tapping "All" again (even if already selected)
    if (tab.kind === "builtin" && tab.id === "all") {
      setShuffleSeed((prev) => prev + 1);
    }
    setSelectedTab(tab);
  }, []);

  // ─── Render item ────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: VideoCard }) => {
      const matchedAvatar = avatar.find(
        (a) => a.name !== "Default" && item.title.toLowerCase().includes(a.name.toLowerCase())
      ) || avatar.find((a) => a.name === "Default") || avatar[0];

      return (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/moviehub/(explore)/video_detail",
              params: { video_url: item.video_url },
            })
          }
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
        >
          {/* Thumbnail — full width, 16:9 */}
          <View style={{ width, height: thumbHeight, backgroundColor: colors.surfaceContainerLow }}>
            <ExpoImage
              source={{ uri: item.thumb_url }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              placeholder={{ blurhash: resolveBlurhash((item as any).blurhash, item.video_url || item.thumb_url) }}
            />
            {/* Duration badge */}
            {!!item.duration && (
              <View style={styles.durationBadge}>
                <FlexText style={styles.durationText}>{item.duration}</FlexText>
              </View>
            )}
          </View>

          {/* Info row below thumbnail */}
          <View style={styles.infoRow}>
            <ExpoImage
              source={{ uri: matchedAvatar.url }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: matchedAvatar.background || colors.surfaceContainerHigh,
              }}
              contentFit='cover'
            />
            <View style={{ flex: 1, gap: 2 }}>
              <FlexText numberOfLines={2} style={[styles.title, { color: colors.onSurface, fontSize: 18, fontWeight: '500' }]}>
                {item.title}
              </FlexText>
              <FlexText numberOfLines={1} style={[styles.meta, { color: colors.onSurfaceVariant, fontSize: 13 }]}>
                {[item.views, item.duration].filter(Boolean).join(" • ")}
              </FlexText>
            </View>
            <TouchableOpacity style={{ padding: 4, marginTop: -2 }} activeOpacity={0.7}>
              <Ionicons name="ellipsis-vertical" size={20} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        </Pressable>
      );
    },
    [colors, width, thumbHeight],
  );

  const keyExtractor = useCallback(
    (item: VideoCard, index: number) => item.video_url || String(index),
    [],
  );

  // ─── Footer (load more indicator) ──────────────────────────────────────────
  const renderFooter = useCallback(() => {
    if (!isFetchingNext) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: "center" }}>
        <Spinner size='md' color={colors.onSurface} />
      </View>
    );
  }, [isFetchingNext, colors.onSurface]);

  // ─── Header (title + chips) ─────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={{ paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, paddingBottom: 16 }}>
        <FlexText style={{ color: colors.onSurface, fontSize: 24, fontWeight: 'bold' }}>Explore</FlexText>
        <TouchableOpacity><AiVideo width={32} height={32} color={colors.onSurface} /></TouchableOpacity>
      </View>
      {/* Category chip row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}
      >
        {tabs.map((tab) => {
          const isSelected =
            tab.kind === selectedTab.kind &&
            (tab.kind === "builtin"
              ? (tab as Extract<Tab, { kind: "builtin" }>).id === (selectedTab as Extract<Tab, { kind: "builtin" }>).id
              : (tab as Extract<Tab, { kind: "category" }>).slug === (selectedTab as Extract<Tab, { kind: "category" }>).slug);

          const key = tab.kind === "builtin" ? tab.id : tab.slug;

          return (
            <TouchableOpacity
              key={key}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.75}
            >
              <SquircleView cornerSmoothing={60} preserveSmoothing style={[
                styles.chip,
                isSelected
                  ? { backgroundColor: colors.onSurface }
                  : { backgroundColor: colors.surfaceContainerHigh },
              ]}>
                <FlexText
                  style={[
                    styles.chipText,
                    { color: isSelected ? colors.surface : colors.onSurface, fontSize: 14 },
                  ]}
                >
                  {tab.label}
                </FlexText>
              </SquircleView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // ─── Skeleton empty state ───────────────────────────────────────────────────
  const renderEmpty = () => {
    if (!isLoading) return null;
    return (
      <SkeletonGroup isLoading={true} variant="shimmer">
        <View style={{ gap: 20 }}>
          {[1, 2, 3].map((key) => (
            <View key={key}>
              <SkeletonGroup.Item style={{ width, height: thumbHeight }} />
              <View style={styles.infoRow}>
                <View style={{ flex: 1, gap: 8 }}>
                  <SkeletonGroup.Item style={{ height: 14, width: "85%", borderRadius: 4 }} />
                  <SkeletonGroup.Item style={{ height: 12, width: "55%", borderRadius: 4 }} />
                </View>
              </View>
            </View>
          ))}
        </View>
      </SkeletonGroup>
    );
  };

  return (
    <View style={[common.screen, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={renderFooter()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          gap: 20,
        }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.onSurface}
            colors={[colors.onSurface]}
            progressBackgroundColor={colors.surfaceContainerHigh}
            progressViewOffset={insets.top}
          />
        }
      />
    </View>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create({
  chip: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    fontWeight: "400",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  hotBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(220, 38, 38, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hotText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
