/**
 * Instagram Story Gradient Ring
 *
 * Renders the iconic Instagram gradient ring around an avatar when active stories exist.
 */

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface InstagramStoryRingProps {
  hasStory?: boolean;
  isSeen?: boolean;
  size?: number;
  borderWidth?: number;
  gap?: number;
  onPress?: () => void;
  children: React.ReactNode;
}

export const INSTAGRAM_GRADIENT_COLORS = [
  "#F58529",
  "#FEDA77",
  "#DD2A7B",
  "#8134AF",
  "#515BD4",
] as const;

export const SEEN_GRADIENT_COLORS = [
  "#8E8E93",
  "#AEAEB2",
  "#C7C7CC",
] as const;

export const InstagramStoryRing: React.FC<InstagramStoryRingProps> = ({
  hasStory = false,
  isSeen = false,
  size = 80,
  borderWidth = 2.5,
  gap = 2.5,
  onPress,
  children,
}) => {
  if (!hasStory) {
    if (onPress) {
      return (
        <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
          {children}
        </TouchableOpacity>
      );
    }
    return <>{children}</>;
  }

  const ringSize = size + (borderWidth + gap) * 2;
  const gradientColors = isSeen ? SEEN_GRADIENT_COLORS : INSTAGRAM_GRADIENT_COLORS;

  const content = (
    <View style={[styles.container, { width: ringSize, height: ringSize }]}>
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradientRing,
          {
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            padding: borderWidth,
          },
        ]}
      >
        <View
          style={[
            styles.innerGap,
            {
              width: size + gap * 2,
              height: size + gap * 2,
              borderRadius: (size + gap * 2) / 2,
            },
          ]}
        >
          {children}
        </View>
      </LinearGradient>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  gradientRing: {
    alignItems: "center",
    justifyContent: "center",
  },
  innerGap: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
});
