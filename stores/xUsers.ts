import { userStorage as mmkv } from '@/services/storage';
import type { FxTwitterUser } from '@/services/fxtwitter/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type XUserSource = 'following' | 'custom';

export interface XStoredUser {
  id: string;
  name: string;
  screen_name: string;
  avatar_url: string | null;
  banner_url?: string | null;
  description?: string;
  followers?: number;
  following?: number;
  verified?: boolean;
  source: XUserSource;
  importedAt: number; // Unix timestamp for ordering
  isUnfollowed?: boolean; // True if previously followed but now unfollowed / removed
  userObj?: FxTwitterUser;
}

interface XUsersState {
  rootUsername: string | null;
  users: Record<string, XStoredUser>; // Keyed by lowercase screen_name
  hasPromptedRootDialog: boolean;

  // Actions
  setRootUsername: (username: string | null) => void;
  setHasPromptedRootDialog: (prompted: boolean) => void;
  addCustomUser: (user: FxTwitterUser) => void;
  removeUser: (screen_name: string) => void;
  moveToCustom: (screen_name: string) => void;
  toggleUnfollow: (screen_name: string) => void;
  syncFollowingUsers: (fetchedUsers: FxTwitterUser[]) => void;
  clearAll: () => void;
}

const mmkvZustandStorage = createJSONStorage(() => ({
  getItem: (name: string): string | null => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string): void => mmkv.set(name, value),
  removeItem: (name: string): boolean => mmkv.remove(name),
}));

export const useXUsersStore = create<XUsersState>()(
  persist(
    (set) => ({
      rootUsername: null,
      users: {},
      hasPromptedRootDialog: false,

      setRootUsername: (username) => {
        const clean = username ? username.trim().replace(/^@/, '') : null;
        set({ rootUsername: clean || null });
      },

      setHasPromptedRootDialog: (prompted) => {
        set({ hasPromptedRootDialog: prompted });
      },

      addCustomUser: (user) => {
        const key = user.screen_name.toLowerCase();
        set((state) => {
          const existing = state.users[key];
          const storedUser: XStoredUser = {
            id: user.id || key,
            name: user.name || user.screen_name,
            screen_name: user.screen_name,
            avatar_url: user.avatar_url ?? null,
            banner_url: user.banner_url ?? null,
            description: user.description,
            followers: user.followers,
            following: user.following,
            verified: !!user.verification?.verified,
            source: 'custom',
            importedAt: existing?.importedAt ?? Date.now(),
            isUnfollowed: false,
            userObj: user,
          };

          return {
            users: {
              ...state.users,
              [key]: storedUser,
            },
          };
        });
      },

      removeUser: (screen_name) => {
        const key = screen_name.toLowerCase();
        set((state) => {
          const next = { ...state.users };
          delete next[key];
          return { users: next };
        });
      },

      moveToCustom: (screen_name) => {
        const key = screen_name.toLowerCase();
        set((state) => {
          const user = state.users[key];
          if (!user) return state;
          return {
            users: {
              ...state.users,
              [key]: {
                ...user,
                source: 'custom',
                isUnfollowed: true,
              },
            },
          };
        });
      },

      toggleUnfollow: (screen_name) => {
        const key = screen_name.toLowerCase();
        set((state) => {
          const user = state.users[key];
          if (!user) return state;
          const nextUnfollowed = !user.isUnfollowed;
          return {
            users: {
              ...state.users,
              [key]: {
                ...user,
                isUnfollowed: nextUnfollowed,
                source: nextUnfollowed ? 'custom' : user.source,
              },
            },
          };
        });
      },

      syncFollowingUsers: (fetchedUsers) => {
        set((state) => {
          const nextUsers = { ...state.users };
          const fetchedMap = new Map<string, FxTwitterUser>();

          for (const u of fetchedUsers) {
            if (u.screen_name) {
              fetchedMap.set(u.screen_name.toLowerCase(), u);
            }
          }

          // 1. Any user previously marked as 'following' that is NOT in the fetched list
          // transitions to 'custom' and marked as isUnfollowed = true
          for (const key of Object.keys(nextUsers)) {
            const current = nextUsers[key];
            if (current.source === 'following' && !fetchedMap.has(key)) {
              nextUsers[key] = {
                ...current,
                source: 'custom',
                isUnfollowed: true,
              };
            }
          }

          // 2. Add or update users from fetched following list
          for (const [key, u] of fetchedMap.entries()) {
            const existing = nextUsers[key];
            if (existing) {
              // Update details, keep original importedAt
              nextUsers[key] = {
                ...existing,
                name: u.name || existing.name,
                avatar_url: u.avatar_url ?? existing.avatar_url,
                banner_url: u.banner_url ?? existing.banner_url,
                description: u.description ?? existing.description,
                followers: u.followers ?? existing.followers,
                following: u.following ?? existing.following,
                verified: !!u.verification?.verified,
                source: existing.source === 'custom' ? 'custom' : 'following',
                isUnfollowed: false,
                userObj: u,
              };
            } else {
              // Newly discovered following user
              nextUsers[key] = {
                id: u.id || key,
                name: u.name || u.screen_name,
                screen_name: u.screen_name,
                avatar_url: u.avatar_url ?? null,
                banner_url: u.banner_url ?? null,
                description: u.description,
                followers: u.followers,
                following: u.following,
                verified: !!u.verification?.verified,
                source: 'following',
                importedAt: Date.now(),
                isUnfollowed: false,
                userObj: u,
              };
            }
          }

          return { users: nextUsers };
        });
      },

      clearAll: () => {
        set({ users: {}, rootUsername: null, hasPromptedRootDialog: false });
      },
    }),
    {
      name: 'x_users_storage_v1',
      storage: mmkvZustandStorage,
    }
  )
);
