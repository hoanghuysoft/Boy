import { useCallback, useRef } from 'react'

/**
 * Returns a stable function that rate-limits its callback to once per `timeout` ms.
 * The first call in a window executes immediately; subsequent calls in the window are dropped.
 *
 * Ported from Bluesky social-app: src/lib/hooks/useDedupe.ts
 *
 * @param timeout - Minimum gap between calls in milliseconds (default: 250)
 *
 * @example
 * const dedupe = useDedupe(400)
 * // In a scroll handler on iOS:
 * dedupe(updateActiveVideo) // fires immediately, then suppressed for 400ms
 */
export function useDedupe(timeout = 250) {
  const canDo = useRef(true)

  return useCallback(
    (cb: () => unknown) => {
      if (canDo.current) {
        canDo.current = false
        setTimeout(() => {
          canDo.current = true
        }, timeout)
        cb()
        return true
      }
      return false
    },
    [timeout],
  )
}
