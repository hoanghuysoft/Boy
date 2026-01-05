import { createStackNavigator } from "@react-navigation/stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { getCurrentSession } from "../../services/login";
import LoginScreen from "../screens/Login";
import ProfileScreen from "../screens/Profile";
import VideoPlayer from "../screens/VideoPlayer";
import HomeTabs from "./BottomTabs";

type RootStackParamList = {
    Login: undefined;
    MainTabs: undefined;
    VideoPlayer: undefined;
    ProfileStack: { id: string, isMe?: boolean };
};

const Stack = createStackNavigator<RootStackParamList>();

const StackScreens = () => {
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const session = await getCurrentSession();
                setInitialRoute(session ? "MainTabs" : "Login");
            } catch (e) {
                console.warn("Error checking Supabase session", e);
                setInitialRoute("Login");
            }
        };

        checkSession();
    }, []);

    if (!initialRoute) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="MainTabs" component={HomeTabs} />
            <Stack.Screen
                name="VideoPlayer"
                component={VideoPlayer}
            />
            <Stack.Screen name="ProfileStack" component={ProfileScreen} />   
        </Stack.Navigator>
    );
};

export default StackScreens;