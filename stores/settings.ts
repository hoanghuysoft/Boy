import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system' | 'adaptive';

// Cache size options in bytes
export const CACHE_SIZE_OPTIONS = [
    { label: '200 MB', value: 200 * 1024 * 1024 },
    { label: '500 MB', value: 500 * 1024 * 1024 },
    { label: '1 GB', value: 1024 * 1024 * 1024 },
    { label: '2 GB', value: 2 * 1024 * 1024 * 1024 },
] as const;

interface SettingsStore {
    showSensitiveContent: boolean;
    setShowSensitiveContent: (show: boolean) => void;
    toggleShowSensitiveContent: () => void;
    // Carousel settings
    showCarousel: boolean;
    setShowCarousel: (show: boolean) => void;
    toggleCarousel: () => void;
    // Theme settings
    themePreference: ThemePreference;
    setThemePreference: (preference: ThemePreference) => void;
    // Video autoplay settings
    autoplayVideos: boolean;
    toggleAutoplayVideos: () => void;
    // Video cache settings
    videoCacheSizeLimit: number; // in bytes
    setVideoCacheSizeLimit: (sizeBytes: number) => void;
    // Profile Design
    profileDesign: 'v3' | 'classic';
    setProfileDesign: (design: 'v3' | 'classic') => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            showSensitiveContent: false,
            setShowSensitiveContent: (show) => set({ showSensitiveContent: show }),
            toggleShowSensitiveContent: () => set((state) => ({ showSensitiveContent: !state.showSensitiveContent })),
            // Carousel settings
            showCarousel: true, // Default to showing carousel
            setShowCarousel: (show) => set({ showCarousel: show }),
            toggleCarousel: () => set((state) => ({ showCarousel: !state.showCarousel })),
            // Theme settings
            themePreference: 'system', // Default to system
            setThemePreference: (preference) => set({ themePreference: preference }),
            // Video autoplay
            autoplayVideos: true, // Default to on
            toggleAutoplayVideos: () => set((state) => ({ autoplayVideos: !state.autoplayVideos })),
            // Video cache
            videoCacheSizeLimit: 500 * 1024 * 1024, // Default 500 MB
            setVideoCacheSizeLimit: (sizeBytes) => set({ videoCacheSizeLimit: sizeBytes }),
            // Profile Design
            profileDesign: 'v3',
            setProfileDesign: (design) => set({ profileDesign: design }),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

