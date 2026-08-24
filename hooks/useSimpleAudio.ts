import { AudioSource, useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

// Global coordinator so only one simple sound / post audio plays at a time
let currentActiveAudioId: string | null = null;
const audioListeners = new Set<(activeId: string | null) => void>();

function setActiveAudioId(id: string | null) {
    currentActiveAudioId = id;
    audioListeners.forEach((listener) => listener(id));
}

export interface SimpleAudioOptions {
    id?: string;
    autoPlay?: boolean;
    loop?: boolean;
    updateInterval?: number;
}

export interface SimpleAudioState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    progress: number;
    isBuffering: boolean;
    play: () => void;
    pause: () => void;
    toggle: () => void;
    seekTo: (seconds: number) => void;
    stop: () => void;
}

/**
 * useSimpleAudio - Lightweight hook for simple audio playback (post media tracks,
 * voice clips, preview sounds) without the overhead or global state of the main music player.
 */
export function useSimpleAudio(
    source?: AudioSource | string | number | null,
    options?: SimpleAudioOptions
): SimpleAudioState {
    const audioId = useRef(options?.id || (typeof source === "string" ? source : Math.random().toString())).current;
    const player = useAudioPlayer(source ?? null, {
        updateInterval: options?.updateInterval ?? 250,
    });

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isBuffering, setIsBuffering] = useState(false);

    // Sync loop option
    useEffect(() => {
        if (player && options?.loop !== undefined) {
            player.loop = options.loop;
        }
    }, [player, options?.loop]);

    // Handle global single-playback coordination
    useEffect(() => {
        const handleActiveChange = (activeId: string | null) => {
            if (activeId !== audioId && player) {
                try {
                    player.pause();
                    setIsPlaying(false);
                } catch {}
            }
        };

        audioListeners.add(handleActiveChange);
        return () => {
            audioListeners.delete(handleActiveChange);
        };
    }, [audioId, player]);

    // Listen to native playback status updates
    useEffect(() => {
        if (!player || !source) return;

        const sub = player.addListener("playbackStatusUpdate", (status) => {
            setIsPlaying(status.playing);
            setIsBuffering(status.isBuffering);

            if (status.duration > 0) {
                setDuration(status.duration);
                setCurrentTime(status.currentTime);
            }

            if (status.didJustFinish) {
                setIsPlaying(false);
                setCurrentTime(0);
                if (currentActiveAudioId === audioId) {
                    setActiveAudioId(null);
                }
            }
        });

        return () => {
            try {
                sub.remove();
            } catch {}
        };
    }, [player, source, audioId]);

    const play = useCallback(() => {
        if (!player) return;
        setActiveAudioId(audioId);
        player.play();
        setIsPlaying(true);
    }, [player, audioId]);

    const pause = useCallback(() => {
        if (!player) return;
        player.pause();
        setIsPlaying(false);
        if (currentActiveAudioId === audioId) {
            setActiveAudioId(null);
        }
    }, [player, audioId]);

    const toggle = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, play, pause]);

    const seekTo = useCallback(
        (seconds: number) => {
            if (!player) return;
            player.seekTo(seconds).catch(() => {});
            setCurrentTime(seconds);
        },
        [player]
    );

    const stop = useCallback(() => {
        if (!player) return;
        player.pause();
        player.seekTo(0).catch(() => {});
        setIsPlaying(false);
        setCurrentTime(0);
        if (currentActiveAudioId === audioId) {
            setActiveAudioId(null);
        }
    }, [player, audioId]);

    const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

    return {
        isPlaying,
        currentTime,
        duration,
        progress,
        isBuffering,
        play,
        pause,
        toggle,
        seekTo,
        stop,
    };
}
