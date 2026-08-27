/**
 * Instagram Story Viewer Fullscreen Modal
 *
 * Implements a high-fidelity Instagram Story Player:
 * - Animated multi-segment progress bars
 * - Tap left/right navigation & press-and-hold pause/resume
 * - Image & Expo Video playback (expo-video)
 * - Author info & timestamp
 * - Native Cross-post button to share story to WeLove feed
 */

import { FlexText } from "@/components/FlexText";
import { FALLBACK_AVATAR_URL } from "@/components/profile/header/constants";
import { InstagramStoryItem, InstagramUser } from "@/services/instagram/types";
import { Post } from "@/types/post";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getHighestQualityImageUrl,
  getHighestQualityVideoUrl,
  transformInstagramStoryToPost,
} from "./transformInstagramPost";
import { formatStoryTime } from "./utils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const DEFAULT_PHOTO_DURATION = 5000; // 5 seconds per photo story

interface StoryVideoPlayerProps {
  url: string;
  isPaused: boolean;
}

const StoryVideoPlayer: React.FC<StoryVideoPlayerProps> = ({ url, isPaused }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.muted = false;
    p.play();
  });

  useEffect(() => {
    if (isPaused) {
      player.pause();
    } else {
      player.play();
    }
  }, [isPaused, player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="contain"
      nativeControls={false}
      surfaceType="textureView"
    />
  );
};

interface InstagramStoryViewerProps {
  isVisible: boolean;
  stories: InstagramStoryItem[];
  user?: InstagramUser | null;
  initialIndex?: number;
  onClose: () => void;
  onCrossPostPress?: (post: Post) => void;
}

export const InstagramStoryViewer: React.FC<InstagramStoryViewerProps> = ({
  isVisible,
  stories = [],
  user,
  initialIndex = 0,
  onClose,
  onCrossPostPress,
}) => {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  // Sync initial index
  useEffect(() => {
    if (isVisible) {
      setCurrentIndex(Math.min(Math.max(0, initialIndex), Math.max(0, stories.length - 1)));
    }
  }, [isVisible, initialIndex, stories.length]);

  const currentStory = stories[currentIndex] as any;
  const rawStory = currentStory as any;

  const videoUrl =
    getHighestQualityVideoUrl(currentStory) ||
    rawStory?.video ||
    rawStory?.videoUrl ||
    rawStory?.video_url;

  const imageUrl =
    getHighestQualityImageUrl(currentStory) ||
    rawStory?.image ||
    rawStory?.displayUrl ||
    rawStory?.display_url ||
    rawStory?.url;

  const isVideo =
    !!videoUrl ||
    rawStory?.mediaType === "video" ||
    rawStory?.media_type === 2 ||
    rawStory?.mediaType === 2;

  const authorAvatar = getHighestQualityImageUrl(user) || FALLBACK_AVATAR_URL;

  const durationMs =
    isVideo && rawStory?.video_duration
      ? Math.max(rawStory.video_duration * 1000, 3000)
      : isVideo && rawStory?.videoDuration
      ? Math.max(rawStory.videoDuration * 1000, 3000)
      : DEFAULT_PHOTO_DURATION;

  const nextStory = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const prevStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      // Replay from start
      progressAnim.setValue(0);
    }
  }, [currentIndex, progressAnim]);

  // Start progress animation
  useEffect(() => {
    if (!isVisible || !currentStory) return;

    progressAnim.setValue(0);

    if (isPaused) return;

    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs,
      useNativeDriver: false,
    });

    animRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        nextStory();
      }
    });

    return () => {
      anim.stop();
    };
  }, [isVisible, currentIndex, isPaused, durationMs, nextStory, progressAnim, currentStory]);

  const handlePressIn = () => {
    setIsPaused(true);
    animRef.current?.stop();
  };

  const handlePressOut = () => {
    setIsPaused(false);
  };

  const handleTapScreen = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    if (x < SCREEN_WIDTH * 0.3) {
      prevStory();
    } else {
      nextStory();
    }
  };

  const handleCrossPost = () => {
    if (!currentStory) return;
    setIsPaused(true);
    const postModel = transformInstagramStoryToPost(currentStory, user);
    onCrossPostPress?.(postModel);
  };

  if (!isVisible || stories.length === 0 || !currentStory) {
    return null;
  }

  const authorName =
    user?.name ||
    user?.fullName ||
    user?.full_name ||
    user?.username ||
    "Instagram";
  const timeAgo = formatStoryTime(currentStory?.created_at || currentStory?.takenAt || currentStory?.taken_at);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {/* Main Media View */}
        <TouchableWithoutFeedback
          onPress={handleTapScreen}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View style={styles.mediaContainer}>
            {/* Always render base image so the story is never black */}
            {imageUrl ? (
              <ExpoImage
                source={{ uri: imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                transition={150}
              />
            ) : null}

            {/* If video, render Expo VideoView on top */}
            {isVideo && videoUrl ? (
              <StoryVideoPlayer
                key={videoUrl}
                url={videoUrl}
                isPaused={isPaused}
              />
            ) : null}
          </View>
        </TouchableWithoutFeedback>

        {/* Top Gradient Shadow */}
        <LinearGradient
          colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0.3)", "transparent"]}
          style={[styles.topGradient, { height: insets.top + 90 }]}
          pointerEvents="none"
        />

        {/* Bottom Gradient Shadow */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.85)"]}
          style={[styles.bottomGradient, { height: insets.bottom + 120 }]}
          pointerEvents="none"
        />

        {/* Multi-Segment Progress Bars */}
        <View style={[styles.progressBarsContainer, { top: insets.top + 8 }]}>
          {stories.map((story, index) => {
            let progress = 0;
            if (index < currentIndex) {
              progress = 1;
            } else if (index === currentIndex) {
              return (
                <View key={story.id || index} style={styles.progressBarTrack}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["0%", "100%"],
                        }),
                      },
                    ]}
                  />
                </View>
              );
            }

            return (
              <View key={story.id || index} style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: progress === 1 ? "100%" : "0%" },
                  ]}
                />
              </View>
            );
          })}
        </View>

        {/* Story Header (Author + Time + Close) */}
        <View style={[styles.header, { top: insets.top + 22 }]}>
          <View style={styles.userInfo}>
            <ExpoImage
              source={{ uri: authorAvatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            <FlexText style={styles.userName} numberOfLines={1}>
              {authorName}
            </FlexText>
            {timeAgo ? (
              <FlexText style={styles.timeAgo}>• {timeAgo}</FlexText>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Bottom Story Footer (Caption / CTA Link / Cross-post) */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {currentStory?.caption ? (
            <FlexText style={styles.captionText} numberOfLines={3}>
              {typeof currentStory.caption === "string"
                ? currentStory.caption
                : currentStory.caption?.text || ""}
            </FlexText>
          ) : null}

          <View style={styles.footerRow}>
            {/* Story CTA Link if present */}
            {currentStory?.storyCtaUrl || currentStory?.story_cta_url ? (
              <View style={styles.linkBadge}>
                <Ionicons name="link" size={14} color="#FFF" />
                <FlexText style={styles.linkBadgeText}>See Link</FlexText>
              </View>
            ) : (
              <View />
            )}

            {/* Cross-post to WeLove Feed button */}
            {onCrossPostPress && (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCrossPost}
                style={styles.crossPostButton}
              >
                <Ionicons name="repeat" size={18} color="#FFF" />
                <FlexText style={styles.crossPostText}>Cross-post Story</FlexText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    position: "relative",
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  progressBarsContainer: {
    position: "absolute",
    left: 8,
    right: 8,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 2.5,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#FFF",
    borderRadius: 2,
  },
  header: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#333",
  },
  userName: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 14,
    marginLeft: 10,
    maxWidth: SCREEN_WIDTH * 0.45,
  },
  timeAgo: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 12,
    marginLeft: 6,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 16,
    right: 16,
    zIndex: 10,
    gap: 12,
  },
  captionText: {
    color: "#FFF",
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  linkBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  crossPostButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(24, 119, 242, 0.9)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  crossPostText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
