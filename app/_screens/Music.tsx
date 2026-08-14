import Slider from "@react-native-community/slider";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    ListRenderItemInfo,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { FBAuthWebView } from "@/components/FBAuthWebView";
import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import {
    clearFBAuth,
    FBMusicSection,
    FBMusicTrack,
    fetchFBMusic,
    getFBAuth,
    hasFBAuth,
    registerFBMusicBridge,
} from "@/services/fbmusic";
import { useAudioStore } from "@/stores/audio";
import { createCommonStyles } from "@/styles/common";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSeconds(secs: number): string {
    if (!secs || secs < 0 || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Animated Equalizer ───────────────────────────────────────────────────────

const EqualizerBar = ({ delay, color }: { delay: number; color: string }) => {
    const height = useSharedValue(4);

    useEffect(() => {
        height.value = withRepeat(
            withSequence(
                withTiming(14, { duration: 280 + delay * 60 }),
                withTiming(4, { duration: 220 + delay * 40 }),
                withTiming(18, { duration: 320 + delay * 50 }),
                withTiming(6, { duration: 240 + delay * 30 })
            ),
            -1,
            true
        );
    }, [delay, height]);

    const animStyle = useAnimatedStyle(() => ({
        height: height.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width: 3,
                    borderRadius: 1.5,
                    backgroundColor: color,
                    marginHorizontal: 1,
                },
                animStyle,
            ]}
        />
    );
};

const PlayingEqualizer = ({ color = "#fff" }: { color?: string }) => (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 18, justifyContent: "center" }}>
        <EqualizerBar delay={0} color={color} />
        <EqualizerBar delay={1} color={color} />
        <EqualizerBar delay={2} color={color} />
    </View>
);

// ─── Featured Track Card (Carousel) ──────────────────────────────────────────

const FeaturedTrackCard: React.FC<{
    track: FBMusicTrack;
    colors: any;
    isPlaying: boolean;
    onPress: (track: FBMusicTrack) => void;
}> = ({ track, colors, isPlaying, onPress }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => onPress(track)}
            style={styles.featuredCard}
        >
            <View style={styles.featuredArtContainer}>
                <Image
                    source={{
                        uri: track.coverUrl,
                        headers: { Referer: "https://www.facebook.com" },
                    }}
                    style={styles.featuredArt}
                    contentFit="cover"
                />
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.75)"]}
                    style={StyleSheet.absoluteFill}
                />
                <View
                    style={[
                        styles.featuredPlayBadge,
                        { backgroundColor: isPlaying ? colors.secondary : "rgba(0,0,0,0.55)" },
                    ]}
                >
                    {isPlaying ? (
                        <PlayingEqualizer color="#fff" />
                    ) : (
                        <Ionicons name="play" size={18} color="#fff" style={{ marginLeft: 2 }} />
                    )}
                </View>
            </View>
            <View style={{ marginTop: 8, paddingHorizontal: 2 }}>
                <FlexText numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                    {track.title}
                </FlexText>
                <FlexText numberOfLines={1} style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
                    {track.artist}
                </FlexText>
            </View>
        </TouchableOpacity>
    );
};

// ─── Track Row ────────────────────────────────────────────────────────────────

const TrackRow: React.FC<{
    track: FBMusicTrack;
    index: number;
    colors: any;
    isPlaying: boolean;
    onPress: (track: FBMusicTrack) => void;
}> = ({ track, index, colors, isPlaying, onPress }) => {
    const durationSec = Math.round(track.durationMs / 1000);
    const formattedDuration = formatSeconds(durationSec);

    return (
        <Pressable
            onPress={() => onPress(track)}
            style={({ pressed }) => [
                styles.trackRow,
                {
                    backgroundColor: isPlaying
                        ? `${colors.secondary}14`
                        : pressed
                            ? `${colors.text}08`
                            : "transparent",
                    borderColor: isPlaying ? `${colors.secondary}30` : "transparent",
                },
            ]}
        >
            <FlexText style={[styles.trackIndex, { color: isPlaying ? colors.secondary : colors.muted }]}>
                {index + 1}
            </FlexText>

            <View
                style={[
                    styles.artWrapper,
                    {
                        borderColor: isPlaying ? colors.secondary : colors.divider,
                        borderWidth: isPlaying ? 1.5 : StyleSheet.hairlineWidth,
                    },
                ]}
            >
                <Image
                    source={{
                        uri: track.coverUrl,
                        headers: { Referer: "https://www.facebook.com" },
                    }}
                    style={styles.art}
                    contentFit="cover"
                />
                {isPlaying && (
                    <View style={[styles.artOverlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
                        <PlayingEqualizer color={colors.secondary} />
                    </View>
                )}
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
                <FlexText
                    numberOfLines={1}
                    style={{
                        fontSize: 15,
                        fontWeight: isPlaying ? "700" : "600",
                        color: isPlaying ? colors.secondary : colors.text,
                    }}
                >
                    {track.title}
                </FlexText>
                <FlexText numberOfLines={1} style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
                    {track.artist}
                </FlexText>
            </View>

            <FlexText style={{ fontSize: 12, color: colors.muted, marginLeft: 8, fontVariant: ["tabular-nums"] }}>
                {formattedDuration}
            </FlexText>

            <View style={[styles.trackActionBtn, { backgroundColor: isPlaying ? colors.secondary : `${colors.text}0d` }]}>
                <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={14}
                    color={isPlaying ? "#fff" : colors.text}
                    style={!isPlaying ? { marginLeft: 1 } : undefined}
                />
            </View>
        </Pressable>
    );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; count?: number; colors: any }> = ({ title, count, colors }) => (
    <View style={styles.sectionHeader}>
        <FlexText style={{ fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>
            {title}
        </FlexText>
        {count !== undefined && count > 0 && (
            <View style={[styles.badge, { backgroundColor: `${colors.secondary}18` }]}>
                <FlexText style={{ fontSize: 11, fontWeight: "700", color: colors.secondary }}>
                    {count} tracks
                </FlexText>
            </View>
        )}
    </View>
);

// ─── Mini Player Bar ──────────────────────────────────────────────────────────

const MiniPlayerBar: React.FC<{
    colors: any;
    track: FBMusicTrack;
    isPlaying: boolean;
    progress: number;
    onToggle: () => void;
    onExpand: () => void;
    onClose: () => void;
}> = ({ colors, track, isPlaying, progress, onToggle, onExpand, onClose }) => {
    return (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={onExpand}
            style={[
                styles.miniPlayer,
                {
                    backgroundColor: colors.surfaceContainerHigh,
                    borderColor: `${colors.divider}80`,
                },
            ]}
        >
            <View style={styles.miniArtContainer}>
                <Image
                    source={{
                        uri: track.coverUrl,
                        headers: { Referer: "https://www.facebook.com" },
                    }}
                    style={styles.miniArt}
                    contentFit="cover"
                />
                {isPlaying && (
                    <View style={styles.miniArtOverlay}>
                        <PlayingEqualizer color="#fff" />
                    </View>
                )}
            </View>

            <View style={{ flex: 1, marginHorizontal: 12 }}>
                <FlexText numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                    {track.title}
                </FlexText>
                <FlexText numberOfLines={1} style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>
                    {track.artist}
                </FlexText>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <TouchableOpacity
                    onPress={onToggle}
                    style={[styles.miniPlayBtn, { backgroundColor: colors.secondary }]}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons
                        name={isPlaying ? "pause" : "play"}
                        size={18}
                        color="#fff"
                        style={!isPlaying ? { marginLeft: 1 } : undefined}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onClose}
                    style={[styles.miniCloseBtn, { backgroundColor: `${colors.text}0d` }]}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <Ionicons name="close" size={16} color={colors.muted} />
                </TouchableOpacity>
            </View>

            {/* Bottom mini progress bar */}
            <View style={[styles.miniProgressTrack, { backgroundColor: `${colors.text}10` }]}>
                <View
                    style={[
                        styles.miniProgressFill,
                        {
                            backgroundColor: colors.secondary,
                            width: `${Math.min(100, progress * 100)}%`,
                        },
                    ]}
                />
            </View>
        </TouchableOpacity>
    );
};

// ─── Full Screen Music Player ─────────────────────────────────────────────────

const FullScreenMusicPlayer: React.FC<{
    track: FBMusicTrack;
    colors: any;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    progress: number;
    onToggle: () => void;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    animatedStyle: any;
    panGesture: any;
}> = ({
    track,
    colors,
    isPlaying,
    currentTime,
    duration,
    progress,
    onToggle,
    onClose,
    onNext,
    onPrev,
    animatedStyle,
    panGesture,
}) => {
    const insets = useSafeAreaInsets();
    const { seekTo, isShuffle, isRepeat, toggleShuffle, toggleRepeat } = useAudioStore();
    const [isFavorite, setIsFavorite] = useState(false);

    // Interactive scrubbing state (only seeks when finger is released)
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubValue, setScrubValue] = useState(0);

    const totalDuration =
        duration > 0
            ? duration
            : track.durationMs > 0
                ? Math.round(track.durationMs / 1000)
                : 30;

    const displayProgress = isScrubbing
        ? scrubValue
        : totalDuration > 0
            ? currentTime / totalDuration
            : 0;

    const displayCurrentTime = isScrubbing
        ? scrubValue * totalDuration
        : currentTime;

    const handleSlidingStart = useCallback((val: number) => {
        setIsScrubbing(true);
        setScrubValue(val);
    }, []);

    const handleValueChange = useCallback((val: number) => {
        setScrubValue(val);
    }, []);

    const handleSlidingComplete = useCallback(
        (val: number) => {
            setIsScrubbing(false);
            const targetSeconds = Math.max(0, val * totalDuration);
            seekTo(targetSeconds);
        },
        [totalDuration, seekTo]
    );

    return (
        <Animated.View style={[styles.fullPlayerRoot, animatedStyle]}>
            {/* Blurred background cover image */}
            <Image
                source={{
                    uri: track.coverUrl,
                    headers: { Referer: "https://www.facebook.com" },
                }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                blurRadius={Platform.OS === "ios" ? 50 : 25}
            />
            <LinearGradient
                colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.88)", "rgba(0,0,0,0.96)"]}
                style={StyleSheet.absoluteFill}
            />

            <View style={{ flex: 1, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }}>
                {/* Drag handle, Header & Album Art (Draggable to dismiss) */}
                <GestureDetector gesture={panGesture}>
                    <View style={{ flex: 1 }}>
                        <View style={styles.fullPlayerHeader}>
                            <View style={styles.dragPill} />
                            <View style={styles.fullPlayerTopBar}>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={[styles.fullHeaderIconBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}
                                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                                >
                                    <Ionicons name="chevron-down" size={24} color="#fff" />
                                </TouchableOpacity>

                                <View style={{ alignItems: "center", flex: 1 }}>
                                    <FlexText style={{ fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.65)", letterSpacing: 1.2, textTransform: "uppercase" }}>
                                        Playing from
                                    </FlexText>
                                    <FlexText numberOfLines={1} style={{ fontSize: 13, fontWeight: "700", color: "#fff", marginTop: 2 }}>
                                        Facebook Music
                                    </FlexText>
                                </View>

                                <TouchableOpacity
                                    style={[styles.fullHeaderIconBtn, { backgroundColor: "rgba(255,255,255,0.12)" }]}
                                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                                >
                                    <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Big Hero Album Art */}
                        <View style={styles.fullArtContainer}>
                            <View style={styles.fullArtCard}>
                                <Image
                                    source={{
                                        uri: track.coverUrl,
                                        headers: { Referer: "https://www.facebook.com" },
                                    }}
                                    style={styles.fullArt}
                                    contentFit="cover"
                                />
                                {isPlaying && (
                                    <View style={styles.fullArtGlow}>
                                        <LinearGradient
                                            colors={["transparent", "rgba(0,0,0,0.2)"]}
                                            style={StyleSheet.absoluteFill}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </GestureDetector>

                {/* Track Info & Like */}
                <View style={styles.fullTrackInfoRow}>
                    <View style={{ flex: 1, marginRight: 16 }}>
                        <FlexText numberOfLines={1} style={{ fontSize: 22, fontWeight: "900", color: "#fff", letterSpacing: -0.5 }}>
                            {track.title}
                        </FlexText>
                        <FlexText numberOfLines={1} style={{ fontSize: 16, fontWeight: "500", color: "rgba(255,255,255,0.85)", marginTop: 4 }}>
                            {track.artist}
                        </FlexText>
                    </View>
                    <TouchableOpacity
                        onPress={() => setIsFavorite((prev) => !prev)}
                        style={styles.heartBtn}
                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                    >
                        <Ionicons
                            name={isFavorite ? "heart" : "heart-outline"}
                            size={28}
                            color={isFavorite ? "#ff3b30" : "rgba(255,255,255,0.9)"}
                        />
                    </TouchableOpacity>
                </View>

                {/* Scrubber / Progress Bar */}
                <View style={styles.scrubberContainer}>
                    <Slider
                        style={{ width: "100%", height: 36 }}
                        minimumValue={0}
                        maximumValue={1}
                        value={Math.min(1, Math.max(0, displayProgress))}
                        minimumTrackTintColor="#FFFFFF"
                        maximumTrackTintColor="rgba(255,255,255,0.35)"
                        thumbTintColor="#FFFFFF"
                        tapToSeek
                        onSlidingStart={handleSlidingStart}
                        onValueChange={handleValueChange}
                        onSlidingComplete={handleSlidingComplete}
                    />
                    <View style={styles.timeLabelsRow}>
                        <FlexText style={[styles.timeLabel, { color: "#FFFFFF", fontWeight: "700" }]}>
                            {formatSeconds(displayCurrentTime)}
                        </FlexText>
                        <FlexText style={[styles.timeLabel, { color: "rgba(255,255,255,0.75)", fontWeight: "600" }]}>
                            {formatSeconds(totalDuration)}
                        </FlexText>
                    </View>
                </View>

                    {/* Main Controls Row */}
                    <View style={styles.controlsRow}>
                        <TouchableOpacity
                            onPress={toggleShuffle}
                            style={styles.secondaryControlBtn}
                        >
                            <Ionicons
                                name="shuffle"
                                size={22}
                                color={isShuffle ? (colors.secondary || "#1DB954") : "rgba(255,255,255,0.55)"}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onPrev}
                            style={styles.skipBtn}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="play-skip-back" size={30} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.85}
                            onPress={onToggle}
                            style={[styles.mainPlayBtn, { backgroundColor: colors.secondary }]}
                        >
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={34}
                                color="#fff"
                                style={!isPlaying ? { marginLeft: 3 } : undefined}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onNext}
                            style={styles.skipBtn}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="play-skip-forward" size={30} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={toggleRepeat}
                            style={styles.secondaryControlBtn}
                        >
                            <Ionicons
                                name="repeat"
                                size={22}
                                color={isRepeat ? (colors.secondary || "#1DB954") : "rgba(255,255,255,0.55)"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Footer Aux Icons */}
                    <View style={styles.fullPlayerFooter}>
                        <TouchableOpacity style={styles.auxBtn}>
                            <Ionicons name="share-outline" size={22} color="rgba(255,255,255,0.75)" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.auxBtn}>
                            <Ionicons name="musical-notes-outline" size={22} color="rgba(255,255,255,0.75)" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.auxBtn}>
                            <Ionicons name="list-outline" size={22} color="rgba(255,255,255,0.75)" />
                        </TouchableOpacity>
                    </View>
                </View>
        </Animated.View>
    );
};

// ─── Flat list item type ──────────────────────────────────────────────────────

type ListItem =
    | { kind: "header"; id: string; title: string; count?: number }
    | { kind: "featured"; id: string; tracks: FBMusicTrack[] }
    | { kind: "track"; id: string; track: FBMusicTrack; index: number };

// ─── Main Screen Component ────────────────────────────────────────────────────

const MusicScreen = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const [isFocused, setIsFocused] = useState(true);

    useEffect(() => {
        const unsubscribeFocus = navigation.addListener("focus", () => setIsFocused(true));
        const unsubscribeBlur = navigation.addListener("blur", () => setIsFocused(false));
        return () => {
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [navigation]);

    const {
        currentlyPlayingId,
        playTrack,
        stopPlayback,
        currentTime,
        duration,
        currentAudioUrl,
        setPlaylist,
        playNext,
        playPrev,
    } = useAudioStore();
    const metadata = useAudioStore((s) => s.metadata);

    const [isAuthed, setIsAuthed] = useState(hasFBAuth);
    const [showAuth, setShowAuth] = useState(!hasFBAuth());

    const [sections, setSections] = useState<FBMusicSection[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [loadingMain, setLoadingMain] = useState(isAuthed);
    const [errorMain, setErrorMain] = useState<string | null>(null);

    const playingTrack = useMemo(() => {
        if (!currentlyPlayingId || !metadata) return null;
        return {
            id: currentlyPlayingId,
            title: metadata.title ?? "Unknown",
            artist: metadata.artist ?? "",
            albumTitle: metadata.albumTitle ?? "",
            coverUrl: metadata.coverUrl ?? metadata.artworkUrl ?? "",
            audioUrl: currentAudioUrl ?? "",
            durationMs: 0,
            isSaved: false,
            highlightTimesMs: [],
        } as FBMusicTrack;
    }, [currentlyPlayingId, metadata, currentAudioUrl]);

    const isPlaying = !!currentlyPlayingId && currentlyPlayingId === playingTrack?.id;

    // ── All Tracks for Next / Prev & Playlist Queue ────────────────────────────

    const allTracks = useMemo(() => {
        const list: FBMusicTrack[] = [];
        for (const sec of sections) {
            for (const t of sec.tracks ?? []) {
                if (!list.some((existing) => existing.id === t.id)) {
                    list.push(t);
                }
            }
        }
        return list;
    }, [sections]);

    useEffect(() => {
        if (allTracks.length) {
            setPlaylist(
                allTracks.map((t) => ({
                    id: t.id,
                    url: t.audioUrl,
                    metadata: {
                        title: t.title,
                        artist: t.artist,
                        coverUrl: t.coverUrl,
                        artworkUrl: t.coverUrl,
                    },
                }))
            );
        }
    }, [allTracks, setPlaylist]);

    // ── Full Player Reanimated Shared Values ───────────────────────────────────

    const translateY = useSharedValue(SCREEN_HEIGHT);

    const openFullPlayer = useCallback(() => {
        "worklet";
        translateY.value = withTiming(0, {
            duration: 280,
            easing: Easing.bezier(0.25, 1, 0.5, 1),
        });
    }, [translateY]);

    const closeFullPlayer = useCallback(() => {
        "worklet";
        translateY.value = withTiming(SCREEN_HEIGHT, {
            duration: 250,
            easing: Easing.bezier(0.25, 1, 0.5, 1),
        });
    }, [translateY]);

    // Auto-close full player if playback is stopped
    useEffect(() => {
        if (!playingTrack) {
            translateY.value = withTiming(SCREEN_HEIGHT, {
                duration: 250,
                easing: Easing.bezier(0.25, 1, 0.5, 1),
            });
        }
    }, [playingTrack, translateY]);

    // Pan gesture for mini player (swipe up to open)
    const miniPlayerPan = Gesture.Pan()
        .onUpdate((e) => {
            if (e.translationY < 0) {
                translateY.value = Math.max(0, SCREEN_HEIGHT + e.translationY);
            }
        })
        .onEnd((e) => {
            if (e.translationY < -60 || e.velocityY < -400) {
                translateY.value = withTiming(0, {
                    duration: 280,
                    easing: Easing.bezier(0.25, 1, 0.5, 1),
                });
            } else {
                translateY.value = withTiming(SCREEN_HEIGHT, {
                    duration: 250,
                    easing: Easing.bezier(0.25, 1, 0.5, 1),
                });
            }
        });

    // Pan gesture for full screen player (swipe down to close)
    const fullPlayerPan = Gesture.Pan()
        .activeOffsetY([15, 1000])
        .failOffsetX([-20, 20])
        .onUpdate((e) => {
            if (e.translationY > 0) {
                translateY.value = e.translationY;
            }
        })
        .onEnd((e) => {
            if (e.translationY > 100 || e.velocityY > 400) {
                translateY.value = withTiming(SCREEN_HEIGHT, {
                    duration: 250,
                    easing: Easing.bezier(0.25, 1, 0.5, 1),
                });
            } else {
                translateY.value = withTiming(0, {
                    duration: 280,
                    easing: Easing.bezier(0.25, 1, 0.5, 1),
                });
            }
        });

    const fullPlayerAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
            opacity: interpolate(
                translateY.value,
                [SCREEN_HEIGHT * 0.9, 0],
                [0, 1],
                Extrapolation.CLAMP
            ),
        };
    });

    const miniPlayerAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(
                translateY.value,
                [SCREEN_HEIGHT * 0.3, SCREEN_HEIGHT],
                [0, 1],
                Extrapolation.CLAMP
            ),
            transform: [
                {
                    translateY: interpolate(
                        translateY.value,
                        [0, SCREEN_HEIGHT],
                        [80, 0],
                        Extrapolation.CLAMP
                    ),
                },
            ],
        };
    });

    // ── WebView Bridge state & refs ───────────────────────────────────────────

    const webViewRef = useRef<WebView<object>>(null);
    const [isBridgeReady, setIsBridgeReady] = useState(false);
    const nextRequestId = useRef(1);
    const pendingRequests = useRef<Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>>(new Map());

    const handleBridgeMessage = useCallback((event: any) => {
        try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === "GRAPHQL_RESPONSE") {
                const pending = pendingRequests.current.get(msg.requestId);
                if (pending) {
                    pendingRequests.current.delete(msg.requestId);
                    if (msg.success) {
                        pending.resolve(msg.data);
                    } else {
                        pending.reject(new Error(msg.error));
                    }
                }
            } else if (msg.type === "DEBUG") {
                console.log("BRIDGE DEBUG:", msg.info);
            }
        } catch (e: any) {
            console.error("BRIDGE ERROR parsing message:", e.message);
        }
    }, []);

    useEffect(() => {
        if (!isAuthed || !isFocused) {
            registerFBMusicBridge(null, "music_screen");
            setTimeout(() => setIsBridgeReady(false), 0);
            return;
        }

        const bridgeFn = (variables: any) => {
            return new Promise<any>((resolve, reject) => {
                if (!webViewRef.current) {
                    reject(new Error("Facebook Music Bridge is not loaded"));
                    return;
                }
                const reqId = nextRequestId.current++;
                pendingRequests.current.set(reqId, { resolve, reject });

                const auth = getFBAuth();
                const jsCode = `
                    (function() {
                        try {
                            let dtsg = '';
                            try {
                                const metas = document.querySelectorAll('meta');
                                for (const m of metas) {
                                    if (m.name === 'fb:dtsg' || m.getAttribute('data-default') === 'fb_dtsg') {
                                        dtsg = m.content || '';
                                        break;
                                    }
                                }
                            } catch(e) {}
                            if (!dtsg) {
                                dtsg = '${auth.fbDtsg}';
                            }
                            
                            const variablesStr = ${JSON.stringify(JSON.stringify(variables))};
                            const body = new URLSearchParams({
                                av: '${auth.cUser}',
                                __user: '${auth.cUser}',
                                __a: '1',
                                fb_dtsg: dtsg,
                                lsd: 'AVp',
                                fb_api_caller_class: 'RelayModern',
                                fb_api_req_friendly_name: 'StoriesCreateMusicSelectorMainPageQuery',
                                server_timestamps: 'true',
                                variables: variablesStr,
                                doc_id: '23943555345255534',
                            });

                            fetch('https://www.facebook.com/api/graphql/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'x-fb-friendly-name': 'StoriesCreateMusicSelectorMainPageQuery'
                                },
                                body: body.toString()
                            })
                            .then(r => r.text())
                            .then(t => {
                                const clean = t.replace(/^for\\s*\\(\\;;\\)\\;/, "");
                                const json = JSON.parse(clean);
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'GRAPHQL_RESPONSE',
                                    requestId: ${reqId},
                                    success: true,
                                    data: json
                                }));
                            })
                            .catch(err => {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'GRAPHQL_RESPONSE',
                                    requestId: ${reqId},
                                    success: false,
                                    error: err.message
                                }));
                            });
                        } catch(e) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'GRAPHQL_RESPONSE',
                                requestId: ${reqId},
                                success: false,
                                error: e.message
                            }));
                        }
                    })();
                `;
                webViewRef.current.injectJavaScript(jsCode);
            });
        };

        registerFBMusicBridge(bridgeFn, "music_screen");
        return () => {
            registerFBMusicBridge(null, "music_screen");
        };
    }, [isAuthed, isFocused]);

    // ── Load Music Data ───────────────────────────────────────────────────────

    const loadMusic = useCallback(async () => {
        try {
            setLoadingMain(true);
            setErrorMain(null);
            const data = await fetchFBMusic();
            setSections(data);
        } catch (e: any) {
            setErrorMain(e.message || "Failed to load music");
        } finally {
            setLoadingMain(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthed && isBridgeReady) {
            const tid = setTimeout(() => {
                void loadMusic();
            }, 0);
            return () => clearTimeout(tid);
        }
    }, [isAuthed, isBridgeReady, loadMusic]);

    // ── Playback Handlers ─────────────────────────────────────────────────────

    const handlePlay = useCallback(
        (track: FBMusicTrack) => {
            if (currentlyPlayingId === track.id) {
                stopPlayback();
            } else {
                playTrack(track.id, track.audioUrl, {
                    title: track.title,
                    artist: track.artist,
                    coverUrl: track.coverUrl,
                    artworkUrl: track.coverUrl,
                });
            }
        },
        [currentlyPlayingId, playTrack, stopPlayback]
    );

    const handleMiniToggle = useCallback(() => {
        if (!playingTrack || !currentAudioUrl) return;
        if (isPlaying) {
            stopPlayback();
        } else {
            playTrack(playingTrack.id, currentAudioUrl, {
                title: playingTrack.title,
                artist: playingTrack.artist,
                coverUrl: playingTrack.coverUrl,
                artworkUrl: playingTrack.coverUrl,
            });
        }
    }, [playingTrack, isPlaying, playTrack, stopPlayback, currentAudioUrl]);

    const handleNextTrack = useCallback(() => {
        playNext();
    }, [playNext]);

    const handlePrevTrack = useCallback(() => {
        playPrev();
    }, [playPrev]);

    // ── Auth Handlers ─────────────────────────────────────────────────────────

    const handleAuthSuccess = useCallback(() => {
        setShowAuth(false);
        setIsAuthed(true);
    }, []);

    const handleLogout = useCallback(() => {
        clearFBAuth();
        stopPlayback();
        setSections([]);
        setIsAuthed(false);
        setShowAuth(true);
    }, [stopPlayback]);

    // ── Grouped Data & Category Filters ───────────────────────────────────────

    const groupedData = useMemo(() => {
        interface Group {
            id: string;
            title: string;
            type: "section" | "header" | "feed";
            tracks: FBMusicTrack[];
        }

        const groups: Group[] = [];
        let currentHeaderGroup: Group | null = null;

        for (let i = 0; i < sections.length; i++) {
            const item = sections[i];
            if (item.type === "section") {
                groups.push({
                    id: `sec_${i}_${item.title || i}`,
                    title: item.title || "Featured",
                    type: "section",
                    tracks: item.tracks || [],
                });
            } else if (item.type === "header") {
                currentHeaderGroup = {
                    id: `hdr_${i}_${item.title || i}`,
                    title: item.title,
                    type: "header",
                    tracks: [],
                };
                groups.push(currentHeaderGroup);
            } else if (item.type === "track") {
                const track = item.tracks?.[0];
                if (track) {
                    if (!currentHeaderGroup) {
                        currentHeaderGroup = {
                            id: `feed_${i}`,
                            title: "Tracks",
                            type: "feed",
                            tracks: [],
                        };
                        groups.push(currentHeaderGroup);
                    }
                    currentHeaderGroup.tracks.push(track);
                }
            }
        }
        return groups;
    }, [sections]);

    const categories = useMemo(() => {
        const titles = groupedData
            .map((g) => g.title)
            .filter((t) => Boolean(t) && t !== "Tracks");
        const uniqueTitles = Array.from(new Set(titles));
        return ["All", ...uniqueTitles];
    }, [groupedData]);

    const listData: ListItem[] = useMemo(() => {
        const items: ListItem[] = [];
        if (!groupedData.length) return items;

        const filteredGroups =
            selectedCategory === "All"
                ? groupedData
                : groupedData.filter((g) => g.title === selectedCategory);

        if (!filteredGroups.length) return items;

        // In "All" mode, the first group with multiple tracks is shown in the featured carousel
        if (selectedCategory === "All" && filteredGroups[0]?.tracks?.length > 0) {
            const firstGroup = filteredGroups[0];
            items.push({
                kind: "header",
                id: `featured_head`,
                title: firstGroup.title || "Featured & For You",
                count: firstGroup.tracks.length,
            });
            items.push({
                kind: "featured",
                id: `featured_carousel`,
                tracks: firstGroup.tracks,
            });

            // Remaining groups
            for (let i = 1; i < filteredGroups.length; i++) {
                const group = filteredGroups[i];
                if (!group.tracks.length) continue;
                if (group.title && group.title !== "Tracks") {
                    items.push({
                        kind: "header",
                        id: `h_${group.id}`,
                        title: group.title,
                        count: group.tracks.length,
                    });
                }
                group.tracks.forEach((t, trackIdx) => {
                    items.push({
                        kind: "track",
                        id: `t_${group.id}_${t.id}`,
                        track: t,
                        index: trackIdx,
                    });
                });
            }
        } else {
            // Filtered category mode
            for (const group of filteredGroups) {
                if (!group.tracks.length) continue;
                if (group.title && group.title !== "Tracks") {
                    items.push({
                        kind: "header",
                        id: `h_${group.id}`,
                        title: group.title,
                        count: group.tracks.length,
                    });
                }
                group.tracks.forEach((t, trackIdx) => {
                    items.push({
                        kind: "track",
                        id: `t_${group.id}_${t.id}`,
                        track: t,
                        index: trackIdx,
                    });
                });
            }
        }

        return items;
    }, [groupedData, selectedCategory]);

    const progress = duration > 0 ? currentTime / duration : 0;

    // ── UI Components ─────────────────────────────────────────────────────────

    const ListHeaderComponent = useCallback(() => (
        <View style={{ marginTop: insets.top + 60, marginBottom: 12 }}>
            <View style={styles.heroGreeting}>
                <FlexText style={[common.heading, { fontSize: 32, fontWeight: "900", letterSpacing: -0.8 }]}>
                    Discover
                </FlexText>
                <FlexText style={{ fontSize: 14, color: colors.muted, marginTop: 4, fontWeight: "500" }}>
                    Streaming thousands of tracks
                </FlexText>
            </View>

            {/* Quick Search Action Bar */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push("/search_music")}
                style={[
                    styles.searchBanner,
                    {
                        backgroundColor: colors.surfaceContainerHigh,
                        borderColor: `${colors.divider}80`,
                    },
                ]}
            >
                <Ionicons name="search" size={18} color={colors.muted} />
                <FlexText style={{ fontSize: 14, color: colors.muted, marginLeft: 8, flex: 1 }}>
                    Search songs, artists, soundtracks…
                </FlexText>
                <View style={[styles.searchPillBadge, { backgroundColor: `${colors.secondary}1a` }]}>
                    <FlexText style={{ fontSize: 11, fontWeight: "700", color: colors.secondary }}>
                        Search
                    </FlexText>
                </View>
            </TouchableOpacity>

            {/* Category Filter Pills */}
            {categories.length > 1 && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                >
                    {categories.map((cat) => {
                        const active = selectedCategory === cat;
                        return (
                            <TouchableOpacity
                                key={cat}
                                activeOpacity={0.8}
                                onPress={() => setSelectedCategory(cat)}
                                style={[
                                    styles.categoryChip,
                                    {
                                        backgroundColor: active ? colors.secondary : colors.surfaceContainerHigh,
                                        borderColor: active ? colors.secondary : `${colors.divider}60`,
                                    },
                                ]}
                            >
                                <FlexText
                                    style={{
                                        fontSize: 13,
                                        fontWeight: active ? "700" : "600",
                                        color: active ? "#fff" : colors.text,
                                    }}
                                >
                                    {cat}
                                </FlexText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            )}
        </View>
    ), [insets.top, common, colors, router, categories, selectedCategory]);

    const renderEmpty = useCallback(() => {
        if (loadingMain && !sections.length) {
            return (
                <View style={[styles.centered, { paddingTop: 80 }]}>
                    <ActivityIndicator color={colors.secondary} size="large" />
                    <FlexText style={{ marginTop: 14, color: colors.muted, fontSize: 15, fontWeight: "600" }}>
                        Loading music library…
                    </FlexText>
                </View>
            );
        }
        if (errorMain) {
            return (
                <View style={[styles.centered, { paddingTop: 60 }]}>
                    <View style={[styles.errorCircle, { backgroundColor: `${colors.error}18` }]}>
                        <Ionicons name="alert-circle-outline" size={44} color={colors.error} />
                    </View>
                    <FlexText style={{ marginTop: 14, fontSize: 16, fontWeight: "700", color: colors.text }}>
                        Couldn't load music
                    </FlexText>
                    <FlexText style={{ marginTop: 6, color: colors.muted, textAlign: "center", paddingHorizontal: 32, fontSize: 13 }}>
                        {errorMain}
                    </FlexText>
                    <TouchableOpacity
                        onPress={loadMusic}
                        style={[styles.retryBtn, { backgroundColor: colors.secondary }]}
                    >
                        <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
                        <FlexText style={{ color: "#fff", fontWeight: "700" }}>Retry</FlexText>
                    </TouchableOpacity>
                </View>
            );
        }
        return null;
    }, [loadingMain, sections.length, errorMain, colors, loadMusic]);

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<ListItem>) => {
            if (item.kind === "header") {
                return <SectionHeader key={item.id} title={item.title} count={item.count} colors={colors} />;
            }
            if (item.kind === "featured") {
                return (
                    <ScrollView
                        key={item.id}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 8, paddingRight: 16, gap: 14 }}
                    >
                        {item.tracks.map((t) => (
                            <FeaturedTrackCard
                                key={t.id}
                                track={t}
                                colors={colors}
                                isPlaying={currentlyPlayingId === t.id}
                                onPress={handlePlay}
                            />
                        ))}
                    </ScrollView>
                );
            }
            const track = item.track;
            return (
                <TrackRow
                    key={item.id}
                    track={track}
                    index={item.index}
                    colors={colors}
                    isPlaying={currentlyPlayingId === track.id}
                    onPress={handlePlay}
                />
            );
        },
        [colors, currentlyPlayingId, handlePlay]
    );

    return (
        <View style={[common.screen, { backgroundColor: colors.surface }]}>
            {/* Glassmorphic Top Navigation Header */}
            <View style={[styles.topNavWrapper, { top: insets.top + 8 }]}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.back()}
                    style={[styles.navCircleBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: `${colors.divider}60` }]}
                >
                    <Ionicons name="chevron-back" size={22} color={colors.onSurface} />
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                {isAuthed && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => router.push("/search_music")}
                            style={[styles.navCircleBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: `${colors.divider}60` }]}
                        >
                            <Ionicons name="search" size={18} color={colors.onSurface} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleLogout}
                            style={[styles.navCircleBtn, { backgroundColor: colors.surfaceContainerHigh, borderColor: `${colors.divider}60` }]}
                        >
                            <Ionicons name="log-out-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Auth gate */}
            {!isAuthed && !showAuth && (
                <View style={styles.centered}>
                    <View style={[styles.authLogoCircle, { backgroundColor: `${colors.secondary}1a` }]}>
                        <Ionicons name="musical-notes" size={48} color={colors.secondary} />
                    </View>
                    <FlexText style={{ fontSize: 24, fontWeight: "900", color: colors.text, marginTop: 20 }}>
                        Unlimited Music
                    </FlexText>
                    <FlexText style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginTop: 8, paddingHorizontal: 36, lineHeight: 20 }}>
                        Connect your Facebook account to stream millions of full tracks and trending songs seamlessly.
                    </FlexText>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => setShowAuth(true)}
                        style={[styles.loginBtn, { backgroundColor: "#1877F2", marginTop: 28 }]}
                    >
                        <Ionicons name="logo-facebook" size={22} color="#fff" />
                        <FlexText style={{ color: "#fff", fontWeight: "700", fontSize: 16, marginLeft: 10 }}>
                            Continue with Facebook
                        </FlexText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Main Content List */}
            {isAuthed && (
                <FlatList
                    data={listData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingBottom: insets.bottom + (playingTrack ? 100 : 32),
                    }}
                    ListHeaderComponent={ListHeaderComponent}
                    ListEmptyComponent={renderEmpty}
                    onRefresh={loadMusic}
                    refreshing={loadingMain}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {/* Mini Player Bar (Swipe up or Tap to expand) */}
            {playingTrack && (
                <Animated.View style={[styles.miniPlayerContainer, { bottom: insets.bottom + 12 }, miniPlayerAnimatedStyle]}>
                    <GestureDetector gesture={miniPlayerPan}>
                        <View>
                            <MiniPlayerBar
                                colors={colors}
                                track={playingTrack}
                                isPlaying={isPlaying}
                                progress={progress}
                                onToggle={handleMiniToggle}
                                onExpand={openFullPlayer}
                                onClose={stopPlayback}
                            />
                        </View>
                    </GestureDetector>
                </Animated.View>
            )}

            {/* Full Screen Interactive Player */}
            {playingTrack && (
                <FullScreenMusicPlayer
                    track={playingTrack}
                    colors={colors}
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    progress={progress}
                    onToggle={handleMiniToggle}
                    onClose={closeFullPlayer}
                    onNext={handleNextTrack}
                    onPrev={handlePrevTrack}
                    animatedStyle={fullPlayerAnimatedStyle}
                    panGesture={fullPlayerPan}
                />
            )}

            {/* FB Auth Overlay */}
            {showAuth && (
                <FBAuthWebView
                    onSuccess={handleAuthSuccess}
                    onCancel={isAuthed ? () => setShowAuth(false) : undefined}
                />
            )}

            {/* Hidden WebView Bridge for FB GraphQL API */}
            {isAuthed && isFocused && (
                <WebView
                    ref={webViewRef}
                    source={{ uri: "https://www.facebook.com/stories/create" }}
                    userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36"
                    style={{ width: 0, height: 0, opacity: 0, position: "absolute", left: -9999 }}
                    onMessage={handleBridgeMessage}
                    onLoadEnd={() => setIsBridgeReady(true)}
                    javaScriptEnabled
                    domStorageEnabled
                    sharedCookiesEnabled
                    thirdPartyCookiesEnabled
                    allowsInlineMediaPlayback
                    incognito={false}
                />
            )}
        </View>
    );
};

export default MusicScreen;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    topNavWrapper: {
        position: "absolute",
        left: 16,
        right: 16,
        flexDirection: "row",
        alignItems: "center",
        zIndex: 100,
    },
    navCircleBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: StyleSheet.hairlineWidth,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    heroGreeting: {
        marginBottom: 16,
    },
    searchBanner: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 16,
    },
    searchPillBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    categoryScroll: {
        gap: 8,
        paddingBottom: 4,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    authLogoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    loginBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 26,
        paddingVertical: 15,
        borderRadius: 16,
        elevation: 4,
        shadowColor: "#1877F2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    errorCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    retryBtn: {
        marginTop: 18,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 12,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 24,
        paddingBottom: 10,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 12,
    },
    // Featured Carousel
    featuredCard: {
        width: 150,
    },
    featuredArtContainer: {
        width: 150,
        height: 150,
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
    },
    featuredArt: {
        width: "100%",
        height: "100%",
    },
    featuredPlayBadge: {
        position: "absolute",
        bottom: 10,
        right: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    // Track row
    trackRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 16,
        marginVertical: 3,
        borderWidth: 1,
    },
    trackIndex: {
        width: 22,
        fontSize: 13,
        fontWeight: "700",
        textAlign: "center",
        marginRight: 6,
    },
    artWrapper: {
        width: 50,
        height: 50,
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
    },
    art: {
        width: "100%",
        height: "100%",
    },
    artOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
    },
    trackActionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 10,
    },
    // Mini Player
    miniPlayerContainer: {
        position: "absolute",
        left: 12,
        right: 12,
        zIndex: 150,
    },
    miniPlayer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        position: "relative",
        overflow: "hidden",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
    },
    miniArtContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
    },
    miniArt: {
        width: "100%",
        height: "100%",
    },
    miniArtOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    miniPlayBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    miniCloseBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    miniProgressTrack: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    miniProgressFill: {
        height: "100%",
    },
    // Full Screen Player
    fullPlayerRoot: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#111",
        zIndex: 200,
    },
    fullPlayerHeader: {
        alignItems: "center",
        paddingHorizontal: 16,
    },
    dragPill: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: "rgba(255,255,255,0.3)",
        marginBottom: 12,
    },
    fullPlayerTopBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
    },
    fullHeaderIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    fullArtContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 16,
    },
    fullArtCard: {
        width: SCREEN_WIDTH * 0.76,
        height: SCREEN_WIDTH * 0.76,
        borderRadius: 28,
        overflow: "hidden",
        elevation: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
        position: "relative",
    },
    fullArt: {
        width: "100%",
        height: "100%",
    },
    fullArtGlow: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    fullTrackInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 28,
        marginTop: 8,
    },
    heartBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    scrubberContainer: {
        paddingHorizontal: 20,
        marginTop: 14,
    },
    timeLabelsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 10,
        marginTop: -4,
    },
    timeLabel: {
        fontSize: 12,
        color: "rgba(255,255,255,0.6)",
        fontVariant: ["tabular-nums"],
    },
    controlsRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 28,
        marginTop: 12,
    },
    secondaryControlBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    skipBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    mainPlayBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    fullPlayerFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingHorizontal: 40,
        marginTop: 20,
    },
    auxBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
});
