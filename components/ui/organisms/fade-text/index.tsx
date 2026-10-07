import { FlexText } from "@/components/FlexText";
import { BlurView } from "expo-blur";
import React, { memo, useEffect } from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { AnimatedWordProps, FadeTextProps } from "./types";

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export const FadeText: React.FC<FadeTextProps> = memo<FadeTextProps>(
  ({
    inputs,
    wordDelay = 300,
    delayOffset = 0,
    duration = 800,
    blurIntensity = [30, 10, 0],
    blurTint = "dark",
    scaleRange = [0.97, 1],
    translateYRange = [10, 0],
    opacityRange = [0, 0.5, 1],
    fontSize = 32,
    fontWeight = "600",
    color = "#ffffff",
    textAlign = "center",
    containerStyle,
    style,
  }: FadeTextProps): React.ReactNode & React.JSX.Element => {
    const words = inputs.flatMap((text, inputIndex) =>
      text
        ? text
          .split(" ")
          .filter((w) => w.length > 0)
          .map((word) => ({ word, inputIndex }))
        : [],
    );

    const alignmentStyle: ViewStyle = {
      alignItems:
        textAlign === "left"
          ? "flex-start"
          : textAlign === "right"
            ? "flex-end"
            : "center",
    };

    const textWrapperAlignmentStyle: ViewStyle = {
      justifyContent:
        textAlign === "left"
          ? "flex-start"
          : textAlign === "right"
            ? "flex-end"
            : "center",
      alignItems:
        textAlign === "left"
          ? "flex-start"
          : textAlign === "right"
            ? "flex-end"
            : "center",
    };

    return (
      <View style={[styles.container, alignmentStyle, containerStyle]}>
        <View style={[styles.textWrapper, textWrapperAlignmentStyle]}>
          {words.map((item, index) => (
            <AnimatedWord
              key={`${item.inputIndex}-${index}-${item.word}`}
              word={item.word}
              index={index}
              delay={delayOffset + index * wordDelay}
              duration={duration}
              blurIntensity={blurIntensity}
              blurTint={blurTint}
              scaleRange={scaleRange}
              translateYRange={translateYRange}
              opacityRange={opacityRange}
              fontSize={fontSize}
              style={style}
              fontWeight={fontWeight}
              color={color}
              textAlign={textAlign}
            />
          ))}
        </View>
      </View>
    );
  },
);

const AnimatedWord: React.FC<AnimatedWordProps> = memo<AnimatedWordProps>(
  ({
    word,
    delay,
    duration,
    blurIntensity,
    blurTint,
    scaleRange,
    translateYRange,
    opacityRange,
    fontSize,
    fontWeight,
    color,
    textAlign,
    style,
  }: AnimatedWordProps): React.ReactNode & React.JSX.Element => {
    const animationValue = useSharedValue<number>(0);

    useEffect(() => {
      animationValue.value = 0;
      animationValue.value = withDelay(
        delay,
        withTiming<number>(1, {
          duration,
          easing: Easing.out(Easing.cubic),
        }),
      );
    }, [delay, duration, word]);

    const animatedStyle = useAnimatedStyle<
      Pick<ViewStyle, "opacity" | "transform">
    >(() => {
      const opacity = interpolate(
        animationValue.value,
        [0, 0.8, 1],
        opacityRange,
        Extrapolation.CLAMP,
      );

      const scale = interpolate(
        animationValue.value,
        [0, 1],
        scaleRange,
        Extrapolation.CLAMP,
      );

      const translateY = interpolate(
        animationValue.value,
        [0, 1],
        translateYRange,
        Extrapolation.CLAMP,
      );

      return {
        opacity,
        transform: [{ scale }, { translateY }],
      };
    });

    const blurOverlayStyle = useAnimatedStyle<Pick<ViewStyle, "opacity">>(
      () => ({
        opacity: interpolate(
          animationValue.value,
          [0, 0.3, 1],
          [1, 1, 0],
          Extrapolation.CLAMP,
        ),
      }),
    );

    const blurAnimatedProps = useAnimatedProps(() => {
      const intensity = withSpring<number>(
        interpolate(
          animationValue.value,
          [0, 0.3, 1],
          blurIntensity,
          Extrapolation.CLAMP,
        ),
      );

      return {
        intensity,
      };
    });

    const animatedAndroidBlurViewStylez = useAnimatedStyle<
      Pick<ViewStyle, "filter">
    >(() => {
      const blur = withSpring<number>(
        interpolate(
          animationValue.value,
          [0, 0.3, 1],
          blurIntensity,
          Extrapolation.CLAMP,
        ),
      );

      return {
        filter: [
          {
            blur,
          },
        ],
      };
    });

    return (
      <Animated.View
        style={[
          styles.wordContainer,
          animatedStyle,
          Platform.OS === "android" && animatedAndroidBlurViewStylez,
        ]}
      >
        <FlexText
          style={[
            styles.word,
            {
              fontSize,
              fontWeight,
              color,
              textAlign,
            },
            style,
          ]}
        >
          {word}{" "}
        </FlexText>
        {Platform.OS === "ios" && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <AnimatedBlurView
              style={[StyleSheet.absoluteFill, blurOverlayStyle]}
              animatedProps={blurAnimatedProps}
              tint={blurTint}
            />
          </View>
        )}
      </Animated.View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  textWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  wordContainer: {
    overflow: "hidden",
  },
  word: {},
});
