import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  clamp,
  Easing,
  Extrapolation,
  interpolate,
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

const TIMING_CONFIG = {
  duration: 240,
  easing: Easing.out(Easing.cubic),
};

const OPEN_SPRING = {
  duration: 340,
  dampingRatio: 0.94,
  reduceMotion: ReduceMotion.System,
};

const DISMISS_PROGRESS_SPRING = {
  duration: 320,
  dampingRatio: 0.95,
  reduceMotion: ReduceMotion.System,
};

const FALLBACK_TIMING = {
  duration: 220,
  easing: Easing.bezier(0.23, 1, 0.32, 1),
  reduceMotion: ReduceMotion.System,
};

export interface Size {
  width: number;
  height: number;
}

export interface SourceRect {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
}

export interface ZoomableGalleryState {
  containerSize: Size;
  childSize: Size;
  maxScale: number;
  translateX: number;
  translateY: number;
  scale: number;
}

export interface ZoomableGalleryRef {
  setIndex: (index: number) => void;
  reset: (animate?: boolean) => void;
  getState: () => ZoomableGalleryState;
  dismiss: () => void;
}

export interface ZoomableGalleryProps<T = unknown> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  keyExtractor?: (item: T, index: number) => string;
  initialIndex?: number;
  windowSize?: number;
  maxScale?: number;
  minScale?: number;
  zoomEnabled?: boolean;
  onIndexChange?: (index: number) => void;
  onTap?: () => void;
  onDismiss?: () => void;
  animateTransitions?: boolean;
  sourceRect?: SourceRect | null;
  initialChildSize?: Size;
  backdropOpacity?: SharedValue<number>;
  overlayOpacity?: SharedValue<number>;
  onOpenAnimationStart?: () => void;
  onBeforeDismissComplete?: () => void;
}

export const fitContainer = (aspectRatio: number, container: Size): Size => {
  'worklet';

  let width = container.width;
  let height = container.width / aspectRatio;

  if (height > container.height) {
    width = container.height * aspectRatio;
    height = container.height;
  }

  return { width, height };
};

const computeBounds = (
  scaleVal: number,
  childW: number,
  childH: number,
  containerW: number,
  containerH: number
) => {
  'worklet';

  const effectiveW = childW > 0 ? childW : containerW;
  const effectiveH = childH > 0 ? childH : containerH;

  return {
    x: Math.max(0, effectiveW * scaleVal - containerW) / 2,
    y: Math.max(0, effectiveH * scaleVal - containerH) / 2,
  };
};

const applyRubberBand = (value: number, min: number, max: number) => {
  'worklet';

  if (value < min) {
    return Math.max(min * 0.65, min - (min - value) * 0.35);
  }
  if (value > max) {
    return Math.min(max * 1.35, max + (value - max) * 0.35);
  }
  return value;
};

const isSourceRectOnScreen = (
  hasRect: boolean,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  rw: number,
  rh: number
) => {
  'worklet';

  return (
    hasRect &&
    sw > 0 &&
    sh > 0 &&
    rw > 0 &&
    rh > 0 &&
    sx + sw > 0 &&
    sx < rw &&
    sy + sh > 0 &&
    sy < rh
  );
};

const computeSharedMorph = (
  p: number,
  srcX: number,
  srcY: number,
  srcW: number,
  srcH: number,
  srcR: number,
  rootW: number,
  rootH: number,
  childW: number,
  childH: number
) => {
  'worklet';

  const pClamped = clamp(p, 0, 1);
  const safeChildW = childW > 0 ? childW : Math.max(rootW, 1);
  const safeChildH = childH > 0 ? childH : Math.max(rootH, 1);

  const fromTx = srcX + srcW / 2 - rootW / 2;
  const fromTy = srcY + srcH / 2 - rootH / 2;
  const fromClipScaleX = srcW / safeChildW;
  const fromClipScaleY = srcH / safeChildH;
  const coverScale = Math.max(fromClipScaleX, fromClipScaleY);

  return {
    tx: fromTx * (1 - p),
    ty: fromTy * (1 - p),
    clipScaleX: Math.max(
      0.001,
      fromClipScaleX + (1 - fromClipScaleX) * pClamped
    ),
    clipScaleY: Math.max(
      0.001,
      fromClipScaleY + (1 - fromClipScaleY) * pClamped
    ),
    visualScale: Math.max(0.001, coverScale + (1 - coverScale) * pClamped),
    radius: Math.max(0, srcR * (1 - pClamped)),
  };
};

interface GalleryPageItemProps<T> {
  item: T;
  index: number;
  zIndex: number;
  startIndex: number;
  initialChildSize?: Size;
  renderItem: (item: T, index: number) => React.ReactElement;
  activeIndex: SharedValue<number>;
  scroll: SharedValue<number>;
  isScrolling: SharedValue<boolean>;
  rootWidth: SharedValue<number>;
  rootHeight: SharedValue<number>;
  activeChildWidth: SharedValue<number>;
  activeChildHeight: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  pullTranslateX: SharedValue<number>;
  pullTranslateY: SharedValue<number>;
  scale: SharedValue<number>;
  transitionMode: SharedValue<number>;
  openProgress: SharedValue<number>;
  sourceX: SharedValue<number>;
  sourceY: SharedValue<number>;
  sourceW: SharedValue<number>;
  sourceH: SharedValue<number>;
  sourceRadius: SharedValue<number>;
  hasSourceRect: SharedValue<boolean>;
  dismissProgress: SharedValue<number>;
  dismissTx: SharedValue<number>;
  dismissTy: SharedValue<number>;
  dismissStartClipScaleX: SharedValue<number>;
  dismissStartClipScaleY: SharedValue<number>;
  dismissStartVisualScale: SharedValue<number>;
  dismissStartRadius: SharedValue<number>;
  dismissUseSharedElement: SharedValue<boolean>;
  reducedMotionVal: SharedValue<boolean>;
}

function GalleryPageItemInner<T>({
  item,
  index,
  zIndex,
  startIndex,
  initialChildSize,
  renderItem,
  activeIndex,
  scroll,
  isScrolling,
  rootWidth,
  rootHeight,
  activeChildWidth,
  activeChildHeight,
  translateX,
  translateY,
  pullTranslateX,
  pullTranslateY,
  scale,
  transitionMode,
  openProgress,
  sourceX,
  sourceY,
  sourceW,
  sourceH,
  sourceRadius,
  hasSourceRect,
  dismissProgress,
  dismissTx,
  dismissTy,
  dismissStartClipScaleX,
  dismissStartClipScaleY,
  dismissStartVisualScale,
  dismissStartRadius,
  dismissUseSharedElement,
  reducedMotionVal,
}: GalleryPageItemProps<T>) {
  const seedW =
    index === startIndex && initialChildSize ? initialChildSize.width : 0;
  const seedH =
    index === startIndex && initialChildSize ? initialChildSize.height : 0;
  const itemWidth = useSharedValue(seedW);
  const itemHeight = useSharedValue(seedH);

  const measureChild = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      itemWidth.value = width;
      itemHeight.value = height;
      if (index === activeIndex.value) {
        activeChildWidth.value = width;
        activeChildHeight.value = height;
      }
    },
    [index, activeIndex, activeChildWidth, activeChildHeight, itemWidth, itemHeight]
  );

  useAnimatedReaction(
    () => ({
      isActive: activeIndex.value === index,
      w: itemWidth.value,
      h: itemHeight.value,
    }),
    (curr) => {
      if (curr.isActive && curr.w > 0 && curr.h > 0) {
        activeChildWidth.value = curr.w;
        activeChildHeight.value = curr.h;
      }
    }
  );

  const transitionStyle = useAnimatedStyle(() => {
    const active = activeIndex.value;
    if (index < active - 1 || index > active + 1) {
      return {
        opacity: 0,
        transform: [{ translateX: 0 }, { scale: 0 }],
      };
    }

    const w = rootWidth.value;
    const s = scroll.value;
    let tx = index * w - s;
    let opacity = 1;
    let itemScale = 1;

    if (index !== active && !isScrolling.value) {
      itemScale = 0;
    }

    const isCurrent = index === active;
    const isNext = index === active + 1;
    if (isNext || (isCurrent && s < index * w)) {
      opacity =
        w > 0
          ? interpolate(
              s,
              [(index - 1) * w, index * w],
              [0, 1],
              Extrapolation.CLAMP
            )
          : isCurrent
            ? 1
            : 0;
      itemScale = 0.75 + 0.25 * opacity;
      tx = 0;
    }

    return {
      opacity,
      transform: [{ translateX: tx }, { scale: itemScale }],
    };
  });

  const clipStyle = useAnimatedStyle(() => {
    if (index !== activeIndex.value) {
      return {
        overflow: 'hidden',
        borderRadius: 0,
        opacity: 1,
        transform: [
          { translateX: 0 },
          { translateY: 0 },
          { scaleX: 1 },
          { scaleY: 1 },
        ],
      };
    }

    const mode = transitionMode.value;
    const rw = rootWidth.value;
    const rh = rootHeight.value;
    const childW = itemWidth.value > 0 ? itemWidth.value : rw;
    const childH = itemHeight.value > 0 ? itemHeight.value : rh;
    const isReduced = reducedMotionVal.value;

    if (mode === 0) {
      const onScreen = isSourceRectOnScreen(
        hasSourceRect.value,
        sourceX.value,
        sourceY.value,
        sourceW.value,
        sourceH.value,
        rw,
        rh
      );

      if (onScreen && !isReduced) {
        const m = computeSharedMorph(
          openProgress.value,
          sourceX.value,
          sourceY.value,
          sourceW.value,
          sourceH.value,
          sourceRadius.value,
          rw,
          rh,
          childW,
          childH
        );
        const maxClipScale = Math.max(m.clipScaleX, m.clipScaleY, 0.001);
        return {
          overflow: 'hidden',
          borderRadius: m.radius / maxClipScale,
          opacity: 1,
          transform: [
            { translateX: m.tx },
            { translateY: m.ty },
            { scaleX: m.clipScaleX },
            { scaleY: m.clipScaleY },
          ],
        };
      }

      const pClamped = clamp(openProgress.value, 0, 1);
      const s = isReduced ? 1 : 0.94 + 0.06 * openProgress.value;
      return {
        overflow: 'hidden',
        borderRadius: 0,
        opacity: pClamped,
        transform: [
          { translateX: 0 },
          { translateY: 0 },
          { scaleX: s },
          { scaleY: s },
        ],
      };
    }

    if (mode === 2) {
      const d = clamp(dismissProgress.value, 0, 1);

      if (dismissUseSharedElement.value) {
        const safeChildW = childW > 0 ? childW : Math.max(rw, 1);
        const safeChildH = childH > 0 ? childH : Math.max(rh, 1);
        const targetClipScaleX = sourceW.value / safeChildW;
        const targetClipScaleY = sourceH.value / safeChildH;
        const targetRadius = sourceRadius.value;

        const clipScaleX = Math.max(
          0.001,
          dismissStartClipScaleX.value +
            (targetClipScaleX - dismissStartClipScaleX.value) * d
        );
        const clipScaleY = Math.max(
          0.001,
          dismissStartClipScaleY.value +
            (targetClipScaleY - dismissStartClipScaleY.value) * d
        );
        const curRadius = Math.max(
          0,
          dismissStartRadius.value + (targetRadius - dismissStartRadius.value) * d
        );
        const maxClipScale = Math.max(clipScaleX, clipScaleY, 0.001);

        return {
          overflow: 'hidden',
          borderRadius: curRadius / maxClipScale,
          opacity: 1,
          transform: [
            { translateX: dismissTx.value },
            { translateY: dismissTy.value },
            { scaleX: clipScaleX },
            { scaleY: clipScaleY },
          ],
        };
      }

      const s = isReduced
        ? dismissStartVisualScale.value
        : Math.max(0.001, dismissStartVisualScale.value * (1 - 0.12 * d));
      return {
        overflow: 'hidden',
        borderRadius: dismissStartRadius.value / Math.max(s, 0.001),
        opacity: 1 - d,
        transform: [
          { translateX: dismissTx.value },
          { translateY: dismissTy.value },
          { scaleX: s },
          { scaleY: s },
        ],
      };
    }

    const dragDist = Math.abs(pullTranslateY.value);
    const dragScale = interpolate(dragDist, [0, 320], [1, 0.72], Extrapolation.CLAMP);
    const dragRadius = interpolate(dragDist, [0, 120], [0, 20], Extrapolation.CLAMP);
    const totalScale = Math.max(0.001, scale.value * dragScale);

    return {
      overflow: 'hidden',
      borderRadius: dragRadius / totalScale,
      opacity: 1,
      transform: [
        { translateX: translateX.value + pullTranslateX.value },
        { translateY: translateY.value + pullTranslateY.value },
        { scaleX: totalScale },
        { scaleY: totalScale },
      ],
    };
  });

  const innerImageStyle = useAnimatedStyle(() => {
    if (index !== activeIndex.value) {
      return {
        transform: [{ scaleX: 1 }, { scaleY: 1 }],
      };
    }

    const mode = transitionMode.value;
    const rw = rootWidth.value;
    const rh = rootHeight.value;
    const childW = itemWidth.value > 0 ? itemWidth.value : rw;
    const childH = itemHeight.value > 0 ? itemHeight.value : rh;
    const isReduced = reducedMotionVal.value;

    if (mode === 0) {
      const onScreen = isSourceRectOnScreen(
        hasSourceRect.value,
        sourceX.value,
        sourceY.value,
        sourceW.value,
        sourceH.value,
        rw,
        rh
      );
      if (onScreen && !isReduced) {
        const m = computeSharedMorph(
          openProgress.value,
          sourceX.value,
          sourceY.value,
          sourceW.value,
          sourceH.value,
          sourceRadius.value,
          rw,
          rh,
          childW,
          childH
        );
        return {
          transform: [
            { scaleX: m.visualScale / m.clipScaleX },
            { scaleY: m.visualScale / m.clipScaleY },
          ],
        };
      }
      return {
        transform: [{ scaleX: 1 }, { scaleY: 1 }],
      };
    }

    if (mode === 2 && dismissUseSharedElement.value) {
      const d = clamp(dismissProgress.value, 0, 1);
      const safeChildW = childW > 0 ? childW : Math.max(rw, 1);
      const safeChildH = childH > 0 ? childH : Math.max(rh, 1);
      const targetClipScaleX = sourceW.value / safeChildW;
      const targetClipScaleY = sourceH.value / safeChildH;
      const targetVisualScale = Math.max(targetClipScaleX, targetClipScaleY);

      const clipScaleX = Math.max(
        0.001,
        dismissStartClipScaleX.value +
          (targetClipScaleX - dismissStartClipScaleX.value) * d
      );
      const clipScaleY = Math.max(
        0.001,
        dismissStartClipScaleY.value +
          (targetClipScaleY - dismissStartClipScaleY.value) * d
      );
      const visualScale = Math.max(
        0.001,
        dismissStartVisualScale.value +
          (targetVisualScale - dismissStartVisualScale.value) * d
      );

      return {
        transform: [
          { scaleX: visualScale / clipScaleX },
          { scaleY: visualScale / clipScaleY },
        ],
      };
    }

    return {
      transform: [{ scaleX: 1 }, { scaleY: 1 }],
    };
  });

  return (
    <Animated.View
      testID={`child-${index}`}
      style={[styles.pageItem, { zIndex }, transitionStyle]}
    >
      <Animated.View style={clipStyle}>
        <Animated.View style={innerImageStyle} onLayout={measureChild}>
          {renderItem(item, index)}
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const GalleryPageItem = React.memo(
  GalleryPageItemInner,
  (prev, next) =>
    prev.item === next.item &&
    prev.index === next.index &&
    prev.zIndex === next.zIndex &&
    prev.renderItem === next.renderItem
) as typeof GalleryPageItemInner;

function ZoomableGalleryInner<T>(
  {
    data,
    renderItem,
    keyExtractor,
    initialIndex = 0,
    windowSize = 5,
    maxScale = 3,
    minScale = 1,
    zoomEnabled = true,
    onIndexChange,
    onTap,
    onDismiss,
    animateTransitions = false,
    sourceRect = null,
    initialChildSize,
    backdropOpacity,
    overlayOpacity,
    onOpenAnimationStart,
    onBeforeDismissComplete,
  }: ZoomableGalleryProps<T>,
  ref: React.ForwardedRef<ZoomableGalleryRef>
) {
  const windowDims = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const reducedMotionVal = useSharedValue(Boolean(reducedMotion));

  useEffect(() => {
    reducedMotionVal.value = Boolean(reducedMotion);
  }, [reducedMotion, reducedMotionVal]);

  const itemCount = data.length;
  const startIndex =
    itemCount > 0 ? Math.max(0, Math.min(initialIndex, itemCount - 1)) : 0;

  const [scrollIndex, setScrollIndex] = useState(startIndex);

  const rootWidth = useSharedValue(windowDims.width);
  const rootHeight = useSharedValue(windowDims.height);
  const activeChildWidth = useSharedValue(initialChildSize?.width ?? 0);
  const activeChildHeight = useSharedValue(initialChildSize?.height ?? 0);

  const activeIndex = useSharedValue(startIndex);
  const scroll = useSharedValue(startIndex * windowDims.width);
  const isScrolling = useSharedValue(false);

  const scale = useSharedValue(minScale);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const pullTranslateX = useSharedValue(0);
  const pullTranslateY = useSharedValue(0);

  // Transition state: 0 = opening, 1 = interactive, 2 = dismissing
  const transitionMode = useSharedValue(animateTransitions ? 0 : 1);
  const openProgress = useSharedValue(animateTransitions ? 0 : 1);

  const sourceX = useSharedValue(sourceRect?.x ?? 0);
  const sourceY = useSharedValue(sourceRect?.y ?? 0);
  const sourceW = useSharedValue(sourceRect?.width ?? 0);
  const sourceH = useSharedValue(sourceRect?.height ?? 0);
  const sourceRadius = useSharedValue(sourceRect?.borderRadius ?? 0);
  const hasSourceRect = useSharedValue(
    Boolean(sourceRect && sourceRect.width > 0 && sourceRect.height > 0)
  );

  useEffect(() => {
    sourceX.value = sourceRect?.x ?? 0;
    sourceY.value = sourceRect?.y ?? 0;
    sourceW.value = sourceRect?.width ?? 0;
    sourceH.value = sourceRect?.height ?? 0;
    sourceRadius.value = sourceRect?.borderRadius ?? 0;
    hasSourceRect.value = Boolean(
      sourceRect && sourceRect.width > 0 && sourceRect.height > 0
    );
  }, [
    hasSourceRect,
    sourceH,
    sourceRadius,
    sourceRect,
    sourceW,
    sourceX,
    sourceY,
  ]);

  const dismissProgress = useSharedValue(0);
  const dismissTx = useSharedValue(0);
  const dismissTy = useSharedValue(0);
  const dismissStartClipScaleX = useSharedValue(1);
  const dismissStartClipScaleY = useSharedValue(1);
  const dismissStartVisualScale = useSharedValue(1);
  const dismissStartRadius = useSharedValue(0);
  const dismissStartBackdrop = useSharedValue(1);
  const dismissStartOverlay = useSharedValue(1);
  const dismissUseSharedElement = useSharedValue(false);
  const dismissDoneCount = useSharedValue(0);

  // Pinch tracking shared values (all worklet-only, zero React state during gestures)
  const isPinching = useSharedValue(false);
  const isPinchInitialized = useSharedValue(false);
  const pinchStartScale = useSharedValue(minScale);
  const pinchBaseEventScale = useSharedValue(1);
  const pinchStartTx = useSharedValue(0);
  const pinchStartTy = useSharedValue(0);
  const pinchStartFx = useSharedValue(0);
  const pinchStartFy = useSharedValue(0);
  const pinchLastFx = useSharedValue(0);
  const pinchLastFy = useSharedValue(0);

  // Pan tracking shared values (0 = none, 1 = zoomPan/swipe, 2 = verticalPull)
  const panMode = useSharedValue(0);
  const panStartTx = useSharedValue(0);
  const panStartTy = useSharedValue(0);
  const panStartScroll = useSharedValue(0);

  const isMountedRef = useRef(true);
  const hasCompletedDismissRef = useRef(false);
  const dismissFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const onBeforeDismissCompleteRef = useRef(onBeforeDismissComplete);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onBeforeDismissCompleteRef.current = onBeforeDismissComplete;
    onDismissRef.current = onDismiss;
  }, [onBeforeDismissComplete, onDismiss]);

  useEffect(() => {
    isMountedRef.current = true;
    hasCompletedDismissRef.current = false;
    return () => {
      isMountedRef.current = false;
      if (dismissFallbackTimerRef.current) {
        clearTimeout(dismissFallbackTimerRef.current);
        dismissFallbackTimerRef.current = null;
      }
    };
  }, []);

  const handleDismissComplete = useCallback(() => {
    if (hasCompletedDismissRef.current || !isMountedRef.current) return;
    hasCompletedDismissRef.current = true;
    if (dismissFallbackTimerRef.current) {
      clearTimeout(dismissFallbackTimerRef.current);
      dismissFallbackTimerRef.current = null;
    }
    onBeforeDismissCompleteRef.current?.();
    requestAnimationFrame(() => {
      if (isMountedRef.current) {
        onDismissRef.current?.();
      }
    });
  }, []);

  const armDismissFallbackTimer = useCallback(() => {
    if (dismissFallbackTimerRef.current) {
      clearTimeout(dismissFallbackTimerRef.current);
    }
    dismissFallbackTimerRef.current = setTimeout(() => {
      handleDismissComplete();
    }, 650);
  }, [handleDismissComplete]);

  useEffect(() => {
    if (!animateTransitions) return;

    const rafId = requestAnimationFrame(() => {
      if (!isMountedRef.current) return;
      onOpenAnimationStart?.();
      scheduleOnUI(() => {
        'worklet';
        if (transitionMode.value !== 0) return;

        const onScreen = isSourceRectOnScreen(
          hasSourceRect.value,
          sourceX.value,
          sourceY.value,
          sourceW.value,
          sourceH.value,
          rootWidth.value,
          rootHeight.value
        );

        const doneCallback = (finished?: boolean) => {
          'worklet';
          if (finished && transitionMode.value === 0) {
            transitionMode.value = 1;
          }
        };

        if (onScreen && !reducedMotionVal.value) {
          openProgress.value = withSpring(1, OPEN_SPRING, doneCallback);
        } else {
          openProgress.value = withTiming(1, FALLBACK_TIMING, doneCallback);
        }
      });
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
    // Only animate open transition once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useAnimatedReaction(
    () => ({
      mode: transitionMode.value,
      openP: openProgress.value,
      pullY: pullTranslateY.value,
      dismissP: dismissProgress.value,
      startB: dismissStartBackdrop.value,
      startO: dismissStartOverlay.value,
    }),
    (curr) => {
      let bOp = 1;
      let oOp = 1;

      if (curr.mode === 0) {
        bOp = interpolate(curr.openP, [0, 0.75], [0, 1], Extrapolation.CLAMP);
        oOp = interpolate(curr.openP, [0.35, 1], [0, 1], Extrapolation.CLAMP);
      } else if (curr.mode === 1) {
        const dragDist = Math.abs(curr.pullY);
        bOp = interpolate(dragDist, [0, 260], [1, 0.05], Extrapolation.CLAMP);
        oOp = interpolate(dragDist, [0, 80], [1, 0], Extrapolation.CLAMP);
      } else {
        const d = clamp(curr.dismissP, 0, 1);
        bOp = curr.startB * (1 - d);
        oOp =
          curr.startO * interpolate(d, [0, 0.4], [1, 0], Extrapolation.CLAMP);
      }

      if (backdropOpacity !== undefined) {
        backdropOpacity.value = bOp;
      }
      if (overlayOpacity !== undefined) {
        overlayOpacity.value = oOp;
      }
    }
  );

  const handleIndexChange = useCallback(
    (idx: number) => {
      setScrollIndex(idx);
      onIndexChange?.(idx);
    },
    [onIndexChange]
  );

  const handleRootLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      const prevW = rootWidth.value;
      rootWidth.value = width;
      rootHeight.value = height;
      if (width !== prevW) {
        scroll.value = activeIndex.value * width;
      }
    },
    [activeIndex, rootHeight, rootWidth, scroll]
  );

  const startDismiss = (vx: number, vy: number) => {
    'worklet';
    if (transitionMode.value === 2) return;

    cancelAnimation(openProgress);
    cancelAnimation(scale);
    cancelAnimation(translateX);
    cancelAnimation(translateY);
    cancelAnimation(pullTranslateX);
    cancelAnimation(pullTranslateY);
    cancelAnimation(dismissTx);
    cancelAnimation(dismissTy);
    cancelAnimation(dismissProgress);

    const rw = rootWidth.value;
    const rh = rootHeight.value;
    const childW = activeChildWidth.value > 0 ? activeChildWidth.value : rw;
    const childH = activeChildHeight.value > 0 ? activeChildHeight.value : rh;
    const isReduced = reducedMotionVal.value;

    let startTx = 0;
    let startTy = 0;
    let startClipScaleX = 1;
    let startClipScaleY = 1;
    let startVisualScale = 1;
    let startRadius = 0;
    let startBackdrop = 1;
    let startOverlay = 1;

    if (transitionMode.value === 0) {
      const p = openProgress.value;
      const pClamped = clamp(p, 0, 1);
      startBackdrop = interpolate(p, [0, 0.75], [0, 1], Extrapolation.CLAMP);
      startOverlay = interpolate(p, [0.35, 1], [0, 1], Extrapolation.CLAMP);

      if (
        isSourceRectOnScreen(
          hasSourceRect.value,
          sourceX.value,
          sourceY.value,
          sourceW.value,
          sourceH.value,
          rw,
          rh
        ) &&
        !isReduced
      ) {
        const m = computeSharedMorph(
          p,
          sourceX.value,
          sourceY.value,
          sourceW.value,
          sourceH.value,
          sourceRadius.value,
          rw,
          rh,
          childW,
          childH
        );
        startTx = m.tx;
        startTy = m.ty;
        startClipScaleX = m.clipScaleX;
        startClipScaleY = m.clipScaleY;
        startVisualScale = m.visualScale;
        startRadius = m.radius;
      } else {
        startVisualScale = isReduced ? 1 : 0.94 + 0.06 * pClamped;
        startClipScaleX = startVisualScale;
        startClipScaleY = startVisualScale;
      }
    } else {
      const dragDist = Math.abs(pullTranslateY.value);
      const dragScale = interpolate(
        dragDist,
        [0, 320],
        [1, 0.72],
        Extrapolation.CLAMP
      );
      const dragRadius = interpolate(
        dragDist,
        [0, 120],
        [0, 20],
        Extrapolation.CLAMP
      );
      const curVisualScale = Math.max(0.001, scale.value * dragScale);

      startTx = translateX.value + pullTranslateX.value;
      startTy = translateY.value + pullTranslateY.value;
      startClipScaleX = curVisualScale;
      startClipScaleY = curVisualScale;
      startVisualScale = curVisualScale;
      startRadius = dragRadius;
      startBackdrop = interpolate(
        dragDist,
        [0, 260],
        [1, 0.05],
        Extrapolation.CLAMP
      );
      startOverlay = interpolate(
        dragDist,
        [0, 80],
        [1, 0],
        Extrapolation.CLAMP
      );
    }

    dismissStartClipScaleX.value = startClipScaleX;
    dismissStartClipScaleY.value = startClipScaleY;
    dismissStartVisualScale.value = startVisualScale;
    dismissStartRadius.value = startRadius;
    dismissStartBackdrop.value = startBackdrop;
    dismissStartOverlay.value = startOverlay;
    dismissTx.value = startTx;
    dismissTy.value = startTy;
    dismissProgress.value = 0;
    dismissDoneCount.value = 0;

    const useShared =
      isSourceRectOnScreen(
        hasSourceRect.value,
        sourceX.value,
        sourceY.value,
        sourceW.value,
        sourceH.value,
        rw,
        rh
      ) && !isReduced;

    dismissUseSharedElement.value = useShared;
    transitionMode.value = 2;

    scheduleOnRN(armDismissFallbackTimer);

    if (useShared) {
      const endTx = sourceX.value + sourceW.value / 2 - rw / 2;
      const endTy = sourceY.value + sourceH.value / 2 - rh / 2;

      const markDone = () => {
        'worklet';
        dismissDoneCount.value += 1;
        if (dismissDoneCount.value === 3) {
          scheduleOnRN(handleDismissComplete);
        }
      };

      if (Math.abs(startTx - endTx) <= 0.5 && Math.abs(vx) <= 10) {
        dismissTx.value = endTx;
        markDone();
      } else {
        dismissTx.value = withSpring(
          endTx,
          {
            duration: 320,
            dampingRatio: 0.92,
            velocity: vx,
            reduceMotion: ReduceMotion.System,
          },
          () => {
            'worklet';
            markDone();
          }
        );
      }

      if (Math.abs(startTy - endTy) <= 0.5 && Math.abs(vy) <= 10) {
        dismissTy.value = endTy;
        markDone();
      } else {
        dismissTy.value = withSpring(
          endTy,
          {
            duration: 320,
            dampingRatio: 0.92,
            velocity: vy,
            reduceMotion: ReduceMotion.System,
          },
          () => {
            'worklet';
            markDone();
          }
        );
      }

      dismissProgress.value = withSpring(1, DISMISS_PROGRESS_SPRING, () => {
        'worklet';
        markDone();
      });
    } else {
      if (!isReduced && (Math.abs(startTy) > 10 || Math.abs(vy) > 50)) {
        const dir = vy !== 0 ? Math.sign(vy) : Math.sign(startTy || 1);
        const endTy = startTy + dir * rh * 0.35;
        dismissTy.value = withTiming(endTy, FALLBACK_TIMING);
      }

      dismissProgress.value = withTiming(1, FALLBACK_TIMING, () => {
        'worklet';
        scheduleOnRN(handleDismissComplete);
      });
    }
  };

  const setIndex = useCallback(
    (index: number) => {
      if (itemCount === 0) return;
      const clamped = Math.max(0, Math.min(index, itemCount - 1));
      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(pullTranslateX);
      cancelAnimation(pullTranslateY);
      cancelAnimation(scroll);

      activeIndex.value = clamped;
      scroll.value = clamped * rootWidth.value;
      isScrolling.value = false;
      scale.value = minScale;
      translateX.value = 0;
      translateY.value = 0;
      pullTranslateX.value = 0;
      pullTranslateY.value = 0;
      handleIndexChange(clamped);
    },
    [
      activeIndex,
      handleIndexChange,
      isScrolling,
      itemCount,
      minScale,
      pullTranslateX,
      pullTranslateY,
      rootWidth,
      scale,
      scroll,
      translateX,
      translateY,
    ]
  );

  const reset = useCallback(
    (animate = true) => {
      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(pullTranslateX);
      cancelAnimation(pullTranslateY);

      if (animate) {
        scale.value = withTiming(minScale, TIMING_CONFIG);
        translateX.value = withTiming(0, TIMING_CONFIG);
        translateY.value = withTiming(0, TIMING_CONFIG);
        pullTranslateX.value = withTiming(0, TIMING_CONFIG);
        pullTranslateY.value = withTiming(0, TIMING_CONFIG);
      } else {
        scale.value = minScale;
        translateX.value = 0;
        translateY.value = 0;
        pullTranslateX.value = 0;
        pullTranslateY.value = 0;
      }
    },
    [minScale, pullTranslateX, pullTranslateY, scale, translateX, translateY]
  );

  const getState = useCallback((): ZoomableGalleryState => {
    return {
      containerSize: {
        width: rootWidth.value,
        height: rootHeight.value,
      },
      childSize: {
        width: activeChildWidth.value,
        height: activeChildHeight.value,
      },
      maxScale,
      translateX: translateX.value,
      translateY: translateY.value,
      scale: scale.value,
    };
  }, [
    activeChildHeight,
    activeChildWidth,
    maxScale,
    rootHeight,
    rootWidth,
    scale,
    translateX,
    translateY,
  ]);

  const dismiss = useCallback(() => {
    if (animateTransitions) {
      scheduleOnUI(startDismiss, 0, 0);
    } else {
      onDismiss?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animateTransitions, onDismiss]);

  useImperativeHandle(
    ref,
    () => ({
      setIndex,
      reset,
      getState,
      dismiss,
    }),
    [setIndex, reset, getState, dismiss]
  );

  const hasDismiss = onDismiss !== undefined;

  const handlePinchEnd = () => {
    'worklet';
    if (!isPinching.value) return;
    isPinching.value = false;
    isPinchInitialized.value = false;

    const curScale = scale.value;
    const targetScale = clamp(curScale, minScale, maxScale);

    if (targetScale <= minScale + 0.01) {
      scale.value = withTiming(minScale, TIMING_CONFIG);
      translateX.value = withTiming(0, TIMING_CONFIG);
      translateY.value = withTiming(0, TIMING_CONFIG);
      return;
    }

    const ratio = targetScale / curScale;
    const adjX =
      curScale !== targetScale
        ? pinchLastFx.value - ratio * (pinchLastFx.value - translateX.value)
        : translateX.value;
    const adjY =
      curScale !== targetScale
        ? pinchLastFy.value - ratio * (pinchLastFy.value - translateY.value)
        : translateY.value;

    const bounds = computeBounds(
      targetScale,
      activeChildWidth.value,
      activeChildHeight.value,
      rootWidth.value,
      rootHeight.value
    );
    const targetX = clamp(adjX, -bounds.x, bounds.x);
    const targetY = clamp(adjY, -bounds.y, bounds.y);

    if (Math.abs(targetScale - curScale) > 0.001) {
      scale.value = withTiming(targetScale, TIMING_CONFIG);
    }
    if (Math.abs(targetX - translateX.value) > 0.5) {
      translateX.value = withTiming(targetX, TIMING_CONFIG);
    }
    if (Math.abs(targetY - translateY.value) > 0.5) {
      translateY.value = withTiming(targetY, TIMING_CONFIG);
    }
  };

  const pinch = usePinchGesture({
    enabled: zoomEnabled,
    onActivate: () => {
      'worklet';
      if (transitionMode.value === 2) return;
      if (transitionMode.value === 0) {
        cancelAnimation(openProgress);
        openProgress.value = 1;
        transitionMode.value = 1;
      }

      isPinching.value = true;
      isPinchInitialized.value = false;

      if (panMode.value === 2) {
        pullTranslateX.value = withTiming(0, TIMING_CONFIG);
        pullTranslateY.value = withTiming(0, TIMING_CONFIG);
      }
      if (panMode.value === 1 && rootWidth.value > 0) {
        scroll.value = withTiming(
          activeIndex.value * rootWidth.value,
          TIMING_CONFIG
        );
        isScrolling.value = false;
      }
      panMode.value = 0;

      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);
    },
    onUpdate: (e) => {
      'worklet';
      if (transitionMode.value === 2) return;
      // Guard against Android focal jump when one of the two fingers lifts.
      if (e.numberOfPointers < 2) {
        return;
      }

      if (!isPinchInitialized.value) {
        isPinchInitialized.value = true;
        pinchStartScale.value = scale.value;
        pinchBaseEventScale.value = e.scale > 0 ? e.scale : 1;
        pinchStartTx.value = translateX.value;
        pinchStartTy.value = translateY.value;
        pinchStartFx.value = e.focalX - rootWidth.value / 2;
        pinchStartFy.value = e.focalY - rootHeight.value / 2;
        pinchLastFx.value = pinchStartFx.value;
        pinchLastFy.value = pinchStartFy.value;
        return;
      }

      const relScale = e.scale / pinchBaseEventScale.value;
      const rawScale = pinchStartScale.value * relScale;
      const toScale = applyRubberBand(rawScale, minScale, maxScale);

      const fx = e.focalX - rootWidth.value / 2;
      const fy = e.focalY - rootHeight.value / 2;
      pinchLastFx.value = fx;
      pinchLastFy.value = fy;

      const ratio = toScale / pinchStartScale.value;
      const rawTx = fx - ratio * (pinchStartFx.value - pinchStartTx.value);
      const rawTy = fy - ratio * (pinchStartFy.value - pinchStartTy.value);

      const bounds = computeBounds(
        Math.max(toScale, minScale),
        activeChildWidth.value,
        activeChildHeight.value,
        rootWidth.value,
        rootHeight.value
      );

      translateX.value = clamp(rawTx, -bounds.x, bounds.x);
      translateY.value = clamp(rawTy, -bounds.y, bounds.y);
      scale.value = toScale;
    },
    onDeactivate: handlePinchEnd,
    onFinalize: handlePinchEnd,
  });

  const pan = usePanGesture({
    maxPointers: 1,
    minDistance: 6,
    onActivate: (e) => {
      'worklet';
      if (transitionMode.value === 2) {
        panMode.value = 0;
        return;
      }
      if (transitionMode.value === 0) {
        cancelAnimation(openProgress);
        openProgress.value = 1;
        transitionMode.value = 1;
      }
      if (isPinching.value || e.numberOfPointers > 1) {
        panMode.value = 0;
        return;
      }

      cancelAnimation(translateX);
      cancelAnimation(translateY);
      cancelAnimation(scroll);
      cancelAnimation(pullTranslateX);
      cancelAnimation(pullTranslateY);

      if (
        scale.value <= minScale + 0.01 &&
        Math.abs(e.velocityY) > Math.abs(e.velocityX) * 1.2 &&
        hasDismiss
      ) {
        panMode.value = 2;
      } else {
        panMode.value = 1;
        isScrolling.value = true;
        panStartTx.value = translateX.value;
        panStartTy.value = translateY.value;
        panStartScroll.value = scroll.value;
      }
    },
    onUpdate: (e) => {
      'worklet';
      if (
        transitionMode.value === 2 ||
        isPinching.value ||
        e.numberOfPointers > 1 ||
        panMode.value === 0
      ) {
        return;
      }

      if (panMode.value === 2) {
        pullTranslateX.value = e.translationX;
        pullTranslateY.value = e.translationY;
        return;
      }

      const toX = panStartTx.value + e.translationX;
      const toY = panStartTy.value + e.translationY;
      const bounds = computeBounds(
        scale.value,
        activeChildWidth.value,
        activeChildHeight.value,
        rootWidth.value,
        rootHeight.value
      );

      const exceedX = Math.max(0, Math.abs(toX) - bounds.x);
      const scrollDelta = -Math.sign(toX) * exceedX;
      const maxScroll = Math.max(0, (itemCount - 1) * rootWidth.value);

      scroll.value = clamp(panStartScroll.value + scrollDelta, 0, maxScroll);
      translateX.value = clamp(toX, -bounds.x, bounds.x);
      translateY.value = clamp(toY, -bounds.y, bounds.y);
    },
    onDeactivate: (e) => {
      'worklet';
      const mode = panMode.value;
      panMode.value = 0;
      if (mode === 0 || isPinching.value || transitionMode.value === 2) {
        return;
      }

      if (mode === 2) {
        if (
          !e.canceled &&
          onDismiss !== undefined &&
          (Math.abs(pullTranslateY.value) > 100 || Math.abs(e.velocityY) > 700)
        ) {
          if (animateTransitions) {
            startDismiss(e.velocityX, e.velocityY);
          } else {
            scheduleOnRN(onDismiss);
          }
        } else {
          pullTranslateX.value = withSpring(0, {
            duration: 280,
            dampingRatio: 0.9,
            velocity: e.velocityX,
            reduceMotion: ReduceMotion.System,
          });
          pullTranslateY.value = withSpring(0, {
            duration: 280,
            dampingRatio: 0.9,
            velocity: e.velocityY,
            reduceMotion: ReduceMotion.System,
          });
        }
        return;
      }

      const bounds = computeBounds(
        scale.value,
        activeChildWidth.value,
        activeChildHeight.value,
        rootWidth.value,
        rootHeight.value
      );
      const w = rootWidth.value;
      const active = activeIndex.value;
      let targetIdx = active;

      if (w > 0 && itemCount > 1) {
        const currentPageOffset = scroll.value - active * w;
        const canSwipeLeft = translateX.value <= -bounds.x + 1;
        const canSwipeRight = translateX.value >= bounds.x - 1;

        if (e.velocityX < -450 && canSwipeLeft && currentPageOffset > 10) {
          targetIdx = active + 1;
        } else if (
          e.velocityX > 450 &&
          canSwipeRight &&
          currentPageOffset < -10
        ) {
          targetIdx = active - 1;
        } else {
          targetIdx = Math.round(scroll.value / w);
        }

        targetIdx = clamp(
          targetIdx,
          Math.max(0, active - 1),
          Math.min(itemCount - 1, active + 1)
        );

        scroll.value = withTiming(
          targetIdx * w,
          TIMING_CONFIG,
          (finished) => {
            if (!finished) return;
            isScrolling.value = false;
            if (targetIdx !== activeIndex.value) {
              activeIndex.value = targetIdx;
              scale.value = minScale;
              translateX.value = 0;
              translateY.value = 0;
              scheduleOnRN(handleIndexChange, targetIdx);
            }
          }
        );
      } else {
        isScrolling.value = false;
      }

      if (targetIdx === active && scale.value > minScale + 0.01) {
        translateX.value = withDecay({
          velocity: e.velocityX,
          clamp: [-bounds.x, bounds.x],
        });
        translateY.value = withDecay({
          velocity: e.velocityY,
          clamp: [-bounds.y, bounds.y],
        });
      }
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    maxDuration: 250,
    maxDelay: 250,
    enabled: zoomEnabled,
    onDeactivate: (e) => {
      'worklet';
      if (e.canceled || isPinching.value || transitionMode.value === 2) return;
      if (transitionMode.value === 0) {
        cancelAnimation(openProgress);
        openProgress.value = 1;
        transitionMode.value = 1;
      }

      cancelAnimation(scale);
      cancelAnimation(translateX);
      cancelAnimation(translateY);

      if (scale.value > minScale + 0.05) {
        scale.value = withTiming(minScale, TIMING_CONFIG);
        translateX.value = withTiming(0, TIMING_CONFIG);
        translateY.value = withTiming(0, TIMING_CONFIG);
      } else {
        const targetScale = maxScale;
        const fx = e.x - rootWidth.value / 2;
        const fy = e.y - rootHeight.value / 2;
        const ratio = targetScale / scale.value;
        const rawTx = fx - ratio * (fx - translateX.value);
        const rawTy = fy - ratio * (fy - translateY.value);

        const bounds = computeBounds(
          targetScale,
          activeChildWidth.value,
          activeChildHeight.value,
          rootWidth.value,
          rootHeight.value
        );

        scale.value = withTiming(targetScale, TIMING_CONFIG);
        translateX.value = withTiming(
          clamp(rawTx, -bounds.x, bounds.x),
          TIMING_CONFIG
        );
        translateY.value = withTiming(
          clamp(rawTy, -bounds.y, bounds.y),
          TIMING_CONFIG
        );
      }
    },
  });

  const singleTap = useTapGesture({
    numberOfTaps: 1,
    maxDuration: 250,
    onDeactivate: (e) => {
      'worklet';
      if (e.canceled || isPinching.value || transitionMode.value === 2) return;
      if (onTap !== undefined) {
        scheduleOnRN(onTap);
      }
    },
  });

  const taps = useExclusiveGestures(doubleTap, singleTap);
  const pinchAndPan = useSimultaneousGestures(pinch, pan);
  const composedGesture = useCompetingGestures(pinchAndPan, taps);

  const halfWindow = Math.floor(windowSize / 2);

  return (
    <View testID="root" style={styles.root} onLayout={handleRootLayout}>
      {data.map((item, index) => {
        if (
          index < scrollIndex - halfWindow ||
          index > scrollIndex + halfWindow
        ) {
          return null;
        }

        const key = keyExtractor?.(item, index) ?? `item-${index}`;

        return (
          <GalleryPageItem
            key={key}
            item={item}
            index={index}
            zIndex={itemCount - index}
            startIndex={startIndex}
            initialChildSize={initialChildSize}
            renderItem={renderItem}
            activeIndex={activeIndex}
            scroll={scroll}
            isScrolling={isScrolling}
            rootWidth={rootWidth}
            rootHeight={rootHeight}
            activeChildWidth={activeChildWidth}
            activeChildHeight={activeChildHeight}
            translateX={translateX}
            translateY={translateY}
            pullTranslateX={pullTranslateX}
            pullTranslateY={pullTranslateY}
            scale={scale}
            transitionMode={transitionMode}
            openProgress={openProgress}
            sourceX={sourceX}
            sourceY={sourceY}
            sourceW={sourceW}
            sourceH={sourceH}
            sourceRadius={sourceRadius}
            hasSourceRect={hasSourceRect}
            dismissProgress={dismissProgress}
            dismissTx={dismissTx}
            dismissTy={dismissTy}
            dismissStartClipScaleX={dismissStartClipScaleX}
            dismissStartClipScaleY={dismissStartClipScaleY}
            dismissStartVisualScale={dismissStartVisualScale}
            dismissStartRadius={dismissStartRadius}
            dismissUseSharedElement={dismissUseSharedElement}
            reducedMotionVal={reducedMotionVal}
          />
        );
      })}

      <GestureDetector gesture={composedGesture}>
        <View style={styles.gestureOverlay} collapsable={false} />
      </GestureDetector>
    </View>
  );
}

export const ZoomableGallery = React.forwardRef(ZoomableGalleryInner) as <T>(
  props: ZoomableGalleryProps<T> & { ref?: React.Ref<ZoomableGalleryRef> }
) => React.ReactElement | null;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pageItem: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    overflow: 'hidden',
  },
  gestureOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 2_147_483_647,
  },
});

export default ZoomableGallery;
