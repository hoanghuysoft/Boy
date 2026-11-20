import { Image, type ImageStyle } from "expo-image";
import * as React from "react";
import type { StyleProp } from "react-native";

interface IconProps {
    size?: number;
    color?: string;
    style?: StyleProp<ImageStyle>;
}

const LikeIcon = React.memo(({
    size = 48,
    color = "#FFF",
    style,
}: IconProps) => (
    <Image
        source={require("@/assets/images/icons/like.png")}
        style={[{ width: size, height: size, tintColor: color }, style]}
        contentFit="contain"
    />
));

LikeIcon.displayName = "LikeIcon";

export default LikeIcon;