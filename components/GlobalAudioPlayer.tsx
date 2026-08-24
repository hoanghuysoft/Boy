import {
    AudioMetadata as ExpoAudioMetadata,
    requestNotificationPermissionsAsync,
    setAudioModeAsync,
    useAudioPlayer,
} from "expo-audio";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useAudioStore } from "../stores/audio";

/**
 * GlobalAudioPlayer - A component that manages audio playback globally.
 * This component is mounted at the root level (in _layout.tsx)
 * and stays completely idle while driving background audio & lock screen controls.
 */
export const GlobalAudioPlayer = () => {
    // Select specific values from audio store
    const currentAudioUrl = useAudioStore((s) => s.currentAudioUrl);
    const metadata = useAudioStore((s) => s.metadata);
    const seekTarget = useAudioStore((s) => s.seekTarget);
    const isRepeat = useAudioStore((s) => s.isRepeat);
    const isPlaying = useAudioStore((s) => s.isPlaying);

    // Pass URL string directly so the hook receives a stable primitive reference
    const player = useAudioPlayer(currentAudioUrl, {
        updateInterval: 500,
    });

    // Guard against multi-firing track completion for the same track
    const lastFinishedTrackIdRef = useRef<string | null>(null);
    const prevUrlRef = useRef<string | null>(null);

    // 1. Configure audio session once for sustained background playback
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: "doNotMix",
        }).catch((err) => {
            console.warn("[GlobalAudioPlayer] Failed to set audio mode:", err);
        });

        // Request notification permission on Android (required for Android 13+ media notifications)
        if (Platform.OS === "android") {
            requestNotificationPermissionsAsync().catch(() => {});
        }
    }, []);

    // 2. Sync native loop mode for seamless repetition
    useEffect(() => {
        if (player) {
            player.loop = isRepeat;
        }
    }, [player, isRepeat]);

    // 3. Handle seek requests
    useEffect(() => {
        if (player && seekTarget !== null && currentAudioUrl) {
            player.seekTo(seekTarget).catch((err) => {
                console.warn("[GlobalAudioPlayer] Failed to seekTo:", err);
            });
            useAudioStore.getState().clearSeekTarget();
        }
    }, [seekTarget, player, currentAudioUrl]);

    // 4. Handle audio URL, metadata, and isPlaying (play/pause vs stop/close)
    useEffect(() => {
        if (!player) return;

        if (currentAudioUrl) {
            const isNewUrl = prevUrlRef.current !== currentAudioUrl;
            prevUrlRef.current = currentAudioUrl;

            if (isNewUrl) {
                const lockScreenMetadata: ExpoAudioMetadata = {
                    title: metadata?.title || "Audio",
                    artist: metadata?.artist || "",
                    albumTitle: metadata?.albumTitle,
                    artworkUrl: metadata?.artworkUrl || metadata?.coverUrl,
                };

                try {
                    // Enable lock screen controls with metadata
                    player.setActiveForLockScreen(true, lockScreenMetadata, {
                        showSeekForward: true,
                        showSeekBackward: true,
                    });
                } catch (err) {
                    console.warn("[GlobalAudioPlayer] Failed to setActiveForLockScreen:", err);
                }
            }

            if (isPlaying) {
                player.play();
            } else {
                player.pause();
            }
        } else {
            // When stopped/closed completely, release media controller & lock screen
            prevUrlRef.current = null;
            try {
                player.setActiveForLockScreen(false);
            } catch {}
            player.pause();
        }

        return () => {
            try {
                player.setActiveForLockScreen(false);
            } catch {}
        };
    }, [currentAudioUrl, metadata, isPlaying, player]);

    // 5. Subscribe to player status & track completion via native event listener (ZERO React re-renders)
    useEffect(() => {
        if (!player || !currentAudioUrl) return;

        const subscription = player.addListener("playbackStatusUpdate", (status) => {
            if (status.duration > 0) {
                useAudioStore.getState().setPlaybackStatus(
                    status.currentTime,
                    status.duration
                );
            }

            const currentPlayingId = useAudioStore.getState().currentlyPlayingId;
            const repeatActive = useAudioStore.getState().isRepeat;

            if (
                status.didJustFinish &&
                currentPlayingId &&
                lastFinishedTrackIdRef.current !== currentPlayingId
            ) {
                lastFinishedTrackIdRef.current = currentPlayingId;

                if (!repeatActive) {
                    const { playlist, playNext, stopPlayback } = useAudioStore.getState();
                    if (playlist.length > 1) {
                        playNext();
                    } else {
                        try {
                            player.setActiveForLockScreen(false);
                        } catch {}
                        stopPlayback();
                    }
                }
            }
        });

        return () => {
            try {
                subscription.remove();
            } catch {}
        };
    }, [player, currentAudioUrl]);

    // Invisible component
    return null;
};
