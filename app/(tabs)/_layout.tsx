import { Tabs } from "expo-router";
import React from "react";
import { CustomTabBar } from "../../components/navigation/CustomTabBar";

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: 'Home', animation: 'none' }} />
            <Tabs.Screen name="search" options={{ title: 'Search', animation: 'none' }} />
            <Tabs.Screen name="chat" options={{ title: 'Chat', animation: 'none' }} />
            <Tabs.Screen
                name="profile"
                options={{ title: 'Profile', animation: 'none' }}
                initialParams={{ isMe: true }}
            />
        </Tabs>
    );
}
