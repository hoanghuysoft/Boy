
import { FasterImageView } from "@rraut/react-native-faster-image";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, Modal, StyleSheet, View } from "react-native";
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface QuickPreviewModalProps {
    visible: boolean;
    imageUrl: string | null;
    onClose: () => void;
}

// Native spring config for smoother animations
const SPRING_CONFIG = {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

// Native timing config
const TIMING_CONFIG = {
    duration: 200,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
};

const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({
    visible,
    imageUrl,
    onClose,
}) => {
    const [mounted, setMounted] = useState(visible);
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0);

    // Compute aspect ratio from dimensions
    const aspectRatio = dimensions ? dimensions.width / dimensions.height : 1;

    useEffect(() => {
        if (visible) {
            setMounted(true);
            scale.value = withSpring(1, SPRING_CONFIG);
            opacity.value = withTiming(1, TIMING_CONFIG);
        } else {
            scale.value = withTiming(0.8, {
                duration: 150,
                easing: Easing.out(Easing.cubic),
            });
            opacity.value = withTiming(0, {
                duration: 150,
                easing: Easing.out(Easing.cubic),
            }, (finished) => {
                'worklet';
                if (finished) {
                    runOnJS(setMounted)(false);
                }
            });
        }
    }, [visible]);

    // Fetch image dimensions when imageUrl changes
    useEffect(() => {
        if (imageUrl) {
            setDimensions(null);
            Image.getSize(
                imageUrl,
                (width, height) => setDimensions({ width, height }),
                () => setDimensions(null)
            );
        } else {
            setDimensions(null);
        }
    }, [imageUrl]);

    const animatedStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    const backdropStyle = useAnimatedStyle(() => {
        'worklet';
        return {
            opacity: opacity.value,
        };
    });

    if (!mounted && !visible) return null;

    const maxWidth = SCREEN_WIDTH * 0.9;
    const maxHeight = SCREEN_HEIGHT * 0.7;

    let containerWidth = maxWidth;
    let containerHeight = maxWidth / aspectRatio;

    if (containerHeight > maxHeight) {
        containerHeight = maxHeight;
        containerWidth = maxHeight * aspectRatio;
    }

    return (
        <Modal
            transparent
            visible={mounted}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <Animated.View style={[styles.backdrop, backdropStyle]} />

                <Animated.View style={[styles.contentWrapper, animatedStyle]}>
                    <View style={[
                        styles.imageContainer,
                        { width: containerWidth, height: containerHeight },
                    ]}>
                        <FasterImageView
                            source={{ uri: imageUrl || "" }}
                            style={styles.image}
                        />
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.85)",
    },
    contentWrapper: {
        alignItems: "center",
    },
    imageContainer: {
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.05)",
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    image: {
        width: "100%",
        height: "100%",
    },

});

export default QuickPreviewModal;
