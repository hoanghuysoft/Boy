import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface FProfileTabBarProps extends MaterialTopTabBarProps {
    fbColors: any;
}

const FProfileTabBar: React.FC<FProfileTabBarProps> = ({
    state,
    descriptors,
    navigation,
    fbColors,
}) => {
    return (
        <View style={[styles.container, { borderBottomColor: fbColors.divider }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={[
                                styles.tabButton,
                                {
                                    backgroundColor: isFocused
                                        ? fbColors.tabActiveBg
                                        : fbColors.tabInactiveBg,
                                },
                            ]}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    {
                                        color: isFocused
                                            ? fbColors.tabActiveText
                                            : fbColors.tabInactiveText,
                                    },
                                ]}
                            >
                                {typeof label === 'string' ? label : route.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderBottomWidth: 1,
        paddingBottom: 10,
        paddingTop: 4,
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 6,
    },
    tabButton: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 999,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default FProfileTabBar;
