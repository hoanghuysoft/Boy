import { FlexText } from "@/components/FlexText";
import { SearchHistoryPills } from "@/components/search/SearchHistoryPills";
import { useThemeContext } from "@/context/ThemeContext";
import { useCategoriesQuery, useLatestInfiniteQuery, usePopularInfiniteQuery } from "@/services/shows";
import { useSearchInfiniteQuery } from "@/services/shows/search";
import { useLikedVideosStore } from "@/stores/likedVideos";
import {
    addSearchQueryToHistory,
    getSearchQueryHistory,
    removeSearchQueryFromHistory,
} from "@/stores/searchQueryHistory";
import { useShowWatchlistStore } from "@/stores/showWatchlist";
import { useWatchHistoryStore } from "@/stores/watchHistory";
import { createCommonStyles } from "@/styles/common";
import type { Category, VideoCard } from "@/types/shows";
import {
    getDynamicRecommendation,
    getPersonalisedRecommendation,
    type RecommendationResult,
} from "@/utils/recommendation";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from "heroui-native/spinner";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    FlatList,
    Keyboard,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    useWindowDimensions,
    View
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SEARCH_BAR_HEIGHT = 58;

function getSlugFromCategoryUrl(url: string, fallback: string) {
    try {
        const parts = url.split("/").filter(Boolean);
        return parts[parts.length - 1] ?? fallback;
    } catch {
        return fallback;
    }
}

function flattenPages<T extends { items: VideoCard[] }>(pages: T[] | undefined): VideoCard[] {
    if (!pages) return [];
    const seen = new Set<string>();
    return pages.flatMap(p =>
        p.items.filter(item => {
            if (!item.video_url || seen.has(item.video_url)) return false;
            seen.add(item.video_url);
            return true;
        })
    );
}

interface HeroCardProps {
    result: RecommendationResult;
    thumbHeight: number;
    colors: any;
    styles: any;
    onPress: () => void;
}

function HeroCard({ result, thumbHeight, colors, styles, onPress }: HeroCardProps) {
    return (
        <View>
            <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                <SquircleView
                    cornerSmoothing={60}
                    preserveSmoothing
                    style={[styles.heroCard, { backgroundColor: colors.surfaceContainerHigh }]}
                >
                    <View style={{ height: thumbHeight, overflow: 'hidden' }}>
                        <ExpoImage
                            source={{ uri: result.video.thumb_url }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                        />
                        <View style={[StyleSheet.absoluteFill, styles.heroOverlay]}>
                            <View style={[styles.aiBadge, { backgroundColor: 'rgba(0,0,0,0.60)' }]}>
                                <Ionicons name="sparkles" size={12} color="#FFD700" />
                                <FlexText style={styles.aiBadgeText}>AI Pick</FlexText>
                            </View>
                            {!!result.video.duration && (
                                <View style={[styles.durationBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                                    <FlexText style={styles.durationText}>{result.video.duration}</FlexText>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={{ padding: 14, gap: 8 }}>
                        <FlexText numberOfLines={2} style={[styles.heroTitle, { color: colors.onSurface }]}>
                            {result.video.title}
                        </FlexText>
                        <FlexText numberOfLines={3} style={[styles.heroReason, { color: colors.onSurfaceVariant }]}>
                            {result.reason}
                        </FlexText>
                        <TouchableOpacity
                            onPress={onPress}
                            activeOpacity={0.8}
                            style={[styles.watchBtn, { backgroundColor: colors.onSurface }]}
                        >
                            <Ionicons name="play" size={14} color={colors.surface} />
                            <FlexText style={[styles.watchBtnText, { color: colors.surface }]}>Watch Now</FlexText>
                        </TouchableOpacity>
                    </View>
                </SquircleView>
            </Pressable>
        </View>
    );
}

interface CandidateRowProps {
    item: RecommendationResult;
    rank: number;
    colors: any;
    styles: any;
    onPress: () => void;
}

function CandidateRow({ item, rank, colors, styles, onPress }: CandidateRowProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.candidateRow,
                { backgroundColor: colors.surfaceContainerLow, opacity: pressed ? 0.85 : 1 },
            ]}
        >
            <FlexText style={[styles.rankNum, { color: colors.onSurfaceVariant }]}>
                {String(rank).padStart(2, '0')}
            </FlexText>
            <View style={styles.candidateThumb}>
                <ExpoImage
                    source={{ uri: item.video.thumb_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                />
                {!!item.video.duration && (
                    <View style={[styles.durationBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                        <FlexText style={styles.durationText}>{item.video.duration}</FlexText>
                    </View>
                )}
            </View>
            <View style={{ flex: 1, gap: 3 }}>
                <FlexText numberOfLines={2} style={[styles.candidateTitle, { color: colors.onSurface }]}>
                    {item.video.title}
                </FlexText>
                {!!item.video.views && (
                    <FlexText style={[styles.candidateMeta, { color: colors.onSurfaceVariant }]}>
                        {item.video.views}
                    </FlexText>
                )}
            </View>
            <Ionicons name="chevron-forward" size={15} color={colors.onSurfaceVariant} />
        </Pressable>
    );
}

function LoadingSkeleton({ thumbHeight }: { thumbHeight: number }) {
    return (
        <SkeletonGroup isLoading>
            <View style={{ paddingHorizontal: 16, gap: 16 }}>
                <SkeletonGroup.Item style={{ height: thumbHeight + 120, borderRadius: 20 }} />
                {[0, 1, 2].map(i => (
                    <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <SkeletonGroup.Item style={{ width: 30, height: 16, borderRadius: 4 }} />
                        <SkeletonGroup.Item style={{ width: 110, height: 70, borderRadius: 10 }} />
                        <View style={{ flex: 1, gap: 8 }}>
                            <SkeletonGroup.Item style={{ height: 14, width: '80%', borderRadius: 4 }} />
                            <SkeletonGroup.Item style={{ height: 11, width: '50%', borderRadius: 4 }} />
                        </View>
                    </View>
                ))}
            </View>
        </SkeletonGroup>
    );
}

const SearchShowsScreen = () => {
    const router = useRouter();
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();

    const styles = useMemo(() => makeStyles(colors), [colors]);

    const inputRef = useRef<TextInput>(null);
    const [searchText, setSearchText] = useState("");
    const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    const [recentQueries, setRecentQueries] = useState<string[]>(() =>
        getSearchQueryHistory("shows"),
    );

    const { data: categoriesData, isLoading: isCategoriesLoading } = useCategoriesQuery();
    const categories = useMemo(() => categoriesData?.categories ?? [], [categoriesData]);

    const {
        data,
        isLoading,
        isRefetching,
        isFetchingNextPage,
        isError,
        fetchNextPage,
        hasNextPage,
        refetch,
    } = useSearchInfiniteQuery(submittedQuery ?? undefined);

    const items = useMemo<VideoCard[]>(() => {
        const rawItems = data?.pages.flatMap((p) => p.items) ?? [];
        const seen = new Set<string>();
        return rawItems.filter((item) => {
            if (!item.video_url) return true;
            if (seen.has(item.video_url)) {
                return false;
            }
            seen.add(item.video_url);
            return true;
        });
    }, [data]);

    const { width } = useWindowDimensions();
    const thumbHeight = Math.round(width * (9 / 16) * 0.65);

    // ── Feed data for AI suggestion ─────────────────────────────────────────────
    const popular = usePopularInfiniteQuery(true);
    const latest = useLatestInfiniteQuery(true);

    const candidates = useMemo<VideoCard[]>(() => {
        const seen = new Set<string>();
        return [
            ...flattenPages(popular.data?.pages as any),
            ...flattenPages(latest.data?.pages as any),
        ].filter(v => {
            if (!v.video_url || seen.has(v.video_url)) return false;
            seen.add(v.video_url);
            return true;
        });
    }, [popular.data, latest.data]);

    const isAiLoading = popular.isLoading || latest.isLoading;

    // ── Interest inputs (all local, no network) ───────────────────────────────
    const watchlist = useShowWatchlistStore(s => s.watchlist);
    const watchHistory = useWatchHistoryStore(s => s.history);
    const likedStore = useLikedVideosStore();

    const watchlistTitles = useMemo(
        () => [
            ...watchlist.map(w => w.title),
            ...watchHistory.map(h => h.title),
        ],
        [watchlist, watchHistory]
    );

    const likedTitles = useMemo(
        () => likedStore.likedVideos.map(v => v.title),
        [likedStore.likedVideos]
    );

    const searchQueries = useMemo(
        () => [
            ...getSearchQueryHistory('shows'),
            ...getSearchQueryHistory('movies'),
        ],
        []
    );

    // ── Recommendation results ──
    const { profile, topPick, morePicks } = useMemo(() => {
        if (candidates.length === 0) {
            return { profile: null, topPick: null, morePicks: [] };
        }

        const result = getPersonalisedRecommendation(candidates, watchlistTitles, searchQueries, likedTitles);
        const rest = candidates.filter(v => v.video_url !== result.video.video_url);
        const vibe = result.profile.isNewUser ? '' : result.profile.generatedVibe;

        let more: RecommendationResult[] = [];
        if (!result.profile.isNewUser && vibe) {
            more = rest
                .map((video: VideoCard) => getDynamicRecommendation([video], vibe))
                .sort((a: RecommendationResult, b: RecommendationResult) => b.score - a.score)
                .slice(0, 8);
        } else {
            // New user: show hot videos as fallback
            const hot = rest.filter(v => v.hot).slice(0, 8).map(v => ({
                video: v,
                reason: 'Trending right now',
                score: 1,
            }));
            more = hot.length ? hot : rest.slice(0, 8).map(v => ({
                video: v,
                reason: 'Popular on the platform',
                score: 0,
            }));
        }

        return {
            profile: result.profile,
            topPick: result,
            morePicks: more,
        };
    }, [candidates, watchlistTitles, searchQueries, likedTitles]);

    const navigateToVideo = useCallback((video: VideoCard) => {
        router.push({
            pathname: '/moviehub/video_detail',
            params: { video_url: video.video_url },
        });
    }, [router]);

    // Keep the absolute search bar above the keyboard.
    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const keyboardListener = Keyboard.addListener("keyboardDidHide", () => {
            inputRef.current?.blur();
        });

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates?.height ?? 0);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
            keyboardListener.remove();
        };
    }, []);

    const submitSearch = useCallback(() => {
        const q = searchText.trim();

        if (!q) {
            setSubmittedQuery(null);
            return;
        }

        // Same query pressed again → just refetch all pages from page 1.
        if (submittedQuery === q) {
            refetch();
            return;
        }

        // New query — changing the key resets the infinite query automatically.
        setSubmittedQuery(q);
    }, [refetch, searchText, submittedQuery]);

    /** Called when the keyboard's search button is pressed. Saves + searches. */
    const handleSubmitEditing = useCallback(() => {
        const q = searchText.trim();
        if (q) {
            addSearchQueryToHistory("shows", q);
            setRecentQueries(getSearchQueryHistory("shows"));
        }
        submitSearch();
    }, [searchText, submitSearch]);

    /** Called when the input loses focus. Saves whatever is typed (if non-empty). */
    const handleBlur = useCallback(() => {
        setIsFocused(false);
        const q = searchText.trim();
        if (q) {
            addSearchQueryToHistory("shows", q);
            setRecentQueries(getSearchQueryHistory("shows"));
        }
    }, [searchText]);

    const clearSearch = useCallback(() => {
        setSearchText("");
        setSubmittedQuery(null);
        inputRef.current?.clear();
    }, []);

    const handleCategoryPress = useCallback(
        (category: Category) => {
            const slug = getSlugFromCategoryUrl(category.url, category.name);
            router.push({
                pathname: "/show_list",
                params: { mode: "category", slug },
            });
        },
        [router],
    );

    const renderItem = useCallback(
        ({ item }: { item: VideoCard }) => (
            <Pressable
                onPress={() =>
                    router.push({
                        pathname: "/moviehub/video_detail",
                        params: { video_url: item.video_url },
                    })
                }
                style={({ pressed }) => [
                    styles.row,
                    {
                        opacity: pressed ? 0.9 : 1,
                    },
                ]}
            >
                <ExpoImage
                    source={{ uri: item.thumb_url }}
                    style={styles.thumbnail}
                    contentFit="cover"
                />
                <View style={{ flex: 1, gap: 4 }}>
                    <FlexText
                        numberOfLines={1}
                        style={[styles.title, { color: colors.onSurface }]}
                    >
                        {item.title}
                    </FlexText>
                    <FlexText
                        numberOfLines={2}
                        style={[
                            styles.description,
                            {
                                color: colors.onSurfaceVariant,
                            },
                        ]}
                    >
                        {item.duration} • {item.views}
                    </FlexText>
                </View>
            </Pressable>
        ),
        [colors, router, styles],
    );

    const ListHeaderComponent = useCallback(() => {
        if (submittedQuery) return null;

        return (
            <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
                <FlexText style={[common.heading, { fontSize: 18, marginBottom: 8 }]}>
                    Categories
                </FlexText>
                {isCategoriesLoading ? (
                    <SkeletonGroup isLoading={true} variant="shimmer">
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: 10 }}
                        >
                            {[0, 1, 2, 3].map((i) => (
                                <SkeletonGroup.Item
                                    key={i}
                                    style={[
                                        styles.categoryPill,
                                        {
                                            width: i === 0 ? 96 : i === 1 ? 120 : i === 2 ? 88 : 110,
                                            backgroundColor: colors.surfaceContainerHigh,
                                        },
                                    ]}
                                />
                            ))}
                        </ScrollView>
                    </SkeletonGroup>
                ) : (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 10 }}
                    >
                        {categories.map((c) => (
                            <TouchableOpacity
                                key={c.url}
                                onPress={() => handleCategoryPress(c)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.categoryPill}>
                                    <FlexText
                                        numberOfLines={1}
                                        style={{ color: colors.onSurface, fontWeight: "600" }}
                                    >
                                        {c.name}
                                    </FlexText>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {/* AI Recommendation Content */}
                <View style={{ marginTop: 24, gap: 16 }}>
                    {isAiLoading && <LoadingSkeleton thumbHeight={thumbHeight} />}

                    {!isAiLoading && profile && !profile.isNewUser && (
                        <View style={{ gap: 8 }}>
                            <FlexText style={[common.heading, { fontSize: 18, marginBottom: 8 }]}>
                                Matched your interest in:
                            </FlexText>
                            <View style={styles.chipRow}>
                                {profile.topKeywords.map(kw => (
                                    <SquircleView
                                        key={kw}
                                        cornerSmoothing={60}
                                        preserveSmoothing
                                        style={[styles.chip, { backgroundColor: colors.secondaryContainer }]}
                                    >
                                        <FlexText style={[styles.chipText, { color: colors.onSecondaryContainer }]}>
                                            {kw}
                                        </FlexText>
                                    </SquircleView>
                                ))}
                            </View>
                        </View>
                    )}

                    {!isAiLoading && profile?.isNewUser && (
                        <View style={[styles.noticeBox, { backgroundColor: colors.surfaceContainerHigh }]}>
                            <Ionicons name="information-circle-outline" size={18} color={colors.onSurfaceVariant} />
                            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, flex: 1 }]}>
                                {"Watch a few videos and we'll personalise these picks just for you!"}
                            </FlexText>
                        </View>
                    )}

                    {!isAiLoading && topPick && (
                        <HeroCard
                            result={topPick}
                            thumbHeight={thumbHeight}
                            colors={colors}
                            styles={styles}
                            onPress={() => navigateToVideo(topPick.video)}
                        />
                    )}

                    {!isAiLoading && morePicks.length > 0 && (
                        <View style={{ gap: 12, marginTop: 8 }}>
                            <FlexText style={[common.heading, { fontSize: 16, color: colors.onSurface }]}>
                                You Might Also Like
                            </FlexText>
                            <View style={{ gap: 8 }}>
                                {morePicks.map((item, index) => (
                                    <CandidateRow
                                        key={`${item.video.video_url}-${index}`}
                                        item={item}
                                        rank={index + 2}
                                        colors={colors}
                                        styles={styles}
                                        onPress={() => navigateToVideo(item.video)}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    }, [
        categories,
        common.heading,
        common.bodySmall,
        colors,
        handleCategoryPress,
        isCategoriesLoading,
        submittedQuery,
        styles,
        isAiLoading,
        thumbHeight,
        profile,
        topPick,
        morePicks,
        navigateToVideo
    ]);

    const ListFooterComponent = useCallback(() => {
        if (!submittedQuery || !hasNextPage) return null;

        return (
            <View style={{ paddingHorizontal: 12, paddingVertical: 16 }}>
                <TouchableOpacity
                    onPress={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    style={[
                        styles.loadMoreButton,
                        { backgroundColor: colors.surfaceContainerHigh, opacity: isFetchingNextPage ? 0.7 : 1 },
                    ]}
                >
                    {isFetchingNextPage ? (
                        <Spinner size="md" />
                    ) : (
                        <FlexText style={{ color: colors.onSurface, fontWeight: "700" }}>
                            Load more
                        </FlexText>
                    )}
                </TouchableOpacity>
            </View>
        );
    }, [colors, fetchNextPage, hasNextPage, isFetchingNextPage, submittedQuery, styles.loadMoreButton]);

    const ListEmptyComponent = useCallback(() => {
        if (isLoading && submittedQuery) {
            return (
                <SkeletonGroup isLoading={true} variant="shimmer">
                    <View style={{ padding: 16, gap: 12 }}>
                        {[1, 2, 3, 4, 5].map((key) => (
                            <View key={key} style={[styles.row, { padding: 0, marginBottom: 12 }]}>
                                <SkeletonGroup.Item style={styles.thumbnail} />
                                <View style={{ flex: 1, gap: 8 }}>
                                    <SkeletonGroup.Item style={{ height: 16, width: '80%', borderRadius: 4 }} />
                                    <SkeletonGroup.Item style={{ height: 12, width: '60%', borderRadius: 4 }} />
                                </View>
                            </View>
                        ))}
                    </View>
                </SkeletonGroup>
            );
        }
        return null;
    }, [isLoading, submittedQuery, styles.row, styles.thumbnail]);

    const contentBottomPadding = SEARCH_BAR_HEIGHT + 24 + (keyboardHeight > 0 ? 10 : insets.bottom + 10);

    return (
        <KeyboardAvoidingView
            style={common.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 49 + insets.bottom : 0}
        >
            <View style={{ paddingHorizontal: 12, paddingTop: insets.top + 16, paddingBottom: 8 }}>
                <FlexText style={[common.heading, { fontSize: 28 }]}>
                    Search Shows
                </FlexText>
                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                    {submittedQuery
                        ? `Results for "${submittedQuery}"`
                        : "Bored? AI top picks for you. Search for your favorite GV or explore more."}
                </FlexText>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item, index) => item.video_url || String(index)}
                renderItem={renderItem}
                ListHeaderComponent={ListHeaderComponent}
                ListEmptyComponent={ListEmptyComponent}
                ListFooterComponent={ListFooterComponent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                    paddingHorizontal: 0,
                    paddingBottom: contentBottomPadding,
                    gap: 12,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => refetch()}
                        tintColor={colors.onSurface}
                        colors={[colors.onSurface]}
                        progressBackgroundColor={colors.surfaceContainerHigh}
                        progressViewOffset={insets.top}
                    />
                }
            />

            {/* Floating search bar */}
            <View
                style={[
                    styles.searchBarContainer,
                    {
                        bottom: insets.bottom + 0 + keyboardHeight - (keyboardHeight > 0 ? (Platform.OS === 'ios' ? 49 + 2 * insets.bottom : 85 + insets.bottom) : 0),
                    },
                ]}
            >
                {isFocused && recentQueries.length > 0 && (
                    <SearchHistoryPills
                        queries={recentQueries}
                        colors={colors}
                        onSelect={(q) => {
                            setSearchText(q);
                            setSubmittedQuery(q);
                            addSearchQueryToHistory("shows", q);
                            setRecentQueries(getSearchQueryHistory("shows"));
                        }}
                        onRemove={(q) => {
                            removeSearchQueryFromHistory("shows", q);
                            setRecentQueries(getSearchQueryHistory("shows"));
                        }}
                    />
                )}
                <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHighest }]}>
                    <TextInput
                        ref={inputRef}
                        style={[styles.searchInput, { color: colors.onSurface }]}
                        placeholder="Search shows..."
                        placeholderTextColor={colors.onSurfaceVariant}
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleSubmitEditing}
                        onFocus={() => {
                            setIsFocused(true);
                            setRecentQueries(getSearchQueryHistory("shows"));
                        }}
                        onBlur={handleBlur}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                            <View
                                style={[
                                    styles.clearButtonInner,
                                    { backgroundColor: colors.onTertiaryContainer + "20" },
                                ]}
                            >
                                <Ionicons
                                    name="close"
                                    size={16}
                                    color={colors.onTertiaryContainer}
                                />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                {isError && submittedQuery && (
                    <View style={{ marginTop: 8 }}>
                        <FlexText style={{ color: colors.error, fontWeight: "700" }}>
                            Failed to load results.
                        </FlexText>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const makeStyles = (colors: any) =>
    StyleSheet.create({
        row: {
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 16,
            padding: 12,
            gap: 12,
        },
        thumbnail: {
            width: 150,
            height: 80,
            borderRadius: 12,
            backgroundColor: colors.outlineVariant,
        },
        title: {
            fontSize: 16,
            fontWeight: "700",
        },
        description: {
            fontSize: 13,
            fontWeight: "400",
        },
        searchBarContainer: {
            position: "absolute",
            left: 8,
            right: 8,
            borderRadius: 16,
            padding: 10,
            zIndex: 1000,
        },
        searchBar: {
            borderRadius: 999,
            height: SEARCH_BAR_HEIGHT,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 6,
        },
        searchInput: {
            flex: 1,
            fontSize: 16,
            fontWeight: "500",
            paddingVertical: 0,
            paddingLeft: 14,
            paddingRight: 6,
        },
        clearButton: {
            padding: 6,
        },
        clearButtonInner: {
            width: 28,
            height: 28,
            borderRadius: 14,
            justifyContent: "center",
            alignItems: "center",
        },
        categoryPill: {
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: colors.surfaceContainerHigh,
        },
        loadMoreButton: {
            borderRadius: 99999,
            paddingVertical: 14,
            paddingHorizontal: 12,
            justifyContent: "center",
            alignItems: "center",
        },
        // AI Suggestion Styles
        chipRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
        },
        chip: {
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 99,
        },
        chipText: {
            fontSize: 13,
            fontWeight: '600',
        },
        noticeBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            borderRadius: 14,
        },
        heroCard: {
            borderRadius: 20,
            overflow: 'hidden',
        },
        heroOverlay: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: 10,
        },
        aiBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 99,
        },
        aiBadgeText: {
            color: '#FFD700',
            fontSize: 12,
            fontWeight: '700',
        },
        durationBadge: {
            position: 'absolute',
            bottom: 6,
            right: 6,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
        },
        durationText: {
            color: '#ffffff',
            fontSize: 11,
            fontWeight: '600',
        },
        heroTitle: {
            fontSize: 17,
            fontWeight: '700',
            lineHeight: 23,
        },
        heroReason: {
            fontSize: 13,
            lineHeight: 18,
        },
        watchBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 11,
            borderRadius: 12,
            marginTop: 2,
        },
        watchBtnText: {
            fontSize: 14,
            fontWeight: '700',
        },
        candidateRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 10,
            borderRadius: 16,
        },
        rankNum: {
            fontSize: 16,
            fontWeight: '700',
            width: 24,
            textAlign: 'center',
            opacity: 0.4,
        },
        candidateThumb: {
            width: 110,
            height: 70,
            borderRadius: 10,
            overflow: 'hidden',
        },
        candidateTitle: {
            fontSize: 14,
            fontWeight: '600',
            lineHeight: 19,
        },
        candidateMeta: {
            fontSize: 12,
        },
    });

export default SearchShowsScreen;
