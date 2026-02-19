import { GoogleSansFlex_700Bold, useFonts } from '@expo-google-fonts/google-sans-flex';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { supabase } from '../services/login';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RootLayoutViewModel {
    /** Whether the session check and font loading are both complete. */
    isReady: boolean;
    /** Whether fonts have been loaded. */
    fontsLoaded: boolean;
    /** The current Supabase session, or null if unauthenticated. */
    session: any;
}

// ─── ViewModel Hook ───────────────────────────────────────────────────────────

/**
 * useRootLayoutViewModel
 *
 * Encapsulates all side-effects and state management for the root layout:
 *  - Google Sign-In SDK configuration
 *  - Font loading
 *  - Session initialisation & auth-state subscription
 *  - Route protection (redirect to /login when unauthenticated)
 *  - Splash screen dismissal once everything is ready
 */
export const useRootLayoutViewModel = (): RootLayoutViewModel => {
    const router = useRouter();
    const segments = useSegments();

    // ─── Fonts ────────────────────────────────────────────────────────────
    const [fontsLoaded] = useFonts({
        GoogleSansFlex_700Bold,
    });

    // ─── Auth State ───────────────────────────────────────────────────────
    const [session, setSession] = useState<any>(null);
    const [isSessionReady, setIsSessionReady] = useState(false);

    // Configure Google Sign-In once on mount
    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '674603557783-tn1v0di2jpgp87af41b1t1rok9sqelc1.apps.googleusercontent.com',
        });
    }, []);

    // Load the initial session and subscribe to future auth changes
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsSessionReady(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // ─── Route Protection ─────────────────────────────────────────────────
    useEffect(() => {
        if (!isSessionReady) return;

        const inAuthGroup = segments[0] === 'login';

        if (!session && !inAuthGroup) {
            router.replace('/login');
        } else if (session && inAuthGroup) {
            router.replace('/');
        }
    }, [isSessionReady, segments, session]);

    // ─── Splash Screen ────────────────────────────────────────────────────
    const isReady = isSessionReady && fontsLoaded;

    useEffect(() => {
        if (isReady) {
            SplashScreen.hideAsync();
        }
    }, [isReady]);

    return {
        isReady,
        fontsLoaded,
        session,
    };
};
