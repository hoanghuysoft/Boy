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
import * as IntentLauncher from "expo-intent-launcher";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
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
import { useVideoPlayer, useEvent, VideoView, VideoViewRef } from "react-native-video";

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
  const [isStatusBarHidden, setIsStatusBarHidden] = useState(true);
  const [videoPressed, setVideoPressed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMute, setIsMute] = useState(false);
  const [progress, setProgress] = useState<VideoProgress>({
    currentTime: 0,
    seekableDuration: 0,
  });
  const [resizeMode, setResizeMode] = useState("cover");
  const [isLandscape, setIsLandscape] = useState(!portrait);
  const [isLoading, setIsLoading] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [seekPosition, setSeekPosition] = useState<number | null>(null);

  const { getResumePosition, savePosition, clearPosition } = useVideoResume(videoUrl);

  // Refs
  const ref = useRef<VideoViewRef>(null);
  const wasPlayingRef = useRef(false);
  const isSeekingRef = useRef(false);
  // Track latest progress so handleClose always reads the current position
  const progressRef = useRef<VideoProgress>({ currentTime: 0, seekableDuration: 0 });
  // Track duration from onLoad so we can gate the resume threshold early
  const durationRef = useRef(0);
  // Ensure we only auto-seek to the resume position once per session
  const hasResumedRef = useRef(false);
  const controlsOpacity = useRef(new Animated.Value(0)).current;
  const topBarTranslateY = useRef(new Animated.Value(-50)).current;
  const bottomBarTranslateY = useRef(new Animated.Value(50)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize the player with v7 useVideoPlayer hook
  const player = useVideoPlayer(resolvedVideoUrl || videoUrl || '', (playerInstance) => {
    playerInstance.loop = isLooping;
    playerInstance.muted = isMute;
    playerInstance.rate = playbackRate;
    playerInstance.playInBackground = true;
    playerInstance.playWhenInactive = true;
    if (!isPaused) {
      playerInstance.play();
    }
  });

  // Synchronize player properties when state changes
  useEffect(() => {
    player.muted = isMute;
  }, [isMute, player]);

  useEffect(() => {
    player.loop = isLooping;
  }, [isLooping, player]);

  useEffect(() => {
    player.rate = playbackRate;
  }, [playbackRate, player]);

  // Event subscriptions via useEvent
  useEvent(player, 'onLoadStart', () => {
    setIsLoading(true);
  });

  useEvent(player, 'onLoad', (data) => {
    setIsLoading(false);
    if (data.width && data.height) {
      setVideoAspectRatio(data.width / data.height);
    }
    durationRef.current = data.duration ?? 0;
    if (!hasResumedRef.current && data.duration >= VIDEO_RESUME_MIN_DURATION) {
      hasResumedRef.current = true;
      const savedPos = getResumePosition();
      if (savedPos && savedPos > 0) {
        player.seekTo(savedPos);
      }
    }
  });

  useEvent(player, 'onBuffer', (buffering) => {
    setIsLoading(buffering);
  });

  useEvent(player, 'onProgress', (data) => {
    if (isSeekingRef.current) return;
    setProgress({
      currentTime: data.currentTime,
      seekableDuration: durationRef.current || player.duration || 0,
    });
    progressRef.current = {
      currentTime: data.currentTime,
      seekableDuration: durationRef.current || player.duration || 0,
    };
  });

  useEvent(player, 'onEnd', () => {
    clearPosition();
    if (!player.loop) {
      player.seekTo(0);
      player.pause();
      setIsPaused(true);
    }
  });

  useEvent(player, 'onPlaybackStateChange', (state) => {
    if (isSeekingRef.current) return;
    setIsPaused(!state.isPlaying);
  });
  // Handlers
  const handleVideoPress = useCallback(() => {
    setVideoPressed((prev) => !prev);
  }, []);

  const moveBackward = () => {
    try {
      isSeekingRef.current = true;
      player.seekTo(progress.currentTime - 5);
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 300);
    } catch (error) {
      console.error("Error moving backward:", error);
    }
  };

  const togglePlayPause = () => {
    if (isPaused && progress.currentTime === progress.seekableDuration) {
      player.seekTo(0);
      player.play();
      setIsPaused(false);
    } else {
      const nextPaused = !isPaused;
      setIsPaused(nextPaused);
      if (nextPaused) {
        player.pause();
      } else {
        player.play();
      }
    }
  };

  const moveForward = () => {
    try {
      isSeekingRef.current = true;
      player.seekTo(progress.currentTime + 5);
      setTimeout(() => {
        isSeekingRef.current = false;
      }, 300);
    } catch (error) {
      console.error("Error moving forward:", error);
    }
  };

  const handleRotate = async () => {
    try {
      const currentLock = await ScreenOrientation.getOrientationLockAsync();
      if (currentLock === ScreenOrientation.OrientationLock.LANDSCAPE) {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT,
        );
      } else {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.LANDSCAPE,
        );
      }
    } catch (error) {
      console.error("Error handling screen rotation:", error);
    }
  };

  const handleMute = () => {
    setIsMute(!isMute);
  };

  const pipMode = () => {
    ref.current?.enterPictureInPicture();
  };

  const loopVideo = () => {
    setIsLooping(!isLooping);
  };

  const handleClose = useCallback(() => {
    const { currentTime, seekableDuration } = progressRef.current;
    // seekableDuration may lag on early close; fall back to durationRef
    savePosition(currentTime, seekableDuration || durationRef.current);
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
    setIsPaused(true);
    player.pause();
    setSeekPosition(progress.currentTime);
  };

  const handleSeek = (value: number) => {
    setSeekPosition(value);
    player.seekTo(value);
  };

  const handleSlidingComplete = (prog: number) => {
    player.seekTo(prog);
    
    // Instantly sync local progress to prevent split-second rubber-banding
    setProgress((prev) => ({
      ...prev,
      currentTime: prog,
    }));
    progressRef.current = {
      ...progressRef.current,
      currentTime: prog,
    };

    setSeekPosition(null);
    if (wasPlayingRef.current) {
      player.play();
      setIsPaused(false);
    } else {
      player.pause();
      setIsPaused(true);
    }
    // Delay resetting seek flag to prevent playback state callback interference
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 300);
  };

  // Effects
  useEffect(() => {
    const backAction = () => {
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [handleClose]);

  useEffect(() => {
    ScreenOrientation.lockAsync(
      portrait
        ? ScreenOrientation.OrientationLock.PORTRAIT
        : ScreenOrientation.OrientationLock.LANDSCAPE,
    );
    if (Platform.OS === 'android') {
      SystemNavigationBar.stickyImmersive();
    } else {
      SystemNavigationBar.fullScreen(true);
    }
    setShowStatusBarFade(false);

    const subscription = ScreenOrientation.addOrientationChangeListener(
      (event) => {
        const orientation = event.orientationInfo.orientation;
        setIsLandscape(
          orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
          orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
        );
      },
    );

    return () => {
      setShowStatusBarFade(true);
      subscription.remove();
      ScreenOrientation.unlockAsync();
      SystemNavigationBar.fullScreen(false);
    };
  }, []);

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
  }, [videoPressed]);

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
          player={player}
          style={{
            width: "100%",
            height: "100%",
          }}
          resizeMode="contain"
          autoEnterPictureInPicture
          controls={false}
          ref={ref}
        />
      </View>

      {/* Controls Layer */}
      <View style={styles.videoControlsContainer}>
        {/* Unified gesture zone — always mounted, handles single tap (toggle controls),
            double tap (seek), and long press (speed up) without conflicts */}
        <LongPressSpeedZone
          onToggleControls={handleVideoPress}
          setPlaybackRate={setPlaybackRate}
          onDoubleTap={(direction) =>
            direction === 'forward' ? moveForward() : moveBackward()
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