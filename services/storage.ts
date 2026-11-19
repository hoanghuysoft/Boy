/**
 * Centralized MMKV Storage — Multi-User Isolated & Shared Cache Architecture.
 *
 * 1. 🌐 Shared Storage (`id: "app-shared"` & `id: "language-storage"`)
 *    Persistent app-wide and device-level cache. Survives across all accounts and logouts.
 *    - Accounts Registry (`accounts_registry`) & active user pointer (`active_user_id`)
 *    - Active Supabase auth session (`sb-*-auth-token` in `sharedStorage`)
 *    - Language preferences (`language-storage`)
 *    - Device app-lock configuration (`app-lock-storage`)
 *    - Public media metadata: weather, image dimensions, dominant colors, carousel colors
 *
 * 2. 👤 User-Scoped Storage (`id: "user-${userId}"`)
 *    Dedicated isolated binary MMKV partition file per logged-in account.
 *    - React Query offline cache (`REACT_QUERY_OFFLINE_CACHE`)
 *    - Personal Zustand stores: search history, watch history, liked videos, movie tracker
 *    - User-specific settings & API keys (`settings-storage`)
 *    - Video resume positions (`video-resume:*`)
 *    - Onboarding profile cache (`onboarding_has_profile`)
 *    ⚠️ Wiped ONLY when that specific user account is removed.
 *
 * 3. 🔀 Dynamic Proxy (`userStorage` / `storage`)
 *    Routes calls dynamically to whichever user is currently active (`activeStorageInstance`).
 *    Zustand stores and hooks write transparently to the active account.
 *
 * Storage Partition Map:
 *  Scope       | Consumer / Data            | Storage Target
 *  ------------|----------------------------|--------------------------
 *  Shared      | accounts registry          | sharedStorage ("app-shared")
 *  Shared      | supabase auth session      | sharedStorage ("app-shared")
 *  Shared      | language preference        | languageStorage ("language-storage")
 *  Shared      | device app lock            | sharedStorage ("app-shared")
 *  Shared      | image dimensions cache     | imageDimensionStorage ("app-shared")
 *  Shared      | weather cache              | weatherStorage ("app-shared")
 *  Shared      | media dominant colors      | tvDetail / movieDetail / personDetail ("app-shared")
 *  Shared      | carousel luminance cache   | carouselColorStorage ("app-shared")
 *  User-Scoped | react-query offline cache  | userStorage ("user-<userId>")
 *  User-Scoped | user settings & API keys   | settingsStorage ("user-<userId>")
 *  User-Scoped | search history (zustand)   | searchHistoryStorage ("user-<userId>")
 *  User-Scoped | watch history (zustand)    | userStorage ("user-<userId>")
 *  User-Scoped | liked videos (zustand)     | userStorage ("user-<userId>")
 *  User-Scoped | movie tracker / watchlist  | movieTrackerStorage ("user-<userId>")
 *  User-Scoped | video resume positions     | videoResumeStorage ("user-<userId>")
 *  User-Scoped | onboarding profile flag    | onboardingStorage ("user-<userId>")
 */

import { createMMKV, type MMKV } from "react-native-mmkv";

// ─── The app-wide shared storage instance (device & universal caches) ────────
export const sharedStorage = createMMKV({ id: "app-shared" });

// ─── Language preference — persists across all accounts/logout ────────────────
export const languageStorage = createMMKV({ id: "language-storage" });

// ─── Shared Cache Aliases (never wiped on account switch/logout) ──────────────
export const weatherStorage = sharedStorage;
export const imageDimensionStorage = sharedStorage;
export const carouselColorStorage = sharedStorage;
export const tvDetailStorage = sharedStorage;
export const movieDetailStorage = sharedStorage;
export const personDetailStorage = sharedStorage;

// ─── User Storage Pool ────────────────────────────────────────────────────────
const userStorageInstances = new Map<string, MMKV>();

/**
 * Returns or creates the isolated MMKV storage instance for a specific user.
 * Stored in a separate binary file on disk (e.g. user-<userId>.mmkv).
 */
export function getUserStorage(userId: string): MMKV {
    let instance = userStorageInstances.get(userId);
    if (!instance) {
        instance = createMMKV({ id: `user-${userId}` });
        userStorageInstances.set(userId, instance);
    }
    return instance;
}

// Fallback storage for guest / startup before an active account is identified
export const defaultLegacyStorage = createMMKV(); // 'mmkv.default' - preserves pre-migration session
const guestStorage = createMMKV({ id: "user-guest" });

let activeUserId: string | null = sharedStorage.getString("active_user_id") ?? null;
const hasMigratedLegacy = sharedStorage.getBoolean("legacy_storage_migrated") === true;
let activeStorageInstance: MMKV = activeUserId
    ? getUserStorage(activeUserId)
    : hasMigratedLegacy
        ? guestStorage
        : defaultLegacyStorage;

interface ProxyValueListenerEntry {
    callback: (key: string) => void;
    subscription: { remove: () => void };
}

const proxyValueListeners = new Set<ProxyValueListenerEntry>();

function rebindProxyListeners(previousInstance: MMKV, nextInstance: MMKV): void {
    if (previousInstance === nextInstance || proxyValueListeners.size === 0) {
        return;
    }

    const affectedKeys = new Set<string>([
        ...previousInstance.getAllKeys(),
        ...nextInstance.getAllKeys(),
    ]);

    for (const entry of proxyValueListeners) {
        entry.subscription.remove();
        entry.subscription = nextInstance.addOnValueChangedListener(entry.callback);
        for (const key of affectedKeys) {
            try {
                entry.callback(key);
            } catch {
                // Ignore listener callback errors during instance switch
            }
        }
    }
}

export function getActiveUserId(): string | null {
    return activeUserId;
}

export function setActiveUserId(userId: string | null): void {
    const previousInstance = activeStorageInstance;
    activeUserId = userId;
    if (userId) {
        sharedStorage.set("active_user_id", userId);
        activeStorageInstance = getUserStorage(userId);
    } else {
        sharedStorage.remove("active_user_id");
        activeStorageInstance = guestStorage;
    }
    rebindProxyListeners(previousInstance, activeStorageInstance);
}

// ─── Dynamic User-Scoped Storage Proxy ─────────────────────────────────────────
/**
 * Dynamic MMKV proxy that always delegates to whichever user is currently active.
 * Implements the full MMKV interface so it works seamlessly with react-native-mmkv
 * hooks (useMMKVBoolean, useMMKVString, etc.) and Zustand stores.
 */
export const userStorage: MMKV = new Proxy({} as MMKV, {
    get(_target, prop) {
        if (prop === "addOnValueChangedListener") {
            return (callback: (key: string) => void) => {
                const entry: ProxyValueListenerEntry = {
                    callback,
                    subscription: activeStorageInstance.addOnValueChangedListener(callback),
                };
                proxyValueListeners.add(entry);
                return {
                    remove: () => {
                        entry.subscription.remove();
                        proxyValueListeners.delete(entry);
                    },
                };
            };
        }

        const val = (activeStorageInstance as any)[prop];
        if (typeof val === "function") {
            return val.bind(activeStorageInstance);
        }
        return val;
    },
    set(_target, prop, value) {
        (activeStorageInstance as any)[prop] = value;
        return true;
    },
});

// ─── User-Scoped Aliases ──────────────────────────────────────────────────────
export const storage = userStorage; // backwards-compatible alias
export const onboardingStorage = userStorage;
export const localFbStorage = userStorage;
export const searchHistoryStorage = userStorage;
export const movieTrackerStorage = userStorage;
export const videoResumeStorage = userStorage;
export const settingsStorage = userStorage;

