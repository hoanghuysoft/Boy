import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance } from 'react-native';
import { Uniwind } from "uniwind";
import { ThemePreference, useSettingsStore } from "../stores/settings";
import { createTypography, TypographyScale } from "../styles/typography";

export type ThemeMode = "light" | "dark";
export type { ThemePreference };

export type ThemeColors = {
  background: string;
  text: string;
  card: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  containerContent: string;
  divider: string;
  muted: string;
  verify: string;
  secondary: string;
  secondaryMuted: string;
  pillTab: {
    activeBg: string;
    activeText: string;
    inactiveBg: string;
    inactiveText: string;
  };
};

type ThemeContextValue = {
  theme: ThemeMode;
  themePreference: ThemePreference;
  colors: ThemeColors;
  typography: ReturnType<typeof createTypography>;
  typographyScale: TypographyScale;
  toggleTheme: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  setTypographyScale: (scale: TypographyScale) => void;
};

const lightColors: ThemeColors = {
  background: "#f6f6f6",
  text: "#0F172A",
  card: "#e0e0e2",
  tabBar: "#f1f1f3",
  tabActive: "#111827",
  tabInactive: "#000000",
  containerContent: "#ffffff",
  divider: "#e0e0e2",
  muted: "#888888",
  verify: "#1c94e6",
  secondary: "#0e64f6",
  secondaryMuted: "#ecf4fe",
  pillTab: {
    activeBg: "#E7F3FF",
    activeText: "#0866FF",
    inactiveBg: "transparent",
    inactiveText: "#1C1E21",
  },
};

const darkColors: ThemeColors = {
  background: "#000000",
  text: "#E5E7EB",
  card: "#4a4a4c",
  tabBar: "#363638",
  tabActive: "#E5E7EB",
  tabInactive: "#ffffff",
  containerContent: "#171719",
  divider: "#363638",
  muted: "#888888",
  verify: "#1c94e6",
  secondary: "#0e64f6",
  secondaryMuted: "#001b3a",
  pillTab: {
    activeBg: "#263951",
    activeText: "#5890FF",
    inactiveBg: "transparent",
    inactiveText: "#E4E6EB",
  },
};

const getSystemTheme = (): ThemeMode => {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
};

const getAdaptiveTheme = (): ThemeMode => {
  const hours = new Date().getHours();
  return (hours >= 6 && hours < 18) ? "light" : "dark";
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Use persisted settings store for theme preference
  const { themePreference, setThemePreference } = useSettingsStore();
  const [systemTheme, setSystemTheme] = useState<ThemeMode>(getSystemTheme());
  const [adaptiveTheme, setAdaptiveTheme] = useState<ThemeMode>(getAdaptiveTheme());
  const [typographyScale, setTypographyScale] = useState<TypographyScale>("m3");

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => subscription.remove();
  }, []);

  // Check time for adaptive theme
  useEffect(() => {
    if (themePreference !== 'adaptive') return;

    // Initial check
    setAdaptiveTheme(getAdaptiveTheme());

    // Check every minute
    const interval = setInterval(() => {
      setAdaptiveTheme(getAdaptiveTheme());
    }, 60000);

    return () => clearInterval(interval);
  }, [themePreference]);

  // Derive the actual theme from preference
  const theme: ThemeMode =
    themePreference === "system" ? systemTheme :
      themePreference === "adaptive" ? adaptiveTheme :
        themePreference;

  // Sync theme with Uniwind (HeroUI Native)
  useEffect(() => {
    if (themePreference === 'system') {
      Uniwind.setTheme('system');
    } else {
      Uniwind.setTheme(theme);
    }
  }, [theme, themePreference]);

  const toggleTheme = () => {
    // Toggle between light and dark (not system)
    setThemePreference(theme === "light" ? "dark" : "light");
  };

  const typography = useMemo(
    () => createTypography(typographyScale),
    [typographyScale]
  );

  const value = useMemo(
    () => ({
      theme,
      themePreference,
      colors: theme === "light" ? lightColors : darkColors,
      typography,
      typographyScale,
      toggleTheme,
      setThemePreference,
      setTypographyScale,
    }),
    [theme, themePreference, typography, typographyScale],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used inside ThemeProvider");
  }
  return ctx;
};

