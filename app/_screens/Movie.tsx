import Magnifier from "@/assets/images/svg/search.svg";
import { MovieDBView } from "@/components/tracker/MovieDBView";
import { MINIMIZE_SPRING, useTabBarMinimized } from "expo-glass-tabs";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const MovieScreen = () => {
  const { colors, typography } = useThemeContext();
  const common = createCommonStyles(colors, typography);
  const inset = useSafeAreaInsets();
  const [headerScrollX] = useState(() => new Animated.Value(0));
  const [scrollY] = useState(() => new Animated.Value(0));

  const headerBgOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const minimizedProgress = useTabBarMinimized();
  const minimizedTarget = useSharedValue(0);
  const previousY = useRef(0);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      const y = Math.max(value, 0);
      const dy = y - previousY.current;
      previousY.current = y;

      let nextTarget = minimizedTarget.value;
      if (y < 24) {
        nextTarget = 0;
      } else if (dy > 3) {
        nextTarget = 1;
      } else if (dy < -3) {
        nextTarget = 0;
      }

      if (minimizedTarget.value !== nextTarget) {
        minimizedTarget.value = nextTarget;
        minimizedProgress.value = withSpring(nextTarget, MINIMIZE_SPRING);
      }
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  return (
    <View style={[common.screen, { backgroundColor: "#000000" }]}>
      <MovieDBView headerScrollX={headerScrollX} scrollY={scrollY} />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <Animated.View
          style={{
            ...StyleSheet.absoluteFill,
            backgroundColor: "#000000",
            opacity: headerBgOpacity,
          }}
        />
        <View
          style={{
            paddingTop: inset.top + 6,
            paddingBottom: 12,
            paddingHorizontal: 16,
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
              onPress={() => router.push("/search_movies")}
              style={{
                borderRadius: 999,
                width: 40,
                height: 40,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Magnifier width={28} height={28} color={"white"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MovieScreen;

const styles = StyleSheet.create({
  textStyle: {
    fontSize: 14,
  },
});
