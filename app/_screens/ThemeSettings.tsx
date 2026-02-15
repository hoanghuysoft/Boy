import { ThemeColors, ThemePreference, useThemeContext } from "@/context/ThemeContext";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SquircleView } from "expo-squircle-view";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ThemeOption = {
    id: ThemePreference;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
};

const themeOptions: ThemeOption[] = [
    {
        id: "light",
        label: "Light",
        description: "Always use light theme",
        icon: "sunny"
    },
    {
        id: "dark",
        label: "Dark",
        description: "Always use dark theme",
        icon: "moon"
    },
    {
        id: "system",
        label: "System",
        description: "Follow device settings",
        icon: "phone-portrait-outline"
    },
    {
        id: "adaptive",
        label: "Adaptive",
        description: "Change theme based on sunset and sunrise",
        icon: "time-outline"
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

            <Text style={[styles.title]}>Theme</Text>
            <Text style={[common.bodySmall, { color: colors.muted, marginBottom: 16 }]}>
                Choose how the app looks
            </Text>

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
                                    <Ionicons
                                        name={option.icon}
                                        size={20}
                                        color={themePreference === option.id ? "#fff" : colors.text}
                                    />
                                </SquircleView>
                                <View style={styles.optionText}>
                                    <Text style={[common.body]}>{option.label}</Text>
                                    <Text style={[common.bodySmall, { color: colors.muted }]}>
                                        {option.description}
                                    </Text>
                                </View>
                            </View>
                            {themePreference === option.id && (
                                <Ionicons name="checkmark-circle" size={24} color="#54d340" />
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
