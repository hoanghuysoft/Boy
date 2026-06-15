import { createCurvedTabs } from "@/lib/create-curved-tabs";
import { BottomTabBarProps } from "expo-router/tabs";
import React from "react";
import { useThemeContext } from "@/context/ThemeContext";
import { Clapperboard as ClapperboardBold, GalleryWide as GalleryWideBold, Home as HomeBold, UserRounded as UserRoundedBold, VideoLibrary as VideoLibraryBold } from "@solar-icons/react-native/Bold";
import { Clapperboard as ClapperboardOutline, GalleryWide as GalleryWideOutline, Home as HomeOutline, UserRounded as UserRoundedOutline, VideoLibrary as VideoLibraryOutline } from "@solar-icons/react-native/Outline";

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
    IconOutlined: HomeOutline,
    IconSolid: HomeBold,
  },
  {
    name: "shots",
    IconOutlined: VideoLibraryOutline,
    IconSolid: VideoLibraryBold,
  },
  {
    name: "tv",
    IconOutlined: ClapperboardOutline,
    IconSolid: ClapperboardBold,
  },
  {
    name: "chat",
    IconOutlined: UserRoundedOutline,
    IconSolid: UserRoundedBold,
  },
  {
    name: "profile",
    IconOutlined: GalleryWideOutline,
    IconSolid: GalleryWideBold,
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
                const Icon = active ? tabConfig.IconSolid : tabConfig.IconOutlined;
                const color = active ? colors.onSecondaryContainer : colors.onSurfaceVariant;
                return <Icon size={24} color={color} />;
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

