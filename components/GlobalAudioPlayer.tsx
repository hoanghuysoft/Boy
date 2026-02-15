import { useAudioPlayer } from "expo-audio";
import { useEffect, useRef } from "react";
import { useAudioStore } from "../stores/audio";

/**
 * GlobalAudioPlayer - A component that manages audio playback globally.
 * This component should be mounted at the root level (e.g., in _layout.tsx)
 * to avoid issues with RecyclerListView's view recycling.
 * 
 * It listens to the audio store and plays/pauses audio based on state changes.
 * All audio sources across the app (posts, profile header, music sheet)
 * go through this single player.
 */
export const GlobalAudioPlayer = () => {
    const { currentAudioUrl, currentlyPlayingId, stopPlayback } = useAudioStore();

    // Track the current audio source
    const audioSource = currentAudioUrl ? { uri: currentAudioUrl } : null;
    const player = useAudioPlayer(audioSource);

    // Track previous URL to detect changes
    const prevUrlRef = useRef<string | null>(null);

    // Handle audio URL changes
    useEffect(() => {
        if (!player) return;

        if (currentAudioUrl && currentAudioUrl !== prevUrlRef.current) {
            // New audio URL - start playing
            prevUrlRef.current = currentAudioUrl;
            player.play();
        } else if (!currentAudioUrl && prevUrlRef.current) {
            // Audio was stopped
            prevUrlRef.current = null;
            player.pause();
        }
    }, [currentAudioUrl, player]);

    // Handle player state changes (e.g., audio finished)
    useEffect(() => {
        if (!player) return;

        const checkPlayerState = setInterval(() => {
            // If the audio finished naturally, reset the store
            if (prevUrlRef.current && !player.playing && currentlyPlayingId) {
                // Check if audio has reached the end
                if (player.duration > 0 && player.currentTime >= player.duration - 0.1) {
                    stopPlayback();
                    prevUrlRef.current = null;
                }
            }
        }, 500);

        return () => clearInterval(checkPlayerState);
    }, [player, currentlyPlayingId, stopPlayback]);

    // This component doesn't render anything
    return null;
};
