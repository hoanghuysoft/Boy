import { StyleSheet, TextStyle } from "react-native";
import { ThemeColors } from "../context/ThemeContext";
import { createTextStyle, createTypography } from "./typography";


type TypographyType = ReturnType<typeof createTypography>;

/**
 * Reusable, theme-aware styles for consistent screen layout and typography.
 * Uses Material Design typography system (M2/M3) for consistent text styles.
 */
let lastColors: ThemeColors | null = null;
let lastTypography: TypographyType | null = null;
let cachedStyles: any = null;

export const createCommonStyles = (
  colors: ThemeColors,
  typography: TypographyType
) => {
  if (cachedStyles && colors === lastColors && typography === lastTypography) {
    return cachedStyles;
  }
  lastColors = colors;
  lastTypography = typography;
  cachedStyles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    screenPadding: {
      padding: 12,
    },

    display: createTextStyle(typography.display, colors.onSurface, { fontFamily: 'GoogleSansFlexRegular' }),
    headline: createTextStyle(typography.headline, colors.onSurface, { fontFamily: 'GoogleSansFlexRegular' }),
    heading: createTextStyle(typography.title, colors.onSurface, { fontFamily: 'GoogleSansFlexRegular' }),

    title: createTextStyle(typography.title, colors.onSurface, { fontFamily: 'GoogleSansFlexRegular' }),
    subheading: createTextStyle(
      ("titleMedium" in typography ? typography.titleMedium : typography.subtitle1) as TextStyle,
      colors.onSurface, { fontFamily: 'GoogleSansFlexRegular' }
    ),

    body: createTextStyle(typography.body, colors.onSurface, { fontFamily: 'GoogleSansFlexRegular' }),
    bodySmall: createTextStyle(
      ("bodySmall" in typography ? typography.bodySmall : typography.body2) as TextStyle,
      colors.onSurface, { fontFamily: 'GoogleSansFlexRegular' }
    ),

    label: createTextStyle(typography.label, colors.onSurface, { fontFamily: 'GoogleSansFlexRegular' }),
    buttonText: createTextStyle(
      ("button" in typography ? typography.button : typography.label) as TextStyle,
      colors.onSurface,
      { textAlign: "center" }
    ),

    caption: createTextStyle(
      typography.caption,
      colors.onSurface,
      { fontFamily: 'GoogleSansFlexRegular' }
    ),
    muted: {
      ...createTextStyle(
        ("bodySmall" in typography ? typography.bodySmall : typography.body2) as TextStyle,
        colors.onSurfaceVariant,
        { fontFamily: 'GoogleSansFlexRegular' }
      ),
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    card: {
      backgroundColor: colors.surfaceContainer,
      borderRadius: 24,
      padding: 12,
    },
    button: {
      backgroundColor: colors.surfaceContainerHigh,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLarge: {
      width: 95,
      height: 95,
      borderRadius: 100,
      borderWidth: 3,
      borderColor: colors.surface,
    },
    section: {
      gap: 12,
    },
    contentSpacing: {
      gap: 8,
    },
    divider: {
      height: 1,
      backgroundColor: colors.outlineVariant,
      marginVertical: 16,
    },
  });
  return cachedStyles;
};

