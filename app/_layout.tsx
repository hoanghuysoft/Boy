import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// Disable Reanimated strict mode warning
configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

import { GoogleSansFlex_700Bold, useFonts } from '@expo-google-fonts/google-sans-flex';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ImageBackground, StatusBar, StyleSheet, View } from 'react-native';
import { easeGradient } from 'react-native-easing-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlobalAudioPlayer } from '../components/GlobalAudioPlayer';
import { StatusBarProvider, useStatusBar } from '../context/StatusBarContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';
import { clientPersister, queryClient } from '../services/client';
import { useRootLayoutViewModel } from '../viewmodels/RootLayoutViewModel';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// ─── StatusBarFade ─────────────────────────────────────────────────────────────
// Pure UI sub-component: renders a gradient fade beneath the status bar.

const StatusBarFade = () => {
    const { theme } = useThemeContext();
    const { showStatusBarFade } = useStatusBar();
    const insets = useSafeAreaInsets();

    if (!showStatusBarFade) return null;

    const { colors, locations } = easeGradient({
        colorStops: {
            0: {
                color: theme === 'light'
                    ? 'rgba(255,255,255,0.8)'
                    : 'rgba(0,0,0,0.9)',
            },
            1: {
                color: theme === 'light'
                    ? 'rgba(255,255,255,0)'
                    : 'rgba(0,0,0,0)',
            },
        },
        extraColorStopsPerTransition: 12,
    });

    return (
        <LinearGradient
            pointerEvents="none"
            colors={colors as [string, string, ...string[]]}
            locations={locations as [number, number, ...number[]]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: insets.top + 24,
                zIndex: 10,
            }}
        />
    );
};

// ─── FakeSplashScreen ────────────────────────────────────────────────────────
// Displays the full-screen background design during the app's initial load.
const FakeSplashScreen = () => {
    return (
        <ImageBackground
            source={require('../assets/images/bg.png')}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
        >
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        </ImageBackground>
    );
};

// ─── RootContent ───────────────────────────────────────────────────────────────
// Renders the app shell once session + fonts are ready.

const RootContent = () => {
    const { theme, colors } = useThemeContext();

    // All business logic lives in the ViewModel
    const { isReady } = useRootLayoutViewModel();

    // Hide the native splash screen immediately when this component mounts,
    // so the "Fake" React Native splash screen (ImageBackground) can take over.
    useEffect(() => {
        SplashScreen.hideAsync();
    }, []);

    if (!isReady) {
        return <FakeSplashScreen />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar
                key={theme}
                animated={false}
                translucent
                backgroundColor="transparent"
                barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
            />
            <StatusBarFade />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                    animation: 'slide_from_right',
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
                <Stack.Screen name="video_player" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
                <Stack.Screen name="image_poster" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            </Stack>
            <GlobalAudioPlayer />
        </View>
    );
};

// ─── RootLayout (Entry Point) ──────────────────────────────────────────────────
// Pure bootstrap: wraps the app in required providers only.

export default function RootLayout() {
    // Fonts are still needed here so StatusBarFade (inside ThemeProvider) can
    // safely use GoogleSansFlex_700Bold before RootContent mounts.
    const [fontsLoaded] = useFonts({
        GoogleSansFlex_700Bold,
    });

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: clientPersister }}>
                <SafeAreaProvider>
                    <KeyboardProvider>
                        <ThemeProvider>
                            <StatusBarProvider>
                                <RootContent />
                            </StatusBarProvider>
                        </ThemeProvider>
                    </KeyboardProvider>
                </SafeAreaProvider>
            </PersistQueryClientProvider>
        </GestureHandlerRootView>
    );
}
