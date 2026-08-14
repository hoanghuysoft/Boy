import { create } from 'zustand';

export interface AudioMetadata {
    title?: string;
    artist?: string;
    albumTitle?: string;
    artworkUrl?: string;
    coverUrl?: string;
}

export interface PlaylistItem {
    id: string;
    url: string;
    metadata?: AudioMetadata;
}

interface AudioStore {
    currentlyPlayingId: string | null;
    setCurrentlyPlayingId: (id: string | null) => void;
    currentAudioUrl: string | null;
    setCurrentAudioUrl: (url: string | null) => void;
    metadata: AudioMetadata | null;
    setMetadata: (metadata: AudioMetadata | null) => void;

    // Playback progress (updated by GlobalAudioPlayer)
    currentTime: number;   // seconds
    duration: number;      // seconds
    isPlaying: boolean;
    setPlaybackStatus: (currentTime: number, duration: number, isPlaying?: boolean) => void;

    // Seeking
    seekTarget: number | null;
    seekTo: (seconds: number) => void;
    clearSeekTarget: () => void;

    // Playback Modes
    isShuffle: boolean;
    isRepeat: boolean;
    toggleShuffle: () => void;
    toggleRepeat: () => void;

    // Playlist Queue
    playlist: PlaylistItem[];
    setPlaylist: (list: PlaylistItem[]) => void;
    playNext: () => void;
    playPrev: () => void;

    // Convenience action: play a track
    playTrack: (id: string, url: string, metadata?: AudioMetadata) => void;
    // Convenience action: stop current playback
    stopPlayback: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
    currentlyPlayingId: null,
    setCurrentlyPlayingId: (id) => set({ currentlyPlayingId: id }),
    currentAudioUrl: null,
    setCurrentAudioUrl: (url) => set({ currentAudioUrl: url }),
    metadata: null,
    setMetadata: (metadata) => set({ metadata }),

    currentTime: 0,
    duration: 0,
    isPlaying: false,
    setPlaybackStatus: (currentTime, duration, isPlaying) => set((state) => ({
        currentTime,
        duration,
        isPlaying: isPlaying !== undefined ? isPlaying : state.isPlaying,
    })),

    seekTarget: null,
    seekTo: (seconds) => set({ seekTarget: seconds }),
    clearSeekTarget: () => set({ seekTarget: null }),

    isShuffle: false,
    isRepeat: false,
    toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
    toggleRepeat: () => set((state) => ({ isRepeat: !state.isRepeat })),

    playlist: [],
    setPlaylist: (list) => set({ playlist: list }),

    playNext: () => {
        const state = get();
        const { playlist, currentlyPlayingId, isShuffle } = state;
        if (!playlist.length) return;

        let nextItem: PlaylistItem | undefined;

        if (isShuffle && playlist.length > 1) {
            // Pick a random song different from current
            const remaining = playlist.filter((item) => item.id !== currentlyPlayingId);
            const randomIndex = Math.floor(Math.random() * remaining.length);
            nextItem = remaining[randomIndex];
        } else {
            // Sequential next
            const currentIndex = playlist.findIndex((item) => item.id === currentlyPlayingId);
            const nextIndex = (currentIndex + 1) % playlist.length;
            nextItem = playlist[nextIndex];
        }

        if (nextItem) {
            state.playTrack(nextItem.id, nextItem.url, nextItem.metadata);
        }
    },

    playPrev: () => {
        const state = get();
        const { playlist, currentlyPlayingId, currentTime } = state;
        if (!playlist.length) return;

        // If played more than 3s, restart current song
        if (currentTime > 3) {
            state.seekTo(0);
            return;
        }

        // Otherwise go to previous song
        const currentIndex = playlist.findIndex((item) => item.id === currentlyPlayingId);
        const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        const prevItem = playlist[prevIndex];

        if (prevItem) {
            state.playTrack(prevItem.id, prevItem.url, prevItem.metadata);
        }
    },

    playTrack: (id, url, metadata) => set({
        currentlyPlayingId: id,
        currentAudioUrl: url,
        metadata: metadata || null,
        currentTime: 0,
        duration: 0,
        isPlaying: true,
        seekTarget: null,
    }),

    stopPlayback: () => set({
        currentlyPlayingId: null,
        currentAudioUrl: null,
        metadata: null,
        currentTime: 0,
        duration: 0,
        isPlaying: false,
        seekTarget: null,
    }),
}));
