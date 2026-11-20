import { Image, type ImageStyle } from "expo-image";
import * as React from "react";
import type { StyleProp } from "react-native";

interface IconProps {
    size?: number;
    color?: string;
    style?: StyleProp<ImageStyle>;
}

const LikeSolidIcon = React.memo(({
    size = 48,
    color = "#FFF",
    style,
}: IconProps) => (
    <Image
        source={require("@/assets/images/icons/liked.png")}
        style={[{ width: size, height: size, tintColor: color }, style]}
        contentFit="contain"
    />
));

LikeSolidIcon.displayName = "LikeSolidIcon";

export default LikeSolidIcon;
