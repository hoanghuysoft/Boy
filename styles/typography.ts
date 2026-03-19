import { TextStyle } from "react-native";

/**
 * Material Design 2 Type Scale
 * Based on Material Design 2 guidelines
 */
export const Material2Typography = {
  // Headlines
  h1: {
    fontSize: 96,
    fontWeight: "300" as TextStyle["fontWeight"], // Light
    letterSpacing: -1.5,
  },
  h2: {
    fontSize: 60,
    fontWeight: "300" as TextStyle["fontWeight"], // Light
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 48,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0,
  },
  h4: {
    fontSize: 34,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0.25,
  },
  h5: {
    fontSize: 24,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0,
  },
  h6: {
    fontSize: 20,
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    letterSpacing: 0.15,
  },
  // Subtitles
  subtitle1: {
    fontSize: 16,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0.15,
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    letterSpacing: 0.1,
  },
  // Body
  body1: {
    fontSize: 16,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0.5,
  },
  body2: {
    fontSize: 14,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0.25,
  },
  // Caption
  caption: {
    fontSize: 12,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0.4,
  },
  // Button
  button: {
    fontSize: 14,
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    letterSpacing: 1.25,
    textTransform: "uppercase" as TextStyle["textTransform"],
  },
  // Overline
  overline: {
    fontSize: 10,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 1.5,
    textTransform: "uppercase" as TextStyle["textTransform"],
  },
};

/**
 * Material Design 3 Type Scale
 * Based on Material Design 3 guidelines (default font size/line height)
 */
export const Material3Typography = {
  // Display
  displayLarge: {
    fontSize: 57,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0,
  },
  // Headlines
  headlineLarge: {
    fontSize: 32,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0,
  },
  // Titles
  titleLarge: {
    fontSize: 22,
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    letterSpacing: 0.1,
  },
  // Body
  bodyLarge: {
    fontSize: 16,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    letterSpacing: 0.4,
  },
  // Labels
  labelLarge: {
    fontSize: 14,
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    letterSpacing: 0.5,
  },
};

/**
 * Combined typography system
 * Provides both M2 and M3 styles with a unified interface
 */
export type TypographyScale = "m2" | "m3";

export const createTypography = (scale: TypographyScale = "m3") => {
  if (scale === "m2") {
    return {
      ...Material2Typography,
      // Convenience aliases
      display: Material2Typography.h1,
      headline: Material2Typography.h4,
      title: Material2Typography.h6,
      body: Material2Typography.body1,
      label: Material2Typography.button,
      caption: Material2Typography.caption,
    };
  } else {
    return {
      ...Material3Typography,
      // Convenience aliases
      display: Material3Typography.displayLarge,
      headline: Material3Typography.headlineLarge,
      title: Material3Typography.titleLarge,
      body: Material3Typography.bodyLarge,
      label: Material3Typography.labelLarge,
      caption: Material3Typography.bodySmall,
    };
  }
};

/**
 * Helper to create text styles with color
 */
export const createTextStyle = (
  typographyStyle: TextStyle,
  color: string,
  overrides?: Partial<TextStyle>
): TextStyle => ({
  ...typographyStyle,
  color,
  ...overrides,
});

