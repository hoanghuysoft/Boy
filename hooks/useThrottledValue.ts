import { useEffect, useRef, useState } from 'react';
import { useNonReactiveCallback } from '@/components/list/useNonReactiveCallback';

/**
 * Returns a value that updates at most once per `time` ms.
 * Useful for throttling loading spinners to avoid frame-flickers.
 */
export function useThrottledValue<T>(value: T, time: number): T {
    const pendingValueRef = useRef(value);
    const [throttledValue, setThrottledValue] = useState(value);

    useEffect(() => {
        pendingValueRef.current = value;
    }, [value]);

    const handleTick = useNonReactiveCallback(() => {
        if (pendingValueRef.current !== throttledValue) {
            setThrottledValue(pendingValueRef.current);
        }
    });

    useEffect(() => {
        const id = setInterval(handleTick, time);
        return () => {
            clearInterval(id);
        };
    }, [handleTick, time]);

    return throttledValue;
}
