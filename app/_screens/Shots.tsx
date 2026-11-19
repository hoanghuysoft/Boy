import { ShotsFeedTab, ShotsTopTabBar } from "@/components/shots";
import {
    ReanimatedTrueSheetProvider,
} from "@lodev09/react-native-true-sheet/reanimated";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabView, type Route } from "react-native-tab-view";

// ─── Navigator ──────────────────────────────────────────────────────

type ShotTabRoute = Route & {
    key: "on_this_day" | "random";
};

const ShotsInner = () => {
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();
    const { t } = useTranslation();
    const [index, setIndex] = useState(1);

    const routes = useMemo<ShotTabRoute[]>(
        () => [{ key: "on_this_day" }, { key: "random" }],
        [],
    );

    return (
        <TabView
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            initialLayout={{ width: screenWidth }}
            lazy
            commonOptions={{
                sceneStyle: { backgroundColor: '#000' },
            }}
            renderTabBar={(props) => <ShotsTopTabBar {...props} insets={insets} t={t} />}
            renderScene={({ route }) =>
                route.key === "on_this_day" ? (
                    <ShotsFeedTab feedType="on_this_day" isTabFocused={index === 0} />
                ) : (
                    <ShotsFeedTab feedType="random" isTabFocused={index === 1} />
                )
            }
        />
    );
};

// ─── Main Shots Screen ──────────────────────────────────────────────
// Wrapped with ReanimatedTrueSheetProvider so that useReanimatedTrueSheet()
// inside ShotItem can read animatedPosition from the CommentsSheet.
const ShotsScreen = () => (
    <ReanimatedTrueSheetProvider>
        <ShotsInner />
    </ReanimatedTrueSheetProvider>
);

export default ShotsScreen;
