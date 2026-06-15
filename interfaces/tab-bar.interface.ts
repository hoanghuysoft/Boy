import type { ReactNode } from "react";

interface ITabRoute {
  key: string;
  name: string;
}

interface ITriggerProps {
  name: string;
  children?: ReactNode | ((active: boolean) => ReactNode);
}

interface ITabConfig {
  name: string;
  render?: (active: boolean) => ReactNode;
}

interface IParsedChildren {
  tabs: ITabConfig[];
  hasIndicator: boolean;
}

export type { IParsedChildren, ITabConfig, ITabRoute, ITriggerProps };
