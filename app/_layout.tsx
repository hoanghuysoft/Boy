import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Disable Reanimated strict mode warning
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

import { GoogleSansFlex_700Bold, useFonts } from '@expo-google-fonts/google-sans-flex';
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import { StatusBar, View } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBarProvider, useStatusBar } from "../context/StatusBarContext";
import { ThemeProvider, useThemeContext } from "../context/ThemeContext";
import { clientPersister, queryClient } from "../services/client";
import { supabase } from "../services/login";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const StatusBarFade = () => {
    const { theme } = useThemeContext();
    const { showStatusBarFade } = useStatusBar();
    const insets = useSafeAreaInsets();

    if (!showStatusBarFade) return null;

    const { colors, locations } = easeGradient({
        colorStops: {
            0: {
                color: theme === "light"
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(0,0,0,0.9)",
            },
            1: {
                color: theme === "light"
                    ? "rgba(255,255,255,0)"
                    : "rgba(0,0,0,0)",
            },
        },
        extraColorStopsPerTransition: 12,
    });

    let [fontsLoaded] = useFonts({
        GoogleSansFlex_700Bold,
    });

    if (!fontsLoaded) {
        return null;
    }

    return (
        <LinearGradient
            pointerEvents="none"
            colors={colors as [string, string, ...string[]]}
            locations={locations as [number, number, ...number[]]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: insets.top + 24,
                zIndex: 10,
            }}
        />
    );
};

const RootContent = ({ fontsLoaded }: { fontsLoaded: boolean }) => {
    const { theme, colors } = useThemeContext();
    const segments = useSegments();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);
    const [session, setSession] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsReady(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === 'login';

        if (!session && !inAuthGroup) {
            router.replace('/login');
        } else if (session && inAuthGroup) {
            router.replace('/');
        }
    }, [isReady, segments, session]);

    // Hide splash screen once session is ready AND fonts are loaded
    useEffect(() => {
        if (isReady && fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [isReady, fontsLoaded]);

    if (!isReady || !fontsLoaded) {
        return null;
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar
                key={theme}
                animated={false}
                translucent
                backgroundColor="transparent"
                barStyle={theme === "light" ? "dark-content" : "light-content"}
            />
            <StatusBarFade />
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="video_player" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
                <Stack.Screen name='image_poster' options={{ headerShown: false }} />
                <Stack.Screen name='settings' options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            </Stack>
        </View>
    );
};

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        GoogleSansFlex_700Bold,
    });

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '674603557783-tn1v0di2jpgp87af41b1t1rok9sqelc1.apps.googleusercontent.com',
        });
    }, [])

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: clientPersister }}>
                <SafeAreaProvider>
                    <ThemeProvider>
                        <StatusBarProvider>
                            <RootContent fontsLoaded={fontsLoaded} />
                        </StatusBarProvider>
                    </ThemeProvider>
                </SafeAreaProvider>
            </PersistQueryClientProvider>
        </GestureHandlerRootView>
    );
}
