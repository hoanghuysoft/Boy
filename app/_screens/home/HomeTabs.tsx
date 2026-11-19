import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import { TabView, type Route } from "react-native-tab-view";
import CustomTopTabBar from "./CustomTopTabBar";
import FeedTab from "./FeedTab";

type HomeTabRoute = Route & {
    key: "Following" | "Lucky" | "This Day";
    title: string;
};

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
    const { width: screenWidth } = useWindowDimensions();
    const [index, setIndex] = useState(0);

    const routes = useMemo<HomeTabRoute[]>(() => [
        { key: "Following", title: t('home.tabs.following') },
        { key: "Lucky", title: t('home.tabs.lucky') },
        { key: "This Day", title: t('home.tabs.thisDay') },
    ], [t]);

    const { handleTabStateChange } = vm;

    const handleIndexChange = useCallback((newIndex: number) => {
        setIndex(newIndex);
        handleTabStateChange();
    }, [handleTabStateChange]);

    const renderScene = useCallback(({ route }: { route: HomeTabRoute }) => {
        switch (route.key) {
            case "Following":
                return <FollowingTab />;
            case "Lucky":
                return <LuckyTab />;
            case "This Day":
                return <ThisDayTab />;
            default:
                return null;
        }
    }, []);

    // Memoize the custom tab bar render function to avoid recreating it on every render,
    // which causes the TabView to completely re-render its tab bar container.
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
            <TabView
                navigationState={{ index, routes }}
                onIndexChange={handleIndexChange}
                initialLayout={{ width: screenWidth }}
                renderTabBar={renderTabBar}
                renderScene={renderScene}
                swipeEnabled={true}
                lazy={true}
                lazyPreloadDistance={0}
                commonOptions={{
                    sceneStyle: { backgroundColor: 'transparent' },
                }}
            />
        </HomeContext.Provider>
    );
};

export default HomeTabs;
