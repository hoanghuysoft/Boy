import { MovieDBView } from "@/components/tracker/MovieDBView";
import { FolderFavouriteBookmarkBold, RoundedMagnifierBold } from "@solar-icons/react-native";
import { BlurTargetView } from "expo-blur";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const ChatScreen = () => {
  const { colors, typography } = useThemeContext();
  const blurTargetRef = useRef<View | null>(null);
  const common = createCommonStyles(colors, typography);
  const inset = useSafeAreaInsets();
  const [headerScrollX] = useState(() => new Animated.Value(0));

  return (
    <View style={[common.screen, { backgroundColor: "#000000" }]}>
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <MovieDBView headerScrollX={headerScrollX} />
      </BlurTargetView>
      <View
        style={{
          position: "absolute",
          top: inset.top,
          left: 16,
          right: 16,
          zIndex: 1000,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ExpoImage source={require("../../assets/images/logo_head.png")} style={{ width: 50, height: 50 }} contentFit="contain" />
          <Text style={[styles.textStyle, { color: "white", fontSize: 42, fontWeight: "700" }]}>tv</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <TouchableOpacity
            onPress={() => router.push("/watchlist")}
            style={{
              borderRadius: 999,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FolderFavouriteBookmarkBold size={28} color={"white"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/search_movies")}
            style={{
              borderRadius: 999,
              width: 40,
              height: 40,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <RoundedMagnifierBold size={28} color={"white"} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  textStyle: {
    fontSize: 14,
  },
});
