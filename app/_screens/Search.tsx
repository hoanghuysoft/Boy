import { useAllProfiles } from "@/services/userprofile";
import { Profile } from "@/types/profile";
import { calculateAge } from "@/utils/timeandage";
import FastImage from "@d11/react-native-fast-image";
import { XmarkOutlined } from "@lineiconshq/free-icons";
import Lineicons from "@lineiconshq/react-native-lineicons";
import { FlashList as FlashListOriginal } from "@shopify/flash-list";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShimmerEffect } from "../../components/shimmer/Shimmer";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const FlashList = FlashListOriginal as any;


import { useRouter } from "expo-router";

const SearchScreen = () => {
  const navigation = useRouter();
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();

  const { data: profiles = [], isLoading, refetch, isRefetching } = useAllProfiles();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const filteredProfiles = useMemo(() => {
    if (searchQuery.trim() === "") {
      return profiles;
    } else {
      const query = searchQuery.toLowerCase();
      return profiles.filter(
        (profile: Profile) =>
          profile.name.toLowerCase().includes(query) ||
          profile.bio?.toLowerCase().includes(query) ||
          profile.email?.toLowerCase().includes(query) ||
          profile.hometown?.toLowerCase().includes(query)
      );
    }
  }, [searchQuery, profiles]);

  // Keyboard avoidance animation
  const searchBarBottomOffset = useRef(new Animated.Value(0)).current;

  // Bottom navigation spacing
  const bottomNavHeight = 67;
  const bottomNavMargin = 13;
  const searchBarHeight = 56;
  const baseSearchBarBottom = bottomNavHeight + bottomNavMargin + insets.bottom + 16;
  const contentBottomPadding = baseSearchBarBottom + searchBarHeight + 16;

  useEffect(() => {
    const keyboardWillShow = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardWillHide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(keyboardWillShow, (e) => {
      const keyboardHeight = e.endCoordinates.height;
      const bottomNavSpace = bottomNavHeight + bottomNavMargin + insets.bottom;
      const offset = keyboardHeight - bottomNavSpace + 8; // 8px padding above keyboard
      Animated.spring(searchBarBottomOffset, {
        toValue: offset,
        useNativeDriver: false,
        friction: 8,
        tension: 100,
      }).start();
    });

    const hideSubscription = Keyboard.addListener(keyboardWillHide, () => {
      Animated.spring(searchBarBottomOffset, {
        toValue: 0,
        useNativeDriver: false,
        friction: 8,
        tension: 100,
      }).start();
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const renderProfileSkeleton = () => (
    <View style={[styles.profileCard, { backgroundColor: colors.containerContent }]}>
      <ShimmerEffect
        isLoading={true}
        style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.divider }}
      />
      <View style={styles.profileInfo}>
        <ShimmerEffect
          isLoading={true}
          style={{ width: 140, height: 18, borderRadius: 8, backgroundColor: colors.divider }}
        />
        <ShimmerEffect
          isLoading={true}
          style={{ width: 100, height: 14, borderRadius: 6, marginTop: 6, backgroundColor: colors.divider }}
        />
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={[common.heading, { color: colors.muted, textAlign: "center", marginTop: 16 }]}>
        {searchQuery ? "No results found" : "Search for people"}
      </Text>
      <Text style={[common.bodySmall, { color: colors.muted, textAlign: "center", marginTop: 8, opacity: 0.7 }]}>
        {searchQuery
          ? `No profiles match "${searchQuery}"`
          : "Find friends, colleagues, and connections"}
      </Text>
    </View>
  );

  const renderProfile = useCallback(
    ({ item }: { item: Profile }) => (
      <TouchableOpacity
        style={[styles.profileCard, { backgroundColor: colors.containerContent }]}
        activeOpacity={0.7}
        onPress={() => navigation.push({ pathname: '/profile/[id]', params: { id: item.id, isMe: 'false' } })}
      >
        <FastImage
          source={{ uri: item.avatar_url }}
          style={styles.avatar}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={styles.profileInfo}>
          <Text style={[common.subheading, { color: colors.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.birthday && (
            <Text style={[common.caption, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>
              {calculateAge(item.birthday)} years old
            </Text>
          )}
          {item.bio ? (
            <Text style={[common.caption, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>
              {item.bio}
            </Text>
          ) : item.hometown ? (
            <Text style={[common.caption, { color: colors.muted, marginTop: 2 }]} numberOfLines={1}>
              📍 {item.hometown}
            </Text>
          ) : null}
        </View>
        <View style={[styles.viewButton, { backgroundColor: colors.card }]}>
          <Text style={[common.label, { color: colors.text, fontSize: 12 }]}>View</Text>
        </View>
      </TouchableOpacity>
    ),
    [colors, common]
  );

  const animatedSearchBarBottom = Animated.add(
    baseSearchBarBottom,
    searchBarBottomOffset
  );

  return (
    <KeyboardAvoidingView
      style={common.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[common.headline, { color: colors.text }]}>Search</Text>
        <Text style={[common.bodySmall, { color: colors.muted, marginTop: 4 }]}>
          People {profiles.length}
        </Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <FlashList
          data={[1, 2, 3, 4, 5, 6, 7, 8]}
          renderItem={() => renderProfileSkeleton()}
          keyExtractor={(item: any) => item.toString()}
          contentContainerStyle={[styles.listContent, { paddingBottom: contentBottomPadding }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          estimatedItemSize={80}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      ) : (
        <FlashList
          data={filteredProfiles}
          renderItem={renderProfile}
          keyExtractor={(item: Profile) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: contentBottomPadding },
            filteredProfiles.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          estimatedItemSize={80}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.text}
              colors={[colors.text]}
              progressBackgroundColor={colors.background}
            />
          }
        />
      )}

      {/* Floating Search Bar */}
      <Animated.View
        style={[
          styles.searchBarContainer,
          {
            bottom: animatedSearchBarBottom,
          },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.containerContent,
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text, marginLeft: 12 }]}
            placeholder="What are you looking for?"
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <View style={[styles.clearButtonInner, { backgroundColor: colors.card }]}>
                <Lineicons icon={XmarkOutlined} size={14} color={colors.text} strokeWidth={3} />
              </View>
            </TouchableOpacity>
          )}
        </View>
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
    justifyContent: "center",
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
    height: 56,
    borderRadius: 999,
    paddingHorizontal: 6
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
