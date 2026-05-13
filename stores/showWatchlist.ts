import { showWatchlistStorage as mmkv } from '../services/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WatchlistShow {
    /** Key used to navigate to ShowDetailScreen */
    video_url: string;
    title: string;
    /** Populated from VideoDetail.poster_url */
    thumb_url: string;
    views: string;
    duration: string;
    /** Unix ms timestamp — used to keep newest-first order */
    added_at: number;
}

interface ShowWatchlistState {
    watchlist: WatchlistShow[];
    add: (show: WatchlistShow) => void;
    remove: (video_url: string) => void;
    isInWatchlist: (video_url: string) => boolean;
    clear: () => void;
}

// ─── MMKV Storage ─────────────────────────────────────────────────────────────



const mmkvZustandStorage = createJSONStorage(() => ({
    getItem: (name: string): string | null => mmkv.getString(name) ?? null,
    setItem: (name: string, value: string): void => mmkv.set(name, value),
    removeItem: (name: string): boolean => mmkv.remove(name),
}));

// ─── Store ────────────────────────────────────────────────────────────────────

export const useShowWatchlistStore = create<ShowWatchlistState>()(
    persist(
        (set, get) => ({
            watchlist: [],

            add: (show) =>
                set((state) => ({
                    // Deduplicate: remove existing entry then prepend the fresh one
                    watchlist: [
                        show,
                        ...state.watchlist.filter((s) => s.video_url !== show.video_url),
                    ],
                })),

            remove: (video_url) =>
                set((state) => ({
                    watchlist: state.watchlist.filter((s) => s.video_url !== video_url),
                })),

            isInWatchlist: (video_url) =>
                get().watchlist.some((s) => s.video_url === video_url),

            clear: () => set({ watchlist: [] }),
        }),
        {
            name: 'show-watchlist',
            storage: mmkvZustandStorage,
        }
    )
);
