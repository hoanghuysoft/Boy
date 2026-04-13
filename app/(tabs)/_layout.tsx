import { Redirect, Tabs } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { CustomTabBar } from "../../components/navigation/CustomTabBar";
import { useSession } from "../../context/SessionContext";

export default function TabLayout() {
    const { session, hasProfile } = useSession();
    const blurTargetRef = useRef<View | null>(null);
    const { t } = useTranslation();

    if (!session) {
        return <Redirect href="/login" />;
    }

    if (hasProfile === false) {
        return <Redirect href="/onboarding" />;
    }

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} blurTargetRef={blurTargetRef} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: t('navigation.tabs.home'), animation: 'none' }} />
            <Tabs.Screen name="shots" options={{ title: t('navigation.tabs.shots'), animation: 'none' }} />
            <Tabs.Screen name="tv" options={{ title: 'tvs', animation: 'none' }} />
            <Tabs.Screen
                name="profile"
                options={{ title: t('navigation.tabs.profile'), animation: 'none' }}
                initialParams={{ isMe: true }}
            />
            <Tabs.Screen name="chat" options={{ title: t('navigation.tabs.chat'), animation: 'none' }} />

        </Tabs>
    );
}
