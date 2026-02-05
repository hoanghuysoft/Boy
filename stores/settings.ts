import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system' | 'adaptive';

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
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

