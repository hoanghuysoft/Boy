import { FlexText } from "@/components/FlexText";
import { ShimmerEffect } from "@/components/shimmer/Shimmer";
import { IMDbBadge } from "@/components/tracker/MovieDBView";
import { SearchType, useTypedSearchInfinite } from "@/hooks/useMovies";
import { Ionicons } from "@expo/vector-icons";
import { XmarkOutlined } from "@lineiconshq/free-icons";
import LineiconsIcon from "@lineiconshq/react-native-lineicons";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { NitroImage } from "react-native-nitro-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const SEARCH_BAR_HEIGHT = 58;

const getImageUrl = (path: string | null | undefined, size: number = 342) => {
  if (!path) return `https://via.placeholder.com/${size}x513?text=No+Image`;
  return `https://image.tmdb.org/t/p/w${size}${path}`;
};

const CATEGORIES = [
  { name: "Popular", mode: "popular", title: "Popular Movies" },
  { name: "Now Playing", mode: "now_playing", title: "Now Playing" },
  { name: "Upcoming", mode: "upcoming", title: "Upcoming" },
  { name: "Top Rated", mode: "top_rated", title: "Top Rated" },
];

const SearchMoviesScreen = () => {
  const router = useRouter();
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const inputRef = useRef<TextInput>(null);
  const [searchText, setSearchText] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<SearchType>("movie");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const {
    data,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    isError,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useTypedSearchInfinite(submittedQuery ?? "", searchType);

  const items = useMemo<any[]>(
    () => data?.pages.flatMap((p: any) => p.results) ?? [],
    [data],
  );

  // Keep the absolute search bar above the keyboard.
  React.useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
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

  const clearSearch = useCallback(() => {
    setSearchText("");
    setSubmittedQuery(null);
    inputRef.current?.clear();
  }, []);

  const handleCategoryPress = useCallback(
    (category: any) => {
      router.push({
        pathname: "/movie_list",
        params: { mode: category.mode, title: category.title },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const isMovie = searchType === 'movie';
      const isPerson = searchType === 'person';
      const isTV = searchType === 'tv';

      const title = isMovie ? item.title : item.name;
      const dateRaw = isMovie ? item.release_date : (isTV ? item.first_air_date : undefined);
      const thumbnailPath = isPerson ? item.profile_path : item.poster_path;

      const handlePress = () => {
        if (isMovie) {
          router.push({ pathname: "/movie_detail", params: { id: item.id } });
        } else if (isPerson) {
          router.push({ pathname: "/person_detail", params: { id: item.id } });
        } else {
          router.push({ pathname: "/tv_detail", params: { id: item.id } });
        }
      };

      return (
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: colors.background,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={{ borderRadius: 9999, overflow: 'hidden', width: 90, height: 90 }}>
            <NitroImage
              image={{ url: getImageUrl(thumbnailPath) }}
              style={isPerson ? [styles.thumbnail, { height: 90, width: 90 }] : styles.thumbnail}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <FlexText numberOfLines={2} style={[styles.title, { color: colors.text }]}>
              {title}
            </FlexText>
            <FlexText
              numberOfLines={1}
              style={[styles.description, { color: (colors as any).mutedText ?? "rgba(255,255,255,0.7)" }]}
            >
              {isPerson ? item.known_for_department : (dateRaw ? new Date(dateRaw).getFullYear() : "—")}
            </FlexText>
            {!isPerson && <IMDbBadge score={item.vote_average} />}
          </View>
        </Pressable>
      );
    },
    [colors, router, styles, searchType],
  );

  const ListHeaderComponent = useCallback(() => {
    if (submittedQuery) return null;

    return (
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <FlexText style={[common.heading, { fontSize: 18, marginBottom: 8 }]}>
          Explore
        </FlexText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.name}
              onPress={() => handleCategoryPress(c)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryPill}>
                <FlexText
                  numberOfLines={1}
                  style={{ color: colors.text, fontWeight: "600" }}
                >
                  {c.name}
                </FlexText>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [common.heading, colors.text, handleCategoryPress, submittedQuery, styles.categoryPill]);

  const ListFooterComponent = useCallback(() => {
    if (!submittedQuery || !hasNextPage) return null;

    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
        <TouchableOpacity
          onPress={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          style={[
            styles.loadMoreButton,
            { backgroundColor: colors.card, opacity: isFetchingNextPage ? 0.7 : 1 },
          ]}
        >
          {isFetchingNextPage ? (
            <ActivityIndicator />
          ) : (
            <FlexText style={{ color: colors.text, fontWeight: "700" }}>
              Load more
            </FlexText>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [colors, fetchNextPage, hasNextPage, isFetchingNextPage, submittedQuery, styles.loadMoreButton]);

  const contentBottomPadding = insets.bottom + SEARCH_BAR_HEIGHT + 24 + keyboardHeight;

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Floating back button */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 16,
          left: 16,
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: colors.containerContent,
            borderRadius: 999,
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 66 }}>
        <FlexText style={[common.heading, { fontSize: 28 }]}>
          Search
        </FlexText>
        <FlexText style={[common.bodySmall, { color: colors.muted ?? "rgba(255,255,255,0.7)", marginTop: 2 }]}>
          {submittedQuery
            ? `Results for "${submittedQuery}"`
            : "Type a name then press Enter to search."}
        </FlexText>
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: 16, marginTop: 16, marginBottom: 8, gap: 16 }}>
        {(['movie', 'tv', 'person'] as const).map(type => (
          <TouchableOpacity key={type} onPress={() => setSearchType(type)} style={{ paddingBottom: 8, borderBottomWidth: searchType === type ? 2 : 0, borderBottomColor: (colors as any).primary ?? "white" }}>
            <FlexText style={{ color: searchType === type ? colors.text : colors.muted, fontWeight: searchType === type ? "700" : "500" }}>
              {type === 'movie' ? 'Movies' : type === 'tv' ? 'TV Shows' : 'People'}
            </FlexText>
          </TouchableOpacity>
        ))}
      </View>

      <FlashList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={() => {
          if (isLoading && submittedQuery) {
            return (
              <View style={{ padding: 16, gap: 12 }}>
                {[1, 2, 3, 4, 5].map((key) => (
                  <View key={key} style={[styles.row, { padding: 0, marginBottom: 12 }]}>
                    <ShimmerEffect style={styles.thumbnail} />
                    <View style={{ flex: 1, gap: 8 }}>
                      <ShimmerEffect style={{ height: 16, width: '80%', borderRadius: 4 }} />
                      <ShimmerEffect style={{ height: 12, width: '60%', borderRadius: 4 }} />
                    </View>
                  </View>
                ))}
              </View>
            );
          }

          if (!isLoading && submittedQuery && items.length === 0) {
            return (
              <View style={{ padding: 16, alignItems: 'center', marginTop: 40 }}>
                <Ionicons name="search-outline" size={48} color={(colors as any).muted ?? "rgba(255,255,255,0.5)"} />
                <FlexText style={{ color: colors.text, fontSize: 18, fontWeight: "600", marginTop: 16 }}>
                  No results found
                </FlexText>
                <FlexText style={{ color: (colors as any).muted ?? "rgba(255,255,255,0.7)", marginTop: 8, textAlign: "center" }}>
                  We couldn&apos;t find anything matching &quot;{submittedQuery}&quot;. Try adjusting your search query.
                </FlexText>
              </View>
            );
          }

          return null;
        }}
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
            tintColor={colors.text}
            colors={[colors.text]}
            progressBackgroundColor={colors.card}
            progressViewOffset={insets.top}
          />
        }
      />

      {/* Floating search bar */}
      <View
        style={[
          styles.searchBarContainer,
          {
            bottom: insets.bottom + 16 + keyboardHeight,
          },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: "white" }]}
            placeholder="Search movies..."
            placeholderTextColor={colors.muted ?? "rgba(255,255,255,0.5)"}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={submitSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <View
                style={[
                  styles.clearButtonInner,
                  { backgroundColor: colors.card },
                ]}
              >
                <LineiconsIcon
                  icon={XmarkOutlined}
                  size={14}
                  color={colors.text}
                  strokeWidth={3}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {isError && submittedQuery && (
          <View style={{ marginTop: 8 }}>
            <FlexText style={{ color: "white", fontWeight: "700" }}>
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
      width: 90,
      height: 135,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.08)",
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
      paddingHorizontal: 6,
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
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: colors.card ?? "rgba(255,255,255,0.08)",
    },
    loadMoreButton: {
      borderRadius: 99999,
      paddingVertical: 14,
      paddingHorizontal: 16,
      justifyContent: "center",
      alignItems: "center",
    },
  });

export default SearchMoviesScreen;
