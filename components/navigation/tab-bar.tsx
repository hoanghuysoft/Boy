import { useThemeContext } from "@/context/ThemeContext";
import { createCurvedTabs } from "@/lib/create-curved-tabs";
import { Image } from "expo-image";
import { BottomTabBarProps } from "expo-router/tabs";
import React from "react";

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
    source: require("@/assets/images/tabIcons/home.png"),
  },
  {
    name: "shots",
    source: require("@/assets/images/tabIcons/shots.png"),
  },
  {
    name: "movies",
    source: require("@/assets/images/tabIcons/movies.png"),
  },
  {
    name: "mansory",
    source: require("@/assets/images/tabIcons/masory.png"),
  },
  {
    name: "profile",
    source: require("@/assets/images/tabIcons/profile.png"),
  },
];

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
                const color = active ? colors.onSecondaryContainer : colors.onSurfaceVariant;
                return (
                  <Image
                    source={tabConfig.source}
                    style={{
                      width: 24,
                      height: 24,
                      tintColor: color,
                    }}
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

