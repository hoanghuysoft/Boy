import AsyncStorage from "@react-native-async-storage/async-storage";
import RnGoogleSignin from "@novastera-oss/rn-google-signin";
// import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { createClient } from "@supabase/supabase-js";
import { storage } from "./storage";
import "react-native-url-polyfill/auto";
import { useSearchHistoryStore } from "@/stores/searchHistory";
import { useShowWatchlistStore } from "@/stores/showWatchlist";
import { useMovieTrackerStore } from "@/stores/movieTracker";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        flowType: "pkce",
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

export async function getCurrentSession() {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }
    return session ?? null;
}


export async function signInWithGoogle() {
    try {
        await RnGoogleSignin.hasPlayServices({});
        const userInfo = await RnGoogleSignin.signIn({});

        if (userInfo.idToken) {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: userInfo.idToken,
            });

            if (error) throw error;
            console.log('Successfully signed in to Supabase');
            return getCurrentSession();
        }
    } catch (error) {
        console.warn('Sign-in error:', error);
        throw error;
    }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    await RnGoogleSignin.signOut();

    // ─── Wipe all persistence layers ────────────────────────────────────────
    // 1. MMKV: all user-specific keys (query cache, watchlists, history, etc.)
    storage.clearAll();
    // 2. AsyncStorage: supabase auth tokens + settings store (uses AsyncStorage)
    await AsyncStorage.clear();

    // ─── Reset in-memory Zustand stores ─────────────────────────────────────
    // MMKV clearAll() wipes the persistence layer but the running store keeps
    // its last-hydrated state. Explicitly reset each store so the next user
    // starts fresh without restarting the app.
    useSearchHistoryStore.getState().clearHistory();
    useShowWatchlistStore.getState().reset();
    useMovieTrackerStore.getState().reset();

    if (error) {
        throw error;
    }
}
