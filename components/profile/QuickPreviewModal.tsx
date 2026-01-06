import FastImage from "@d11/react-native-fast-image";
import { BlurView } from "@sbaiahmed1/react-native-blur";
import React, { useEffect, useState } from "react";
import { Dimensions, Image, Modal, StyleSheet, View } from "react-native";
import Animated, {
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

const QuickPreviewModal: React.FC<QuickPreviewModalProps> = ({
    visible,
    imageUrl,
    onClose,
}) => {
    const [mounted, setMounted] = useState(visible);
    const [aspectRatio, setAspectRatio] = useState(1);
    const scale = useSharedValue(0.8);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            setMounted(true);
            scale.value = withSpring(1, { damping: 15, stiffness: 150 });
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            scale.value = withTiming(0.8, { duration: 150 });
            opacity.value = withTiming(0, { duration: 150 }, (finished) => {
                if (finished) {
                    runOnJS(setMounted)(false);
                }
            });
        }
    }, [visible]);

    useEffect(() => {
        if (imageUrl) {
            Image.getSize(imageUrl, (width, height) => {
                const ratio = width / height;
                setAspectRatio(ratio);
            }, () => {
                setAspectRatio(1);
            });
        }
    }, [imageUrl]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    if (!mounted && !visible) return null;

    // Calculate dimensions based on aspect ratio and screen size
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
                <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
                    <BlurView
                        style={StyleSheet.absoluteFill}
                        blurType="dark"
                        blurAmount={24}
                    />
                </Animated.View>

                <Animated.View style={[
                    styles.imageContainer,
                    { width: containerWidth, height: containerHeight },
                    animatedStyle
                ]}>
                    <FastImage
                        source={{ uri: imageUrl || "" }}
                        style={styles.image}
                        resizeMode={FastImage.resizeMode.cover}
                    />
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
