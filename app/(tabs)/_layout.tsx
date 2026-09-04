import { useSession } from "@/context/SessionContext";
import {
    GlassTabBar,
    GlassTabButton,
    TabBarMinimizeProvider,
    renderFadingTabScreen,
    type GlassTabItem,
} from "expo-glass-tabs";
import { Image } from "expo-image";
import { Redirect, useRouter } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs } from "expo-router/ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useThemeContext } from "@/context/ThemeContext";

export default function TabLayout() {
    const { session, hasProfile } = useSession();
    const { colors, theme } = useThemeContext();
    const { t } = useTranslation();
    const router = useRouter();

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

    const ITEMS: (GlassTabItem & { href: any })[] = [
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

    return (
        <TabBarMinimizeProvider>
            <View style={{ flex: 1, backgroundColor: colors.surface, paddingBottom: 20 }}>
                <Tabs>
                    <TabSlot style={{ height: '100%' }} renderFn={renderFadingTabScreen} />
                    <TabList asChild>
                        <GlassTabBar theme={tabTheme} onIndexSelected={(i) => router.navigate(ITEMS[i].href)}>
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
