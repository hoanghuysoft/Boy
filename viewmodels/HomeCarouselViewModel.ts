import { useCarouselQuery } from "@/services/carousel";
import { useCarouselColorStore } from "@/stores/carouselColor";
import * as FileSystem from 'expo-file-system/legacy';
import _ from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAROUSEL_HEIGHT = SCREEN_HEIGHT * 0.28;
const AUTO_SCROLL_INTERVAL = 30000;

export const useHomeCarouselViewModel = (animatedVisibility?: Animated.Value) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [localCache, setLocalCache] = useState<Record<string, string>>({});
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { data: carouselData = [] } = useCarouselQuery();

    const analyzeImageLuminance = useCarouselColorStore(state => state.analyzeImageLuminance);

    const activeCarouselData = useMemo(
        () => carouselData.filter(item => item.is_active),
        [carouselData]
    );

    const currentImageUrl = activeCarouselData[currentIndex]?.image_url;
    const currentLocalImageUrl = currentImageUrl ? (localCache[currentImageUrl] || currentImageUrl) : undefined;

    useEffect(() => {
        let isMounted = true;

        const cacheImages = async () => {
            for (const item of activeCarouselData) {
                const url = item.image_url;

                if (!url || localCache[url]) continue;

                try {
                    const safeFilename = url.replace(/[^a-zA-Z0-9]/g, '_') + '.jpg';
                    const fileUri = `${FileSystem.cacheDirectory}${safeFilename}`;

                    const fileInfo = await FileSystem.getInfoAsync(fileUri);

                    if (fileInfo.exists) {
                        if (isMounted) {
                            setLocalCache(prev => ({ ...prev, [url]: fileUri }));
                        }
                    } else {
                        const downloadResult = await FileSystem.downloadAsync(url, fileUri);
                        if (downloadResult.status === 200 && isMounted) {
                            setLocalCache(prev => ({ ...prev, [url]: downloadResult.uri }));
                        }
                    }
                } catch (error) {
                    console.error(`Failed to cache image ${url}:`, error);
                }
            }
        };

        if (activeCarouselData.length > 0) {
            cacheImages();
        }

        return () => {
            isMounted = false;
        };
    }, [activeCarouselData]);

    // analyzeImageLuminance is intentionally NOT called here.
    // It is called by HomeCarousel once Skia confirms the image is rendered,
    // so the text color change is always in sync with the image appearing.

    const remainingIndicesRef = useRef<number[]>([]);
    const currentIndexRef = useRef(currentIndex);
    currentIndexRef.current = currentIndex;

    useEffect(() => {
        remainingIndicesRef.current = _.range(activeCarouselData.length);
        if (currentIndexRef.current >= activeCarouselData.length) {
            setCurrentIndex(0);
        }
    }, [activeCarouselData.length]);

    const getNextRandomIndex = useCallback(() => {
        if (activeCarouselData.length <= 1) return 0;

        if (remainingIndicesRef.current.length === 0) {
            remainingIndicesRef.current = _.range(activeCarouselData.length);
        }

        const indicesToUse = _.without(remainingIndicesRef.current, currentIndexRef.current);
        const finalIndices = indicesToUse.length > 0 ? indicesToUse : remainingIndicesRef.current;

        const nextIndex = _.sample(finalIndices) ?? 0;
        _.pull(remainingIndicesRef.current, nextIndex);

        return nextIndex;
    }, [activeCarouselData.length]);

    const getNextRandomIndexRef = useRef(getNextRandomIndex);
    getNextRandomIndexRef.current = getNextRandomIndex;

    const isVisibleRef = useRef(true);

    useEffect(() => {
        if (activeCarouselData.length <= 1) return;

        const startAutoScroll = () => {
            if (intervalRef.current) return;
            intervalRef.current = setInterval(() => {
                setCurrentIndex(getNextRandomIndexRef.current());
            }, AUTO_SCROLL_INTERVAL);
        };

        const stopAutoScroll = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        startAutoScroll();

        let listenerId: string | undefined;
        if (animatedVisibility) {
            listenerId = animatedVisibility.addListener(({ value }) => {
                const shouldBeVisible = value > 0.5;
                if (isVisibleRef.current !== shouldBeVisible) {
                    isVisibleRef.current = shouldBeVisible;
                    if (shouldBeVisible) {
                        startAutoScroll();
                    } else {
                        stopAutoScroll();
                    }
                }
            });
        }

        return () => {
            stopAutoScroll();
            if (listenerId && animatedVisibility) {
                animatedVisibility.removeListener(listenerId);
            }
        };
    }, [activeCarouselData.length, animatedVisibility]);

    return {
        currentIndex,
        currentImageUrl,
        currentLocalImageUrl, // <- Pass this to Skia
        cachedImagesMap: localCache, // <- Pass this if rendering a list of items
        activeCarouselData,
        analyzeImageLuminance,
        SCREEN_WIDTH,
        CAROUSEL_HEIGHT,
    };
};