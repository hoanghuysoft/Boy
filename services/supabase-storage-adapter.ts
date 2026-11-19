/**
 * MMKV storage adapter for Supabase auth.
 *
 * Supabase's `auth.storage` option expects an object that satisfies
 * `SupportedStorage` — an async key/value interface identical to the
 * AsyncStorage API.  We wrap the synchronous MMKV calls in Promises so
 * the interface is satisfied while keeping I/O on the native thread
 * (no JS<>bridge round-trips like AsyncStorage).
 *
 * Keys written by Supabase follow the pattern:
 *   sb-<project-ref>-auth-token
 *
 * Stored in `sharedStorage` ("app-shared") rather than the dynamic
 * `userStorage` proxy because Supabase saves/loads the active session before
 * `registerActiveSession()` switches `activeStorageInstance` to `user-<userId>`.
 * Per-account backup tokens for account switching are stored in `accounts_registry`.
 */

import { defaultLegacyStorage, sharedStorage, storage } from "./storage";

export const mmkvSupabaseAdapter = {
    getItem: (key: string): Promise<string | null> => {
        const sharedVal = sharedStorage.getString(key);
        if (sharedVal !== undefined) {
            return Promise.resolve(sharedVal);
        }

        // One-time migration fallback for sessions previously stored in userStorage / defaultLegacyStorage
        const activeVal = storage.getString(key);
        if (activeVal !== undefined) {
            sharedStorage.set(key, activeVal);
            storage.remove(key);
            return Promise.resolve(activeVal);
        }

        return Promise.resolve(null);
    },
    setItem: (key: string, value: string): Promise<void> => {
        sharedStorage.set(key, value);
        return Promise.resolve();
    },
    removeItem: (key: string): Promise<void> => {
        sharedStorage.remove(key);
        storage.remove(key);
        defaultLegacyStorage.remove(key);
        return Promise.resolve();
    },
};
