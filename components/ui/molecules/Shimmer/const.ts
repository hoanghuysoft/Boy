import type { IShimmerColorTheme, ShimmerPreset } from "./Shimmer.types";

const SHIMMER_PRESETS: Record<Exclude<ShimmerPreset, "auto">, IShimmerColorTheme> = {
  dark: {
    colors: [
      "transparent",
      "rgba(255, 255, 255, 0.04)",
      "rgba(255, 255, 255, 0.14)",
      "rgba(255, 255, 255, 0.04)",
      "transparent",
    ],
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  light: {
    colors: [
      "transparent",
      "rgba(255, 255, 255, 0.4)",
      "rgba(255, 255, 255, 0.75)",
      "rgba(255, 255, 255, 0.4)",
      "transparent",
    ],
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
  twitter: {
    colors: [
      "transparent",
      "rgba(255, 255, 255, 0.06)",
      "rgba(255, 255, 255, 0.16)",
      "rgba(255, 255, 255, 0.06)",
      "transparent",
    ],
    backgroundColor: "rgba(47, 51, 54, 1)",
  },
  neutral: {
    colors: [
      "transparent",
      "rgba(255, 255, 255, 0.25)",
      "rgba(255, 255, 255, 0.6)",
      "rgba(255, 255, 255, 0.25)",
      "transparent",
    ],
    backgroundColor: "rgba(0, 0, 0, 0.06)",
  },
  custom: {
    colors: [
      "transparent",
      "rgba(255, 255, 255, 0.15)",
      "transparent",
    ],
  },
};

export { SHIMMER_PRESETS };
