import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import PillSlider from "./PillSlider";
import { formatDuration } from "./videoPlayerStyles";

interface VideoProgress {
    currentTime: number;
    seekableDuration: number;
}

interface VideoBottomBarProps {
    isLandscape: boolean;
    isLooping: boolean;
    isPaused: boolean;
    name: string;
    caption: string;
    progress: VideoProgress;
    seekPosition: number | null;
    bottomBarTranslateY: Animated.Value;
    videoPressed: boolean;
    commonRowStyle: ViewStyle;
    commonBodySmallStyle: any;
    commonLabelStyle: any;
    onLoopToggle: () => void;
    onRotate: () => void;
    onSeek: (value: number) => void;
    onSlidingStart: () => void;
    onSlidingComplete: (value: number) => void;
}

export const VideoBottomBar: React.FC<VideoBottomBarProps> = ({
    isLandscape,
    isLooping,
    isPaused,
    name,
    caption,
    progress,
    seekPosition,
    bottomBarTranslateY,
    videoPressed,
    commonRowStyle,
    commonBodySmallStyle,
    commonLabelStyle,
    onLoopToggle,
    onRotate,
    onSeek,
    onSlidingStart,
    onSlidingComplete,
}) => {
    return (
        <Animated.View
            pointerEvents={videoPressed ? 'auto' : 'none'}
            style={{
                paddingBottom: isLandscape ? 30 : 16,
                paddingRight: isLandscape ? 32 : 0,
                transform: [{ translateY: bottomBarTranslateY }],
            }}
        >
            <View style={[commonRowStyle, { justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={{ flex: 1 }}>
                    <Text style={[commonBodySmallStyle, { color: 'white' }]}>{name}</Text>
                    {caption && (
                        <Text
                            style={{ marginBottom: 8, fontSize: 28, fontWeight: 'bold', color: 'white' }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {caption}
                        </Text>
                    )}
                </View>
                <View style={[commonRowStyle, { gap: 8 }]}>
                    <TouchableOpacity style={styles.smallButton} onPress={onLoopToggle}>
                        <MaterialCommunityIcons
                            name={isLooping ? "repeat-off" : "repeat"}
                            size={20}
                            color={'white'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.smallButton} onPress={onRotate}>
                        <MaterialCommunityIcons name={isLandscape ? "rotate-left" : "rotate-right"} size={24} color={'white'} />
                    </TouchableOpacity>
                </View>
            </View>

            <PillSlider
                minimumValue={0}
                maximumValue={progress.seekableDuration}
                value={progress.currentTime}
                onValueChange={onSeek}
                onSlidingStart={onSlidingStart}
                onSlidingComplete={onSlidingComplete}
                trackHeight={8}
                trackColor="rgba(255, 255, 255, 0.3)"
                progressColor="#FFFFFF"
            />
            <View style={[commonRowStyle, { justifyContent: 'space-between', marginTop: 8 }]}>
                <Text style={[commonLabelStyle, { color: 'white' }]}>
                    {formatDuration(seekPosition !== null ? seekPosition : progress.currentTime)}
                </Text>
                <Text style={[commonLabelStyle, { color: 'white' }]}>
                    {formatDuration(progress.seekableDuration)}
                </Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    smallButton: {
        width: 32,
        height: 32,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
