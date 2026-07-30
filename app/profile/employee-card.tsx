import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { FlexText } from '@/components/FlexText';
import { useThemeContext } from '@/context/ThemeContext';
import Ionicons from '@react-native-vector-icons/ionicons/static';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export default function EmployeeCardScreen() {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url: string }>();
  const { colors } = useThemeContext();

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const translateY = useSharedValue(0);

  const composedGesture = React.useMemo(() => {
    const panGesture = Gesture.Pan()
      .onUpdate((e) => {
        // Subtle 3D tilt
        tiltX.value = interpolate(e.translationY, [-200, 200], [15, -15], Extrapolation.CLAMP);
        tiltY.value = interpolate(e.translationX, [-200, 200], [-15, 15], Extrapolation.CLAMP);

        // Swing physics - precisely tracks finger
        const L = height / 2;
        rotateZ.value = -(Math.atan(e.translationX / L) * 180) / Math.PI; // Inverted for correct direction
        translateY.value = Math.max(-100, e.translationY * 0.4); // Pull resistance
      })
      .onEnd((e) => {
        tiltX.value = withSpring(0, { damping: 15 });
        tiltY.value = withSpring(0, { damping: 15 });

        rotateZ.value = withSpring(0, {
          velocity: e.velocityX / 10,
          damping: 10,
          stiffness: 80
        });
        translateY.value = withSpring(0, {
          velocity: e.velocityY,
          damping: 12,
          stiffness: 100
        });
      });

    const tapGesture = Gesture.Tap()
      .maxDuration(250)
      .onEnd(() => {
        const currentRot = Math.round(rotateY.value / 180) * 180;
        rotateY.value = withTiming(currentRot + 180, { duration: 500 });
      });

    return Gesture.Simultaneous(panGesture, tapGesture);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${tiltX.value}deg` },
        { rotateY: `${rotateY.value + tiltY.value}deg` },
      ],
    };
  });

  const pendulumStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: -height / 2 },
        { rotateZ: `${rotateZ.value}deg` },
        { translateY: height / 2 },
        { translateY: translateY.value },
      ],
    };
  });

  const frontStyle = useAnimatedStyle(() => {
    const totalRot = rotateY.value + tiltY.value;
    const isVisible = Math.abs(totalRot % 360) < 90 || Math.abs(totalRot % 360) > 270;
    return {
      position: 'absolute',
      width: '100%',
      height: '100%',
      zIndex: isVisible ? 1 : 0,
      opacity: isVisible ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const totalRot = rotateY.value + tiltY.value;
    const isVisible = Math.abs(totalRot % 360) >= 90 && Math.abs(totalRot % 360) <= 270;
    return {
      position: 'absolute',
      width: '100%',
      height: '100%',
      transform: [{ rotateY: '180deg' }],
      zIndex: isVisible ? 1 : 0,
      opacity: isVisible ? 1 : 0,
    };
  });

  return (
    <View style={styles.container}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={() => router.back()}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)' }]} />
        </TouchableWithoutFeedback>
      </BlurView>

      <View style={styles.content} pointerEvents="box-none">
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.pendulumContainer, pendulumStyle]} pointerEvents="box-none">
            {/* Strings */}
            <View style={styles.stringLeft} />
            <View style={styles.stringRight} />

            <Animated.View style={[styles.cardContainer, animatedStyle]}>
              {/* Back of the card */}
              <Animated.View style={[styles.card, backStyle, { backgroundColor: '#191919' }]}>
                <Image
                  source={require('@/assets/images/logo_head.png')}
                  style={{ width: 120, height: 120 }}
                  contentFit="contain"
                />
                <FlexText style={{ marginTop: 24, color: colors.onSurface, fontWeight: 'bold', fontSize: 32 }}>
                  WeLove
                </FlexText>
              </Animated.View>

              {/* Front of the card */}
              <Animated.View style={[styles.card, frontStyle]}>
                <Image
                  source={{ uri: url }}
                  style={{ width: '100%', height: '100%', borderRadius: 20 }}
                  contentFit="cover"
                />
              </Animated.View>

              {/* Hole for string */}
              <View style={styles.hole} />
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        <Ionicons name="close" size={32} color="white" style={styles.closeIcon} onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendulumContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stringLeft: {
    width: 2,
    backgroundColor: '#E0E0E0',
    position: 'absolute',
    top: -height,
    bottom: height / 2 + CARD_HEIGHT / 2 - 19,
    marginLeft: -10,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  stringRight: {
    width: 2,
    backgroundColor: '#E0E0E0',
    position: 'absolute',
    top: -height,
    bottom: height / 2 + CARD_HEIGHT / 2 - 19,
    marginLeft: 10,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hole: {
    position: 'absolute',
    top: 15,
    alignSelf: 'center',
    width: 25,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 2,
  },
  closeIcon: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
});
