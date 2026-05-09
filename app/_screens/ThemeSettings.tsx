import { FlexText } from "@/components/FlexText";
import { ThemeColors, ThemePreference, useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { CheckCircleBold, ClockCircleBold, MoonBold, SmartphoneBold, Sun2Bold } from '@solar-icons/react-native';
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { Surface } from "heroui-native";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Only static, non-translatable data lives outside the component.
// Translatable strings (label, description) are fetched via t() at render time.
type ThemeOption = {
    id: ThemePreference;
    icon: React.ComponentType<any>;
};

const themeOptions: ThemeOption[] = [
    { id: "light", icon: Sun2Bold },
    { id: "dark", icon: MoonBold },
    { id: "system", icon: SmartphoneBold },
    { id: "adaptive", icon: ClockCircleBold },
];

const ThemeSettingsScreen = () => {
    const { colors, themePreference, setThemePreference, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const styles = style(colors, common);
    const inset = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <ScrollView style={[common.screenPadding, { backgroundColor: colors.background }]}>
            <View style={{ position: 'absolute', top: inset.top, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.containerContent,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <Ionicons name='chevron-back' size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
            <View style={{ marginTop: inset.top + 50 }}></View>

            <FlexText style={[styles.title]}>{t('themeSettings.title')}</FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginBottom: 16 }]}>
                {t('themeSettings.subtitle')}
            </FlexText>

            <Surface variant="default">
                {themeOptions.map((option, index) => (
                    <View key={option.id}>
                        {index > 0 && <View style={styles.divider} />}
                        <TouchableOpacity
                            style={[styles.option]}
                            onPress={() => setThemePreference(option.id)}
                        >
                            <View style={styles.optionLeft}>
                                <SquircleView cornerSmoothing={100} preserveSmoothing={true} style={[styles.iconContainer, themePreference === option.id && styles.iconContainerActive]}>
                                    <option.icon
                                        size={24}
                                        color={themePreference === option.id ? "#fff" : colors.text}
                                    />
                                </SquircleView>
                                <View style={styles.optionText}>
                                    <FlexText style={[common.body]}>
                                        {t(`themeSettings.options.${option.id}.label`)}
                                    </FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                                        {t(`themeSettings.options.${option.id}.description`)}
                                    </FlexText>
                                </View>
                            </View>
                            {themePreference === option.id && (
                                <CheckCircleBold size={24} color="#54d340" />
                            )}
                        </TouchableOpacity>
                    </View>
                ))}
            </Surface>
        </ScrollView>
    );
};

const style = (colors: ThemeColors, common: any) => StyleSheet.create({
    card: {
        backgroundColor: colors.containerContent,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        ...common.title,
        marginBottom: 4,
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
    },
    optionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    optionText: {
        marginLeft: 12,
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.card,
        justifyContent: "center",
        alignItems: "center",
    },
    iconContainerActive: {
        backgroundColor: "#54d340",
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 8,
    },
});

export default ThemeSettingsScreen;
