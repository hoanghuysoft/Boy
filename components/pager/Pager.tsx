/**
 * Pager — react-native-pager-view wrapper with Reanimated event handling
 *
 * Adapted from Bluesky: src/view/com/pager/Pager.tsx
 *
 * Simplified for our use: no drawer gesture management, no Lingui.
 * All events (onPageScroll, onPageSelected, onPageScrollStateChanged)
 * are handled on the UI thread via Reanimated's useEvent/useHandler.
 */

import {
  type JSX,
  memo,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Platform, View } from 'react-native'
import PagerView, {
  type PagerViewOnPageScrollEventData,
  type PagerViewOnPageSelectedEventData,
  type PageScrollStateChangedNativeEventData,
} from 'react-native-pager-view'
import Animated, {
  runOnJS,
  type SharedValue,
  useEvent,
  useHandler,
  useSharedValue,
} from 'react-native-reanimated'

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PagerRef {
  setPage: (index: number) => void
}

export interface RenderTabBarFnProps {
  selectedPage: number
  onSelect?: (index: number) => void
  dragProgress: SharedValue<number>
  dragState: SharedValue<'idle' | 'dragging' | 'settling'>
}

export type RenderTabBarFn = (props: RenderTabBarFnProps) => JSX.Element

interface PagerProps {
  ref?: React.Ref<PagerRef>
  initialPage?: number
  renderTabBar: RenderTabBarFn
  onTabPressed?: (index: number) => void
  onPageSelected?: (index: number) => void
  onPageScrollStateChanged?: (
    scrollState: 'idle' | 'dragging' | 'settling',
  ) => void
  testID?: string
}

// ─── Animated PagerView ─────────────────────────────────────────────────────────

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView)
const MemoizedAnimatedPagerView = memo(AnimatedPagerView)

// ─── Pager ──────────────────────────────────────────────────────────────────────

export function Pager({
  ref,
  children,
  initialPage = 0,
  renderTabBar,
  onPageSelected: parentOnPageSelected,
  onTabPressed: parentOnTabPressed,
  onPageScrollStateChanged: parentOnPageScrollStateChanged,
  testID,
}: React.PropsWithChildren<PagerProps>) {
  const [selectedPage, setSelectedPage] = useState(initialPage)
  const pagerView = useRef<PagerView>(null)

  useImperativeHandle(ref, () => ({
    setPage: (index: number) => {
      pagerView.current?.setPage(index)
    },
  }))

  const onPageSelectedJSThread = useCallback(
    (nextPosition: number) => {
      setSelectedPage(nextPosition)
      parentOnPageSelected?.(nextPosition)
    },
    [setSelectedPage, parentOnPageSelected],
  )

  const onTabBarSelect = useCallback(
    (index: number) => {
      parentOnTabPressed?.(index)
      pagerView.current?.setPage(index)
    },
    [pagerView, parentOnTabPressed],
  )

  const dragState = useSharedValue<'idle' | 'settling' | 'dragging'>('idle')
  const dragProgress = useSharedValue(selectedPage)
  const didInit = useSharedValue(false)

  const handlePageScroll = usePagerHandlers(
    {
      onPageScroll(e: PagerViewOnPageScrollEventData) {
        'worklet'
        if (didInit.get() === false) {
          // On iOS, there's a spurious scroll event with 0 position
          // even if a different page was supplied as the initial page.
          return
        }
        dragProgress.set(e.offset + e.position)
      },
      onPageScrollStateChanged(e: PageScrollStateChangedNativeEventData) {
        'worklet'
        if (dragState.get() === 'idle' && e.pageScrollState === 'settling') {
          // Programmatic scroll on Android — stay idle to match iOS
          return
        }
        dragState.set(e.pageScrollState)
        parentOnPageScrollStateChanged?.(e.pageScrollState)
      },
      onPageSelected(e: PagerViewOnPageSelectedEventData) {
        'worklet'
        didInit.set(true)
        runOnJS(onPageSelectedJSThread)(e.position)
      },
    },
    [parentOnPageScrollStateChanged],
  )

  return (
    <View testID={testID} style={{ flex: 1, overflow: 'hidden' }}>
      {renderTabBar({
        selectedPage,
        onSelect: onTabBarSelect,
        dragProgress,
        dragState,
      })}
      <MemoizedAnimatedPagerView
        ref={pagerView}
        style={{ flex: 1 }}
        initialPage={initialPage}
        onPageScroll={handlePageScroll}>
        {children}
      </MemoizedAnimatedPagerView>
    </View>
  )
}

// ─── usePagerHandlers (Reanimated UI-thread event handler) ───────────────────

function usePagerHandlers(
  handlers: {
    onPageScroll: (e: PagerViewOnPageScrollEventData) => void
    onPageScrollStateChanged: (e: PageScrollStateChangedNativeEventData) => void
    onPageSelected: (e: PagerViewOnPageSelectedEventData) => void
  },
  dependencies: unknown[],
) {
  const { doDependenciesDiffer } = useHandler(handlers as any, Platform.OS === 'web' ? dependencies : undefined)
  const subscribeForEvents = [
    'onPageScroll',
    'onPageScrollStateChanged',
    'onPageSelected',
  ]
  return useEvent(
    event => {
      'worklet'
      const { onPageScroll, onPageScrollStateChanged, onPageSelected } = handlers
      if (event.eventName.endsWith('onPageScroll')) {
        onPageScroll(event as any as PagerViewOnPageScrollEventData)
      } else if (event.eventName.endsWith('onPageScrollStateChanged')) {
        onPageScrollStateChanged(
          event as any as PageScrollStateChangedNativeEventData,
        )
      } else if (event.eventName.endsWith('onPageSelected')) {
        onPageSelected(event as any as PagerViewOnPageSelectedEventData)
      }
    },
    subscribeForEvents,
    doDependenciesDiffer,
  )
}
