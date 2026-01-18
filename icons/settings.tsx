import * as React from "react";
import { memo } from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

// Define the interface to allow size and color customization
interface SettingsIconProps extends SvgProps {
    size?: number;
    color?: string;
}

const Settings = ({
    size = 24,
    color = "#000",
    ...props
}: SettingsIconProps) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24" // Standardized viewBox for a 24x24 icon
        fill="none"
        {...props}
    >
        {/* Background Hexagon Shape */}
        <Path
            fill={color}
            fillRule="evenodd"
            d="M20.66 7 12 2 3.34 7v10L12 22l8.66-5V7ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            clipRule="evenodd"
            opacity={0.2} // Optional: makes the background fill lighter than the stroke
        />

        {/* Outer Border */}
        <Path
            stroke={color}
            strokeLinecap="square"
            strokeWidth={2}
            d="m12 2 8.66 5v10L12 22l-8.66-5V7L12 2Z"
        />

        {/* Inner Circle Border */}
        <Path
            stroke={color}
            strokeLinecap="square"
            strokeWidth={2}
            d="M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        />
    </Svg>
);

const SettingsIcon = memo(Settings);
export default SettingsIcon;