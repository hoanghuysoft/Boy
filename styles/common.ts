import { StyleSheet, TextStyle } from "react-native";
import { ThemeColors } from "../context/ThemeContext";
import { createTextStyle, createTypography } from "./typography";


type TypographyType = ReturnType<typeof createTypography>;

/**
 * Reusable, theme-aware styles for consistent screen layout and typography.
 * Uses Material Design typography system (M2/M3) for consistent text styles.
 */
export const createCommonStyles = (
  colors: ThemeColors,
  typography: TypographyType
) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenPadding: {
      padding: 16,
    },

    display: createTextStyle(typography.display, colors.text, { fontFamily: 'GoogleSansFlex_400Regular' }),
    headline: createTextStyle(typography.headline, colors.text, { fontFamily: 'GoogleSansFlex_400Regular' }),
    heading: createTextStyle(typography.title, colors.text, { fontFamily: 'GoogleSansFlex_400Regular' }),

    title: createTextStyle(typography.title, colors.text, { fontFamily: 'GoogleSansFlex_400Regular' }),
    subheading: createTextStyle(
      ("titleMedium" in typography ? typography.titleMedium : typography.subtitle1) as TextStyle,
      colors.text, { fontFamily: 'GoogleSansFlex_400Regular' }
    ),

    body: createTextStyle(typography.body, colors.text, { fontFamily: 'GoogleSansFlex_400Regular' }),
    bodySmall: createTextStyle(
      ("bodySmall" in typography ? typography.bodySmall : typography.body2) as TextStyle,
      colors.text, { fontFamily: 'GoogleSansFlex_400Regular' }
    ),

    label: createTextStyle(typography.label, colors.text, { fontFamily: 'GoogleSansFlex_400Regular' }),
    buttonText: createTextStyle(
      ("button" in typography ? typography.button : typography.label) as TextStyle,
      colors.text,
      { textAlign: "center" }
    ),

    caption: createTextStyle(
      typography.caption,
      colors.text,
      { fontFamily: 'GoogleSansFlex_400Regular' }
    ),
    muted: {
      ...createTextStyle(
        ("bodySmall" in typography ? typography.bodySmall : typography.body2) as TextStyle,
        colors.text,
        { fontFamily: 'GoogleSansFlex_400Regular' }
      ),
      opacity: 0.7,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    card: {
      backgroundColor: colors.containerContent,
      borderRadius: 24,
      padding: 16,
    },
    button: {
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarLarge: {
      width: 85,
      height: 85,
      borderRadius: 100,
      borderWidth: 3,
      borderColor: colors.background,
    },
    section: {
      gap: 12,
    },
    contentSpacing: {
      gap: 8,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 16,
    },
  });

