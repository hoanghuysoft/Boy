/**
 * Instagram Service Module
 * Powered by Social AIO (FB AIO Relay API)
 *
 * Provides:
 * - 3 Core Services:
 *   1. User Info (`getInstagramUserInfo`, `useInstagramUserInfo`)
 *   2. User Stories (`getInstagramUserStories`, `useInstagramUserStories`)
 *   3. User Posts (`getInstagramPosts`, `useInstagramPosts` with infinite cursor pagination)
 *   + Bonus: User Reels (`getInstagramUserReels`, `useInstagramUserReels`)
 * - Social AIO CLIENT_ID management (`getSocialAioClientId`, `setSocialAioClientId`, `useSocialAioConfig`)
 * - MMKV Response Cache Layer with TTL
 * - Centralized Query Key Factory (`instagramKeys`)
 * - Comprehensive TypeScript types & interfaces
 */

export * from './api';
export * from './cache';
export * from './client';
export * from './hooks';
export * from './queryKeys';
export * from './types';
