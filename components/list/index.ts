/**
 * @/components/list — Bluesky-inspired List utilities
 *
 * Components:
 *   List          — high-performance Animated.FlatList wrapper with:
 *                   scroll-down detection, item-seen callbacks,
 *                   header offset handling, themed pull-to-refresh,
 *                   and a video-autoplay settle hook.
 *
 * Context:
 *   ScrollProvider    — wraps a screen to publish scroll events
 *   useScrollHandlers — hook to consume scroll events from a parent provider
 *
 * Hooks:
 *   useNonReactiveCallback — stable callback that always reads latest closure
 *   useDedupe              — leading-edge rate limiter for callbacks
 */

export { List } from './List'
export type { ListMethods, ListProps, ListRef } from './List'

export { ScrollProvider, useScrollHandlers } from './ScrollContext'

export { useNonReactiveCallback } from './useNonReactiveCallback'
export { useDedupe } from './useDedupe'
