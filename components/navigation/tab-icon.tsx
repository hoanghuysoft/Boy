import type { ITabIcon } from "@/interfaces/tab-icon.interface";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

const TabIcon: React.FC<ITabIcon> = ({
  render,
  x,
  slotWidth,
  pillCenter,
}: ITabIcon): React.ReactNode & React.ReactElement => {
  const activeStyle = useAnimatedStyle(() => {
    const d = Math.abs(pillCenter.value - x);
    return {
      opacity: interpolate(
        d,
        [0, slotWidth * 0.55],
        [1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            d,
            [0, slotWidth * 0.55],
            [1.08, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  }, Platform.OS === "web" ? [x, slotWidth] : undefined);

  const idleStyle = useAnimatedStyle(() => {
    const d = Math.abs(pillCenter.value - x);
    return {
      opacity: interpolate(
        d,
        [0, slotWidth * 0.55],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    };
  }, Platform.OS === "web" ? [x, slotWidth] : undefined);

  return (
    <View style={styles.iconStack}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.center, idleStyle]}
      >
        {render ? render(false) : null}
      </Animated.View>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.center, activeStyle]}
      >
        {render ? render(true) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  iconStack: {
    flex: 1,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export { TabIcon };

