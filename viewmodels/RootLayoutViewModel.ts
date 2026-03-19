import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import {
    checkProfileFromServer,
    getLocalHasProfile,
} from '../services/onboarding';
import { supabase } from '../services/login';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RootLayoutViewModel {
    isReady: boolean;
    fontsLoaded: boolean;
    loaded: boolean;
    session: any;
    hasProfile: boolean | undefined;
}

// ─── ViewModel Hook ───────────────────────────────────────────────────────────

export const useRootLayoutViewModel = (): RootLayoutViewModel => {
    const router = useRouter();
    const segments = useSegments();

    const fontsLoaded = true;

    const [session, setSession] = useState<any>(null);
    const [isSessionReady, setIsSessionReady] = useState(false);
    const [hasProfile, setHasProfile] = useState<boolean | undefined>(undefined);

    // Prevents a second server check when SIGNED_IN fires right after getSession
    // on the initial app load (both can resolve for the same login event).
    const initialCheckDoneRef = useRef(false);

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '674603557783-tn1v0di2jpgp87af41b1t1rok9sqelc1.apps.googleusercontent.com',
        });
    }, []);

    // ─── Session + profile check ───────────────────────────────────────────────
    useEffect(() => {
        // App startup: restore session from AsyncStorage, then check profile.
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            setSession(session);

            if (session) {
                const local = getLocalHasProfile();

                if (local !== undefined) {
                    // Fast path: already determined locally.
                    setHasProfile(local);
                } else {
                    // Existing user who hasn't gone through this flow yet —
                    // fetch once to populate MMKV.
                    try {
                        const result = await checkProfileFromServer();
                        setHasProfile(result);
                    } catch {
                        // Fail open so existing users aren't blocked on errors.
                        setHasProfile(true);
                    }
                }

                initialCheckDoneRef.current = true;
            }

            setIsSessionReady(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);

                if (event === 'SIGNED_IN' && session) {
                    // New login: always verify against the server so we don't rely
                    // on a stale MMKV value from a previous account.
                    if (!initialCheckDoneRef.current) {
                        // getSession() fired first on startup — skip duplicate call.
                        initialCheckDoneRef.current = true;
                        return;
                    }
                    try {
                        const result = await checkProfileFromServer();
                        setHasProfile(result);
                    } catch {
                        setHasProfile(true);
                    }
                } else if (!session) {
                    // Signed out — MMKV is cleared by signOut(), reset state.
                    setHasProfile(undefined);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    // ─── Route protection ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!isSessionReady) return;

        const inAuthGroup = segments[0] === 'login';
        const inOnboarding = segments[0] === 'onboarding';

        if (!session) {
            if (!inAuthGroup) router.replace('/login');
        } else if (hasProfile === false) {
            if (!inOnboarding) router.replace('/onboarding');
        } else if (hasProfile === true) {
            if (inAuthGroup || inOnboarding) router.replace('/');
        }
        // hasProfile === undefined while still checking: don't redirect yet.
    }, [isSessionReady, segments, session, hasProfile]);

    // ─── Splash screen ─────────────────────────────────────────────────────────
    // Wait for both the session AND (when logged in) the profile flag before
    // revealing the app, so the user never sees a flash of the wrong screen.
    const isReady =
        isSessionReady &&
        fontsLoaded &&
        (session ? hasProfile !== undefined : true);

    useEffect(() => {
        if (isReady) {
            SplashScreen.hideAsync();
        }
    }, [isReady]);

    return {
        isReady,
        fontsLoaded,
        loaded: true,
        session,
        hasProfile,
    };
};
