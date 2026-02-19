import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { useSettingsStore } from "@/stores/settings";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ToggleSwitch from 'toggle-switch-react-native';

const themePreferenceLabels = {
    light: "Light",
    dark: "Dark",
    system: "System",
    adaptive: "Adaptive"
};

const SettingsScreen = () => {
    const { colors, themePreference, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const styles = style(colors, common);
    const inset = useSafeAreaInsets();
    const { showSensitiveContent, toggleShowSensitiveContent, showCarousel, toggleCarousel } = useSettingsStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    return (
        <ScrollView style={common.screenPadding}>
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
            <View style={styles.searchBar}>
                <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder=""
                    placeholderTextColor={colors.muted}
                    style={styles.searchInput}
                />
                {!searchQuery && !isFocused && (
                    <View style={styles.placeholderContainer} pointerEvents="none">
                        <Ionicons name='search' size={18} color={colors.muted} />
                        <Text style={[common.body, { color: colors.muted, marginLeft: 6 }]}>Search</Text>
                    </View>
                )}
            </View>
            <Text style={[styles.title]}>Preferences</Text>
            <View style={[styles.card]}>
                <TouchableOpacity style={[styles.option]} onPress={() => router.push('/theme-settings')}>
                    <View>
                        <Text style={[common.body]}>Theme</Text>
                        <Text style={[common.bodySmall, { color: colors.muted }]}>{themePreferenceLabels[themePreference]}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.divider}></View>
                <View style={[styles.option]}>
                    <View>
                        <Text style={[common.body]}>Adult filter</Text>
                        <Text style={[common.bodySmall, { color: colors.muted }]}>{showSensitiveContent ? "Off" : "On"}</Text>
                    </View>
                    <ToggleSwitch
                        isOn={!showSensitiveContent}
                        onColor="#54d340"
                        offColor={colors.card}
                        size="medium"
                        onToggle={toggleShowSensitiveContent}
                    />
                </View>
                <View style={styles.divider}></View>
                <View style={[styles.option]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[common.body]}>Home carousel</Text>
                        <Text style={[common.bodySmall, { color: colors.muted }]}>The carousel may contain sensitive media. {showCarousel ? "On" : "Off"}</Text>
                    </View>
                    <ToggleSwitch
                        isOn={showCarousel}
                        onColor="#54d340"
                        offColor={colors.card}
                        size="medium"
                        onToggle={toggleCarousel}
                    />
                </View>
            </View>
            <Text style={[styles.title, { marginTop: 24 }]}>Account</Text>
            <View style={[styles.card]}>
                <TouchableOpacity style={[styles.option]} onPress={async () => {
                    try {
                        setIsLoggingOut(true);
                        const { signOut } = await import("@/services/login");
                        await signOut();
                        router.dismissAll();
                        router.replace("/");
                    } catch (e) {
                        console.error(e);
                    } finally {
                        setIsLoggingOut(false);
                    }
                }}>
                    <Text style={[common.body, { color: '#FF3B30' }]}>Log out</Text>
                    <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
            </View>
            <Modal
                visible={isLoggingOut}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ActivityIndicator size="large" color={colors.text} />
                        <Text style={[common.body, { color: colors.text, marginTop: 12 }]}>Logging out...</Text>
                    </View>
                </View>
            </Modal>
        </ScrollView >
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
        marginBottom: 8,
    },
    option: {
        ...common.row,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 4
    },
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: 8,
    },
    searchBar: {
        backgroundColor: colors.containerContent,
        borderRadius: 12,
        height: 48,
        marginBottom: 16,
        justifyContent: "center",
        position: 'relative',
    },
    searchInput: {
        color: colors.text,
        fontSize: 16,
        paddingHorizontal: 16,
        textAlign: 'center',
    },
    placeholderContainer: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        left: 0,
        right: 0,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.containerContent,
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 36,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
});

export default SettingsScreen;
