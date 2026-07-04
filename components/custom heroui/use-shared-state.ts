import { useCallback, useSyncExternalStore } from 'react';

/**
 * Shared state store for toast components
 * Uses a Map to store state by key and listeners for each key
 */
const sharedStateStore = new Map<string, unknown>();
const stateListeners = new Map<string, Set<() => void>>();

/**
 * Generic hook to access and update shared state
 * Can be used in both parent component and toast component
 *
 * Uses React's useSyncExternalStore to safely synchronize state without
 * triggering warnings about synchronous updates inside useEffect.
 *
 * @param key - Unique key to identify the shared state
 * @param initialValue - Initial value if state doesn't exist yet
 * @returns Object with state value, setState function, and resetState function
 */
export function useSharedState<T>(key: string, initialValue: T) {
  // If the store doesn't have the key yet, set it to the initial value
  if (!sharedStateStore.has(key)) {
    sharedStateStore.set(key, initialValue);
  }

  // Subscribe function for useSyncExternalStore
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!stateListeners.has(key)) {
        stateListeners.set(key, new Set());
      }
      const listeners = stateListeners.get(key)!;
      listeners.add(onStoreChange);

      return () => {
        listeners.delete(onStoreChange);
        if (listeners.size === 0) {
          stateListeners.delete(key);
        }
      };
    },
    [key]
  );

  // Snapshot function to get the current value
  const getSnapshot = useCallback(() => {
    return (sharedStateStore.get(key) ?? initialValue) as T;
  }, [key, initialValue]);

  const state = useSyncExternalStore(subscribe, getSnapshot);

  // Set state and notify all listeners
  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      const currentValue = (sharedStateStore.get(key) ?? initialValue) as T;
      const newValue =
        typeof value === 'function'
          ? (value as (prev: T) => T)(currentValue)
          : value;

      sharedStateStore.set(key, newValue);

      const listeners = stateListeners.get(key);
      if (listeners) {
        listeners.forEach((listener) => listener());
      }
    },
    [key, initialValue]
  );

  // Reset state to initial value
  const resetState = useCallback(() => {
    sharedStateStore.set(key, initialValue);

    const listeners = stateListeners.get(key);
    if (listeners) {
      listeners.forEach((listener) => listener());
    }
  }, [key, initialValue]);

  return { state, setState, resetState };
}