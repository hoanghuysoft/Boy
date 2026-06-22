import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ListRenderItemInfo,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    registerFBMusicBridge
} from "@/services/fbmusic";
import { useAudioStore } from "@/stores/audio";
import { createCommonStyles } from "@/styles/common";
import { WebView } from "react-native-webview";

// ─── Mini player bar ──────────────────────────────────────────────────────────

const MiniPlayerBar: React.FC<{
    colors: any;
    track: FBMusicTrack;
    isPlaying: boolean;
    progress: number;
    onToggle: () => void;
}> = ({ colors, track, isPlaying, progress, onToggle }) => {
    return (
        <View
            style={[
                styles.miniPlayer,
                {
                    backgroundColor: colors.surfaceContainerHigh,
                    borderColor: colors.divider,
                }
            ]}
        >
            <View>
                <Image
                    source={{
                        uri: track.coverUrl,
                        headers: {
                            Referer: "https://www.facebook.com"
                        }
                    }}
                    style={styles.miniArt}
                    contentFit="cover"
                />
            </View>
            <View style={{ flex: 1, marginHorizontal: 12 }}>
                <FlexText numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: colors.text }}>
                    {track.title}
                </FlexText>
                <FlexText numberOfLines={1} style={{ fontSize: 12, color: colors.muted, marginTop: 1 }}>
                    {track.artist}
                </FlexText>
                {/* Progress bar */}
                <View style={{ height: 3, backgroundColor: `${colors.text}10`, borderRadius: 1.5, marginTop: 6, overflow: "hidden" }}>
                    <View style={{ height: 3, backgroundColor: colors.secondary, width: `${Math.min(100, progress * 100)}%` }} />
                </View>
            </View>
            <View>
                <TouchableOpacity
                    onPress={onToggle}
                    style={[styles.playBtn, { backgroundColor: colors.secondary }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name={isPlaying ? "pause" : "play"} size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─── Track row ────────────────────────────────────────────────────────────────

const TrackRow: React.FC<{
    track: FBMusicTrack;
    colors: any;
    isPlaying: boolean;
    onPress: (track: FBMusicTrack) => void;
}> = ({ track, colors, isPlaying, onPress }) => {
    const durationSec = Math.round(track.durationMs / 1000);
    const mins = Math.floor(durationSec / 60);
    const secs = String(durationSec % 60).padStart(2, "0");

    return (
        <Pressable
            onPress={() => onPress(track)}
            style={({ pressed }) => [
                styles.trackRow,
                { backgroundColor: pressed ? `${colors.text}08` : "transparent" },
                isPlaying && { backgroundColor: `${colors.secondary}12` },
            ]}
        >
            <View style={[styles.artWrapper, { borderColor: isPlaying ? colors.secondary : "transparent", borderWidth: 2 }]}>
                <Image
                    source={{
                        uri: track.coverUrl,
                        headers: {
                            Referer: "https://www.facebook.com"
                        }
                    }}
                    style={styles.art}
                    contentFit="cover"
                />
                {isPlaying && (
                    <View style={[styles.artOverlay, { backgroundColor: `${colors.secondary}cc` }]}>
                        <Ionicons name="musical-notes" size={14} color="#fff" />
                    </View>
                )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <FlexText numberOfLines={1} style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                    {track.title}
                </FlexText>
                <FlexText numberOfLines={1} style={{ fontSize: 13, color: colors.muted, marginTop: 1 }}>
                    {track.artist}
                </FlexText>
            </View>
            <FlexText style={{ fontSize: 12, color: colors.muted, marginLeft: 8 }}>
                {mins}:{secs}
            </FlexText>
        </Pressable>
    );
};

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; colors: any }> = ({ title, colors }) => (
    <View style={[styles.sectionHeader]}>
        <FlexText style={{ fontSize: 13, fontWeight: "700", color: colors.muted, letterSpacing: 0.5, textTransform: "uppercase" }}>
            {title}
        </FlexText>
    </View>
);

// ─── Flat list item type ──────────────────────────────────────────────────────

type ListItem =
    | { kind: "header"; id: string; title: string }
    | { kind: "track"; id: string; track: FBMusicTrack };

// ─── Main screen ──────────────────────────────────────────────────────────────

const MusicScreen = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const [isFocused, setIsFocused] = useState(true);

    useEffect(() => {
        const unsubscribeFocus = navigation.addListener("focus", () => {
            setIsFocused(true);
        });
        const unsubscribeBlur = navigation.addListener("blur", () => {
            setIsFocused(false);
        });
        return () => {
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [navigation]);

    const { currentlyPlayingId, playTrack, stopPlayback, currentTime, duration, currentAudioUrl } = useAudioStore();
    const metadata = useAudioStore((s) => s.metadata);

    const [isAuthed, setIsAuthed] = useState(hasFBAuth);
    const [showAuth, setShowAuth] = useState(!hasFBAuth());

    const [sections, setSections] = useState<FBMusicSection[]>([]);
    const [loadingMain, setLoadingMain] = useState(isAuthed);
    const [errorMain, setErrorMain] = useState<string | null>(null);

    const playingTrack = React.useMemo(() => {
        if (!currentlyPlayingId || !metadata) return null;
        return {
            id: currentlyPlayingId,
            title: metadata.title ?? "Unknown",
            artist: metadata.artist ?? "",
            albumTitle: "",
            coverUrl: metadata.coverUrl ?? "",
            audioUrl: "",
            durationMs: 0,
            isSaved: false,
            highlightTimesMs: [],
        } as FBMusicTrack;
    }, [currentlyPlayingId, metadata]);
    const isPlaying = !!currentlyPlayingId && currentlyPlayingId === playingTrack?.id;

    // WebView Bridge state & refs
    const webViewRef = useRef<WebView>(null);
    const [isBridgeReady, setIsBridgeReady] = useState(false);
    const nextRequestId = useRef(1);
    const pendingRequests = useRef<Map<number, { resolve: (val: any) => void; reject: (err: any) => void }>>(new Map());

    // Message handler for the WebView bridge
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

    // Register bridge function in fbmusic.ts
    useEffect(() => {
        if (!isAuthed || !isFocused) {
            registerFBMusicBridge(null, "music_screen");
            setTimeout(() => {
                setIsBridgeReady(false);
            }, 0);
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

    // ── Load main page ────────────────────────────────────────────────────────

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

    // ── Play ──────────────────────────────────────────────────────────────────

    const handlePlay = useCallback(
        (track: FBMusicTrack) => {
            if (currentlyPlayingId === track.id) {
                stopPlayback();
            } else {
                playTrack(track.id, track.audioUrl, {
                    title: track.title,
                    artist: track.artist,
                    coverUrl: track.coverUrl,
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
            });
        }
    }, [playingTrack, isPlaying, playTrack, stopPlayback, currentAudioUrl]);

    // ── Auth ──────────────────────────────────────────────────────────────────

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

    // ── Build flat list data ───────────────────────────────────────────────────

    const listData: ListItem[] = React.useMemo(() => {
        const items: ListItem[] = [];
        for (const section of sections) {
            const sectionId = section.title || "default";
            if (section.type === "section" || section.type === "header") {
                if (section.title) {
                    items.push({ kind: "header", id: `h_${sectionId}`, title: section.title });
                }
            }
            for (const t of section.tracks ?? []) {
                items.push({ kind: "track", id: `t_${sectionId}_${t.id}`, track: t });
            }
        }
        return items;
    }, [sections]);

    const progress = duration > 0 ? currentTime / duration : 0;

    const ListHeaderComponent = useCallback(() => (
        <View style={{ marginTop: insets.top + 66, marginBottom: 8 }}>
            <View style={{ paddingHorizontal: 0, marginBottom: 8 }}>
                <FlexText style={[common.heading, { fontSize: 28 }]}>
                    Music
                </FlexText>
                <FlexText style={[common.bodySmall, { color: colors.muted, marginTop: 2 }]}>
                    via Facebook Music
                </FlexText>
            </View>
        </View>
    ), [insets.top, common, colors]);

    const renderEmpty = useCallback(() => {
        if (loadingMain && !sections.length) {
            return (
                <View style={[styles.centered, { paddingTop: 60 }]}>
                    <ActivityIndicator color={colors.secondary} size="large" />
                    <FlexText style={{ marginTop: 12, color: colors.muted }}>Loading music…</FlexText>
                </View>
            );
        }
        if (errorMain) {
            return (
                <View style={[styles.centered, { paddingTop: 60 }]}>
                    <Ionicons name="alert-circle-outline" size={40} color={colors.error} />
                    <FlexText style={{ marginTop: 10, color: colors.muted, textAlign: "center", paddingHorizontal: 32 }}>
                        {errorMain}
                    </FlexText>
                    <TouchableOpacity
                        onPress={loadMusic}
                        style={[styles.retryBtn, { backgroundColor: colors.secondary }]}
                    >
                        <FlexText style={{ color: "#fff", fontWeight: "600" }}>Retry</FlexText>
                    </TouchableOpacity>
                </View>
            );
        }
        return null;
    }, [loadingMain, sections.length, errorMain, colors, loadMusic]);

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<ListItem>) => {
            if (item.kind === "header") {
                return <SectionHeader key={item.id} title={item.title} colors={colors} />;
            }
            const track = item.track;
            return (
                <TrackRow
                    key={item.id}
                    track={track}
                    colors={colors}
                    isPlaying={currentlyPlayingId === track.id}
                    onPress={handlePlay}
                />
            );
        },
        [colors, currentlyPlayingId, handlePlay]
    );

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <View style={[common.screen]}>
            {/* Floating back button */}
            <View style={{ position: 'absolute', top: insets.top + 16, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.surfaceContainerHigh,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
                </TouchableOpacity>
            </View>

            {/* Floating search button */}
            {isAuthed && (
                <View style={{ position: 'absolute', top: insets.top + 16, right: 66, zIndex: 1000 }}>
                    <TouchableOpacity
                        onPress={() => router.push("/search_music")}
                        style={{
                            backgroundColor: colors.surfaceContainerHigh,
                            borderRadius: 999,
                            width: 40,
                            height: 40,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="search" size={20} color={colors.onSurface} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Floating logout button */}
            {isAuthed && (
                <View style={{ position: 'absolute', top: insets.top + 16, right: 16, zIndex: 1000 }}>
                    <TouchableOpacity
                        onPress={handleLogout}
                        style={{
                            backgroundColor: colors.surfaceContainerHigh,
                            borderRadius: 999,
                            width: 40,
                            height: 40,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="log-out-outline" size={22} color={colors.error} />
                    </TouchableOpacity>
                </View>
            )}

            {/* Auth gate */}
            {!isAuthed && !showAuth && (
                <View style={styles.centered}>
                    <TouchableOpacity
                        onPress={() => setShowAuth(true)}
                        style={[styles.loginBtn, { backgroundColor: colors.secondary }]}
                    >
                        <Ionicons name="logo-facebook" size={20} color="#fff" />
                        <FlexText style={{ color: "#fff", fontWeight: "700", fontSize: 15, marginLeft: 8 }}>
                            Sign in with Facebook
                        </FlexText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            {isAuthed && (
                <FlatList
                    data={listData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingBottom: insets.bottom + (playingTrack ? 80 : 20),
                    }}
                    ListHeaderComponent={ListHeaderComponent}
                    ListEmptyComponent={renderEmpty}
                    onRefresh={loadMusic}
                    refreshing={loadingMain}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {/* Mini player */}
            {playingTrack && (
                <View style={[styles.miniPlayerContainer, { bottom: insets.bottom + 16 }]}>
                    <MiniPlayerBar
                        colors={colors}
                        track={playingTrack}
                        isPlaying={isPlaying}
                        progress={progress}
                        onToggle={handleMiniToggle}
                    />
                </View>
            )}

            {/* FB Auth Overlay */}
            {showAuth && (
                <FBAuthWebView
                    onSuccess={handleAuthSuccess}
                    onCancel={isAuthed ? () => setShowAuth(false) : undefined}
                />
            )}

            {/* Hidden WebView Bridge for FB Graphql API */}
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

const styles = StyleSheet.create({
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: StyleSheet.hairlineWidth,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        padding: 0,
    },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },
    loginBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
    },
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
    },
    trackRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 4,
        borderRadius: 12,
    },
    artWrapper: {
        width: 52,
        height: 52,
        borderRadius: 10,
        overflow: "hidden",
    },
    art: {
        width: 52,
        height: 52,
    },
    artOverlay: {
        ...StyleSheet.absoluteFill,
        justifyContent: "center",
        alignItems: "center",
    },
    sectionHeader: {
        paddingTop: 20,
        paddingBottom: 8,
    },
    miniPlayerContainer: {
        position: "absolute",
        left: 16,
        right: 16,
        zIndex: 1000,
    },
    miniPlayer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 999, // Pill shape!
        borderWidth: StyleSheet.hairlineWidth,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    miniArt: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    playBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
    },
});
