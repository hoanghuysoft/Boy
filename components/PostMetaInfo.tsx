import { useThemeContext } from '@/context/ThemeContext';
import { createCommonStyles } from '@/styles/common';
import { Post } from '@/types/post';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
    cancelAnimation,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring
} from 'react-native-reanimated';

dayjs.extend(relativeTime);

interface PostMetaInfoProps {
    post: Post;
}

const ITEM_HEIGHT = 20; // Fixed height for a single line of text

const MetaInfoCycler = React.memo(({ items, colors, common }: { items: string[], colors: any, common: any }) => {
    // 1. Create a "Carousel" list: [Item A, Item B, Item A]. 
    // The duplicate at the end allows us to loop seamlessly.
    const carouselItems = useMemo(() => [...items, items[0]], [items]);
    const translateY = useSharedValue(0);

    useEffect(() => {
        // This function manages the animation sequence
        const runSequence = (targetIndex: number) => {
            const nextOffset = -targetIndex * ITEM_HEIGHT;

            // Wait 3s, then slide up to the next item
            translateY.value = withDelay(3000, withSpring(nextOffset, {
                damping: 20,   // Higher damping = less bouncy, more stable
                stiffness: 90, // Softer spring feels more like a ticker
                mass: 1,
            }, (finished) => {
                if (finished) {
                    const isLastItem = targetIndex === carouselItems.length - 1;

                    if (isLastItem) {
                        // HIT THE BOTTOM: We are currently showing the duplicate 'Item A'.
                        // 1. Reset instantly to the real 'Item A' at the top (0px).
                        translateY.value = 0;
                        // 2. Start the loop again, aiming for 'Item B' (index 1).
                        runOnJS(runSequence)(1);
                    } else {
                        // NORMAL STEP: Just move to the next item.
                        runOnJS(runSequence)(targetIndex + 1);
                    }
                }
            }));
        };

        // Start the loop (aiming for index 1)
        runSequence(1);

        return () => cancelAnimation(translateY);
    }, [carouselItems, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    return (
        <View style={styles.container}>
            {/* SIZER:
               Renders all items invisibly. This forces the parent container 
               to be exactly as wide as the widest text item.
            */}
            <View style={styles.sizer}>
                {items.map((t, i) => (
                    <Text key={i} style={[common.label, { fontSize: 12, opacity: 0, height: 0 }]}>
                        {t}
                    </Text>
                ))}
            </View>

            {/* CAROUSEL:
               An absolute view that fills the container. 
               Inside, we have a tall vertical column of text that slides up.
            */}
            <View style={styles.carouselWindow}>
                <Animated.View style={animatedStyle}>
                    {carouselItems.map((item, index) => (
                        <View key={index} style={{ height: ITEM_HEIGHT, justifyContent: 'center' }}>
                            <Text
                                style={[common.label, { color: colors.muted, fontSize: 12 }]}
                                numberOfLines={1}
                            >
                                {item}
                            </Text>
                        </View>
                    ))}
                </Animated.View>
            </View>
        </View>
    );
});
MetaInfoCycler.displayName = "MetaInfoCycler";

export const PostMetaInfo = React.memo(({ post }: PostMetaInfoProps) => {
    const { colors, typography } = useThemeContext();
    const common = useMemo(() => createCommonStyles(colors, typography), [colors, typography]);

    const locationName = typeof post.location === 'string' ? post.location : post.location?.name;
    const musicInfo = post.music?.title && post.music?.artist ? `${post.music.title} - ${post.music.artist}` : undefined;

    const items = useMemo(() => {
        const list: string[] = [dayjs(post.created_at).fromNow()];
        if (locationName) list.push(locationName);
        if (musicInfo) list.push(musicInfo);
        return list;
    }, [post.created_at, locationName, musicInfo]);

    if (items.length === 0) return null;

    if (items.length === 1) {
        return (
            <View>
                <Text style={[common.label, { color: colors.muted, fontSize: 12 }]}>
                    {items[0]}
                </Text>
            </View>
        );
    }

    return <MetaInfoCycler items={items} colors={colors} common={common} />;
}, (prev, next) => {
    const getLocationName = (loc: any) => typeof loc === 'string' ? loc : loc?.name;
    return (
        prev.post.id === next.post.id &&
        prev.post.created_at === next.post.created_at &&
        getLocationName(prev.post.location) === getLocationName(next.post.location) &&
        prev.post.music?.title === next.post.music?.title &&
        prev.post.music?.artist === next.post.music?.artist
    );
});
PostMetaInfo.displayName = "PostMetaInfo";

const styles = StyleSheet.create({
    container: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    sizer: {
        // Forces width to match widest content
        flexDirection: 'column',
        height: 0,
        opacity: 0,
    },
    carouselWindow: {
        ...StyleSheet.absoluteFill,
        justifyContent: 'flex-start', // Align to top so translateY works from 0 down
        width: '100%', // Ensures it takes the width reserved by Sizer
    }
});