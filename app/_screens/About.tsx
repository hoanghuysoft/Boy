import { FlexText } from "@/components/FlexText";
import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import * as Application from 'expo-application';
import { router } from "expo-router";
import * as Updates from 'expo-updates';
import { Surface } from "heroui-native";
import { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { NitroImage } from "react-native-nitro-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const AboutScreen = () => {
    const { colors, themePreference, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const styles = style(colors, common);
    const version = Application.nativeApplicationVersion;
    const buildVersion = Application.nativeBuildVersion;
    const inset = useSafeAreaInsets();
    const [id, setId] = useState('');

    useEffect(() => {
        if (!__DEV__) {
            const updateid = Updates.updateId;
            setId(updateid ?? 'unknown');
        } else {
            setId('dev_environment');
        }
    }, []);

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
            <NitroImage image={require('../../assets/images/logo_head.png')} style={{ width: 100, height: 100, marginBottom: 16 }} />
            <FlexText style={[common.headline, { marginBottom: 48 }]}>Welcome to WeLove!</FlexText>
            <Surface variant="default" style={{ width: '100%', padding: 16 }}>
                <TouchableOpacity>
                    <View>
                        <FlexText style={[common.body]}>App version</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{version}.{buildVersion}</FlexText>
                    </View>
                </TouchableOpacity>
                <View style={styles.divider}></View>
                <TouchableOpacity>
                    <View>
                        <FlexText style={[common.body]}>Runtime version</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{id}</FlexText>
                    </View>
                </TouchableOpacity>
            </Surface>
        </View>
    );
};

const style = (colors: ThemeColors, common: any) => StyleSheet.create({
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 8,
    }
});

export default AboutScreen;