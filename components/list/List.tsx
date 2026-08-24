/**
 * List — A high-performance Animated LegendList wrapper
 *
 * Replaces FlatList & FlashList with @legendapp/list (Legend List)
 * for superior performance with dynamically sized items, 100% TS JS-based
 * virtualization, and smooth scroll handling with Reanimated & worklets.
 *
 * What this does:
 *  ① LegendList Virtualization — zero-native-dependency ultra fast dynamic list.
 *  ② Scroll context — publishes animated scroll events via ScrollContext so
 *    parent screens can react to scroll without extra prop drilling.
 *  ③ onScrolledDownChange — fires (once) when user crosses the 200px threshold,
 *    used to show/hide "Load latest" buttons.
 *  ④ onItemSeen — viewability callback (40% visible, 500ms dwell) for analytics
 *    or "mark as read" patterns.
 *  ⑤ headerOffset — automatically applies contentOffset + paddingTop so content
 *    sits under transparent headers without manual calculation.
 *  ⑥ Autoplay video hook — calls `updateActiveVideoViewAsync` and `onScrollSettled`
 *    via the worklet scroll handler so the feed can activate the correct video.
 *  ⑦ Pull-to-refresh — rendered internally with themed tint color; pass
 *    `refreshing` + `onRefresh` props.
 *  ⑧ iOS scrolls-to-top — automatically disabled when a lightbox/modal is open.
 *  ⑨ memo + forwardRef — fully memoised; ref exposes the underlying LegendList.
 */

import { updateActiveVideoViewAsync } from '@bsky.app/video'
import {
  AnimatedLegendList,
  type AnimatedLegendListProps,
} from '@legendapp/list/reanimated'
import type { LegendListRef } from '@legendapp/list/react-native'
import { forwardRef, memo, useEffect, useMemo, useRef, type ReactElement } from 'react'
import {
  Platform,
  RefreshControl,
  type ViewToken
} from 'react-native'
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'

import { useScrollHandlers } from './ScrollContext'
import { useDedupe } from './useDedupe'
import { useNonReactiveCallback } from './useNonReactiveCallback'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ListMethods = LegendListRef

export type ListProps<ItemT = any> = Omit<
  AnimatedLegendListProps<ItemT>,
  /**
   * Omitted because the List manages these internally via the animated scroll
   * handler. Use ScrollContext (see below) to receive scroll events instead,
   * or use `onScrollSettled` for video autoplay.
   */
  | 'onMomentumScrollBegin'
  | 'onMomentumScrollEnd'
  | 'onScroll'
  | 'onScrollBeginDrag'
  | 'onScrollEndDrag'
  /**
   * Omitted — pass `refreshing` + `onRefresh` as top-level props instead.
   * The List renders a themed RefreshControl automatically.
   */
  | 'refreshControl'
  /**
   * Omitted — pass `headerOffset` instead.
   */
  | 'contentOffset'
> & {
  /**
   * Called once when the list crosses the 200px scroll threshold (up or down).
   * Use this to toggle "Load latest" / "Scroll to top" CTAs.
   */
  onScrolledDownChange?: (isScrolledDown: boolean) => void

  /**
   * Height of any transparent/overlapping header above the list.
   * Sets `contentOffset` and `paddingTop` automatically.
   */
  headerOffset?: number

  /** Pull-to-refresh state. */
  refreshing?: boolean

  /** Pull-to-refresh callback. */
  onRefresh?: () => void

  /**
   * Called when an item has been visible (≥40% height) for at least 500ms.
   * Use for analytics, "mark as read", or impression tracking.
   */
  onItemSeen?: (item: ItemT) => void

  /**
   * Called when the list has stopped scrolling (momentum end or drag end).
   * Runs on the JS thread.
   */
  onScrollSettled?: () => void

  /**
   * Called on every scroll frame with the current Y offset.
   * Runs on the JS thread.
   */
  onScrollY?: (y: number) => void

  /**
   * tintColor for the pull-to-refresh spinner.
   */
  refreshTintColor?: string

  /**
   * progressViewOffset for pull-to-refresh on Android.
   */
  progressViewOffset?: number

  /**
   * progressBackgroundColor for pull-to-refresh on Android.
   */
  progressBackgroundColor?: string

  /**
   * Disable `scrollsToTop` (iOS only).
   */
  disableScrollsToTop?: boolean
}

export type ListRef = React.RefObject<LegendListRef | null>

// ─── Constants ───────────────────────────────────────────────────────────────

const IS_IOS = Platform.OS === 'ios'

/** Y offset in px that triggers onScrolledDownChange. */
const SCROLLED_DOWN_LIMIT = 200

// ─── List ─────────────────────────────────────────────────────────────────────

let List = forwardRef<ListMethods, ListProps>(
  (
    {
      onScrolledDownChange,
      refreshing,
      onRefresh,
      onItemSeen,
      onScrollSettled,
      onScrollY,
      headerOffset,
      style,
      refreshTintColor = '#ffffff',
      progressBackgroundColor,
      progressViewOffset,
      disableScrollsToTop = false,
      automaticallyAdjustsScrollIndicatorInsets = false,
      estimatedItemSize = 100,
      recycleItems = true,
      maintainVisibleContentPosition = true,
      ...props
    },
    ref,
  ) => {
    // ─── Scroll-down detection (shared value lives on the UI thread) ──────
    const isScrolledDown = useSharedValue(false)

    const handleScrolledDownChange = useNonReactiveCallback(
      (didScrollDown: boolean) => {
        onScrolledDownChange?.(didScrollDown)
      },
    )

    // ─── Dedupe for iOS video updates during scroll ───────────────────────
    const dedupe = useDedupe(400)

    // ─── Settle callback (runs on JS thread after scroll ends) ────────────
    const handleScrollSettled = useNonReactiveCallback(() => {
      onScrollSettled?.()
    })

    // ─── ScrollContext integration (PagerWithHeader uses this) ─────────
    const {
      onBeginDrag: onBeginDragFromContext,
      onEndDrag: onEndDragFromContext,
      onScroll: onScrollFromContext,
      onMomentumEnd: onMomentumEndFromContext,
    } = useScrollHandlers()

    // ─── Animated scroll handler (runs on UI thread) ──────────────────────
    const scrollHandler = useAnimatedScrollHandler({
      onBeginDrag(e, ctx) {
        onBeginDragFromContext?.(e, ctx)
      },

      onScroll(e, ctx) {
        // Forward to PagerWithHeader's scroll tracker
        onScrollFromContext?.(e, ctx)

        const y = e.contentOffset.y

        // Notify JS thread of raw Y offset if requested
        if (onScrollY) {
          scheduleOnRN(onScrollY, y)
        }

        // Toggle "scrolled down" flag
        const didScrollDown = y > SCROLLED_DOWN_LIMIT
        if (isScrolledDown.get() !== didScrollDown) {
          isScrolledDown.set(didScrollDown)
          if (onScrolledDownChange != null) {
            scheduleOnRN(handleScrolledDownChange, didScrollDown)
          }
        }

        // On iOS, also update video during scroll (throttled)
        if (IS_IOS) {
          scheduleOnRN(dedupe, updateActiveVideoViewAsync)
        }
      },

      onEndDrag(e, ctx) {
        scheduleOnRN(updateActiveVideoViewAsync)
        onEndDragFromContext?.(e, ctx)
        if (onScrollSettled) {
          scheduleOnRN(handleScrollSettled)
        }
      },

      onMomentumEnd(e, ctx) {
        scheduleOnRN(updateActiveVideoViewAsync)
        onMomentumEndFromContext?.(e, ctx)
        if (onScrollSettled) {
          scheduleOnRN(handleScrollSettled)
        }
      },
    })

    // ─── onItemSeen viewability ───────────────────────────────────────────
    const [onViewableItemsChanged, viewabilityConfig] = useMemo(() => {
      if (!onItemSeen) {
        return [undefined, undefined]
      }
      return [
        (info: {
          viewableItems: ViewToken[]
          changed: ViewToken[]
        }) => {
          for (const token of info.changed) {
            if (token.isViewable) {
              onItemSeen(token.item)
            }
          }
        },
        {
          itemVisiblePercentThreshold: 40,
          minimumViewTime: 500,
        },
      ]
    }, [onItemSeen])

    // ─── Pull-to-refresh control ──────────────────────────────────────────
    let refreshControl: ReactElement<any> | undefined
    if (refreshing !== undefined || onRefresh !== undefined) {
      refreshControl = (
        <RefreshControl
          refreshing={refreshing ?? false}
          onRefresh={onRefresh}
          tintColor={refreshTintColor}
          colors={[refreshTintColor]}
          progressBackgroundColor={progressBackgroundColor}
          progressViewOffset={progressViewOffset ?? headerOffset}
        />
      )
    }

    // ─── Header offset ────────────────────────────────────────────────────
    let contentOffset: { x: number; y: number } | undefined
    let adjustedContentContainerStyle = props.contentContainerStyle
    if (headerOffset != null) {
      adjustedContentContainerStyle = [
        props.contentContainerStyle,
        { paddingTop: headerOffset },
      ] as any
      contentOffset = { x: 0, y: -headerOffset }
    }

    return (
      <AnimatedLegendList
        showsVerticalScrollIndicator
        scrollEventThrottle={1}
        recycleItems={recycleItems}
        estimatedItemSize={estimatedItemSize}
        maintainVisibleContentPosition={maintainVisibleContentPosition}
        onViewableItemsChanged={(props as any).onViewableItemsChanged ?? onViewableItemsChanged}
        viewabilityConfig={(props as any).viewabilityConfig ?? viewabilityConfig}
        {...(props as any)}
        // iOS: disable tap-status-bar-to-scroll-top when modal is open
        scrollsToTop={IS_IOS ? !disableScrollsToTop : undefined}
        automaticallyAdjustsScrollIndicatorInsets={
          automaticallyAdjustsScrollIndicatorInsets
        }
        scrollIndicatorInsets={{
          top: headerOffset,
          right: 1,
          ...props.scrollIndicatorInsets,
        }}
        contentOffset={contentOffset}
        contentContainerStyle={adjustedContentContainerStyle}
        refreshControl={refreshControl}
        onScroll={scrollHandler as any}
        style={style}
        ref={ref as any}
      />
    )
  },
)

List.displayName = 'List'
List = memo(List) as typeof List

export { List }
