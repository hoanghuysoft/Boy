import { BlurMask } from "@/components/blur mask/BlurMask";
import { FlexText } from "@/components/FlexText";
import { Ionicons } from "@expo/vector-icons";
import { Canvas, ImageShader, LinearGradient, Rect, useImage, vec } from "@shopify/react-native-skia";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { getColors } from "react-native-image-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeContext } from "../../context/ThemeContext";
import { createCommonStyles } from "../../styles/common";

const withAlpha = (hex: string, alphaHex: string) => {
  // Supports '#RRGGBB' and '#RRGGBBAA'. If not hex, fall back to original.
  if (typeof hex !== "string") return hex as unknown as string;
  if (hex.startsWith("#") && (hex.length === 7 || hex.length === 9)) {
    return hex.slice(0, 7) + alphaHex;
  }
  return hex;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    }
    : null;
};

const luminance = (hex: string): number | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));

const darkenHex = (hex: string, amount: number): string => {
  // amount: 0..1, where 0 = unchanged, 1 = black
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const a = Math.max(0, Math.min(1, amount));
  const r = clamp255(rgb.r * (1 - a));
  const g = clamp255(rgb.g * (1 - a));
  const b = clamp255(rgb.b * (1 - a));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const ChatScreen = () => {
  const { colors, typography } = useThemeContext();
  const blurTargetRef = useRef<View | null>(null);
  const common = createCommonStyles(colors, typography);
  const imageUrl = "https://cdn.prod.website-files.com/5ef387c475859118661dbbc7/67ac5802d44b5caa9d3c3035_Jayden%20Revri%20wonderland.jpeg";
  const image = useImage(imageUrl);
  const { width, height } = useWindowDimensions();
  const posterHeight = 400;
  const episodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const inset = useSafeAreaInsets();

  // `react-native-image-colors` requires fallback hex in #rgb or #rrggbb (NO alpha).
  const fallbackBase = useMemo(() => {
    const c = colors.background;
    return typeof c === "string" && c.startsWith("#") && c.length >= 7 ? c.slice(0, 7) : "#000000";
  }, [colors.background]);
  const [darkDominant, setDarkDominant] = useState<string>(darkenHex(fallbackBase, 0.55));

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const result = await getColors(imageUrl, {
          fallback: fallbackBase,
          cache: true,
          key: imageUrl,
        });

        let dominant: string | undefined | null = null;
        if (result.platform === "android") dominant = result.dominant ?? result.average;
        if (result.platform === "ios") dominant = result.background ?? result.primary;

        const dominantHex = dominant ? (dominant.startsWith("#") ? dominant : `#${dominant}`) : fallbackBase;
        const darker = darkenHex(dominantHex, 0.55);
        if (!cancelled) setDarkDominant(darker);
      } catch (e) {
        if (!cancelled) setDarkDominant(darkenHex(fallbackBase, 0.55));
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [imageUrl, fallbackBase]);

  return (
    <View style={[common.screen, { backgroundColor: darkDominant }]}>
      <BlurTargetView ref={blurTargetRef} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[{ gap: 12, paddingBottom: 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header poster (scrolls away) */}
          <View style={[styles.header, { height: posterHeight }]}>
            <Canvas style={{ height: posterHeight }}>
              <BlurMask
                mask={
                  <LinearGradient
                    start={vec(0, posterHeight * 0.5)}
                    end={vec(0, posterHeight)}
                    colors={["transparent", "black"]}
                  />
                }
              >
                <ImageShader
                  image={image}
                  x={0}
                  width={width}
                  height={posterHeight}
                  fit="cover"
                  tx="clamp"
                  ty="clamp"
                />
              </BlurMask>

              {/* Bottom→top overlay to blend into the solid background */}
              <Rect x={0} y={0} width={width} height={posterHeight}>
                <LinearGradient
                  start={vec(0, posterHeight)}
                  end={vec(0, 0)}
                  // Strong at bottom, fades out quickly (adjust positions to taste)
                  colors={[
                    withAlpha(darkDominant, "FF"), // solid at bottom
                    withAlpha(darkDominant, "99"), // stronger mid fade
                    "transparent",
                  ]}
                  positions={[0, 0.25, 1]}
                />
              </Rect>
            </Canvas>

            <View
              pointerEvents="none"
              style={[
                styles.headerOverlay,
                {
                  paddingBottom: 24, // distance from bottom
                },
              ]}
            >
              <FlexText style={{ color: "white", fontSize: 36, fontWeight: "700" }}>
                Tom Holland
              </FlexText>
              <FlexText numberOfLines={2} style={{ color: "white", fontSize: 16, fontWeight: "400", textAlign: "center" }}>
                The Amazing Spider-Man is a 2012 American superhero film based on the Marvel Comics character Spider-Man. It is the fifth installment in the Marvel Cinematic Universe (MCU) film series, produced by Marvel Studios and distributed by Columbia Pictures. Directed by Marc Webb, the film stars Andrew Garfield as Peter Parker/Spider-Man, with Emma Stone as Gwen Stacy, Rhys Ifans as the Lizard, and Martin Sheen as Uncle Ben.
              </FlexText>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Image source={require("../../assets/images/vision.png")} style={{ width: 32, height: 32, opacity: 0.8 }} contentFit="contain" />
                <Image source={require("../../assets/images/atmos.png")} style={{ width: 32, height: 32, opacity: 0.8 }} contentFit="contain" />
              </View>
            </View>
          </View>
          <View style={{ paddingHorizontal: 16 }}>
            <FlexText style={[styles.sectionTitle, { color: "white", marginBottom: 12 }]}>
              Episodes
            </FlexText>
            <View style={styles.episodeGrid}>
              {episodes.map((ep) => (
                <Pressable
                  key={ep}
                  onPress={() => { }}
                  style={({ pressed }) => [
                    styles.episodeButton,
                    {
                      backgroundColor: withAlpha("#FFFFFF", "14"),
                      borderColor: withAlpha("#FFFFFF", "2A"),
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <FlexText style={[styles.episodeText, { color: "white" }]}>
                    Episode {ep}
                  </FlexText>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ height: inset.bottom + 80 }} />
        </ScrollView>
      </BlurTargetView>
      <BlurView
        tint={"systemMaterialDark"}
        intensity={80}
        blurTarget={blurTargetRef}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={{
          borderRadius: 999,
          overflow: 'hidden',
          position: 'absolute',
          top: inset.top,
          left: 16,
          zIndex: 1000,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            borderRadius: 999,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Ionicons name='chevron-back' size={24} color={'white'} />
        </TouchableOpacity>
      </BlurView>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  header: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
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
  episodeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  episodeButton: {
    flexBasis: "30%",
    flexGrow: 1,
    maxWidth: "32%",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  episodeText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

