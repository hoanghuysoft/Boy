import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import FProfileAllTab from './FProfileAllTab';
import FProfileGroupsTab from './FProfileGroupsTab';
import FProfilePhotosTab from './FProfilePhotosTab';
import FProfileReelsTab from './FProfileReelsTab';
import FProfileTabBar from './FProfileTabBar';

const Tab = createMaterialTopTabNavigator();

interface FProfileTabsProps {
    vm: any;
}

const FProfileTabs: React.FC<FProfileTabsProps> = ({ vm }) => {
    return (
        <Tab.Navigator
            tabBar={(props) => (
                <FProfileTabBar {...props} fbColors={vm.fbColors} />
            )}
            screenOptions={{
                swipeEnabled: true,
                lazy: true,
                lazyPreloadDistance: 0,
                sceneStyle: { backgroundColor: 'transparent' },
            }}
        >
            <Tab.Screen name="All">
                {() => (
                    <FProfileAllTab
                        profile={vm.profile}
                        fbData={vm.fbData}
                        fbColors={vm.fbColors}
                        formatBirthday={vm.formatBirthday}
                        formatTimestamp={vm.formatTimestamp}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Reels">
                {() => (
                    <FProfileReelsTab
                        videos={vm.fbData.videos}
                        fbColors={vm.fbColors}
                        formatDuration={vm.formatDuration}
                        formatCount={vm.formatCount}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Photos">
                {() => (
                    <FProfilePhotosTab
                        photos={vm.fbData.photos}
                        fbColors={vm.fbColors}
                    />
                )}
            </Tab.Screen>
            <Tab.Screen name="Groups">
                {() => (
                    <FProfileGroupsTab
                        groups={vm.fbData.groups}
                        fbColors={vm.fbColors}
                        formatCount={vm.formatCount}
                    />
                )}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

export default FProfileTabs;
