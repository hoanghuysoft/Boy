import { BorderBeam } from "@/border-beam-native/src";
import { useThemeContext } from "@/context/ThemeContext";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { BlurView } from "expo-blur";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

export const SEARCH_BAR_HEIGHT = 58;

interface XUsersBottomSearchBarProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  blurTargetRef?: any;
  bottomInset: number;
}

export const XUsersBottomSearchBar = memo(function XUsersBottomSearchBar({
  searchQuery,
  onSearchChange,
  blurTargetRef,
  bottomInset,
}: XUsersBottomSearchBarProps) {
  const { colors, theme } = useThemeContext();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // ─── Frame-by-frame UI Thread Keyboard Animation ───────────────────────────
  const { height: keyboardHeight, progress: keyboardProgress } =
    useReanimatedKeyboardAnimation();

  const baseSearchBarBottom = bottomInset + 16;

  const animatedSearchBarStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [
        {
          translateY:
            keyboardHeight.value + keyboardProgress.value * (bottomInset - 8),
        },
      ],
    };
  });

  // ─── Dismiss input focus on keyboard hide ──────────────────────────────────
  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      inputRef.current?.blur();
      setIsFocused(false);
    });
    return () => sub.remove();
  }, []);

  const handleClear = useCallback(() => {
    onSearchChange("");
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, [onSearchChange]);

  return (
    <Animated.View
      style={[
        styles.searchBarContainer,
        { bottom: baseSearchBarBottom },
        animatedSearchBarStyle,
      ]}
    >
      <BorderBeam
        size={isFocused ? "pulse-inner" : "line"}
        colorVariant="colorful"
        theme="auto"
        borderRadius={28}
      >
        <BlurView
          blurMethod="dimezisBlurViewSdk31Plus"
          tint={
            theme === "dark"
              ? "systemThickMaterialDark"
              : "systemThickMaterialLight"
          }
          intensity={80}
          blurTarget={blurTargetRef}
          style={styles.searchBar}
        >
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text, marginLeft: 12 }]}
            placeholder="Search name or @username..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={onSearchChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <View
                style={[
                  styles.clearButtonInner,
                  { backgroundColor: colors.card },
                ]}
              >
                <Ionicons name="close" size={16} color={colors.text} />
              </View>
            </TouchableOpacity>
          )}
        </BlurView>
      </BorderBeam>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  searchBarContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: SEARCH_BAR_HEIGHT,
    borderRadius: 999,
    paddingHorizontal: 6,
    overflow: "hidden",
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

