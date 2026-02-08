import { MaterialIcons } from "@expo/vector-icons";
import { PauseSolid, PlaySolid } from "@lineiconshq/free-icons";
import Lineicons from "@lineiconshq/react-native-lineicons";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, ViewStyle } from "react-native";

interface VideoPlaybackControlsProps {
    isLandscape: boolean;
    isPaused: boolean;
    isLoading: boolean;
    videoPressed: boolean;
    commonRowStyle: ViewStyle;
    onMoveBackward: () => void;
    onTogglePlayPause: () => void;
    onMoveForward: () => void;
}

export const VideoPlaybackControls: React.FC<VideoPlaybackControlsProps> = ({
    isLandscape,
    isPaused,
    isLoading,
    videoPressed,
    commonRowStyle,
    onMoveBackward,
    onTogglePlayPause,
    onMoveForward,
}) => {
    return (
        <View
            pointerEvents={videoPressed ? 'auto' : 'none'}
            style={[
                commonRowStyle,
                {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: isLandscape ? 64 : 48,
                },
            ]}
        >
            <TouchableOpacity onPress={onMoveBackward} style={styles.largeButton}>
                <MaterialIcons name="replay-5" size={32} color={'white'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onTogglePlayPause} style={styles.extraLargeButton}>
                {isLoading ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <Lineicons
                        icon={isPaused ? PlaySolid : PauseSolid}
                        size={50}
                        color={'white'}
                        strokeWidth={3}
                    />
                )}
            </TouchableOpacity>
            <TouchableOpacity onPress={onMoveForward} style={styles.largeButton}>
                <MaterialIcons name="forward-5" size={32} color={'white'} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    largeButton: {
        width: 64,
        height: 64,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    extraLargeButton: {
        width: 85,
        height: 85,
        borderRadius: 999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
