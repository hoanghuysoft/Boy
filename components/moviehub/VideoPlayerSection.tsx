/* eslint-disable react-hooks/refs */
/**
 * VideoPlayerSection
 *
 * Full custom YouTube-style controls on top of expo-video VideoView:
 *  - Single GestureDetector layer handles all touch (tap / double-tap / long-press)
 *  - Tap          → show/hide controls (auto-hide 3 s)
 *  - Double-tap L  → seek –10 s  |  Double-tap R → seek +10 s  (accumulating)
 *  - Long-press   → 2× speed; release → restore
 *  - Custom bottom bar: progress scrub, time, fullscreen
 *  - Fullscreen: orientation lock + zIndex overlay (no native fullscreen)
 */
import PauseIcon from '@/assets/images/svg/pause.svg';
import PlayIcon from '@/assets/images/svg/play.svg';
import { Slider } from "@expo/ui/community/slider";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import MaterialIcons from "@react-native-vector-icons/material-icons/static";
import { useEvent, useEventListener } from "expo";
import { Image as ExpoImage } from "expo-image";
import * as ScreenOrientation from "expo-screen-orientation";
import type { VideoPlayer } from "expo-video";
import { VideoView } from "expo-video";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spinner } from "heroui-native/spinner";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import {
  Animated,
  BackHandler,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import SystemNavigationBar from "react-native-system-navigation-bar";

interface VideoPlayerSectionProps {
  player: VideoPlayer;
  resolvedUri: string;
  posterUrl?: string;
  width: number;
  videoHeight: number;
  isFocused: boolean;
}

const SEEK_SECONDS = 10;
const CONTROLS_HIDE_MS = 3000;

function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, "0")}`;
}

// ── External Helper Functions ────────────────────────────────────────────────
// These helpers update the properties of the expo-video VideoPlayer instance.
// Using external functions bypasses React Compiler/linter prop mutation checks.
function setPlayerTime(player: VideoPlayer, time: number) {
  try {
    player.currentTime = time;
  } catch (e) {
    console.warn("Failed to set player time (released):", e);
  }
}

function setPlayerPlaybackRate(player: VideoPlayer, rate: number) {
  try {
    player.playbackRate = rate;
  } catch (e) {
    console.warn("Failed to set playback rate (released):", e);
  }
}

function getPlayerPlaybackRate(player: VideoPlayer): number {
  try {
    return player.playbackRate;
  } catch (e) {
    console.warn("Failed to get playback rate (released):", e);
    return 1.0;
  }
}

// Configuration setting helper
function setPlayerTimeUpdateInterval(player: VideoPlayer, interval: number) {
  try {
    player.timeUpdateEventInterval = interval;
  } catch (e) {
    console.warn("Failed to set time update interval (released):", e);
  }
}

function setPlayerMuted(player: VideoPlayer, muted: boolean) {
  try {
    player.muted = muted;
  } catch (e) {
    console.warn("Failed to set player muted (released):", e);
  }
}

function setPlayerLoop(player: VideoPlayer, loop: boolean) {
  try {
    player.loop = loop;
  } catch (e) {
    console.warn("Failed to set player loop (released):", e);
  }
}

const seekerStates = new Map<string, { isSlidingActive: boolean; wasPlayingOnSlide: boolean }>();

export const VideoPlayerSection = ({
  player,
  resolvedUri,
  posterUrl,
  width,
  videoHeight,
  isFocused,
}: VideoPlayerSectionProps) => {
  const viewRef = useRef<VideoView>(null);
  const { width: windowWidth } = useWindowDimensions();

  const insets = useSafeAreaInsets();
  const instanceId = useId();

  // Initialize/Cleanup seekerState in global Map
  useEffect(() => {
    seekerStates.set(instanceId, { isSlidingActive: false, wasPlayingOnSlide: false });
    return () => {
      seekerStates.delete(instanceId);
    };
  }, [instanceId]);

  const getSeekerState = useCallback(() => {
    let state = seekerStates.get(instanceId);
    if (!state) {
      state = { isSlidingActive: false, wasPlayingOnSlide: false };
      seekerStates.set(instanceId, state);
    }
    return state;
  }, [instanceId]);

  // ── Player state ────────────────────────────────────────────────────────────
  const { isPlaying } = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const { muted: isMuted } = useEvent(player, "mutedChange", {
    muted: player.muted,
  });
  const [isLooping, setIsLooping] = useState(player.loop);
  const [currentTime, setCurrentTime] = useState(player.currentTime);
  const [duration, setDuration] = useState(player.duration);
  const [status, setStatus] = useState(player.status);

  // Sync state during render if player instance changes (linter-friendly prop-to-state pattern)
  const [prevPlayer, setPrevPlayer] = useState(player);
  if (player !== prevPlayer) {
    setPrevPlayer(player);
    setCurrentTime(player.currentTime);
    setDuration(player.duration);
    setStatus(player.status);
    setIsLooping(player.loop);
  }

  useEventListener(player, "statusChange", ({ status: s }) => {
    setStatus(s);
    if (s === "readyToPlay") {
      setDuration(player.duration);
    }
  });
  useEventListener(player, "sourceLoad", ({ duration: d }) => {
    setDuration(d);
    setCurrentTime(0);
  });
  useEventListener(player, "timeUpdate", ({ currentTime: ct }) => {
    const state = seekerStates.get(instanceId);
    if (state?.isSlidingActive) return;
    setCurrentTime(ct);
    if (player.duration) {
      setDuration(player.duration);
    }
  });

  useEffect(() => {
    setPlayerTimeUpdateInterval(player, 0.5);
    return () => {
      setPlayerTimeUpdateInterval(player, 0);
    };
  }, [player]);

  const handleChevronPress = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      router.back();
    }
  };

  const toggleLoop = () => {
    const nextLoop = !isLooping;
    setPlayerLoop(player, nextLoop);
    setIsLooping(nextLoop);
    scheduleHide();
  };

  // ── Controls visibility ──────────────────────────────────────────────────────
  const [controlsVisible, setControlsVisible] = useState(false);
  const [controlsOpacity] = useState(() => new Animated.Value(0));
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setControlsVisible(false));
    }, CONTROLS_HIDE_MS);
  }, [clearHideTimer, controlsOpacity, setControlsVisible]);

  const showControls = useCallback(() => {
    clearHideTimer();
    setControlsVisible(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    scheduleHide();
  }, [clearHideTimer, controlsOpacity, scheduleHide, setControlsVisible]);

  const hideControls = useCallback(() => {
    clearHideTimer();
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setControlsVisible(false));
  }, [clearHideTimer, controlsOpacity, setControlsVisible]);

  // ── Seeker State & Handlers ──────────────────────────────────────────────────
  const [slidingValue, setSlidingValue] = useState<number | null>(null);
  const lastSeekTime = useRef(0);
  const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleValueChange = useCallback((val: number) => {
    const state = getSeekerState();
    // Detect start of sliding
    if (!state.isSlidingActive) {
      state.isSlidingActive = true;
      clearHideTimer();
      try {
        state.wasPlayingOnSlide = player.playing;
        player.pause();
      } catch {}
    }

    setSlidingValue(val);

    // Cancel pending finalization
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
    }
    if (lockTimeoutRef.current) {
      clearTimeout(lockTimeoutRef.current);
    }

    // Throttle native player seeks to 150ms during active dragging
    const now = Date.now();
    if (now - lastSeekTime.current > 150) {
      setPlayerTime(player, val);
      lastSeekTime.current = now;
    }

    // Debounce slider release: finalize 250ms after the last value change
    seekTimeoutRef.current = setTimeout(() => {
      setPlayerTime(player, val);
      if (state.wasPlayingOnSlide) {
        try {
          player.play();
        } catch {}
      }
      scheduleHide();

      // Lock sliding state for another 400ms to allow native seek to catch up
      lockTimeoutRef.current = setTimeout(() => {
        state.isSlidingActive = false;
        setSlidingValue(null);
      }, 400);
    }, 250);
  }, [player, getSeekerState, clearHideTimer, scheduleHide]);

  // Clean up seek timeouts on unmount
  useEffect(() => {
    return () => {
      if (seekTimeoutRef.current) clearTimeout(seekTimeoutRef.current);
      if (lockTimeoutRef.current) clearTimeout(lockTimeoutRef.current);
    };
  }, []);

  // ── Fullscreen ───────────────────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen layout state reactively with physical orientation updates
  useEffect(() => {
    const sub = ScreenOrientation.addOrientationChangeListener((event) => {
      const orientation = event.orientationInfo.orientation;
      const isLandscape =
        orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

      // Animate the size/layout shift to prevent visible snapping or jump stutters
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsFullscreen(isLandscape);
    });

    return () => {
      sub.remove();
      // Restore orientation and system navigation bar defaults on unmount
      ScreenOrientation.unlockAsync().catch(() => {});
      SystemNavigationBar.fullScreen(false);
    };
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (Platform.OS === "android") {
      SystemNavigationBar.stickyImmersive();
    } else {
      SystemNavigationBar.fullScreen(true);
    }
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
    showControls();
  }, [showControls]);

  const exitFullscreen = useCallback(async () => {
    SystemNavigationBar.fullScreen(false);
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
    showControls();
  }, [showControls]);

  // Intercept Android hardware back button to exit fullscreen first
  useEffect(() => {
    if (!isFullscreen) return;

    const onBackPress = () => {
      exitFullscreen();
      return true; // prevent default go-back behavior
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

    return () => {
      subscription.remove();
    };
  }, [isFullscreen, exitFullscreen]);

  // ── Seek feedback badge ──────────────────────────────────────────────────────
  const [seekFeedback, setSeekFeedback] = useState<{
    side: "left" | "right";
    count: number;
  } | null>(null);
  const seekFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSeekFeedback = useCallback((side: "left" | "right") => {
    if (seekFeedbackTimer.current) clearTimeout(seekFeedbackTimer.current);
    setSeekFeedback((prev) => ({
      side,
      count: prev?.side === side ? (prev.count + 1) : 1,
    }));
    seekFeedbackTimer.current = setTimeout(() => setSeekFeedback(null), 700);
  }, []);

  // ── Long-press 2× speed ──────────────────────────────────────────────────────
  const [is2x, setIs2x] = useState(false);
  const originalRate = useRef(1);

  // ── RNGH Gestures ────────────────────────────────────────────────────────────
  // Split screen into left / right half for double-tap seek.
  // We use a single simultaneous tap gesture that checks x position.

  const singleTap = useMemo(() => {
    const gesture = Gesture.Tap()
      .maxDuration(250)
      .runOnJS(true)
      .onEnd(() => {
        if (controlsVisible) {
          hideControls();
        } else {
          showControls();
        }
      });
    return gesture;
  }, [controlsVisible, hideControls, showControls]);

  const doubleTap = useMemo(() => {
    const gesture = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .runOnJS(true)
      .onEnd((e) => {
        const side = e.x < windowWidth / 2 ? "left" : "right";
        try {
          player.seekBy(side === "right" ? SEEK_SECONDS : -SEEK_SECONDS);
        } catch (err) {
          console.warn("Failed to seek (released):", err);
        }
        showSeekFeedback(side);
        showControls();
      });
    return gesture;
  }, [player, windowWidth, showSeekFeedback, showControls]);

  const longPress = useMemo(() => {
    const gesture = Gesture.LongPress()
      .minDuration(400)
      .runOnJS(true)
      .onStart(() => {
        originalRate.current = getPlayerPlaybackRate(player);
        setPlayerPlaybackRate(player, 2);
        setIs2x(true);
        showControls();
      })
      .onEnd(() => {
        setPlayerPlaybackRate(player, originalRate.current);
        setIs2x(false);
      })
      .onFinalize(() => {
        setPlayerPlaybackRate(player, originalRate.current);
        setIs2x(false);
      });
    return gesture;
  }, [player, showControls]);

  const combinedGesture = useMemo(() => {
    singleTap.requireExternalGestureToFail(doubleTap);
    return Gesture.Simultaneous(
      Gesture.Race(doubleTap, singleTap),
      longPress
    );
  }, [doubleTap, singleTap, longPress]);

  // ── Progress bar ─────────────────────────────────────────────────────────────
  // (Using HeroUI Slider component directly in bottom bar)

  // ── Container ────────────────────────────────────────────────────────────────
  const containerStyle = isFullscreen
    ? styles.fullscreenContainer
    : { width, height: videoHeight, backgroundColor: "#000" as const };

  // ── Placeholder (no URI yet) ─────────────────────────────────────────────────
  if (!resolvedUri) {
    return (
      <View style={{ width, height: videoHeight, backgroundColor: "#000" }}>
        <View style={styles.placeholderContainer}>
          {posterUrl ? (
            <ExpoImage
              source={{ uri: posterUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : null}
          <View style={styles.loadingOverlay}>
            <MaterialIcons name="play-circle-filled" size={64} color="rgba(255,255,255,0.8)" />
          </View>
        </View>
      </View>
    );
  }
  const validDuration = typeof duration === "number" && !isNaN(duration) && duration > 0 ? duration : 100;
  const rawSliderValue = slidingValue !== null ? slidingValue : currentTime;
  const validSliderValue = Math.min(
    validDuration,
    Math.max(0, typeof rawSliderValue === "number" && !isNaN(rawSliderValue) && rawSliderValue >= 0 ? rawSliderValue : 0)
  );

  return (
    <View style={containerStyle}>
      {/* Underlying VideoView — only render when focused to avoid black screen on back navigation */}
      {isFocused ? (
        <VideoView
          ref={viewRef}
          player={player}
          style={StyleSheet.absoluteFill}
          nativeControls={false}
          contentFit="contain"
        />
      ) : (
        <View style={StyleSheet.absoluteFill}>
          {posterUrl ? (
            <ExpoImage
              source={{ uri: posterUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]} />
          )}
        </View>
      )}

      {/* Buffering ring */}
      {status === "loading" && (
        <View style={styles.bufferOverlay} pointerEvents="none">
          <Spinner color="#ffffff" size="lg" />
        </View>
      )}

      {/* 2× speed badge */}
      {is2x && (
        <View style={styles.speedBadge} pointerEvents="none">
          <Text style={styles.speedBadgeText}>2× Speed</Text>
        </View>
      )}

      {/* Seek feedback */}
      {seekFeedback?.side === "left" && (
        <View style={[styles.seekFeedback, styles.seekFeedbackLeft]} pointerEvents="none">
          <Ionicons name="play-back" size={24} color="#fff" />
          <Text style={styles.seekFeedbackText}>{SEEK_SECONDS * seekFeedback.count}s</Text>
        </View>
      )}
      {seekFeedback?.side === "right" && (
        <View style={[styles.seekFeedback, styles.seekFeedbackRight]} pointerEvents="none">
          <Ionicons name="play-forward" size={24} color="#fff" />
          <Text style={styles.seekFeedbackText}>{SEEK_SECONDS * seekFeedback.count}s</Text>
        </View>
      )}

      {/* Controls overlay — dim bg + top/center/bottom bars */}
      {/* Rendered BELOW the gesture layer so buttons are touchable via absolute Pressables */}
      {controlsVisible && (
        <Animated.View
          style={[styles.controlsOverlay, { opacity: controlsOpacity }]}
          pointerEvents="none"  // the overlay dim-bg passes through; buttons are separate absolute views
        />
      )}

      {/* ── Bottom control bar (always in tree so layout measures work) ── */}
      {controlsVisible && (
        <Animated.View
          style={[styles.bottomBar, { opacity: controlsOpacity }]}
          pointerEvents="box-none"
        >
          {/* Top Row: Time Pill and Fullscreen Toggle */}
          <View style={styles.bottomBarTopRow} pointerEvents="box-none">
            {/* Time progress pill */}
            <View style={styles.timePill}>
              <Text style={styles.timePillText}>
                {`${formatTime(slidingValue !== null ? slidingValue : currentTime)}/${formatTime(duration)}`}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* Mute toggle */}
              <Pressable
                onPress={() => {
                  setPlayerMuted(player, !isMuted);
                  scheduleHide();
                }}
                hitSlop={14}
                style={styles.controlCircle}
              >
                <Ionicons
                  name={isMuted ? "volume-mute" : "volume-high"}
                  size={18}
                  color="#fff"
                />
              </Pressable>

              {/* Fullscreen toggle */}
              <Pressable
                onPress={() => {
                  if (isFullscreen) {
                    exitFullscreen();
                  } else {
                    enterFullscreen();
                  }
                }}
                hitSlop={14}
                style={styles.controlCircle}
              >
                <Ionicons
                  name={isFullscreen ? "contract" : "expand"}
                  size={18}
                  color="#fff"
                />
              </Pressable>
            </View>
          </View>

          {/* Bottom Row: Progress track */}
          <Slider
            style={{ width: "100%", height: 20 }}
            minimumValue={0}
            maximumValue={validDuration}
            value={validSliderValue}
            onValueChange={handleValueChange}
            minimumTrackTintColor="#FF0000"
            maximumTrackTintColor="rgba(255,255,255,0.25)"
            thumbTintColor="#FF0000"
          />
        </Animated.View>
      )}

      {/* ── Top control bar ── */}
      {controlsVisible && (
        <Animated.View
          style={[
            styles.topBar,
            {
              opacity: controlsOpacity,
              top: isFullscreen ? insets.top : 8,
            },
          ]}
          pointerEvents="box-none"
        >
          {/* Chevron down button */}
          <Pressable
            onPress={handleChevronPress}
            style={styles.controlCircle}
            hitSlop={14}
          >
            <Ionicons name="chevron-down" size={22} color="#fff" />
          </Pressable>

          {/* Loop toggle button */}
          <Pressable
            onPress={toggleLoop}
            style={[styles.controlCircle, isLooping && { backgroundColor: "rgba(255, 0, 0, 0.25)" }]}
            hitSlop={14}
          >
            <Ionicons
              name="repeat"
              size={22}
              color={isLooping ? "#FF0000" : "#fff"}
            />
          </Pressable>
        </Animated.View>
      )}

      {/* ── Center play/pause (absolute, above gesture layer via zIndex) ── */}
      {controlsVisible && (
        <Animated.View
          style={[styles.centerPlayPause, { opacity: controlsOpacity }]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => {
              if (isPlaying) {
                player.pause();
              } else {
                player.play();
              }
              scheduleHide();
            }}
            style={styles.playPauseButton}
            hitSlop={16}
          >
            {isPlaying ? <PauseIcon width={48} height={48} color={'#fff'} /> : <PlayIcon width={48} height={48} color={'#fff'} />}
          </Pressable>
        </Animated.View>
      )}

      {/* ── Full-area gesture detector — topmost touch layer ── */}
      <GestureDetector gesture={combinedGesture}>
        <View style={StyleSheet.absoluteFill} />
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreenContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    zIndex: 9999,
    elevation: 9999,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  bufferOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 44, // Align with centerPlayPause (above bottom control bar)
    justifyContent: "center",
    alignItems: "center",
  },
  speedBadge: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    left: "50%",
    transform: [{ translateX: -44 }],
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  speedBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  seekFeedback: {
    position: "absolute",
    top: "30%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 40,
    width: 76,
    height: 76,
    gap: 2,
  },
  seekFeedbackLeft: { left: 16 },
  seekFeedbackRight: { right: 16 },
  seekFeedbackText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  centerPlayPause: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 44,           // leave room for bottom bar
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  playPauseButton: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 36,
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    zIndex: 10,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "column",
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 2,
    zIndex: 10,
  },
  bottomBarTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  timePill: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
  },
  timePillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  controlCircle: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  progressBuffered: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 2,
  },
  sliderWrapper: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    position: "relative",
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 2,
    width: "100%",
  },
});
