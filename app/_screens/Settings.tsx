import { FlexText } from "@/components/FlexText";
import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { clearVideoCache, formatBytes, getCacheCount, getCacheSize, setMaxCacheSize } from "@/services/videoCache";
import { useSearchHistoryStore } from "@/stores/searchHistory";
import { CACHE_SIZE_OPTIONS, useSettingsStore } from "@/stores/settings";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { Logout3Bold } from '@solar-icons/react-native';
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
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
    const {
        showSensitiveContent, toggleShowSensitiveContent,
        showCarousel, toggleCarousel,
        autoplayVideos, toggleAutoplayVideos,
        videoCacheSizeLimit, setVideoCacheSizeLimit,
    } = useSettingsStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // ─── Cache state ────────────────────────────────────────────
    const [cacheSize, setCacheSize] = useState(0);
    const [cacheCount, setCacheCount] = useState(0);
    const [isClearing, setIsClearing] = useState(false);
    const [showCacheSizePicker, setShowCacheSizePicker] = useState(false);

    const refreshCacheInfo = useCallback(async () => {
        const [size, count] = await Promise.all([getCacheSize(), getCacheCount()]);
        setCacheSize(size);
        setCacheCount(count);
    }, []);

    useEffect(() => {
        refreshCacheInfo();
    }, [refreshCacheInfo]);

    // Sync the cache limit on mount 
    useEffect(() => {
        setMaxCacheSize(videoCacheSizeLimit);
    }, [videoCacheSizeLimit]);

    const handleClearCache = useCallback(() => {
        Alert.alert(
            "Clear Video Cache",
            `This will free up ${formatBytes(cacheSize)} of storage. Continue?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        setIsClearing(true);
                        await clearVideoCache();
                        await refreshCacheInfo();
                        setIsClearing(false);
                    }
                }
            ]
        );
    }, [cacheSize, refreshCacheInfo]);

    const handleSetCacheLimit = useCallback(async (sizeBytes: number) => {
        setVideoCacheSizeLimit(sizeBytes);
        await setMaxCacheSize(sizeBytes);
        await refreshCacheInfo();
        setShowCacheSizePicker(false);
    }, [setVideoCacheSizeLimit, refreshCacheInfo]);

    const cacheUsagePercent = videoCacheSizeLimit > 0
        ? Math.min(cacheSize / videoCacheSizeLimit, 1)
        : 0;

    const currentLimitLabel = CACHE_SIZE_OPTIONS.find(o => o.value === videoCacheSizeLimit)?.label || formatBytes(videoCacheSizeLimit);

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
                        <FlexText style={[common.body, { color: colors.muted, marginLeft: 6 }]}>Search</FlexText>
                    </View>
                )}
            </View> 
            <FlexText style={[styles.title]}>Preferences</FlexText>
            <View style={[styles.card]}>
                <TouchableOpacity style={[styles.option]} onPress={() => router.push('/theme-settings')}>
                    <View>
                        <FlexText style={[common.body]}>Theme</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{themePreferenceLabels[themePreference]}</FlexText>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.divider}></View>
                <View style={[styles.option]}>
                    <View>
                        <FlexText style={[common.body]}>Adult filter</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{showSensitiveContent ? "Off" : "On"}</FlexText>
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
                        <FlexText style={[common.body]}>Home carousel</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>The carousel may contain sensitive media. {showCarousel ? "On" : "Off"}</FlexText>
                    </View>
                    <ToggleSwitch
                        isOn={showCarousel}
                        onColor="#54d340"
                        offColor={colors.card}
                        size="medium"
                        onToggle={toggleCarousel}
                    />
                </View>
                <View style={styles.divider}></View>
                <View style={[styles.option]}>
                    <View style={{ flex: 1 }}>
                        <FlexText style={[common.body]}>Autoplay videos</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>Automatically play videos in feed. {autoplayVideos ? "On" : "Off"}</FlexText>
                    </View>
                    <ToggleSwitch
                        isOn={autoplayVideos}
                        onColor="#54d340"
                        offColor={colors.card}
                        size="medium"
                        onToggle={toggleAutoplayVideos}
                    />
                </View>
            </View>

            {/* ─── Storage & Cache ──────────────────────────────────── */}
            <FlexText style={[styles.title, { marginTop: 24 }]}>Storage & Cache</FlexText>
            <View style={[styles.card]}>
                {/* Cache usage bar */}
                <View style={{ marginBottom: 12 }}>
                    <View style={styles.cacheInfoRow}>
                        <FlexText style={[common.body]}>Video cache</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                            {formatBytes(cacheSize)} / {currentLimitLabel}
                        </FlexText>
                    </View>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginBottom: 8 }]}>
                        {cacheCount} {cacheCount === 1 ? 'video' : 'videos'} cached
                    </FlexText>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                {
                                    width: `${Math.max(cacheUsagePercent * 100, 0)}%`,
                                    backgroundColor: cacheUsagePercent > 0.9 ? '#ff4444' : cacheUsagePercent > 0.7 ? '#ffaa00' : '#54d340',
                                },
                            ]}
                        />
                    </View>
                </View>
                <View style={styles.divider}></View>

                {/* Cache size limit picker */}
                <TouchableOpacity style={[styles.option]} onPress={() => setShowCacheSizePicker(true)}>
                    <View>
                        <FlexText style={[common.body]}>Max cache size</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{currentLimitLabel}</FlexText>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.divider}></View>

                {/* Clear cache button */}
                <TouchableOpacity
                    style={[styles.option]}
                    onPress={handleClearCache}
                    disabled={isClearing || cacheSize === 0}
                >
                    <FlexText style={[common.body, { color: cacheSize === 0 ? colors.muted : '#ff4444' }]}>
                        {isClearing ? 'Clearing...' : 'Clear video cache'}
                    </FlexText>
                    {isClearing && <ActivityIndicator size="small" color={colors.muted} />}
                </TouchableOpacity>
            </View>

            <FlexText style={[styles.title, { marginTop: 24 }]}>Account</FlexText>
            <View style={[styles.card]}>
                <TouchableOpacity style={[styles.option]} onPress={async () => {
                    try {
                        setIsLoggingOut(true);
                        const { signOut } = await import("@/services/login");
                        await signOut();
                        useSearchHistoryStore.getState().clearHistory();
                        router.dismissAll();
                        router.replace("/");
                    } catch (e) {
                        console.error(e);
                    } finally {
                        setIsLoggingOut(false);
                    }
                }}>
                    <FlexText style={[common.body, { color: colors.text }]}>Log out</FlexText>
                    <Logout3Bold size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* ─── Logging Out Modal ─────────────────────────────────── */}
            <Modal
                visible={isLoggingOut}
                transparent
                animationType="fade"
                statusBarTranslucent
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ActivityIndicator size="large" color={colors.text} />
                        <FlexText style={[common.body, { color: colors.text, marginTop: 12 }]}>Logging out...</FlexText>
                    </View>
                </View>
            </Modal>

            {/* ─── Cache Size Picker Modal ────────────────────────────── */}
            <Modal
                visible={showCacheSizePicker}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setShowCacheSizePicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowCacheSizePicker(false)}
                >
                    <View style={styles.pickerModal}>
                        <FlexText style={[common.body, { fontWeight: '700', marginBottom: 16, textAlign: 'center' }]}>
                            Max Cache Size
                        </FlexText>
                        {CACHE_SIZE_OPTIONS.map((option) => {
                            const isSelected = option.value === videoCacheSizeLimit;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[
                                        styles.pickerOption,
                                        isSelected && { backgroundColor: colors.verify + '22' },
                                    ]}
                                    onPress={() => handleSetCacheLimit(option.value)}
                                >
                                    <FlexText style={[common.body, isSelected && { color: colors.verify, fontWeight: '700' }]}>
                                        {option.label}
                                    </FlexText>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={22} color={colors.verify} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>
            <View style={{ marginBottom: inset.bottom + 16 }}></View>
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
    // ─── Cache styles ────────────────────────────────────────────
    cacheInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: colors.divider,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    pickerModal: {
        backgroundColor: colors.containerContent,
        borderRadius: 16,
        paddingVertical: 20,
        paddingHorizontal: 24,
        width: '80%',
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    pickerOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 4,
    },
});

export default SettingsScreen;

