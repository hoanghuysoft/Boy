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
import { createCommonStyles } from "@/styles/common";
import * as IntentLauncher from 'expo-intent-launcher';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Platform, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import SystemNavigationBar from "react-native-system-navigation-bar";
import Video, { VideoRef } from "react-native-video";

interface VideoProgress {
    currentTime: number;
    seekableDuration: number;
}

const VideoPlayer = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const videoUrl = params.videoUrl as string;
    const name = params.name as string;
    const caption = params.caption as string;
    const portrait = params.portrait === 'true';

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
    const [progress, setProgress] = useState<VideoProgress>({ currentTime: 0, seekableDuration: 0 });
    const [resizeMode, setResizeMode] = useState('cover');
    const [isLandscape, setIsLandscape] = useState(!portrait);
    const [isLoading, setIsLoading] = useState(true);
    const [isLooping, setIsLooping] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
    const [seekPosition, setSeekPosition] = useState<number | null>(null);

    // Refs
    const ref = useRef<VideoRef>(null);
    const wasPlayingRef = useRef(false);
    const isSeekingRef = useRef(false);
    const controlsOpacity = useRef(new Animated.Value(0)).current;
    const topBarTranslateY = useRef(new Animated.Value(-50)).current;
    const bottomBarTranslateY = useRef(new Animated.Value(50)).current;
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handlers
    const handleVideoPress = () => {
        setVideoPressed(!videoPressed);
    };

    const moveBackward = () => {
        try {
            isSeekingRef.current = true;
            ref.current?.seek(progress.currentTime - 5);
            setTimeout(() => {
                isSeekingRef.current = false;
            }, 300);
        } catch (error) {
            console.error('Error moving backward:', error);
        }
    };

    const togglePlayPause = () => {
        if (isPaused && progress.currentTime === progress.seekableDuration) {
            ref.current?.seek(0);
            setIsPaused(false);
        } else {
            setIsPaused(!isPaused);
        }
    };

    const moveForward = () => {
        try {
            isSeekingRef.current = true;
            ref.current?.seek(progress.currentTime + 5);
            setTimeout(() => {
                isSeekingRef.current = false;
            }, 300);
        } catch (error) {
            console.error('Error moving forward:', error);
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
            console.error('Error handling screen rotation:', error);
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
        router.back();
        ScreenOrientation.unlockAsync();
        SystemNavigationBar.fullScreen(false);
    }, [router]);

    const openExternalLink = async () => {
        if (Platform.OS === 'android') {
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
        setSeekPosition(progress.currentTime);
    };

    const handleSeek = (value: number) => {
        setSeekPosition(value);
    };

    const handleSlidingComplete = (prog: number) => {
        ref.current?.seek(prog);
        setSeekPosition(null);
        if (wasPlayingRef.current) {
            setIsPaused(false);
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
            'hardwareBackPress',
            backAction
        );

        return () => backHandler.remove();
    }, [handleClose]);

    useEffect(() => {
        ScreenOrientation.lockAsync(portrait ? ScreenOrientation.OrientationLock.PORTRAIT : ScreenOrientation.OrientationLock.LANDSCAPE);
        SystemNavigationBar.fullScreen(true);
        setShowStatusBarFade(false);

        const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
            const orientation = event.orientationInfo.orientation;
            setIsLandscape(
                orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
                orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
            );
        });

        return () => {
            setShowStatusBarFade(true);
            ScreenOrientation.removeOrientationChangeListener(subscription);
        };
    }, []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(controlsOpacity, {
                toValue: videoPressed ? 1 : 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.spring(topBarTranslateY, {
                toValue: videoPressed ? 0 : -50,
                useNativeDriver: true,
                friction: 8,
                tension: 80,
            }),
            Animated.spring(bottomBarTranslateY, {
                toValue: videoPressed ? 0 : 50,
                useNativeDriver: true,
                friction: 8,
                tension: 80,
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
        <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
            <StatusBar hidden={isStatusBarHidden} />

            {/* Video Layer */}
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                <Video
                    source={{ uri: resolvedVideoUrl || videoUrl }}
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                    resizeMode="contain"
                    enterPictureInPictureOnLeave
                    controls={false}
                    playInBackground
                    muted={isMute}
                    paused={isPaused}
                    ref={ref}
                    repeat={isLooping}
                    rate={playbackRate}
                    onLoadStart={() => setIsLoading(true)}
                    onLoad={(data) => {
                        setIsLoading(false);
                        // Calculate natural aspect ratio from video dimensions
                        if (data.naturalSize) {
                            const { width, height } = data.naturalSize;
                            if (width && height) {
                                setVideoAspectRatio(width / height);
                            }
                        }
                    }}
                    onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
                    onProgress={prog => setProgress(prog)}
                    onEnd={() => {
                        if (!isLooping) {
                            ref.current?.seek(0);
                            setIsPaused(true);
                        }
                    }}
                    onPlaybackStateChanged={(state) => {
                        if (isSeekingRef.current) return;
                        if (state.isPlaying !== undefined) {
                            setIsPaused(!state.isPlaying);
                        }
                    }}
                />
            </View>

            {/* Controls Layer */}
            <View style={styles.videoControlsContainer}>
                {/* Long press speed up zone - only active when controls are hidden */}
                {!videoPressed && (
                    <LongPressSpeedZone
                        onShowControls={handleVideoPress}
                        setPlaybackRate={setPlaybackRate}
                    />
                )}

                {/* Tap zone when controls are visible */}
                {videoPressed && (
                    <TouchableOpacity
                        onPress={handleVideoPress}
                        activeOpacity={1}
                        style={StyleSheet.absoluteFill}
                    />
                )}

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
        </SafeAreaView >
    );
};

export default VideoPlayer;
