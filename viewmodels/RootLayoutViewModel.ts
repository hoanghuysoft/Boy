import RnGoogleSignin from '@novastera-oss/rn-google-signin';
import { focusManager } from '@tanstack/react-query';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useMMKVBoolean } from 'react-native-mmkv';
import { supabase } from '../services/login';
import {
    checkProfileFromServer,
    getLocalHasProfile,
    onboardingMmkv,
    PROFILE_KEY,
    setLocalHasProfile,
} from '../services/onboarding';
import { getUserStorage } from '../services/storage';

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

    // Reactively watch MMKV for the active user's concrete storage instance
    // (fallback to onboardingMmkv when signed out) so Onboarding submission updates immediately.
    const activeProfileMmkv = useMemo(
        () => (session?.user?.id ? getUserStorage(session.user.id) : onboardingMmkv),
        [session?.user?.id]
    );
    const [hasProfile] = useMMKVBoolean(PROFILE_KEY, activeProfileMmkv);

    // Track if getSession() has resolved. This prevents reacting to the redundant
    // SIGNED_IN event that Supabase often fires right after getSession() on startup.
    const initialSessionCheckDoneRef = useRef(false);

    useEffect(() => {
        RnGoogleSignin.configure({
            webClientId: '674603557783-tn1v0di2jpgp87af41b1t1rok9sqelc1.apps.googleusercontent.com',
        });
    }, []);

    useEffect(() => {
        async function onFetchUpdateAsync() {
            // expo-updates is unavailable in dev builds / Expo Go.
            if (__DEV__ || !Updates.isEnabled) {
                return;
            }
            try {
                const update = await Updates.checkForUpdateAsync();

                if (update.isAvailable) {
                    // Download the new bundle
                    await Updates.fetchUpdateAsync();

                    // Force the app to reload immediately
                    await Updates.reloadAsync();
                }
            } catch (error) {
                console.error("Error fetching updates:", error);
            }
        }

        onFetchUpdateAsync();
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
            focusManager.setFocused(status === 'active');
        });
        return () => subscription.remove();
    }, []);

    // ─── Session + profile check ───────────────────────────────────────────────
    useEffect(() => {
        let isMounted = true;

        // App startup: restore session, activate user partition, then resolve profile status.
        const initSession = async () => {
            try {
                const { data: { session: initialSession } } = await supabase.auth.getSession();

                if (initialSession) {
                    try {
                        const { registerActiveSession } = await import('@/services/accountManager');
                        registerActiveSession(initialSession);
                    } catch {}

                    // Read directly from MMKV after registerActiveSession switches to user-<userId>
                    const local = getLocalHasProfile();

                    if (local === undefined) {
                        try {
                            const result = await checkProfileFromServer();
                            setLocalHasProfile(result);
                        } catch {
                            setLocalHasProfile(true);
                        }
                    }
                }

                if (isMounted) {
                    setSession(initialSession);
                }
            } catch (err) {
                console.warn('Initial session check failed:', err);
                if (isMounted) {
                    setSession(null);
                }
            } finally {
                // Important: Mark the initial startup check as done, even if NO session was found
                // or an error occurred, so future sign-ins aren't mistakenly ignored.
                initialSessionCheckDoneRef.current = true;
                if (isMounted) {
                    setIsSessionReady(true);
                }
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, nextSession) => {
                if (event === 'INITIAL_SESSION') {
                    return;
                }

                if (event === 'TOKEN_REFRESHED' && nextSession) {
                    try {
                        const { updateAccountSession } = await import('@/services/accountManager');
                        updateAccountSession(nextSession.user.id, {
                            access_token: nextSession.access_token,
                            refresh_token: nextSession.refresh_token,
                        });
                    } catch {}
                    if (isMounted) {
                        setSession(nextSession);
                    }
                    return;
                }

                if (event === 'SIGNED_IN' && nextSession) {
                    // Supabase may emit SIGNED_IN implicitly alongside getSession on startup.
                    if (!initialSessionCheckDoneRef.current) {
                        return; // Ignore implicit event; initSession is handling it.
                    }

                    // Register user partition BEFORE checking profile or committing React session state
                    // so hasProfile is read from and written to the new user's storage.
                    try {
                        const { registerActiveSession } = await import('@/services/accountManager');
                        registerActiveSession(nextSession);
                    } catch {}

                    // A new manually-triggered login: fetch from server to clear any stale MMKV
                    try {
                        const result = await checkProfileFromServer();
                        setLocalHasProfile(result);
                    } catch {
                        if (getLocalHasProfile() === undefined) {
                            setLocalHasProfile(true);
                        }
                    }

                    if (isMounted) {
                        setSession(nextSession);
                    }
                    return;
                }

                if (!nextSession) {
                    // SIGNED_OUT or TOKEN_REFRESHED to null
                    onboardingMmkv.remove(PROFILE_KEY);
                    if (isMounted) {
                        setSession(null);
                    }
                    return;
                }

                if (isMounted) {
                    setSession(nextSession);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
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
    }, [isSessionReady, segments, session, hasProfile, router]);

    // ─── Splash screen ─────────────────────────────────────────────────────────
    // Keep splash visible only during initial boot until session + profile state are ready.
    // Never revert to splash screen on subsequent sign-ins or account switches.
    const isReady = isSessionReady && fontsLoaded;

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
