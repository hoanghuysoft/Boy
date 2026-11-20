import { FlexText } from "@/components/FlexText";
import { ThemeColors, useThemeContext } from "@/context/ThemeContext";
import { LANGUAGE_LABELS } from "@/i18n";
import { useAdminCheck } from "@/services/userprofile";
import { clearVideoCache, formatBytes, getCacheCount, getCacheSize, setMaxCacheSize } from "@/services/videoCache";
import { useLanguageStore } from "@/stores/language";

import Logout from "@/assets/images/svg/logout.svg";
import { CustomSurface } from "@/components/CustomSurface";
import { AccountSwitcherSheet } from "@/components/sheets/AccountSwitcherSheet";
import { useAppLockStore } from "@/stores/appLock";
import { CACHE_SIZE_OPTIONS, useSettingsStore } from "@/stores/settings";
import { createCommonStyles } from "@/styles/common";
import type { AccountSwitcherSheetHandle } from "@/types/sheetHandles";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import Ionicons from "@react-native-vector-icons/ionicons/static";
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router, useFocusEffect } from "expo-router";
import { Button } from "heroui-native/button";
import { ControlField } from "heroui-native/control-field";
import { Dialog } from "heroui-native/dialog";
import { Input } from "heroui-native/input";
import { Select } from "heroui-native/select";
import { TextField } from "heroui-native/text-field";
import { Spinner } from "panelui-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Easing, Keyboard, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";




interface SettingItem {
    id: string;
    title: string;
    description?: string;
    keywords?: string[];
    render: (index: number, total: number) => React.ReactNode;
}

interface SettingSection {
    id: string;
    title: string;
    items: SettingItem[];
}

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
        videoCacheSizeLimit, setVideoCacheSizeLimit,
        imgbbApiKey, setImgbbApiKey,
        x02ApiKey, setX02ApiKey,
        makeBottomBarCurve, toggleMakeBottomBarCurve,
        switchToGlass, toggleSwitchToGlass,
        disableAutoplay, toggleDisableAutoplay,
    } = useSettingsStore();
    const { appLockEnabled } = useAppLockStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const thirdPartySheetRef = useRef<TrueSheet>(null);
    const accountSwitcherRef = useRef<AccountSwitcherSheetHandle>(null);

    // ─── Cache state ────────────────────────────────────────────
    const [cacheSize, setCacheSize] = useState(0);
    const [cacheCount, setCacheCount] = useState(0);
    const [isClearing, setIsClearing] = useState(false);
    const [isClearCacheDialogOpen, setIsClearCacheDialogOpen] = useState(false);
    const { data: adminData } = useAdminCheck();
    const isAdmin = !!(adminData?.isAdmin ?? adminData?.is_admin);

    const [keyboardHeight, setKeyboardHeight] = useState(0);

    // Keep the absolute search bar above the keyboard.
    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, (e) => {
            setKeyboardHeight(e.endCoordinates?.height ?? 0);
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            setKeyboardHeight(0);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);



    const refreshCacheInfo = useCallback(async () => {
        const [size, count] = await Promise.all([getCacheSize(), getCacheCount()]);
        setCacheSize(size);
        setCacheCount(count);
    }, []);

    const themePreferenceLabels = {
        light: t('settings.light'),
        dark: t('settings.dark'),
        system: t('settings.system'),
        adaptive: t('settings.adaptive'),
        'material-you': t('themeSettings.options.material-you.label')
    };

    useFocusEffect(
        useCallback(() => {
            const timer = setTimeout(() => {
                refreshCacheInfo();
            }, 0);
            return () => clearTimeout(timer);
        }, [refreshCacheInfo])
    );



    const handleClearCache = useCallback(() => {
        setIsClearCacheDialogOpen(true);
    }, []);

    const handleSetCacheLimit = useCallback(async (sizeBytes: number) => {
        setVideoCacheSizeLimit(sizeBytes);
        await setMaxCacheSize(sizeBytes);
        await refreshCacheInfo();
    }, [setVideoCacheSizeLimit, refreshCacheInfo]);

    const cacheUsagePercent = videoCacheSizeLimit > 0
        ? Math.min(cacheSize / videoCacheSizeLimit, 1)
        : 0;

    const currentLimitLabel = CACHE_SIZE_OPTIONS.find(o => o.value === videoCacheSizeLimit)?.label || formatBytes(videoCacheSizeLimit);

    const { colors: fadeColors, locations: fadeLocations } = easeGradient({
        colorStops: {
            0: {
                color: colors.surface,
            },
            0.2: {
                color: colors.surface,
                easing: Easing.in(Easing.cubic),
            },
            1: {
                color: `${colors.surface}00`,
            },
        },
        extraColorStopsPerTransition: 16,
    });

    const sections = useMemo<SettingSection[]>(() => [
        {
            id: 'accountAndSecurity',
            title: t('settings.accountAndSecurity'),
            items: [
                {
                    id: 'security',
                    title: t('settings.security'),
                    description: appLockEnabled ? t('settings.securityEnabled') : t('settings.securityDisabled'),
                    keywords: ['security', 'app lock', 'password', 'pin', 'lock', 'bảo mật', 'mật khẩu', 'khóa'],
                    render: (index: number, total: number) => (
                        <CustomSurface
                            index={index}
                            total={total}
                            onPress={() => router.push('/security-settings')}
                            style={styles.option}
                        >
                            <View>
                                <FlexText style={[common.body]}>{t('settings.security')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>
                                    {appLockEnabled ? t('settings.securityEnabled') : t('settings.securityDisabled')}
                                </FlexText>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                        </CustomSurface>
                    ),
                },
            ],
        },
        {
            id: 'preferences',
            title: t('settings.preferences'),
            items: [
                {
                    id: 'theme',
                    title: t('settings.theme'),
                    description: themePreferenceLabels[themePreference],
                    keywords: ['theme', 'dark', 'light', 'system', 'adaptive', 'material', 'appearance', 'mode', 'giao diện', 'tối', 'sáng'],
                    render: (index: number, total: number) => (
                        <CustomSurface
                            index={index}
                            total={total}
                            onPress={() => router.push('/theme-settings')}
                            style={styles.option}
                        >
                            <View>
                                <FlexText style={[common.body]}>{t('settings.theme')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>{themePreferenceLabels[themePreference]}</FlexText>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                        </CustomSurface>
                    ),
                },
                {
                    id: 'language',
                    title: t('settings.language'),
                    description: languageMode === 'auto' ? t('settings.languageAuto') : LANGUAGE_LABELS[language],
                    keywords: ['language', 'locale', 'english', 'vietnamese', 'chinese', 'translate', 'ngôn ngữ', 'dịch'],
                    render: (index: number, total: number) => (
                        <CustomSurface
                            index={index}
                            total={total}
                            onPress={() => router.push('/language-settings' as Href)}
                            style={styles.option}
                        >
                            <View>
                                <FlexText style={[common.body]}>{t('settings.language')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>
                                    {languageMode === 'auto' ? t('settings.languageAuto') : LANGUAGE_LABELS[language]}
                                </FlexText>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                        </CustomSurface>
                    ),
                },
                {
                    id: 'adultFilter',
                    title: t('settings.adultFilter'),
                    description: showSensitiveContent ? t('settings.adultFilterOff') : t('settings.adultFilterOn'),
                    keywords: ['adult', 'sensitive', 'filter', 'nsfw', '18+', 'nhạy cảm', 'lọc nội dung'],
                    render: (index: number, total: number) => (
                        <CustomSurface index={index} total={total} style={styles.option}>
                            <ControlField
                                isSelected={!showSensitiveContent}
                                onSelectedChange={toggleShowSensitiveContent}
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <View style={{ flex: 1 }}>
                                    <FlexText style={common.body}>{t('settings.adultFilter')}</FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>{showSensitiveContent ? t('settings.adultFilterOff') : t('settings.adultFilterOn')}</FlexText>
                                </View>
                                <ControlField.Indicator />
                            </ControlField>
                        </CustomSurface>
                    ),
                },
                {
                    id: 'homeCarousel',
                    title: t('settings.homeCarousel'),
                    description: t('settings.homeCarouselDescription'),
                    keywords: ['carousel', 'home', 'banner', 'slider', 'trang chủ', 'trình chiếu'],
                    render: (index: number, total: number) => (
                        <CustomSurface index={index} total={total} style={styles.option}>
                            <ControlField
                                isSelected={showCarousel}
                                onSelectedChange={toggleCarousel}
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <View style={{ flex: 1 }}>
                                    <FlexText style={common.body}>{t('settings.homeCarousel')}</FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>{t('settings.homeCarouselDescription')}</FlexText>
                                </View>
                                <ControlField.Indicator />
                            </ControlField>
                        </CustomSurface>
                    ),
                },
                // {
                //     id: 'switchToGlass',
                //     title: t('settings.switchToGlass'),
                //     description: t('settings.switchToGlassDescription'),
                //     keywords: ['glass', 'tab', 'tab bar', 'navigation', 'bar', 'thanh điều hướng', 'kính'],
                //     render: (index: number, total: number) => (
                //         <CustomSurface index={index} total={total} style={styles.option}>
                //             <ControlField
                //                 isSelected={switchToGlass}
                //                 onSelectedChange={toggleSwitchToGlass}
                //                 style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                //             >
                //                 <View style={{ flex: 1 }}>
                //                     <FlexText style={common.body}>{t('settings.switchToGlass')}</FlexText>
                //                     <FlexText style={[common.bodySmall, { color: colors.muted }]}>{t('settings.switchToGlassDescription')}</FlexText>
                //                 </View>
                //                 <ControlField.Indicator />
                //             </ControlField>
                //         </CustomSurface>
                //     ),
                // },
                {
                    id: 'autoplay',
                    title: t('settings.autoplay'),
                    description: t('settings.autoplayDescription'),
                    keywords: ['autoplay', 'video', 'play', 'auto', 'tự động phát'],
                    render: (index: number, total: number) => (
                        <CustomSurface index={index} total={total} style={styles.option}>
                            <ControlField
                                isSelected={!disableAutoplay}
                                onSelectedChange={toggleDisableAutoplay}
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                                <View style={{ flex: 1 }}>
                                    <FlexText style={common.body}>{t('settings.autoplay')}</FlexText>
                                    <FlexText style={[common.bodySmall, { color: colors.muted }]}>{t('settings.autoplayDescription')}</FlexText>
                                </View>
                                <ControlField.Indicator />
                            </ControlField>
                        </CustomSurface>
                    ),
                },
            ],
        },
        {
            id: 'thirdPartyStorage',
            title: t('settings.thirdPartyStorage', 'Third-Party Cloud'),
            items: [
                {
                    id: 'thirdPartyCloud',
                    title: t('settings.thirdPartyStorage', 'Third-Party Cloud'),
                    description: imgbbApiKey || x02ApiKey ? t('settings.configured', 'Configured') : t('settings.notConfigured', 'ImgBB & x02.me API Keys'),
                    keywords: ['third party', 'cloud', 'imgbb', 'x02', 'api key', 'storage', 'upload', 'image', 'video', 'lưu trữ', 'đám mây'],
                    render: (index: number, total: number) => (
                        <CustomSurface
                            index={index}
                            total={total}
                            onPress={() => thirdPartySheetRef.current?.present()}
                            style={styles.option}
                        >
                            <View style={{ flex: 1 }}>
                                <FlexText style={[common.body]}>{t('settings.thirdPartyStorage', 'Third-Party Cloud')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>
                                    {imgbbApiKey || x02ApiKey ? t('settings.configured', 'Configured') : t('settings.notConfigured', 'ImgBB & x02.me API Keys')}
                                </FlexText>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                        </CustomSurface>
                    ),
                },
            ],
        },
        {
            id: 'storageCache',
            title: t('settings.storageCache'),
            items: [
                {
                    id: 'videoCacheInfo',
                    title: t('settings.videoCache'),
                    description: `${formatBytes(cacheSize)} / ${currentLimitLabel}`,
                    keywords: ['cache', 'video', 'storage', 'bytes', 'size', 'usage', 'bộ nhớ đệm'],
                    render: (index: number, total: number) => (
                        <CustomSurface index={index} total={total}>
                            <View style={styles.cacheInfoRow}>
                                <FlexText style={[common.body]}>{t('settings.videoCache')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>
                                    {formatBytes(cacheSize)} / {currentLimitLabel}
                                </FlexText>
                            </View>
                            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant, marginBottom: 8 }]}>
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
                        </CustomSurface>
                    ),
                },
                {
                    id: 'maxCacheSize',
                    title: t('settings.maxCacheSize'),
                    description: currentLimitLabel,
                    keywords: ['max cache', 'size limit', 'storage limit', 'giới hạn bộ nhớ'],
                    render: (index: number, total: number) => (
                        <CustomSurface index={index} total={total} style={{ padding: 0 }}>
                            <Select
                                value={{ value: videoCacheSizeLimit.toString(), label: currentLimitLabel }}
                                onValueChange={(opt: any) => handleSetCacheLimit(Number(opt.value))}
                                presentation="dialog"
                            >
                                <Select.Trigger variant="unstyled" asChild>
                                    <TouchableOpacity style={[styles.option, { padding: 16 }]}>
                                        <View>
                                            <FlexText style={[common.body]}>{t('settings.maxCacheSize')}</FlexText>
                                            <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>{currentLimitLabel}</FlexText>
                                        </View>
                                        <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                                    </TouchableOpacity>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Overlay />
                                    <Select.Content presentation="dialog" >
                                        {CACHE_SIZE_OPTIONS.map((option) => (
                                            <Select.Item key={option.value} value={option.value.toString()} label={option.label} />
                                        ))}
                                    </Select.Content>
                                </Select.Portal>
                            </Select>
                        </CustomSurface>
                    ),
                },
                {
                    id: 'clearCache',
                    title: isClearing ? t('settings.clearCacheClearing') : t('settings.clearCacheIdle'),
                    keywords: ['clear cache', 'clean', 'delete', 'remove cache', 'xóa bộ nhớ đệm'],
                    render: (index: number, total: number) => (
                        <CustomSurface
                            index={index}
                            total={total}
                            onPress={cacheSize === 0 ? undefined : handleClearCache}
                            style={styles.option}
                        >
                            <FlexText style={[common.body, { color: cacheSize === 0 ? colors.onSurfaceVariant : '#ff4444' }]}>
                                {isClearing ? t('settings.clearCacheClearing') : t('settings.clearCacheIdle')}
                            </FlexText>
                            {isClearing && <Spinner size="md" color={colors.onSurfaceVariant} />}
                        </CustomSurface>
                    ),
                },
            ],
        },
        {
            id: 'about',
            title: t('settings.about'),
            items: [
                {
                    id: 'aboutApp',
                    title: t('settings.aboutApp'),
                    description: t('settings.aboutAppDescription'),
                    keywords: ['about', 'app', 'version', 'info', 'runtime', 'giới thiệu', 'phiên bản'],
                    render: (index: number, total: number) => (
                        <CustomSurface
                            index={index}
                            total={total}
                            onPress={() => router.push('/about' as any)}
                            style={styles.option}
                        >
                            <View>
                                <FlexText style={[common.body]}>{t('settings.aboutApp')}</FlexText>
                                <FlexText style={[common.bodySmall, { color: colors.onSurfaceVariant }]}>{t('settings.aboutAppDescription')}</FlexText>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.onSurface} />
                        </CustomSurface>
                    ),
                },
            ],
        },
        {
            id: 'account',
            title: t('settings.account'),
            items: [
                {
                    id: 'switch_account',
                    title: t('settings.switchAccount', 'Switch / Manage Accounts'),
                    keywords: ['switch', 'account', 'multi', 'user', 'chuyển tài khoản'],
                    render: (index: number, total: number) => (
                        <CustomSurface
                            index={index}
                            total={total}
                            onPress={() => accountSwitcherRef.current?.present()}
                            style={styles.option}
                        >
                            <FlexText style={[common.body, { color: colors.onSurface }]}>
                                {t('settings.switchAccount', 'Switch / Manage Accounts')}
                            </FlexText>
                            <Ionicons name="people-outline" size={24} color={colors.onSurface} />
                        </CustomSurface>
                    ),
                },
                {
                    id: 'logout',
                    title: t('settings.logout'),
                    keywords: ['logout', 'sign out', 'exit', 'account', 'đăng xuất', 'tài khoản'],
                    render: (index: number, total: number) => (
                        <CustomSurface
                            index={index}
                            total={total}
                            onPress={async () => {
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
                            }}
                            style={styles.option}
                        >
                            <FlexText style={[common.body, { color: colors.onSurface }]}>{t('settings.logout')}</FlexText>
                            <Logout width={24} height={24} color={colors.onSurface} />
                        </CustomSurface>
                    ),
                },
            ],
        },
    ], [
        t, appLockEnabled, themePreferenceLabels, themePreference, languageMode, language,
        showSensitiveContent, toggleShowSensitiveContent, showCarousel, toggleCarousel,
        disableAutoplay, toggleDisableAutoplay, imgbbApiKey, x02ApiKey, cacheSize,
        currentLimitLabel, cacheCount, cacheUsagePercent, videoCacheSizeLimit,
        handleSetCacheLimit, isClearing, handleClearCache
    ]);

    const filteredSections = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return sections;

        return sections
            .map((section) => {
                const sectionTitleMatches = section.title.toLowerCase().includes(query);
                const matchingItems = section.items.filter((item) => {
                    if (sectionTitleMatches) return true;
                    const titleMatch = item.title.toLowerCase().includes(query);
                    const descMatch = item.description?.toLowerCase().includes(query);
                    const keywordMatch = item.keywords?.some((k) => k.toLowerCase().includes(query));
                    return titleMatch || descMatch || keywordMatch;
                });

                return {
                    ...section,
                    items: matchingItems,
                };
            })
            .filter((section) => section.items.length > 0);
    }, [sections, searchQuery]);

    return (
        <View style={common.screen}>
            <View style={{ position: 'absolute', top: inset.top + 16, left: 16, zIndex: 1000 }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: colors.surfaceContainerHigh,
                        borderRadius: 999,
                        width: 40,
                        height: 40,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    <Ionicons name='chevron-back' size={24} color={colors.onSurface} />
                </TouchableOpacity>
            </View>
            <KeyboardAvoidingView behavior="padding">
                <ScrollView style={common.screenPadding}>
                    <View style={{ marginTop: inset.top + 66 }}></View>
                    {filteredSections.map((section, sIndex) => (
                        <View key={section.id} style={{ marginTop: sIndex === 0 ? 0 : 24 }}>
                            <FlexText style={[styles.title]}>{section.title}</FlexText>
                            <View style={{ gap: 3 }}>
                                {section.items.map((item, iIndex) => (
                                    <React.Fragment key={item.id}>
                                        {item.render(iIndex, section.items.length)}
                                    </React.Fragment>
                                ))}
                            </View>
                        </View>
                    ))}

                    {filteredSections.length === 0 && (
                        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 }}>
                            <Ionicons name="search-outline" size={48} color={colors.onSurfaceVariant} />
                            <FlexText style={[common.body, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                                {t('settings.noResults', 'No settings found matching "{{query}}"', { query: searchQuery })}
                            </FlexText>
                        </View>
                    )}

                    {/* ─── Logging Out Modal ─────────────────────────────────── */}
                    <Modal
                        visible={isLoggingOut}
                        transparent
                        animationType="fade"
                        statusBarTranslucent
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Spinner size="lg" color={colors.onSurface} />
                                <FlexText style={[common.body, { color: colors.onSurface, marginTop: 12 }]}>{t('settings.loggingOut')}</FlexText>
                            </View>
                        </View>
                    </Modal>


                    <Dialog isOpen={isClearCacheDialogOpen} onOpenChange={setIsClearCacheDialogOpen}>
                        <Dialog.Portal>
                            <Dialog.Overlay style={{ backgroundColor: colors.scrim + "70" }} />
                            <Dialog.Content style={{ backgroundColor: colors.surfaceContainerHigh }} >
                                <View style={{ marginBottom: 20, gap: 6 }}>
                                    <Dialog.Title style={{ color: colors.onSurface }}>{t('settings.clearVideoCache')}</Dialog.Title>
                                    <Dialog.Description style={{ color: colors.onSurfaceVariant }}>
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
                    <View style={{ marginBottom: inset.bottom + 16 + 64 + 16 }}></View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Fade overlay from solid at the bottom to transparent at the top */}
            <LinearGradient
                colors={fadeColors as [string, string, ...string[]]}
                locations={fadeLocations as [number, number, ...number[]]}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: inset.bottom + 16 + (isFocused ? keyboardHeight : 0) + 48 + 24,
                    zIndex: 999,
                }}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                pointerEvents="none"
            />

            {/* Floating search bar */}
            <View
                style={{
                    position: "absolute",
                    left: 16,
                    right: 16,
                    bottom: inset.bottom + 16 + (isFocused ? keyboardHeight : 0),
                    zIndex: 1000,
                }}
            >
                <View style={[styles.searchBar, { marginBottom: 0 }]}>
                    <Input
                        variant="primary"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder=""
                        placeholderTextColor={colors.surfaceContainerHighest}
                        style={styles.searchInput}
                    />
                    {!searchQuery && !isFocused && (
                        <View style={styles.placeholderContainer} pointerEvents="none">
                            <Ionicons name='search' size={18} color={colors.onSurfaceVariant} />
                            <FlexText style={[common.body, { color: colors.onSurfaceVariant, marginLeft: 6 }]}>{t('settings.search')}</FlexText>
                        </View>
                    )}
                    {!!searchQuery && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery("")}
                            style={{ position: 'absolute', right: 16, height: 48, justifyContent: 'center' }}
                        >
                            <Ionicons name="close-circle" size={20} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Third-Party Cloud Bottom Sheet */}
            <TrueSheet
                ref={thirdPartySheetRef}
                name="third-party-cloud-sheet"
                detents={['auto']}
                backgroundColor={colors.surfaceContainer}
                grabberOptions={{
                    color: colors.onSurfaceVariant || "#C4C4C4",
                    height: 5,
                    width: 40,
                }}
                cornerRadius={32}
            >
                <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 16 }}>
                    <FlexText style={[common.title]}>{t('settings.thirdPartyStorage', 'Third-Party Cloud')}</FlexText>

                    {/* ImgBB API Key Input */}
                    <TextField>
                        <FlexText style={[common.body, { marginBottom: 8 }]}>ImgBB API Key</FlexText>
                        <Input
                            value={imgbbApiKey}
                            onChangeText={setImgbbApiKey}
                            variant="secondary"
                            placeholder="Enter ImgBB API Key"
                            placeholderTextColor={colors.onSurfaceVariant}
                            style={{
                                backgroundColor: colors.surfaceContainerHighest,
                                color: colors.onSurface,
                                fontSize: 14,
                                paddingHorizontal: 16,
                            }}
                        />
                    </TextField>
                    <FlexText style={[common.caption, { color: colors.onSurfaceVariant, marginTop: -8 }]}>
                        Required for image uploads.
                    </FlexText>

                    {/* x02.me API Key Input */}
                    <TextField>
                        <FlexText style={[common.body, { marginBottom: 8 }]}>x02.me API Key (Optional)</FlexText>
                        <Input
                            value={x02ApiKey}
                            onChangeText={setX02ApiKey}
                            variant="secondary"
                            placeholder="Enter x02.me API Key"
                            placeholderTextColor={colors.onSurfaceVariant}
                            style={{
                                backgroundColor: colors.surfaceContainerHighest,
                                color: colors.onSurface,
                                fontSize: 14,
                                paddingHorizontal: 16,
                            }}
                        />
                    </TextField>
                    <FlexText style={[common.caption, { color: colors.onSurfaceVariant, marginTop: -8 }]}>
                        Optional for video uploads. Used for file deletion hooks.
                    </FlexText>

                    <Button
                        variant="primary"
                        onPress={() => thirdPartySheetRef.current?.dismiss()}
                        style={{ marginTop: 8 }}
                    >
                        {t('settings.done', 'Done')}
                    </Button>
                </View>
            </TrueSheet>
            <AccountSwitcherSheet
                ref={accountSwitcherRef}
                onAccountSwitched={() => {
                    router.dismissAll();
                    router.replace("/");
                }}
            />
        </View>
    );
};

const style = (colors: ThemeColors, common: any) => StyleSheet.create({
    card: {
        backgroundColor: colors.surfaceContainer,
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
        backgroundColor: colors.outlineVariant,
        marginVertical: 8,
    },
    searchBar: {
        justifyContent: "center",
        position: 'relative',
    },
    searchInput: {
        color: colors.onSurface,
        fontSize: 16,
        paddingHorizontal: 16,
        textAlign: 'center',
        backgroundColor: colors.surfaceContainerHigh,
        borderRadius: 9999,
        height: 48,
        borderWidth: 0
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
        backgroundColor: colors.surfaceContainer,
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
        backgroundColor: colors.outlineVariant,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },

});

export default SettingsScreen;

