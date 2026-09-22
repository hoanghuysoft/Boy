import { useSession } from "@/context/SessionContext";
import { useThemeContext } from "@/context/ThemeContext";
import { useScrollStore } from "@/stores/scroll";
import {
    GlassTabBar,
    GlassTabButton,
    TabBarMinimizeProvider,
    renderFadingTabScreen,
    type GlassTabItem,
} from "expo-glass-tabs";
import { Image } from "expo-image";
import { Redirect, usePathname, useRouter, useSegments } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

type TabItemConfig = GlassTabItem & { href: any };

export default function TabLayout() {
    const { session, hasProfile } = useSession();
    const { colors, theme } = useThemeContext();
    const { t } = useTranslation();
    const router = useRouter();
    const segments = useSegments();
    const pathname = usePathname();

    if (!session) {
        return <Redirect href="/login" />;
    }

    if (hasProfile === false) {
        return <Redirect href="/onboarding" />;
    }

    const tabTheme = {
        activeTint: colors.onSurface,
        inactiveTint: colors.onSurfaceVariant,
        highlight: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
        glassTint: theme === 'dark' ? 'rgba(10,10,12,0.65)' : 'rgba(255,255,255,0.65)',
        solidFallback: colors.surfaceContainerLow,
    };

    const ITEMS: TabItemConfig[] = [
        {
            name: 'index',
            href: '/',
            label: t('navigation.tabs.home'),
            renderIcon: ({ tint, size }) => <Image source={require("@/assets/images/tabIcons/home.png")} style={{ width: size, height: size, tintColor: tint }} />
        },
        {
            name: 'shots',
            href: '/shots',
            label: t('navigation.tabs.shots'),
            renderIcon: ({ tint, size }) => <Image source={require("@/assets/images/tabIcons/shots.png")} style={{ width: size, height: size, tintColor: tint }} />
        },
        {
            name: 'mansory',
            href: '/mansory',
            label: 'Masonry',
            renderIcon: ({ tint, size }) => <Image source={require("@/assets/images/tabIcons/masory.png")} style={{ width: size, height: size, tintColor: tint }} />
        },
        {
            name: 'profile',
            href: { pathname: '/profile', params: { isMe: true } },
            label: t('navigation.tabs.profile'),
            renderIcon: ({ tint, size }) => <Image source={require("@/assets/images/tabIcons/profile.png")} style={{ width: size, height: size, tintColor: tint }} />
        },
    ];

    const handleIndexSelected = useCallback(
        (index: number) => {
            const targetItem = ITEMS[index];
            if (!targetItem) return;

            const activeTabSegment = (segments as string[])[1] || 'index';
            const isCurrentTab =
                targetItem.name === activeTabSegment ||
                (targetItem.name === 'index' && (pathname === '/' || pathname === '')) ||
                (targetItem.name === 'shots' && pathname.startsWith('/shots')) ||
                (targetItem.name === 'mansory' && pathname.startsWith('/mansory')) ||
                (targetItem.name === 'profile' && pathname.startsWith('/profile'));

            if (isCurrentTab) {
                // Trigger scroll-to-top across registered scrollable screens
                useScrollStore.getState().triggerScrollToTop(targetItem.name);
                if (targetItem.name === "mansory") {
                    useScrollStore.getState().triggerScrollToTop("profile");
                }
            } else {
                router.navigate(targetItem.href);
            }
        },
        [segments, pathname, router]
    );

    return (
        <TabBarMinimizeProvider>
            <View style={{ flex: 1, backgroundColor: colors.surface, paddingBottom: 0 }}>
                <Tabs>
                    <TabSlot style={{ height: '100%' }} renderFn={renderFadingTabScreen} />
                    <TabList asChild>
                        <GlassTabBar
                            disableOverlay
                            theme={tabTheme}
                            onIndexSelected={handleIndexSelected}
                        >
                            {ITEMS.map(({ href, ...item }, index) => (
                                <TabTrigger key={item.name} name={item.name} href={href} asChild>
                                    <GlassTabButton item={item} index={index} />
                                </TabTrigger>
                            ))}
                        </GlassTabBar>
                    </TabList>
                </Tabs>
            </View>
        </TabBarMinimizeProvider>
    );
}


