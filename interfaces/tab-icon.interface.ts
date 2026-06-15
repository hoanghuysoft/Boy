import type { ReactNode } from "react";
import type { SharedValue } from "react-native-reanimated";

interface ITabIcon {
  icon?: string;
  fallback?: string;
  render?: (active: boolean) => ReactNode;
  x: number;
  slotWidth: number;
  pillCenter: SharedValue<number>;
}

export type { ITabIcon };
