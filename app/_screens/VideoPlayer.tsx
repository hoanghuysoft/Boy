import {
  LongPressSpeedZone,
  SpeedIndicator,
  videoPlayerStyles as styles,
  VideoBottomBar,
  VideoPlaybackControls,
  VideoTopBar,
} from "@/components/video";
import { useStatusBar } from "@/context/StatusBarContext";
import { useThemeContext } from "@/context/ThemeContext";
import { useCachedVideoUri } from "@/hooks/useCachedVideoUri";
import { useVideoResume, VIDEO_RESUME_MIN_DURATION } from "@/hooks/useVideoResume";
import { createCommonStyles } from "@/styles/common";
import { useEventListener } from "expo";
import * as IntentLauncher from "expo-intent-launcher";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import SystemNavigationBar from "react-native-system-navigation-bar";

interface VideoProgress {
  currentTime: number;
  seekableDuration: number;
}

const VideoPlayer = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const videoUrl = ((params.videoUrl as string) ?? "").replace(/#/g, "%23");
  const name = params.name as string;
  const caption = params.caption as string;
  const portrait = params.portrait === "true";

  // Resolve against video cache for instant playback if already downloaded
  const resolvedVideoUrl = useCachedVideoUri(videoUrl);

  const { colors, typography } = useThemeContext();
  const { setShowStatusBarFade } = useStatusBar();
  const common = createCommonStyles(colors, typography);
  const insets = useSafeAreaInsets();

  // State
  const [isStatusBarHidden] = useState(true);
  const [videoPressed, setVideoPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLandscape, setIsLandscape] = useState(!portrait);
  const [progress, setProgress] = useState<VideoProgress>({
    currentTime: 0,
    seekableDuration: 0,
  });
  const [seekPosition, setSeekPosition] = useState<number | null>(null);

  const { getResumePosition, savePosition, clearPosition } = useVideoResume(videoUrl);

  // Refs for values needed in callbacks without stale closures
  const videoViewRef = useRef<VideoView>(null);
  const progressRef = useRef<VideoProgress>({ currentTime: 0, seekableDuration: 0 });
  const wasPlayingRef = useRef(false);
  const isSeekingRef = useRef(false);
  const hasResumedRef = useRef(false);

  const [controlsOpacity] = useState(() => new Animated.Value(0));
  const [topBarTranslateY] = useState(() => new Animated.Value(-50));
  const [bottomBarTranslateY] = useState(() => new Animated.Value(50));
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── expo-video player ───────────────────────────────────────────────────────
  const player = useVideoPlayer(resolvedVideoUrl || videoUrl || "", (p) => {
    p.play();
    p.loop = false;
    p.muted = false;
    p.playbackRate = 1;
    p.timeUpdateEventInterval = 0.1; // 10/sec — smooth scrub bar, 5× fewer JS event pressure vs 0.05
  });

  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Derived state from player (kept in sync via events below)
  const [isPaused, setIsPaused] = useState(false);
  const [isMute, setIsMute] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1);

  // ─── Player Events ───────────────────────────────────────────────────────────

  // Loading / ready state
  useEventListener(player, "statusChange", ({ status }) => {
    if (status === "loading") {
      setIsLoading(true);
    } else if (status === "readyToPlay") {
      setIsLoading(false);
      const duration = player.duration ?? 0;
      setProgress((prev) => ({ ...prev, seekableDuration: duration }));
      progressRef.current = { ...progressRef.current, seekableDuration: duration };

      // Auto-seek to resume position (once per session)
      if (!hasResumedRef.current && duration >= VIDEO_RESUME_MIN_DURATION) {
        hasResumedRef.current = true;
        const savedPos = getResumePosition();
        if (savedPos && savedPos > 0) {
          playerRef.current.currentTime = savedPos;
        }
      }
    } else if (status === "error") {
      setIsLoading(false);
    }
  });

  // Time progress (fires ~4× per second)
  useEventListener(player, "timeUpdate", ({ currentTime }) => {
    const duration = player.duration ?? 0;
    const next: VideoProgress = { currentTime, seekableDuration: duration };
    setProgress(next);
    progressRef.current = next;
  });

  // Play/pause state
  useEventListener(player, "playingChange", ({ isPlaying }) => {
    if (isSeekingRef.current) return;
    setIsPaused(!isPlaying);
  });

  // Reached end
  useEventListener(player, "playToEnd", () => {
    clearPosition();
    if (!playerRef.current.loop) {
      playerRef.current.currentTime = 0;
      playerRef.current.pause();
      setIsPaused(true);
    }
  });

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleVideoPress = useCallback(() => {
    setVideoPressed((prev) => !prev);
  }, []);

  const moveBackward = () => {
    try {
      isSeekingRef.current = true;
      playerRef.current.seekBy(-5);
      setTimeout(() => { isSeekingRef.current = false; }, 300);
    } catch (error) {
      console.error("Error moving backward:", error);
    }
  };

  const togglePlayPause = () => {
    if (isPaused && progressRef.current.currentTime >= progressRef.current.seekableDuration - 0.5) {
      playerRef.current.currentTime = 0;
      playerRef.current.play();
      setIsPaused(false);
    } else if (isPaused) {
      playerRef.current.play();
      setIsPaused(false);
    } else {
      playerRef.current.pause();
      setIsPaused(true);
    }
  };

  const moveForward = () => {
    try {
      isSeekingRef.current = true;
      playerRef.current.seekBy(5);
      setTimeout(() => { isSeekingRef.current = false; }, 300);
    } catch (error) {
      console.error("Error moving forward:", error);
    }
  };

  const handleRotate = async () => {
    try {
      const currentLock = await ScreenOrientation.getOrientationLockAsync();
      if (currentLock === ScreenOrientation.OrientationLock.LANDSCAPE) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    } catch (error) {
      console.error("Error handling screen rotation:", error);
    }
  };

  const handleMute = () => {
    const next = !isMute;
    playerRef.current.muted = next;
    setIsMute(next);
  };

  const pipMode = () => {
    try {
      videoViewRef.current?.startPictureInPicture();
    } catch (error) {
      console.error("PiP not available:", error);
    }
  };

  const loopVideo = () => {
    const next = !isLooping;
    playerRef.current.loop = next;
    setIsLooping(next);
  };

  const handleClose = useCallback(() => {
    const { currentTime, seekableDuration } = progressRef.current;
    savePosition(currentTime, seekableDuration || (playerRef.current.duration ?? 0));
    router.back();
  }, [router, savePosition]);

  const openExternalLink = async () => {
    if (Platform.OS === "android") {
      try {
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: videoUrl,
          type: "video/*",
        });
      } catch (e) {
        console.error("Failed to open external player", e);
      }
    }
  };

  const handleSlidingStart = () => {
    isSeekingRef.current = true;
    wasPlayingRef.current = !isPaused;
    playerRef.current.pause();
    setIsPaused(true);
    setSeekPosition(progressRef.current.currentTime);
  };

  const handleSeek = (value: number) => {
    setSeekPosition(value);
  };

  const handleSlidingComplete = (prog: number) => {
    playerRef.current.currentTime = prog;
    setSeekPosition(null);
    if (wasPlayingRef.current) {
      playerRef.current.play();
      setIsPaused(false);
    }
    setTimeout(() => { isSeekingRef.current = false; }, 300);
  };

  const handleSetPlaybackRate = (rate: number) => {
    playerRef.current.playbackRate = rate;
    setPlaybackRateState(rate);
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const backAction = () => {
      handleClose();
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [handleClose]);

  useEffect(() => {
    ScreenOrientation.lockAsync(
      portrait
        ? ScreenOrientation.OrientationLock.PORTRAIT
        : ScreenOrientation.OrientationLock.LANDSCAPE,
    );
    if (Platform.OS === "android") {
      SystemNavigationBar.stickyImmersive();
    } else {
      SystemNavigationBar.fullScreen(true);
    }
    setShowStatusBarFade(false);

    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      const orientation = event.orientationInfo.orientation;
      setIsLandscape(
        orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
      );
    });

    return () => {
      setShowStatusBarFade(true);
      subscription.remove();
      ScreenOrientation.unlockAsync();
      SystemNavigationBar.fullScreen(false);
    };
  }, [portrait, setShowStatusBarFade]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(controlsOpacity, {
        toValue: videoPressed ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(topBarTranslateY, {
        toValue: videoPressed ? 0 : -50,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(bottomBarTranslateY, {
        toValue: videoPressed ? 0 : 50,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [videoPressed, controlsOpacity, topBarTranslateY, bottomBarTranslateY]);

  // Auto-hide controls after 5 seconds of inactivity (only when playing)
  useEffect(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    if (videoPressed && !isPaused) {
      hideTimeoutRef.current = setTimeout(() => {
        setVideoPressed(false);
      }, 5000);
    }
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [videoPressed, isPaused]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <StatusBar hidden={isStatusBarHidden} />

      {/* Video Layer */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <VideoView
          ref={videoViewRef}
          player={player}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          allowsPictureInPicture
          startsPictureInPictureAutomatically
          nativeControls={false}
        />
      </View>

      {/* Controls Layer */}
      <View style={styles.videoControlsContainer}>
        {/* Unified gesture zone — always mounted, handles single tap (toggle controls),
            double tap (seek), and long press (speed up) without conflicts */}
        <LongPressSpeedZone
          onToggleControls={handleVideoPress}
          setPlaybackRate={handleSetPlaybackRate}
          onDoubleTap={(direction) =>
            direction === "forward" ? moveForward() : moveBackward()
          }
        />

        {/* Speed indicator */}
        <SpeedIndicator playbackRate={playbackRate} />

        {/* Controls overlay */}
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.videoControlsOverlay,
            {
              opacity: controlsOpacity,
              paddingLeft: isLandscape ? insets.left : 16,
              paddingRight: isLandscape ? insets.right : 16,
              paddingTop: isLandscape ? insets.top : insets.top + 16,
              paddingBottom: isLandscape ? insets.bottom : insets.bottom + 16,
            },
          ]}
        >
          {/* Top Bar */}
          <VideoTopBar
            isLandscape={isLandscape}
            isMute={isMute}
            topBarTranslateY={topBarTranslateY}
            videoPressed={videoPressed}
            commonRowStyle={common.row}
            onClose={handleClose}
            onPipMode={pipMode}
            onOpenExternal={openExternalLink}
            onMuteToggle={handleMute}
          />

          {/* Playback Controls */}
          <VideoPlaybackControls
            isLandscape={isLandscape}
            isPaused={isPaused}
            isLoading={isLoading}
            videoPressed={videoPressed}
            commonRowStyle={common.row}
            onMoveBackward={moveBackward}
            onTogglePlayPause={togglePlayPause}
            onMoveForward={moveForward}
          />

          {/* Bottom Bar */}
          <VideoBottomBar
            isLandscape={isLandscape}
            isLooping={isLooping}
            isPaused={isPaused}
            name={name}
            caption={caption}
            progress={progress}
            bottomBarTranslateY={bottomBarTranslateY}
            videoPressed={videoPressed}
            commonRowStyle={common.row}
            commonBodySmallStyle={common.bodySmall}
            commonLabelStyle={common.label}
            onLoopToggle={loopVideo}
            onRotate={handleRotate}
            seekPosition={seekPosition}
            onSeek={handleSeek}
            onSlidingStart={handleSlidingStart}
            onSlidingComplete={handleSlidingComplete}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default VideoPlayer;