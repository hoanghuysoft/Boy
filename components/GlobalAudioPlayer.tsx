import {
    AudioMetadata as ExpoAudioMetadata,
    requestNotificationPermissionsAsync,
    setAudioModeAsync,
    useAudioPlayer,
    useAudioPlayerStatus,
} from "expo-audio";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useAudioStore } from "../stores/audio";

/**
 * GlobalAudioPlayer - A component that manages audio playback globally.
 * This component should be mounted at the root level (e.g., in _layout.tsx)
 * to avoid issues with RecyclerListView's view recycling.
 * 
 * It listens to the audio store and plays/pauses audio based on state changes.
 * Supports sustained background playback and lock screen / notification media controls.
 */
export const GlobalAudioPlayer = () => {
    const {
        currentAudioUrl,
        currentlyPlayingId,
        metadata,
        stopPlayback,
        setPlaybackStatus,
        seekTarget,
        clearSeekTarget,
        isRepeat,
        playNext,
        playlist,
    } = useAudioStore();

    // Track the current audio source
    const audioSource = currentAudioUrl ? { uri: currentAudioUrl } : null;
    const player = useAudioPlayer(audioSource, {
        updateInterval: 500,
    });
    const status = useAudioPlayerStatus(player);

    // Track previous URL to detect changes
    const prevUrlRef = useRef<string | null>(null);

    // Handle interactive seek requests from sliders/scrubbers
    useEffect(() => {
        if (player && seekTarget !== null && currentAudioUrl) {
            player.seekTo(seekTarget).catch((err) => {
                console.warn('[GlobalAudioPlayer] Failed to seekTo:', err);
            });
            clearSeekTarget();
        }
    }, [seekTarget, player, currentAudioUrl, clearSeekTarget]);

    // 1. Configure audio session once for sustained background playback
    useEffect(() => {
        setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: 'doNotMix',
        }).catch((err) => {
            console.warn('[GlobalAudioPlayer] Failed to set audio mode:', err);
        });

        // Request notification permission on Android (required for Android 13+ media notifications)
        if (Platform.OS === 'android') {
            requestNotificationPermissionsAsync().catch(() => {});
        }
    }, []);

    // 2. Handle audio URL & metadata changes -> Play with lock screen controls
    useEffect(() => {
        if (!player) return;

        if (currentAudioUrl) {
            prevUrlRef.current = currentAudioUrl;

            const lockScreenMetadata: ExpoAudioMetadata = {
                title: metadata?.title || 'Audio',
                artist: metadata?.artist || '',
                albumTitle: metadata?.albumTitle,
                artworkUrl: metadata?.artworkUrl || metadata?.coverUrl,
            };

            try {
                // Enable lock screen controls with metadata (required on Android for sustained background playback)
                player.setActiveForLockScreen(true, lockScreenMetadata, {
                    showSeekForward: true,
                    showSeekBackward: true,
                });
            } catch (err) {
                console.warn('[GlobalAudioPlayer] Failed to setActiveForLockScreen:', err);
            }

            player.play();
        } else {
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
    }, [currentAudioUrl, metadata, player]);

    // 3. Sync player state to store and handle natural completion
    useEffect(() => {
        if (!player || !currentAudioUrl) return;

        // Update store with current playback position & playing status
        if (status.duration > 0) {
            setPlaybackStatus(status.currentTime, status.duration, status.playing);
        }

        // Detect track finished naturally
        const isFinished =
            status.didJustFinish ||
            (!status.playing &&
                status.duration > 0 &&
                status.currentTime >= status.duration - 0.2);

        if (isFinished && currentlyPlayingId) {
            if (isRepeat) {
                // Replay the current track seamlessly
                player.seekTo(0).catch(() => {});
                player.play();
            } else if (playlist.length > 1) {
                // Auto-advance to next track (respects shuffle/order)
                playNext();
            } else {
                try {
                    player.setActiveForLockScreen(false);
                } catch {}
                stopPlayback();
            }
        }
    }, [
        status.currentTime,
        status.duration,
        status.playing,
        status.didJustFinish,
        currentAudioUrl,
        currentlyPlayingId,
        player,
        isRepeat,
        playNext,
        playlist,
        stopPlayback,
        setPlaybackStatus,
    ]);

    // Invisible component
    return null;
};
