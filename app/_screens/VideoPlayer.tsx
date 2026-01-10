import { PillSlider } from "@/components/video";
import { useStatusBar } from "@/context/StatusBarContext";
import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { Layers1Solid, PauseSolid, PlaySolid, Volume1Solid, VolumeMuteSolid, XmarkSolid } from "@lineiconshq/free-icons";
import Lineicons from "@lineiconshq/react-native-lineicons";
import * as IntentLauncher from 'expo-intent-launcher';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ScreenOrientation from 'expo-screen-orientation';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, BackHandler, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
    const { colors, typography } = useThemeContext();
    const { setShowStatusBarFade } = useStatusBar();
    const common = createCommonStyles(colors, typography);
    const insets = useSafeAreaInsets();
    const [isStatusBarHidden, setIsStatusBarHidden] = useState(true);
    const ref = useRef<VideoRef>(null);
    const [videoPressed, setVideoPressed] = useState(false);
    const controlsOpacity = useRef(new Animated.Value(0)).current;
    const topBarTranslateY = useRef(new Animated.Value(-50)).current;
    const bottomBarTranslateY = useRef(new Animated.Value(50)).current;
    const [isPaused, setIsPaused] = useState(false);
    const [isMute, setIsMute] = useState(false);
    const [progress, setProgress] = useState<VideoProgress>({ currentTime: 0, seekableDuration: 0 });
    const [resizeMode, setResizeMode] = useState('cover');
    const [isLandscape, setIsLandscape] = useState(!portrait);
    const [isLoading, setIsLoading] = useState(true);
    const wasPlayingRef = useRef(false);
    const isSeekingRef = useRef(false);
    const [isLooping, setIsLooping] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasLongPressRef = useRef(false);

    const handleVideoPress = () => {
        setVideoPressed(!videoPressed);
    };

    const moveBackward = () => {
        try {
            ref.current?.seek(progress.currentTime - 5);
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
            ref.current?.seek(progress.currentTime + 5);
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

    const handleVolumeUp = () => {
        setIsMute(false);
    };

    const pipMode = () => {
        ref.current?.enterPictureInPicture();
    };

    const handleZoomIn = () => {
        setResizeMode('none');
    };

    const handleZoomOut = () => {
        setResizeMode('cover');
    };

    const loopVideo = () => {
        setIsLooping(!isLooping);
    };

    const formatDuration = (durationInSeconds: number) => {
        const hours = Math.floor(durationInSeconds / 3600);
        const minutes = Math.floor((durationInSeconds % 3600) / 60);
        const seconds = Math.floor(durationInSeconds % 60);

        const formattedHours = hours > 0 ? `${hours}:` : '';
        const formattedMinutes = `${minutes < 10 && hours > 0 ? '0' : ''}${minutes}:`;
        const formattedSeconds = `${seconds < 10 ? '0' : ''}${seconds}`;

        return `${formattedHours}${formattedMinutes}${formattedSeconds}`;
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
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Clear any existing timeout
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }

        // Only set timeout if controls are visible and video is playing
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
            <View style={[StyleSheet.absoluteFill, !isLandscape && styles.portraitVideoContainer]}>
                <Video
                    source={{ uri: videoUrl }}
                    style={{ width: '100%', aspectRatio: isLandscape ? 16 / 9 : 9 / 16 }}
                    enterPictureInPictureOnLeave
                    controls={false}
                    playInBackground
                    muted={isMute}
                    paused={isPaused}
                    ref={ref}
                    repeat={isLooping}
                    rate={playbackRate}
                    onLoadStart={() => setIsLoading(true)}
                    onLoad={() => setIsLoading(false)}
                    onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
                    onProgress={prog => {
                        setProgress(prog);
                    }}
                    onEnd={() => {
                        if (!isLooping) {
                            ref.current?.seek(0);
                            setIsPaused(true);
                        }
                    }}
                    onPlaybackStateChanged={(state) => {
                        // Don't update pause state while seeking to prevent interference
                        if (isSeekingRef.current) return;
                        if (state.isPlaying !== undefined) {
                            setIsPaused(!state.isPlaying);
                        }
                    }}
                />
            </View>
            <View style={styles.videoControlsContainer}>
                {/* Long press speed up zone - only active when controls are hidden */}
                {!videoPressed && (
                    <View
                        style={StyleSheet.absoluteFill}
                        onTouchStart={() => {
                            // Reset long press flag
                            wasLongPressRef.current = false;
                            // Start long press timer
                            longPressTimeoutRef.current = setTimeout(() => {
                                wasLongPressRef.current = true;
                                setPlaybackRate(2);
                            }, 300);
                        }}
                        onTouchEnd={() => {
                            // Clear timer
                            if (longPressTimeoutRef.current) {
                                clearTimeout(longPressTimeoutRef.current);
                                longPressTimeoutRef.current = null;
                            }
                            // Only show controls if it was a quick tap (not a long press)
                            if (!wasLongPressRef.current) {
                                handleVideoPress();
                            }
                            // Reset speed and flag
                            setPlaybackRate(1);
                            wasLongPressRef.current = false;
                        }}
                        onTouchCancel={() => {
                            // Clear timer and reset
                            if (longPressTimeoutRef.current) {
                                clearTimeout(longPressTimeoutRef.current);
                                longPressTimeoutRef.current = null;
                            }
                            setPlaybackRate(1);
                            wasLongPressRef.current = false;
                        }}
                    />
                )}
                {videoPressed && (
                    <TouchableOpacity
                        onPress={handleVideoPress}
                        activeOpacity={1}
                        style={StyleSheet.absoluteFill}
                    />
                )}
                {/* Speed indicator */}
                {playbackRate > 1 && (
                    <View style={styles.speedIndicator}>
                        <View style={styles.speedBadge}>
                            <Ionicons name="play-forward" size={16} color="white" />
                            <Text style={styles.speedText}>{playbackRate}x</Text>
                        </View>
                    </View>
                )}
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
                    <Animated.View
                        pointerEvents={videoPressed ? 'auto' : 'none'}
                        style={[common.row, { justifyContent: 'space-between', paddingTop: isLandscape ? 30 : 16, paddingRight: isLandscape ? 32 : 0, transform: [{ translateY: topBarTranslateY }] }]}
                    >
                        <View style={[common.row, { gap: 12 }]}>
                            <TouchableOpacity onPress={handleClose} style={styles.smallButton}>
                                <Lineicons
                                    icon={XmarkSolid}
                                    size={24}
                                    color={'white'}
                                    strokeWidth={3}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.smallButton} onPress={pipMode}>
                                <Lineicons
                                    icon={Layers1Solid}
                                    size={24}
                                    color={'white'}
                                    strokeWidth={3}
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={[common.row, { gap: 12 }]}>
                            <TouchableOpacity style={styles.smallButton} onPress={openExternalLink}>
                                <Ionicons name="link" size={24} color={'white'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.smallButton} onPress={handleMute}>
                                <Lineicons
                                    icon={isMute ? VolumeMuteSolid : Volume1Solid}
                                    size={24}
                                    color={'white'}
                                    strokeWidth={3}
                                />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                    <View
                        pointerEvents={videoPressed ? 'auto' : 'none'}
                        style={[common.row, { flex: 1, justifyContent: 'center', alignItems: 'center', gap: isLandscape ? 64 : 48 }]}
                    >
                        <TouchableOpacity onPress={moveBackward} style={styles.largeButton}>
                            <Ionicons
                                name="play-back"
                                size={32}
                                color={'white'}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={togglePlayPause} style={styles.extraLargeButton}>
                            {isLoading ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <Lineicons
                                    icon={isPaused ? PlaySolid : PauseSolid}
                                    size={50}
                                    color={'white'}
                                    strokeWidth={3}
                                />
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={moveForward} style={styles.largeButton}>
                            <Ionicons
                                name="play-forward"
                                size={32}
                                color={'white'}
                            />
                        </TouchableOpacity>
                    </View>
                    <Animated.View
                        pointerEvents={videoPressed ? 'auto' : 'none'}
                        style={{ paddingBottom: isLandscape ? 30 : 16, paddingRight: isLandscape ? 32 : 0, transform: [{ translateY: bottomBarTranslateY }] }}
                    >
                        <View style={[common.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[common.bodySmall, { color: 'white' }]}>{name}</Text>
                                {caption && <Text style={{ marginBottom: 8, fontSize: 28, fontWeight: 'bold', color: 'white' }} numberOfLines={2} ellipsizeMode="tail">{caption}</Text>}
                            </View>
                            <View style={[common.row, { gap: 8 }]}>
                                <TouchableOpacity style={styles.smallButton} onPress={loopVideo}>
                                    <Ionicons name={isLooping ? "repeat-sharp" : "repeat-outline"} size={24} color={'white'} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.smallButton} onPress={handleRotate}>
                                    <Ionicons name="reload-outline" size={24} color={'white'} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <PillSlider
                            minimumValue={0}
                            maximumValue={progress.seekableDuration}
                            value={progress.currentTime}
                            onValueChange={prog => {
                                // Optional: Update a timestamp label if we had one
                            }}
                            onSlidingStart={() => {
                                isSeekingRef.current = true;
                                wasPlayingRef.current = !isPaused;
                                setIsPaused(true);
                            }}
                            onSlidingComplete={prog => {
                                ref.current?.seek(prog);
                                if (wasPlayingRef.current) {
                                    setIsPaused(false);
                                }
                                // Delay resetting seek flag to prevent playback state callback interference
                                setTimeout(() => {
                                    isSeekingRef.current = false;
                                }, 300);
                            }}
                            trackHeight={8}
                            trackColor="rgba(255, 255, 255, 0.3)"
                            progressColor="#FFFFFF"
                        />
                        <View style={[common.row, { justifyContent: 'space-between', marginTop: 8 }]}>
                            <Text style={[common.label, { color: 'white' }]}>{formatDuration(progress.currentTime)}</Text>
                            <Text style={[common.label, { color: 'white' }]}>{formatDuration(progress.seekableDuration)}</Text>
                        </View>
                    </Animated.View>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
};

export default VideoPlayer;

const styles = StyleSheet.create({
    videoControlsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
    },
    portraitVideoContainer: {
        justifyContent: 'center',
    },
    videoControlsOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    smallButton: {
        width: 32,
        height: 32,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    largeButton: {
        width: 64,
        height: 64,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    extraLargeButton: {
        width: 85,
        height: 85,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    speedIndicator: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    speedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    speedText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});
