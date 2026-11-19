import { beforeEach, describe, expect, mock, test } from "bun:test";

// ============================================================================
// 1. Mock MMKV Multi-Tenant Implementation
// ============================================================================

const storageInstances = new Map<string, MockMMKV>();

class MockMMKV {
  id: string;
  private map = new Map<string, any>();
  private listeners: ((key: string) => void)[] = [];

  constructor(id: string) {
    this.id = id;
  }

  getString(key: string): string | undefined {
    const val = this.map.get(key);
    return typeof val === "string" ? val : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const val = this.map.get(key);
    return typeof val === "boolean" ? val : undefined;
  }

  getNumber(key: string): number | undefined {
    const val = this.map.get(key);
    return typeof val === "number" ? val : undefined;
  }

  getBuffer(key: string): Uint8Array | undefined {
    return this.map.get(key);
  }

  set(key: string, value: any): void {
    this.map.set(key, value);
    this.listeners.forEach((l) => l(key));
  }

  remove(key: string): boolean {
    const existed = this.map.delete(key);
    if (existed) this.listeners.forEach((l) => l(key));
    return existed;
  }

  clearAll(): void {
    this.map.clear();
  }

  contains(key: string): boolean {
    return this.map.has(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.map.keys());
  }

  addOnValueChangedListener(listener: (key: string) => void) {
    this.listeners.push(listener);
    return {
      remove: () => {
        this.listeners = this.listeners.filter((l) => l !== listener);
      },
    };
  }
}

function createMockMMKV(options?: { id?: string }): any {
  const id = options?.id || "mmkv.default";
  let instance = storageInstances.get(id);
  if (!instance) {
    instance = new MockMMKV(id);
    storageInstances.set(id, instance);
  }
  return instance;
}

mock.module("react-native-mmkv", () => ({
  createMMKV: createMockMMKV,
  useMMKVBoolean: () => [false, () => {}],
  useMMKVString: () => ["", () => {}],
  useMMKVNumber: () => [0, () => {}],
}));

mock.module("react-native", () => ({
  Platform: { OS: "ios", select: (obj: any) => obj.ios },
  StyleSheet: { create: (s: any) => s, absoluteFill: {} },
  AppState: { addEventListener: () => ({ remove: () => {} }) },
  NativeModules: { RNCNetInfo: {} },
}));

mock.module("@react-native-community/netinfo", () => ({
  default: {
    addEventListener: () => () => {},
    fetch: () => Promise.resolve({ isConnected: true }),
  },
  addEventListener: () => () => {},
}));

mock.module("react-native-nitro-modules", () => ({
  NitroModules: {},
}));

mock.module("react-native-nitro-fetch", () => ({
  fetch: mock(() => Promise.resolve({ ok: true, text: () => Promise.resolve("{}") })),
}));

mock.module("@novastera-oss/rn-google-signin", () => ({
  default: {
    hasPlayServices: mock(() => Promise.resolve(true)),
    signIn: mock(() => Promise.resolve({ idToken: "mock-google-id-token" })),
    signOut: mock(() => Promise.resolve()),
    configure: mock(() => {}),
  },
}));

let currentMockSession: any = null;
const mockSetSession = mock(async (params: any) => {
  currentMockSession = {
    access_token: params.access_token,
    refresh_token: params.refresh_token,
    user: { id: "switched-user", email: "switched@example.com" },
  };
  return { data: { session: currentMockSession }, error: null };
});

const mockSupabaseSignOut = mock(async () => {
  currentMockSession = null;
  return { error: null };
});

mock.module("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: currentMockSession }, error: null }),
      setSession: mockSetSession,
      signOut: mockSupabaseSignOut,
      signInWithIdToken: async () => ({
        data: { session: currentMockSession, user: currentMockSession?.user },
        error: null,
      }),
    },
  }),
}));

const mockCancelQueries = mock(async () => {});
const mockClear = mock(() => {});

mock.module("@tanstack/react-query", () => ({
  QueryClient: class {
    cancelQueries = mockCancelQueries;
    clear = mockClear;
    invalidateQueries = mock(() => {});
  },
  onlineManager: { setEventListener: () => {} },
  focusManager: { setFocused: () => {} },
}));

// ============================================================================
// 2. Multi-User Workflow Tests
// ============================================================================

describe("Multi-User MMKV Storage & Account Workflow", () => {
  beforeEach(async () => {
    storageInstances.clear();
    const { sharedStorage } = await import("../services/storage");
    sharedStorage.clearAll();
    currentMockSession = null;
    mockCancelQueries.mockClear();
    mockClear.mockClear();
    mockSetSession.mockClear();
    mockSupabaseSignOut.mockClear();
  });

  test("Step 1: First user login registers session and isolates user storage", async () => {
    const { sharedStorage, getUserStorage, userStorage, getActiveUserId } = await import(
      "../services/storage"
    );
    const { registerActiveSession, getSavedAccounts } = await import(
      "../services/accountManager"
    );

    // 1. Simulate Alice logging in
    const aliceSession = {
      access_token: "alice-access-token",
      refresh_token: "alice-refresh-token",
      user: {
        id: "user_alice",
        email: "alice@example.com",
        user_metadata: { full_name: "Alice Wonderland", avatar_url: "https://example.com/alice.jpg" },
      },
    };

    registerActiveSession(aliceSession as any);

    // Verify Alice is active
    expect(getActiveUserId()).toBe("user_alice");

    // Write Alice-specific user cache
    userStorage.set("search-history", JSON.stringify(["React Native", "Expo"]));
    userStorage.set("video-resume:video_123", "45.5");

    // Write universal shared cache
    sharedStorage.set("dimension:v1:image_xyz", JSON.stringify({ width: 1080, height: 1920 }));
    sharedStorage.set("weather:cached", JSON.stringify({ temp: 28 }));

    // Verify Alice's isolated partition file on disk
    const aliceMMKV = getUserStorage("user_alice");
    expect(aliceMMKV.getString("search-history")).toBe(JSON.stringify(["React Native", "Expo"]));
    expect(aliceMMKV.getString("video-resume:video_123")).toBe("45.5");

    // Verify Shared cache
    expect(sharedStorage.getString("dimension:v1:image_xyz")).toBe(
      JSON.stringify({ width: 1080, height: 1920 })
    );

    // Verify registry contains Alice
    const accounts = getSavedAccounts();
    expect(accounts.length).toBe(1);
    expect(accounts[0].id).toBe("user_alice");
    expect(accounts[0].fullName).toBe("Alice Wonderland");
  });

  test("Step 2: Second user login achieves complete data isolation without data bleeding", async () => {
    const { sharedStorage, getUserStorage, userStorage, getActiveUserId } = await import(
      "../services/storage"
    );
    const { registerActiveSession, getSavedAccounts } = await import(
      "../services/accountManager"
    );

    // Alice is already registered from Step 1
    const aliceSession = {
      access_token: "alice-token",
      refresh_token: "alice-refresh",
      user: { id: "user_alice", email: "alice@example.com", user_metadata: { full_name: "Alice" } },
    };
    registerActiveSession(aliceSession as any);
    userStorage.set("search-history", JSON.stringify(["Alice Query 1"]));
    userStorage.set("liked-videos", JSON.stringify([{ title: "Alice Video 1" }]));

    // Alice sets her own settings & API keys in her user storage
    userStorage.set(
      "settings-storage",
      JSON.stringify({ state: { imgbbApiKey: "alice-imgbb-key", showSensitiveContent: true } })
    );

    // 2. Now Bob logs in as second user ("+ Add Another Account")
    const bobSession = {
      access_token: "bob-token",
      refresh_token: "bob-refresh",
      user: { id: "user_bob", email: "bob@example.com", user_metadata: { full_name: "Bob Builder" } },
    };
    registerActiveSession(bobSession as any);

    // Active user should now be Bob
    expect(getActiveUserId()).toBe("user_bob");

    // Bob writes his own search history and liked videos
    userStorage.set("search-history", JSON.stringify(["Bob Query 1", "Bob Query 2"]));
    userStorage.set("liked-videos", JSON.stringify([{ title: "Bob Video 1" }]));
    userStorage.set(
      "settings-storage",
      JSON.stringify({ state: { imgbbApiKey: "bob-imgbb-key", showSensitiveContent: false } })
    );

    // ─── STRICT ISOLATION ASSERTIONS ───
    const aliceMMKV = getUserStorage("user_alice");
    const bobMMKV = getUserStorage("user_bob");

    // Alice's personal data & settings must NOT be wiped or polluted by Bob
    expect(aliceMMKV.getString("search-history")).toBe(JSON.stringify(["Alice Query 1"]));
    expect(aliceMMKV.getString("liked-videos")).toBe(JSON.stringify([{ title: "Alice Video 1" }]));
    const aliceSettings = JSON.parse(aliceMMKV.getString("settings-storage")!);
    expect(aliceSettings.state.imgbbApiKey).toBe("alice-imgbb-key");

    // Bob's personal data must hold Bob's values
    expect(bobMMKV.getString("search-history")).toBe(JSON.stringify(["Bob Query 1", "Bob Query 2"]));
    expect(bobMMKV.getString("liked-videos")).toBe(JSON.stringify([{ title: "Bob Video 1" }]));
    const bobSettings = JSON.parse(bobMMKV.getString("settings-storage")!);
    expect(bobSettings.state.imgbbApiKey).toBe("bob-imgbb-key");

    // Registry holds both accounts
    const accounts = getSavedAccounts();
    expect(accounts.length).toBe(2);
    expect(accounts.some((a) => a.id === "user_alice")).toBe(true);
    expect(accounts.some((a) => a.id === "user_bob")).toBe(true);
  });

  test("Step 3: User switching switches storage proxy, clears in-flight queries, and restores session", async () => {
    const { getUserStorage, userStorage, getActiveUserId } = await import("../services/storage");
    const { registerActiveSession, switchAccount } = await import("../services/accountManager");

    // Setup Alice and Bob
    registerActiveSession({
      access_token: "alice-token",
      refresh_token: "alice-refresh",
      user: { id: "user_alice", email: "alice@example.com" },
    } as any);
    userStorage.set("active_draft_note", "Alice's unfinished draft");

    registerActiveSession({
      access_token: "bob-token",
      refresh_token: "bob-refresh",
      user: { id: "user_bob", email: "bob@example.com" },
    } as any);
    userStorage.set("active_draft_note", "Bob's draft");

    expect(getActiveUserId()).toBe("user_bob");
    expect(userStorage.getString("active_draft_note")).toBe("Bob's draft");

    // 3. User switches back to Alice
    await switchAccount("user_alice");

    // Assert active user is Alice
    expect(getActiveUserId()).toBe("user_alice");

    // Assert React Query in-memory cache was cleared and in-flight queries cancelled
    expect(mockCancelQueries).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();

    // Assert Supabase session was set with Alice's tokens
    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: "alice-token",
      refresh_token: "alice-refresh",
    });

    // Assert dynamic proxy now reads Alice's data
    expect(userStorage.getString("active_draft_note")).toBe("Alice's unfinished draft");

    // Assert settings & API keys survive switching accounts completely intact
    const { settingsStorage } = await import("../services/storage");
    const settingsAfterSwitch = JSON.parse(settingsStorage.getString("settings-storage") || "{}");
    expect(settingsAfterSwitch?.state?.imgbbApiKey).toBe("alice-imgbb-key");
  });

  test("Step 4: Token refresh updates the account session in shared registry", async () => {
    const { registerActiveSession, updateAccountSession, getSavedAccounts } = await import(
      "../services/accountManager"
    );

    registerActiveSession({
      access_token: "old-token",
      refresh_token: "old-refresh",
      user: { id: "user_alice", email: "alice@example.com" },
    } as any);

    // Simulate Supabase refreshing the token
    updateAccountSession("user_alice", {
      access_token: "new-refreshed-token",
      refresh_token: "new-refreshed-refresh",
    });

    const accounts = getSavedAccounts();
    const alice = accounts.find((a) => a.id === "user_alice");
    expect(alice?.sessionTokens?.access_token).toBe("new-refreshed-token");
    expect(alice?.sessionTokens?.refresh_token).toBe("new-refreshed-refresh");
  });

  test("Step 5: Removing an active account wipes only that account and switches to the next account", async () => {
    const { getUserStorage, userStorage, getActiveUserId, sharedStorage } = await import(
      "../services/storage"
    );
    const { registerActiveSession, removeAccount, getSavedAccounts } = await import(
      "../services/accountManager"
    );

    // Add Alice & Bob
    registerActiveSession({
      access_token: "alice-token",
      refresh_token: "alice-refresh",
      user: { id: "user_alice", email: "alice@example.com" },
    } as any);
    userStorage.set("secret_note", "Alice private data");

    registerActiveSession({
      access_token: "bob-token",
      refresh_token: "bob-refresh",
      user: { id: "user_bob", email: "bob@example.com" },
    } as any);
    userStorage.set("secret_note", "Bob private data");

    // Set shared data
    sharedStorage.set("app_language", "vi");

    expect(getActiveUserId()).toBe("user_bob");

    // Remove Bob (the currently active account)
    const { remainingAccounts, switchedTo } = await removeAccount("user_bob");

    // Bob's partition is wiped completely on disk
    const bobMMKV = getUserStorage("user_bob");
    expect(bobMMKV.getString("secret_note")).toBeUndefined();
    expect(bobMMKV.getAllKeys().length).toBe(0);

    // Remaining accounts list contains only Alice
    expect(remainingAccounts.length).toBe(1);
    expect(remainingAccounts[0].id).toBe("user_alice");
    expect(switchedTo).toBe("user_alice");

    // Active user automatically transitioned to Alice
    expect(getActiveUserId()).toBe("user_alice");

    // Alice's data is 100% intact!
    const aliceMMKV = getUserStorage("user_alice");
    expect(aliceMMKV.getString("secret_note")).toBe("Alice private data");

    // Shared data (language) is intact!
    expect(sharedStorage.getString("app_language")).toBe("vi");
  });

  test("Step 6: Signing out of all accounts wipes all user partitions and preserves shared cache", async () => {
    const { getUserStorage, getActiveUserId, sharedStorage } = await import("../services/storage");
    const { registerActiveSession, signOutAllAccounts, getSavedAccounts } = await import(
      "../services/accountManager"
    );

    registerActiveSession({
      access_token: "token1",
      refresh_token: "refresh1",
      user: { id: "user_1" },
    } as any);
    getUserStorage("user_1").set("cache_1", "data 1");

    registerActiveSession({
      access_token: "token2",
      refresh_token: "refresh2",
      user: { id: "user_2" },
    } as any);
    getUserStorage("user_2").set("cache_2", "data 2");

    sharedStorage.set("persisted_device_theme", "dark");

    // Perform complete sign out
    await signOutAllAccounts();

    // Registry is cleared
    expect(getSavedAccounts().length).toBe(0);

    // Active user is null
    expect(getActiveUserId()).toBeNull();

    // User partitions are wiped
    expect(getUserStorage("user_1").getString("cache_1")).toBeUndefined();
    expect(getUserStorage("user_2").getString("cache_2")).toBeUndefined();

    // Device-level shared cache is PRESERVED
    expect(sharedStorage.getString("persisted_device_theme")).toBe("dark");
  });

  test("Step 7: Migration preserves pre-multiuser legacy data from mmkv.default", async () => {
    const { defaultLegacyStorage, getUserStorage, userStorage, sharedStorage, setActiveUserId } =
      await import("../services/storage");
    const { registerActiveSession } = await import("../services/accountManager");

    // Simulate pre-existing data in mmkv.default before the multi-user update:
    defaultLegacyStorage.set("search-history", JSON.stringify(["pre-upgrade search"]));
    defaultLegacyStorage.set("liked-videos", JSON.stringify(["pre-upgrade video"]));
    defaultLegacyStorage.set(
      "settings-storage",
      JSON.stringify({ state: { imgbbApiKey: "legacy-imgbb-key", showSensitiveContent: true } })
    );
    defaultLegacyStorage.set("onboarding_has_profile", true);
    defaultLegacyStorage.set("dimension:v1:img_1", JSON.stringify({ w: 100, h: 200 }));
    defaultLegacyStorage.set("app_lock_enabled_persisted", true);

    // Now user launches app with the update: session is restored
    registerActiveSession({
      access_token: "legacy-user-token",
      refresh_token: "legacy-user-refresh",
      user: { id: "user_legacy", email: "legacy@example.com" },
    } as any);

    // Verify user partition received personal user legacy data
    const userMMKV = getUserStorage("user_legacy");
    expect(userMMKV.getString("search-history")).toBe(JSON.stringify(["pre-upgrade search"]));
    expect(userMMKV.getString("liked-videos")).toBe(JSON.stringify(["pre-upgrade video"]));
    expect(userMMKV.getBoolean("onboarding_has_profile")).toBe(true);

    // Verify dynamic proxy reads this data immediately
    expect(userStorage.getString("search-history")).toBe(JSON.stringify(["pre-upgrade search"]));

    // Verify settings & API keys migrated into user partition
    const migratedSettings = JSON.parse(userMMKV.getString("settings-storage")!);
    expect(migratedSettings.state.imgbbApiKey).toBe("legacy-imgbb-key");
    expect(migratedSettings.state.showSensitiveContent).toBe(true);
    expect(sharedStorage.getString("dimension:v1:img_1")).toBe(JSON.stringify({ w: 100, h: 200 }));
    expect(sharedStorage.getBoolean("app_lock_enabled_persisted")).toBe(true);

    // Verify migration flag is set
    expect(sharedStorage.getBoolean("legacy_storage_migrated")).toBe(true);

    // Verify decoupled storageMigration functions and idempotency
    const { isLegacyStorageMigrated, isSharedStorageKey, migrateLegacyStorageIfNeeded } =
      await import("../services/storageMigration");

    expect(isLegacyStorageMigrated()).toBe(true);
    expect(isSharedStorageKey("dimension:v1:banner")).toBe(true);
    expect(isSharedStorageKey("weather:forecast")).toBe(true);
    expect(isSharedStorageKey("app_lock_enabled_persisted")).toBe(true);
    expect(isSharedStorageKey("settings-storage")).toBe(false);
    expect(isSharedStorageKey("search-history")).toBe(false);
    expect(isSharedStorageKey("liked-videos")).toBe(false);

    // Calling migration again must be completely idempotent
    const secondRun = migrateLegacyStorageIfNeeded("user_legacy");
    expect(secondRun.alreadyMigrated).toBe(true);
    expect(secondRun.migratedCount).toBe(0);
  });

  test("Step 8: userStorage.addOnValueChangedListener rebinds across setActiveUserId transitions", async () => {
    const { getUserStorage, setActiveUserId, userStorage } = await import("../services/storage");

    setActiveUserId(null);

    const changedEvents: { key: string; value: boolean | undefined }[] = [];
    const listener = userStorage.addOnValueChangedListener((key) => {
      if (key === "onboarding_has_profile") {
        changedEvents.push({ key, value: userStorage.getBoolean(key) });
      }
    });

    // Switch from guest/legacy to Alice (simulating first sign-in on login screen)
    setActiveUserId("user_rebind_alice");
    getUserStorage("user_rebind_alice").set("onboarding_has_profile", true);

    expect(changedEvents.length).toBeGreaterThanOrEqual(1);
    expect(changedEvents[changedEvents.length - 1]).toEqual({
      key: "onboarding_has_profile",
      value: true,
    });

    // Switch to Bob (simulating account switch / adding second account)
    getUserStorage("user_rebind_bob").set("onboarding_has_profile", false);
    setActiveUserId("user_rebind_bob");
    expect(changedEvents[changedEvents.length - 1]).toEqual({
      key: "onboarding_has_profile",
      value: false,
    });

    // Write update inside Bob's partition -> listener must still fire on Bob's instance
    getUserStorage("user_rebind_bob").set("onboarding_has_profile", true);
    expect(changedEvents[changedEvents.length - 1]).toEqual({
      key: "onboarding_has_profile",
      value: true,
    });

    // Sign out back to guest -> listener detaches from Bob and notifies cleared value
    setActiveUserId(null);
    expect(changedEvents[changedEvents.length - 1]).toEqual({
      key: "onboarding_has_profile",
      value: undefined,
    });

    const countBeforeBobWrite = changedEvents.length;
    getUserStorage("user_rebind_bob").set("onboarding_has_profile", false);
    expect(changedEvents.length).toBe(countBeforeBobWrite);

    listener.remove();
  });

  test("Step 9: mmkvSupabaseAdapter persists session across setActiveUserId transitions and cleans up on removeItem", async () => {
    const { defaultLegacyStorage, getUserStorage, setActiveUserId, sharedStorage, userStorage } =
      await import("../services/storage");
    const { mmkvSupabaseAdapter } = await import("../services/supabase-storage-adapter");

    const tokenKey = "sb-project-auth-token";
    setActiveUserId(null);
    sharedStorage.set("legacy_storage_migrated", true);

    // 1. Supabase saves session BEFORE registerActiveSession switches activeUserId
    const aliceSessionJson = JSON.stringify({ access_token: "alice-jwt", user: { id: "user_adapter_alice" } });
    await mmkvSupabaseAdapter.setItem(tokenKey, aliceSessionJson);

    // Switch active user to Alice -> session remains readable and Alice's partition stays clean
    setActiveUserId("user_adapter_alice");
    expect(await mmkvSupabaseAdapter.getItem(tokenKey)).toBe(aliceSessionJson);
    expect(getUserStorage("user_adapter_alice").getString(tokenKey)).toBeUndefined();

    // 2. Adding a second account saves Bob's session before switching to Bob
    const bobSessionJson = JSON.stringify({ access_token: "bob-jwt", user: { id: "user_adapter_bob" } });
    await mmkvSupabaseAdapter.setItem(tokenKey, bobSessionJson);
    setActiveUserId("user_adapter_bob");
    expect(await mmkvSupabaseAdapter.getItem(tokenKey)).toBe(bobSessionJson);
    expect(getUserStorage("user_adapter_alice").getString(tokenKey)).toBeUndefined();
    expect(getUserStorage("user_adapter_bob").getString(tokenKey)).toBeUndefined();

    // 3. One-time fallback migration if a session was previously stored in userStorage
    sharedStorage.remove(tokenKey);
    userStorage.set(tokenKey, "legacy-user-session");
    expect(await mmkvSupabaseAdapter.getItem(tokenKey)).toBe("legacy-user-session");
    expect(sharedStorage.getString(tokenKey)).toBe("legacy-user-session");
    expect(userStorage.getString(tokenKey)).toBeUndefined();

    // 4. removeItem wipes sharedStorage, active userStorage, and defaultLegacyStorage
    defaultLegacyStorage.set(tokenKey, "stale-default-session");
    userStorage.set(tokenKey, "stale-user-session");
    await mmkvSupabaseAdapter.removeItem(tokenKey);
    expect(sharedStorage.getString(tokenKey)).toBeUndefined();
    expect(userStorage.getString(tokenKey)).toBeUndefined();
    expect(defaultLegacyStorage.getString(tokenKey)).toBeUndefined();
    expect(await mmkvSupabaseAdapter.getItem(tokenKey)).toBeNull();
  });
});
