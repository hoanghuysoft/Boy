import { FlexText } from "@/components/FlexText";
import { useCategoriesQuery } from "@/services/shows";
import { useSearchInfiniteQuery } from "@/services/shows/search";
import type { Category, VideoCard } from "@/types/shows";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import { SkeletonGroup } from "heroui-native/skeleton-group";
import { Spinner } from "heroui-native/spinner";
import React, { useCallback, useMemo, useRef, useState } from "react";
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
  View
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const SEARCH_BAR_HEIGHT = 58;

function getSlugFromCategoryUrl(url: string, fallback: string) {
  try {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? fallback;
  } catch {
    return fallback;
  }
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

  const items = useMemo<VideoCard[]>(
    () => data?.pages.flatMap((p) => p.items) ?? [],
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
            pathname: "/show_detail",
            params: { video_url: item.video_url },
          })
        }
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor: colors.surfaceContainerLow,
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
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
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
      </View>
    );
  }, [categories, common.heading, colors.surfaceContainerHigh, colors.onSurface, handleCategoryPress, isCategoriesLoading, submittedQuery, styles.categoryPill]);

  const ListFooterComponent = useCallback(() => {
    if (!submittedQuery || !hasNextPage) return null;

    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
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
            backgroundColor: colors.surfaceContainer,
            borderRadius: 999,
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 66 }}>
        <FlexText style={[common.heading, { fontSize: 28 }]}>
          Search Shows
        </FlexText>
        <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
          {submittedQuery
            ? `Results for "${submittedQuery}"`
            : "Pick a phrase then press Enter to search."}
        </FlexText>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.video_url}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={() => {
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
            bottom: insets.bottom + 16 + keyboardHeight,
          },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: colors.tertiaryContainer }]}>
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.onTertiaryContainer }]}
            placeholder="Search shows..."
            placeholderTextColor={colors.onTertiaryContainer + "80"}
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
      backgroundColor: colors.surfaceContainerHigh,
    },
    loadMoreButton: {
      borderRadius: 99999,
      paddingVertical: 14,
      paddingHorizontal: 16,
      justifyContent: "center",
      alignItems: "center",
    },
  });

export default SearchShowsScreen;
