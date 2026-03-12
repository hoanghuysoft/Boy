import { Tabs } from "expo-router";
import React, { useRef } from "react";
import { View } from "react-native";
import { CustomTabBar } from "../../components/navigation/CustomTabBar";

export default function TabLayout() {
    const blurTargetRef = useRef<View | null>(null);

    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} blurTargetRef={blurTargetRef} />}
            screenOptions={{
                headerShown: false,
            }}
        >
                <Tabs.Screen name="index" options={{ title: 'Home', animation: 'none' }} />
                <Tabs.Screen name="shots" options={{ title: 'Shots', animation: 'none' }} />
                <Tabs.Screen name="chat" options={{ title: 'Chat', animation: 'none' }} />
                <Tabs.Screen
                    name="profile"
                    options={{ title: 'Profile', animation: 'none' }}
                    initialParams={{ isMe: true }}
                />
        </Tabs>
    );
}
