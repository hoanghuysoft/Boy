import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsStore {
    showSensitiveContent: boolean;
    setShowSensitiveContent: (show: boolean) => void;
    toggleShowSensitiveContent: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            showSensitiveContent: false,
            setShowSensitiveContent: (show) => set({ showSensitiveContent: show }),
            toggleShowSensitiveContent: () => set((state) => ({ showSensitiveContent: !state.showSensitiveContent })),
        }),
        {
            name: 'settings-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
