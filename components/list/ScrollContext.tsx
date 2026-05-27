/**
 * ScrollContext — lightweight Reanimated scroll handler bus.
 *
 * Adapted from Bluesky social-app: src/lib/ScrollContext.tsx
 *
 * How it works:
 *  • A screen wraps its content in <ScrollProvider onScroll={...} />.
 *  • The <List> component reads from useScrollHandlers() and merges those
 *    handlers into its own animated scroll handler.
 *  • This lets a parent (e.g. a sticky header) react to the list's scroll
 *    events WITHOUT prop drilling through multiple layers.
 *
 * Key design note (from Bluesky's comments):
 *   "Note: this completely *overrides* the parent handlers.
 *    It's up to you to compose them with the parent ones via
 *    useScrollHandlers() if needed."
 *
 * Usage:
 * ```tsx
 * // In a screen with a collapsible header:
 * function HomeScreen() {
 *   const translateY = useSharedValue(0)
 *   const onScroll = useAnimatedScrollHandler({
 *     onScroll(e) { translateY.value = e.contentOffset.y }
 *   })
 *   return (
 *     <ScrollProvider onScroll={onScroll}>
 *       <Animated.View style={{ transform: [{ translateY }] }} />
 *       <List data={...} renderItem={...} />
 *     </ScrollProvider>
 *   )
 * }
 * ```
 */

import { createContext, useContext, useMemo } from 'react'
import type { ScrollHandlers } from 'react-native-reanimated'

// ─── Context ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ScrollContext = createContext<ScrollHandlers<any>>({
  onBeginDrag: undefined,
  onEndDrag: undefined,
  onScroll: undefined,
  onMomentumEnd: undefined,
})
ScrollContext.displayName = 'ScrollContext'

// ─── Hook ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useScrollHandlers(): ScrollHandlers<any> {
  return useContext(ScrollContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProviderProps = { children: React.ReactNode } & ScrollHandlers<any>

export function ScrollProvider({
  children,
  onBeginDrag,
  onEndDrag,
  onScroll,
  onMomentumEnd,
}: ProviderProps) {
  const handlers = useMemo(
    () => ({
      onBeginDrag,
      onEndDrag,
      onScroll,
      onMomentumEnd,
    }),
    [onBeginDrag, onEndDrag, onScroll, onMomentumEnd],
  )

  return (
    <ScrollContext.Provider value={handlers}>{children}</ScrollContext.Provider>
  )
}
