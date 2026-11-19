import { useThemeContext } from "@/context/ThemeContext";
import {
  FooterOptions,
  GrabberOptions,
  HeaderOptions,
  ScrollableOptions,
  SheetDetent,
  TrueSheet,
  TrueSheetProps,
} from "@lodev09/react-native-true-sheet";
import React, {
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { create } from "zustand";

// ============================================================================
// 1. TYPES & CONFIGURATION
// ============================================================================

export interface GlobalTrueSheetHelpers {
  /** Dismiss this specific sheet (and any sheets stacked on top of it) */
  dismiss: (animated?: boolean) => Promise<void>;
  /** Dismiss all stacked sheets on top of this one, keeping this one open */
  dismissStack: (animated?: boolean) => Promise<void>;
  /** Dismiss all global sheets completely */
  dismissAll: (animated?: boolean) => Promise<void>;
  /** Pop this sheet from stack (same as dismiss) */
  pop: (animated?: boolean) => Promise<void>;
  /** Push a new sheet on top of this one */
  push: (options: GlobalTrueSheetOpenOptions) => Promise<string>;
  /** Resize this sheet to a detent index */
  resize: (index: number) => Promise<void>;
  /** Dynamically update this sheet's content */
  setContent: (content: GlobalTrueSheetContent) => void;
  /** Dynamically update this sheet's header */
  setHeader: (header: GlobalTrueSheetContent | null) => void;
  /** Dynamically update this sheet's footer */
  setFooter: (footer: GlobalTrueSheetContent | null) => void;
  /** Dynamically update this sheet's configuration */
  updateConfig: (config: Partial<GlobalTrueSheetConfig>) => void;
  /** Unique ID of this sheet in the stack */
  sheetId: string;
  /** Stack index of this sheet (0 = base sheet, 1 = first stacked, etc.) */
  stackIndex: number;
}

export type GlobalTrueSheetContent =
  | React.ReactNode
  | ((helpers: GlobalTrueSheetHelpers) => React.ReactNode);

export interface GlobalTrueSheetConfig {
  /**
   * Detents defining sheet heights. Up to 3 detents, sorted smallest to largest (e.g. ['auto'] or [0.5, 1]).
   */
  detents?: SheetDetent[];
  cornerRadius?: number;
  maxContentHeight?: TrueSheetProps["maxContentHeight"];
  maxContentWidth?: TrueSheetProps["maxContentWidth"];
  grabber?: boolean;
  grabberOptions?: GrabberOptions;
  dimmed?: boolean;
  dimColor?: TrueSheetProps["dimColor"];
  dimOpacity?: TrueSheetProps["dimOpacity"];
  dimBlur?: TrueSheetProps["dimBlur"];
  dimmedDetentIndex?: number;
  dismissible?: boolean;
  dismissThreshold?: TrueSheetProps["dismissThreshold"];
  draggable?: boolean;
  scrollableRef?: TrueSheetProps["scrollableRef"];
  scrollableOptions?: ScrollableOptions;
  backgroundBlur?: TrueSheetProps["backgroundBlur"];
  backgroundColor?: TrueSheetProps["backgroundColor"];
  background?: TrueSheetProps["background"];
  backgroundStyle?: TrueSheetProps["backgroundStyle"];
  detentBackgrounds?: TrueSheetProps["detentBackgrounds"];
  insetAdjustment?: TrueSheetProps["insetAdjustment"];
  lazy?: TrueSheetProps["lazy"];
  placement?: TrueSheetProps["placement"];
  placementOffset?: TrueSheetProps["placementOffset"];
  headerStyle?: TrueSheetProps["headerStyle"];
  headerOptions?: HeaderOptions;
  footerStyle?: TrueSheetProps["footerStyle"];
  footerOptions?: FooterOptions;
  initialDetentIndex?: number;
  initialDetentAnimated?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export interface GlobalTrueSheetCallbacks {
  onDidPresent?: (event?: any) => void;
  onDidDismiss?: (event?: any) => void;
  onDetentChange?: (event?: any) => void;
  onPositionChange?: (event?: any) => void;
  onDidFocus?: () => void;
  onDidBlur?: () => void;
}

export interface GlobalTrueSheetOpenOptions
  extends GlobalTrueSheetConfig,
  GlobalTrueSheetCallbacks {
  content: GlobalTrueSheetContent;
  header?: GlobalTrueSheetContent;
  footer?: GlobalTrueSheetContent;
  /** Initial detent index to present at (default is 0) */
  initialIndex?: number;
  animated?: boolean;
  /** If true, pushes on top of existing open sheets instead of replacing */
  stacked?: boolean;
}

export interface GlobalTrueSheetItem {
  id: string;
  content: GlobalTrueSheetContent;
  header: GlobalTrueSheetContent | null;
  footer: GlobalTrueSheetContent | null;
  config: GlobalTrueSheetConfig;
  callbacks: GlobalTrueSheetCallbacks;
  initialIndex: number;
  animated: boolean;
}

interface GlobalTrueSheetState {
  stack: GlobalTrueSheetItem[];
  _refs: Record<string, React.RefObject<TrueSheet | null>>;

  // Internal actions
  _registerRef: (id: string, ref: React.RefObject<TrueSheet | null>) => void;
  _unregisterRef: (id: string) => void;
  _removeSheet: (id: string) => void;

  // Public actions
  open: (options: GlobalTrueSheetOpenOptions) => Promise<string>;
  push: (options: GlobalTrueSheetOpenOptions) => Promise<string>;
  pop: (animated?: boolean) => Promise<void>;
  dismiss: (sheetId?: string, animated?: boolean) => Promise<void>;
  dismissStack: (sheetId?: string, animated?: boolean) => Promise<void>;
  dismissAll: (animated?: boolean) => Promise<void>;
  resize: (index: number, sheetId?: string) => Promise<void>;
  setContent: (content: GlobalTrueSheetContent, sheetId?: string) => void;
  setHeader: (header: GlobalTrueSheetContent | null, sheetId?: string) => void;
  setFooter: (footer: GlobalTrueSheetContent | null, sheetId?: string) => void;
  updateConfig: (config: Partial<GlobalTrueSheetConfig>, sheetId?: string) => void;
  getTopSheet: () => GlobalTrueSheetItem | undefined;
}

// Default standard sheet configuration
const DEFAULT_CONFIG: GlobalTrueSheetConfig = {
  detents: ["auto"],
  cornerRadius: 36,
  grabber: true,
  dimmed: true,
  dismissible: true,
  draggable: true,
};

let sheetIdCounter = 0;
function generateSheetId(): string {
  return `sheet_${Date.now()}_${++sheetIdCounter}`;
}

function sanitizeConfig(configOverrides: Partial<GlobalTrueSheetConfig>): GlobalTrueSheetConfig {
  return {
    ...DEFAULT_CONFIG,
    ...configOverrides,
    detents: configOverrides.detents || DEFAULT_CONFIG.detents || ["auto"],
  };
}

// ============================================================================
// 2. ZUSTAND STORE WITH FULL STACKING SUPPORT
// ============================================================================

export const useGlobalTrueSheetStore = create<GlobalTrueSheetState>((set, get) => ({
  stack: [],
  _refs: {},

  _registerRef: (id, ref) => {
    set((state) => ({
      _refs: { ...state._refs, [id]: ref },
    }));
  },

  _unregisterRef: (id) => {
    set((state) => {
      const newRefs = { ...state._refs };
      delete newRefs[id];
      return { _refs: newRefs };
    });
  },

  _removeSheet: (id) => {
    set((state) => ({
      stack: state.stack.filter((item) => item.id !== id),
    }));
  },

  open: async (options) => {
    // If stacked flag is set, push to stack; otherwise replace the whole stack
    if (options.stacked && get().stack.length > 0) {
      return get().push(options);
    }

    // Dismiss existing sheets first if replacing root
    if (get().stack.length > 0) {
      await get().dismissAll(false);
    }

    return get().push({ ...options, stacked: false });
  },

  push: async (options) => {
    const id = generateSheetId();
    const {
      content,
      header,
      footer,
      onDidPresent,
      onDidDismiss,
      onDetentChange,
      onPositionChange,
      onDidFocus,
      onDidBlur,
      initialIndex = 0,
      animated = true,
      ...configOverrides
    } = options;

    const mergedConfig = sanitizeConfig(configOverrides);

    const newItem: GlobalTrueSheetItem = {
      id,
      content,
      header: header || null,
      footer: footer || null,
      config: mergedConfig,
      callbacks: {
        onDidPresent,
        onDidDismiss,
        onDetentChange,
        onPositionChange,
        onDidFocus,
        onDidBlur,
      },
      initialIndex,
      animated,
    };

    set((state) => ({
      stack: [...state.stack, newItem],
    }));

    return id;
  },

  pop: async (animated = true) => {
    const top = get().getTopSheet();
    if (top) {
      await get().dismiss(top.id, animated);
    }
  },

  dismiss: async (sheetId, animated = true) => {
    const targetId = sheetId || get().getTopSheet()?.id;
    if (!targetId) return;

    const ref = get()._refs[targetId];
    if (ref && ref.current) {
      await ref.current.dismiss(animated);
    } else {
      get()._removeSheet(targetId);
    }
  },

  dismissStack: async (sheetId, animated = true) => {
    const targetId = sheetId || get().stack[0]?.id;
    if (!targetId) return;

    const ref = get()._refs[targetId];
    if (ref && ref.current) {
      await ref.current.dismissStack(animated);
    }
  },

  dismissAll: async (animated = true) => {
    const stack = get().stack;
    if (stack.length === 0) return;

    // Use native dismissAll on the bottom-most sheet to cascade dismiss everything
    const baseId = stack[0].id;
    const baseRef = get()._refs[baseId];
    if (baseRef && baseRef.current) {
      await baseRef.current.dismiss(animated);
    }

    set({ stack: [] });
  },

  resize: async (index: number, sheetId?: string) => {
    const targetId = sheetId || get().getTopSheet()?.id;
    if (!targetId) return;

    const ref = get()._refs[targetId];
    if (ref && ref.current) {
      await ref.current.resize(index);
    }
  },

  setContent: (content, sheetId) => {
    const targetId = sheetId || get().getTopSheet()?.id;
    if (!targetId) return;

    set((state) => ({
      stack: state.stack.map((item) =>
        item.id === targetId ? { ...item, content } : item
      ),
    }));
  },

  setHeader: (header, sheetId) => {
    const targetId = sheetId || get().getTopSheet()?.id;
    if (!targetId) return;

    set((state) => ({
      stack: state.stack.map((item) =>
        item.id === targetId ? { ...item, header } : item
      ),
    }));
  },

  setFooter: (footer, sheetId) => {
    const targetId = sheetId || get().getTopSheet()?.id;
    if (!targetId) return;

    set((state) => ({
      stack: state.stack.map((item) =>
        item.id === targetId ? { ...item, footer } : item
      ),
    }));
  },

  updateConfig: (newConfig, sheetId) => {
    const targetId = sheetId || get().getTopSheet()?.id;
    if (!targetId) return;

    set((state) => ({
      stack: state.stack.map((item) =>
        item.id === targetId
          ? { ...item, config: { ...item.config, ...newConfig } }
          : item
      ),
    }));
  },

  getTopSheet: () => {
    const stack = get().stack;
    return stack.length > 0 ? stack[stack.length - 1] : undefined;
  },
}));

// ============================================================================
// 3. IMPERATIVE CONTROLLER (Use anywhere, even outside React components)
// ============================================================================

export const globalTrueSheet = {
  /** Open a root sheet (replaces stack by default) */
  open: (options: GlobalTrueSheetOpenOptions) =>
    useGlobalTrueSheetStore.getState().open(options),
  /** Push a new sheet on top of the current stack (Stacking) */
  push: (options: GlobalTrueSheetOpenOptions) =>
    useGlobalTrueSheetStore.getState().push(options),
  /** Pop top sheet from stack */
  pop: (animated?: boolean) =>
    useGlobalTrueSheetStore.getState().pop(animated),
  /** Dismiss a specific sheet or top sheet */
  dismiss: (sheetId?: string, animated?: boolean) =>
    useGlobalTrueSheetStore.getState().dismiss(sheetId, animated),
  /** Dismiss all sheets stacked above a sheet */
  dismissStack: (sheetId?: string, animated?: boolean) =>
    useGlobalTrueSheetStore.getState().dismissStack(sheetId, animated),
  /** Dismiss all open global sheets */
  dismissAll: (animated?: boolean) =>
    useGlobalTrueSheetStore.getState().dismissAll(animated),
  /** Resize sheet by detent index */
  resize: (index: number, sheetId?: string) =>
    useGlobalTrueSheetStore.getState().resize(index, sheetId),
  /** Dynamically swap content */
  setContent: (content: GlobalTrueSheetContent, sheetId?: string) =>
    useGlobalTrueSheetStore.getState().setContent(content, sheetId),
  /** Dynamically swap header */
  setHeader: (header: GlobalTrueSheetContent | null, sheetId?: string) =>
    useGlobalTrueSheetStore.getState().setHeader(header, sheetId),
  /** Dynamically swap footer */
  setFooter: (footer: GlobalTrueSheetContent | null, sheetId?: string) =>
    useGlobalTrueSheetStore.getState().setFooter(footer, sheetId),
  /** Update configuration */
  updateConfig: (config: Partial<GlobalTrueSheetConfig>, sheetId?: string) =>
    useGlobalTrueSheetStore.getState().updateConfig(config, sheetId),
  /** Check if any global sheet is open */
  isOpen: () => useGlobalTrueSheetStore.getState().stack.length > 0,
  /** Get current stack size */
  getStackCount: () => useGlobalTrueSheetStore.getState().stack.length,
};

// ============================================================================
// 4. REACT HOOK
// ============================================================================

export function useGlobalTrueSheet() {
  const stack = useGlobalTrueSheetStore((s) => s.stack);
  const open = useGlobalTrueSheetStore((s) => s.open);
  const push = useGlobalTrueSheetStore((s) => s.push);
  const pop = useGlobalTrueSheetStore((s) => s.pop);
  const dismiss = useGlobalTrueSheetStore((s) => s.dismiss);
  const dismissStack = useGlobalTrueSheetStore((s) => s.dismissStack);
  const dismissAll = useGlobalTrueSheetStore((s) => s.dismissAll);
  const resize = useGlobalTrueSheetStore((s) => s.resize);
  const setContent = useGlobalTrueSheetStore((s) => s.setContent);
  const setHeader = useGlobalTrueSheetStore((s) => s.setHeader);
  const setFooter = useGlobalTrueSheetStore((s) => s.setFooter);
  const updateConfig = useGlobalTrueSheetStore((s) => s.updateConfig);

  const isOpen = stack.length > 0;
  const topSheet = stack.length > 0 ? stack[stack.length - 1] : undefined;

  return {
    isOpen,
    stackCount: stack.length,
    topSheet,
    open,
    push,
    pop,
    dismiss,
    dismissStack,
    dismissAll,
    resize,
    setContent,
    setHeader,
    setFooter,
    updateConfig,
  };
}

// ============================================================================
// 5. INDIVIDUAL SHEET INSTANCE COMPONENT
// ============================================================================

interface GlobalTrueSheetInstanceProps {
  item: GlobalTrueSheetItem;
  stackIndex: number;
}

const GlobalTrueSheetInstance = memo(({ item, stackIndex }: GlobalTrueSheetInstanceProps) => {
  const sheetRef = useRef<TrueSheet>(null);
  const { colors } = useThemeContext();

  const _registerRef = useGlobalTrueSheetStore((s) => s._registerRef);
  const _unregisterRef = useGlobalTrueSheetStore((s) => s._unregisterRef);
  const _removeSheet = useGlobalTrueSheetStore((s) => s._removeSheet);

  const dismiss = useGlobalTrueSheetStore((s) => s.dismiss);
  const dismissStack = useGlobalTrueSheetStore((s) => s.dismissStack);
  const dismissAll = useGlobalTrueSheetStore((s) => s.dismissAll);
  const pop = useGlobalTrueSheetStore((s) => s.pop);
  const push = useGlobalTrueSheetStore((s) => s.push);
  const resize = useGlobalTrueSheetStore((s) => s.resize);
  const setContent = useGlobalTrueSheetStore((s) => s.setContent);
  const setHeader = useGlobalTrueSheetStore((s) => s.setHeader);
  const setFooter = useGlobalTrueSheetStore((s) => s.setFooter);
  const updateConfig = useGlobalTrueSheetStore((s) => s.updateConfig);

  // Register ref on mount and present automatically
  useEffect(() => {
    _registerRef(item.id, sheetRef);

    // Present sheet once mounted
    const timer = setTimeout(() => {
      sheetRef.current?.present(item.initialIndex, item.animated);
    }, 10);

    return () => {
      clearTimeout(timer);
      _unregisterRef(item.id);
    };
  }, [item.id, item.initialIndex, item.animated, _registerRef, _unregisterRef]);

  // Helpers passed to content / header / footer
  const helpers: GlobalTrueSheetHelpers = useMemo(
    () => ({
      dismiss: (animated?: boolean) => dismiss(item.id, animated),
      dismissStack: (animated?: boolean) => dismissStack(item.id, animated),
      dismissAll,
      pop,
      push,
      resize: (index: number) => resize(index, item.id),
      setContent: (c: GlobalTrueSheetContent) => setContent(c, item.id),
      setHeader: (h: GlobalTrueSheetContent | null) => setHeader(h, item.id),
      setFooter: (f: GlobalTrueSheetContent | null) => setFooter(f, item.id),
      updateConfig: (cfg: Partial<GlobalTrueSheetConfig>) => updateConfig(cfg, item.id),
      sheetId: item.id,
      stackIndex,
    }),
    [
      dismiss,
      dismissStack,
      dismissAll,
      pop,
      push,
      resize,
      setContent,
      setHeader,
      setFooter,
      updateConfig,
      item.id,
      stackIndex,
    ]
  );

  const handleDidPresent = useCallback(
    (event: any) => {
      item.callbacks.onDidPresent?.(event);
    },
    [item.callbacks]
  );

  const handleDidDismiss = useCallback(() => {
    item.callbacks.onDidDismiss?.();
    _removeSheet(item.id);
  }, [item.callbacks, item.id, _removeSheet]);

  const handleDetentChange = useCallback(
    (event: any) => {
      item.callbacks.onDetentChange?.(event);
    },
    [item.callbacks]
  );

  const handlePositionChange = useCallback(
    (event: any) => {
      item.callbacks.onPositionChange?.(event);
    },
    [item.callbacks]
  );

  const handleDidFocus = useCallback(() => {
    item.callbacks.onDidFocus?.();
  }, [item.callbacks]);

  const handleDidBlur = useCallback(() => {
    item.callbacks.onDidBlur?.();
  }, [item.callbacks]);

  // Resolve Header
  const renderedHeader = useMemo(() => {
    if (!item.header) return undefined;
    const resolved = typeof item.header === "function" ? item.header(helpers) : item.header;
    if (!resolved) return undefined;
    return isValidElement(resolved) ? resolved : <>{resolved}</>;
  }, [item.header, helpers]);

  // Resolve Footer
  const renderedFooter = useMemo(() => {
    if (!item.footer) return undefined;
    const resolved = typeof item.footer === "function" ? item.footer(helpers) : item.footer;
    if (!resolved) return undefined;
    return isValidElement(resolved) ? resolved : <>{resolved}</>;
  }, [item.footer, helpers]);

  // Resolve Main Content
  const renderedContent = useMemo(() => {
    if (!item.content) return null;
    return typeof item.content === "function" ? item.content(helpers) : item.content;
  }, [item.content, helpers]);

  const config = item.config;
  const effectiveBackgroundColor =
    config.backgroundColor || colors.surfaceContainerLow || colors.surface;
  const effectiveGrabberColor =
    config.grabberOptions?.color || colors.outline || "rgba(150, 150, 150, 0.4)";

  return (
    <TrueSheet
      ref={sheetRef}
      name={`global-${item.id}`}
      detents={config.detents || ["auto"]}
      cornerRadius={config.cornerRadius ?? 36}
      maxContentHeight={config.maxContentHeight}
      maxContentWidth={config.maxContentWidth}
      grabber={config.grabber ?? true}
      grabberOptions={{
        color: effectiveGrabberColor,
        ...config.grabberOptions,
      }}
      dimmed={config.dimmed ?? true}
      dimColor={config.dimColor}
      dimOpacity={config.dimOpacity}
      dimBlur={config.dimBlur}
      dimmedDetentIndex={config.dimmedDetentIndex}
      dismissible={config.dismissible ?? true}
      dismissThreshold={config.dismissThreshold}
      draggable={config.draggable ?? true}
      scrollableRef={config.scrollableRef}
      scrollableOptions={config.scrollableOptions}
      backgroundBlur={config.backgroundBlur}
      backgroundColor={effectiveBackgroundColor}
      background={config.background}
      backgroundStyle={config.backgroundStyle}
      detentBackgrounds={config.detentBackgrounds}
      insetAdjustment={config.insetAdjustment}
      lazy={config.lazy}
      placement={config.placement}
      placementOffset={config.placementOffset}
      initialDetentIndex={config.initialDetentIndex}
      initialDetentAnimated={config.initialDetentAnimated}
      style={config.style}
      header={renderedHeader}
      headerStyle={config.headerStyle}
      headerOptions={config.headerOptions}
      footer={renderedFooter}
      footerStyle={config.footerStyle}
      footerOptions={config.footerOptions}
      onDidPresent={handleDidPresent}
      onDidDismiss={handleDidDismiss}
      onDetentChange={handleDetentChange}
      onPositionChange={handlePositionChange}
      onDidFocus={handleDidFocus}
      onDidBlur={handleDidBlur}
    >
      {config.contentContainerStyle ? (
        <View style={config.contentContainerStyle}>{renderedContent}</View>
      ) : (
        renderedContent
      )}
    </TrueSheet>
  );
});

// ============================================================================
// 6. GLOBAL ROOT COMPONENT (Renders full active stack)
// ============================================================================

export const GlobalTrueSheet = memo(() => {
  const stack = useGlobalTrueSheetStore((s) => s.stack);

  if (stack.length === 0) return null;

  return (
    <>
      {stack.map((item, index) => (
        <GlobalTrueSheetInstance
          key={item.id}
          item={item}
          stackIndex={index}
        />
      ))}
    </>
  );
});

export default GlobalTrueSheet;
