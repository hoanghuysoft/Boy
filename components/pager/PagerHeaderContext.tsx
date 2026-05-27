/**
 * PagerHeaderContext — Passes scroll position and header height down to children
 *
 * Ported from Bluesky: src/view/com/pager/PagerHeaderContext.tsx
 *
 * Used by the ProfileHeaderV3 component to create animated header transformations
 * based on the shared scrollY value.
 */

import { createContext, useContext, useMemo } from 'react'
import { type SharedValue } from 'react-native-reanimated'

export const PagerHeaderContext = createContext<{
  scrollY: SharedValue<number>
  headerHeight: number
} | null>(null)
PagerHeaderContext.displayName = 'PagerHeaderContext'

export function PagerHeaderProvider({
  scrollY,
  headerHeight,
  children,
}: {
  scrollY: SharedValue<number>
  headerHeight: number
  children: React.ReactNode
}) {
  const value = useMemo(
    () => ({ scrollY, headerHeight }),
    [scrollY, headerHeight],
  )
  return (
    <PagerHeaderContext.Provider value={value}>
      {children}
    </PagerHeaderContext.Provider>
  )
}

export function usePagerHeaderContext() {
  return useContext(PagerHeaderContext)
}
