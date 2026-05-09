import { FlexText } from "@/components/FlexText";
import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { LANGUAGE_LABELS } from "@/i18n";
import { useAdminCheck } from "@/services/userprofile";
import { clearVideoCache, formatBytes, getCacheCount, getCacheSize, setMaxCacheSize } from "@/services/videoCache";
import { useLanguageStore } from "@/stores/language";
import { useMovieTrackerStore } from "@/stores/movieTracker";
import { useSearchHistoryStore } from "@/stores/searchHistory";
import { CACHE_SIZE_OPTIONS, useSettingsStore } from "@/stores/settings";
import { createCommonStyles } from "@/styles/common";
import { Ionicons } from "@expo/vector-icons";
import { Logout3Bold } from '@solar-icons/react-native';
import { Href, router } from "expo-router";
import { Button, ControlField, Description, Dialog, Label, Surface } from "heroui-native";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";




const SettingsScreen = () => {
    const { colors, themePreference, typography } = useThemeContext();
    const common = createCommonStyles(colors, typography);
    const styles = style(colors, common);
    const inset = useSafeAreaInsets();
    const { t } = useTranslation();
    const { mode: languageMode, language } = useLanguageStore();
    const {
        showSensitiveContent, toggleShowSensitiveContent,
        showCarousel, toggleCarousel,
        autoplayVideos, toggleAutoplayVideos,
        videoCacheSizeLimit, setVideoCacheSizeLimit,
    } = useSettingsStore();
    const { trackerSource } = useMovieTrackerStore();
    const trackerSourceLabel = trackerSource === 'shows'
        ? t('serviceSettings.showsOption')
        : t('serviceSettings.moviedbOption');

    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // ─── Cache state ────────────────────────────────────────────
    const [cacheSize, setCacheSize] = useState(0);
    const [cacheCount, setCacheCount] = useState(0);
    const [isClearing, setIsClearing] = useState(false);
    const [showCacheSizePicker, setShowCacheSizePicker] = useState(false);
    const [isClearCacheDialogOpen, setIsClearCacheDialogOpen] = useState(false);
    const { data: adminData } = useAdminCheck();
    const isAdmin = !!(adminData?.isAdmin ?? adminData?.is_admin);



    const refreshCacheInfo = useCallback(async () => {
        const [size, count] = await Promise.all([getCacheSize(), getCacheCount()]);
        setCacheSize(size);
        setCacheCount(count);
    }, []);

    const themePreferenceLabels = {
        light: t('settings.light'),
        dark: t('settings.dark'),
        system: t('settings.system'),
        adaptive: t('settings.adaptive')
    };

    useEffect(() => {
        refreshCacheInfo();
    }, [refreshCacheInfo]);

    // Sync the cache limit on mount 
    useEffect(() => {
        setMaxCacheSize(videoCacheSizeLimit);
    }, [videoCacheSizeLimit]);

    const handleClearCache = useCallback(() => {
        setIsClearCacheDialogOpen(true);
    }, []);

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
                        <FlexText style={[common.body, { color: colors.muted, marginLeft: 6 }]}>{t('settings.search')}</FlexText>
                    </View>
                )}
            </View>
            <FlexText style={[styles.title]}>{t('settings.preferences')}</FlexText>
            <Surface variant="default">
                <TouchableOpacity style={[styles.option]} onPress={() => router.push('/theme-settings')}>
                    <View>
                        <FlexText style={[common.body]}>{t('settings.theme')}</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{themePreferenceLabels[themePreference]}</FlexText>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.divider}></View>
                <TouchableOpacity style={[styles.option]} onPress={() => router.push('/language-settings' as Href)}>
                    <View>
                        <FlexText style={[common.body]}>{t('settings.language')}</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                            {languageMode === 'auto' ? t('settings.languageAuto') : LANGUAGE_LABELS[language]}
                        </FlexText>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.divider}></View>
                <ControlField
                    isSelected={!showSensitiveContent}
                    onSelectedChange={toggleShowSensitiveContent}
                    style={styles.option}
                >
                    <View style={{ flex: 1 }}>
                        <Label>{t('settings.adultFilter')}</Label>
                        <Description>{showSensitiveContent ? t('settings.adultFilterOff') : t('settings.adultFilterOn')}</Description>
                    </View>
                    <ControlField.Indicator />
                </ControlField>
                <View style={styles.divider}></View>
                <ControlField
                    isSelected={showCarousel}
                    onSelectedChange={toggleCarousel}
                    style={styles.option}
                >
                    <View style={{ flex: 1 }}>
                        <Label>{t('settings.homeCarousel')}</Label>
                        <Description>{t('settings.homeCarouselDescription')}</Description>
                    </View>
                    <ControlField.Indicator />
                </ControlField>
                <View style={styles.divider}></View>
                <ControlField
                    isSelected={autoplayVideos}
                    onSelectedChange={toggleAutoplayVideos}
                    style={styles.option}
                >
                    <View style={{ flex: 1 }}>
                        <Label>{t('settings.autoplayVideos')}</Label>
                        <Description>{t('settings.autoplayVideosDescription')}</Description>
                    </View>
                    <ControlField.Indicator />
                </ControlField>
            </Surface>

            {/* ─── Service ────────────────────────────────────────────── */}
            {isAdmin && <><FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.service')}</FlexText>
                <Surface variant="default">
                    <TouchableOpacity style={[styles.option]} onPress={() => router.push('/movie-tracker-settings' as any)}>
                        <View>
                            <FlexText style={[common.body]}>{t('settings.trackerSource')}</FlexText>
                            <FlexText style={[common.bodySmall, { color: colors.muted }]}>{trackerSourceLabel}</FlexText>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>
                </Surface>
            </>}

            {/* ─── Storage & Cache ──────────────────────────────────── */}
            <FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.storageCache')}</FlexText>
            <Surface variant="default">
                {/* Cache usage bar */}
                <View style={{ marginBottom: 12 }}>
                    <View style={styles.cacheInfoRow}>
                        <FlexText style={[common.body]}>{t('settings.videoCache')}</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>
                            {formatBytes(cacheSize)} / {currentLimitLabel}
                        </FlexText>
                    </View>
                    <FlexText style={[common.bodySmall, { color: colors.muted, marginBottom: 8 }]}>
                        {t('settings.videoCacheDescription', { count: cacheCount })}
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
                        <FlexText style={[common.body]}>{t('settings.maxCacheSize')}</FlexText>
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
                        {isClearing ? t('settings.clearCacheClearing') : t('settings.clearCacheIdle')}
                    </FlexText>
                    {isClearing && <ActivityIndicator size="small" color={colors.muted} />}
                </TouchableOpacity>
            </Surface>

            <FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.about')}</FlexText>
            <Surface variant="default">
                <TouchableOpacity style={[styles.option]} onPress={() => router.push('/about' as any)}>
                    <View>
                        <FlexText style={[common.body]}>{t('settings.aboutApp')}</FlexText>
                        <FlexText style={[common.bodySmall, { color: colors.muted }]}>{t('settings.aboutAppDescription')}</FlexText>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
            </Surface>

            <FlexText style={[styles.title, { marginTop: 24 }]}>{t('settings.account')}</FlexText>
            <Surface variant="default">
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
                    <FlexText style={[common.body, { color: colors.text }]}>{t('settings.logout')}</FlexText>
                    <Logout3Bold size={24} color={colors.text} />
                </TouchableOpacity>
            </Surface>

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
                        <FlexText style={[common.body, { color: colors.text, marginTop: 12 }]}>{t('settings.loggingOut')}</FlexText>
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
                            {t('settings.maxCacheSize')}
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
            <Dialog isOpen={isClearCacheDialogOpen} onOpenChange={setIsClearCacheDialogOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay />
                    <Dialog.Content>
                        <Dialog.Close />
                        <View style={{ marginBottom: 20, gap: 6 }}>
                            <Dialog.Title>{t('settings.clearVideoCache')}</Dialog.Title>
                            <Dialog.Description>
                                {t('settings.clearVideoCacheConfirmation', { size: formatBytes(cacheSize) })}
                            </Dialog.Description>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <Button variant="ghost" onPress={() => setIsClearCacheDialogOpen(false)}>
                                {t('settings.cancel')}
                            </Button>
                            <Button
                                variant="danger"
                                onPress={async () => {
                                    setIsClearCacheDialogOpen(false);
                                    setIsClearing(true);
                                    await clearVideoCache();
                                    await refreshCacheInfo();
                                    setIsClearing(false);
                                }}
                            >
                                {t('settings.clear')}
                            </Button>
                        </View>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog>
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

