import { CustomSurface } from "@/components/CustomSurface";
import { FlexText } from "@/components/FlexText";
import { useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import * as Application from 'expo-application';
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import * as Updates from 'expo-updates';
import React, { useEffect } from 'react';
import { TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

const AboutScreen = () => {
    const { colors, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const version = Application.nativeApplicationVersion;
    const buildVersion = Application.nativeBuildVersion;
    const inset = useSafeAreaInsets();
    const runtimeVersion = __DEV__ ? 'dev_environment' : (Updates.updateId ?? 'unknown');

    const glowScale = useSharedValue(0.6);
    const glowOpacity = useSharedValue(0);

    useEffect(() => {
        glowScale.value = withSpring(1, {
            damping: 16,
            stiffness: 90,
            mass: 0.9,
        });
        glowOpacity.value = withTiming(0.7, {
            duration: 650,
            easing: Easing.out(Easing.quad),
        });
    }, [glowScale, glowOpacity]);

    const animatedGlowStyle = useAnimatedStyle(() => ({
        transform: [{ scale: glowScale.value }],
        opacity: glowOpacity.value,
    }));

    return (
        <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1, backgroundColor: colors.background, padding: 16 }}>
            <View style={{ position: 'absolute', top: inset.top + 16, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 16, width: 100, height: 100 }}>
                <AnimatedExpoImage
                    style={[
                        {
                            position: 'absolute',
                            width: 260,
                            height: 260,
                        },
                        animatedGlowStyle,
                    ]}
                    source={{ uri: 'https://static.vecteezy.com/system/resources/thumbnails/078/720/341/small/cyan-and-aqua-grainy-gradient-circle-png.png' }}
                    contentFit="contain"
                />
                <ExpoImage
                    source={require('../../assets/images/logo_head.png')}
                    style={{ width: 100, height: 100 }}
                    contentFit="contain"
                />
            </View>
            <FlexText style={[common.headline, { marginBottom: 48 }]}>Welcome to WeLove!</FlexText>
            <View style={{ gap: 3, width: '100%' }}>
                <CustomSurface
                    isFirst
                    style={{ padding: 16 }}
                >
                    <View>
                        <FlexText style={[common.body]}>App version</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{version}.{buildVersion}</FlexText>
                    </View>
                </CustomSurface>
                <CustomSurface
                    isLast
                    style={{ padding: 16 }}
                >
                    <View>
                        <FlexText style={[common.body]}>Runtime version</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{runtimeVersion}</FlexText>
                    </View>
                </CustomSurface>
            </View>
        </View>
    );
};

export default AboutScreen;