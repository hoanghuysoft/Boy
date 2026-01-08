import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface PlayIconProps extends SvgProps {
    size?: number;
    color?: string;
}

const PlayIcon = ({
    size = 24,
    color = "#000",
    ...props
}: PlayIconProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="5 3.3 17 17.4" // Tightened to the triangle's edges
        fill={color}
        {...props}
    >
        <Path d="M5 4.623V19.38a1.5 1.5 0 0 0 2.26 1.29L22 12 7.26 3.33A1.5 1.5 0 0 0 5 4.623Z" />
    </Svg>
)

export default PlayIcon;