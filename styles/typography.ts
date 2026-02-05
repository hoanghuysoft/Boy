import { Dimensions, TextStyle } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Responsive font scaling based on screen size
 * Scales fonts proportionally for different device sizes
 */
const scaleFont = (size: number): number => {
  const scale = SCREEN_WIDTH / 375; // Base width (iPhone X/11/12 standard)
  const newSize = size * scale;

  // Clamp between reasonable min/max values
  return Math.max(12, Math.min(newSize, size * 1.5));
};

/**
 * Material Design 2 Type Scale
 * Based on Material Design 2 guidelines
 */
export const Material2Typography = {
  // Headlines
  h1: {
    fontSize: scaleFont(96),
    fontWeight: "300" as TextStyle["fontWeight"], // Light
    lineHeight: scaleFont(96) * 1.2,
    letterSpacing: -1.5,
  },
  h2: {
    fontSize: scaleFont(60),
    fontWeight: "300" as TextStyle["fontWeight"], // Light
    lineHeight: scaleFont(60) * 1.2,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: scaleFont(48),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(48) * 1.2,
    letterSpacing: 0,
  },
  h4: {
    fontSize: scaleFont(34),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(34) * 1.2,
    letterSpacing: 0.25,
  },
  h5: {
    fontSize: scaleFont(24),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(24) * 1.2,
    letterSpacing: 0,
  },
  h6: {
    fontSize: scaleFont(20),
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    lineHeight: scaleFont(20) * 1.2,
    letterSpacing: 0.15,
  },
  // Subtitles
  subtitle1: {
    fontSize: scaleFont(16),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(16) * 1.5,
    letterSpacing: 0.15,
  },
  subtitle2: {
    fontSize: scaleFont(14),
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    lineHeight: scaleFont(14) * 1.5,
    letterSpacing: 0.1,
  },
  // Body
  body1: {
    fontSize: scaleFont(16),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(16) * 1.5,
    letterSpacing: 0.5,
  },
  body2: {
    fontSize: scaleFont(14),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(14) * 1.5,
    letterSpacing: 0.25,
  },
  // Caption
  caption: {
    fontSize: scaleFont(12),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(12) * 1.5,
    letterSpacing: 0.4,
  },
  // Button
  button: {
    fontSize: scaleFont(14),
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    lineHeight: scaleFont(14) * 1.5,
    letterSpacing: 1.25,
    textTransform: "uppercase" as TextStyle["textTransform"],
  },
  // Overline
  overline: {
    fontSize: scaleFont(10),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(10) * 1.5,
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
    fontSize: scaleFont(57),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(64),
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: scaleFont(45),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(52),
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: scaleFont(36),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(44),
    letterSpacing: 0,
  },
  // Headlines
  headlineLarge: {
    fontSize: scaleFont(32),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(40),
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: scaleFont(28),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(36),
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: scaleFont(24),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(32),
    letterSpacing: 0,
  },
  // Titles
  titleLarge: {
    fontSize: scaleFont(22),
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    lineHeight: scaleFont(28),
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: scaleFont(16),
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    lineHeight: scaleFont(24),
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: scaleFont(14),
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    lineHeight: scaleFont(20),
    letterSpacing: 0.1,
  },
  // Body
  bodyLarge: {
    fontSize: scaleFont(16),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(24),
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: scaleFont(14),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(20),
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: scaleFont(12),
    fontWeight: "400" as TextStyle["fontWeight"], // Regular
    lineHeight: scaleFont(16),
    letterSpacing: 0.4,
  },
  // Labels
  labelLarge: {
    fontSize: scaleFont(14),
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    lineHeight: scaleFont(20),
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: scaleFont(12),
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    lineHeight: scaleFont(16),
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: scaleFont(11),
    fontWeight: "500" as TextStyle["fontWeight"], // Medium
    lineHeight: scaleFont(16),
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

