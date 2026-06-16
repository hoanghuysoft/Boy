import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import {
    useAiringTodayTVInfinite,
    useNowPlayingMoviesInfinite,
    useOnTheAirTVInfinite,
    usePopularMoviesInfinite, usePopularPeopleInfinite,
    usePopularTVInfinite,
    useTopRatedMoviesInfinite,
    useTopRatedTVInfinite,
    useTrendingAll, useUpcomingMoviesInfinite
} from "@/hooks/useMovies";
import { Movie } from "@/types/moviedb";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Skeleton } from "heroui-native/skeleton";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import React, { useCallback, useEffect, useState } from "react";
import {
    Animated,
    FlatList,
    ListRenderItemInfo,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { Pressable as GesturePressable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CARD_WIDTH = 140;

const getImageUrl = (path: string | null | undefined, size: number = 500) => {
    if (!path) return `https://via.placeholder.com/${size}x750?text=No+Image`;
    return `https://image.tmdb.org/t/p/w${size}${path}`;
};

export const IMDbBadge = ({ score, style, textColor }: { score?: number, style?: any, textColor?: string }) => {
    if (!score) return null;
    return (
        <View style={[{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#f5c518", borderRadius: 999, overflow: "hidden", alignSelf: "flex-start" }, style]}>
            <View style={{ backgroundColor: "#f5c518", paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: "black", fontSize: 10, fontWeight: "900" }}>IMDb</Text>
            </View>
            <View style={{ paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: textColor ?? "white", fontSize: 10, fontWeight: "700" }}>{score.toFixed(1)}</Text>
            </View>
        </View>
    );
};

/** Lightweight skeleton placeholder for a single horizontal section row */
const SectionShimmer = ({ title }: { title: string }) => (
    <SkeletonGroup isLoading={true} variant="shimmer">
        <View style={{ gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16 }}>
                <SkeletonGroup.Item
                    style={{
                        height: 22,
                        width: Math.min(title.length * 11, 200),
                        borderRadius: 4,
                    }}
                />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}>
                <SkeletonGroup.Item style={{ height: CARD_WIDTH * 1.5, width: CARD_WIDTH, borderRadius: 16 }} />
                <SkeletonGroup.Item style={{ height: CARD_WIDTH * 1.5, width: CARD_WIDTH, borderRadius: 16 }} />
                <SkeletonGroup.Item style={{ height: CARD_WIDTH * 1.5, width: CARD_WIDTH, borderRadius: 16 }} />
            </ScrollView>
        </View>
    </SkeletonGroup>
);

interface MediaCardProps {
    id: number;
    title: string;
    posterPath: string | null | undefined;
    voteAverage?: number;
    type: "movie" | "tv";
}

const MediaCard = React.memo(({ id, title, posterPath, voteAverage, type }: MediaCardProps) => {
    const handlePress = useCallback(() => {
        router.navigate({ pathname: type === "movie" ? "/movie_detail" : "/tv_detail", params: { id } });
    }, [id, type]);

    return (
        <GesturePressable
            onPress={handlePress}
            style={{ width: CARD_WIDTH, marginRight: 12, overflow: "hidden", position: "relative" }}
        >
            <View style={{ width: CARD_WIDTH, borderRadius: 16, overflow: "hidden", position: "relative" }}>
                <Image
                    source={{ uri: getImageUrl(posterPath, 342) }}
                    style={{
                        width: CARD_WIDTH,
                        aspectRatio: 2 / 3,
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: "rgba(132,132,132,0.34)",
                    }}
                    contentFit="cover"
                />
            </View>
            <FlexText
                numberOfLines={2}
                ellipsizeMode="tail"
                style={[styles.textStyle, { color: "white", width: "100%", flexShrink: 1, marginBottom: 4 }]}
            >
                {title}
            </FlexText>
            <IMDbBadge score={voteAverage} />
        </GesturePressable>
    );
});

MediaCard.displayName = "MediaCard";

interface PersonCardProps {
    id: number;
    name: string;
    profilePath: string | null | undefined;
    knownForDepartment?: string;
}

const PersonCard = React.memo(({ id, name, profilePath, knownForDepartment }: PersonCardProps) => {
    const handlePress = useCallback(() => {
        router.navigate({ pathname: "/person_detail", params: { id } });
    }, [id]);

    return (
        <GesturePressable
            onPress={handlePress}
            style={{ width: 100, marginRight: 16, alignItems: "center" }}
        >
            <Image
                source={{ uri: getImageUrl(profilePath, 185) }}
                style={{
                    width: 100,
                    height: 100,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: "rgba(132,132,132,0.34)",
                }}
                contentFit="cover"
            />
            <FlexText
                numberOfLines={2}
                style={[styles.textStyle, { color: "white", width: "100%", textAlign: "center", marginTop: 8, fontWeight: "600" }]}
            >
                {name}
            </FlexText>
            <FlexText
                numberOfLines={1}
                style={[styles.textStyle, { color: "rgba(255,255,255,0.5)", width: "100%", textAlign: "center", marginTop: 2, fontSize: 12 }]}
            >
                {knownForDepartment}
            </FlexText>
        </GesturePressable>
    );
});

PersonCard.displayName = "PersonCard";

interface MediaSectionProps<T> {
    title: string;
    isLoading: boolean;
    data: T[];
    renderItem: (info: ListRenderItemInfo<T>) => React.ReactElement | null;
    keyExtractor: (item: T, index: number) => string;
    onPressHeader: () => void;
    style?: any;
}

const MediaSection = <T,>({
    title,
    isLoading,
    data,
    renderItem,
    keyExtractor,
    onPressHeader,
    style,
}: MediaSectionProps<T>) => {
    if (isLoading) {
        return <SectionShimmer title={title} />;
    }
    if (!data || data.length === 0) {
        return null;
    }
    return (
        <View style={style}>
            <Pressable
                onPress={onPressHeader}
                style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingBottom: 12 }}
            >
                <FlexText style={[styles.sectionTitle, { color: "white", flex: 1 }]}>
                    {title}
                </FlexText>
                <View style={{ backgroundColor: "rgba(52, 52, 52, 1)", padding: 8, height: 40, justifyContent: "center", alignItems: "center", borderRadius: 999 }}>
                    <Ionicons name="chevron-forward" size={20} color="white" />
                </View>
            </Pressable>
            <FlatList
                horizontal
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            />
        </View>
    );
};

export const MovieDBView = ({ headerScrollX }: { headerScrollX: Animated.Value }) => {
    const { colors } = useThemeContext();
    const { width } = useWindowDimensions();
    const posterHeight = width * 1.5; // portrait 2/3 ratio
    const inset = useSafeAreaInsets();

    // Defer below-fold sections until after tab/push animation completes
    const [isBelowFoldReady, setIsBelowFoldReady] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsBelowFoldReady(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const { data: trending, isLoading: isTrendingLoading, isError: isTrendingError, refetch: refetchTrending } = useTrendingAll();
    const { data: popData, isLoading: isPopularLoading, isError: isPopularError, refetch: refetchPopular } = usePopularMoviesInfinite("en-US", isBelowFoldReady);
    const { data: topData, isLoading: isTopRatedLoading, isError: isTopRatedError, refetch: refetchTopRated } = useTopRatedMoviesInfinite("en-US", isBelowFoldReady);
    const { data: nowData, isLoading: isNowLoading, isError: isNowError, refetch: refetchNow } = useNowPlayingMoviesInfinite();
    const { data: upData, isLoading: isUpLoading, isError: isUpError, refetch: refetchUp } = useUpcomingMoviesInfinite("en-US", isBelowFoldReady);
    const { data: popPeopleData, isLoading: isPopPeopleLoading, isError: isPopPeopleError, refetch: refetchPopPeople } = usePopularPeopleInfinite("en-US", isBelowFoldReady);

    const { data: airTodayData, isLoading: isAirTodayLoading, isError: isAirTodayError, refetch: refetchAirToday } = useAiringTodayTVInfinite();
    const { data: onAirData, isLoading: isOnAirLoading, isError: isOnAirError, refetch: refetchOnAir } = useOnTheAirTVInfinite("en-US", isBelowFoldReady);
    const { data: popTvData, isLoading: isPopTvLoading, isError: isPopTvError, refetch: refetchPopTv } = usePopularTVInfinite("en-US", isBelowFoldReady);
    const { data: topTvData, isLoading: isTopTvLoading, isError: isTopTvError, refetch: refetchTopTv } = useTopRatedTVInfinite("en-US", isBelowFoldReady);

    const popular = popData?.pages[0]?.results ?? [];
    const topRated = topData?.pages[0]?.results ?? [];
    const nowPlaying = nowData?.pages[0]?.results ?? [];
    const upcoming = upData?.pages[0]?.results ?? [];
    const popularPeople = popPeopleData?.pages[0]?.results ?? [];

    const tvAiringToday = airTodayData?.pages[0]?.results ?? [];
    const tvOnTheAir = onAirData?.pages[0]?.results ?? [];
    const tvPopular = popTvData?.pages[0]?.results ?? [];
    const tvTopRated = topTvData?.pages[0]?.results ?? [];

    const isLoading = isTrendingLoading; // only the hero banner blocks initial render
    const isError = isTrendingError || isPopularError || isTopRatedError || isNowError || isUpError || isPopPeopleError || isAirTodayError || isOnAirError || isPopTvError || isTopTvError;

    const onRefresh = useCallback(() => {
        refetchTrending();
        refetchPopular();
        refetchTopRated();
        refetchNow();
        refetchUp();
        refetchPopPeople();
        refetchAirToday();
        refetchOnAir();
        refetchPopTv();
        refetchTopTv();
    }, [refetchTrending, refetchPopular, refetchTopRated, refetchNow, refetchUp, refetchPopPeople, refetchAirToday, refetchOnAir, refetchPopTv, refetchTopTv]);

    const isRefreshing =
        isTrendingLoading || isPopularLoading || isTopRatedLoading || isNowLoading || isUpLoading ||
        isPopPeopleLoading || isAirTodayLoading || isOnAirLoading || isPopTvLoading || isTopTvLoading;

    const renderMovieItem = useCallback(
        ({ item }: ListRenderItemInfo<Movie>) => (
            <MediaCard
                id={item.id}
                title={item.title}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                type="movie"
            />
        ),
        [],
    );

    const renderTvItem = useCallback(
        ({ item }: ListRenderItemInfo<any>) => (
            <MediaCard
                id={item.id}
                title={item.name}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                type="tv"
            />
        ),
        [],
    );

    const renderPersonItem = useCallback(
        ({ item }: ListRenderItemInfo<any>) => (
            <PersonCard
                id={item.id}
                name={item.name}
                profilePath={item.profile_path}
                knownForDepartment={item.known_for_department}
            />
        ),
        [],
    );

    const mediaKeyExtractor = useCallback((item: any) => item.id.toString(), []);

    return (
        <ScrollView
            contentContainerStyle={[{ gap: 12, paddingBottom: 24 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.text}
                    colors={[colors.text]}
                    progressBackgroundColor={colors.card}
                    progressViewOffset={inset.top}
                />
            }
        >
            {/* Hero skeleton — only blocks on the trending banner */}
            {isLoading && (
                <Skeleton style={{ height: posterHeight, width: "100%" }} />
            )}

            {!isLoading && (
                <>
                    {isError && (
                        <View
                            style={{
                                marginHorizontal: 16,
                                marginTop: 8,
                                padding: 12,
                                borderRadius: 12,
                                backgroundColor: "rgba(255, 0, 0, 0.12)",
                            }}
                        >
                            <Text style={{ color: "white", fontWeight: "700" }}>Failed to load movies.</Text>
                            <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                                Pull to refresh and try again.
                            </Text>
                        </View>
                    )}

                    {/* Trending Slider — identical parallax to shows */}
                    {trending && trending.length > 0 && (
                        <Animated.ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            scrollEventThrottle={16}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: headerScrollX } } }],
                                { useNativeDriver: true },
                            )}
                            style={{ height: posterHeight }}
                        >
                            {trending.slice(0, 5).map((item, i) => {
                                const extra = width * 0.15; // shallow parallax for portrait posters
                                const translateX = headerScrollX.interpolate({
                                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                                    outputRange: [-extra, 0, extra],
                                    extrapolate: "clamp",
                                });
                                const scale = headerScrollX.interpolate({
                                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                                    outputRange: [1, 1.05, 1],
                                    extrapolate: "clamp",
                                });
                                const overlayOpacity = headerScrollX.interpolate({
                                    inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                                    outputRange: [0, 1, 0],
                                    extrapolate: "clamp",
                                });

                                return (
                                    <Pressable
                                        key={item.id}
                                        onPress={() => item.media_type === "tv" ? router.push({ pathname: "/tv_detail", params: { id: item.id } }) : router.push({ pathname: "/movie_detail", params: { id: item.id } })}
                                        style={{ width, height: posterHeight, overflow: "hidden" }}
                                    >
                                        <Animated.View
                                            style={{
                                                width: width + extra * 2,
                                                height: posterHeight,
                                                marginLeft: -extra,
                                                transform: [{ translateX }, { scale }],
                                            }}
                                        >
                                            <Image
                                                source={{ uri: getImageUrl(item.poster_path, 780) }}
                                                style={{ width: "100%", height: "100%" }}
                                                contentFit="cover"
                                            />
                                            {/* Bottom-to-top black gradient overlay */}
                                            <View
                                                pointerEvents="none"
                                                style={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: "60%",
                                                    // @ts-ignore — RN 0.76 experimental API
                                                    experimental_backgroundImage: "linear-gradient(to top, #000000 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
                                                }}
                                            />
                                        </Animated.View>
                                        <Animated.View
                                            pointerEvents="none"
                                            style={[styles.headerOverlay, { paddingBottom: 24, opacity: overlayOpacity }]}
                                        >
                                            <FlexText style={{ color: "white", fontSize: 36, fontWeight: "700", textAlign: "center" }}>
                                                {item.title || item.name}
                                            </FlexText>
                                            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                                                <IMDbBadge score={item.vote_average} />
                                            </View>
                                        </Animated.View>
                                    </Pressable>
                                );
                            })}
                        </Animated.ScrollView>
                    )}

                    {/* Now Playing Movies */}
                    <MediaSection
                        title="In Theatres"
                        isLoading={isNowLoading}
                        data={nowPlaying}
                        renderItem={renderMovieItem}
                        keyExtractor={mediaKeyExtractor}
                        onPressHeader={() => router.navigate({ pathname: "/movie_list", params: { mode: "now_playing", title: "In Theatres" } })}
                        style={{ marginTop: 24 }}
                    />

                    {/* Airing Today TV */}
                    <MediaSection
                        title="Airing Today"
                        isLoading={isAirTodayLoading}
                        data={tvAiringToday}
                        renderItem={renderTvItem}
                        keyExtractor={mediaKeyExtractor}
                        onPressHeader={() => router.navigate({ pathname: "/movie_list", params: { mode: "tv_airing_today", title: "Airing Today" } })}
                    />

                    {!isBelowFoldReady ? null : (
                        <>
                            {/* Upcoming Movies */}
                            <MediaSection
                                title="Upcoming Movies"
                                isLoading={isUpLoading}
                                data={upcoming}
                                renderItem={renderMovieItem}
                                keyExtractor={mediaKeyExtractor}
                                onPressHeader={() => router.push({ pathname: "/movie_list", params: { mode: "upcoming", title: "Upcoming Movies" } })}
                            />

                            {/* Currently On TV */}
                            <MediaSection
                                title="Currently On TV"
                                isLoading={isOnAirLoading}
                                data={tvOnTheAir}
                                renderItem={renderTvItem}
                                keyExtractor={mediaKeyExtractor}
                                onPressHeader={() => router.push({ pathname: "/movie_list", params: { mode: "tv_on_the_air", title: "On The Air" } })}
                            />

                            {/* Popular Movies */}
                            <MediaSection
                                title="Popular Movies"
                                isLoading={isPopularLoading}
                                data={popular}
                                renderItem={renderMovieItem}
                                keyExtractor={mediaKeyExtractor}
                                onPressHeader={() => router.push({ pathname: "/movie_list", params: { mode: "popular", title: "Popular Movies" } })}
                            />

                            {/* Popular TV Shows */}
                            <MediaSection
                                title="Popular TV Shows"
                                isLoading={isPopTvLoading}
                                data={tvPopular}
                                renderItem={renderTvItem}
                                keyExtractor={mediaKeyExtractor}
                                onPressHeader={() => router.push({ pathname: "/movie_list", params: { mode: "tv_popular", title: "Popular TV Shows" } })}
                            />

                            {/* Trending People */}
                            <MediaSection
                                title="Trending People"
                                isLoading={isPopPeopleLoading}
                                data={popularPeople}
                                renderItem={renderPersonItem}
                                keyExtractor={mediaKeyExtractor}
                                onPressHeader={() => router.push({ pathname: "/movie_list", params: { mode: "popular_people", title: "Trending People" } })}
                            />

                            {/* Top Rated Movies */}
                            <MediaSection
                                title="Top Rated Movies"
                                isLoading={isTopRatedLoading}
                                data={topRated}
                                renderItem={renderMovieItem}
                                keyExtractor={mediaKeyExtractor}
                                onPressHeader={() => router.push({ pathname: "/movie_list", params: { mode: "top_rated", title: "Top Rated Movies" } })}
                            />

                            {/* Top Rated TV Shows */}
                            <MediaSection
                                title="Top Rated TV Shows"
                                isLoading={isTopTvLoading}
                                data={tvTopRated}
                                renderItem={renderTvItem}
                                keyExtractor={mediaKeyExtractor}
                                onPressHeader={() => router.push({ pathname: "/movie_list", params: { mode: "tv_top_rated", title: "Top Rated TV" } })}
                            />
                        </>
                    )}
                </>
            )}
            <View style={{ height: inset.bottom + 80 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    headerOverlay: {
        position: "absolute",
        bottom: 0,
        left: 16,
        right: 16,
        justifyContent: "flex-end",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "700",
    },
    textStyle: {
        fontSize: 14,
    },
});
