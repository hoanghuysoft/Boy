import { createMaterialTopTabNavigator } from "expo-router/build/react-navigation/material-top-tabs";
import React, { createContext, useContext, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import CustomTopTabBar from "./CustomTopTabBar";
import FeedTab from "./FeedTab";

const Tab = createMaterialTopTabNavigator();

// Define a context to pass the ViewModel down to the tab screens statically.
// This prevents unmounting & remounting the tabs on every parent render caused by inline functions.
const HomeContext = createContext<any>(null);
const useHomeContext = () => useContext(HomeContext);

// Tab screen components using Context
const FollowingTab = () => {
    const vm = useHomeContext();
    return (
        <FeedTab
            feedType="latest"
            onScroll={vm.onScroll}
            onOptionsPress={vm.handlePostOptionsPress}
            onLikeCountPress={vm.handleLikeCountPress}
            onCommentPress={vm.handleCommentPress}
            headerHeight={vm.totalHeaderHeight + vm.insets.top}
        />
    );
};

const LuckyTab = () => {
    const vm = useHomeContext();
    return (
        <FeedTab
            feedType="lucky"
            onScroll={vm.onScroll}
            onOptionsPress={vm.handlePostOptionsPress}
            onLikeCountPress={vm.handleLikeCountPress}
            onCommentPress={vm.handleCommentPress}
            headerHeight={vm.totalHeaderHeight + vm.insets.top}
        />
    );
};

const ThisDayTab = () => {
    const vm = useHomeContext();
    return (
        <FeedTab
            feedType="this_day"
            onScroll={vm.onScroll}
            onOptionsPress={vm.handlePostOptionsPress}
            onLikeCountPress={vm.handleLikeCountPress}
            onCommentPress={vm.handleCommentPress}
            headerHeight={vm.totalHeaderHeight + vm.insets.top}
        />
    );
};

interface HomeTabsProps {
    vm: any;
}

const HomeTabs = ({ vm }: HomeTabsProps) => {
    const { t } = useTranslation();

    // Memoize the custom tab bar render function to avoid recreating it on every render,
    // which causes the MaterialTopTabNavigator to completely re-render its tab bar container.
    const renderTabBar = useCallback((props: any) => (
        <View style={{ position: 'absolute', top: vm.insets.top + vm.headerHeight, left: 0, right: 0, zIndex: 99 }}>
            <CustomTopTabBar
                {...props}
                tabBgOpacity={vm.pillBgOpacity}
                tabOpacity={vm.tabOpacity}
                iconColor={vm.iconColor}
            />
        </View>
    ), [vm.insets.top, vm.headerHeight, vm.pillBgOpacity, vm.tabOpacity, vm.iconColor]);

    return (
        <HomeContext.Provider value={vm}>
            <Tab.Navigator
                sceneContainerStyle={{ backgroundColor: 'transparent' }}
                tabBar={renderTabBar}
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
                <Tab.Screen
                    name="Following"
                    component={FollowingTab}
                    options={{ title: t('home.tabs.following') }}
                />
                <Tab.Screen
                    name="Lucky"
                    component={LuckyTab}
                    options={{ title: t('home.tabs.lucky') }}
                />
                <Tab.Screen
                    name="This Day"
                    component={ThisDayTab}
                    options={{ title: t('home.tabs.thisDay') }}
                />
            </Tab.Navigator>
        </HomeContext.Provider>
    );
};

export default HomeTabs;
