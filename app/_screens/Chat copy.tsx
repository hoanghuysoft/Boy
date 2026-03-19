import { BlurMask } from "@/components/blur mask/BlurMask";
import { FlexText } from "@/components/FlexText";
import { Ionicons } from "@expo/vector-icons";
import { Canvas, ImageShader, LinearGradient, Rect, useImage, vec } from "@shopify/react-native-skia";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useRef } from "react";
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from "react-native";
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

const ChatScreen = () => {
  const { colors, typography } = useThemeContext();
  const blurTargetRef = useRef<View | null>(null);
  const common = createCommonStyles(colors, typography);
  const imageUrl =
    "https://cdn2.tuoitre.vn/thumb_w/480/471584752817336320/2025/9/28/8e6c2ba4b76a3d34647b-1759022355455981376917.jpg";
  const image = useImage(imageUrl);
  const { width, height } = useWindowDimensions();
  const posterHeight = 400;
  const episodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  const inset = useSafeAreaInsets();
  return (
    <View style={common.screen}>
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
                    withAlpha(colors.background, "F2"), // ~95% at bottom
                    withAlpha(colors.background, "66"), // ~40% shortly above bottom
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
            <FlexText style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
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
                      backgroundColor: colors.card,
                      borderColor: withAlpha(colors.text, "22"),
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <FlexText style={[styles.episodeText, { color: colors.text }]}>
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

