import { type MMKV } from "react-native-mmkv";
import { defaultLegacyStorage, getUserStorage, sharedStorage } from "./storage";

/**
 * MMKV Storage Schema Migration Module
 * ----------------------------------------------------------------------------
 * PURPOSE:
 * Decouples one-time legacy data migration logic from the core storage primitive.
 * Pre-multi-user releases stored all user data and shared caches into the default
 * un-namespaced MMKV file ('mmkv.default').
 *
 * When updating to the multi-user architecture:
 * - User data (search history, liked videos, watch history, settings, auth tokens)
 *   is moved into 'user-<userId>.mmkv'.
 * - Shared metadata (weather, image dimensions, dominant colors, app lock)
 *   is moved into 'app-shared.mmkv'.
 *
 * MAINTAINABILITY:
 * This module is completely decoupled from `services/storage.ts`.
 * Once all legacy clients have upgraded or after several major releases,
 * this entire file can be safely deprecated or removed without altering
 * core storage primitives.
 * ----------------------------------------------------------------------------
 */

export const STORAGE_MIGRATION_VERSION = 1;
export const MIGRATION_FLAG_KEY = "legacy_storage_migrated";
export const MIGRATION_VERSION_KEY = "storage_migration_version";

/**
 * Universal prefixes that belong to app-wide shared cache instead of personal user partitions.
 */
const SHARED_KEY_PREFIXES = [
  "dimension:",
  "weather:",
  "luminance:",
  "tv:",
  "movie:",
  "person:",
  "show:",
];

/**
 * Exact keys that belong to device-level shared configurations.
 */
const SHARED_EXACT_KEYS = new Set([
  "app_lock_enabled_persisted",
  "app-lock-storage",
  "language-storage",
]);

/**
 * Ensures user settings & API keys (ImgBB, 0x0, etc.) are safely restored into the user's partition.
 * Checks defaultLegacyStorage (pre-multiuser) and other partitions if the user's partition has missing API keys.
 */
export function restoreLegacySettingsIfNeeded(userId?: string): boolean {
  try {
    const targetUserId = userId ?? sharedStorage.getString("active_user_id");
    if (!targetUserId) return false;

    const userMMKV = getUserStorage(targetUserId);
    const currentUserSettings = userMMKV.getString("settings-storage");

    let hasKeys = false;
    if (currentUserSettings) {
      try {
        const parsed = JSON.parse(currentUserSettings);
        if (
          parsed?.state?.imgbbApiKey ||
          parsed?.state?.x02ApiKey
        ) {
          hasKeys = true;
        }
      } catch {}
    }

    if (hasKeys) return false;

    // 1. Check default legacy MMKV storage (pre-multiuser)
    const legacyVal = defaultLegacyStorage.getString("settings-storage");
    if (legacyVal) {
      userMMKV.set("settings-storage", legacyVal);
      return true;
    }

    // 2. Check if any other user partition holds settings with API keys to inherit
    const accountsRaw = sharedStorage.getString("accounts_registry");
    if (accountsRaw) {
      try {
        const accounts = JSON.parse(accountsRaw);
        if (Array.isArray(accounts)) {
          for (const acc of accounts) {
            if (acc.id === targetUserId) continue;
            const otherMMKV = getUserStorage(acc.id);
            const otherSettings = otherMMKV.getString("settings-storage");
            if (otherSettings) {
              const uParsed = JSON.parse(otherSettings);
              if (
                uParsed?.state?.imgbbApiKey ||
                uParsed?.state?.x02ApiKey
              ) {
                userMMKV.set("settings-storage", otherSettings);
                return true;
              }
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn("[StorageMigration] Failed to restore legacy settings:", err);
  }
  return false;
}

/**
 * Determines whether a key from pre-multiuser MMKV belongs to shared storage
 * or the active user's partition.
 */
export function isSharedStorageKey(key: string): boolean {
  if (SHARED_EXACT_KEYS.has(key)) return true;
  return SHARED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export interface MigrationResult {
  migratedCount: number;
  alreadyMigrated: boolean;
  error?: unknown;
}

/**
 * Checks if migration to multi-user storage schema has already been completed.
 */
export function isLegacyStorageMigrated(): boolean {
  return (
    sharedStorage.getBoolean(MIGRATION_FLAG_KEY) === true ||
    sharedStorage.getNumber(MIGRATION_VERSION_KEY) === STORAGE_MIGRATION_VERSION
  );
}

/**
 * One-time migration function that transfers pre-multi-user data from 'mmkv.default'
 * into the first logged-in user's partition ('user-<userId>') and shared storage ('app-shared').
 *
 * @param userId - The ID of the authenticated user whose partition should receive user-specific keys.
 */
export function migrateLegacyStorageIfNeeded(userId: string): MigrationResult {
  // Always ensure settings & API keys (ImgBB, 0x0) are safely present in user storage
  restoreLegacySettingsIfNeeded(userId);

  if (isLegacyStorageMigrated()) {
    return { migratedCount: 0, alreadyMigrated: true };
  }

  try {
    const legacyKeys = defaultLegacyStorage.getAllKeys();

    if (legacyKeys.length === 0) {
      sharedStorage.set(MIGRATION_FLAG_KEY, true);
      sharedStorage.set(MIGRATION_VERSION_KEY, STORAGE_MIGRATION_VERSION);
      return { migratedCount: 0, alreadyMigrated: false };
    }

    const userMMKV = getUserStorage(userId);
    let migratedCount = 0;

    for (const key of legacyKeys) {
      const target: MMKV = isSharedStorageKey(key) ? sharedStorage : userMMKV;

      const strVal = defaultLegacyStorage.getString(key);
      if (strVal !== undefined) {
        target.set(key, strVal);
        migratedCount++;
        continue;
      }

      const boolVal = defaultLegacyStorage.getBoolean(key);
      if (boolVal !== undefined) {
        target.set(key, boolVal);
        migratedCount++;
        continue;
      }

      const numVal = defaultLegacyStorage.getNumber(key);
      if (numVal !== undefined) {
        target.set(key, numVal);
        migratedCount++;
        continue;
      }

      const bufVal = defaultLegacyStorage.getBuffer(key);
      if (bufVal !== undefined) {
        target.set(key, bufVal);
        migratedCount++;
        continue;
      }
    }

    sharedStorage.set(MIGRATION_FLAG_KEY, true);
    sharedStorage.set(MIGRATION_VERSION_KEY, STORAGE_MIGRATION_VERSION);

    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.log(
        `[StorageMigration] Successfully migrated ${migratedCount} legacy keys to user partition (${userId}) and shared storage.`
      );
    }

    return { migratedCount, alreadyMigrated: false };
  } catch (error) {
    console.warn("[StorageMigration] Failed to migrate legacy storage:", error);
    return { migratedCount: 0, alreadyMigrated: false, error };
  }
}

