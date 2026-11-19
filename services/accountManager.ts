import type { Session } from "@supabase/supabase-js";
import { queryClient } from "./client";
import { supabase } from "./login";
import { defaultLegacyStorage, getActiveUserId, getUserStorage, setActiveUserId, sharedStorage, userStorage } from "./storage";
import { migrateLegacyStorageIfNeeded } from "./storageMigration";

export interface StoredAccount {
  id: string; // Supabase user ID (UUID)
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  username?: string;
  lastActiveAt: number;
  sessionTokens?: {
    access_token: string;
    refresh_token: string;
  };
}

const ACCOUNTS_REGISTRY_KEY = "accounts_registry";

/**
 * Returns all saved accounts registered on this device.
 */
export function getSavedAccounts(): StoredAccount[] {
  const raw = sharedStorage.getString(ACCOUNTS_REGISTRY_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? (list as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates an account in the shared registry.
 */
export function saveAccount(account: StoredAccount): void {
  const accounts = getSavedAccounts().filter((a) => a.id !== account.id);
  accounts.unshift(account);
  sharedStorage.set(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
}

/**
 * Updates session tokens for a specific account.
 */
export function updateAccountSession(
  userId: string,
  tokens: { access_token: string; refresh_token: string }
): void {
  const accounts = getSavedAccounts();
  const acc = accounts.find((a) => a.id === userId);
  if (acc) {
    acc.sessionTokens = tokens;
    acc.lastActiveAt = Date.now();
    sharedStorage.set(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
  }
}

/**
 * Updates Welove profile details (name, username, avatar) for an account.
 */
export function updateAccountProfile(
  userId: string,
  profile: { name?: string; username?: string | null; avatarUrl?: string | null }
): void {
  const accounts = getSavedAccounts();
  const acc = accounts.find((a) => a.id === userId);
  if (acc) {
    if (profile.name) acc.fullName = profile.name;
    if (profile.username !== undefined) acc.username = profile.username ?? undefined;
    if (profile.avatarUrl !== undefined) acc.avatarUrl = profile.avatarUrl ?? undefined;
    sharedStorage.set(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
  }
}

/**
 * Registers an active session into the account manager.
 */
export function registerActiveSession(
  session: Session,
  profile?: { name?: string; username?: string; avatar?: string }
): void {
  if (!session?.user) return;
  const user = session.user;
  const existing = getSavedAccounts().find((a) => a.id === user.id);

  setActiveUserId(user.id);

  // One-time migration: moves legacy pre-multi-user data from mmkv.default
  // into this user's isolated partition and shared storage
  migrateLegacyStorageIfNeeded(user.id);

  const account: StoredAccount = {
    id: user.id,
    email: user.email ?? existing?.email,
    fullName:
      profile?.name ??
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      existing?.fullName ??
      user.email ??
      "User",
    avatarUrl:
      profile?.avatar ??
      user.user_metadata?.avatar_url ??
      user.user_metadata?.picture ??
      existing?.avatarUrl,
    username: profile?.username ?? existing?.username,
    lastActiveAt: Date.now(),
    sessionTokens: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    },
  };

  saveAccount(account);
}

/**
 * Rehydrates user-scoped Zustand stores from the newly active user's MMKV partition.
 *
 * CRITICAL: We NEVER call store.clear() or store.reset() before rehydrate()!
 * In Zustand persist middleware, calling clear/reset before rehydrate triggers an
 * immediate synchronous write to storage, which would wipe the user's partition!
 * Each user's partition file on disk is kept completely intact across account switches.
 */
export async function rehydrateUserStores(): Promise<void> {
  try {
    const [
      { useSearchHistoryStore },
      { useMovieTrackerStore },
      { useSettingsStore },
      { useWatchHistoryStore },
      { useLikedVideosStore },
    ] = await Promise.all([
      import("@/stores/searchHistory"),
      import("@/stores/movieTracker"),
      import("@/stores/settings"),
      import("@/stores/watchHistory"),
      import("@/stores/likedVideos"),
    ]);

    const activeId = getActiveUserId();
    if (activeId) {
      const activeMMKV = getUserStorage(activeId);

      // 1. If active user does not have settings-storage yet or has missing API keys,
      // recover them from defaultLegacyStorage so API keys and settings are never lost.
      const currentSettingsRaw = activeMMKV.getString("settings-storage");
      let hasKeys = false;
      if (currentSettingsRaw) {
        try {
          const parsed = JSON.parse(currentSettingsRaw);
          hasKeys = !!(parsed?.state?.imgbbApiKey || parsed?.state?.x02ApiKey);
        } catch {}
      }

      if (!hasKeys) {
        const legacyVal = defaultLegacyStorage.getString("settings-storage");
        if (legacyVal) {
          activeMMKV.set("settings-storage", legacyVal);
        }
      }
    }

    // 2. Rehydrate stores from the active user's MMKV storage
    await Promise.all([
      useSearchHistoryStore.persist.rehydrate(),
      useMovieTrackerStore.persist.rehydrate(),
      useSettingsStore.persist.rehydrate(),
      useWatchHistoryStore.persist.rehydrate(),
      useLikedVideosStore.persist.rehydrate(),
    ]);

    // 3. If the newly active user has NO persisted data for a store (e.g. brand new account),
    // reset that store in memory so the previous user's data isn't displayed.
    if (!userStorage.contains("search-history")) {
      useSearchHistoryStore.getState().clearHistory();
    }
    if (!userStorage.contains("movie-tracker")) {
      useMovieTrackerStore.getState().reset();
    }
    if (!userStorage.contains("watch-history")) {
      useWatchHistoryStore.getState().clear();
    }
    if (!userStorage.contains("liked-videos")) {
      useLikedVideosStore.getState().clear();
    }
  } catch (err) {
    console.warn("Failed to rehydrate user stores:", err);
  }
}

/**
 * Switches the active account to another saved account.
 */
export async function switchAccount(targetUserId: string): Promise<void> {
  const currentActive = getActiveUserId();
  if (currentActive === targetUserId) {
    return;
  }

  const accounts = getSavedAccounts();
  const target = accounts.find((a) => a.id === targetUserId);
  if (!target || !target.sessionTokens) {
    throw new Error(`Account ${targetUserId} not found or missing session tokens.`);
  }

  // 1. Cancel in-flight network queries & clear in-memory cache
  try {
    await queryClient.cancelQueries();
    queryClient.clear();
  } catch (e) {
    console.warn("Error clearing queryClient:", e);
  }

  // 2. Switch active MMKV pointer to target user
  setActiveUserId(targetUserId);

  // 3. Swap Supabase session with target user's tokens
  const { data, error } = await supabase.auth.setSession({
    access_token: target.sessionTokens.access_token,
    refresh_token: target.sessionTokens.refresh_token,
  });

  if (error) {
    console.error("Failed to restore Supabase session for target account:", error);
    throw error;
  }

  if (data.session) {
    updateAccountSession(targetUserId, {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  }

  // 4. Rehydrate user-scoped Zustand stores
  await rehydrateUserStores();

  // 5. Update last active timestamp
  target.lastActiveAt = Date.now();
  saveAccount(target);
}

/**
 * Removes a specific account from this device.
 * Wipes only that user's MMKV partition without touching shared data or other users.
 */
export async function removeAccount(
  userId: string
): Promise<{ remainingAccounts: StoredAccount[]; switchedTo: string | null }> {
  // 1. Clear isolated MMKV partition on disk
  try {
    const userMMKV = getUserStorage(userId);
    userMMKV.clearAll();
  } catch (err) {
    console.warn("Failed to clear user MMKV partition:", err);
  }

  // 2. Remove from shared registry
  const remaining = getSavedAccounts().filter((a) => a.id !== userId);
  sharedStorage.set(ACCOUNTS_REGISTRY_KEY, JSON.stringify(remaining));

  const currentActive = getActiveUserId();

  // 3. If removing the active user, switch or sign out
  if (currentActive === userId) {
    if (remaining.length > 0) {
      const nextAccount = remaining[0];
      await switchAccount(nextAccount.id);
      return { remainingAccounts: remaining, switchedTo: nextAccount.id };
    } else {
      // No accounts left -> perform clean app sign out
      setActiveUserId(null);
      await supabase.auth.signOut({ scope: "local" }).catch(() => {});
      try {
        const RnGoogleSignin = (await import("@novastera-oss/rn-google-signin")).default;
        await RnGoogleSignin.signOut().catch(() => {});
      } catch {}
      await rehydrateUserStores();
      queryClient.clear();
      return { remainingAccounts: [], switchedTo: null };
    }
  }

  return { remainingAccounts: remaining, switchedTo: currentActive };
}

/**
 * Completely signs out of all accounts on this device.
 * Wipes all user-scoped MMKV instances while preserving shared cache (language, device settings, etc.).
 */
export async function signOutAllAccounts(): Promise<void> {
  const accounts = getSavedAccounts();
  for (const acc of accounts) {
    try {
      const userMMKV = getUserStorage(acc.id);
      userMMKV.clearAll();
    } catch {}
  }

  sharedStorage.remove(ACCOUNTS_REGISTRY_KEY);
  setActiveUserId(null);

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {}

  try {
    const RnGoogleSignin = (await import("@novastera-oss/rn-google-signin")).default;
    await RnGoogleSignin.signOut().catch(() => {});
  } catch {}

  await queryClient.cancelQueries().catch(() => {});
  queryClient.clear();
  await rehydrateUserStores();
}
