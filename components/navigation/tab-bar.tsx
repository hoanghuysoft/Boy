import { useThemeContext } from "@/context/ThemeContext";
import { createCurvedTabs } from "@/lib/create-curved-tabs";
import { BottomTabBarProps } from "expo-router/tabs";
import React from "react";

import HomeIcon from "@/assets/images/svg/homeyt.svg";
import CarouselIcon from "@/assets/images/svg/image-carousel.svg";
import MediaLibraryIcon from "@/assets/images/svg/libyt.svg";
import TvIcon from "@/assets/images/svg/tv-2.svg";
import UserIcon from "@/assets/images/svg/user-1.svg";

import {
  CurvedTabsIndicator,
  CurvedTabsList,
  CurvedTabsTrigger,
} from ".././markers";
import { CurvedTabsRoot } from "./curved-tabs";

const CurvedTabs = createCurvedTabs(
  CurvedTabsRoot,
  CurvedTabsList,
  CurvedTabsTrigger,
  CurvedTabsIndicator,
);

const tabs = [
  {
    name: "index",
    Icon: HomeIcon,
  },
  {
    name: "shots",
    Icon: MediaLibraryIcon,
  },
  {
    name: "tv",
    Icon: TvIcon,
  },
  {
    name: "chat",
    Icon: UserIcon,
  },
  {
    name: "profile",
    Icon: CarouselIcon,
  },
];

const getOpacityColor = (hexColor: string, opacityHex: string = "22") => {
  if (typeof hexColor === "string" && hexColor.startsWith("#")) {
    if (hexColor.length === 4) {
      const r = hexColor[1];
      const g = hexColor[2];
      const b = hexColor[3];
      return `#${r}${r}${g}${g}${b}${b}${opacityHex}`;
    }
    if (hexColor.length === 7) {
      return `${hexColor}${opacityHex}`;
    }
    if (hexColor.length === 9) {
      return hexColor.slice(0, 7) + opacityHex;
    }
  }
  return hexColor;
};

const CurvedTabBar: React.FC<BottomTabBarProps> = (
  props: BottomTabBarProps & React.ComponentProps<typeof CurvedTabBar>,
): React.ReactNode & React.ReactElement & React.JSX.Element => {
  const { colors } = useThemeContext();

  return (
    <CurvedTabs {...props}>
      <CurvedTabs.List>
        {props.state.routes.map((route) => {
          const tabConfig = tabs.find((t) => t.name === route.name);
          if (!tabConfig) return null;
          return (
            <CurvedTabs.Trigger key={route.key} name={route.name}>
              {(active: boolean) => {
                const Icon = tabConfig.Icon;
                const color = active ? colors.onSecondaryContainer : colors.onSurfaceVariant;
                return (
                  <Icon
                    width={24}
                    height={24}
                    color={color}
                    fill={active ? getOpacityColor(color, "33") : "none"}
                  />
                );
              }}
            </CurvedTabs.Trigger>
          );
        })}
      </CurvedTabs.List>
      <CurvedTabs.Indicator />
    </CurvedTabs>
  );
};

export { CurvedTabBar, CurvedTabs };

