import '@/i18n';
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { ImageBackground, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GlobalAudioPlayer } from "../components/GlobalAudioPlayer";
import { SessionProvider } from "../context/SessionContext";
import { StatusBarProvider, useStatusBar } from "../context/StatusBarContext";
import { ThemeProvider, useThemeContext } from "../context/ThemeContext";
import { clientPersister, queryClient } from "../services/client";
import { useAutoLanguageSync } from "../stores/language";
import { useRootLayoutViewModel } from "../viewmodels/RootLayoutViewModel";

// Disable Reanimated strict mode warning
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// Prevent global font scaling
interface TextWithDefaultProps extends Text {
    defaultProps?: { allowFontScaling?: boolean };
}
interface TextInputWithDefaultProps extends TextInput {
    defaultProps?: { allowFontScaling?: boolean };
}
(Text as unknown as TextWithDefaultProps).defaultProps = (Text as unknown as TextWithDefaultProps).defaultProps || {};
(Text as unknown as TextWithDefaultProps).defaultProps!.allowFontScaling = false;
(TextInput as unknown as TextInputWithDefaultProps).defaultProps = (TextInput as unknown as TextInputWithDefaultProps).defaultProps || {};
(TextInput as unknown as TextInputWithDefaultProps).defaultProps!.allowFontScaling = false;

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// ─── StatusBarFade ─────────────────────────────────────────────────────────────
// Pure UI sub-component: renders a gradient fade beneath the status bar.

const StatusBarFade = () => {
  const { theme } = useThemeContext();
  const { showStatusBarFade } = useStatusBar();
  const insets = useSafeAreaInsets();

  const pathname = usePathname();
  const isShots = pathname === "/shots";

  if (!showStatusBarFade && !isShots) return null;

  const { colors, locations } = easeGradient({
    colorStops: {
      0: {
        color: isShots
          ? "rgba(0,0,0,0.6)"
          : theme === "light"
            ? "rgba(255,255,255,0.5)"
            : "rgba(0,0,0,0.6)",
      },
      1: {
        color: isShots
          ? "rgba(0,0,0,0)"
          : theme === "light"
            ? "rgba(255,255,255,0)"
            : "rgba(0,0,0,0)",
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

const FakeSplashScreen = () => {
  return (
    <ImageBackground
      source={require("../assets/images/bg.png")}
      style={StyleSheet.absoluteFill}
      resizeMode="cover"
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
        animated
      />
    </ImageBackground>
  );
};

const RootContent = () => {
  const { theme, colors } = useThemeContext();
  const pathname = usePathname();
  const isShots = pathname === "/shots";

  const { isReady, session, hasProfile } = useRootLayoutViewModel();
  useAutoLanguageSync();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (!isReady) {
    return <FakeSplashScreen />;
  }

  return (
    <SessionProvider session={session} hasProfile={hasProfile}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar
          key={`${theme}-${isShots}`}
          animated={false}
          translucent
          backgroundColor="transparent"
          barStyle={
            isShots
              ? "light-content"
              : theme === "light"
                ? "dark-content"
                : "light-content"
          }
        />
        <StatusBarFade />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{ headerShown: false, animation: "fade" }}
          />
          <Stack.Screen
            name="onboarding"
            options={{ headerShown: false, animation: "fade", gestureEnabled: false }}
          />
          <Stack.Screen
            name="video_player"
            options={{ headerShown: false, animation: "slide_from_bottom" }}
          />
          <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="image_poster" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings"
            options={{ headerShown: false, animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="bookmarks"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="language-settings"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="fprofile"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="search"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="hashtag/[tag]"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="hashtag-list"
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="show_detail"
            options={{ headerShown: false, animation: "none" }}
          />
          <Stack.Screen
            name="show_list"
            options={{ headerShown: false, animation: "none" }}
          />
          <Stack.Screen
            name="create"
            options={{ headerShown: false, animation: "none" }}
          />
        </Stack>
        <GlobalAudioPlayer />
      </View>
    </SessionProvider>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: clientPersister }}
      >
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
