import React, { memo, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useThemeContext } from "../../context/ThemeContext";

export interface TabPillProps {
  name: string;
  isActive: boolean;
  onPress: () => void;
}

const TabPill: React.FC<TabPillProps> = memo(({ name, isActive, onPress }) => {
  const { colors } = useThemeContext();
  const style = styles(colors);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 7,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[style.tabPill, isActive && style.tabPillActive]}
        activeOpacity={1}
      >
        <Text style={[style.tabText, isActive && style.tabTextActive]}>
          {name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

TabPill.displayName = "TabPill";

const styles = (colors: any) =>
  StyleSheet.create({
    tabPill: {
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    tabPillActive: {
      backgroundColor: colors.card,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 11,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "400",
      color: colors.text,
      opacity: 0.6,
    },
    tabTextActive: {
      opacity: 1,
      fontWeight: "600",
    },
  });

export default TabPill;

