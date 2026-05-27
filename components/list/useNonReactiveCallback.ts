import { useCallback, useInsertionEffect, useRef } from 'react'

const noop = () => {}

/**
 * Returns a stable callback that always calls the latest version of `fn`
 * without changing identity when `fn`'s dependencies change.
 *
 * Use sparingly — it erases reactivity. Don't call during render.
 * Ported from Bluesky social-app: src/lib/hooks/useNonReactiveCallback.ts
 */
export function useNonReactiveCallback<T extends Function = () => void>(
  fn?: T,
): T {
  const ref = useRef<T>((fn ?? noop) as T)
  useInsertionEffect(() => {
    ref.current = (fn ?? noop) as T
  }, [fn])
  return useCallback(
    (...args: any) => {
      return ref.current(...args)
    },
    [ref],
  ) as unknown as T
}
