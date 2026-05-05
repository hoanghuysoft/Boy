import { FlexText } from "@/components/FlexText";
import { appleIntelli } from "@/components/glow/AppleIntelliConfig";
import { MostSearchedSection } from "@/components/search/MostSearchedSection";
import { renderEmptyState } from "@/components/search/SearchEmpty";
import { renderFooter } from "@/components/search/SearchFooter";
import { SearchProfileItem } from "@/components/search/SearchProfileItem";
import { renderProfileSkeleton } from "@/components/search/SearchProfileSkeleton";
import { TrendingHashtagsSection } from "@/components/search/TrendingHashtagsSection";
import { Profile } from "@/types/profile";
import { Ionicons } from "@expo/vector-icons";
import { XmarkOutlined } from "@lineiconshq/free-icons";
import LineiconsIcon from "@lineiconshq/react-native-lineicons";
import { FlashList as FlashListOriginal } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AnimatedGlow from "react-native-animated-glow";
import Animated from "react-native-reanimated";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";
import { useSearchViewModel } from "../../viewmodels/SearchViewModel";

const FlashList = FlashListOriginal as any;

const ITEM_SEPARATOR = () => <View style={{ height: 12 }} />;

const SearchScreen = () => {
  const navigation = useRouter();
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const { t } = useTranslation();

  // ─── ViewModel ─────────────────────────────────────────────────
  const vm = useSearchViewModel();

  const renderItem = useCallback(
    ({ item }: { item: Profile }) => (
      <SearchProfileItem
        item={item}
        colors={colors}
        styles={styles}
        common={common}
        navigation={navigation}
        onPress={vm.handleProfilePress}
      />
    ),
    [colors, common, navigation, vm.handleProfilePress],
  );

  const ListEmptyComponent = useCallback(
    () =>
      renderEmptyState({
        colors,
        styles,
        common,
        searchQuery: vm.searchQuery,
        isAdmin: vm.isAdmin,
        t,
      }),
    [colors, common, vm.searchQuery, vm.isAdmin, t],
  );

  const ListFooterComponent = useCallback(
    () =>
      renderFooter({
        isFetchingNextPage: vm.isFetchingNextPage,
        colors,
        styles,
        renderProfileSkeleton,
      }),
    [vm.isFetchingNextPage, colors],
  );

  const ListHeaderComponent = useCallback(
    () =>
      !vm.searchQuery ? (
        <View style={{ paddingBottom: 8 }}>
          <MostSearchedSection />
          <TrendingHashtagsSection />
        </View>
      ) : null,
    [vm.searchQuery],
  );

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {/* Floating back button — same pattern as Bookmarks/Settings */}
      <View
        style={{
          position: "absolute",
          top: vm.insets.top + 16,
          left: 16,
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.back()}
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

      <View style={[styles.header, { marginTop: vm.insets.top + 66 }]}>
        <FlexText style={[common.heading, { fontSize: 28 }]}>{t('search.header.title')}</FlexText>
        <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
          {vm.searchQuery
            ? t('search.header.resultsCount', { count: vm.totalResults })
            : vm.isAdmin
              ? t('search.header.peopleCount', { count: vm.totalResults })
              : t('search.header.exploreSubtitle')}
        </FlexText>
      </View>

      {/* Content */}
      {vm.isLoading ? (
        <FlashList
          data={[1, 2, 3, 4, 5, 6, 7, 8]}
          renderItem={() => renderProfileSkeleton({ colors, styles })}
          keyExtractor={(item: any) => item.toString()}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: vm.contentBottomPadding },
          ]}
          ListHeaderComponent={ListHeaderComponent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          estimatedItemSize={80}
          ItemSeparatorComponent={ITEM_SEPARATOR}
        />
      ) : (
        <FlashList
          ref={vm.listRef}
          data={vm.profiles}
          renderItem={renderItem}
          keyExtractor={(item: Profile) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: vm.contentBottomPadding },
            vm.profiles.length === 0 && styles.emptyListContent,
          ]}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={ListEmptyComponent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          estimatedItemSize={80}
          ItemSeparatorComponent={ITEM_SEPARATOR}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.handleRefresh}
              tintColor={colors.text}
              colors={[colors.text]}
              progressBackgroundColor={colors.card}
            />
          }
          onEndReached={vm.handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooterComponent}
        />
      )}

      {/* Floating Search Bar */}
      <Animated.View
        style={[
          styles.searchBarContainer,
          { bottom: vm.baseSearchBarBottom },
          vm.animatedSearchBarStyle,
        ]}
      >
        <AnimatedGlow
          preset={appleIntelli}
          activeState={vm.isFocused ? "press" : "default"}
          style={{ borderRadius: 999 }}
        >
          <View style={[styles.searchBar]}>
            <TextInput
              ref={vm.inputRef}
              style={[styles.searchInput, { color: "white", marginLeft: 12 }]}
              placeholder={t('search.searchBar.placeholder')}
              placeholderTextColor={colors.muted}
              value={vm.searchQuery}
              onChangeText={vm.handleSearchChange}
              onFocus={vm.handleFocus}
              onBlur={vm.handleBlur}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {vm.searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={vm.clearSearch}
                style={styles.clearButton}
              >
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
        </AnimatedGlow>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyListContent: {
    flex: 1,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 9999,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileInfo: {
    flex: 1,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  searchBarContainer: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    borderRadius: 999,
    paddingHorizontal: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 0,
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
});

export default SearchScreen;
