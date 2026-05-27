/**
 * PagerWithHeader — Collapsible header engine for tabbed screens
 *
 * Adapted from Bluesky: src/view/com/pager/PagerWithHeader.tsx
 *
 * Architecture:
 *  1. A single scrollY: SharedValue<number> is shared across ALL tabs.
 *  2. The header (rendered via `renderHeader`) slides up as the user scrolls.
 *  3. When the user swipes to another tab, all OTHER tabs' lists are silently
 *     scrollTo()'d on the UI thread to match the current header offset.
 *     → This is why the header never jumps when switching tabs.
 *  4. Each tab's list gets `headerOffset` (the total header height) as padding.
 *  5. The tab bar sits below the header and sticks at the top.
 */

import { type JSX, memo, useCallback, useEffect, useRef, useState } from 'react'
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type ScrollView,
  Platform,
  StyleSheet,
  View,
} from 'react-native'
import Animated, {
  type AnimatedRef,
  runOnUI,
  scrollTo,
  type SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import { ScrollProvider } from '@/components/list/ScrollContext'
import { Pager, type PagerRef, type RenderTabBarFnProps } from './Pager'
import { PagerHeaderProvider } from './PagerHeaderContext'

import type { ListMethods } from '@/components/list/List'

const IS_IOS = Platform.OS === 'ios'

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface PagerWithHeaderChildParams {
  headerHeight: number
  isFocused: boolean
  scrollElRef: React.MutableRefObject<ListMethods | ScrollView | null>
}

export interface PagerWithHeaderProps {
  ref?: React.Ref<PagerRef>
  testID?: string
  children:
    | (((props: PagerWithHeaderChildParams) => JSX.Element) | null)[]
    | ((props: PagerWithHeaderChildParams) => JSX.Element)
  items: string[]
  isHeaderReady: boolean
  renderHeader?: ({
    setMinimumHeight,
  }: {
    setMinimumHeight: (height: number) => void
  }) => JSX.Element
  renderTabBar?: (props: {
    items: string[]
    currentPage: number
    onSelect?: (index: number) => void
    dragProgress: SharedValue<number>
    dragState: SharedValue<'idle' | 'dragging' | 'settling'>
  }) => JSX.Element
  initialPage?: number
  onPageSelected?: (index: number) => void
  onCurrentPageSelected?: (index: number) => void
  allowHeaderOverScroll?: boolean
}

// ─── PagerWithHeader ────────────────────────────────────────────────────────────

export function PagerWithHeader({
  ref,
  children,
  testID,
  items,
  isHeaderReady,
  renderHeader,
  renderTabBar: renderTabBarProp,
  initialPage,
  onPageSelected,
  onCurrentPageSelected,
  allowHeaderOverScroll,
}: PagerWithHeaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage ?? 0)
  const [tabBarHeight, setTabBarHeight] = useState(0)
  const [headerOnlyHeight, setHeaderOnlyHeight] = useState(0)
  const scrollY = useSharedValue(0)
  const headerHeight = headerOnlyHeight + tabBarHeight

  // Capture the tab bar sizing
  const onTabBarLayout = useCallback((evt: LayoutChangeEvent) => {
    const height = evt.nativeEvent.layout.height
    if (height > 0) {
      setTabBarHeight(Math.round(height * 2) / 2)
    }
  }, [])

  const onHeaderOnlyLayout = useCallback((height: number) => {
    if (height > 0) {
      setHeaderOnlyHeight(Math.round(height * 2) / 2)
    }
  }, [])

  const renderTabBarFn = useCallback(
    (props: RenderTabBarFnProps) => {
      return (
        <PagerHeaderProvider scrollY={scrollY} headerHeight={headerOnlyHeight}>
          <PagerTabBar
            headerOnlyHeight={headerOnlyHeight}
            items={items}
            isHeaderReady={isHeaderReady}
            renderHeader={renderHeader}
            renderTabBar={renderTabBarProp}
            currentPage={currentPage}
            onCurrentPageSelected={onCurrentPageSelected}
            onTabBarLayout={onTabBarLayout}
            onHeaderOnlyLayout={onHeaderOnlyLayout}
            onSelect={props.onSelect}
            scrollY={scrollY}
            testID={testID}
            allowHeaderOverScroll={allowHeaderOverScroll}
            dragProgress={props.dragProgress}
            dragState={props.dragState}
          />
        </PagerHeaderProvider>
      )
    },
    [
      headerOnlyHeight,
      items,
      isHeaderReady,
      renderHeader,
      renderTabBarProp,
      currentPage,
      onCurrentPageSelected,
      onTabBarLayout,
      onHeaderOnlyLayout,
      scrollY,
      testID,
      allowHeaderOverScroll,
    ],
  )

  // Track scroll refs for all tabs (UI thread accessible)
  const scrollRefs = useSharedValue<Array<AnimatedRef<any> | null>>([])
  const registerRef = useCallback(
    (scrollRef: AnimatedRef<any> | null, atIndex: number) => {
      scrollRefs.modify(refs => {
        'worklet'
        refs[atIndex] = scrollRef
        return refs
      })
    },
    [scrollRefs],
  )

  // When switching tabs, sync other tabs' scroll positions to match current header offset
  const lastForcedScrollY = useSharedValue(0)
  const adjustScrollForOtherPages = useCallback(
    (scrollState: 'idle' | 'dragging' | 'settling') => {
      'worklet'
      if (scrollState !== 'dragging') return
      const currentScrollY = scrollY.get()
      const forcedScrollY = Math.min(currentScrollY, headerOnlyHeight)
      if (lastForcedScrollY.get() !== forcedScrollY) {
        lastForcedScrollY.set(forcedScrollY)
        const refs = scrollRefs.get()
        for (let i = 0; i < refs.length; i++) {
          const scrollRef = refs[i]
          if (i !== currentPage && scrollRef != null) {
            scrollTo(scrollRef, 0, forcedScrollY, false)
          }
        }
      }
    },
    [currentPage, headerOnlyHeight, lastForcedScrollY, scrollRefs, scrollY],
  )

  // When the focused tab scrolls, update the shared scrollY
  const onScrollWorklet = useCallback(
    (e: NativeScrollEvent) => {
      'worklet'
      const nextScrollY = e.contentOffset.y
      // HACK from Bluesky: onScroll reports -headerHeight on load sometimes
      const isPossiblyInvalid =
        headerHeight > 0 && Math.round(nextScrollY * 2) / 2 === -headerHeight
      if (!isPossiblyInvalid) {
        scrollY.set(nextScrollY)
      }
    },
    [scrollY, headerHeight],
  )

  const onPageSelectedInner = useCallback(
    (index: number) => {
      setCurrentPage(index)
      onPageSelected?.(index)
    },
    [onPageSelected, setCurrentPage],
  )

  const onTabPressed = useCallback(() => {
    runOnUI(adjustScrollForOtherPages)('dragging')
  }, [adjustScrollForOtherPages])

  return (
    <Pager
      ref={ref}
      testID={testID}
      initialPage={initialPage}
      onTabPressed={onTabPressed}
      onPageSelected={onPageSelectedInner}
      renderTabBar={renderTabBarFn}
      onPageScrollStateChanged={adjustScrollForOtherPages}>
      {toArray(children)
        .filter(Boolean)
        .map((child, i) => {
          const isReady =
            isHeaderReady && headerOnlyHeight > 0 && tabBarHeight > 0
          return (
            <View key={i} collapsable={false}>
              <PagerItem
                headerHeight={headerHeight}
                index={i}
                isReady={isReady}
                isFocused={i === currentPage}
                onScrollWorklet={i === currentPage ? onScrollWorklet : noop}
                registerRef={registerRef}
                renderTab={child}
              />
            </View>
          )
        })}
    </Pager>
  )
}

// ─── PagerTabBar ────────────────────────────────────────────────────────────────

let PagerTabBar = ({
  currentPage,
  headerOnlyHeight,
  isHeaderReady,
  items,
  scrollY,
  testID,
  renderHeader,
  renderTabBar,
  onHeaderOnlyLayout,
  onTabBarLayout,
  onCurrentPageSelected,
  onSelect,
  allowHeaderOverScroll,
  dragProgress,
  dragState,
}: {
  currentPage: number
  headerOnlyHeight: number
  isHeaderReady: boolean
  items: string[]
  testID?: string
  scrollY: SharedValue<number>
  renderHeader?: ({
    setMinimumHeight,
  }: {
    setMinimumHeight: (height: number) => void
  }) => JSX.Element
  renderTabBar?: (props: {
    items: string[]
    currentPage: number
    onSelect?: (index: number) => void
    dragProgress: SharedValue<number>
    dragState: SharedValue<'idle' | 'dragging' | 'settling'>
  }) => JSX.Element
  onHeaderOnlyLayout: (height: number) => void
  onTabBarLayout: (e: LayoutChangeEvent) => void
  onCurrentPageSelected?: (index: number) => void
  onSelect?: (index: number) => void
  allowHeaderOverScroll?: boolean
  dragProgress: SharedValue<number>
  dragState: SharedValue<'idle' | 'dragging' | 'settling'>
}): React.ReactNode => {
  const [minimumHeaderHeight, setMinimumHeaderHeight] = useState(0)
  const headerTransform = useAnimatedStyle(() => {
    const translateY =
      Math.min(
        scrollY.get(),
        Math.max(headerOnlyHeight - minimumHeaderHeight, 0),
      ) * -1
    return {
      transform: [
        {
          translateY: allowHeaderOverScroll
            ? translateY
            : Math.min(translateY, 0),
        },
      ],
    }
  })

  const headerRef = useRef<View>(null)
  const fallbackHeaderOnlyHeight = useRef(0)

  return (
    <Animated.View
      pointerEvents={IS_IOS ? 'auto' : 'box-none'}
      style={[styles.tabBarMobile, headerTransform]}>
      <View
        ref={headerRef}
        pointerEvents={IS_IOS ? 'auto' : 'box-none'}
        collapsable={false}
        onLayout={(e: LayoutChangeEvent) => {
          if (isHeaderReady) {
            fallbackHeaderOnlyHeight.current = e.nativeEvent.layout.height
          }
        }}>
        {renderHeader?.({ setMinimumHeight: setMinimumHeaderHeight })}
        {isHeaderReady && (
          <View
            collapsable={false}
            onLayout={() => {
              headerRef.current?.measure(
                (_x: number, _y: number, _width: number, height: number) => {
                  if (height !== undefined) {
                    onHeaderOnlyLayout(height)
                  } else {
                    onHeaderOnlyLayout(fallbackHeaderOnlyHeight.current)
                  }
                },
              )
            }}
          />
        )}
      </View>
      <View
        onLayout={onTabBarLayout}
        style={{
          opacity: isHeaderReady ? 1 : 0,
          pointerEvents: isHeaderReady ? 'auto' : 'none',
        }}>
        {renderTabBar
          ? renderTabBar({
              items,
              currentPage,
              onSelect,
              dragProgress,
              dragState,
            })
          : null}
      </View>
    </Animated.View>
  )
}
PagerTabBar = memo(PagerTabBar)

// ─── PagerItem ──────────────────────────────────────────────────────────────────

function PagerItem({
  headerHeight,
  index,
  isReady,
  isFocused,
  onScrollWorklet,
  renderTab,
  registerRef,
}: {
  headerHeight: number
  index: number
  isFocused: boolean
  isReady: boolean
  registerRef: (scrollRef: AnimatedRef<any> | null, atIndex: number) => void
  onScrollWorklet: (e: NativeScrollEvent) => void
  renderTab: ((props: PagerWithHeaderChildParams) => JSX.Element) | null
}) {
  const scrollElRef = useAnimatedRef()

  useEffect(() => {
    registerRef(scrollElRef, index)
    return () => {
      registerRef(null, index)
    }
  }, [scrollElRef, registerRef, index])

  if (!isReady || renderTab == null) {
    return null
  }

  return (
    <ScrollProvider onScroll={onScrollWorklet}>
      {renderTab({
        headerHeight,
        isFocused,
        scrollElRef: scrollElRef as React.MutableRefObject<
          ListMethods | ScrollView | null
        >,
      })}
    </ScrollProvider>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBarMobile: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    left: 0,
    width: '100%',
  },
})

// ─── Helpers ────────────────────────────────────────────────────────────────────

function noop() {
  'worklet'
}

function toArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v)) {
    return v
  }
  return [v]
}
