import { FlexText } from "@/components/FlexText";
import { ThemeColors, ThemePreference, useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { CheckCircleBold, ClockCircleBold, MoonBold, SmartphoneBold, Sun2Bold } from '@solar-icons/react-native';
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ThemeOption = {
    id: ThemePreference;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
};

const themeOptions: ThemeOption[] = [
    {
        id: "light",
        label: "Light",
        description: "Always use light theme",
        icon: Sun2Bold
    },
    {
        id: "dark",
        label: "Dark",
        description: "Always use dark theme",
        icon: MoonBold
    },
    {
        id: "system",
        label: "System",
        description: "Follow device settings",
        icon: SmartphoneBold
    },
    {
        id: "adaptive",
        label: "Adaptive",
        description: "Change theme based on sunset and sunrise",
        icon: ClockCircleBold
    }
];

const ThemeSettingsScreen = () => {
    const { colors, themePreference, setThemePreference, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const styles = style(colors, common);
    const inset = useSafeAreaInsets();

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

            <FlexText style={[styles.title]}>Theme</FlexText>
            <FlexText style={[common.bodySmall, { color: colors.muted, marginBottom: 16 }]}>
                Choose how the app looks
            </FlexText>

            <View style={[styles.card]}>
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
                                    <FlexText style={[common.body]}>{option.label}</FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                                        {option.description}
                                    </FlexText>
                                </View>
                            </View>
                            {themePreference === option.id && (
                                <CheckCircleBold size={24} color="#54d340" />
                            )}
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
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
