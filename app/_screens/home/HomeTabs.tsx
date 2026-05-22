import { createMaterialTopTabNavigator } from "expo-router/build/react-navigation/material-top-tabs";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import CustomTopTabBar from "./CustomTopTabBar";
import FeedTab from "./FeedTab";

const Tab = createMaterialTopTabNavigator();

// Tab screen components
const FollowingTab = ({ onScroll, onOptionsPress, onLikeCountPress, onCommentPress, headerHeight }: any) => (
    <FeedTab
        feedType="latest"
        onScroll={onScroll}
        onOptionsPress={onOptionsPress}
        onLikeCountPress={onLikeCountPress}
        onCommentPress={onCommentPress}
        headerHeight={headerHeight}
    />
);

const LuckyTab = ({ onScroll, onOptionsPress, onLikeCountPress, onCommentPress, headerHeight }: any) => (
    <FeedTab
        feedType="lucky"
        onScroll={onScroll}
        onOptionsPress={onOptionsPress}
        onLikeCountPress={onLikeCountPress}
        onCommentPress={onCommentPress}
        headerHeight={headerHeight}
    />
);

const ThisDayTab = ({ onScroll, onOptionsPress, onLikeCountPress, onCommentPress, headerHeight }: any) => (
    <FeedTab
        feedType="this_day"
        onScroll={onScroll}
        onOptionsPress={onOptionsPress}
        onLikeCountPress={onLikeCountPress}
        onCommentPress={onCommentPress}
        headerHeight={headerHeight}
    />
);

interface HomeTabsProps {
    vm: any;
}

const HomeTabs = ({ vm }: HomeTabsProps) => {
    const { t } = useTranslation();

    return (
        <Tab.Navigator
            tabBar={(props) => (
                <View style={{ position: 'absolute', top: vm.insets.top + vm.headerHeight, left: 0, right: 0, zIndex: 99 }}>
                    <CustomTopTabBar
                        {...props}
                        tabBgOpacity={vm.pillBgOpacity}
                        tabOpacity={vm.tabOpacity}
                        iconColor={vm.iconColor}
                    />
                </View>
            )}
            screenOptions={{
                swipeEnabled: true,
                lazy: true,
                lazyPreloadDistance: 0,
                sceneStyle: { backgroundColor: 'transparent' },
            }}
            screenListeners={{
                state: vm.handleTabStateChange,
            }}
        >
            <Tab.Screen name="Following" options={{ title: t('home.tabs.following') }}>
                {() => (
                    <FollowingTab
                        onScroll={vm.onScroll}
                        onOptionsPress={vm.handlePostOptionsPress}
                        onLikeCountPress={vm.handleLikeCountPress}
                        onCommentPress={vm.handleCommentPress}
                        headerHeight={vm.totalHeaderHeight + vm.insets.top}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Lucky" options={{ title: t('home.tabs.lucky') }}>
                {() => (
                    <LuckyTab
                        onScroll={vm.onScroll}
                        onOptionsPress={vm.handlePostOptionsPress}
                        onLikeCountPress={vm.handleLikeCountPress}
                        onCommentPress={vm.handleCommentPress}
                        headerHeight={vm.totalHeaderHeight + vm.insets.top}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="This Day" options={{ title: t('home.tabs.thisDay') }}>
                {() => (
                    <ThisDayTab
                        onScroll={vm.onScroll}
                        onOptionsPress={vm.handlePostOptionsPress}
                        onLikeCountPress={vm.handleLikeCountPress}
                        onCommentPress={vm.handleCommentPress}
                        headerHeight={vm.totalHeaderHeight + vm.insets.top}
                    />
                )}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

export default HomeTabs;
