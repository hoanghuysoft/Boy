import { create } from 'zustand';

interface AudioStore {
    currentlyPlayingId: string | null;
    setCurrentlyPlayingId: (id: string | null) => void;
    currentAudioUrl: string | null;
    setCurrentAudioUrl: (url: string | null) => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
    currentlyPlayingId: null,
    setCurrentlyPlayingId: (id) => set({ currentlyPlayingId: id }),
    currentAudioUrl: null,
    setCurrentAudioUrl: (url) => set({ currentAudioUrl: url }),
}));
