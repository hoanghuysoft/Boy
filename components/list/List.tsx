/**
 * List — A high-performance Animated.FlatList wrapper
 *
 * Ported & adapted from Bluesky social-app:
 *   src/view/com/util/List.tsx         (native)
 *   src/view/com/util/Views.tsx        (FlatList_INTERNAL)
 *   src/lib/ScrollContext.tsx          (ScrollContext)
 *
 * What this does vs. plain FlatList:
 *  ① Scroll context — publishes animated scroll events via ScrollContext so
 *    parent screens can react to scroll without extra prop drilling.
 *  ② onScrolledDownChange — fires (once) when user crosses the 200px threshold,
 *    used to show/hide "Load latest" buttons.
 *  ③ onItemSeen — viewability callback (40% visible, 500ms dwell) for analytics
 *    or "mark as read" patterns.
 *  ④ headerOffset — automatically applies contentOffset + paddingTop so content
 *    sits under transparent headers without manual calculation.
 *  ⑤ Autoplay video hook — calls `onScrollSettled` via the scroll handler so
 *    the feed can activate the correct video after scroll stops. Wire up your
 *    video store in `onScrollSettled`.
 *  ⑥ Pull-to-refresh — rendered internally with themed tint color; pass
 *    `refreshing` + `onRefresh` props (no need to build RefreshControl yourself).
 *  ⑦ iOS scrolls-to-top — automatically disabled when a lightbox/modal is open
 *    (pass `disableScrollsToTop` prop to force off).
 *  ⑧ memo + forwardRef — fully memoised; ref exposes the underlying FlatList.
 */

import { forwardRef, memo, useMemo, type ReactElement } from 'react'
import {
  FlatList,
  Platform,
  RefreshControl,
  type FlatListProps,
  type StyleProp,
  type ViewStyle,
  type ViewToken,
} from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'
import { updateActiveVideoViewAsync } from '@bsky.app/video'

import { useDedupe } from './useDedupe'
import { useNonReactiveCallback } from './useNonReactiveCallback'
import { useScrollHandlers } from './ScrollContext'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ListMethods = FlatList

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ListProps<ItemT = any> = Omit<
  FlatListProps<ItemT>,
  /**
   * Omitted because the List manages these internally via the animated scroll
   * handler. Use ScrollContext (see below) to receive scroll events instead,
   * or use `onScrollSettled` for video autoplay.
   */
  | 'onScroll'
  | 'onMomentumScrollBegin'
  | 'onMomentumScrollEnd'
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
   * Ideal hook point for video autoplay: activate the topmost visible video
   * after the user stops flicking.
   *
   * Runs on the JS thread (via `runOnJS`).
   */
  onScrollSettled?: () => void

  /**
   * Called on every scroll frame with the current Y offset.
   * Runs on the JS thread; throttle with useDedupe if needed.
   */
  onScrollY?: (y: number) => void

  /**
   * tintColor for the pull-to-refresh spinner.
   * Defaults to the app's primary text color — pass your theme color here.
   */
  refreshTintColor?: string

  /**
   * progressViewOffset for pull-to-refresh on Android.
   * Useful when the list sits under a translucent status bar.
   */
  progressViewOffset?: number

  /**
   * progressBackgroundColor for pull-to-refresh on Android.
   */
  progressBackgroundColor?: string

  /**
   * Disable `scrollsToTop` (iOS only).
   * Set to true when a modal/lightbox is open so the status-bar tap doesn't
   * scroll the background list.
   */
  disableScrollsToTop?: boolean
}

export type ListRef = React.RefObject<FlatList | null>

// ─── Constants ───────────────────────────────────────────────────────────────

const IS_IOS = Platform.OS === 'ios'

/** Y offset in px that triggers onScrolledDownChange. */
const SCROLLED_DOWN_LIMIT = 200

// ─── AnimatedFlatList ─────────────────────────────────────────────────────────

/**
 * Animated.FlatList — the actual RN FlatList wrapped by Reanimated.
 * We memo it to avoid re-creating the Animated component on each render.
 */
const AnimatedFlatList = memo(Animated.FlatList) as any

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
    // Destructured outside the worklet closure, as per Bluesky's pattern:
    // https://github.com/bluesky-social/social-app/pull/4108
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
          runOnJS(onScrollY)(y)
        }

        // Toggle "scrolled down" flag
        const didScrollDown = y > SCROLLED_DOWN_LIMIT
        if (isScrolledDown.get() !== didScrollDown) {
          isScrolledDown.set(didScrollDown)
          if (onScrolledDownChange != null) {
            runOnJS(handleScrolledDownChange)(didScrollDown)
          }
        }

        // On iOS, also update video during scroll (throttled) for
        // smoother activation — matches Bluesky's iOS behavior exactly.
        // The definitive call happens at momentum/drag end below.
        if (IS_IOS) {
          runOnJS(dedupe)(updateActiveVideoViewAsync)
        }

        // Legacy settle callback for JS-side video logic
        if (IS_IOS && onScrollSettled) {
          runOnJS(dedupe)(handleScrollSettled)
        }
      },

      onEndDrag(e, ctx) {
        // Native video autoplay: tell @bsky.app/video to activate
        // the most visible BlueskyVideoView (same as Bluesky's List.tsx)
        runOnJS(updateActiveVideoViewAsync)()
        onEndDragFromContext?.(e, ctx)
        // Drag released without momentum (slow drag) — settle immediately
        if (onScrollSettled) {
          runOnJS(handleScrollSettled)()
        }
      },

      onMomentumEnd(e, ctx) {
        // Native video autoplay: activate most visible video after flick
        runOnJS(updateActiveVideoViewAsync)()
        onMomentumEndFromContext?.(e, ctx)
        // Flick finished — this is the primary fast-path for video autoplay
        if (onScrollSettled) {
          runOnJS(handleScrollSettled)()
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
          viewableItems: Array<ViewToken>
          changed: Array<ViewToken>
        }) => {
          for (const token of info.changed) {
            if (token.isViewable) {
              onItemSeen(token.item)
            }
          }
        },
        {
          /**
           * Item must be ≥40% visible (Bluesky uses 40% here, our FeedTab used 60%).
           * 40% works better for tall items that don't fully fit the viewport.
           */
          itemVisiblePercentThreshold: 40,
          /**
           * 500ms dwell time before the item is considered "seen".
           * Prevents rapid-scroll impressions from being counted.
           */
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
    // contentOffset shifts the initial scroll position so the list starts
    // below the header; paddingTop ensures items aren't hidden under it.
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
      <AnimatedFlatList
        showsVerticalScrollIndicator
        scrollEventThrottle={1}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        {...props}
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onScroll={scrollHandler as any}
        style={style}
        ref={ref}
      />
    )
  },
)

List.displayName = 'List'
List = memo(List) as typeof List

export { List }
