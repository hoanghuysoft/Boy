/**
 * @/components/pager — Pager utilities for tabbed screens with collapsible headers
 *
 * Components:
 *   Pager           — react-native-pager-view wrapper with Reanimated event handling
 *   PagerWithHeader — Collapsible header engine (shared scrollY across all tabs)
 *
 * Context:
 *   PagerHeaderProvider    — provides scrollY and headerHeight to header children
 *   usePagerHeaderContext  — hook to consume pager header values
 */

export { Pager, type PagerRef, type RenderTabBarFn, type RenderTabBarFnProps } from './Pager'
export { PagerWithHeader, type PagerWithHeaderChildParams, type PagerWithHeaderProps } from './PagerWithHeader'
export { PagerHeaderProvider, usePagerHeaderContext } from './PagerHeaderContext'
