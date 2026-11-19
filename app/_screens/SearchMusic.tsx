import Ionicons from "@react-native-vector-icons/ionicons/static";
import { Image } from "expo-image";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import {
    FBMusicTrack,
    getFBAuth,
    hasFBAuth,
    registerFBMusicBridge,
    searchFBMusic,
} from "@/services/fbmusic";
import { useAudioStore } from "@/stores/audio";
import {
    addSearchQueryToHistory,
    getSearchQueryHistory
} from "@/stores/searchQueryHistory";
import { createCommonStyles } from "@/styles/common";
import { Input, KeyboardAvoider, SearchIcon, XIcon } from "panelui-native";

const SEARCH_BAR_HEIGHT = 58;

// ─── Track row component ──────────────────────────────────────────────────────
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

const SearchMusicScreen = () => {
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
    const progress = duration > 0 ? currentTime / duration : 0;

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

    const [searchText, setSearchText] = useState("");
    const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
    const [recentQueries, setRecentQueries] = useState<string[]>(() =>
        getSearchQueryHistory("music")
    );

    const [searchResults, setSearchResults] = useState<FBMusicTrack[]>([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // WebView Bridge state & refs
    const webViewRef = useRef<WebView<{}>>(null);
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
                console.log("BRIDGE DEBUG (Search):", msg.info);
            }
        } catch (e: any) {
            console.error("BRIDGE ERROR parsing message (Search):", e.message);
        }
    }, []);

    // Register bridge function in fbmusic.ts
    useEffect(() => {
        if (!hasFBAuth() || !isFocused) {
            registerFBMusicBridge(null, "search_music_screen");
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

        registerFBMusicBridge(bridgeFn, "search_music_screen");

        return () => {
            registerFBMusicBridge(null, "search_music_screen");
        };
    }, [isFocused]);

    const performSearch = useCallback((query: string) => {
        const trimmed = query.trim();
        if (!trimmed) {
            setSearchResults([]);
            setSubmittedQuery(null);
            return;
        }

        setSubmittedQuery(trimmed);
        setLoadingSearch(true);
        setErrorMsg(null);

        searchFBMusic(trimmed)
            .then((results) => {
                setSearchResults(results);
            })
            .catch((err) => {
                setErrorMsg(err.message || "Failed to load results");
                setSearchResults([]);
            })
            .finally(() => {
                setLoadingSearch(false);
            });
    }, []);

    const handleSubmitEditing = useCallback(() => {
        const q = searchText.trim();
        if (q) {
            addSearchQueryToHistory("music", q);
            setRecentQueries(getSearchQueryHistory("music"));
        }
        performSearch(q);
    }, [searchText, performSearch]);

    const handleBlur = useCallback(() => {
        const q = searchText.trim();
        if (q) {
            addSearchQueryToHistory("music", q);
            setRecentQueries(getSearchQueryHistory("music"));
        }
    }, [searchText]);

    const clearSearch = useCallback(() => {
        setSearchText("");
        setSubmittedQuery(null);
        setSearchResults([]);
    }, []);

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

    const renderItem = useCallback(
        ({ item }: { item: FBMusicTrack }) => (
            <TrackRow
                track={item}
                colors={colors}
                isPlaying={currentlyPlayingId === item.id}
                onPress={handlePlay}
            />
        ),
        [colors, currentlyPlayingId, handlePlay]
    );

    const contentBottomPadding = insets.bottom + SEARCH_BAR_HEIGHT + 24 + (playingTrack ? 76 : 0);

    return (
        <KeyboardAvoidingView
            style={common.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
        >
            {/* Floating back button */}
            <View
                style={{
                    position: "absolute",
                    top: insets.top + 16,
                    left: 16,
                    zIndex: 1000,
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.surfaceContainer,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 16, paddingTop: insets.top + 66 }}>
                <FlexText style={[common.heading, { fontSize: 28 }]}>
                    Search Music
                </FlexText>
                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                    {submittedQuery
                        ? `Results for "${submittedQuery}"`
                        : "Pick a phrase then press Enter to search."}
                </FlexText>
            </View>

            {loadingSearch ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                    <FlexText style={{ marginTop: 12, color: colors.muted }}>Searching tracks…</FlexText>
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 12,
                        paddingBottom: contentBottomPadding,
                        gap: 12,
                    }}
                    ListEmptyComponent={
                        submittedQuery && !loadingSearch ? (
                            <View style={styles.centered}>
                                <Ionicons name="musical-notes-outline" size={36} color={colors.muted} />
                                <FlexText style={{ marginTop: 10, color: colors.muted }}>
                                    {`No results for "${submittedQuery}"`}
                                </FlexText>
                            </View>
                        ) : undefined
                    }
                    refreshControl={
                        submittedQuery ? (
                            <RefreshControl
                                refreshing={loadingSearch}
                                onRefresh={() => performSearch(submittedQuery)}
                                tintColor={colors.onSurface}
                                colors={[colors.onSurface]}
                                progressBackgroundColor={colors.surfaceContainerHigh}
                                progressViewOffset={insets.top}
                            />
                        ) : undefined
                    }
                />
            )}

            {/* Mini Player Bar if track is playing */}
            {playingTrack && (
                <View style={[styles.miniPlayerContainer, { bottom: insets.bottom + SEARCH_BAR_HEIGHT + 24 }]}>
                    <MiniPlayerBar
                        colors={colors}
                        track={playingTrack}
                        isPlaying={isPlaying}
                        progress={progress}
                        onToggle={handleMiniToggle}
                    />
                </View>
            )}

            {/* Floating search bar */}
            <KeyboardAvoider
                mode="dock"
                bottomInset={insets.bottom}
                className="absolute left-0 right-0 px-5"
                style={{ bottom: insets.bottom + 16, zIndex: 1000 }}
            >
                <View
                    className="flex-row items-center gap-2 rounded-full px-1"
                    style={{ backgroundColor: colors.surfaceContainerHigh }}
                >
                    <Input
                        placeholder="Search songs, artists..."
                        className="flex-1 border-0 bg-transparent px-0"
                        containerClassName="flex-1"
                        style={{ height: SEARCH_BAR_HEIGHT, color: colors.onSurface }}
                        value={searchText}
                        onChangeText={setSearchText}
                        onSubmitEditing={handleSubmitEditing}
                        onFocus={() => setRecentQueries(getSearchQueryHistory("music"))}
                        onBlur={handleBlur}
                        returnKeyType="search"
                        autoCorrect={false}
                        autoCapitalize="none"
                        startContent={<SearchIcon size={18} color={colors.onSurfaceVariant} />}
                        endContent={
                            searchText.length > 0 ? (
                                <TouchableOpacity
                                    onPress={clearSearch}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <View
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 11,
                                            backgroundColor: colors.onSurface + "22",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                    >
                                        <XIcon size={13} color={colors.onSurface} />
                                    </View>
                                </TouchableOpacity>
                            ) : undefined
                        }
                    />
                </View>
            </KeyboardAvoider>

            {/* Hidden WebView Bridge for FB Graphql API */}
            {isFocused && (
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
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
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
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 100,
    },
    retryBtn: {
        marginTop: 16,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 10,
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

export default SearchMusicScreen;
