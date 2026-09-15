import { describe, test, expect } from 'bun:test';

// ─── Test Android vs iOS Visibility Calculation Logic ─────────────────────────

describe('Video Autoplay Native Viewability Calculation', () => {

    test('Android current logic fails: marks offscreen video (below screen) as viewable', () => {
        const screenWidth = 384;
        const screenHeight = 832;
        const viewWidth = 384;
        const viewHeight = 512;

        // Simulate a video mounted in LegendList buffer below the screen at y = 1200
        const viewX = 0;
        const viewY = 1200; // Completely below 832px screen!

        // Android's current calculation in BlueskyVideoView.kt:
        const positionOnScreen = {
            left: viewX,
            top: viewY,
            right: viewX + viewWidth,
            bottom: viewY + viewHeight,
            width: () => viewWidth,
            height: () => viewHeight,
        };

        const visibleArea = positionOnScreen.width() * positionOnScreen.height();
        const totalArea = viewWidth * viewHeight;
        const isViewableEnoughAndroidCurrent = visibleArea >= 0.5 * totalArea;

        // BUG DEMONSTRATION:
        expect(isViewableEnoughAndroidCurrent).toBe(true); // ❌ It wrongly claims true!
    });

    test('Android current logic fails: marks offscreen horizontal carousel slide as viewable', () => {
        const screenWidth = 384;
        const screenHeight = 832;
        const viewWidth = 384;
        const viewHeight = 512;

        // Slide 2 rendered at x = 384 (horizontal offscreen in FlatList carousel)
        const viewX = 384;
        const viewY = 200;

        const positionOnScreen = {
            left: viewX,
            top: viewY,
            right: viewX + viewWidth,
            bottom: viewY + viewHeight,
            width: () => viewWidth,
            height: () => viewHeight,
        };

        const visibleArea = positionOnScreen.width() * positionOnScreen.height();
        const totalArea = viewWidth * viewHeight;
        const isViewableEnough = visibleArea >= 0.5 * totalArea;

        // BUG DEMONSTRATION:
        expect(isViewableEnough).toBe(true); // ❌ Wrongly activates hidden horizontal slide!
    });

    test('Fixed logic (iOS/GlobalVisibleRect style) correctly rejects offscreen videos', () => {
        const screenWidth = 384;
        const screenHeight = 832;
        const viewWidth = 384;
        const viewHeight = 512;

        const calculateCorrectVisibility = (x: number, y: number, w: number, h: number) => {
            // Screen bounds with 100px top header offset (same as iOS ViewManager)
            const headerOffset = 100;
            const screenLeft = 0;
            const screenTop = headerOffset;
            const screenRight = screenWidth;
            const screenBottom = screenHeight;

            // Intersection of view rect [x, y, x+w, y+h] with screen rect
            const intersectLeft = Math.max(screenLeft, x);
            const intersectTop = Math.max(screenTop, y);
            const intersectRight = Math.min(screenRight, x + w);
            const intersectBottom = Math.min(screenBottom, y + h);

            const intersectWidth = Math.max(0, intersectRight - intersectLeft);
            const intersectHeight = Math.max(0, intersectBottom - intersectTop);

            const visibleArea = intersectWidth * intersectHeight;
            const totalArea = w * h;

            return totalArea > 0 ? visibleArea / totalArea : 0;
        };

        // 1. Offscreen below viewport
        expect(calculateCorrectVisibility(0, 1200, viewWidth, viewHeight)).toBe(0); // 0% visible

        // 2. Offscreen above viewport
        expect(calculateCorrectVisibility(0, -600, viewWidth, viewHeight)).toBe(0); // 0% visible

        // 3. Offscreen horizontally (slide 2 in carousel)
        expect(calculateCorrectVisibility(384, 200, viewWidth, viewHeight)).toBe(0); // 0% visible

        // 4. Centered on screen (e.g. y = 200 to 712)
        const centeredVisibility = calculateCorrectVisibility(0, 200, viewWidth, viewHeight);
        expect(centeredVisibility).toBeGreaterThanOrEqual(0.9); // ~100% visible

        // 5. Only 20% visible at top edge (e.g. scrolling off)
        const edgeVisibility = calculateCorrectVisibility(0, -350, viewWidth, viewHeight);
        expect(edgeVisibility).toBeLessThan(0.5); // Should NOT autoplay (< 50%)
    });
});
